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
import { ensureMiraSchema, miraAccess } from "../mira/_schema.js";
import { assembleMiraSystem } from "../mira/_prompt.js";
import { detectCrisis } from "../mira/_crisis.js";
import { detectPatterns, patternNote, getPatternEntry, formatEntry } from "../mira/_patterns.js";

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

// ---- Name capture (Session 5b) ---------------------------------------------
// When Mira learns what to call someone she emits a silent ⟦remember-name: …⟧
// marker (see _prompt.js). The server strips it from the outgoing stream — the
// person never sees the brackets — and persists the name to users.display_name.
const OPEN = "⟦", CLOSE = "⟧";                  // ⟦ ⟧
const NAME_MARKER_G = /⟦\s*remember-name:\s*([^⟧]*?)\s*⟧/g;
const SUGGEST_MARKER_G = /⟦\s*suggest:\s*([^⟧]*?)\s*⟧/g;
// Strip ANY complete ⟦…⟧ marker from visible text — so a new marker type can
// never leak just because it isn't the name marker.
const ANY_MARKER_G = /⟦[^⟧]*⟧/g;

function cleanName(v) {
  if (typeof v !== "string") return null;
  const s = v.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/["']/g, "").replace(/\s+/g, " ").trim().slice(0, 40);
  return s || null;
}
function extractName(raw) {
  NAME_MARKER_G.lastIndex = 0;
  const m = NAME_MARKER_G.exec(raw);
  return m ? cleanName(m[1]) : null;
}
// Parse the ⟦suggest: …⟧ marker into 1–2 clean, length-capped follow-up
// questions (pipe-separated in the marker). Returns [] when absent or empty.
function extractSuggestions(raw) {
  SUGGEST_MARKER_G.lastIndex = 0;
  const m = SUGGEST_MARKER_G.exec(raw);
  if (!m) return [];
  return m[1].split("|")
    .map((s) => s.replace(/["']/g, "").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s.slice(0, 160));
}
// The prefix of `raw` that is SAFE to emit now: everything except a trailing,
// still-unclosed "⟦…" fragment (which might turn into a marker), with any
// COMPLETE markers already removed.
function safeCleanedPrefix(raw) {
  const lastOpen = raw.lastIndexOf(OPEN);
  const holdFrom = (lastOpen >= 0 && raw.indexOf(CLOSE, lastOpen) === -1) ? lastOpen : raw.length;
  return raw.slice(0, holdFrom).replace(ANY_MARKER_G, "");
}
// Final cleanup: strip complete markers, drop any leftover unclosed fragment.
function stripMarkers(raw) {
  let out = raw.replace(ANY_MARKER_G, "");
  const lastOpen = out.lastIndexOf(OPEN);
  if (lastOpen >= 0 && out.indexOf(CLOSE, lastOpen) === -1) out = out.slice(0, lastOpen);
  return out;
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
    if (!env.ANTHROPIC_API_KEY) return json({ error: "Mira isn't configured yet." }, 503);

    await ensureMiraSchema(env);

    // Access = a live subscription OR an unexpired 30-day trial (Session 3.2).
    const access = await miraAccess(env, user.id);
    if (!access.has_access) {
      return json({ reason: "subscription", error: "Mira is a subscriber companion." }, 403);
    }

    const body = await request.json().catch(() => ({}));
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const sessionId = typeof body.session_id === "string" && body.session_id ? body.session_id : null;
    if (!message) return json({ error: "Empty message." }, 400);
    if (!sessionId) return json({ error: "Missing session_id." }, 400);
    if (message.length > 6000) return json({ error: "That message is too long." }, 400);

    // Deterministic crisis layer: independent of Mira's generated reply. If this
    // fires, we tell the client to raise the crisis UI (988) up front — Mira still
    // replies (her prompt handles it too), this is the guaranteed backstop.
    const crisis = detectCrisis(message);

    // Protective-pattern recognition (R-33/R-40): a second deterministic pass,
    // like the crisis layer. Returns candidate patterns (0/1/many) from the Atlas
    // index — never asserts one. A single confident match is treated as confirmed
    // and pulls that one full entry (stage 2); multiple matches inject only a
    // lightweight disambiguation note (stage 1). Best-effort; never blocks a reply.
    let patternCandidates = [];
    try { patternCandidates = detectPatterns(message); } catch (e) { patternCandidates = []; }

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

    // Two-stage protective-pattern context (this turn only, never cached/persisted):
    //  - exactly one candidate → pull that one full entry (stage 2)
    //  - several candidates    → inject only the lightweight disambiguation note (stage 1)
    try {
      if (patternCandidates.length === 1) {
        const entry = await getPatternEntry(patternCandidates[0].id);
        const block = entry ? formatEntry(entry) : patternNote(patternCandidates);
        if (block) system.push({ type: "text", text: block });
      } else if (patternCandidates.length > 1) {
        const block = patternNote(patternCandidates);
        if (block) system.push({ type: "text", text: block });
      }
    } catch (e) { /* best-effort; pattern context never blocks a reply */ }

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
      // `raw` accumulates Mira's full reply (markers included); we only ever
      // emit the marker-stripped, safe prefix, so the ⟦remember-name⟧ note never
      // reaches the client.
      let raw = "", sentLen = 0;
      try {
        // Raise the crisis flag first, before any of Mira's text — so the client
        // shows the 988 UI immediately, independent of what she goes on to say.
        if (crisis) {
          await writer.write(enc.encode("data: " + JSON.stringify({ crisis: true }) + "\n\n"));
        }
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
                raw += ev.delta.text;
                const cleaned = safeCleanedPrefix(raw);
                if (cleaned.length > sentLen) {
                  await writer.write(enc.encode("data: " + JSON.stringify({ text: cleaned.slice(sentLen) }) + "\n\n"));
                  sentLen = cleaned.length;
                }
              }
            } catch (e) { /* ignore non-JSON keepalives */ }
          }
        }
        // Flush anything held back behind a marker boundary (now that the reply
        // is complete, all markers are closed).
        const finalClean = stripMarkers(raw);
        if (finalClean.length > sentLen) {
          await writer.write(enc.encode("data: " + JSON.stringify({ text: finalClean.slice(sentLen) }) + "\n\n"));
        }
        // Content-aware follow-up chips, parsed from Mira's own reply (no extra
        // API call). Empty array when she emitted none, or the marker got cut off
        // by the token limit — the client simply shows no chips in that case.
        const suggestions = extractSuggestions(raw);
        await writer.write(enc.encode("data: " + JSON.stringify({ done: true, suggestions }) + "\n\n"));
      } catch (e) {
        try { await writer.write(enc.encode("data: " + JSON.stringify({ error: true }) + "\n\n")); } catch (e2) {}
      } finally {
        try { await writer.close(); } catch (e) {}
      }
      // Persist Mira's completed reply — the CLEANED text, so the marker never
      // lands in history or a future summary.
      const assistantText = stripMarkers(raw).replace(/\s+$/, "");
      if (assistantText) {
        try {
          await env.DB
            .prepare("INSERT INTO mira_messages (user_id, session_id, role, content) VALUES (?, ?, 'assistant', ?)")
            .bind(user.id, sessionId, assistantText).run();
        } catch (e) { /* best-effort */ }
      }
      // If Mira learned their name, remember it — but never overwrite one already set.
      const learnedName = extractName(raw);
      if (learnedName) {
        try {
          await env.DB
            .prepare("UPDATE users SET display_name = ? WHERE id = ? AND (display_name IS NULL OR display_name = '')")
            .bind(learnedName, user.id).run();
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
