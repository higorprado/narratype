import { initEpubFile } from '@lingo-reader/epub-parser'
import type { ImportedBookMeta, ImportedChapter } from '@/types/book'
import { normalizeBookText } from '@/utils/textNormalizer'

export interface EpubImportResult {
  meta: ImportedBookMeta
  chapters: ImportedChapter[]
}

/** Strip HTML to plain text using the browser's DOMParser. */
function htmlToPlainText(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent ?? ''
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
