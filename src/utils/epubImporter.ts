import { initEpubFile } from '@lingo-reader/epub-parser'
import type { ImportedBookMeta, ImportedChapter } from '@/types/book'
import { normalizeBookText } from '@/utils/textNormalizer'

export interface EpubImportResult {
  meta: ImportedBookMeta
  chapters: ImportedChapter[]
}

/** Strip HTML to plain text, preserving paragraph breaks from block-level elements. */
const BLOCK_TAGS = new Set([
  'P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'BLOCKQUOTE', 'LI', 'SECTION', 'ARTICLE', 'TR', 'DT', 'DD',
])

export function htmlToPlainText(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const parts: string[] = []

  function walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent
      if (text) parts.push(text)
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement
      if (el.tagName === 'BR') {
        parts.push('\n')
      } else {
        for (const child of el.childNodes) walk(child)
        if (BLOCK_TAGS.has(el.tagName)) parts.push('\n\n')
      }
    }
  }

  walk(doc.body)
  return parts
    .join('')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/(^|\n) +/g, '$1')
    .replace(/ +(\n|$)/g, '$1')
}

/** Generate a URL-safe slug from title and author. */
function generateSlug(title: string, author: string): string {
  const raw = `${title} ${author}`
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

/**
 * Import an EPUB file.
 *
 * Parses the EPUB, extracts chapter text, normalizes it,
 * and returns metadata + chapter data ready for storage.
 */
export async function importEpub(file: File): Promise<EpubImportResult> {
  const epub = await initEpubFile(file)
  try {
    const metadata = epub.getMetadata()
    const spine = epub.getSpine()

    const title = metadata.title || file.name.replace(/\.epub$/i, '')
    const author = metadata.creator?.[0]?.contributor || 'Unknown Author'
    const language = metadata.language || 'en'

    const id = crypto.randomUUID()
    const slug = generateSlug(title, author)

    const chapters: ImportedChapter[] = []

    if (spine.length === 0) {
      throw new Error('EPUB has no readable chapters')
    }

    for (let i = 0; i < spine.length; i++) {
      const spineItem = spine[i]
      try {
        const chapterData = await epub.loadChapter(spineItem.id)
        const rawText = htmlToPlainText(chapterData.html)
        const text = normalizeBookText(rawText)

        // Skip empty chapters
        if (text.trim().length === 0) continue

        chapters.push({
          bookId: id,
          index: chapters.length, // re-index after skipping empties
          title: `Chapter ${chapters.length + 1}`,
          text,
        })
      } catch {
        // Skip chapters that fail to load
        continue
      }
    }

    if (chapters.length === 0) {
      throw new Error('EPUB contains no extractable text content')
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
    epub.destroy()
  }
}
