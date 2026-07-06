// THE 36-STATEMENT BANK
// 12 archetypes × 3 flavors (motivation / worldview / fear) = 36 statements
// Used by the Full Mirror (66 pairs): across an archetype's 11 pairings,
// flavor rotates so no single sentence repeats 11 times.

export const STATEMENT_BANK = {
  lover: {
    motivation: "I pour myself fully into the people and passions I love, because connection is what makes life worth living.",
    worldview:  "The world is best understood through the heart — what we feel for each other matters more than what we prove.",
    fear:       "What I fear most is loving deeply and being left, or never being truly known by anyone.",
  },
  caregiver: {
    motivation: "I feel most myself when I'm tending to someone else's needs before my own.",
    worldview:  "People are fragile and worth protecting — a good life is measured by how well you cared for others.",
    fear:       "What I fear most is being unneeded, or watching someone suffer while I fail to help them.",
  },
  everyman: {
    motivation: "I want to belong — to feel like an equal part of something ordinary and real, not set apart from anyone.",
    worldview:  "Nobody is really above anyone else — the best life is a shared one, among people who accept you as you are.",
    fear:       "What I fear most is being excluded, or standing out in a way that costs me my place in the group.",
  },
  sage: {
    motivation: "I need to understand how things actually work — truth matters more to me than comfort.",
    worldview:  "The world makes sense if you study it closely enough; most suffering comes from not understanding.",
    fear:       "What I fear most is being fooled, or believing something false without realizing it.",
  },
  creator: {
    motivation: "I feel compelled to make something out of nothing — an idea isn't real to me until it exists in the world.",
    worldview:  "Life is raw material — what matters is what you build from it, not what you were given.",
    fear:       "What I fear most is making something worthless, or never bringing my real vision into form.",
  },
  ruler: {
    motivation: "I step in to organize and take charge, because things fall apart without someone steering them.",
    worldview:  "Order isn't optional — a good life and a good community both depend on structure someone has to hold.",
    fear:       "What I fear most is chaos I can't contain, or losing control of something that depended on me.",
  },
  warrior: {
    motivation: "I'm at my best when I'm standing between danger and the people or things I've sworn to protect.",
    worldview:  "The world tests you, and the only real answer is to meet the challenge head-on, whatever it costs.",
    fear:       "What I fear most is being powerless to stop harm to someone I was supposed to defend.",
  },
  explorer: {
    motivation: "I need room to roam — the moment my life feels boxed in, I start looking for the door.",
    worldview:  "The world is bigger and stranger than any one place can hold — you have to keep moving to really know it.",
    fear:       "What I fear most is being trapped — in a place, a routine, or a life that was never really mine.",
  },
  rebel: {
    motivation: "When something is unfair or broken, I can't just accept it — I have to push back, whatever the cost.",
    worldview:  "Most rules exist to protect someone's power, not the people they claim to serve — question everything.",
    fear:       "What I fear most is going along with something wrong just because everyone else already did.",
  },
  trickster: {
    motivation: "I love finding the crack in something too serious and pulling at it until everyone sees the absurdity.",
    worldview:  "Nothing stays sacred for long — the moment something calcifies into rigid seriousness, it's begging to be laughed at.",
    fear:       "What I fear most is a world with no play left in it — where nothing I say can loosen anything.",
  },
  innocent: {
    motivation: "I choose to believe things will work out, and to stay kind and honest even when it's costly.",
    worldview:  "People are fundamentally good at heart, even when they act badly — goodness is the truer story.",
    fear:       "What I fear most is discovering that the people or things I trusted were never what I believed.",
  },
  mystic: {
    motivation: "I'm drawn toward what can't quite be explained — the silence, the symbol, the thing underneath the thing.",
    worldview:  "The visible world is only the surface — there's a deeper order to things that reveals itself if you're quiet enough to notice.",
    fear:       "What I fear most is a life that never touches anything beyond the ordinary — pure surface, no depth.",
  },
};

// Flavor rotation for the Full Mirror's round-robin.
// Each archetype meets 11 others; flavors cycle motivation -> worldview -> fear -> repeat,
// so consecutive pairings for the same archetype use different statements.
export function getStatementForPairing(archetypeKey, meetingIndex) {
  const flavors = ["motivation", "worldview", "fear"];
  const flavor = flavors[meetingIndex % 3];
  return STATEMENT_BANK[archetypeKey][flavor];
}
