import { Routes, Route } from 'react-router-dom'
import HomePage from '@/pages/HomePage'
import { useParams } from 'react-router-dom'
import { getBookBySlug } from '@/data'

function ChaptersPage() {
  const { bookSlug } = useParams()
  const book = getBookBySlug(bookSlug!)
  if (!book) return <div>Book not found</div>
  return <div>{book.title}</div>
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/chapters/:bookSlug" element={<ChaptersPage />} />
      <Route
        path="/typing-console/:bookSlug/:chapterIndex/:pageIndex"
        element={<div>Typing Console - Coming Soon</div>}
      />
    </Routes>
  )
}

export default App
