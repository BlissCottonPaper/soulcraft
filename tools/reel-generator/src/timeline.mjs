// ============================================================
// timeline.mjs — the audio drives the clock
// ============================================================
// Given a parsed brief and (optionally) the voiceover duration, place every scene
// on the timeline. THE AUDIO IS THE SPINE: total = audioDuration + leadIn + tail,
// the voice plays across the content window, and scenes are distributed across
// that window — proportionally by weight unless a scene pins its own pct/at + dur.
//
// Returns a fully-resolved timeline the renderer and encoder both read.
// ============================================================

const CF = 0.45;          // default cross-fade (seconds) between adjacent scenes
const MIN_SCENE = 1.2;    // don't let a proportional scene get shorter than this

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

// Build the scene schedule inside [contentStart, contentEnd].
function schedule(scenes, contentStart, contentEnd, leadIn, tail) {
  const available = Math.max(0.1, contentEnd - contentStart);
  const totalW = scenes.reduce((n, s) => n + (s.weight || 1), 0) || 1;

  let cursor = contentStart;
  const placed = scenes.map((s, i) => {
    let start, dur;
    if (s.at != null) start = s.at;
    else if (s.pct != null) start = contentStart + clamp(s.pct, 0, 1) * available;
    else start = cursor;
    if (s.dur != null) dur = s.dur;
    else dur = Math.max(MIN_SCENE, (available * (s.weight || 1)) / totalW);
    const end = start + dur;
    cursor = Math.max(cursor, end);
    return { ...s, start, end, index: i };
  });

  // Fade envelopes: first scene rises over the lead-in, last falls over the tail;
  // internal joins cross-fade by CF so layers dissolve into each other.
  const n = placed.length;
  return placed.map((s, i) => ({
    ...s,
    fadeIn: i === 0 ? Math.max(leadIn, 0.35) + CF * 0.5 : CF,
    fadeOut: i === n - 1 ? Math.max(tail, 0.5) + CF * 0.5 : CF,
  }));
}

export function buildTimeline({ brief, audioDuration = null, leadIn = 0.5, tail = 1.0, W, H, fps, kind = "scenes" }) {
  // Morph is a continuous animation, not a scene list — it carries its own clock.
  if (kind === "morph") {
    const duration = (brief && brief.duration) || 22.0;
    return { kind: "morph", W, H, fps, duration, leadIn, tail, audio: null, loop: false, scenes: [], title: brief && brief.title, mood: "dark" };
  }

  const scenes = (brief.scenes || []);
  // Content length: the voiceover if we have it, else the brief's own default, else
  // a sensible fallback scaled to the number of scenes.
  const contentLen = audioDuration != null
    ? audioDuration
    : (brief.duration || Math.max(6, scenes.length * 3));

  const total = contentLen + leadIn + tail;
  const contentStart = leadIn;
  const contentEnd = total - tail;

  const placed = scenes.length
    ? schedule(scenes, contentStart, contentEnd, leadIn, tail)
    : [];

  return {
    kind: "scenes",
    W, H, fps,
    duration: total,
    leadIn, tail,
    audioOffset: audioDuration != null ? leadIn : 0,   // where the voice starts
    audioDuration,
    loop: !!brief.loop,
    kicker: brief.kicker || null,
    title: brief.title || null,
    mood: brief.mood || "dark",
    scenes: placed,
  };
}
