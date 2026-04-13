/**
 * Normalize book text from Project Gutenberg sources.
 *
 * Single newlines are line-wrapping artifacts from the original text and should
 * be collapsed to spaces. Double newlines represent actual paragraph breaks and
 * are preserved.
 */
export function normalizeBookText(text: string): string {
  // Replace sequences of exactly one \n (not part of \n\n) with a space.
  // Strategy: temporarily mark paragraph breaks, normalize remaining newlines,
  // then restore paragraph breaks.
  return text
    .replace(/\n\n+/g, '\n\n')          // collapse 3+ newlines to exactly 2
    .replace(/(?<!\n)\n(?!\n)/g, ' ')   // lone \n → space (not preceded/followed by \n)
    .replace(/  +/g, ' ')               // collapse multiple spaces created by replacement
    .trim()
}
