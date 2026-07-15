// ============================================================
// /functions/api/contact.js
// ============================================================
// Contact / "Work with us" form → stored in D1 AND emailed to Marc via Resend.
//
// The submission is CAPTURED FIRST in the D1 `contacts` table (self-healing
// schema), so it's never lost and is visible in the admin dashboard's Contact
// drill-down. The notification email via Resend is best-effort on top: if
// RESEND_API_KEY (a Resend API key, plus a verified sender domain matching FROM)
// isn't configured yet, the form still succeeds on the stored copy — it only
// fails if BOTH the store and the email fail.
// ============================================================

const RECIPIENT = "marcgsimmons@gmail.com";            // temporary; can move to a branded inbox later
const FROM = "The Art of Soulcraft <hello@artofsoulcraft.com>"; // must be a Resend-verified sender

function esc(s) {
  return String(s == null ? "" : s).replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
}
function json(obj, status) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: { "Content-Type": "application/json" } });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = (body.name || "").trim();
    const email = (body.email || "").trim();
    const message = (body.message || "").trim();

    if (!name || !email || !message) {
      return json({ error: "Please fill in your name, email, and a message." }, 400);
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return json({ error: "That email address doesn't look right." }, 400);
    }
    if (message.length > 5000) {
      return json({ error: "That message is a little long — please trim it." }, 400);
    }

    // --- 1) Capture in D1 first (self-healing schema) — the durable copy. ---
    let stored = false;
    if (env.DB) {
      try {
        await env.DB.prepare(
          "CREATE TABLE IF NOT EXISTS contacts (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, message TEXT, created_at INTEGER NOT NULL)"
        ).run();
        await env.DB.prepare(
          "INSERT INTO contacts (name, email, message, created_at) VALUES (?, ?, ?, ?)"
        ).bind(name, email, message, Math.floor(Date.now() / 1000)).run();
        stored = true;
      } catch (e) { stored = false; }
    }

    // --- 2) Notification email via Resend — best-effort on top of the store. ---
    let emailed = false;
    if (env.RESEND_API_KEY) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Authorization": "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: FROM,
            to: [RECIPIENT],
            // Marc's reply goes straight back to the person who wrote in.
            reply_to: email,
            subject: "New message from Soulcraft — " + name,
            text: "Name: " + name + "\nEmail: " + email + "\n\n" + message,
            html: "<p><strong>Name:</strong> " + esc(name) + "<br><strong>Email:</strong> " + esc(email) +
                  "</p><p style=\"white-space:pre-wrap\">" + esc(message) + "</p>",
          }),
        });
        emailed = res.ok;
      } catch (e) { emailed = false; }
    }

    // The message is safely captured if either path worked. Only when BOTH fail
    // (no DB binding AND no/failed email) do we ask the person to try again.
    if (stored || emailed) return json({ ok: true });
    return json({ error: "Couldn't send your message just now — please try again." }, 502);
  } catch (err) {
    return json({ error: "Server error", detail: err.message }, 500);
  }
}
