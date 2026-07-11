// ============================================================
// /functions/api/_svg-png.js   (shared helper — not a route)
// ============================================================
// Rasterizes an SVG string to a PNG data URI on the Cloudflare edge runtime,
// using @resvg/resvg-wasm (a WASM build of the resvg renderer that runs on
// Workers — no headless browser needed). Used to turn the client-serialized
// Mandala / Shadow-Mandala SVGs into inline images for the emailed report.
//
// The WASM binary ships via the npm dependency (see root package.json) and is
// imported as a WebAssembly.Module — the standard Cloudflare Workers pattern.
// initWasm() must run exactly once per isolate; we memoize it.
//
// A subset of Liberation Sans is passed as the font so the archetype labels
// actually render (resvg draws no text without a registered font).
// ============================================================

import { Resvg, initWasm } from "@resvg/resvg-wasm";
import resvgWasm from "@resvg/resvg-wasm/index_bg.wasm";
import { MANDALA_FONT } from "./_mandala-font.js";

let wasmReady = null;
function ensureWasm() {
  // Memoize: initWasm throws if called twice, so guard with a single promise.
  if (!wasmReady) wasmReady = initWasm(resvgWasm).catch((e) => {
    wasmReady = null; // allow a later retry if the first init raced/failed
    throw e;
  });
  return wasmReady;
}

// svg: an SVG string. width: target pixel width (height scales to the viewBox).
// Returns a "data:image/png;base64,…" string, or null on any failure (callers
// treat the image as optional — the email still sends without it).
export async function svgToPngDataUri(svg, width) {
  if (!svg || typeof svg !== "string") return null;
  try {
    await ensureWasm();
    const resvg = new Resvg(svg, {
      fitTo: { mode: "width", value: width || 640 },
      font: { fontBuffers: [MANDALA_FONT], defaultFontFamily: "Liberation Sans", loadSystemFonts: false },
    });
    const png = resvg.render().asPng(); // Uint8Array
    return "data:image/png;base64," + bytesToBase64(png);
  } catch (e) {
    return null;
  }
}

// Base64-encode bytes without Buffer (Workers has btoa but only for strings).
function bytesToBase64(bytes) {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}
