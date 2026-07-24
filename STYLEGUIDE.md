# The Art of Soulcraft — Style Guide

The conformance reference for every page on the site. **The source of truth is
the code**, not this document — every value here is transcribed from the live
homepage (`index.html`) and the shared chrome (`<style id="sc-styles">`, baked by
`build/generate.js` and served at runtime by `assets/site-chrome.js`). When the
code and this file disagree, the code wins and this file should be corrected.

New pages should **reuse the existing classes and tokens below** rather than
inventing parallel CSS. The palette is literal (hex / rgba / Tailwind utilities),
not CSS variables — match the literals.

---

## 1. Typography

Two faces, loaded from Google Fonts:

```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Source+Sans+3:wght@400;600&display=swap" rel="stylesheet">
```

| Role | Family | Weight / style | Where |
|------|--------|----------------|-------|
| **Display serif** | `'Cormorant Garamond', Georgia, serif` | 500 / 600 | Page titles & section headings (`h1`/`h2`), the brand wordmark. Exposed as the `.serif` class and the `serif` inline-style object in `index.html`. |
| **Italic subhead** | `'Cormorant Garamond'` *italic* | 500 italic | Lavender italic subheads, pull-quotes, and the poetic lead lines under a title. |
| **Body / UI** | `'Source Sans 3', system-ui, sans-serif` | 400 / 600 | Paragraph text, buttons, form controls, nav. Exposed as the `sans` inline-style object. |
| **Small-caps eyebrow** | `'Source Sans 3'` | 400, uppercase | The letterspaced kicker above a headline. |

### Type scale (the treatments to copy)

- **Display title** (e.g. the homepage "Your Mandala"): `serif` + `text-5xl leading-none`.
  For a **multi-line** headline (a full sentence rather than a short title), use
  `serif text-4xl md:text-5xl leading-tight` — same face, same top-of-scale size,
  looser leading so it reflows on mobile. This is the canonical content-page `h1`.
- **Italic subhead / lead line**: `serif` + `italic` + `text-violet-200/80` at
  `text-[15px]` (byline) to `text-[16px] leading-relaxed` (substantive lead line).
