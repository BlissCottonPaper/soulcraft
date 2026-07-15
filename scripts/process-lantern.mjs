#!/usr/bin/env node
// ============================================================================
// scripts/process-lantern.mjs
// ----------------------------------------------------------------------------
// Repeatable Lantern-icon pipeline (Batch 2). Give it the untouched source
// artwork and it produces the two production icons, always the same way — so a
// future lantern swap gets identical treatment (drop a new file in, re-run).
//
//   1. Reads   assets/source/lantern-original.png   (committed untouched)
//   2. Three source modes, auto-detected:
//        · ALPHA  — the source already has an alpha channel → trim to the
//          artwork's ALPHA bounding box (glow included; never cropped tighter).
//        · WHITE  — opaque, on a white field → derive alpha from the deviation-
//          from-white matte (white → transparent, amber glow kept as a soft
//          haze), crop to the alpha>THRESH bbox. Output is transparent.
//        · TILE   — opaque, baked on a flat dark field (TILE_BG, e.g. #16112D) →
//          a contained NAVY TILE: snap the near-TILE_BG field to exact TILE_BG
//          (compression noise removed — authorized), crop a centered SQUARE
//          around the lantern with a comfortable margin, pad back to square with
//          TILE_BG. Output is an opaque square tile; the CSS container's
//          background is TILE_BG so tile and image are seamless.
//   3. Applies the 87% VERTICAL scale (spec addendum) — width 100%, height 87%.
//   4. Exports (high-quality Lanczos downscale, longest side):
//        assets/lantern-48.png   (@1x, 48px)  → served at /assets/lantern-48.png
//        assets/lantern-96.png   (@2x, 96px)  → served at /assets/lantern-96.png
//
// NB: the spec named public/assets/, but this repo has no public/ dir — Cloudflare
// Pages serves the repo root, so /assets/* maps to the root assets/ dir. We export
// there so the /assets/lantern-48.png URL the Lantern element uses resolves.
//
// Requires ImageMagick (`convert` + `identify`). Usage:
//   node scripts/process-lantern.mjs
//   node scripts/process-lantern.mjs path/to/other-lantern.png   (swap)
// ============================================================================

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const SRC = process.argv[2] || path.join(ROOT, "assets", "source", "lantern-original.png");
const OUT_DIR = path.join(ROOT, "assets"); // served at /assets/* (repo root; no public/ dir)
const SIZES = [48, 96];
const VSCALE = "100%x87%";     // spec addendum: 87% vertical scale
const NOISE_THRESHOLD = "8%";  // alpha floor when deriving transparency from white
const TILE_BG = "#16112D";     // baked navy-tile background (Batch 2 replacement source)
const TILE_MARGIN = 1.30;      // centered-square side = longest lantern dimension × this
const TILE_FUZZ = "8%";        // snap near-TILE_BG field to exact TILE_BG (kills compression noise)

function im(bin, args) { return execFileSync(bin, args, { stdio: ["ignore", "pipe", "pipe"] }).toString(); }
function convert(args) { return im("convert", args); }
function identify(args) { return im("identify", args); }

