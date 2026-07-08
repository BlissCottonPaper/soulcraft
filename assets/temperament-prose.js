/* ============================================================================
   TEMPERAMENT PROSE — archetype × temperament, single source of truth
   ----------------------------------------------------------------------------
   For each of the 12 archetypes × 4 temperaments (Heart/Mind/Body/Soul):
     loud   — how the archetype naturally expresses through that temperament
              when it is a dominant voice.  (verbatim: "The 48 — Archetype ×
              Temperament Prose Strings" in Notion)
     growth — the crossing practice for developing that temperament when it is
              a quiet voice.  (verbatim: "The Channel Instrument — Crossing
              Practices / the 48 Doors" in Notion)
   Consumed by BOTH the assessment results (index.html) and the archetype
   Explore pages (build/generate.js). No labels invented — prose only.
   ============================================================================ */
(function (root, factory) {
  var data = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = data;                       // Node (build generator)
  } else {
    root.TEMPERAMENT_PROSE = data.TEMPERAMENT_PROSE;   // browser global
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var TEMPERAMENT_PROSE = {
    lover: {
      heart: { loud: "You love by feeling first and feeling fully. The emotional temperature of a room, a relationship, a moment lands in you before a word is spoken. Your love is presence — being so fully with someone that they feel it without explanation.", growth: "Love out loud — tell them today, in words that cost you something." },
      mind: { loud: "You love by knowing. You study the people you care about — their history, their contradictions, what shaped them. To you, understanding someone deeply is intimacy. You show love by paying attention and remembering everything.", growth: "Study your beloved — their history, their craft, what shaped them; love by knowing." },
      body: { loud: "You love through touch, proximity, and action. A meal cooked, a hand held, showing up when it's inconvenient — these are your native love language. You don't say it as much as you do it.", growth: "Love with your hands — cook, walk, hold; presence over words." },
      soul: { loud: "You love through meaning. Every relationship carries significance for you — you sense what this person represents in your life, what the connection is for. Love without depth feels hollow to you.", growth: "Keep a small ritual for the relationship — a candle, an anniversary walk, a daily gratitude." }
    },
    caregiver: {
      heart: { loud: "You feel others' pain almost as your own. Your first move is to be present — to sit with someone in their difficulty rather than immediately trying to fix it. People feel held by you before you've done anything practical.", growth: "Ask “how are you, really?” and stay for the whole answer." },
      mind: { loud: "You care by becoming competent in whatever the person needs. You research the illness, learn the system, figure out the form. Your love shows up as useful knowledge deployed on someone's behalf.", growth: "Learn the thing they're facing — the illness, the debt, the form; competence is care." },
      body: { loud: "Your care is physical and immediate — the meal that appears, the ride that's offered, the repair that gets done without being asked. You show up with your hands before you find the words.", growth: "Show up with hands — the meal, the ride, the repair, unannounced." },
      soul: { loud: "You hold people in a deeper way — in prayer, in intention, in conscious daily remembering. Even when you can't be physically present, you carry the people you love. Your care has a spiritual quality to it.", growth: "Hold them in intention — prayer, meditation, or conscious daily remembering." }
    },
    everyman: {
      heart: { loud: "You make people feel immediately at ease. You read the emotional temperature of a group and adjust naturally — pulling the quiet person in, softening tension, making sure nobody feels left out. Belonging is something you create for others.", growth: "Learn and use names; ask the follow-up question." },
      mind: { loud: "You build belonging through knowledge of people. You remember names, details, the thread of someone's story from six months ago. People feel known by you because you genuinely track them.", growth: "Become the one who remembers — birthdays, details, the thread of people's stories." },
      body: { loud: "You show up. The funeral, the move, the game nobody else came to. Your belonging is physical presence — you're the one who was actually there. That's what people remember about you.", growth: "Show up in person — the funeral, the move, the game." },
      soul: { loud: "You hold the rituals and the meaning of community. The standing dinner, the annual gathering, the toast that names what this group is to each other. You understand that belonging needs tending, and you tend it.", growth: "Keep the binding rituals — the standing dinner, the holiday, the toast." }
    },
    ruler: {
      heart: { loud: "You lead by knowing your people. Before you organize anything, you understand who's in the room — what they need, what they're afraid of, what will make them follow willingly rather than reluctantly. Your order serves humans first.", growth: "Make the schedule serve the humans; ask before assigning." },
      mind: { loud: "You lead through systems and clarity. You can see the whole structure, identify the inefficiency, design the process that makes chaos manageable. People trust you because you understand how things actually work.", growth: "Systematize one mess completely — one drawer, one budget, one process." },
      body: { loud: "You lead by doing the work yourself. You don't delegate what you haven't done — you know the job from the inside, and people respect you because your authority is earned through direct experience, not just position.", growth: "Once a month, do the job you delegate." },
      soul: { loud: "You lead with legacy in mind. You're not just organizing the present — you're stewarding something that should outlast you. A tradition, a culture, an institution. Your order serves something larger than efficiency.", growth: "Steward something that outlives your tenure — a tradition, a fund, a place." }
    },
    warrior: {
      heart: { loud: "You protect people, not positions. Your courage is activated by love — you will stand between harm and the people you care about with a ferocity that surprises even you. You defend someone in a room they're not in.", growth: "Defend someone in the room they're not in." },
      mind: { loud: "You protect through preparation and strategy. You study the conflict before you enter it, understand the terrain, know where the vulnerabilities are. Your courage is disciplined and intelligent — you don't fight unless you know how to win.", growth: "Study the conflict before entering it." },
      body: { loud: "You are a physical presence. Training, discipline, endurance — you develop the instrument because you understand that protection requires capacity. When it matters, you are the person in the room who can actually do something.", growth: "Train the instrument — strength, endurance, a discipline with belts or miles." },
      soul: { loud: "You fight for what's sacred. You've written your oath — the things you will always stand between harm and, regardless of cost. Your warrior energy isn't hot. It's cold, clear, and deeply rooted in what you believe.", growth: "Write your oath — the three things you will always stand between harm and." }
    },
    creator: {
      heart: { loud: "You make things for people. The gift only you could give, the piece created with one specific person in mind — your creative impulse is fundamentally relational. You want what you make to land in someone's chest.", growth: "Make a gift only you could make, for one person." },
      mind: { loud: "You design before you build. Sketching, speccing, iterating on paper — the thinking is the creative act for you, as much as the making. You bring rigor and intentionality to creative work that others treat as purely intuitive.", growth: "Design before you build — sketch, spec, iterate on paper." },
      body: { loud: "You work with material. Wood, clay, dough, code, sound — you think through your hands, and resistance teaches you. The physical act of making is where your ideas become real and where you feel most alive.", growth: "Work a material — wood, dough, clay, thread; let resistance teach." },
      soul: { loud: "You make things that mean something. Not products — offerings. You're drawn to work that touches something deeper than utility or aesthetics. The question underneath every creative act is: does this matter?", growth: "Make one thing with no audience — an offering, not a product." }
    },
    sage: {
      heart: { loud: "You pursue truth through relationship and conversation. The insight that matters most to you comes through genuine exchange — interviewing, listening deeply, learning what only passes person to person. You understand that some knowledge can't be read.", growth: "Interview an elder — truth that only passes person to person." },
      mind: { loud: "You pursue truth through analysis. Reading, researching, pulling threads until something clicks — understanding is your first move and your deepest satisfaction. You go deep rather than wide, and you're not done until it makes sense.", growth: "Go deep, not wide — one subject, one year." },
      body: { loud: "You pursue truth through doing. Your knowing lives in your hands as much as your head — you learn by making, building, practicing. A Sage who leads with Body knows that some truths can only be found through direct contact with the physical world.", growth: "Apprentice your hands — bread, knots, a martial art; knowledge that can't be read." },
      soul: { loud: "You pursue truth through contemplation. You sit with questions longer than most — not to solve them but to let them deepen. The questions that keep you up at night are the ones you find most alive. Mystery, for you, is not the absence of knowledge but its highest form.", growth: "Sit with one unanswerable question without solving it." }
    },
    explorer: {
      heart: { loud: "You explore through people. Every new place is really about the humans there — what they believe, how they live, what they know that you don't. Your freedom is relational; the best part of any journey is who you meet.", growth: "Travel with someone; let the trip be about the companion." },
      mind: { loud: "You explore through understanding. You learn the history, the language, the context before and during every new experience. Discovery, for you, is as much intellectual as physical — you want to know the place, not just see it.", growth: "Learn the place — its history and language, before and during." },
      body: { loud: "You explore through movement. The trail, the climb, the long walk, the ocean crossing — your freedom lives in your body's engagement with the physical world. You feel most alive when you are in motion through terrain that challenges you.", growth: "Go by foot — the trail, the long walk, the climb." },
      soul: { loud: "You explore through pilgrimage. Every journey carries meaning for you — you're not just going somewhere, you're going toward something. Even ordinary travel has a quality of seeking in it. You return from trips changed, not just informed.", growth: "One pilgrimage a year whose destination means something." }
    },
    rebel: {
      heart: { loud: "You fight for people, not principles. Abstract causes become real to you when there's a face attached — one person, one case, one name. Your rebellion is personal and loyal, and people feel that you're fighting for them not just against something.", growth: "Fight for a person, not a principle — one name, one case." },
      mind: { loud: "You rebel through knowing. You understand the other side's argument better than they do — you've done the reading, traced the history, found the contradictions. Your challenge is hard to dismiss because it's harder to refute.", growth: "Know the other side's argument better than they do." },
      body: { loud: "You put your body where your beliefs are. The march, the sit-in, the physical act of resistance — you understand that some things only become real when someone actually shows up. Presence is your form of commitment.", growth: "Put your body where your beliefs are — march, stand, sit." },
      soul: { loud: "You refuse quietly and permanently. Not performance — conviction. There are things you simply will not do, systems you will not participate in, compromises you will not make, and that refusal is so settled in you it barely requires explanation.", growth: "Refuse one thing quietly and permanently, as conviction not performance." }
    },
    trickster: {
      heart: { loud: "Your humor is warm. You tease only the people you love, and they can feel the affection underneath it — that's what makes it land rather than sting. You use play to create intimacy and dissolve pretension without cruelty.", growth: "Tease only those you love, and let them feel the love in it." },
      mind: { loud: "Your wit is sharp and constructed. You build the pun, crack the puzzle, write the satire that exposes exactly what's wrong with the thing everyone pretends is fine. Your disruption is intelligent — it makes people think while they're laughing.", growth: "Sharpen the wit — write the satire, build the pun, crack the puzzle." },
      body: { loud: "You get foolish on purpose. Physical comedy, improv, the prank that requires actual execution — you understand that play needs to be embodied to be fully alive. You're willing to look ridiculous in service of breaking the tension.", growth: "Play physically — games, pranks, improv; get foolish on purpose." },
      soul: { loud: "Your revelation cuts deepest. You puncture your own pretensions first — the most important false pattern to break is always the one you're most attached to. Your humor has a philosophical edge: the curtain drops, and suddenly everyone sees what was hiding in plain sight.", growth: "Joke at your own altar — puncture your own pretensions first." }
    },
    innocent: {
      heart: { loud: "Your trust is relational and warm. You believe in people specifically — you tell them so, and you mean it. Your innocence isn't naivety; it's a deliberate choice to lead with goodwill and let people rise to it.", growth: "Tell someone you believe in them — specifically, and mean it." },
      mind: { loud: "Your trust is evidence-based. You keep a record of reasons to believe — moments of goodness, examples of people coming through, evidence that the world is more trustworthy than fear suggests. Your hope is not passive; it's argued and maintained.", growth: "Audit your hope — keep a file of evidence that people are good." },
      body: { loud: "Your trust shows up in action. You do the honest thing when no one is watching. You keep your word in small things. Your integrity is physical and consistent — people learn to trust you because you're the same whether or not anyone's looking.", growth: "Do the honest thing when no one's watching, once a day." },
      soul: { loud: "Your trust is a spiritual practice. You release what you cannot control — daily, deliberately. You hold a fundamental belief that things are moving toward something, even when you can't see it. Your innocence is hard-won and quietly profound.", growth: "Release one worry you cannot control, daily." }
    },
    mystic: {
      heart: { loud: "You commune through presence. Being with someone wordlessly, without agenda — fully there, open, not trying to fix or understand or accomplish anything. Some of your deepest connections happen in silence.", growth: "Be with someone wordlessly; presence without agenda." },
      mind: { loud: "You commune through symbols and structure. You learn the grammar of dreams, myth, one tradition's way of reading the invisible. Your mysticism is disciplined — you want to understand the architecture of the unseen, not just feel it.", growth: "Learn the symbols — dreams, myth, one tradition's grammar." },
      body: { loud: "You commune through practice. Breathwork, movement, fasting, walking meditation — you know that the body is a doorway, not an obstacle. You access depth through physical discipline rather than despite it.", growth: "Embody it — breathwork, dance, fasting, walking meditation." },
      soul: { loud: "You commune through stillness. The daily silence — same time, same chair, no agenda. You have learned that the mystery doesn't speak loudly and doesn't repeat itself. You show up consistently and you wait.", growth: "Keep a daily silence — same time, same chair, no agenda." }
    }
  };
  return { TEMPERAMENT_PROSE: TEMPERAMENT_PROSE };
});
