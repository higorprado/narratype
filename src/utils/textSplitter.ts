export interface SplitOptions {
  targetWords?: number
}

const DEFAULT_TARGET_WORDS = 350

/**
 * Splits text into pages, preferring paragraph boundaries.
 * Each page targets approximately `targetWords` words.
 * Paragraphs are defined by double newlines (\n\n).
 */
export function splitTextIntoPages(
  text: string,
  options: SplitOptions = {},
): string[] {
  const targetWords = options.targetWords ?? DEFAULT_TARGET_WORDS

  if (!text.trim()) {
    return [text]
  }

  const paragraphs = text.split(/\n\n+/)

  // If the text fits in one page, return it as-is
  const totalWords = text.split(/\s+/).filter(Boolean).length
  if (totalWords <= targetWords * 1.5) {
    return [text]
  }

  const pages: string[] = []
  let currentPage: string[] = []
  let currentWordCount = 0

  for (const paragraph of paragraphs) {
    const paraWordCount = paragraph.split(/\s+/).filter(Boolean).length

    // If adding this paragraph would exceed target and we already have content,
    // finalize the current page
    if (
      currentPage.length > 0 &&
      currentWordCount + paraWordCount > targetWords * 1.5
    ) {
      pages.push(currentPage.join('\n\n'))
      currentPage = []
      currentWordCount = 0
    }

    // If a single paragraph exceeds target, split it by words
    if (paraWordCount > targetWords * 1.5 && currentPage.length === 0) {
      const words = paragraph.split(/(\s+)/)
      let subPageWords: string[] = []
      let subWordCount = 0

      for (const word of words) {
        subPageWords.push(word)
        if (word.trim()) subWordCount++

        if (subWordCount >= targetWords) {
          pages.push(subPageWords.join('').trim())
          subPageWords = []
          subWordCount = 0
        }
      }

      if (subPageWords.length > 0) {
        const remainder = subPageWords.join('').trim()
        currentWordCount = subWordCount
        currentPage = [remainder]
      }
    } else {
      currentPage.push(paragraph)
      currentWordCount += paraWordCount
    }
  }

  if (currentPage.length > 0) {
    pages.push(currentPage.join('\n\n'))
  }

  return pages.length > 0 ? pages : [text]
}
