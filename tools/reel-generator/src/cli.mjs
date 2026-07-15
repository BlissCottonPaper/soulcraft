#!/usr/bin/env node
// ============================================================
// cli.mjs — Soulcraft Reel Generator
// ============================================================
// Two ways in:
//   CUSTOM (the product):  --audio <voiceover> --brief <brief> [--out <file>]
//     The audio drives the timeline; the brief says what happens on screen.
//   PRESET (secondary):    --mode <name> [--archetype <x>] [--text "..."]
//     Prebuilt, silent (quoteloop loops seamlessly).
//
// Output is always MP4 / H.264 / AAC / yuv420p / 1080x1920 / 30fps. Never GIF.
// ============================================================

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parseBrief } from "./brief.mjs";
import { buildTimeline } from "./timeline.mjs";
import { buildPreset, PRESET_MODES } from "./presets.mjs";
import { renderFrames } from "./render.mjs";
import { encode } from "./encode.mjs";
import { probeDuration } from "./ffmpeg.mjs";

const FULL = { W: 1080, H: 1920 };
const PREVIEW = { W: 540, H: 960 };
const AUDIO_EXT = new Set([".wav", ".mp3", ".m4a", ".aac", ".flac", ".ogg"]);

function parseArgs(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t.startsWith("--")) {
      const key = t.slice(2);
      const next = argv[i + 1];
      if (next == null || next.startsWith("--")) a[key] = true;
      else { a[key] = next; i++; }
    } else a._.push(t);
  }
  return a;
}

function slugify(s) {
  return String(s || "reel").toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "")
    .trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 48) || "reel";
}
function yyyymmdd(d = new Date()) {
  return d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0");
}

function help() {
  console.log(`Soulcraft Reel Generator — platform-ready vertical reels (1080x1920, H.264 MP4)

CUSTOM (audio-driven — the product):
  node src/cli.mjs --audio <voiceover.wav|mp3|m4a> --brief <brief.json|txt> [--out <file.mp4>]

PRESET (silent; prebuilt):
  node src/cli.mjs --mode <${PRESET_MODES.join("|")}> [--archetype <name>] [--text "..."] [--out <file.mp4>]

Options:
  --preview            fast low-res draft (540x960)
  --lead-in <sec>      silent visual intro before the voice (default 0.5)
  --tail <sec>         hold/outro after the voice (default 1.0)
  --duration <sec>     preset length override (morph/quoteloop)
  --fps <n>            frames per second (default 30)
  --crf <n>            x264 quality, lower = better (default 19)
  --slug <text>        filename slug (default from mode/subject)
  --keep-frames        keep the intermediate PNG frames
  -h, --help

Never outputs GIF. If you ask for .gif it will refuse and write .mp4 instead.`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h || (!args.mode && !args.audio && !args.brief)) { help(); process.exit(args.help || args.h ? 0 : 1); }

  // Refuse GIF, always. (Acceptance criterion.)
  const askedGif = (typeof args.out === "string" && /\.gif$/i.test(args.out)) || /gif/i.test(String(args.format || ""));
  if (askedGif) {
    console.error("✗ GIF is not a supported output — reels must be MP4 (H.264/AAC) for the platforms. Writing .mp4 instead.");
    if (typeof args.out === "string") args.out = args.out.replace(/\.gif$/i, ".mp4");
  }

  const dims = args.preview ? PREVIEW : FULL;
  const fps = Number(args.fps) > 0 ? Number(args.fps) : 30;
  const crf = Number(args.crf) > 0 ? Number(args.crf) : 19;
  const leadIn = args["lead-in"] != null ? Number(args["lead-in"]) : 0.5;
  const tail = args.tail != null ? Number(args.tail) : 1.0;

  const isPreset = !!args.mode;
  let brief, timeline, modeLabel, audioPath = null, audioDuration = null;

  if (isPreset) {
    const mode = String(args.mode).toLowerCase();
    if (!PRESET_MODES.includes(mode)) throw new Error(`Unknown --mode "${mode}". One of: ${PRESET_MODES.join(", ")}`);
    modeLabel = mode;
    const built = buildPreset(mode, { archetype: args.archetype, text: args.text, duration: args.duration && Number(args.duration) });
    if (built.kind === "morph") {
      timeline = buildTimeline({ brief: built, leadIn, tail, W: dims.W, H: dims.H, fps, kind: "morph" });
    } else {
      brief = parseBrief(built);
      timeline = buildTimeline({ brief, leadIn, tail, W: dims.W, H: dims.H, fps, kind: "scenes" });
    }
  } else {
    // CUSTOM — requires both audio and brief.
    if (!args.audio || !args.brief) throw new Error("CUSTOM mode needs both --audio and --brief.");
    audioPath = path.resolve(String(args.audio));
    if (!fs.existsSync(audioPath)) throw new Error("Audio file not found: " + audioPath);
    if (!AUDIO_EXT.has(path.extname(audioPath).toLowerCase())) throw new Error("Unsupported audio type: " + path.extname(audioPath));
    if (!fs.existsSync(String(args.brief))) throw new Error("Brief file not found: " + args.brief);
    modeLabel = "custom";
    brief = parseBrief(String(args.brief));
    audioDuration = await probeDuration(audioPath);
    timeline = buildTimeline({ brief, audioDuration, leadIn, tail, W: dims.W, H: dims.H, fps, kind: "scenes" });
  }

  // Resolve the output path (filename convention when not given).
  const slug = slugify(args.slug || args.archetype || (brief && brief.title) || modeLabel);
  let out = args.out && typeof args.out === "string"
    ? path.resolve(args.out)
    : path.resolve(process.cwd(), `soulcraft-reel-${modeLabel}-${slug}-${yyyymmdd()}${args.preview ? "-preview" : ""}.mp4`);
  if (!/\.mp4$/i.test(out)) out += ".mp4";
  fs.mkdirSync(path.dirname(out), { recursive: true });

  const framesDir = fs.mkdtempSync(path.join(os.tmpdir(), "sc-reel-"));
  const started = Date.now();
  console.log(`▶ ${modeLabel}${args.preview ? " (preview)" : ""} · ${dims.W}x${dims.H} · ${fps}fps · ${timeline.duration.toFixed(2)}s` +
    (audioDuration != null ? ` · audio ${audioDuration.toFixed(2)}s (+${leadIn}s lead / +${tail}s tail)` : " · silent"));

  await renderFrames({
    timeline, framesDir,
    onProgress: (n, total) => process.stdout.write(`\r  rendering frames ${n}/${total}`),
  });
  process.stdout.write("\n");

  await encode({
    framesDir, fps, out, audioPath, audioOffset: timeline.audioOffset || 0,
    duration: timeline.duration, crf,
  });

  if (!args["keep-frames"]) fs.rmSync(framesDir, { recursive: true, force: true });

  const size = fs.statSync(out).size;
  console.log(`✔ ${out}`);
  console.log(`  ${(size / 1048576).toFixed(2)} MB · ${((Date.now() - started) / 1000).toFixed(1)}s${args["keep-frames"] ? " · frames: " + framesDir : ""}`);
}

main().catch((e) => { console.error("\n✗ " + (e && e.message ? e.message : e)); process.exit(1); });
