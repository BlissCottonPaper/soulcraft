#!/usr/bin/env node
// ============================================================================
// scripts/process-lantern.mjs
// ----------------------------------------------------------------------------
// Repeatable Lantern-icon pipeline (Batch 2). Give it the untouched source
// artwork and it produces the two production icons, always the same way — so a
// future lantern swap gets identical treatment (drop a new file in, re-run).
//
//   1. Reads   assets/source/lantern-original.png   (committed untouched)
//   2. Trims   to the artwork's ALPHA bounding box (+repage). The soft amber
//              glow has non-zero alpha, so the bbox includes it — we never crop
//              tighter than the glow.
//   3. Exports (high-quality Lanczos downscale, longest side):
//        assets/lantern-48.png   (@1x, 48px)  → served at /assets/lantern-48.png
//        assets/lantern-96.png   (@2x, 96px)  → served at /assets/lantern-96.png
//
// NB: the spec named public/assets/, but this repo has no public/ dir — Cloudflare
// Pages serves the repo root, so /assets/* maps to the root assets/ dir. We export
// there so the /assets/lantern-48.png URL the Lantern element uses actually resolves.
//
// Requires ImageMagick (`convert`) on PATH — the documented, repeatable step.
// Usage:  node scripts/process-lantern.mjs
//         node scripts/process-lantern.mjs path/to/other-lantern.png   (swap)
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

function convert(args) {
  return execFileSync("convert", args, { stdio: ["ignore", "pipe", "pipe"] }).toString();
}

function main() {
  // Preflight: ImageMagick present?
  try { execFileSync("convert", ["-version"], { stdio: "ignore" }); }
  catch (e) {
    console.error("✗ ImageMagick `convert` not found on PATH. Install it (e.g. `apt-get install imagemagick` or `brew install imagemagick`) and re-run.");
    process.exit(1);
  }
  if (!fs.existsSync(SRC)) {
    console.error("✗ Source not found: " + SRC + "\n  Commit the untouched original there (or pass a path), then re-run.");
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Report the source + the alpha bbox trim so the operator can see the glow is
  // included and nothing is cropped tighter than the artwork's own alpha.
  const before = convert([SRC, "-format", "%wx%h alpha=%A", "info:"]).trim();
  const bbox = convert([SRC, "-trim", "info:"]).trim();
  console.log("source: " + before);
  console.log("alpha bbox (trim, glow included): " + bbox.replace(/^\S+\s+\w+\s+/, ""));

  for (const s of SIZES) {
    const out = path.join(OUT_DIR, `lantern-${s}.png`);
    // -trim +repage → alpha bbox; Lanczos downscale to fit s×s (longest side = s),
    // preserving transparency and aspect ratio; strip metadata for a lean file.
    convert([
      SRC,
      "-trim", "+repage",
      "-filter", "Lanczos",
      "-resize", `${s}x${s}`,
      "-strip",
      out,
    ]);
    const dims = convert([out, "-format", "%wx%h", "info:"]).trim();
    const bytes = fs.statSync(out).size;
    console.log(`✔ ${path.relative(ROOT, out)}  ${dims}  ${bytes} bytes`);
  }
  console.log("Done. Wire at 48px CSS via srcset (lantern-96.png 2x) — see the Lantern element in /companion.");
}

main();
