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
    root.BLEND_SHADOW_TEXTURES = data.BLEND_SHADOW_TEXTURES;
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
    "caregiver|rebel": "The Advocate", "caregiver|trickster": "The Merrymaker", "caregiver|innocent": "The Gentleheart", "caregiver|mystic": "The BridgeTender",
    "everyman|ruler": "The Mayor", "everyman|warrior": "The Citizen-Soldier", "creator|everyman": "The Folk Artist",
    "everyman|sage": "The Folk Sage", "everyman|explorer": "The Sojourner", "everyman|rebel": "The Folk Hero",
    "everyman|trickster": "The Rascal", "everyman|innocent": "The Salt-of-the-Earth", "everyman|mystic": "The Everyday Mystic",
    "ruler|warrior": "The General", "creator|ruler": "The Architect", "ruler|sage": "The Judge", "explorer|ruler": "The Founder",
    "rebel|ruler": "The Revolutionary", "ruler|trickster": "The Gamemaster", "innocent|ruler": "The Benefactor",
    "mystic|ruler": "The Visionary", // ascended reading — same pair's shadow reading is "The Priest" (institution over insight)
    "creator|warrior": "The Smith", "sage|warrior": "The Master-at-Arms", "explorer|warrior": "The Ranger",
    "rebel|warrior": "The Freedom Fighter", "trickster|warrior": "The Rogue", "innocent|warrior": "The Gentle Giant", "mystic|warrior": "The Warrior-Monk",
    "creator|sage": "The Inventor", "creator|explorer": "The Cartographer", "creator|rebel": "The Iconoclast",
    "creator|trickster": "The Satirist", "creator|innocent": "The Wonderworker", "creator|mystic": "The Magician",
    "explorer|sage": "The Naturalist", "rebel|sage": "The Heretic", "sage|trickster": "The Gadfly",
    "innocent|sage": "The Wonderer", "mystic|sage": "The Shaman",
    "explorer|rebel": "The Maverick", "explorer|trickster": "The Stowaway", "explorer|innocent": "The Adventurer", "explorer|mystic": "The Pilgrim",
    "rebel|trickster": "The Provocateur", "innocent|rebel": "The Emperor's Child", "mystic|rebel": "The Prophet",
    "innocent|trickster": "The Imp", "mystic|trickster": "The Shapeshifter",
    "innocent|mystic": "The Lamb"
  };

  // One-line "texture" of each pairing, verbatim from The 66 — Blend Lexicon (July 2026).
  // All 66 pairings now have a description.
  var BLEND_TEXTURES = {
    "caregiver|lover": "Love that tends.",
    "everyman|lover": "Warmth as welcome.",
    "lover|ruler": "Union made into home.",
    "lover|warrior": "Devotion under arms.",
    "creator|lover": "Feeling given voice.",
    "lover|sage": "Feeling that understands; understanding that feels.",
    "explorer|lover": "In love with the world.",
    "lover|rebel": "Love untamed by convention.",
    "lover|trickster": "Play meets desire.",
    "lover|mystic": "Love aimed at the infinite.",
    "innocent|lover": "Love that doesn't keep score.",
    "caregiver|everyman": "Shows up because that's what neighbors do.",
    "caregiver|ruler": "Authority exercised through tending.",
    "caregiver|warrior": "Fierce in care.",
    "caregiver|creator": "Creates the conditions for growth.",
    "caregiver|sage": "Understands the wound and tends the whole.",
    "caregiver|explorer": "Tends while roaming.",
    "caregiver|rebel": "Crosses the road anyway.",
    "caregiver|trickster": "Care through laughter.",
    "caregiver|innocent": "Soft enough to stay.",
    "caregiver|mystic": "Tends the threshold.",
    "everyman|ruler": "One of the people, trusted to lead them.",
    "everyman|warrior": "Ordinary life, extraordinary stakes.",
    "creator|everyman": "Beauty made from common things.",
    "everyman|sage": "Wisdom without credentials.",
    "everyman|explorer": "Belongs everywhere, stays nowhere long.",
    "everyman|rebel": "Of the people, against the crown.",
    "everyman|trickster": "Cunning from below.",
    "everyman|innocent": "Trustworthy as the ground.",
    "everyman|mystic": "The sacred in the ordinary.",
    "ruler|warrior": "Order enforced by force.",
    "creator|ruler": "Designs the structure others will inhabit.",
    "ruler|sage": "Order weighed by truth.",
    "explorer|ruler": "Builds where no structure existed before.",
    "rebel|ruler": "Overthrows to rebuild.",
    "ruler|trickster": "Rules the game while playing it.",
    "innocent|ruler": "Power held lightly.",
    "mystic|ruler": "Leads from what others cannot yet see.",
    "creator|warrior": "Strength turned to making.",
    "sage|warrior": "Discipline as craft.",
    "explorer|warrior": "Protects the frontier.",
    "rebel|warrior": "Force in service of justice.",
    "trickster|warrior": "Wins by refusing the obvious fight.",
    "innocent|warrior": "Strength that stays kind.",
    "mystic|warrior": "Discipline in service of the sacred.",
    "creator|sage": "Insight made useful.",
    "creator|explorer": "Maps the unmapped.",
    "creator|rebel": "Creates by breaking forms.",
    "creator|trickster": "Truth told sideways.",
    "creator|innocent": "Brings forth from wonder.",
    "creator|mystic": "Pulls the unseen into form.",
    "explorer|sage": "Truth sought by expedition.",
    "rebel|sage": "Chooses truth over orthodoxy.",
    "sage|trickster": "Irritates complacent certainty.",
    "innocent|sage": "Beginner's mind, always.",
    "mystic|sage": "Direct communion carried back as living truth.",
    "explorer|rebel": "Refuses the herd's brand.",
    "explorer|trickster": "Gets where they're not supposed to be.",
    "explorer|innocent": "Expects the unknown to be marvelous.",
    "explorer|mystic": "Journeys toward the sacred.",
    "rebel|trickster": "Mockery as resistance.",
    "innocent|rebel": "Says what everyone sees and no one will say.",
    "mystic|rebel": "Defies the throne in the name of the unseen.",
    "innocent|trickster": "Mischief without malice.",
    "mystic|trickster": "The unseen wearing many forms.",
    "innocent|mystic": "Blameless before mystery."
  };

  // Shadow Mandala pairing copy — LOCKED July 2026 (verbatim from The 66 Shadow
  // Pairings in Notion). One line per pairing, in the form "In shadow: … Integrated:
  // …": what happens when the two energies can't cooperate, and what becomes
  // possible once both are held at once. Keyed identically to BLEND_TEXTURES.
  var BLEND_SHADOW_TEXTURES = {
    "caregiver|lover": "In shadow: care and desire split — you either smother or withhold. Integrated: you can love someone and tend to them without losing yourself in either.",
    "everyman|lover": "In shadow: you perform closeness to secure belonging, but no one gets close enough to know you. Integrated: you can open to people without needing them to make you feel chosen.",
    "lover|ruler": "In shadow: the longing for closeness hides inside control of the household. Integrated: you can build a home that holds intimacy rather than replacing it.",
    "lover|warrior": "In shadow: passion shows up only as jealousy or the fight to keep what you love. Integrated: you can defend what you cherish without possessing it.",
    "creator|lover": "In shadow: strong feeling stays mute or leaks out as drama. Integrated: you can turn what moves you into something that lasts.",
    "lover|sage": "In shadow: you retreat into analysis to avoid being touched. Integrated: you can let understanding and feeling inform each other.",
    "explorer|lover": "In shadow: appetite for experience keeps you moving before attachment can deepen. Integrated: you can be devoted and still free.",
    "lover|rebel": "In shadow: desire only surfaces as breaking rules or people. Integrated: you can love on your own terms without burning it down.",
    "lover|trickster": "In shadow: flirtation deflects real closeness. Integrated: you can bring lightness to intimacy instead of hiding behind it.",
    "lover|mystic": "In shadow: you reach for the infinite to avoid the particular person in front of you. Integrated: you can let the sacred deepen a real bond.",
    "innocent|lover": "In shadow: you either give without limit or armor against being hurt. Integrated: you can love openly and still keep faith with yourself.",
    "caregiver|everyman": "In shadow: you resent the helping you can't stop doing. Integrated: you can show up for others by choice rather than compulsion.",
    "caregiver|ruler": "In shadow: care becomes control dressed as concern. Integrated: you can carry responsibility for others without running their lives.",
    "caregiver|warrior": "In shadow: protectiveness turns into fighting battles no one asked you to fight. Integrated: you can stand up for people and still let them stand for themselves.",
    "caregiver|creator": "In shadow: you pour all your creative energy into developing others and lose contact with what you were meant to bring forth yourself. Integrated: you can nurture others and still create for yourself.",
    "caregiver|sage": "In shadow: you analyze others' pain to keep from feeling your own. Integrated: you can bring insight and care to the same wound.",
    "caregiver|explorer": "In shadow: you flee whenever caring gets heavy. Integrated: you can stay present to others without feeling trapped.",
    "caregiver|rebel": "In shadow: outrage at injustice becomes easier than actually staying with the people who are hurting. Integrated: you can let care, not just anger, move you to act.",
    "caregiver|trickster": "In shadow: you joke to avoid tending anything real. Integrated: you can use humor to lighten care rather than dodge it.",
    "caregiver|innocent": "In shadow: tenderness feels dangerous, so you harden. Integrated: you can stay soft without being naive.",
    "caregiver|mystic": "In shadow: you tend the surface and avoid the threshold. Integrated: you can hold space at the crossing without flinching.",
    "everyman|ruler": "In shadow: the wish to belong keeps you from ever stepping up. Integrated: you can lead without losing your place among people.",
    "everyman|warrior": "In shadow: you shrink from any fight that would single you out. Integrated: you can defend the common good without needing to stay invisible.",
    "creator|everyman": "In shadow: you dismiss your own originality to fit in. Integrated: you can make something distinct and still belong.",
    "everyman|sage": "In shadow: you hide what you know to avoid standing apart. Integrated: you can share understanding without needing permission.",
    "everyman|explorer": "In shadow: you drift to avoid the risk of really belonging. Integrated: you can move freely and still put down roots.",
    "everyman|rebel": "In shadow: you go along to get along and swallow the dissent. Integrated: you can belong and still say what's wrong.",
    "everyman|trickster": "In shadow: your wit turns into passive undermining. Integrated: you can use cleverness openly rather than from the shadows.",
    "everyman|innocent": "In shadow: you make yourself so agreeable you disappear. Integrated: you can be dependable without erasing yourself.",
    "everyman|mystic": "In shadow: you keep your inner life hidden to seem normal. Integrated: you can let depth show inside an ordinary life.",
    "ruler|warrior": "In shadow: the will to organize only surfaces as domination. Integrated: you can organize strength around a purpose larger than your own control.",
    "creator|ruler": "In shadow: you either refuse structure or impose it rigidly. Integrated: you can build systems that free rather than confine.",
    "ruler|sage": "In shadow: you avoid authority so you never have to be wrong. Integrated: you can make the call and live with what it costs.",
    "explorer|ruler": "In shadow: you resist committing to anything you'd have to maintain. Integrated: you can found something and stay to tend it.",
    "rebel|ruler": "In shadow: you tear down without building anything back. Integrated: you can be the one who breaks it and the one who builds what comes next.",
    "ruler|trickster": "In shadow: control and mischief split into rigidity or chaos. Integrated: you can hold authority lightly enough to keep it honest.",
    "innocent|ruler": "In shadow: you refuse power because it feels corrupting. Integrated: you can hold authority without losing your good faith.",
    "mystic|ruler": "In shadow: vision stays private and guides no one. Integrated: you can bring inner sight into real leadership.",
    "creator|warrior": "In shadow: drive turns destructive or stalls in perfectionism. Integrated: you can forge with force instead of merely breaking with it.",
    "sage|warrior": "In shadow: you think instead of act, or act without thought. Integrated: you can pair clear judgment with the will to follow through.",
    "explorer|warrior": "In shadow: you pick fights to keep yourself moving. Integrated: you can be bold without needing an enemy.",
    "rebel|warrior": "In shadow: the fight for justice curdles into rage. Integrated: you can channel anger into disciplined action.",
    "trickster|warrior": "In shadow: you avoid every direct confrontation. Integrated: you can pick your battles with cunning rather than fear.",
    "innocent|warrior": "In shadow: you suppress your strength to stay nice. Integrated: you can be forceful without becoming hard.",
    "mystic|warrior": "In shadow: you either fight for nothing higher or dream without discipline. Integrated: you can put real rigor behind what you hold sacred.",
    "creator|sage": "In shadow: ideas stay in your head and never reach the world. Integrated: you can turn understanding into something someone can use.",
    "creator|explorer": "In shadow: curiosity scatters and finishes nothing. Integrated: you can wander widely and still bring back a map.",
    "creator|rebel": "In shadow: you break things without making anything new. Integrated: you can dismantle old forms in service of a better one.",
    "creator|trickster": "In shadow: cleverness hides that you're not saying anything real. Integrated: you can use wit to reveal rather than deflect.",
    "creator|innocent": "In shadow: you distrust your own imagination as naive. Integrated: you can create from wonder without shame.",
    "creator|mystic": "In shadow: vision stays formless and unshared. Integrated: you can give shape to what you intuit.",
    "explorer|sage": "In shadow: you keep seeking so you never have to conclude. Integrated: you can let real inquiry reach real ground.",
    "rebel|sage": "In shadow: contrarianism stands in for genuine understanding. Integrated: you can question orthodoxy in the name of truth, not just defiance.",
    "sage|trickster": "In shadow: you undercut everyone's certainty, including your own footing. Integrated: you can puncture false certainty and still stand for something.",
    "innocent|sage": "In shadow: you feign not-knowing to dodge responsibility for what you do know. Integrated: you can stay curious without playing dumb.",
    "mystic|sage": "In shadow: you either distrust what you perceive or treat inner knowing as beyond question. Integrated: you can test what you perceive, live what survives, and carry it back in service.",
    "explorer|rebel": "In shadow: independence hardens into reflexive opposition. Integrated: you can go your own way without defining yourself against everyone.",
    "explorer|trickster": "In shadow: you slip past every boundary to avoid commitment. Integrated: you can cross lines with purpose rather than just to escape.",
    "explorer|innocent": "In shadow: you either fear the new or chase it blindly. Integrated: you can meet the unknown with open, clear eyes.",
    "explorer|mystic": "In shadow: seeking becomes endless spiritual tourism. Integrated: you can let the outer journey serve an inner one.",
    "rebel|trickster": "In shadow: everything becomes cynicism that risks nothing. Integrated: you can use humor to resist without hiding behind it.",
    "innocent|rebel": "In shadow: you stay silent to keep the peace. Integrated: you can speak the plain truth without needing to be right.",
    "mystic|rebel": "In shadow: conviction outruns discernment, and every impulse begins to sound like revelation. Integrated: you can challenge power from conviction grounded in something larger than yourself.",
    "innocent|trickster": "In shadow: playfulness gets buried under seriousness or turns sharp. Integrated: you can be mischievous in a way that heals rather than wounds.",
    "mystic|trickster": "In shadow: you shapeshift so much that no one, including you, finds the center. Integrated: you can move fluidly and still stay whole.",
    "innocent|mystic": "In shadow: you avoid the depths to keep your innocence intact. Integrated: you can face mystery without losing your trust.",
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
    BLEND_SHADOW_TEXTURES: BLEND_SHADOW_TEXTURES,
    TEMPERAMENT_EXPRESSIONS: TEMPERAMENT_EXPRESSIONS,
    TEMPERAMENTS: TEMPERAMENTS,
    pairingName: pairingName
  };
});
