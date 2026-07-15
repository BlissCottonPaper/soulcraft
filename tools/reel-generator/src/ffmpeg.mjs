// ============================================================
// ffmpeg.mjs — locate a real ffmpeg/ffprobe and probe audio duration
// ============================================================
// Resolution order (first hit wins), so the tool works both on a contributor's
// machine and in CI without config:
//   1. FFMPEG_PATH / FFPROBE_PATH env vars (explicit override)
//   2. the ffmpeg-static / ffprobe-static npm packages (auto-installed deps)
//   3. a system `ffmpeg` / `ffprobe` on PATH
//
// H.264 (libx264) + AAC are REQUIRED (see the output spec). ffmpeg-static ships a
// full build with both; a system ffmpeg must have them too.
// ============================================================

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";

const execFileP = promisify(execFile);

async function fromPackage(pkg) {
  try {
    const m = await import(pkg);
    const p = m.default && (m.default.path || m.default);
    if (typeof p === "string" && fs.existsSync(p)) return p;
    if (typeof m.path === "string" && fs.existsSync(m.path)) return m.path;
  } catch (e) { /* not installed */ }
  return null;
}

async function onPath(bin) {
  try {
    const { stdout } = await execFileP(process.platform === "win32" ? "where" : "which", [bin]);
    const p = stdout.split(/\r?\n/).find(Boolean);
    return p && fs.existsSync(p) ? p : null;
  } catch (e) { return null; }
}

let _ffmpeg, _ffprobe;

export async function resolveFfmpeg() {
  if (_ffmpeg) return _ffmpeg;
  _ffmpeg =
    (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH) && process.env.FFMPEG_PATH) ||
    (await fromPackage("ffmpeg-static")) ||
    (await onPath("ffmpeg"));
  if (!_ffmpeg) {
    throw new Error(
      "No ffmpeg found. Install the optional dep (npm i ffmpeg-static), set FFMPEG_PATH, or put ffmpeg on PATH. H.264 + AAC support is required."
    );
  }
  return _ffmpeg;
}

export async function resolveFfprobe() {
  if (_ffprobe) return _ffprobe;
  _ffprobe =
    (process.env.FFPROBE_PATH && fs.existsSync(process.env.FFPROBE_PATH) && process.env.FFPROBE_PATH) ||
    (await fromPackage("ffprobe-static")) ||
    (await onPath("ffprobe"));
  return _ffprobe; // may be null — probeDuration falls back to ffmpeg
}

// Audio duration in seconds. Prefer ffprobe; fall back to parsing ffmpeg -i.
export async function probeDuration(audioPath) {
  const probe = await resolveFfprobe();
  if (probe) {
    try {
      const { stdout } = await execFileP(probe, [
        "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", audioPath,
      ]);
      const d = parseFloat(String(stdout).trim());
      if (Number.isFinite(d) && d > 0) return d;
    } catch (e) { /* fall through */ }
  }
  // Fallback: ffmpeg prints "Duration: HH:MM:SS.xx" to stderr.
  const ff = await resolveFfmpeg();
  try {
    await execFileP(ff, ["-i", audioPath]);
  } catch (e) {
    const m = String(e.stderr || "").match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
    if (m) return (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]);
  }
  throw new Error("Could not read audio duration from " + audioPath);
}

export { execFileP };
