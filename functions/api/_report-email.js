// ============================================================
// /functions/api/_report-email.js   (shared helper — not a route; the leading
// underscore keeps Cloudflare Pages from mapping it to a URL)
// ============================================================
// Builds "Email 2": the full-reading report a user gets when they save results
// with their email. See save-results.js for where it's sent (alongside the
// existing magic-link email).
//
// WHY HTML, NOT A PDF ATTACHMENT (design decision, per the task's fallback
// clause): the report is a styled, multi-page HTML/CSS layout rendered by React
// in the browser. Faithfully turning that into a PDF needs a real rendering
// engine — headless Chrome / Puppeteer — which does NOT run in the Cloudflare
// Workers/Pages edge runtime. Pure-JS, edge-compatible PDF libraries (pdf-lib,
// jsPDF) can only draw primitives; they can't reproduce the print layout without
// re-implementing every page by hand, and the result wouldn't match what the
// user prints. So we send the same report content as a clean, self-contained
// HTML email built from the exact values the on-screen/print report uses. If a
// headless-render service is added later, this is the seam to swap for a PDF.
//
// The report content is passed in from the client (which already computes it for
// the on-screen reading); every value is HTML-escaped here before templating.
// ============================================================

// Fixed copy — identical for every reader, so it lives server-side.
const INTEGRATION_QUESTIONS = [
  "Where are you on the Bandwidth scale right now — not in general, but this week?",
  "Which shadow archetype are you most triggered by in others right now? That's where the energy is.",
  "What's one practice you'll do this week — specifically the most uncomfortable one?",
  "Who in your life embodies your growth edge? What do you feel around them?",
  "Which Core Human Need is most depleted right now? What's one concrete action?",
];

const SHADOW_INTRO =
  "Your shadow isn't what's wrong with you — it's what you haven't claimed yet. The archetypes at the bottom of your ranking are the energies that weren't safe to express where you formed. You didn't choose your shadow; integrating it doesn't diminish you, it completes you.";

const CLOSING_LINE = "For reflection and action, never prediction. — The Art of Soulcraft";
const RETURN_URL = "https://artofsoulcraft.com/?return=mandala";

const BANDWIDTH_LABELS = ["Devolved", "Descended", "Base", "Ascended", "Transcendent"];

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// One archetype card: name, longing, and the five-stage Bandwidth ladder
// (Base emphasized — the everyday gear), mirroring the print report's ladder.
function archetypeBlock(a) {
  const stages = Array.isArray(a.stages) ? a.stages : [];
  // Print report shows the ladder high→low (Transcendent first). stages[] is
  // stored low→high (index 0 = Devolved), so walk it in reverse.
  const rows = [4, 3, 2, 1, 0]
    .filter((st) => stages[st])
    .map((st) => {
      const emph = st === 2; // Base — the default gear
      return (
        '<tr><td style="padding:1px 0;font:' +
        (emph ? "600 " : "400 ") +
        '13px/1.4 Georgia,\'Times New Roman\',serif;color:' +
        (emph ? "#2a2340" : "#6b6580") +
        '"><span style="display:inline-block;width:96px;font:600 10px/1.4 Arial,sans-serif;letter-spacing:.06em;color:#9a94aa;text-transform:uppercase;vertical-align:top">' +
        esc(BANDWIDTH_LABELS[st]) +
        "</span>" +
        esc(stages[st]) +
        "</td></tr>"
      );
    })
    .join("");
  return (
    '<div style="border:1px solid #e6e1f0;border-top:3px solid #b89b52;border-radius:9px;padding:12px 14px;margin:0 0 12px">' +
    '<div style="font:700 1.35rem/1.15 Georgia,\'Times New Roman\',serif;color:#2a2340">' +
    esc(a.name) +
    "</div>" +
    '<div style="font:italic 400 13px/1.4 Georgia,serif;color:#8a6a2a;margin:2px 0 8px">' +
    esc(a.longing) +
    "</div>" +
    '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%">' +
    rows +
    "</table>" +
    "</div>"
  );
}

