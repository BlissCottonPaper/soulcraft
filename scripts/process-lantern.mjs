#!/usr/bin/env node
// ============================================================================
// scripts/process-lantern.mjs
// ----------------------------------------------------------------------------
// Repeatable Lantern-icon pipeline (Batch 2). Give it the untouched source
// artwork and it produces the two production icons, always the same way — so a
// future lantern swap gets identical treatment (drop a new file in, re-run).
//
//   1. Reads   assets/source/lantern-original.png   (committed untouched)
//   2. Ensures transparency:
//        · if the source already has an alpha channel → use it, trim to the
//          artwork's ALPHA bounding box (+repage). The glow has non-zero alpha,
//          so the bbox includes it — never cropped tighter than the glow.
//        · if the source is opaque (e.g. a glow rendered on WHITE) → derive
//          alpha from the deviation-from-white matte (white → transparent, the
//          amber glow preserved as a soft haze), then crop to the alpha>THRESH
//          bounding box (drops sub-threshold white-cast/compression noise while
//          keeping the visible glow).
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
  console.log("source: " + identify(["-format", "%wx%h channels=%[channels]", SRC]).trim());

  // Build a temp, transparency-correct working image + the crop bbox.
  const work = path.join(OUT_DIR, ".lantern-work.png");
  let bbox;
  if (hasAlpha) {
    console.log("alpha: present → trimming to the artwork's alpha bounding box (glow included).");
    convert([SRC, "-trim", "+repage", work]);
    bbox = null; // already cropped
  } else {
    console.log("alpha: absent → deriving transparency from white (glow preserved), alpha>" + NOISE_THRESHOLD + " bbox.");
    // Snap near-white to pure white first, so any transparency-preview checkerboard
    // baked into the background collapses to a clean field (no speckle in the glow).
    // alpha = max(1-R,1-G,1-B): pure white → transparent, dark/coloured → opaque.
    convert([
      SRC,
      "-fuzz", "6%", "-fill", "white", "-opaque", "white",
      "(", "+clone", "-alpha", "off", "-negate", "-separate", "-evaluate-sequence", "max", ")",
      "-alpha", "off", "-compose", "CopyOpacity", "-composite", work,
    ]);
    bbox = convert([work, "-alpha", "extract", "-threshold", NOISE_THRESHOLD, "-format", "%@", "info:"]).trim();
    console.log("glow-inclusive bbox: " + bbox);
  }

  for (const s of SIZES) {
    const out = path.join(OUT_DIR, `lantern-${s}.png`);
    const args = [work];
    if (bbox) args.push("-crop", bbox, "+repage");
    args.push("-resize", VSCALE, "-filter", "Lanczos", "-resize", `${s}x${s}`, "-strip", out);
    convert(args);
    const dims = identify(["-format", "%wx%h alpha=%A", out]).trim();
    console.log(`✔ ${path.relative(ROOT, out)}  ${dims}  ${fs.statSync(out).size} bytes`);
  }
  fs.rmSync(work, { force: true });
  console.log("Done. Wired at 48px CSS via srcset (lantern-96.png 2x) — the Lantern element in /companion.");
}

main();