- **Small-caps eyebrow**: `text-[11px] tracking-[0.35em] text-amber-200/80` (sans),
  uppercase text. This amber, wide-tracked kicker is the canonical eyebrow used
  across the site (`/how-it-works`, `/explore`, …); tracking ranges `0.28em`–`0.4em`
  for tighter/looser variants but `0.35em` is the standard page eyebrow.
  *(Note: the muted-lavender `tracking-[0.15em] text-violet-300/50` seen under the
  homepage title is a **byline/attribution**, not an eyebrow — don't use it as a kicker.)*
- **Body**: `text-violet-200/85 text-lg leading-relaxed` (sans) for primary prose;
  `text-[15.5px]`/`text-base` for tighter contexts.

---

## 2. Color

All literal — no CSS variables.

### Surfaces
| Token | Value | Use |
|-------|-------|-----|
| Background indigo | `#100c22` | Page background (`body`). |
| Hero gradient | `radial-gradient(1200px 700px at 50% -8%, #241d42 0%, #171230 42%, #100c22 100%)` | The `.page-bg` glow behind heroes; also the SPA root background. |
| Theme color (meta) | `#1a1a2e` | `<meta name="theme-color">`. |
| Card fill | `rgba(255,250,240,0.03)` | `.card` / `.auth-card` panels. |
| Card fill (hover) | `rgba(255,250,240,0.05)` | `.card-hover:hover`. |

### Text
| Token | Value / Tailwind | Use |
|-------|------------------|-----|
| Primary text | `#f5f3ff` (`text-violet-50`) | Headlines, high-emphasis text. |
| Body lavender | `text-violet-200/85` (`#ddd6fe` @ 85%) | Body copy. |
| Muted lavender | `text-violet-300/50`–`/45` (`#c4b5fd`) | Bylines, attributions, captions. |
| Chrome lavender | `rgba(224,218,246,0.85)` | Nav/footer links (`sc-link`, `sc-foot a`). |

### Accent (gold) & borders
| Token | Value / Tailwind | Use |
|-------|------------------|-----|
| Gold accent | `amber-200` `#fde68a` | Eyebrows, accents; primary button fill at `/90`. |
| Gold (warm) | `#fde8b0` | Brand hover, warm-gold highlights. |
| Gold (hover) | `amber-100` `#fef3c7` | Primary button hover fill. |
| Button ink | `#1b1430` | Text on gold buttons. |
| Border (default) | `rgba(196,181,253,0.18)` | Card / panel borders. |
| Border (chrome) | `rgba(196,181,253,0.10)` | Header/footer hairlines. |
| Border (accent) | `rgba(253,230,138,0.5)` | Card hover / focused edges. |
| Divider | `border-violet-300/10` | Between page sections. |

---

## 3. Buttons

- **Primary (gold):**
  `rounded-xl px-5 py-3.5 text-[15px] bg-amber-200/90 text-[#1b1430] font-semibold hover:bg-amber-100 transition-colors`
  (sans). Add `disabled:opacity-60` when it can be busy. Content-page CTAs use the
  same recipe with `px-6` and `inline-block`.
- **Outlined / card (secondary):**
  `rounded-xl px-5 py-3.5 text-[15px] border border-violet-300/25 text-violet-100 hover:border-amber-200/60 hover:text-amber-100`
  (sans). The emphasized "Full" tier variant uses
  `border-2 border-amber-200/70 bg-amber-100/5 text-violet-50 hover:bg-amber-100/10 hover:border-amber-200`.
- **Selection chip:** `px-3.5 py-2 rounded-full text-sm border …` toggling to
  `bg-amber-200/90 text-[#1b1430] border-amber-200 font-semibold` when active.
- **Focus:** keyboard focus must be visible. Where the base recipe relies on the
  UA default, add a ring on new work:
  `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#100c22]`.

---

## 4. The Mandala emblem (logo)

The site's mark is the twelve-dot mandala ring — an **inline SVG generated from the
same geometry as the assessment wheel**, not an image file. Homepage source
(`index.html`, intro screen):

- `viewBox="0 0 120 120"`, sized `w-24 h-24` (96px), `mx-auto mb-6`.
- **Twelve ring dots**: for `i` in `0..11`, centered at
  `nodeXY(i, 46, 60)` = `(60 + 46·cos((i·30−90)°), 60 + 46·sin((i·30−90)°))`,
  each `r="4"`, `fill="hsl(i·30, 62%, 56%)"` — so dot 0 sits at top and the twelve
  hues run the full wheel (30° / 30° of hue per step).
- **Center dot**: `cx="60" cy="60" r="4" fill="rgb(255,252,240)"`.
- Always `aria-hidden="true"` (decorative; the title carries the meaning).

Baked static form (identical output, for non-React pages):

```html
<svg viewBox="0 0 120 120" class="w-24 h-24 mx-auto mb-6" aria-hidden="true"><circle cx="60" cy="14" r="4" fill="hsl(0,62%,56%)"/><circle cx="83" cy="20.16" r="4" fill="hsl(30,62%,56%)"/><circle cx="99.84" cy="37" r="4" fill="hsl(60,62%,56%)"/><circle cx="106" cy="60" r="4" fill="hsl(90,62%,56%)"/><circle cx="99.84" cy="83" r="4" fill="hsl(120,62%,56%)"/><circle cx="83" cy="99.84" r="4" fill="hsl(150,62%,56%)"/><circle cx="60" cy="106" r="4" fill="hsl(180,62%,56%)"/><circle cx="37" cy="99.84" r="4" fill="hsl(210,62%,56%)"/><circle cx="20.16" cy="83" r="4" fill="hsl(240,62%,56%)"/><circle cx="14" cy="60" r="4" fill="hsl(270,62%,56%)"/><circle cx="20.16" cy="37" r="4" fill="hsl(300,62%,56%)"/><circle cx="37" cy="20.16" r="4" fill="hsl(330,62%,56%)"/><circle cx="60" cy="60" r="4" fill="rgb(255,252,240)"/></svg>
```

Centering note: the homepage centers it via a `text-center` parent. When the
emblem sits outside a `text-center` container (e.g. the auth pages), add `block`
so `mx-auto` centers it — the baked static form above uses `w-24 h-24 mx-auto mb-6 block`.

**When it appears:** the emblem crowns a **focused, single-column entry / identity
moment** — the assessment splash, the `/begin` landing, and the sign-in /
create-account screens — centered, directly above the serif title. Deep interior
content pages (`/how-it-works`, `/explore`, …) do **not** repeat it; they sit under
the nav wordmark instead.

---

## 5. Spacing rhythm

- **Hero (emblem-led splash):** emblem `mb-6` → serif title `mb-2` → italic byline
  `mb-1` → small-caps attribution `mb-4` → italic lead line `mb-3` → final accent
  line `mb-8` → CTA group. Supporting lines step in the `mb-1 … mb-6` range; the
  last element before the CTA gets the largest gap (`mb-8`).
- **Content-page hero:** `section` `pt-16 pb-8 md:pt-24`, centered, `max-w-2xl mx-auto`;
  eyebrow `mb-4`, `h1` `mb-5`, then body.
- **Between sections:** `py-9` with a `border-t border-violet-300/10` divider.
- **Reading column:** `max-w-2xl` (prose) to `max-w-5xl` (page shell); center with
  `mx-auto`, side padding `px-5 md:px-8`.

---

## 6. Quality floor (every page)

- Visible keyboard focus (see §3).
- `@media (prefers-reduced-motion: reduce)` respected — no essential motion.
- Real contrast on the dark field (gold and `#f5f3ff` on `#100c22`).
- `<meta name="theme-color" content="#1a1a2e">`, favicon/manifest, canonical, and
  OG/Twitter cards in the head (copy an existing static page's head).
- Shared footer (`#site-footer`) and, on chrome-bearing pages, the shared header.
