import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type { ImportedBookMeta, ImportedChapter } from '@/types/book'
import { generateSlug } from '@/utils/slugify'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

export interface PdfImportResult {
  meta: ImportedBookMeta
  chapters: ImportedChapter[]
}

/** Extract text from a single PDF page. */
async function extractPageText(page: pdfjsLib.PDFPageProxy): Promise<string> {
  const content = await page.getTextContent()
  const parts: string[] = []
  for (const item of content.items) {
    if (!('str' in item)) continue
    const textItem = item as { str: string; hasEOL?: boolean }
    parts.push(textItem.str)
    if (textItem.hasEOL) parts.push('\n')
  }
  return parts.join('')
}

/**
 * Split text into paragraphs, then group paragraphs into chapters
 * that stay under `wordsPerChapter` words, breaking at paragraph boundaries.
 */
function splitIntoChapters(
  allText: string,
  wordsPerChapter: number,
  bookId: string,
): ImportedChapter[] {
  const paragraphs = allText.split(/\n\n+/).filter(p => p.trim().length > 0)
  if (paragraphs.length === 0) return []

  const chapters: ImportedChapter[] = []
  let currentParagraphs: string[] = []
  let currentWordCount = 0

  function countWords(text: string): number {
    return text.split(/\s+/).filter(w => w.length > 0).length
  }

  function flushChapter() {
    if (currentParagraphs.length === 0) return
    chapters.push({
      bookId,
      index: chapters.length,
      title: `Chapter ${chapters.length + 1}`,
      text: currentParagraphs.join('\n\n'),
    })
    currentParagraphs = []
    currentWordCount = 0
  }

  for (const para of paragraphs) {
    const paraWords = countWords(para)

    // If this paragraph alone exceeds the limit and we already have content, flush first
    if (currentWordCount > 0 && currentWordCount + paraWords > wordsPerChapter) {
      flushChapter()
    }

    currentParagraphs.push(para)
    currentWordCount += paraWords

    // If we've reached the target, flush
    if (currentWordCount >= wordsPerChapter) {
      flushChapter()
    }
  }

  // Flush remaining paragraphs
  flushChapter()

  return chapters
}

/**
 * Import a PDF file.
 *
 * Extracts text page by page, splits into chapters by word count
 * (breaking at paragraph boundaries),
 * and returns metadata + chapter data ready for storage.
 * Text normalization is handled at read time by getChapter().
 */
export async function importPdf(file: File, wordsPerChapter: number = 1750): Promise<PdfImportResult> {
  const buffer = await file.arrayBuffer()
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise

  try {
    const title = file.name.replace(/\.pdf$/i, '')
    const author = 'Unknown Author'
    const language = 'en'
    const id = crypto.randomUUID()
    const slug = generateSlug(title, author)

    const totalPages = doc.numPages

    if (totalPages === 0) {
      throw new Error('PDF has no pages')
    }

    // Extract text from all pages
    const pageTexts: string[] = []
    for (let i = 1; i <= totalPages; i++) {
      const page = await doc.getPage(i)
      const rawText = await extractPageText(page)
      pageTexts.push(rawText)
    }

    const allText = pageTexts.join('\n\n')
    const chapters = splitIntoChapters(allText, wordsPerChapter, id)

    if (chapters.length === 0) {
      throw new Error('PDF contains no extractable text content')
    }

    const meta: ImportedBookMeta = {
      id,
      slug,
      title,
      author,
      language,
      coverUrl: '',
      importDate: Date.now(),
      chapterCount: chapters.length,
    }

    return { meta, chapters }
  } finally {
    doc.destroy()
  }
}
