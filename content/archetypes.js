/* ============================================================================
   ARCHETYPE CHAPTER CONTENT — prose transcribed from the Notion canon
   ("Archetype Profiles — The Twelve Chapters"). Source of truth for the PROSE
   only. Structural data (names, stage ladder names, Embodiment names, the 66
   Pairing names, longing, opposite, hue) comes from /assets/soulcraft-data.js
   and is merged in by the generator — never duplicate those here.

   Per archetype:
     overview, motivations, coreWound, fears, addictions, traits, blindSpots,
     dreams  — prose paragraphs
     stages[]     — "what it looks like" per Bandwidth stage, index 0..4
                    (Devolved, Descended, Base, Ascended, Transcendent)
     embodiments  — one line per channel (heart/mind/body/soul), the Base read
     pairings     — one line per partner archetype key (this archetype leading)
   Pull real chapter text; do not summarize or invent. Add archetypes as their
   chapters are transcribed; the generator only builds pages that exist here.
   ============================================================================ */
"use strict";

module.exports = {
  sage: {
    coreWoundShort: "being deceived",
    overview: "The Sage is organized around understanding — the conviction that most suffering comes from not seeing clearly, and that truth, however uncomfortable, is worth more than comfortable illusion. Where the Lover trusts feeling, the Sage trusts evidence. This is the archetype of the examined life, taken seriously.",
    motivations: "To understand how things actually work, beneath appearances. To think clearly rather than react. To share what it has learned so others don't have to learn it the hard way.",
    coreWound: "The fear underneath the Sage's rigor is being fooled — believing something false and not realizing it. This wound explains both its gift (relentless honesty with itself and others) and its danger (a defensive certainty that can shade into refusing to be moved by anything, including good evidence, once it's decided).",
    fears: "Being fooled. Believing something false without realizing it. Being wrong in public. Discovering its own certainty was itself a kind of blindness.",
    addictions: "The longing for truth, rerouted into: being right as identity rather than truth as the goal, intellectual superiority used to avoid real intimacy, endless analysis substituting for the discomfort of actually deciding or acting.",
    traits: "Curious, reflective, values evidence over assertion, comfortable being alone with a problem, often more at ease with ideas than with feelings.",
    blindSpots: "Can use understanding as distance — a way to stay safely outside of what it's examining. May mistake cleverness for wisdom. Struggles to act under uncertainty, since acting always means committing before all the evidence is in.",
    dreams: "To understand something true and important before it dies. To pass on real insight, not just information. To be trusted not because it's always right, but because it's always honest.",
    stages: [
      "Being right as identity; truth used to win arguments rather than to understand. Truth fully collapsed into ego-status.",
      "A disappointed idealist — truth curdled into blanket contempt for everyone and everything. Still fear-reacting, not yet fully ego-captured.",
      "Everyday Sage — seeks to understand how things work, values insight over quick answers.",
      "Mature understanding — shares insight generously, holds certainty loosely.",
      "Teaches not to be right, but to set someone else free — wisdom entirely at others' service."
    ],
    embodiments: {
      heart: "seeks truth in people, through real attention",
      mind: "takes truth apart, piece by piece",
      body: "learns by hand — knowledge that can't be read",
      soul: "literally, “lover of wisdom” — truth pursued as devotion"
    },
    pairings: {
      lover: "the axis bridge — feeling that understands, understanding that feels",
      caregiver: "diagnosis fused with tending",
      everyman: "everyday wisdom, spoken in the common tongue",
      ruler: "order weighed by truth",
      warrior: "discipline and knowledge under arms",
      creator: "understanding that builds something new",
      explorer: "truth sought by expedition, in the field rather than the library",
      rebel: "chooses its own truth over inherited orthodoxy",
      trickster: "teaches by irritating complacent certainty, like Socrates himself",
      innocent: "beginner's mind — truth approached with awe rather than defense",
      mystic: "carries direct communion back as living, usable truth"
    }
  }
};
