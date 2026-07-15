// ============================================================
// render.mjs — draw every frame in headless Chromium, screenshot to PNGs
// ============================================================
// Runs the shared Canvas2D drawing (draw.browser.js) in a real browser page — the
// same environment the site draws its mandala in — and captures one PNG per frame.
// Frame count is driven by the timeline duration * fps.
// ============================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { paletteBundle, brandFontDataUrl } from "./palette.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve a Chromium executable: explicit env first, then the headless-shell
// build (most reliable headless), then Playwright's own resolution.
function resolveChromium() {
  if (process.env.CHROMIUM_PATH && fs.existsSync(process.env.CHROMIUM_PATH)) return process.env.CHROMIUM_PATH;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (base && fs.existsSync(base)) {
    for (const dir of fs.readdirSync(base)) {
      if (!/headless_shell/i.test(dir)) continue;
      const p = path.join(base, dir, "chrome-linux", "headless_shell");
      if (fs.existsSync(p)) return p;
    }
  }
  try { return chromium.executablePath(); } catch (e) { return undefined; }
}

const PAGE_HTML = (fontUrl) => `<!doctype html><html><head><meta charset="utf-8">
<style>
  @font-face { font-family:'Cormorant'; font-weight:600; font-style:normal;
    src:url(${fontUrl}) format('woff2'); font-display:block; }
  html,body{margin:0;padding:0;background:#000;} canvas{display:block;}
</style></head><body><canvas id="cv"></canvas></body></html>`;

export async function renderFrames({ timeline, framesDir, onProgress }) {
  const { W, H, fps, duration, kind } = timeline;
  const frameCount = Math.max(1, Math.round(duration * fps));
  fs.rmSync(framesDir, { recursive: true, force: true });
  fs.mkdirSync(framesDir, { recursive: true });

  const exe = resolveChromium();
  const browser = await chromium.launch({ executablePath: exe, args: ["--no-sandbox", "--force-color-profile=srgb"] });
  try {
    const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    await page.setContent(PAGE_HTML(brandFontDataUrl()), { waitUntil: "load" });
    await page.addScriptTag({ path: path.join(__dirname, "draw.browser.js") });
    // Wait for the brand serif so the very first text frame is already correct.
    await page.evaluate(async () => { try { await document.fonts.ready; await document.fonts.load("600 48px Cormorant"); } catch (e) {} });
    await page.evaluate(({ palette, cfg }) => {
      const cv = document.getElementById("cv");
      window.SR.init(cv, palette, cfg);
    }, { palette: paletteBundle(), cfg: { W, H, font: "'Cormorant', Georgia, serif" } });

    const el = await page.$("#cv");
    // Pass the timeline in once; draw by time each frame.
    await page.evaluate((tl) => { window.__TL = tl; }, timeline);

    for (let f = 0; f < frameCount; f++) {
      const t = f / fps;
      await page.evaluate(({ t, kind, dur }) => {
        if (kind === "morph") window.SR.drawMorph(t, dur);
        else window.SR.drawScenes(t, window.__TL);
      }, { t, kind, dur: duration });
      const file = path.join(framesDir, "frame-" + String(f).padStart(6, "0") + ".png");
      await el.screenshot({ path: file });
      if (onProgress && (f % 15 === 0 || f === frameCount - 1)) onProgress(f + 1, frameCount);
    }
    return { frameCount, W, H, fps };
  } finally {
    await browser.close();
  }
}
