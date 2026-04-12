import { Link } from 'react-router-dom'
import type { Chapter } from '@/types'
import { getPageCount } from '@/data'
import styles from './ChapterList.module.css'

interface ChapterListProps {
  chapters: Chapter[]
  bookSlug: string
}

export function ChapterList({ chapters, bookSlug }: ChapterListProps) {
  return (
    <ul className={styles.list}>
      {chapters.map((chapter, index) => (
        <li key={index}>
          <Link
            to={`/typing-console/${bookSlug}/${index}/0`}
            className={styles.item}
          >
            <span className={styles.number}>{index + 1}.</span>
            <span className={styles.title}>{chapter.title}</span>
            <span className={styles.pageCount}>
              {getPageCount(bookSlug, index)} page{getPageCount(bookSlug, index) !== 1 ? 's' : ''}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
