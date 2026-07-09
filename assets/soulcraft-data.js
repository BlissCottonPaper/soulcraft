/* ============================================================================
   THE ART OF SOULCRAFT — CANONICAL DATA (single source of truth)
   ----------------------------------------------------------------------------
   The archetypes (names, longings, five-stage Bandwidth ladders), the 66
   Pairing names, and the Temperament/temperament data live HERE and nowhere else.
   Consumed by BOTH:
     • the assessment (index.html) — via the browser globals below
     • the Explore content pages   — baked at build time by /build/generate.js
   Keep it in sync with the Notion canon; never hand-duplicate this data into a
   page. Changing a name here updates the assessment and the content site at once.
   ============================================================================ */
(function (root, factory) {
  var data = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = data;                     // Node (the build generator)
  } else {
    root.SOULCRAFT = data;                      // browser namespace
    // Back-compat globals so index.html's existing references keep working as-is:
    root.ARCHETYPES = data.ARCHETYPES;
    root.STAGE_NAMES = data.STAGE_NAMES;
    root.STAGE_LIGHT = data.STAGE_LIGHT;
    root.HUE = data.HUE;
    root.BLEND_NAMES = data.BLEND_NAMES;
    root.BLEND_TEXTURES = data.BLEND_TEXTURES;
    root.TEMPERAMENT_EXPRESSIONS = data.TEMPERAMENT_EXPRESSIONS;
    root.TEMPERAMENTS = data.TEMPERAMENTS;
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var ARCHETYPES = [
    { key: "lover", name: "Lover", clock: 12, longing: "union", statement: "I'm drawn to deep connection and beauty, and I pour my heart into the people and passions I cherish.", descriptors: ["passionate", "devoted", "sensual"], stages: ["Possessor", "Craver", "Romantic", "Devoted", "Beloved"], opposite: "Sage" },
    { key: "caregiver", name: "Caregiver", clock: 1, longing: "nurture", longingVerb: true, statement: "I naturally take responsibility for others' needs and feel fulfilled when I'm supporting people.", descriptors: ["nurturing", "supportive", "selfless"], stages: ["Enabler", "Martyr", "Helper", "Nurturer", "Restorer"], opposite: "Explorer" },
    { key: "everyman", name: "Everyman", clock: 2, longing: "belong", longingVerb: true, statement: "I feel most myself when I'm part of a down-to-earth group where everyone is equal and included.", descriptors: ["approachable", "down-to-earth", "inclusive"], stages: ["Self-Eraser", "People-Pleaser", "Neighbor", "Relater", "Bridge-Builder"], opposite: "Rebel" },
    { key: "ruler", name: "Ruler", clock: 3, longing: "order", statement: "I instinctively step in to organize, decide, and take charge so things feel stable and secure.", descriptors: ["authoritative", "decisive", "responsible"], stages: ["Tyrant", "Micromanager", "Organizer", "Custodian", "Sovereign"], opposite: "Trickster" },
    { key: "warrior", name: "Warrior", clock: 4, longing: "protect", longingVerb: true, statement: "I'm driven to face challenges head-on and protect what matters, even when it costs me.", descriptors: ["determined", "courageous", "protective"], stages: ["Oppressor", "Mercenary", "Fighter", "Champion", "Guardian"], opposite: "Innocent" },
    { key: "creator", name: "Creator", clock: 5, longing: "bring forth", longingVerb: true, statement: "I feel compelled to make things — ideas, art, solutions — that express my inner vision in the world.", descriptors: ["imaginative", "artistic", "expressive"], stages: ["Destroyer", "Perfectionist", "Maker", "Artisan", "Alchemist"], opposite: "Mystic" },
    { key: "sage", name: "Sage", clock: 6, longing: "truth", statement: "I'm always seeking to understand how things work, and I value truth and insight more than quick answers.", descriptors: ["analytical", "reflective", "insightful"], stages: ["Know-It-All", "Cynic", "Student", "Mentor", "Elder"], opposite: "Lover" },
    { key: "explorer", name: "Explorer", clock: 7, longing: "freedom", statement: "I crave freedom and new experiences, and I feel alive when I'm venturing beyond the familiar.", descriptors: ["adventurous", "independent", "restless"], stages: ["Deserter", "Escapist", "Wanderer", "Pathfinder", "Trailblazer"], opposite: "Caregiver" },
    { key: "rebel", name: "Rebel", clock: 8, longing: "justice", statement: "When a system feels unfair or oppressive, I feel compelled to question it and push for change.", descriptors: ["defiant", "nonconformist", "outspoken"], stages: ["Nihilist", "Contrarian", "Questioner", "Challenger", "Liberator"], opposite: "Everyman" },
    { key: "trickster", name: "Trickster", clock: 9, longing: "revelation", statement: "I love poking holes in rigid rules and using humor or mischief to expose what's fake or stuck.", descriptors: ["playful", "mischievous", "irreverent"], stages: ["Saboteur", "Deceiver", "Jokester", "Innovator", "Truth-Teller"], opposite: "Ruler" },
    { key: "innocent", name: "Innocent", clock: 10, longing: "trust", longingVerb: true, statement: "I believe things will work out if I stay true to what feels honest, kind, and good.", descriptors: ["hopeful", "trusting", "optimistic"], stages: ["Bitter Exile", "Avoider", "Believer", "Realist", "Wounded Healer"], opposite: "Warrior" },
    { key: "mystic", name: "Mystic", clock: 11, longing: "communion with mystery", statement: "I sense deeper layers beneath ordinary life and am drawn to silence, symbolism, and inner experience.", descriptors: ["intuitive", "otherworldly", "contemplative"], stages: ["Unmoored", "Drifter", "Dreamer", "Seer", "Conduit"], opposite: "Creator" }
  ];

  var STAGE_NAMES = ["Devolved", "Descended", "Base", "Ascended", "Transcendent"];
  var STAGE_LIGHT = [30, 42, 55, 67, 79];       // lightness per stage — the light axis, literally
  var HUE = function (i) { return i * 30; };    // wheel position = hue; opposites are complementary colors

  var BLEND_NAMES = {
    "caregiver|lover": "The Cherisher", "everyman|lover": "The Host", "lover|ruler": "The Hearthkeeper", "lover|warrior": "The Knight",
    "creator|lover": "The Bard", "lover|sage": "The Counselor", "explorer|lover": "The Bon Vivant", "lover|rebel": "The Wildheart",
    "lover|trickster": "The Flirt", "innocent|lover": "The Faithful", "lover|mystic": "The Devout",
    "caregiver|everyman": "The Good Neighbor", "caregiver|ruler": "The Steward", "caregiver|warrior": "The Protector",
    "caregiver|creator": "The Cultivator", "caregiver|sage": "The Healer", "caregiver|explorer": "The Shepherd",
    "caregiver|rebel": "The Samaritan", "caregiver|trickster": "The Merrymaker", "caregiver|innocent": "The Gentleheart", "caregiver|mystic": "The Midwife",
    "everyman|ruler": "The Mayor", "everyman|warrior": "The Citizen-Soldier", "creator|everyman": "The Folk Artist",
    "everyman|sage": "The Folk Sage", "everyman|explorer": "The Sojourner", "everyman|rebel": "The Folk Hero",
    "everyman|trickster": "The Rascal", "everyman|innocent": "The Salt-of-the-Earth", "everyman|mystic": "The Everyday Mystic",
    "ruler|warrior": "The General", "creator|ruler": "The Architect", "ruler|sage": "The Judge", "explorer|ruler": "The Founder",
    "rebel|ruler": "The Revolutionary", "ruler|trickster": "The Gamemaster", "innocent|ruler": "The Benevolent",
    "mystic|ruler": "The Visionary", // ascended reading — same pair's shadow reading is "The Priest" (institution over insight)
    "creator|warrior": "The Smith", "sage|warrior": "The Master-at-Arms", "explorer|warrior": "The Ranger",
    "rebel|warrior": "The Freedom Fighter", "trickster|warrior": "The Rogue", "innocent|warrior": "The Gentle Giant", "mystic|warrior": "The Warrior-Monk",
    "creator|sage": "The Inventor", "creator|explorer": "The Cartographer", "creator|rebel": "The Iconoclast",
    "creator|trickster": "The Satirist", "creator|innocent": "The Wonderworker", "creator|mystic": "The Magician",
    "explorer|sage": "The Naturalist", "rebel|sage": "The Heretic", "sage|trickster": "The Gadfly",
    "innocent|sage": "The Wonderer", "mystic|sage": "The Shaman",
    "explorer|rebel": "The Maverick", "explorer|trickster": "The Stowaway", "explorer|innocent": "The Wide-Eyed Wanderer", "explorer|mystic": "The Pilgrim",
    "rebel|trickster": "The Provocateur", "innocent|rebel": "The Emperor's Child", "mystic|rebel": "The Prophet",
    "innocent|trickster": "The Imp", "mystic|trickster": "The Shapeshifter",
    "innocent|mystic": "The Holy Innocent"
  };

  // One-line "texture" of each pairing, verbatim from The 66 — Blend Lexicon.
  // Only pairings with a real description in Notion are listed; the rest are
  // intentionally absent so the results show nothing rather than a filler line.
  var BLEND_TEXTURES = {
    "everyman|lover": "warmth as hospitality",
    "lover|warrior": "devotion under arms",
    "creator|lover": "feeling given voice",
    "lover|sage": "feeling that understands, understanding that feels",
    "explorer|lover": "in love with the world",
    "lover|rebel": "love untamed by convention",
    "lover|trickster": "play and desire",
    "lover|mystic": "love aimed at the infinite",
    "caregiver|warrior": "fierce tending",
    "caregiver|sage": "diagnosis and tending",
    "caregiver|explorer": "tends while roaming the hills",
    "everyman|rebel": "of the people, against the crown",
    "creator|ruler": "builds the realm",
    "ruler|sage": "order weighed by truth",
    "ruler|trickster": "rules the game while playing it",
    "mystic|ruler": "orders a community around genuine inner sight",
    "innocent|warrior": "strength that stays kind",
    "creator|rebel": "creates by breaking forms",
    "creator|mystic": "pulls the unseen into form",
    "explorer|sage": "truth sought by expedition",
    "rebel|sage": "chooses their own truth",
    "innocent|sage": "beginner's mind",
    "mystic|sage": "direct communion carried back as living truth",
    "explorer|rebel": "refuses the herd's brand",
    "explorer|trickster": "gets where they're not supposed to be",
    "explorer|mystic": "journeys for visions",
    "rebel|trickster": "mockery as resistance",
    "mystic|rebel": "defies the throne in the name of the unseen",
    "innocent|trickster": "mischief without malice",
    "mystic|trickster": "trickery of the unseen"
  };

  var TEMPERAMENT_EXPRESSIONS = {
    lover: { heart: "The Sweetheart", mind: "The Admirer", body: "The Embracer", soul: "The Adorer" },
    caregiver: { heart: "The Comforter", mind: "The Coordinator", body: "The Provider", soul: "The Tender" },
    everyman: { heart: "The Welcomer", mind: "The Moderator", body: "The Volunteer", soul: "The Kinkeeper" },
    ruler: { heart: "The Householder", mind: "The Administrator", body: "The Captain", soul: "The Trustee" },
    warrior: { heart: "The Defender", mind: "The Strategist", body: "The Athlete", soul: "The Oathkeeper" },
    creator: { heart: "The Artist", mind: "The Designer", body: "The Builder", soul: "The Temple-Builder" },
    sage: { heart: "The Listener", mind: "The Analyst", body: "The Apprentice", soul: "The Philosopher" },
    explorer: { heart: "The Free Spirit", mind: "The Scout", body: "The Adventurer", soul: "The Quester" },
    rebel: { heart: "The Advocate", mind: "The Critic", body: "The Protester", soul: "The Objector" },
    trickster: { heart: "The Tease", mind: "The Wit", body: "The Prankster", soul: "The Holy Fool" },
    innocent: { heart: "The Encourager", mind: "The Idealist", body: "The Straight Arrow", soul: "The Faithful" },
    mystic: { heart: "The Empath", mind: "The Symbolist", body: "The Ecstatic", soul: "The Contemplative" }
  };

  var TEMPERAMENTS = [
    { key: "heart", name: "Heart", gift: "compassion", corruption: "manipulation" },
    { key: "mind", name: "Mind", gift: "wisdom", corruption: "control" },
    { key: "body", name: "Body", gift: "presence", corruption: "force" },
    { key: "soul", name: "Soul", gift: "communion", corruption: "fanaticism" }
  ];

  // Order-independent Pairing lookup for any two archetype keys.
  function pairingName(a, b) { return BLEND_NAMES[[a, b].sort().join("|")] || null; }

  return {
    ARCHETYPES: ARCHETYPES,
    STAGE_NAMES: STAGE_NAMES,
    STAGE_LIGHT: STAGE_LIGHT,
    HUE: HUE,
    BLEND_NAMES: BLEND_NAMES,
    BLEND_TEXTURES: BLEND_TEXTURES,
    TEMPERAMENT_EXPRESSIONS: TEMPERAMENT_EXPRESSIONS,
    TEMPERAMENTS: TEMPERAMENTS,
    pairingName: pairingName
  };
});
