import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type { ImportedBookMeta, ImportedChapter } from '@/types/book'
import { normalizeBookText } from '@/utils/textNormalizer'
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
 * Import a PDF file.
 *
 * Extracts text page by page, groups consecutive pages into chapters,
 * normalizes the text, and returns metadata + chapter data ready for storage.
 */
export async function importPdf(file: File, pagesPerChapter: number = 5): Promise<PdfImportResult> {
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
      const normalized = normalizeBookText(rawText)
      pageTexts.push(normalized)
    }

    // Group pages into chapters
    const chapters: ImportedChapter[] = []
    for (let start = 0; start < pageTexts.length; start += pagesPerChapter) {
      const end = Math.min(start + pagesPerChapter, pageTexts.length)
      const chapterText = pageTexts.slice(start, end).join('\n\n')

      // Skip chapters with no meaningful text
      if (chapterText.trim().length === 0) continue

      chapters.push({
        bookId: id,
        index: chapters.length,
        title: `Chapter ${chapters.length + 1}`,
        text: chapterText,
      })
    }

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
