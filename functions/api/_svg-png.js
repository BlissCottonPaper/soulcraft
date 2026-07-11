// ============================================================
// /functions/api/_svg-png.js   (shared helper — not a route)
// ============================================================
// Rasterizes an SVG string to a PNG on the Cloudflare edge runtime, using the
// resvg renderer compiled to WASM (runs on Workers — no headless browser).
// Used to turn the client-serialized Mandala / Shadow-Mandala SVGs into inline
// images for the emailed report.
//
// resvg is VENDORED into the repo (functions/api/_resvg.mjs is the wasm-bindgen
// JS glue from @resvg/resvg-wasm@2.6.2; _resvg_bg.wasm is its binary) rather than
// pulled from npm — so the site keeps its zero-build, direct-upload Cloudflare
// Pages deploy (a package.json would flip Pages into build mode). The .wasm is
// imported relatively as a WebAssembly.Module, which Pages Functions support
// natively. initWasm() must run exactly once per isolate; we memoize it.
//
// A subset of Liberation Sans is passed as the font so the archetype labels
// actually render (resvg draws no text without a registered font).
// ============================================================

import { Resvg, initWasm } from "./_resvg.mjs";
import resvgWasm from "./_resvg_bg.wasm";
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
// Returns the PNG as a base64 string (no data: prefix), or null on any failure
// (callers treat the image as optional — the email still sends without it). The
// bare base64 is what Resend wants for a CID inline attachment's `content`.
export async function svgToPngBase64(svg, width) {
  if (!svg || typeof svg !== "string") return null;
  try {
    await ensureWasm();
    const resvg = new Resvg(svg, {
      fitTo: { mode: "width", value: width || 640 },
      font: { fontBuffers: [MANDALA_FONT], defaultFontFamily: "Liberation Sans", loadSystemFonts: false },
    });
    const png = resvg.render().asPng(); // Uint8Array
    return bytesToBase64(png);
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
