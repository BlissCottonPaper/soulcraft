// ============================================================
// /functions/api/support.js  ->  POST /api/support
// ============================================================
// The Support page form → email to the team inbox via Resend. Distinct from
// /api/contact ("Work with us") in two ways: it carries a SUBJECT field, and it
// is addressed to the support inbox (hello@artofsoulcraft.com) rather than the
// personal one. Replies go straight back to whoever wrote in (reply_to).
//
// Requires RESEND_API_KEY (already used by the contact form and results emails)
// and the verified sender domain in Resend. Until the key exists the endpoint
// returns a clean 503 and the form shows a "try again later" message.
// ============================================================

const RECIPIENT = "hello@artofsoulcraft.com";                   // support inbox
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
    const subject = (body.subject || "").trim();
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

    if (!env.RESEND_API_KEY) {
      return json({ error: "The support form isn't live just yet. Please email hello@artofsoulcraft.com directly." }, 503);
    }

    const subjectLine = subject
      ? "Support — " + subject
      : "Support message from " + name;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [RECIPIENT],
        reply_to: email,
        subject: subjectLine,
        text: "Name: " + name + "\nEmail: " + email + "\nSubject: " + (subject || "(none)") + "\n\n" + message,
        html: "<p><strong>Name:</strong> " + esc(name) + "<br><strong>Email:</strong> " + esc(email) +
              "<br><strong>Subject:</strong> " + esc(subject || "(none)") +
              "</p><p style=\"white-space:pre-wrap\">" + esc(message) + "</p>",
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return json({ error: "Couldn't send your message just now — please try again.", detail: detail.slice(0, 300) }, 502);
    }
    return json({ ok: true });
  } catch (err) {
    return json({ error: "Server error", detail: err.message }, 500);
  }
}
