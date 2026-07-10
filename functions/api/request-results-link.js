// ============================================================
// /functions/api/request-results-link.js
// ============================================================
// The "My Results" front door: someone enters their email on
// /my-results/ and we email them a magic link back to whatever
// they've saved. The token maps to the USER, so the one link
// opens every result they've saved (the /results page shows a
// picker if there's more than one).
//
// Unlike a password-reset flow, this endpoint DOES reveal whether
// an email has saved results — that's a deliberate product choice
// (per the spec): a "we don't have results for that email" message
// is more helpful than a silent non-answer for a low-stakes,
// self-reflection tool. Requires the D1 binding `DB` and, to
// actually send, RESEND_API_KEY.
// ============================================================

function longToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
function json(obj, status) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: { "Content-Type": "application/json" } });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = (body.email || "").trim().toLowerCase();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return json({ error: "Please enter a valid email address." }, 400);
    }

    const user = await env.DB
      .prepare("SELECT id FROM users WHERE email = ?")
      .bind(email)
      .first();

    // No account, or an account with no saved results → tell them plainly.
    if (!user) return json({ ok: true, found: false });
    const anyResult = await env.DB
      .prepare("SELECT id FROM results WHERE user_id = ? LIMIT 1")
      .bind(user.id)
      .first();
    if (!anyResult) return json({ ok: true, found: false });

    const now = Math.floor(Date.now() / 1000);
    const token = longToken();
    const expiresAt = now + 60 * 60 * 24 * 365 * 100; // ~100 years — tokens never expire
    await env.DB
      .prepare("INSERT INTO magic_links (token, user_id, expires_at, used) VALUES (?, ?, ?, 0)")
      .bind(token, user.id, expiresAt)
      .run();

    const linkUrl = "https://artofsoulcraft.com/results?token=" + token;

    if (!env.RESEND_API_KEY) {
      // Found results, but email isn't configured yet — still report found so the
      // page shows the right message; flag that nothing actually went out.
      return json({ ok: true, found: true, emailSent: false });
    }

    let emailSent = false;
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "The Art of Soulcraft <hello@artofsoulcraft.com>",
          to: [email],
          subject: "Your Art of Soulcraft results",
          text: "Here's your link back to Your Mandala — it doesn't expire, so keep it anywhere:\n\n" + linkUrl + "\n\nThe Art of Soulcraft · artofsoulcraft.com",
          html: "<p>Here's your link back to Your Mandala — it doesn't expire, so keep it anywhere:</p>" +
                "<p><a href=\"" + linkUrl + "\">" + linkUrl + "</a></p>" +
                "<p style=\"color:#8a86a0;font-size:13px\">The Art of Soulcraft · artofsoulcraft.com</p>",
        }),
      });
      emailSent = res.ok;
    } catch (e) {
      emailSent = false;
    }

    return json({ ok: true, found: true, emailSent: emailSent });
  } catch (err) {
    return json({ error: "Server error", detail: err.message }, 500);
  }
}