function main() {
  try { execFileSync("convert", ["-version"], { stdio: "ignore" }); }
  catch (e) {
    console.error("✗ ImageMagick not found on PATH. Install it (apt-get install imagemagick / brew install imagemagick) and re-run.");
    process.exit(1);
  }
  if (!fs.existsSync(SRC)) {
    console.error("✗ Source not found: " + SRC + "\n  Commit the untouched original there (or pass a path), then re-run.");
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const channels = identify(["-format", "%[channels]", SRC]).trim();
  const hasAlpha = /a$/i.test(channels) || /matte/i.test(channels); // e.g. "srgba"
  const W = parseInt(identify(["-format", "%w", SRC]), 10);
  const H = parseInt(identify(["-format", "%h", SRC]), 10);
  console.log("source: " + identify(["-format", "%wx%h channels=%[channels]", SRC]).trim());

  // Corner sample → decide WHITE vs TILE for an opaque source.
  const corner = (x, y) => identify(["-format", `%[hex:p{${x},${y}}]`, SRC]).trim().slice(0, 6).toUpperCase();
  const corners = [corner(0, 0), corner(W - 1, 0), corner(0, H - 1), corner(W - 1, H - 1)];
  const isWhiteish = (hx) => parseInt(hx.slice(0, 2), 16) > 230 && parseInt(hx.slice(2, 4), 16) > 230 && parseInt(hx.slice(4, 6), 16) > 230;

  const work = path.join(OUT_DIR, ".lantern-work.png"); // fully-prepped (VSCALE baked in)

  if (hasAlpha) {
    console.log("mode: ALPHA → trimming to the alpha bounding box (glow included), 87% vscale.");
    convert([SRC, "-trim", "+repage", "-resize", VSCALE, work]);
  } else if (corners.every(isWhiteish)) {
    console.log("mode: WHITE → deriving transparency from white (glow preserved), alpha>" + NOISE_THRESHOLD + " bbox, 87% vscale.");
    const derived = path.join(OUT_DIR, ".lantern-derived.png");
    convert([
      SRC,
      "-fuzz", "6%", "-fill", "white", "-opaque", "white",
      "(", "+clone", "-alpha", "off", "-negate", "-separate", "-evaluate-sequence", "max", ")",
      "-alpha", "off", "-compose", "CopyOpacity", "-composite", derived,
    ]);
    const bbox = convert([derived, "-alpha", "extract", "-threshold", NOISE_THRESHOLD, "-format", "%@", "info:"]).trim();
    convert([derived, "-crop", bbox, "+repage", "-resize", VSCALE, work]);
    fs.rmSync(derived, { force: true });
  } else {
    // TILE — baked on a flat dark field. Snap the near-TILE_BG field to exact
    // TILE_BG (authorized: flatten compression noise), centred-square crop around
    // the lantern with margin, 87% vscale, pad back to a square TILE_BG tile.
    console.log("mode: TILE (" + TILE_BG + ") — pre-snap corners: " + corners.map((c) => "#" + c).join(" "));
    const snapped = path.join(OUT_DIR, ".lantern-snapped.png");
    convert([SRC, "-fuzz", TILE_FUZZ, "-fill", TILE_BG, "-opaque", TILE_BG, snapped]);
    // lantern bbox (field is now exact TILE_BG)
    const m = convert([snapped, "-bordercolor", TILE_BG, "-border", "1", "-fuzz", "3%", "-trim", "-format", "%w %h %X %Y", "info:"]).trim().split(/\s+/).map(Number);
    const [bw, bh] = m;
    const bx = m[2] - 1, by = m[3] - 1; // undo the 1px border offset
    const side = Math.round(Math.max(bw, bh) * TILE_MARGIN);
    const cx = bx + bw / 2, cy = by + bh / 2;
    const ox = Math.round(cx - side / 2), oy = Math.round(cy - side / 2);
    console.log(`  lantern bbox ${bw}x${bh}@${bx},${by} → centred square ${side}px @${ox},${oy}`);
    convert([
      snapped, "-background", TILE_BG, "-gravity", "NorthWest",
      "-crop", `${side}x${side}+${ox}+${oy}!`, "-flatten", "+repage",
      "-resize", VSCALE, "-background", TILE_BG, "-gravity", "center", "-extent", `${side}x${side}`,
      work,
    ]);
    fs.rmSync(snapped, { force: true });
  }

  for (const s of SIZES) {
    const out = path.join(OUT_DIR, `lantern-${s}.png`);
    convert([work, "-filter", "Lanczos", "-resize", `${s}x${s}`, "-strip", out]);
    const dims = identify(["-format", "%wx%h alpha=%A", out]).trim();
    console.log(`✔ ${path.relative(ROOT, out)}  ${dims}  ${fs.statSync(out).size} bytes`);
  }
  fs.rmSync(work, { force: true });
  console.log("Done. Wired at 48px CSS via srcset (lantern-96.png 2x) — the Lantern element in /companion.");
}

main();
