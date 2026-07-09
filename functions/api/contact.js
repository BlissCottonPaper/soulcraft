// ============================================================
// /functions/api/contact.js
// ============================================================
// Contact / "Work with us" form → email to Marc via Resend.
//
// Requires two things configured in the Cloudflare Pages project
// (Settings → Environment variables / bindings), NOT yet set up:
//   • RESEND_API_KEY — a Resend API key (secret)
//   • a verified sender domain in Resend matching FROM below
// Until RESEND_API_KEY exists the endpoint returns a clean 503 and the
// form shows a "try again later" message — it never 500s the page.
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

    if (!env.RESEND_API_KEY) {
      // Not configured yet — fail gracefully so the form can say "try later".
      return json({ error: "The contact form isn't live just yet. Please try again soon." }, 503);
    }

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

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return json({ error: "Couldn't send your message just now — please try again.", detail: detail.slice(0, 300) }, 502);
    }
    return json({ ok: true });
  } catch (err) {
    return json({ error: "Server error", detail: err.message }, 500);
  }
}
