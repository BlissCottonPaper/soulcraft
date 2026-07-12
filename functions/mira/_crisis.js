// ============================================================
// /functions/mira/_crisis.js  —  deterministic crisis detection
// ============================================================
// A second, INDEPENDENT safety layer (Session 3.2). Mira's own prompt already
// handles crisis compassionately, but a generated model can miss or soften a
// signal — so this keyword/pattern pass runs on every user message and, when it
// fires, the endpoint tells the client to show the crisis UI (988) regardless of
// what Mira's reply says. First pass = pattern-based; deliberately tuned to catch
// clear self-harm / suicide / harm-to-others language, accepting some false
// positives (a false crisis banner is safe; a missed one is not).
//
// This never blocks or alters Mira's reply — it only raises a flag alongside it.
// ============================================================

// Explicit high-signal phrases. Word-boundaried, case-insensitive.
const PATTERNS = [
  // suicide / ending one's life
  /\bkill(?:ing)?\s+my\s*self\b/i,
  /\bkms\b/i,
  /\bsuicidal?\b/i,
  /\b(?:commit|committing)\s+suicide\b/i,
  /\bend(?:ing)?\s+(?:my|it\s+all|my\s+own)\s+life\b/i,
  /\b(?:want|wanting|going)\s+to\s+die\b/i,
  /\bi\s+(?:want|wish)\s+(?:to\s+)?(?:die|be\s+dead)\b/i,
  /\bdon'?t\s+want\s+to\s+(?:be\s+here|live|be\s+alive|exist|wake\s+up)\b/i,
  /\bno\s+(?:reason|point)\s+(?:to|in)\s+liv(?:e|ing)\b/i,
  /\bnothing\s+to\s+live\s+for\b/i,
  /\bcan'?t\s+(?:go\s+on|do\s+this\s+anymore|keep\s+going)\b/i,
  /\btake\s+my\s+own\s+life\b/i,
  /\bwould\s+be\s+better\s+if\s+i\s+(?:were|was)\s+(?:dead|gone|not\s+here)\b/i,
  // "better off / better without me" and passive ideation — the phrasing that
  // slipped through: "the world would be better without me in it."
  /\bbetter\s+off\s+(?:dead|gone)\b/i,
  /\bbetter\s+(?:off\s+)?without\s+me\b/i,
  /\bwithout\s+me\s+in\s+it\b/i,
  /\b(?:everyone|everybody|they|people|the\s+world|life|things|you'?d\s+all)\b[^.?!]{0,40}\bbetter\s+(?:off\s+)?without\s+me\b/i,
  /\bwish\s+i\s+(?:was|were|wasn'?t|weren'?t|had\s+never)\s+(?:dead|gone|here|alive|born)\b/i,
  /\bwish\s+i\s+(?:could\s+)?(?:not\s+wake\s+up|never\s+wake\s+up)\b/i,
  /\bwouldn'?t\s+matter\s+if\s+i\s+(?:was|were)\s+(?:gone|dead)\b/i,
  /\bno\s?(?:one|body)\s+would\s+(?:miss\s+me|care\s+if\s+i\s+(?:died|was\s+gone|disappeared))\b/i,
  /\bwant\s+(?:it\s+all|everything|the\s+pain|this\s+pain)\s+to\s+(?:end|stop)\b/i,
  /\bwant\s+to\s+(?:disappear\s+forever|not\s+exist|stop\s+existing)\b/i,
  /\btired\s+of\s+(?:being\s+alive|living|life)\b/i,
  // self-harm
  /\b(?:hurt|harm|cut|cutting)\s+my\s*self\b/i,
  /\bself[-\s]?harm\b/i,
  // harm to others
  /\bkill\s+(?:him|her|them|someone|everyone|you)\b/i,
  /\bhurt\s+(?:someone|somebody|people|others)\b/i,
  /\bshoot\s+up\b/i,
];

export function detectCrisis(message) {
  if (!message || typeof message !== "string") return false;
  const text = message.toLowerCase();
  for (let i = 0; i < PATTERNS.length; i++) {
    if (PATTERNS[i].test(text)) return true;
  }
  return false;
}
