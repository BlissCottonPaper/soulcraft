/* ============================================================================
   THE ART OF SOULCRAFT — TOOLTIP / POPOVER DEFINITIONS (single source of truth)
   ----------------------------------------------------------------------------
   The corrected, final definitions (July 2026). Any term wrapped as
   <span class="tooltip-trigger" data-term="KEY">…</span> gets its popover from
   the entry keyed by KEY here. Update a definition once, here, and it updates
   everywhere on the site. The runtime that reads this file and wires the
   click-to-open behavior lives in /assets/tooltip.js.

   Rule of application (from the master file):
     • ALWAYS on first use of a term on a page where it isn't the page's focus.
     • NEVER on the dedicated Explore page for that concept (the page IS the def).
     • NEVER in headers or nav labels.
     • The five Bandwidth stage names get a tooltip on every instance across the
       site (results, print, archetype pages) — users meet them in many contexts.
   ============================================================================ */
(function (root, factory) {
  var data = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = data;            // Node (the build generator, if it needs it)
  } else {
    root.TOOLTIPS = data;             // browser namespace — read by /assets/tooltip.js
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  return {
    soulcraft: {
      title: "Soulcraft",
      def: "The practice of making the unconscious conscious — understanding the patterns driving you so you can choose, rather than just react."
    },
    mandala: {
      title: "Mandala",
      def: "Sanskrit for “the cosmos” — used across traditions as a map of wholeness. Your Mandala shows which of the twelve archetypal voices are loudest in you, which are quietest, and how they relate to each other."
    },
    archetypes: {
      title: "The Twelve Archetypes",
      def: "Twelve fundamental patterns of human motivation. You carry all twelve — some speak louder than others. The assessment reveals your personal ranking, from the voices that drive you most to the ones that are quietest and least integrated."
    },
    bandwidth: {
      title: "Bandwidth",
      def: "How much of yourself you have available right now, determined by how well your six Core Human Needs are being met — belonging, autonomy, competence, self-esteem, trust, and purpose. Every archetype can be lived from five places: contracted and fear-driven at one end, expansive and in service of others at the other."
    },
    transcendent: {
      title: "Transcendent",
      def: "Full expansion — Core Human Needs so well met that energy flows outward freely, from abundance rather than obligation. The gift in service of others or the whole, not withheld for self-protection. The highest expression of Bandwidth."
    },
    ascended: {
      title: "Ascended",
      def: "Mature and integrated — no longer fear-driven, operating from a growing state of abundance. Competent and genuinely good at being yourself, with enough to give as well as receive."
    },
    base: {
      title: "Base",
      def: "The default gear — everyday, unexamined, automatic. Where most people spend most of their time. Where the work of Soulcraft begins: noticing which archetype is running the moment, and choosing whether to let it run."
    },
    descended: {
      title: "Descended",
      def: "Fear has bent the gift — defensive and self-protective, the archetype grasping rather than giving. The original longing is still there but anxious rather than generous. Where most everyday conflict lives."
    },
    devolved: {
      title: "Devolved",
      def: "Maximum contraction — Core Human Needs so depleted that all available energy goes toward self-protection. The original gift is unrecognizable, serving only survival, often at direct cost to others."
    },
    temperament: {
      title: "Temperament",
      def: "Your first natural impulse — the way you instinctively take in the world before deliberate thought kicks in. Not a type or a box. A lean. There are four: Heart, Mind, Body, and Soul. You didn't choose yours, but you can develop the quieter ones."
    },
    heart: {
      title: "Heart",
      def: "Feeling first. Something happens and the Heart-led person's whole system responds emotionally before anything else engages. Presence, warmth, and relational attunement are native here."
    },
    mind: {
      title: "Mind",
      def: "Thinking first. The instinct is to understand before anything else — clarity as the first move, feeling processed only afterward, if at all in the moment."
    },
    body: {
      title: "Body",
      def: "Doing first. The system reaches for action — the hands, the movement, the concrete task — before words or feelings have caught up."
    },
    soul: {
      title: "Soul",
      def: "Meaning first. The first question, often unconscious, is: what does this mean? Reaching for significance before urgency or emotion. Grounded in Frankl's logotherapy — the will to meaning as a primary human drive."
    },
    pairings: {
      title: "Mindsets",
      def: "What emerges when two archetypes combine in one person. There are 66 named Mindsets in the system — each one a distinct pattern that neither archetype produces alone. Your top three archetypes generate three Mindsets, which appear in your Mandala results."
    },
    shadow: {
      title: "Shadow",
      def: "The parts of yourself that haven't been integrated — usually your quietest archetypes, the energies you've disowned or never developed. They tend to show up as your strongest reactions to other people: the quality that frustrates or baffles you most in someone else is often a voice in you that hasn't been given room to speak."
    },
    "shadow-mandala": {
      title: "Shadow Mandala",
      def: "Your three quietest archetypes, read as disowned material. Not a diagnosis — a mirror. Shows where unintegrated energy is living, and what becomes available when you stop fighting it."
    },
    "growth-edge": {
      title: "Growth Edge",
      def: "The archetype directly opposite your loudest voice on the wheel. Because you answer the same fundamental question from opposite ends, developing your growth edge is the most direct path to integration. It's the voice most foreign to you — and the one most worth learning to hear."
    },
    threshold: {
      title: "The Threshold",
      def: "The crossing between one version of yourself and the next. Not a stage on the Bandwidth ladder — the liminal space between stages, where the old strategy has stopped working but the new one hasn't formed yet. Growth lives here. So does discomfort. Like the phoenix, we emerge from the ashes — but first, we have to burn."
    },
    "core-needs": {
      title: "Core Human Needs",
      def: "Six fundamental psychological needs whose fulfillment determines your Bandwidth: belonging, autonomy, competence, self-esteem, trust, and purpose. When these are depleted, your Bandwidth contracts. When they're resourced, it expands. Drawn from Self-Determination Theory (Deci & Ryan) and Elena Aguilar's synthesis."
    },
    integration: {
      title: "Integration",
      def: "The ongoing work of bringing the unconscious into consciousness — developing quieter voices, crossing Thresholds, and moving from knowing yourself to actually living from that knowledge. The destination is the white dot at the center of the Mandala: all twelve voices in concert, no one dominating."
    },
    wheel: {
      title: "The Wheel",
      def: "The twelve archetypes arranged as twelve points around a circle, with opposites facing each other. Your position on the wheel determines your growth edge and which of the six axis questions most defines your experience."
    },
    axis: {
      title: "The Axis / Axis Questions",
      def: "Six fundamental questions that organize the wheel. Each archetype lives at one end of one question — and your growth edge lives at the other end of the same question. The question your archetype is built around answering is its Lifelong Question."
    },
    "quietest-voice": {
      title: "Quietest Voice",
      def: "Your lowest-ranked archetype — the energy most likely to appear as a strong reaction to others rather than as a recognized part of yourself."
    },
    // The twelve archetypes — a one-line essence each (longing + defining descriptors).
    lover: { title: "The Lover", def: "Longs for union. Passionate, devoted, sensual — it believes connection is what makes life worth living." },
    caregiver: { title: "The Caregiver", def: "Longs to nurture. Nurturing, supportive, selfless — it feels most itself tending to what someone else needs." },
    everyman: { title: "The Everyman", def: "Longs to belong. Approachable, down-to-earth, inclusive — it wants to be an equal part of the group, not set above it." },
    ruler: { title: "The Ruler", def: "Longs for order. Authoritative, decisive, responsible — it steps in to structure, decide, and steward." },
    warrior: { title: "The Warrior", def: "Longs to protect. Determined, courageous, protective — it stands between danger and whatever it has sworn to defend." },
    creator: { title: "The Creator", def: "Longs to bring forth. Imaginative, artistic, expressive — it can't rest until the unseen is made real." },
    sage: { title: "The Sage", def: "Longs for truth. Analytical, reflective, insightful — it trusts evidence over comfort." },
    explorer: { title: "The Explorer", def: "Longs for freedom. Adventurous, independent, restless — it needs room to roam and discover." },
    rebel: { title: "The Rebel", def: "Longs for justice. Defiant, nonconformist, outspoken — it questions what's unfair, dead, or oppressive." },
    trickster: { title: "The Trickster", def: "Longs for revelation. Playful, mischievous, irreverent — it exposes what's fake or stuck through humor." },
    innocent: { title: "The Innocent", def: "Longs for trust. Hopeful, trusting, optimistic — it believes goodness is the truer story underneath." },
    mystic: { title: "The Mystic", def: "Longs for communion with mystery. Intuitive, otherworldly, contemplative — it senses depth beneath ordinary life." }
  };
});
