// ============================================================
// encode.mjs — mux frames (+ audio) into a platform-ready MP4
// ============================================================
// HARD output contract (acceptance criteria):
//   MP4 · H.264 (libx264) · AAC audio · yuv420p · 30fps · CRF ~18-20 · +faststart
// The frames are already the target resolution (1080x1920, or 540x960 preview),
// so no scaling here. The audio (when present) starts at the lead-in offset and is
// padded/trimmed to the exact video length; the video is always the master clock.
// GIF is never an output.
// ============================================================

import path from "node:path";
import { spawn } from "node:child_process";
import { resolveFfmpeg } from "./ffmpeg.mjs";

function run(bin, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(bin, args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => { err += d.toString(); });
    p.on("error", reject);
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error("ffmpeg exited " + code + "\n" + err.slice(-1600)))));
  });
}

export async function encode({ framesDir, fps, out, audioPath = null, audioOffset = 0, duration, crf = 19 }) {
  const ffmpeg = await resolveFfmpeg();
  const pattern = path.join(framesDir, "frame-%06d.png");

  const args = ["-y", "-framerate", String(fps), "-i", pattern];
  if (audioPath) args.push("-i", audioPath);

  // Video: H.264 / yuv420p, quality by CRF, fast-start for progressive playback.
  args.push(
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-crf", String(crf),
    "-preset", "medium",
    "-r", String(fps),
    "-movflags", "+faststart"
  );

  if (audioPath) {
    // Delay the voice to the lead-in, pad the tail with silence, cap to video length.
    const delayMs = Math.max(0, Math.round(audioOffset * 1000));
    args.push(
      "-af", `adelay=${delayMs}:all=1,apad`,
      "-c:a", "aac", "-b:a", "192k",
      "-map", "0:v:0", "-map", "1:a:0",
      "-t", String(duration)
    );
  } else {
    args.push("-an", "-t", String(duration));
  }

  args.push(out);
  await run(ffmpeg, args);
  return out;
}

// A tiny, valid silent AAC/MP4-friendly audio isn't needed: presets encode with
// no audio track (-an). Exported for callers that want to be explicit.
export const SILENT = null;
