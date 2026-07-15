// ============================================================
// presets.mjs — prebuilt briefs for the secondary modes
// ============================================================
// Same pipeline as CUSTOM, just briefs the tool authors itself from the system's
// own content. All presets run with NO audio (silent). quoteloop is authored to
// loop seamlessly (text fades fully in and out, mandala persists).
//
// buildPreset(mode, opts) -> a brief object (parseBrief-compatible), or the
// special { kind: "morph" } marker for the master build.
// ============================================================

import { findArchetype, ARCHETYPES } from "./palette.mjs";

const longs = (a) => (a.longingVerb ? "longs to " : "longs for ") + a.longing;

export const PRESET_MODES = [
  "morph", "spotlight", "quoteloop", "axial", "mindset",
  "bandwidth", "sixplusone", "pattern", "definition",
];

export function buildPreset(mode, opts = {}) {
  switch (mode) {
    case "morph":
      return { kind: "morph", title: "Mandala Morph", duration: opts.duration || 22 };

    case "spotlight": {
      const a = findArchetype(opts.archetype);
      if (!a) throw new Error("spotlight needs a valid --archetype (e.g. Warrior). Got: " + opts.archetype);
      return {
        title: "Spotlight — " + a.name,
        kicker: "the twelve",
        mood: "dark",
        scenes: [
          { text: ["Twelve voices.", "One of them is loudest in you."], elements: ["mandala", "center"], weight: 1 },
          { text: ["The " + a.name + "."], elements: ["bandwidth", "center"], ignite: a.name, mood: "bright", weight: 1.2 },
          { text: ["It " + longs(a) + "."], elements: ["bandwidth"], ignite: a.name, weight: 1 },
          { text: ["Which voice is loudest in you?"], elements: ["mandala", "center"], mood: "bright", weight: 1 },
        ],
      };
    }

    case "quoteloop": {
      const text = (opts.text && String(opts.text)) || "You are not one of twelve types. You are all twelve.";
      const lines = text.split(/\s*\|\s*|\s*\/\/\s*/).filter(Boolean);
      return {
        title: "Quote Loop",
        loop: true,
        mood: "bright",
        duration: opts.duration || 10,
        scenes: [
          { text: lines, elements: ["mandala", "center", "halo"], weight: 1 },
        ],
      };
    }

    case "axial": {
      // A pole (or its default) and its fixed opposite draw the tension.
      const a = findArchetype(opts.archetype) || findArchetype("Lover");
      const b = findArchetype(a.opposite);
      const q = opts.text || "Do you trust what you feel, or what you can prove?";
      return {
        title: "Axial — " + a.name + " ↔ " + b.name,
        kicker: "the axes",
        scenes: [
          { text: [a.name], elements: ["mandala", "center"], ignite: a.name, mood: "bright", weight: 1 },
          { text: [b.name], elements: ["mandala", "center"], ignite: b.name, mood: "bright", weight: 1 },
          { text: [q], elements: ["mandala", "center"], weight: 1.4 },
        ],
      };
    }

    case "mindset": {
      const a = findArchetype(opts.archetype) || ARCHETYPES[0];
      const q = opts.text || "What emerges when two voices meet?";
      return {
        title: "Mindset Reveal",
        kicker: "mindsets",
        scenes: [
          { text: ["Two voices."], elements: ["mandala", "center"], weight: 1 },
          { text: ["Drift. Orbit. Fuse."], elements: ["mindsets", "center"], mood: "bright", weight: 1.2 },
          { text: [q], elements: ["mindsets", "center"], weight: 1 },
        ],
      };
    }

    case "bandwidth": {
      const a = findArchetype(opts.archetype);
      const ig = a ? a.name : null;
      return {
        title: "Bandwidth Ladder" + (a ? " — " + a.name : ""),
        kicker: "bandwidth",
        scenes: [
          { text: ["Devolved."], elements: ["bandwidth"], ignite: ig, weight: 1 },
          { text: ["Descended."], elements: ["bandwidth"], ignite: ig, weight: 1 },
          { text: ["Base."], elements: ["bandwidth"], ignite: ig, weight: 1 },
          { text: ["Ascended."], elements: ["bandwidth"], ignite: ig, mood: "bright", weight: 1 },
          { text: ["Transcendent."], elements: ["bandwidth", "center"], ignite: ig, mood: "bright", weight: 1 },
          { text: ["Same voice.", "More light."], elements: ["bandwidth", "center"], mood: "bright", weight: 1.2 },
        ],
      };
    }

    case "sixplusone":
      return {
        title: "Six-Plus-One",
        kicker: "core human needs",
        scenes: [
          { text: ["Six needs are the soil."], elements: ["mandala", "center"], weight: 1 },
          { text: ["Autonomy. Competence.", "Relatedness. Self-esteem.", "Trust. Purpose."], elements: ["mandala", "center"], weight: 1.4 },
          { text: ["The needs are the soil."], elements: ["center", "halo"], mood: "bright", weight: 1 },
          { text: ["Volition is the seed."], elements: ["center", "halo"], mood: "bright", weight: 1.2 },
        ],
      };

    case "pattern": {
      // Atlas-style: name / a recognizable line / the gift trapped inside.
      // Text-driven so it can be fed straight from an Atlas row (pipe-separated).
      const parts = (opts.text || "Catastrophizing | “If I picture the worst, it can’t blindside me.” | The gift: foresight, when it stops bracing for disaster.")
        .split(/\s*\|\s*/).filter(Boolean);
      return {
        title: "Pattern — " + (parts[0] || "Recognition"),
        kicker: "protective patterns",
        scenes: parts.map((p, i) => ({
          text: [p], elements: i === parts.length - 1 ? ["center", "halo"] : ["mandala", "center"],
          mood: i === parts.length - 1 ? "bright" : "dark", weight: i === 1 ? 1.4 : 1,
        })),
      };
    }

    case "definition": {
      const parts = (opts.text || "Autonomy is not independence. | It is choosing what you’re already bound to.")
        .split(/\s*\|\s*/).filter(Boolean);
      return {
        title: "Definition",
        kicker: "definitions",
        scenes: parts.map((p, i) => ({
          text: [p], elements: ["mandala", "center"],
          mood: i === parts.length - 1 ? "bright" : "dark", weight: 1,
        })),
      };
    }

    default:
      throw new Error("Unknown preset mode: " + mode);
  }
}
