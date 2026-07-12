// ============================================================
// /functions/api/mira.js  ->  POST /api/mira
// ============================================================
// Mira's chat turn. Auth-gated + subscription-gated. Lazy-summarizes the prior
// session into memory, assembles the full system prompt, calls Anthropic with
// streaming, and passes a simplified SSE stream (data: {text} … data: {done})
// back to the browser while persisting both messages to D1.
//
//   POST { message, session_id }  ->  text/event-stream
//
// Needs: ANTHROPIC_API_KEY and the D1 binding env.DB.
// ============================================================

import { getSessionUser } from "./_auth.js";
import { ensureMiraSchema } from "../mira/_schema.js";
import { assembleMiraSystem } from "../mira/_prompt.js";

// Static instruction for the summarizer — kept as its own constant so it can be
// sent as a cache_control'd block (static-first). It's short (well under the
// per-block cache minimum), so caching is effectively a no-op today, but the
// structure is correct and future-proof if the instruction ever grows.
const SUMMARY_INSTRUCTION = "Summarize this reflection session in 3–5 sentences for a companion's memory: name what the person brought, which archetypal voices were discussed, any realization reached, anything to follow up on. Third person, factual, warm.";

const CHAT_MODEL = "claude-sonnet-4-6";              // per Session-3 handoff
const SUMMARY_MODEL = "claude-haiku-4-5-20251001";   // per Session-3 handoff
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const HISTORY_CAP = 20;

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: { "Content-Type": "application/json" } });
}

async function anthropic(env, body) {
  return fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": ANTHROPIC_VERSION,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

// Lazy summarization: when a brand-new session begins, fold the most recent
// PRIOR session that has no summary yet into mira_summaries. Best-effort — never
// throws into the chat path.
async function lazySummarize(env, userId, sessionId) {
  try {
    const already = await env.DB
      .prepare("SELECT COUNT(*) AS n FROM mira_messages WHERE user_id = ? AND session_id = ?")
      .bind(userId, sessionId).first();
    if (already && Number(already.n) > 0) return; // not a fresh session

    const prior = await env.DB
      .prepare(
        `SELECT session_id FROM mira_messages
          WHERE user_id = ? AND session_id != ?
            AND session_id NOT IN (SELECT session_id FROM mira_summaries WHERE user_id = ?)
          ORDER BY id DESC LIMIT 1`
      )
      .bind(userId, sessionId, userId).first();
    if (!prior || !prior.session_id) return;

    const msgs = await env.DB
      .prepare("SELECT role, content FROM mira_messages WHERE user_id = ? AND session_id = ? ORDER BY id ASC")
      .bind(userId, prior.session_id).all();
    const rows = (msgs && msgs.results) || [];
    if (!rows.length) return;

    const transcript = rows.map((m) => (m.role === "assistant" ? "Mira" : "Person") + ": " + m.content).join("\n");
    if (!env.ANTHROPIC_API_KEY) return;
    const res = await anthropic(env, {
      model: SUMMARY_MODEL,
      max_tokens: 300,
      messages: [{
        role: "user",
        content: [
          // Static instruction first, marked cacheable; the dynamic transcript after.
          { type: "text", text: SUMMARY_INSTRUCTION, cache_control: { type: "ephemeral" } },
          { type: "text", text: transcript },
        ],
      }],
    });
    if (!res.ok) return;
    const data = await res.json().catch(() => null);
    const summary = data && data.content && data.content[0] && data.content[0].text;
    if (summary) {
      await env.DB
        .prepare("INSERT INTO mira_summaries (user_id, session_id, summary) VALUES (?, ?, ?)")
        .bind(userId, prior.session_id, summary.trim()).run();
    }
  } catch (e) { /* summarization must never block chat */ }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    if (!env.DB) return json({ error: "Database isn't configured." }, 500);

    const user = await getSessionUser(request, env);
    if (!user) return json({ error: "Please log in." }, 401);
    if (!user.companion_active) return json({ reason: "subscription", error: "Mira is a subscriber companion." }, 403);
    if (!env.ANTHROPIC_API_KEY) return json({ error: "Mira isn't configured yet." }, 503);

    await ensureMiraSchema(env);

    const body = await request.json().catch(() => ({}));
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const sessionId = typeof body.session_id === "string" && body.session_id ? body.session_id : null;
    if (!message) return json({ error: "Empty message." }, 400);
    if (!sessionId) return json({ error: "Missing session_id." }, 400);
    if (message.length > 6000) return json({ error: "That message is too long." }, 400);

    // Fold the prior session into memory before we assemble the prompt.
    await lazySummarize(env, user.id, sessionId);

    // Persist the user's message, then load this session's recent history (asc).
    await env.DB
      .prepare("INSERT INTO mira_messages (user_id, session_id, role, content) VALUES (?, ?, 'user', ?)")
      .bind(user.id, sessionId, message).run();

    const hist = await env.DB
      .prepare("SELECT role, content FROM mira_messages WHERE user_id = ? AND session_id = ? ORDER BY id DESC LIMIT ?")
      .bind(user.id, sessionId, HISTORY_CAP).all();
    const messages = ((hist && hist.results) || [])
      .slice().reverse()
      .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));

    // System as [static (cache_control ephemeral), dynamic] blocks — static-first
    // so Anthropic's prompt cache lands on the large, unchanging framework prefix.
    const system = await assembleMiraSystem(env, user.id, user.email);

    const upstream = await anthropic(env, {
      model: CHAT_MODEL,
      max_tokens: 600,
      stream: true,
      system: system,
      messages: messages,
    });
    if (!upstream.ok || !upstream.body) {
      const detail = await upstream.text().catch(() => "");
      return json({ error: "Mira couldn't respond just now.", detail: detail.slice(0, 300) }, 502);
    }

    // Transform Anthropic's SSE into a simple {text} / {done} SSE, while
    // accumulating the full reply to persist when the stream closes.
    const { readable, writable } = new TransformStream();
    const enc = new TextEncoder();

    const pump = (async () => {
      const writer = writable.getWriter();
      let assistantText = "";
      try {
        const reader = upstream.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let nl;
          while ((nl = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, nl).trim();
            buf = buf.slice(nl + 1);
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const ev = JSON.parse(payload);
              if (ev.type === "content_block_delta" && ev.delta && ev.delta.type === "text_delta") {
                assistantText += ev.delta.text;
                await writer.write(enc.encode("data: " + JSON.stringify({ text: ev.delta.text }) + "\n\n"));
              }
            } catch (e) { /* ignore non-JSON keepalives */ }
          }
        }
        await writer.write(enc.encode("data: " + JSON.stringify({ done: true }) + "\n\n"));
      } catch (e) {
        try { await writer.write(enc.encode("data: " + JSON.stringify({ error: true }) + "\n\n")); } catch (e2) {}
      } finally {
        try { await writer.close(); } catch (e) {}
      }
      // Persist Mira's completed reply.
      if (assistantText) {
        try {
          await env.DB
            .prepare("INSERT INTO mira_messages (user_id, session_id, role, content) VALUES (?, ?, 'assistant', ?)")
            .bind(user.id, sessionId, assistantText).run();
        } catch (e) { /* best-effort */ }
      }
    })();

    if (context.waitUntil) context.waitUntil(pump);

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });
  } catch (err) {
    console.error("mira failed:", err && (err.stack || err.message));
    return json({ error: "Server error", detail: err && err.message }, 500);
  }
}