function pairingBlock(p, shadow) {
  const named = p && p.name;
  return (
    '<div style="border-bottom:1px solid #eee;padding:7px 0;margin:0 0 4px">' +
    '<div style="font:600 15px/1.35 Georgia,serif;color:#2a2340">' +
    esc(p.title) +
    " &rarr; " +
    (named
      ? '<span style="color:' + (shadow ? "#4b4a8a" : "#9a7a1e") + '">' + esc(p.name) + "</span>"
      : '<span style="font-style:italic;color:#8a86a0">unnamed</span>') +
    "</div>" +
    (p.texture
      ? '<div style="font:italic 400 13px/1.4 Georgia,serif;color:#6b6580;margin-top:2px">' + esc(p.texture) + "</div>"
      : "") +
    (p.inShadow
      ? '<div style="font:400 12.5px/1.4 Arial,sans-serif;color:#4a4560;margin-top:3px"><span style="font-weight:600;color:#4b4a8a">In shadow: </span>' + esc(p.inShadow) + "</div>"
      : "") +
    (p.integrated
      ? '<div style="font:400 12.5px/1.4 Arial,sans-serif;color:#3f3a58;margin-top:1px"><span style="font-weight:600;color:#8a6a2a">Integrated: </span>' + esc(p.integrated) + "</div>"
      : "") +
    "</div>"
  );
}

function sectionLabel(t) {
  return '<p style="font:700 10px/1.4 Arial,sans-serif;letter-spacing:.25em;color:#9a94aa;text-transform:uppercase;margin:26px 0 8px">' + esc(t) + "</p>";
}

// A centered inline image (the rasterized Mandala PNG). `cid` is the Content-ID
// of a Resend inline attachment; we reference it with src="cid:…" so the image
// renders in every client (including Gmail, which blocks data: URIs).
function mandalaImg(cid, alt) {
  if (!cid) return "";
  return (
    '<div style="text-align:center;margin:18px 0 6px">' +
    '<img src="cid:' + cid + '" alt="' + esc(alt) + '" width="320" ' +
    'style="width:100%;max-width:320px;height:auto;display:inline-block" />' +
    "</div>"
  );
}

