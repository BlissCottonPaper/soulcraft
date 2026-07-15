# Mandala rendering — the shared-module picture (R-46 item 5)

R-46's shared-component rule: *"the mandala drawing code lives in ONE module,
imported by site, composer, and CLI. No duplication."* This note records the
honest state, what is already shared, and the recommended path for the part that
isn't — so the decision is visible rather than buried.

## The single source that already exists: `assets/soulcraft-data.js`

The **data and palette** — the thing that must never drift — is already one
module, imported by every surface:

| Surface | How it consumes `soulcraft-data.js` |
|---|---|
| **Site** (`index.html`, the `Mandala` component) | loaded as a `<script>`; reads the `ARCHETYPES`, `HUE`, `SOULCRAFT` globals |
| **Reel CLI** (`tools/reel-generator`) | `src/palette.mjs` does `import(".../assets/soulcraft-data.js")` and derives `COLORS`/hues from it |
| **POSTS composer** (`assets/postgen.js`) | loaded alongside the shared script; reads `ARCHETYPES` / `HUE` (footer mandala hue now uses `HUE`, not a re-typed `i*30`) |

So the twelve archetypes, their order, `hue = index × 30`, and the bandwidth
stages are defined **once**. No surface reinvents the palette.

## What is NOT one module: the drawing *geometry* — and why

The three surfaces draw the wheel in **two different rendering technologies**:

| Surface | Technology | File |
|---|---|---|
| Site results page | **React + SVG** (`React.createElement("svg" …)`) | `index.html` → `Mandala` |
| Reel / video | **Canvas 2D** | `tools/reel-generator/src/draw.browser.js` |
| POSTS footer mark | **Canvas 2D** (decorative 12-dot ring, not a ranked wheel) | `assets/postgen.js` → `drawMandala` |

A single *drawing* module can't span SVG and Canvas without an intermediate
render abstraction or converging everything onto one technology. The site's
`Mandala` is an SVG React component wired tightly into the results app (ladders,
blend triangles, shadow mode, print palette, tooltips); the reel path is a
Canvas pipeline built for headless frame capture. They legitimately share the
*palette and geometry constants* (above) but not the *paint calls*.

## Recommendation (deferred, needs a call at review)

Forcing the geometry into one module today means porting the **live results-page
mandala** — the highest-value, most-tested surface — onto Canvas (or writing an
SVG↔Canvas abstraction). That is a large, risky change with no user-facing payoff
right now, so it is **not** done in this PR.

The low-risk convergence path, when it's worth doing:

1. **Build the REELS composer (item 3 option a).** Per the spec it must *import*
   `tools/reel-generator/src/draw.browser.js` rather than fork it. That single
   step makes `draw.browser.js` the **one Canvas drawing module shared by the
   composer and the CLI** — real de-duplication where both surfaces are already
   Canvas.
2. **Then, and only if the payoff justifies the risk,** evaluate porting the
   site's SVG `Mandala` to consume the same Canvas module (or extract a shared
   geometry helper both the SVG and Canvas renderers call for node positions,
   blend midpoints, etc.). This is a separate, carefully-tested change to the
   results page, not a drive-by.

Until then the invariant that actually matters — *one palette, one set of wheel
constants* — holds via `assets/soulcraft-data.js`, and no surface duplicates it.
