// ============================================================
// /functions/api/feedback.js  ->  POST /api/feedback
// ============================================================
// The sitewide floating feedback widget posts here. No auth required — it is
// open on every page. Stores one row per submission in the `feedback` D1 table.
//
//   POST { rating: 1-5 | null, message: string, email?: string, page?: string }
//   -> { ok: true }
//
// Same architectural shape as the Contact form (a Pages Function that validates
// input, degrades gracefully, and never 500s the page). The one difference is
// storage: Contact emails via Resend; feedback is written to D1. The table is
// self-healed here (CREATE TABLE IF NOT EXISTS) the way the Mira schema is, so
// it works whether or not migration 0009 has been run. Needs the D1 binding
// env.DB. If the DB isn't configured the endpoint returns a clean 503 and the
// widget shows a "try again soon" message.
// ============================================================

let feedbackSchemaEnsured = false;

async function ensureFeedbackTable(env) {
  if (feedbackSchemaEnsured || !env || !env.DB) return;
  try {
    await env.DB.prepare(
      "CREATE TABLE IF NOT EXISTS feedback (" +
        "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
        "rating INTEGER, " +
        "message TEXT, " +
        "email TEXT, " +
        "page TEXT, " +
        "created_at INTEGER NOT NULL)"
    ).run();
  } catch (e) { /* best-effort — a concurrent create is fine */ }
  feedbackSchemaEnsured = true;
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: { "Content-Type": "application/json" } });
}
function esc(s) {
  return String(s == null ? "" : s).replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
}

// Best-effort notification of a new submission, via the same Resend integration
// used for magic links and password resets. A mail failure never fails the
// submission — the row is already stored, which is the source of truth.
async function notify(env, { rating, message, email, page }) {
  if (!env.RESEND_API_KEY) return;
  const ratingLine = rating === null ? "— (no rating)" : rating + " / 5";
  const payload = {
    from: "The Art of Soulcraft <hello@artofsoulcraft.com>",
    to: ["hello@artofsoulcraft.com"],
    subject: "New Soulcraft feedback — " + ratingLine,
    text: "Rating: " + ratingLine + "\nEmail: " + (email || "(not provided)") +
          "\nPage: " + (page || "(unknown)") + "\n\n" + (message || "(no message)"),
    html: "<p><strong>Rating:</strong> " + esc(ratingLine) + "<br>" +
          "<strong>Email:</strong> " + esc(email || "(not provided)") + "<br>" +
          "<strong>Page:</strong> " + esc(page || "(unknown)") + "</p>" +
          "<p style=\"white-space:pre-wrap\">" + esc(message || "(no message)") + "</p>",
  };
  // If they left an address, replies go straight back to them.
  if (email) payload.reply_to = email;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e) { /* swallow — the row is already saved */ }
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) {
      // Not configured yet — fail gracefully so the widget can say "try later".
      return json({ error: "Feedback isn't available just now. Please try again soon." }, 503);
    }

    const body = await request.json().catch(() => ({}));

    // Rating is optional but, when present, must be an integer 1–5; anything
    // else is dropped to null rather than rejected.
    let rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) rating = null;

    const message = (body.message || "").trim();
    const email = (body.email || "").trim();
    const page = (body.page || "").trim().slice(0, 300);

    if (rating === null && !message) {
      return json({ error: "Please add a rating or a note." }, 400);
    }
    if (message.length > 5000) {
      return json({ error: "That note is a little long — please trim it." }, 400);
    }
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return json({ error: "That email address doesn't look right." }, 400);
    }

    await ensureFeedbackTable(env);
    await env.DB
      .prepare("INSERT INTO feedback (rating, message, email, page, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(rating, message || null, email || null, page || null, Math.floor(Date.now() / 1000))
      .run();

    // Store first (above), then notify — the email is a courtesy copy, not the record.
    await notify(env, { rating, message, email, page });

    return json({ ok: true });
  } catch (err) {
    return json({ error: "Server error", detail: err && err.message }, 500);
  }
}
