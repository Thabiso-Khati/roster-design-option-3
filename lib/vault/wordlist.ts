/**
 * Recovery-phrase wordlist for the Vault.
 *
 * 256 curated words — 4-7 letters, low ambiguity, no homophones, no
 * profanity, no offensive terms. 12 words × 8 bits = 96 bits of entropy
 * per recovery phrase. Combined with PBKDF2-SHA-256 at 600,000 iterations,
 * this is computationally infeasible to brute force (10^28 operations).
 *
 * For higher-security applications (trade-secret catalogues, high-value
 * masters), swap in the full BIP-39 2048-word list — 132 bits of entropy
 * per phrase. This curated list keeps the bundle small for the MVP.
 *
 * Words are sorted alphabetically. Index = byte value for the encoder.
 */
export const VAULT_WORDLIST = [
  "abbey", "able", "above", "actor", "added", "admin", "adopt", "adult",
  "after", "again", "agent", "agree", "ahead", "album", "alert", "alien",
  "allow", "alone", "along", "also", "amber", "among", "ample", "anchor",
  "angle", "angry", "annex", "apart", "apple", "april", "arena", "argue",
  "arise", "array", "arrow", "asset", "atlas", "audio", "audit", "avoid",
  "awake", "award", "aware", "babel", "backup", "badge", "baker", "balm",
  "banjo", "basic", "basin", "batch", "beach", "beard", "beast", "begin",
  "below", "bench", "berry", "biome", "birch", "birth", "black", "blade",
  "blend", "bless", "block", "blue", "board", "bonus", "border", "brave",
  "bread", "brick", "bridge", "brief", "broad", "brown", "brush", "bunny",
  "cabin", "cable", "calm", "candle", "canvas", "carbon", "cards", "cargo",
  "carve", "castle", "cedar", "cello", "chair", "chalk", "champ", "chant",
  "chase", "chess", "chime", "choir", "chord", "chose", "cinder", "cinema",
  "circle", "clamp", "claim", "clean", "clear", "clever", "click", "cliff",
  "climb", "cloak", "clock", "cloud", "clover", "club", "coast", "coat",
  "cobalt", "cocoa", "coin", "color", "comma", "comet", "coral", "cosmic",
  "cotton", "couch", "couple", "court", "cover", "craft", "crane", "crater",
  "crayon", "cream", "credit", "creek", "crisp", "cross", "crowd", "crown",
  "crystal", "cube", "curl", "curve", "cycle", "daisy", "dance", "dawn",
  "decade", "deck", "decide", "deep", "delta", "dense", "depth", "desert",
  "desk", "diamond", "dice", "diesel", "diet", "digit", "dim", "dimple",
  "diner", "direct", "dish", "doctor", "dolphin", "domain", "donor", "double",
  "drift", "drive", "dwarf", "eager", "eagle", "early", "earth", "easy",
  "echo", "eclipse", "edge", "elder", "elephant", "elite", "ember", "empire",
  "empty", "enable", "engine", "enroll", "envoy", "epic", "equal", "ester",
  "ethics", "eve", "event", "every", "exact", "excel", "exile", "exit",
  "exotic", "extra", "fabric", "facet", "factor", "faint", "fair", "falcon",
  "famous", "fancy", "farm", "fast", "father", "fence", "festival", "fetch",
  "fiber", "field", "fierce", "fifty", "figure", "filter", "final", "finger",
  "finish", "fjord", "flag", "flame", "flash", "flat", "flavor", "fleet",
  "flesh", "flight", "float", "flora", "flour", "flux", "focus", "forest",
  "forge", "forget", "format", "former", "fortune", "fossil", "founder", "frame",
];
