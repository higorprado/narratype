import type { TextContent } from 'pdfjs-dist/types/src/display/api'
import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type { ImportedBookMeta, ImportedChapter } from '@/types/book'
import { generateSlug } from '@/utils/slugify'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

export interface PdfImportResult {
  meta: ImportedBookMeta
  chapters: ImportedChapter[]
}

/** Tolerance in PDF points for grouping items on the same line. */
const LINE_Y_TOLERANCE = 3
/** Minimum x-gap between groups on the same line to be considered separate columns. */
const COLUMN_GAP_THRESHOLD = 80
/** Number of pages to scan for repeating header/footer blocks. */
const HEADER_SCAN_PAGES = 15
/** Fraction of scanned pages a text block must appear in to be considered header/footer. */
const HEADER_REPEAT_FRACTION = 0.75


interface TextItem {
  str: string
  x: number
  y: number
  width: number
  height: number
  fontName: string
}

interface LineItem {
  text: string
  x: number
  y: number
  width: number
  fontSize: number
}

/**
 * Extract raw text items with position data from a PDF page.
 */
function extractTextItems(content: TextContent): TextItem[] {
  const items: TextItem[] = []
  for (const item of content.items) {
    if (!('str' in item)) continue
    const textItem = item as { str: string; transform: number[]; width: number; height: number; fontName?: string }
    if (textItem.str.trim().length === 0) continue
    items.push({
      str: textItem.str,
      x: Math.round(textItem.transform[4]),
      y: Math.round(textItem.transform[5]),
      width: Math.round(textItem.width),
      height: Math.round(textItem.height),
      fontName: textItem.fontName ?? '',
    })
  }
  return items
}

/**
 * Group text items into lines by y-coordinate, sorted top-to-bottom.
 * Within each line, items are sorted left-to-right by x-coordinate.
 */
function groupIntoLines(items: TextItem[]): LineItem[][] {
  if (items.length === 0) return []

  // Sort by y descending (top of page first in PDF coordinates)
  const sorted = [...items].sort((a, b) => b.y - a.y)

  const lines: LineItem[][] = []
  let currentLine: TextItem[] = [sorted[0]]
  let currentY = sorted[0].y

  for (let i = 1; i < sorted.length; i++) {
    const item = sorted[i]
    if (Math.abs(item.y - currentY) <= LINE_Y_TOLERANCE) {
      currentLine.push(item)
    } else {
      // Flush current line — sort by x (left to right)
      currentLine.sort((a, b) => a.x - b.x)
      lines.push(currentLine.map(it => ({
        text: it.str,
        x: it.x,
        y: it.y,
        width: it.width,
        fontSize: Math.round(it.height),
      })))
      currentLine = [item]
      currentY = item.y
    }
  }

  // Flush last line
  currentLine.sort((a, b) => a.x - b.x)
  lines.push(currentLine.map(it => ({
    text: it.str,
    x: it.x,
    y: it.y,
    width: it.width,
    fontSize: Math.round(it.height),
  })))

  return lines
}

/**
 * Reconstruct text from lines, handling multi-column layouts.
 * Detects column gaps within a line and separates them with newlines.
 */
function linesToText(lines: LineItem[][]): string {
  const paragraphs: string[] = []

  for (const line of lines) {
    if (line.length === 0) continue

    // Detect column gaps: if there's a large x-gap between consecutive items
    const segments: string[] = []
    let currentSegment = line[0].text
    let lastX = line[0].x + line[0].width

    for (let i = 1; i < line.length; i++) {
      const gap = line[i].x - lastX
      if (gap > COLUMN_GAP_THRESHOLD) {
        // New column — flush current segment
        segments.push(currentSegment)
        currentSegment = line[i].text
      } else {
        // Same column — join with space if needed
        const needsSpace = !currentSegment.endsWith(' ') && !line[i].text.startsWith(' ')
        currentSegment += needsSpace ? ' ' + line[i].text : line[i].text
      }
      lastX = line[i].x + line[i].width
    }
    segments.push(currentSegment)

    // Each segment is a separate text block (column)
    paragraphs.push(...segments)
  }

  return paragraphs.join('\n')
}

/**
 * Detect repeating header/footer text blocks across multiple pages.
 * Returns a set of "text@y" keys that should be filtered out.
 */
function detectHeaderFooters(pageItems: TextItem[][]): Set<string> {
  const totalPages = pageItems.length
  const pagesToScan = Math.min(HEADER_SCAN_PAGES, totalPages)
  const threshold = Math.max(3, Math.ceil(pagesToScan * HEADER_REPEAT_FRACTION))

  // Count how many pages each (text, y-position) combo appears in
  const occurrences = new Map<string, number>()

  for (let i = 0; i < pagesToScan; i++) {
    const seen = new Set<string>()
    for (const item of pageItems[i]) {
      // Round y to nearest 2 to handle minor position jitter
      const yBucket = Math.round(item.y / 2) * 2
      const key = `${item.str.trim()}@${yBucket}`
      if (!seen.has(key)) {
        seen.add(key)
        occurrences.set(key, (occurrences.get(key) ?? 0) + 1)
      }
    }
  }

  // Anything appearing in >= threshold pages is a header/footer
  const headers = new Set<string>()
  for (const [key, count] of occurrences) {
    if (count >= threshold) headers.add(key)
  }

  return headers
}

/**
 * Check if a text item matches a header/footer pattern.
 */
function isHeaderFooter(item: TextItem, headers: Set<string>): boolean {
  const yBucket = Math.round(item.y / 2) * 2
  return headers.has(`${item.str.trim()}@${yBucket}`)
}

/**
 * Extract text from a single PDF page, using position-based reconstruction.
 * Filters out header/footer blocks identified in the detection phase.
 */
function extractPageText(
  content: TextContent,
  headers: Set<string>,
): string {
  const allItems = extractTextItems(content)

  // Filter out header/footer items
  const filtered = allItems.filter(item => !isHeaderFooter(item, headers))

  // Group into lines by y-position
  const lines = groupIntoLines(filtered)

  // Reconstruct text with column detection
  return linesToText(lines)
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
 * Extracts text page by page using position-based reconstruction,
 * detects and filters repeating headers/footers, handles multi-column
 * layouts, and splits into chapters by word count.
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

    // Phase 1: Extract raw text items from all pages for header detection
    const pageRawItems: TextItem[][] = []
    const pageContents: TextContent[] = []
    for (let i = 1; i <= totalPages; i++) {
      const page = await doc.getPage(i)
      const content = await page.getTextContent()
      pageContents.push(content)
      pageRawItems.push(extractTextItems(content))
    }

    // Phase 2: Detect repeating header/footer blocks
    const headers = detectHeaderFooters(pageRawItems)

    // Phase 3: Extract text from each page with headers filtered
    const pageTexts: string[] = []
    for (let i = 0; i < totalPages; i++) {
      const text = extractPageText(pageContents[i], headers)
      pageTexts.push(text)
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