// report = { name, loud[], pairings[], temperament{items,note}, shadow{three,pairings}|null }
// images = { mandala: cid|null, shadow: cid|null } — Content-IDs of inline PNG
// attachments (optional; the email still reads fine without them).
export function buildReportEmail(report, email, images) {
  report = report || {};
  images = images || {};
  const loud = Array.isArray(report.loud) ? report.loud : [];
  const names = loud.map((a) => a.name).filter(Boolean);
  const subject = "Your Mandala — " + (names.length ? names.join(" · ") : "The Art of Soulcraft");

  const who = [];
  if (report.name) who.push(esc(report.name));
  if (email) who.push(esc(email));

  let body = "";

  // Header
  body +=
    '<div style="text-align:center;border-bottom:1px solid #e6e1f0;padding-bottom:16px;margin-bottom:8px">' +
    '<p style="font:700 10px/1.4 Arial,sans-serif;letter-spacing:.3em;color:#b89b52;text-transform:uppercase;margin:0 0 6px">Your Mandala</p>' +
    '<h1 style="font:700 26px/1.2 Georgia,serif;color:#241d42;margin:0">' + esc(names.join(" · ")) + "</h1>" +
    (who.length ? '<p style="font:400 13px/1.4 Arial,sans-serif;color:#8a86a0;margin:8px 0 0">' + who.join(" &middot; ") + "</p>" : "") +
    "</div>";

  // The Mandala image — between the header and the loudest voices.
  body += mandalaImg(images.mandala, "Your Mandala");

  // Loudest voices
  if (loud.length) {
    body += sectionLabel("Your Loudest Voices");
    body += loud.map(archetypeBlock).join("");
  }

  // Pairings
  const pairings = Array.isArray(report.pairings) ? report.pairings : [];
  if (pairings.length) {
    body += sectionLabel("Your Archetypal Pairings");
    body += pairings.map((p) => pairingBlock(p, false)).join("");
  }

  // Temperament
  const temp = report.temperament;
  if (temp && Array.isArray(temp.items) && temp.items.length) {
    body += sectionLabel("Your Temperament Profile");
    body += '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:6px">';
    body += temp.items
      .map((it) => {
        const label = it.raw >= 3 ? "loud" : it.raw >= 1 ? "an intentional practice" : "—";
        return (
          '<tr><td style="padding:3px 0;font:600 14px/1.4 Georgia,serif;color:#2a2340;width:90px">' +
          esc(it.name) +
          '</td><td style="padding:3px 0;font:400 12.5px/1.4 Arial,sans-serif;color:#6b6580">' +
          esc(label) +
          "</td></tr>"
        );
      })
      .join("");
    body += "</table>";
    if (temp.note) {
      body += '<p style="font:400 13px/1.5 Arial,sans-serif;color:#4a4560;margin:4px 0 0">' + esc(temp.note) + "</p>";
    }
  }

  // Shadow (only present when unlocked)
  const shadow = report.shadow;
  if (shadow && Array.isArray(shadow.three) && shadow.three.length) {
    body += sectionLabel("Your Shadow Mandala — Your Quietest Voices");
    body += '<p style="font:400 13px/1.5 Arial,sans-serif;color:#4a4560;margin:0 0 12px">' + esc(SHADOW_INTRO) + "</p>";
    body += mandalaImg(images.shadow, "Your Shadow Mandala");
    body += shadow.three.map(archetypeBlock).join("");
    const sp = Array.isArray(shadow.pairings) ? shadow.pairings : [];
    if (sp.length) {
      body += sectionLabel("Your Shadow Pairings");
      body += sp.map((p) => pairingBlock(p, true)).join("");
    }
  }

  // Integration questions
  body += sectionLabel("Five Questions — Return to These Weekly");
  body += '<ol style="margin:0;padding-left:20px">';
  body += INTEGRATION_QUESTIONS.map((q) => '<li style="font:400 14px/1.5 Georgia,serif;color:#2a2340;margin:0 0 8px">' + esc(q) + "</li>").join("");
  body += "</ol>";

  // Closing + return link
  body +=
    '<div style="text-align:center;border-top:1px solid #e6e1f0;margin-top:26px;padding-top:18px">' +
    '<p style="font:italic 400 14px/1.5 Georgia,serif;color:#6b6580;margin:0 0 14px">' + esc(CLOSING_LINE) + "</p>" +
    '<a href="' + RETURN_URL + '" style="display:inline-block;background:#241d42;color:#fdf6e3;text-decoration:none;font:600 13px/1 Arial,sans-serif;padding:11px 20px;border-radius:9px">Return to your results</a>' +
    "</div>";

  const html =
    '<div style="max-width:600px;margin:0 auto;background:#ffffff;padding:26px 22px;font-family:Arial,Helvetica,sans-serif">' +
    '<p style="font:400 15px/1.5 Arial,sans-serif;color:#4a4560;margin:0 0 18px">Your Mandala is ready. Your full report is below — and you can return to the interactive version anytime.</p>' +
    body +
    "</div>";

  // Plain-text fallback.
  const tLines = [];
  tLines.push("YOUR MANDALA — " + names.join(" · "));
  if (who.length) tLines.push(who.map((w) => w.replace(/&[^;]+;/g, "")).join(" · "));
  tLines.push("");
  loud.forEach((a) => {
    tLines.push(a.name + " — " + a.longing);
    if (a.stages && a.stages[2]) tLines.push("  Base: " + a.stages[2]);
  });
  if (pairings.length) {
    tLines.push("", "PAIRINGS");
    pairings.forEach((p) => tLines.push("  " + p.title + " -> " + (p.name || "unnamed") + (p.texture ? " — " + p.texture : "")));
  }
  if (temp && temp.items) {
    tLines.push("", "TEMPERAMENT");
    temp.items.forEach((it) => tLines.push("  " + it.name + ": " + (it.raw >= 3 ? "loud" : it.raw >= 1 ? "an intentional practice" : "—")));
  }
  if (shadow && shadow.three) {
    tLines.push("", "SHADOW MANDALA");
    shadow.three.forEach((a) => tLines.push("  " + a.name + " — " + a.longing));
  }
  tLines.push("", "FIVE QUESTIONS — return to these weekly:");
  INTEGRATION_QUESTIONS.forEach((q, i) => tLines.push("  " + (i + 1) + ". " + q));
  tLines.push("", CLOSING_LINE, "", "Return to your results: " + RETURN_URL);

  return { subject, html, text: tLines.join("\n") };
}
