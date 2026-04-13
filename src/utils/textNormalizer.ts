/**
 * Normalize book text from Project Gutenberg sources.
 *
 * Single newlines are line-wrapping artifacts from the original text and should
 * be collapsed to spaces. Double newlines represent actual paragraph breaks and
 * are preserved.
 *
 * Curly/smart quotes are normalized to straight quotes so they match keyboard input.
 * Diacritics and special characters are normalized to ASCII equivalents.
 */

/** Mapping of typographic quotes to straight equivalents. */
const QUOTE_REPLACEMENTS: ReadonlyMap<string, string> = new Map([
  ['\u2018', "'"],  // left single quote → straight apostrophe
  ['\u2019', "'"],  // right single quote → straight apostrophe
  ['\u201C', '"'],  // left double quote → straight quote
  ['\u201D', '"'],  // right double quote → straight quote
  ['\u00AB', '"'],  // left guillemet → straight quote
  ['\u00BB', '"'],  // right guillemet → straight quote
])

const QUOTE_PATTERN = /[\u2018\u2019\u201C\u201D\u00AB\u00BB]/g

/** Mapping of diacritics and special characters to ASCII equivalents. */
const CHAR_REPLACEMENTS: ReadonlyMap<string, string> = new Map([
  ['\u016D', 'u'],  // ŭ → u (breve)
  ['\u016C', 'U'],  // Ŭ → U
  ['\u0153', 'oe'], // œ → oe
  ['\u0152', 'Oe'], // Œ → Oe
  ['\u00A7', 'sec.'], // § → sec.
  ['\u2026', '...'], // … → ...
  ['\u00B0', 'deg'], // ° → deg
  ['\u00FC', 'u'],  // ü → u
  ['\u00DC', 'U'],  // Ü → U
  ['\u00E9', 'e'],  // é → e
  ['\u00C9', 'E'],  // É → E
  ['\u00F4', 'o'],  // ô → o
  ['\u00D4', 'O'],  // Ô → O
  ['\u00F6', 'o'],  // ö → o
  ['\u00D6', 'O'],  // Ö → O
  ['\u00B4', "'"],  // ´ (acute accent) → '
])

const CHAR_PATTERN = /[\u016D\u016C\u0153\u0152\u00A7\u2026\u00B0\u00FC\u00DC\u00E9\u00C9\u00F4\u00D4\u00F6\u00D6\u00B4]/g

function normalizeChars(text: string): string {
  return text.replace(CHAR_PATTERN, (ch) => CHAR_REPLACEMENTS.get(ch) ?? ch)
}

function normalizeQuotes(text: string): string {
  return text.replace(QUOTE_PATTERN, (ch) => QUOTE_REPLACEMENTS.get(ch) ?? ch)
}

export function normalizeBookText(text: string): string {
  return normalizeChars(normalizeQuotes(text))
    .replace(/\n\n+/g, '\n\n')          // collapse 3+ newlines to exactly 2
    .replace(/(?<!\n)\n(?!\n)/g, ' ')   // lone \n → space (not preceded/followed by \n)
    .replace(/  +/g, ' ')               // collapse multiple spaces created by replacement
    .trim()
}