/* ============================================================================
   ARCHETYPE CHAPTER CONTENT — prose transcribed from the Notion canon
   ("Archetype Profiles — The Twelve Chapters"). Source of truth for the PROSE
   only. Structural data (names, stage-ladder names, Temperament names, the 66
   Pairing names, longing, opposite, hue) comes from /assets/soulcraft-data.js
   and is merged in by the generator — never duplicate those here.

   Per archetype: overview, motivations, coreWound, fears, addictions, traits,
   blindSpots, dreams; stages[] (the "what it looks like" line per Bandwidth
   stage, index 0..4 = Devolved..Transcendent); temperaments (one line per
   temperament, the Base read); pairings (one line per partner key, this archetype
   leading; "" where the chapter hasn't written that reading yet).

   NOTE: verbatim from the chapters, with inline production notes removed for
   public display — rename histories ("renamed from X"), review flags ("pending
   author confirmation"), "(the axis bridge)" markers, and the trailing
   "Three words:" line (the three words render from the data file's descriptors).
   ============================================================================ */
"use strict";

module.exports = {
  sage: {
    coreWoundShort: `being deceived`,
    overview: `The Sage is organized around understanding — the conviction that most suffering comes from not seeing clearly, and that truth, however uncomfortable, is worth more than comfortable illusion. Where the Lover trusts feeling, the Sage trusts evidence. This is the archetype of the examined life, taken seriously.`,
    motivations: `To understand how things actually work, beneath appearances. To think clearly rather than react. To share what it has learned so others don't have to learn it the hard way.`,
    coreWound: `The fear underneath the Sage's rigor is being fooled — believing something false and not realizing it. This wound explains both its gift (relentless honesty with itself and others) and its danger (a defensive certainty that can shade into refusing to be moved by anything, including good evidence, once it's decided).`,
    fears: `Being fooled. Believing something false without realizing it. Being wrong in public. Discovering its own certainty was itself a kind of blindness.`,
    addictions: `The longing for truth, rerouted into: being right as identity rather than truth as the goal, intellectual superiority used to avoid real intimacy, endless analysis substituting for the discomfort of actually deciding or acting.`,
    traits: `Curious, reflective, values evidence over assertion, comfortable being alone with a problem, often more at ease with ideas than with feelings.`,
    blindSpots: `Can use understanding as distance — a way to stay safely outside of what it's examining. May mistake cleverness for wisdom. Struggles to act under uncertainty, since acting always means committing before all the evidence is in.`,
    dreams: `To understand something true and important before it dies. To pass on real insight, not just information. To be trusted not because it's always right, but because it's always honest.`,
    stages: [
      `A disappointed idealist whose truth has curdled into blanket contempt for everyone and everything — the certainty that zaps the life out of a room. Truth fully collapsed into ego-protection.`,
      `Being right as identity; truth used to win arguments rather than to understand. Annoying and defended, but still fear-reacting — not yet fully ego-captured.`,
      `Everyday Sage — seeks to understand how things work, values insight over quick answers.`,
      `Mature understanding — shares insight generously, holds certainty loosely.`,
      `Teaches not to be right, but to set someone else free — wisdom entirely at others' service.`
    ],
    temperaments: { heart: `seeks truth in people, through real attention`, mind: `takes truth apart, piece by piece`, body: `learns by hand — knowledge that can't be read`, soul: `literally, "lover of wisdom" — truth pursued as devotion` },
    pairings: { lover: `feeling that understands, understanding that feels`, caregiver: `diagnosis fused with tending`, everyman: `everyday wisdom, spoken in the common tongue`, ruler: `order weighed by truth`, warrior: `discipline and knowledge under arms`, creator: `understanding that builds something new`, explorer: `truth sought by expedition, in the field rather than the library`, rebel: `chooses its own truth over inherited orthodoxy`, trickster: `teaches by irritating complacent certainty, like Socrates himself`, innocent: `beginner's mind — truth approached with awe rather than defense`, mystic: `carries direct communion back as living, usable truth` }
  },

  lover: {
    coreWoundShort: `abandonment`,
    overview: `The Lover is the part of you that believes connection is what makes life worth living — that beauty, intimacy, and passion aren't decorations on a life but its actual substance. Where the Sage seeks to understand the world, the Lover seeks to feel it, fully, without holding back. This is the archetype of devotion: to a person, a craft, a cause, a place — anything that can be loved completely.`,
    motivations: `To merge — to close the distance between self and other until it disappears. To be chosen, and to choose, completely. To make ordinary life vivid through beauty and desire.`,
    coreWound: `Every Lover carries, somewhere, the fear of being left. This isn't incidental — it's the wound the entire arc bends around. A Lover who has never feared abandonment isn't yet a Lover in the full sense; the willingness to risk loss is what makes devotion costly, and costly is what makes it real.`,
    fears: `Loving deeply and being left. Never being truly known by anyone, even while surrounded by connection. Growing old unloved. Loving the wrong thing so completely that its loss becomes unsurvivable.`,
    addictions: `The Lover's longing (union) can get rerouted into: relationship intensity used as a drug (serial infatuation instead of sustained intimacy), sex or romantic novelty as a substitute for real merging, aesthetic or sensory indulgence (food, luxury, art-collecting) standing in for actual connection.`,
    traits: `Warm, expressive, aesthetically sensitive, loyal once committed, emotionally perceptive, drawn to beauty in people and objects alike.`,
    blindSpots: `Can mistake intensity for depth. May stay in a relationship or passion past its healthy point because leaving feels like confirming the abandonment fear. Can smother what it loves. Struggles to love something and let it be free.`,
    dreams: `To be loved exactly as they are, without having to perform for it. To find something — a person, a work, a place — worth complete devotion. To die having loved fully rather than safely.`,
    stages: [
      `Love as ownership; union enforced against the other's will. Stalking, control, jealousy weaponized.`,
      `Neediness before it curdles into possession — grasping at reassurance, unable to tolerate distance.`,
      `The everyday Lover — pours the heart into people and passions, feels alive through connection.`,
      `Mature love — committed, generous, able to hold both closeness and the other's freedom.`,
      `Loves without needing return. The love itself has become the point, not what it earns back.`
    ],
    temperaments: { heart: `wears devotion openly, leads with warmth`, mind: `loves by knowing the beloved deeply — their history, their mind`, body: `love as touch and physical presence`, soul: `the beloved held as sacred` },
    pairings: { caregiver: `love that tends as much as it feels`, everyman: `warmth turned into hospitality, welcome`, ruler: `devotion fused with domestic order`, warrior: `devotion armed; love that will fight for its object`, creator: `feeling given voice, form, performance`, sage: `feeling that understands, understanding that feels`, explorer: `in love with the world itself, not just one person`, rebel: `love untamed by convention or approval`, trickster: `play fused with desire`, innocent: `carries trust and the real risk of faith, not just uncomplicated youthful devotion`, mystic: `love aimed at the infinite, not only the human` }
  },

  caregiver: {
    coreWoundShort: `being unneeded`,
    overview: `The Caregiver is the part of you organized around tending — the instinct to notice what someone else needs before they've asked, and to meet it. Where the Explorer needs room to roam, the Caregiver needs someone to hold. This is the archetype of service through presence: showing up, again and again, for people who are struggling.`,
    motivations: `To be needed and useful. To ease someone else's suffering. To create safety for people who can't yet create it for themselves.`,
    coreWound: `The Caregiver's deepest fear isn't failure — it's irrelevance. A world in which no one needs tending feels, to this archetype, like a kind of erasure. This wound is what makes the Caregiver vulnerable to over-functioning: it isn't just kindness, it's also self-preservation.`,
    fears: `Being unneeded. Watching someone suffer while failing to help. Being seen as selfish. Depleting themselves and having nothing left to give.`,
    addictions: `The longing to nurture, rerouted: caretaking used to avoid one's own needs entirely, rescuing people who haven't asked to be rescued, martyrdom performed publicly for recognition rather than offered privately.`,
    traits: `Attentive, generous, emotionally available, quick to notice distress in others, comfortable being needed, uncomfortable receiving.`,
    blindSpots: `Can create the very dependency it resents. Struggles to distinguish helping from enabling. Often the last to name its own exhaustion. May give not from abundance but from a fear of what happens if it stops.`,
    dreams: `To love people well enough that they heal. To be so trusted that someone lets the Caregiver see them at their worst. To someday be tended to in return, without having to ask.`,
    stages: [
      `Care that prevents growth; needing to be needed more than needing the other to thrive.`,
      `Care that keeps score — giving as self-erasure, quietly resentful underneath.`,
      `Everyday Caregiver — takes responsibility for others' needs, feels fulfilled supporting people.`,
      `Mature care — gives from abundance, can say no, tends without losing itself.`,
      `Helps others become whole, not dependent — the tending aimed at the other's freedom, not the Caregiver's role.`
    ],
    temperaments: { heart: `holds space, soothes with presence`, mind: `care as logistics — meal trains, appointments, systems of support`, body: `casseroles, rides, repairs, hands-on help`, soul: `tends the spirit, not just the practical need` },
    pairings: { lover: ``, everyman: `ordinary, reliable care between equals`, ruler: `responsible authority exercised through tending`, warrior: `fierce tending, care that will fight for its object`, creator: `cares for food, people, ideas, and talent alike`, sage: `tending fused with diagnosis; care that also understands the root`, explorer: `tends while still roaming, care without confinement`, rebel: `care that crosses forbidden lines to reach who needs it`, trickster: `lifts spirits through mischief and lightness`, innocent: `soft, uncomplicated kindness`, mystic: `attends the thresholds — birth, death, transformation` }
  },

  everyman: {
    coreWoundShort: `exclusion`,
    overview: `The Everyman is organized around belonging — the desire to be an equal part of something ordinary and real, not set above or apart from anyone. Where the Rebel defines itself against the group, the Everyman finds its truest self inside one. This is the archetype of solidarity: down-to-earth, inclusive, allergic to pretension.`,
    motivations: `To fit in without losing itself. To be liked, trusted, one of the group. To flatten hierarchy — to make sure no one is made to feel lesser.`,
    coreWound: `Being left out, talked over, or made to feel like an outsider cuts deeper for the Everyman than almost any other injury. This wound explains both its warmth (it knows what exclusion feels like and works hard to spare others) and its greatest danger (a desperate need to belong can override its own judgment).`,
    fears: `Being excluded. Standing out in a way that costs its place in the group. Being seen as better-than, or worse, being seen as nothing at all.`,
    addictions: `Belonging rerouted into: conformity used to guarantee acceptance, flattery aimed upward at power in exchange for inclusion, self-erasure mistaken for humility.`,
    traits: `Warm, relatable, easy to talk to, genuinely egalitarian, good at making others feel comfortable, uncomfortable with attention or elevation.`,
    blindSpots: `Can disappear into the group rather than contribute to it. May resent those who stand apart, mistaking their difference for arrogance. Struggles to assert a minority opinion. Can enable groupthink by avoiding the friction of disagreement.`,
    dreams: `To belong somewhere completely, without performance. To help build a community where no one is made to feel small. To matter without having to become exceptional.`,
    stages: [
      `Nothing left of the self to belong with — total capitulation to the group. Spends all its energy fitting in, which is precisely what makes real belonging impossible: fitting in requires constant self-monitoring; belonging requires the opposite — being known as you actually are and still held.`,
      `Belonging purchased with self-abandonment, chronic accommodation.`,
      `Everyday Everyman — feels most itself in a down-to-earth group of equals.`,
      `Genuine connector — belongs without losing itself, bridges people naturally.`,
      `Actively builds belonging for others — makes room at the table rather than just occupying a seat.`
    ],
    temperaments: { heart: `makes room for everyone, warmly`, mind: `keeps the group fair, tracks who's been heard`, body: `shows up, stacks the chairs, does the unglamorous work`, soul: `keeps the bonds — birthdays, traditions, who's connected to whom` },
    pairings: { lover: ``, caregiver: ``, ruler: `authority earned through belonging, not imposed from above`, warrior: `ordinary person who stands up when it matters`, creator: `makes art of and for the people, not above them`, sage: `plainspoken wisdom, no jargon`, explorer: `belongs everywhere for a while, at home among strangers`, rebel: `of the people, against unjust power`, trickster: `surviving hierarchy through cunning and irreverence`, innocent: `plain, trustworthy goodness`, mystic: `finds the sacred in ordinary life, not apart from it` }
  },

  ruler: {
    coreWoundShort: `chaos`,
    overview: `The Ruler is organized around order — the instinct to step in, structure, and steward, because things fall apart without someone willing to hold them together. Where the Trickster delights in disruption, the Ruler delights in things finally making sense, working, holding. This is the archetype of responsibility taken on, often unasked.`,
    motivations: `To create stability others can rely on. To be the one who steps up when no one else will. To leave things more ordered than they were found.`,
    coreWound: `Disorder isn't just inconvenient to the Ruler — it's threatening at a nearly bodily level. This wound is the seed of both its greatest gift (the willingness to take responsibility others avoid) and its greatest danger (an inability to tolerate the disorder that real growth sometimes requires).`,
    fears: `Chaos it can't contain. Losing control of something that depended on it. Being blamed when things fall apart, even when it wasn't in its power to prevent.`,
    addictions: `The longing for order, rerouted into: control for its own sake, rigid rule-following that stops asking whether the rule still serves anyone, hoarding authority rather than delegating it.`,
    traits: `Decisive, dependable, naturally takes charge, comfortable with responsibility, sees systems and structure where others see only mess.`,
    blindSpots: `Can mistake control for care. Struggles to tolerate ambiguity or emergent, unplanned outcomes. May crush the very creativity or spontaneity a situation needed. Delegation often feels, wrongly, like risk.`,
    dreams: `To build something that outlives it — an institution, a family structure, a tradition that holds. To be trusted with real responsibility and to prove worthy of it. To finally rest, knowing the order it built doesn't depend entirely on it anymore.`,
    stages: [
      `Order as domination — control exercised for its own sake, at others' expense.`,
      `Fear of chaos gripping every detail; can't trust anyone else to hold the structure.`,
      `Everyday Ruler — steps in to organize and take charge so things feel stable.`,
      `Mature order — holds structure responsibly, delegates, order in service of people.`,
      `Rules with clean hands entirely for the good of those governed, not for the ego of governing.`
    ],
    temperaments: { heart: `runs the home as its own small realm`, mind: `order through systems, policy, process`, body: `hands-on command, in the work alongside those it leads`, soul: `holds order on behalf of something larger than itself` },
    pairings: { lover: ``, caregiver: `responsible authority through tending`, everyman: ``, warrior: `order enforced through disciplined force`, creator: `builds the very structure of the realm`, sage: `order weighed against truth`, explorer: `carries order to the frontier, builds where nothing stood before`, rebel: `rebellion with intent to build a new order, not just overthrow`, trickster: `rules the game while still playing it`, innocent: `rules with clean, trusting hands`, mystic: `leads from genuine inner sight, not inherited law alone` }
  },

  warrior: {
    coreWoundShort: `helplessness`,
    overview: `The Warrior is organized around protection — the instinct to stand between danger and whatever it has sworn to defend. Where the Innocent trusts the world to be safe, the Warrior assumes it must be made safe, and takes on that job. This is the archetype of courage in service of something beyond mere survival.`,
    motivations: `To meet threat head-on rather than avoid it. To protect what and who it loves. To be strong enough that others don't have to be afraid.`,
    coreWound: `The Warrior's deepest fear isn't pain — it's powerlessness to stop harm to someone it was supposed to defend. This wound is often the origin story: a moment of real or perceived helplessness the Warrior has vowed never to repeat, which is why its discipline can look almost compulsive from the outside.`,
    fears: `Being powerless to protect someone it loves. Being seen as weak. Losing the fight that actually mattered. Discovering its strength wasn't enough.`,
    addictions: `The longing to protect, rerouted into: conflict itself as a way to feel useful, even when no real threat exists, aggression as identity rather than instrument, hypervigilance that never lets the guard down even when safe.`,
    traits: `Disciplined, courageous, protective, action-oriented, comfortable with confrontation others avoid, loyal to whoever or whatever it has decided to defend.`,
    blindSpots: `Can mistake every disagreement for a battle. Struggles to be vulnerable, since vulnerability can feel like the very helplessness it fears. May protect people who never asked to be protected, at the cost of their own agency.`,
    dreams: `To successfully guard what matters most, and to know, without doubt, that its strength was enough when it counted. To finally lay the sword down because the war is actually over, not because it gave up.`,
    stages: [
      `Force turned against the weak; protection corrupted into domination.`,
      `Fights for anyone who pays, or fights out of habit — the cause has gone missing.`,
      `Everyday Warrior — faces challenges head-on, protects what matters even at cost.`,
      `Disciplined, admirable strength — fights well, for the right things, on its own terms.`,
      `Guards the defenseless, not its own honor — strength entirely at others' service.`
    ],
    temperaments: { heart: `fights for people, motivated by love`, mind: `wins the fight before it starts, through planning`, body: `the fight mastered as physical discipline`, soul: `fights from vow, from something sworn` },
    pairings: { lover: ``, caregiver: ``, everyman: ``, ruler: ``, creator: `force refined into craft`, sage: `discipline as its own form of knowledge`, explorer: `courage aimed at the frontier, not just the enemy`, rebel: `protection turned toward liberation`, trickster: `fights sideways, unconventional tactics`, innocent: `strength that stays kind`, mystic: `discipline in service of something transcendent` }
  },

  creator: {
    coreWoundShort: `insufficiency`,
    overview: `The Creator is organized around bringing things into being — the compulsion to make an idea real in the world rather than let it stay only imagined. Where the Mystic communes with what already is, the Creator can't rest until something new exists that didn't before. This is the archetype of vision made material.`,
    motivations: `To give form to what's only felt or imagined. To leave something behind that carries its vision. To make meaning tangible — an object, an idea, a solution — rather than let it remain private.`,
    coreWound: `The fear that nothing it makes will ever be enough — enough to match the vision, enough to justify the effort, enough to matter. This wound is the real engine behind perfectionism: not high standards alone, but a nagging sense that the self is measured by the work, and the work never quite closes the gap.`,
    fears: `Making something worthless. Never bringing the real vision into form. Being derivative. Finishing something and discovering it doesn't matter after all.`,
    addictions: `The longing to bring forth, rerouted into: productivity as identity (worth measured only by output), endless revision that never allows completion, novelty-seeking that abandons projects the moment they stop feeling fresh.`,
    traits: `Imaginative, expressive, sees possibility where others see only raw material, driven, often uncomfortable with the gap between vision and execution.`,
    blindSpots: `Can destroy good work chasing an impossible ideal. May value the vision over the people affected by pursuing it. Struggles to receive feedback on unfinished work without hearing it as a verdict on worth.`,
    dreams: `To make the one thing that finally matches the vision in its head. To be remembered for what it made. To someday make something purely for the joy of it, with no audience and no stakes.`,
    stages: [
      `Destroys what fails to meet the vision — including, sometimes, itself or its relationships.`,
      `The work must be flawless because the self feels insufficient without it.`,
      `Everyday Creator — compelled to make things that express its inner vision.`,
      `Mastered craft — makes skillfully, finishes, takes real pride without perfectionism's grip.`,
      `Transforms raw material — and often pain — into something that serves others, not just the self.`
    ],
    temperaments: { heart: `feeling given form`, mind: `form solved as a problem, structure-first`, body: `hands and material, making as physical act`, soul: `making as offering, not just output` },
    pairings: { lover: ``, caregiver: `cares for food, people, ideas, and talent alike`, everyman: ``, ruler: ``, warrior: ``, sage: `truth-seeking fused with bringing-into-form; the systems thinker`, explorer: `makes something whose purpose is showing others the way`, rebel: `creates by breaking existing forms`, trickster: `makes through mockery and exaggeration`, innocent: `bringing-into-being while wonder, not technical mastery, stays the driving force`, mystic: `pulls the unseen into form` }
  },

  explorer: {
    coreWoundShort: `confinement`,
    overview: `The Explorer is organized around freedom — the need for room to roam, to discover, to keep moving toward what hasn't been seen yet. Where the Caregiver needs someone to hold, the Explorer needs nothing to hold it back. This is the archetype of the open road, in every sense: physical, intellectual, spiritual.`,
    motivations: `To keep discovering — places, ideas, versions of itself it hasn't met yet. To stay authentic rather than settle into a role that isn't really its own. To answer the call outward rather than let comfort calcify into a cage.`,
    coreWound: `The fear of being trapped — in a place, a routine, a relationship, an identity — that was never really chosen and can't be left. This wound is what makes commitment genuinely difficult for the Explorer: not immaturity, but a real, deep dread that closing one door closes all of them.`,
    fears: `Being trapped in a life that isn't really its own. Missing the larger world by staying too long in one place. Discovering, too late, that it never actually chose anything — it just kept running.`,
    addictions: `The longing for freedom, rerouted into: novelty as compulsion (always the next place, the next relationship, never staying long enough for depth), leaving as a reflex whenever things get difficult rather than a genuine choice, restlessness mistaken for purpose.`,
    traits: `Curious, independent, adaptable, energized by new experience, uncomfortable with routine, values authenticity over social approval.`,
    blindSpots: `Can mistake leaving for growth. May abandon people or projects right when depth was about to begin. Struggles to distinguish real confinement from the ordinary friction that all commitment requires.`,
    dreams: `To see as much of the world, in every sense, as a single life allows. To find a freedom that doesn't require constant motion — a way to be free and rooted. To discover that the deepest frontier was internal all along.`,
    stages: [
      `The road chosen over the people left behind; abandonment dressed as freedom.`,
      `Freedom from commitment rather than freedom for a life — running rather than seeking.`,
      `Everyday Explorer — craves freedom and new experience, feels alive venturing beyond the familiar.`,
      `Mature freedom — explores with purpose, can commit without feeling caged.`,
      `Marks a path for others to follow, purely through how they serve — being genuinely first, for others' sake.`
    ],
    temperaments: { heart: `feeling-led freedom, follows what moves it`, mind: `explores to map, to understand the terrain first`, body: `the physical frontier, movement as the point`, soul: `travels specifically for meaning` },
    pairings: { lover: ``, caregiver: `tends while still roaming`, everyman: ``, ruler: ``, warrior: ``, creator: `makes something whose purpose is showing others the way`, sage: ``, rebel: `refuses the herd's brand entirely`, trickster: `gets where it's not supposed to be`, innocent: `discovery held with wonder, not cynicism`, mystic: `journeys through space and toward the sacred at once` }
  },

  rebel: {
    coreWoundShort: `powerlessness before injustice`,
    overview: `The Rebel is organized around resistance to what's unfair, dead, or oppressive — the conviction that some systems deserve to be questioned rather than obeyed. Where the Everyman finds itself inside the group, the Rebel defines itself, at least partly, against illegitimate authority. This is the archetype of principled refusal.`,
    motivations: `To push back against injustice rather than accept it quietly. To live authentically rather than perform conformity. To break systems that have outlived their legitimacy.`,
    coreWound: `The formative wound is often a moment of watching something unjust happen and being unable to stop it. This is why the Rebel's opposition can look disproportionate from the outside — it isn't really about the immediate fight, it's about never again standing by helplessly while unfairness wins.`,
    fears: `Going along with something wrong just because everyone else already did. Becoming the very authority it once opposed. Discovering its rebellion was really just performance.`,
    addictions: `The longing for justice, rerouted into: opposition as identity (against everything, for nothing coherent), contrarianism that has stopped tracking actual injustice, destruction mistaken for liberation.`,
    traits: `Questioning, independent-minded, uncomfortable with unexamined authority, willing to be disliked for a principle, energized by systemic problems others accept as fixed.`,
    blindSpots: `Can oppose reflexively, losing the ability to tell a bad system from an imperfect-but-worth-keeping one. May destroy without a plan for what replaces it. Struggles to build coalitions, since compromise can feel like betrayal of the cause.`,
    dreams: `To see a genuinely unjust system actually change because it refused to look away. To be remembered as someone who was right early, not just loud. To find, eventually, something worth building rather than only something worth tearing down.`,
    stages: [
      `Burned the system down, kept no blueprint — destruction with nothing left to believe in.`,
      `Opposition as identity; against everything, for nothing in particular.`,
      `Everyday Rebel — pushes back against unfairness, feels compelled to question and change.`,
      `Mature resistance — questions with purpose, builds coalitions, fights winnable fights.`,
      `Disrupts stagnant power specifically in service of those still trapped by it.`
    ],
    temperaments: { heart: `questions on behalf of the hurt, not the abstract principle`, mind: `questions through argument, dismantles reasoning`, body: `feet in the street, physical presence as resistance`, soul: `conscientious refusal, quiet and permanent` },
    pairings: { lover: ``, caregiver: ``, everyman: `of the people, against the crown`, ruler: `rebellion with intent to build a new order, not just overthrow`, warrior: ``, creator: ``, sage: ``, explorer: ``, trickster: `mockery deployed as resistance`, innocent: `the one who simply says the emperor is naked`, mystic: `defies stagnant power in the name of what's been forgotten` }
  },

  trickster: {
    coreWoundShort: `a world with no play left in it`,
    overview: `The Trickster is organized around disruption through humor — the delight in finding the crack in something too rigid or self-important and pulling at it until everyone sees the absurdity. Where the Ruler builds order, the Trickster tests whether that order still deserves to stand. This is the archetype of sacred irreverence.`,
    motivations: `To expose what's fake, stuck, or pretending to be more serious than it is. To keep life from calcifying into humorless rigidity. To use laughter as a form of truth-telling that direct confrontation can't achieve.`,
    coreWound: `The Trickster's deepest fear isn't punishment for its mischief — it's a world that has become so rigid nothing it says can loosen anything anymore. This wound explains why the Trickster often escalates when ignored: the joke isn't landing not because it's wrong, but because the world has stopped being able to laugh at itself.`,
    fears: `A world with no play left in it. Being taken so unseriously that its actual insight goes unheard. Becoming cruel rather than clever — crossing from disruption into harm.`,
    addictions: `The longing to disrupt, rerouted into: mockery for its own sake, disconnected from any real target worth exposing, chaos as compulsion rather than a scalpel used with intent, cruelty mistaken for wit.`,
    traits: `Quick-witted, irreverent, sees absurdity others miss, uncomfortable with unearned solemnity, often the one who says the thing everyone was thinking but wouldn't say.`,
    blindSpots: `Can wound people while believing it's only playing. May avoid real vulnerability by deflecting everything into a joke. Struggles to be taken seriously even when it's right, having trained everyone not to expect that.`,
    dreams: `To expose one genuinely false, harmful pretension and watch it actually fall. To be trusted enough that its jokes are heard as insight, not just noise. To someday be serious without anyone assuming it's an act.`,
    stages: [
      `Chaos for its own sake, no longer aimed at anything worth exposing — harm dressed as a joke.`,
      `Mischief that's curdled into manipulation; the trick now serves the Trickster alone.`,
      `Everyday Trickster — pokes holes in rigid rules, uses humor to expose what's fake or stuck.`,
      `Sees what others can't — disruption in service of genuine, useful new patterns.`,
      `The one fool allowed to tell the king the truth — disruption entirely in service of what's real.`
    ],
    temperaments: { heart: `roasting as a form of affection`, mind: `wordplay, satire, the sharpened line`, body: `physical comedy, the pratfall, the setup`, soul: `the jest aimed at pretension around the sacred itself` },
    pairings: { lover: ``, caregiver: ``, everyman: `surviving hierarchy through cunning and irreverence`, ruler: `rules the game while playing it`, warrior: ``, creator: ``, sage: `Socrates' own historical epithet — a truth-seeker who irritates complacent certainty`, explorer: ``, rebel: ``, innocent: `mischief without malice`, mystic: `Loki, Coyote, Raven — trickery of the unseen itself` }
  },

  innocent: {
    coreWoundShort: `betrayal (the Orphan)`,
    overview: `The Innocent is organized around trust — the choice to believe things will work out, and to stay honest and kind even when it's costly. Where the Warrior assumes the world must be made safe, the Innocent assumes goodness is the truer story underneath the surface. This is the archetype whose entire arc bends around one crossing: the moment trust is broken.`,
    motivations: `To believe the best about people and things, and to act accordingly. To stay kind in a world that sometimes punishes kindness. To find, or rebuild, something worth trusting completely.`,
    coreWound: `Unlike the other eleven archetypes, the Innocent's arc has a named crossing built into it. The Orphan is not a rung on the ladder; it's the core wound the entire arc bends around — broken trust, betrayal, the discovery that something believed-in wasn't what it seemed. Every altitude below describes a different relationship to that wound: refusing to look at it, being consumed by it, or being healed by having survived it.`,
    fears: `Discovering that what it trusted was never what it believed. Being naive in a way that gets it or someone else hurt. Becoming cynical — losing the very quality that makes it who it is.`,
    addictions: `The longing to trust, rerouted into: denial used to avoid ever having to face betrayal, toxic positivity that refuses to look at real harm, attaching quickly and uncritically to avoid the discomfort of discernment.`,
    traits: `Hopeful, sincere, quick to see good in people, uncomfortable with cynicism or manipulation, often the one who gives others the benefit of the doubt longest.`,
    blindSpots: `Can mistake denial for faith. May stay in harmful situations because leaving would mean admitting the trust was misplaced. Struggles to hold both realism and hope at once — tends to swing to one or the other rather than integrating them.`,
    dreams: `To be right that people are fundamentally good, and to see that proven over a lifetime. To trust again after being hurt, without becoming naive in the same way twice. To become, eventually, the person whose survived trust helps someone else trust again.`,
    stages: [
      `Broken trust generalized to everyone and everything — armored, closed, expecting betrayal.`,
      `The Believer, afraid, refuses to look at the wound — denial, toxic positivity, willful blindness.`,
      `Everyday Innocent — believes things will work out, stays true to what feels honest and good.`,
      `Trust rebuilt clear-eyed — hope that has actually looked at harm and chosen to trust again anyway.`,
      `Knows the worst and trusts anyway — the healed wound now helps others survive theirs.`
    ],
    temperaments: { heart: `believes in you, specifically, out loud`, mind: `belief held as principle, articulated`, body: `trust enacted plainly, does the honest thing`, soul: `trust as faith, a way of orienting to the whole of life` },
    pairings: { lover: `carries trust and the real risk of faith, not just uncomplicated youthful devotion`, caregiver: ``, everyman: ``, ruler: ``, warrior: `strength that stays kind`, creator: `bringing-into-being while wonder stays the driving force`, sage: ``, explorer: `discovery expected to be marvelous, not just movement`, rebel: ``, trickster: ``, mystic: `trust extended past the visible, into mystery itself` }
  },

  mystic: {
    coreWoundShort: `meaninglessness`,
    overview: `The Mystic is organized around communion with what can't quite be explained — drawn to silence, symbol, and the sense that ordinary life has layers beneath its surface. Where the Creator pulls the unseen into form, the Mystic rests inside the unseen without needing to make anything of it. This is the archetype of direct, unmediated encounter with mystery.`,
    motivations: `To touch something larger than the self, directly, without an intermediary. To sit with what can't be fully explained rather than rush to explain it away. To live with reverence for what's hidden beneath the visible world.`,
    coreWound: `The Mystic's deepest fear is a life that never touches anything beyond the ordinary — pure surface, no depth, no encounter with anything larger. This wound is what drives its restlessness with merely material explanations: not a rejection of reason, but a hunger reason alone has never satisfied.`,
    fears: `A world with no depth left in it. Discovering the sense of something-more was only ever a feeling, with nothing behind it. Being unable to return from the inner world to function in the outer one.`,
    addictions: `The longing for awe, rerouted into: dissociation mistaken for transcendence, spiritual bypassing (using the language of the sacred to avoid ordinary human work), chasing altered states as a substitute for sustained inner practice.`,
    traits: `Intuitive, drawn to symbol and silence, comfortable with ambiguity and the unexplainable, often perceived by others as somewhat elsewhere.`,
    blindSpots: `Can use the language of depth to avoid concrete responsibility. May mistake dissociation for genuine communion. Struggles to translate inner insight into anything usable by people who don't share its frame.`,
    dreams: `To have one undeniable, unmistakable encounter with something larger than itself. To bring back something real from the inner world that actually helps someone else. To stay grounded enough in ordinary life that the depth doesn't cost it its footing.`,
    stages: [
      `Communion with mystery with no mooring left — lost entirely, unable to return to ordinary function.`,
      `Elsewhere as a permanent address; presence in ordinary life has become optional.`,
      `Everyday Mystic — senses deeper layers, drawn to silence, symbolism, inner experience.`,
      `Mature perception — sees clearly into what's hidden, stays grounded while doing it.`,
      `Temperaments what it perceives directly into service of others — mystery made useful, not just felt.`
    ],
    temperaments: { heart: `feels the unseen in people, deeply attuned to the invisible`, mind: `reads signs, dreams, the grammar of a tradition`, body: `the unseen through dance, breath, ritual, embodied practice`, soul: `communion in silence, sustained stillness` },
    pairings: { lover: ``, caregiver: ``, everyman: ``, ruler: ``, warrior: ``, creator: `pulls the unseen into form`, sage: `carries direct communion back as living truth`, explorer: `journeys through space and toward the sacred at once`, rebel: ``, trickster: ``, innocent: `` }
  }
};
