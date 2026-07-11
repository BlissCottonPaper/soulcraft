# The Art of Soulcraft

*artofsoulcraft.com — a BridgeTender Studio project*

A twelve-archetype developmental self-discovery system. You are not one type — you are all twelve, some louder than others. Every archetype exists on a five-stage spectrum (**Altitude**) from selfish (Devolved) to selfless (Transcendent). Product name: **Your Mandala**.

---

## 🚦 Status: Live Prototype, Backend Written But Not Deployed

**The frontend is live and working. The backend exists as real code but has never been run.** Honest state as of this update:

### ✅ Done
- Full conceptual architecture: 12 archetypes, 5 altitudes, 48 base×embodiment expressions, 66 named blends
- The Wheel / Clock / Cone geometry, verified correct (blend-dot placement, opposite-axis handling)
- Full 36-statement bank written (3 flavors × 12 archetypes) — the Full Mirror's placeholder content gap is closed
- **`index.html` is live at [artofsoulcraft.com](https://artofsoulcraft.com)** (deployed via Cloudflare Pages, connected to this repo's `main` branch — pushes auto-deploy)
- Free / Triad / Full tier logic fully implemented and gated correctly in the UI
- Mandala renders correctly on screen and in a genuine two-page printable report (dark-on-white colors, real page break, no Tailwind-dependency bugs in print)
- **Frontend save flow is wired**: finishing a real (non-sample) assessment automatically calls `/api/save-results` — but see "Not Done" below, this call currently fails safely since no backend is deployed to receive it
- Optional, non-gating email capture box on the results screen (offered after results display, never required)
- Three backend Cloudflare Pages Functions **written, syntax-validated, not yet deployed**: `save-results.js`, `verify-link.js`, `my-results.js` — plus `schema.sql` (5 tables: `users`, `results`, `magic_links`, `codes`, `compatibility_pairs`)
- Brand name settled: **Your Mandala**, by The Art of Soulcraft
- All 12 archetype content chapters, plus Altitudes and Embodiments chapters, written in Notion

### ❌ Not Done Yet
- **No D1 database created in Cloudflare** — `schema.sql` has never been executed against a real database
- **No database binding configured** — even once created, the Pages project needs to be told the DB exists (`env.DB` in the function files currently points at nothing)
- **No email sending wired** — `save-results.js` has the magic-link logic but the actual send-an-email call (Resend/Postmark) is still a commented-out placeholder
- **No `verify-link.js` frontend wiring** — nothing in `index.html` checks the URL for a `?token=` parameter yet, so clicking a magic link (once emails work) wouldn't restore a saved result
- **No results-history UI** — `my-results.js` correctly returns every saved result for a user, but no screen renders that list yet
- **No Stripe account/products set up** — tier logic exists in the UI but nothing is actually gated by payment yet
- **No `codes` table redemption flow built** — the Bliss/Lavender Sky gift-code concepts are fully designed in the Build Spec but zero code exists for them
- **No Compatibility feature** — UI shows it as a "coming soon" placeholder only
- **Naming audit incomplete** — a structured pass through all 60 stage names / 48 embodiments / 66 blends for cultural/religious/clinical collisions has a checklist started in Notion but is not finished
- **No real user testing** — only the creator has used the live site so far

**Bottom line: the frontend is a real, live, working product for taking the assessment and seeing results. The backend that would let someone SAVE and RETURN to those results is written but not turned on. That's the single biggest gap between "cool demo" and "real product with accounts."**

---

## Repo Structure

```
/index.html                  — the entire frontend: assessment, scoring, mandala, print, tier logic
/schema.sql                  — D1 database schema (5 tables), ready to run once a database exists
/functions/api/
  save-results.js            — saves a finished assessment; email optional; handles code redemption
  verify-link.js             — resolves a clicked magic link back to a saved result
  my-results.js              — returns ALL of a user's saved results (for history/compare-over-time)
```

---

## 🤖 If You're Picking This Up in Claude Code

**This project was designed and built across many claude.ai chat sessions, not in Claude Code.** There is no live handoff between that chat history and a Claude Code session — treat this README plus the Notion canon as the complete briefing; nothing else carries over automatically.

**To get the backend actually running, in order:**

1. In the Cloudflare dashboard: **Storage & Databases → D1 → Create database**
2. Run `schema.sql` against it (paste into the D1 console, or `wrangler d1 execute <db-name> --file=schema.sql`)
3. In this Pages project's settings: **bind the D1 database** to a variable named `DB` — this is what makes `env.DB` in the function files resolve to something real
4. Set up an email-sending account (Resend is the simpler API) and wire the real `fetch()` call into the commented-out section of `save-results.js`
5. Add the `?token=` URL-checking logic to `index.html` so a clicked magic link actually calls `verify-link.js` and restores the result
6. Build a simple results-history screen that calls `my-results.js` and lists every saved attempt
7. Only after 1–6 work end-to-end: set up Stripe and wire real payment to the tier logic that already exists in the UI

**Full system canon (architecture, decisions log, naming rationale, open questions) lives in Notion** — BridgeTender Studio workspace → Archetypes — The Twelve. Start with the "Start Here" index at the top of that page. The **Build Spec** page there has the complete technical design (schema rationale, Stripe flow, Bliss/Lavender Sky gift-code mechanics, Compatibility design) in far more depth than fits here.

---

## Environment Variables (Cloudflare Pages)

Set these in the Pages project's **Settings → Environment variables** (and the D1 binding under **Settings → Functions → D1 database bindings**). None of them are ever exposed to the browser — every value is read server-side inside the Pages Functions.

| Name | Purpose |
| --- | --- |
| `DB` | D1 database **binding** (not a text value) — makes `env.DB` resolve in every function. |
| `RESEND_API_KEY` | Resend API key used to send the magic-link / results emails. |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_…`) used server-side to create Checkout sessions. |
| `STRIPE_WEBHOOK_SECRET` | Stripe signing secret (`whsec_…`) used to verify webhook signatures in `stripe-webhook.js`. |
| `STRIPE_PRICE_FULL` | Stripe Price ID for the **Full** reading ($29) — the single paid tier (Your Mandala + the Shadow Mandala), paid at the upfront gate. |
| `STRIPE_PRICE_COMPATIBILITY` | Stripe Price ID for the **Mandala Compatibility Report**. Product is wired for checkout; the invite flow isn't built yet. |
| `PROMO_CODES` | Comma-separated list of free-access promo codes (matched case-insensitively). A valid code, redeemed via `/api/redeem-promo`, grants full access — it stamps `full_purchased` and `shadow_unlocked` on the results row and bypasses Stripe entirely. Validated server-side only; the list is never sent to the client. |
| `ADMIN_KEY` | Secret key guarding the private stats endpoint `/api/admin/stats` (and the `/admin` page, which forwards the key you type in the `X-Admin-Key` header). A missing or wrong value returns `401`. Read server-side only. |
| `ANTHROPIC_API_KEY` | Anthropic API key (from [console.anthropic.com](https://console.anthropic.com)) used server-side by the **Mira** reflection companion. Read server-side only. |
| `STRIPE_PRICE_MIRA_MONTHLY` | Stripe Price ID for the **Mira** monthly subscription ($8/mo). Current value: `price_1Ts8FnAJykR1Zg42Rayru3jS`. |
| `STRIPE_PRICE_MIRA_QUARTERLY` | Stripe Price ID for the **Mira** quarterly subscription ($21/quarter). Current value: `price_1Ts8FnAJykR1Zg42UWgJriiP`. |
| `STRIPE_PRICE_MIRA_YEARLY` | Stripe Price ID for the **Mira** yearly subscription ($72/year). Current value: `price_1Ts8FnAJykR1Zg42yVPnULfi`. |

---

## Rendering the Mandala PNG (Pages Functions)

The emailed report embeds the Mandala / Shadow-Mandala as PNGs, rasterized from
the client-serialized SVGs **server-side on the edge** (no headless browser),
via the resvg renderer compiled to WASM.

**There is deliberately no `package.json`.** Adding one flips Cloudflare Pages
from its zero-build "direct upload" mode into build mode, which broke deploys
here. So resvg is **vendored** into the repo instead:

| File | What |
| --- | --- |
| `functions/api/_resvg.mjs` | wasm-bindgen JS glue (from `@resvg/resvg-wasm@2.6.2`). |
| `functions/api/_resvg_bg.wasm` | the resvg WASM binary (~2.4 MB), imported relatively as a `WebAssembly.Module` — a pattern Pages Functions support with no build step. |
| `functions/api/_mandala-font.js` | a ~12 KB subset of Liberation Sans (SIL OFL, redistributable) so resvg can render the archetype labels. |

To update resvg later: `npm i @resvg/resvg-wasm@<v>` somewhere, then copy its
`index.mjs` → `_resvg.mjs` and `index_bg.wasm` → `_resvg_bg.wasm`. The PNG render
runs in the background via `waitUntil`, so it never blocks or breaks the save
response, and any failure just omits the image.

The rendered PNGs are attached to the report email as **Resend CID inline attachments** (`attachments: [{ content, filename, content_id, content_type }]`) and referenced with `<img src="cid:…">` — this renders in every client, Gmail included (unlike `data:` URIs, which Gmail blocks). The HTML body stays small because the image bytes live in separate MIME parts, so Gmail doesn't clip the message either.

---

## Canon Reference

The full system architecture, decisions log, naming audit, and open questions are maintained in Notion and are the living source of truth. This repo's code should be kept in sync with Notion's decisions, not the other way around — if the two ever disagree, Notion wins.
