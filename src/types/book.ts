export type BookSlug = string

export interface Book {
  slug: BookSlug
  title: string
  author: string
  language: string
  coverUrl: string
  chapters: Chapter[]
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
