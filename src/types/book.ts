export type BookSlug = string

export interface Book {
  slug: BookSlug
  title: string
  author: string
  language: string
  coverUrl: string
  chapters: Chapter[]
  isImported?: boolean
}

export interface Chapter {
  title: string
  text: string
}

export interface Page {
  text: string
  chapterIndex: number
  pageIndex: number
}

/** Metadata stored in IndexedDB for imported EPUB books. */
export interface ImportedBookMeta {
  id: string
  slug: string
  title: string
  author: string
  language: string
  coverUrl: string
  importDate: number
  chapterCount: number
}

/** A single chapter stored in IndexedDB for imported EPUB books. */
export interface ImportedChapter {
  bookId: string
  index: number
  title: string
  text: string
}