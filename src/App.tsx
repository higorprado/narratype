import { Routes, Route } from 'react-router-dom'
import HomePage from '@/pages/HomePage'
import { ChaptersPage } from '@/pages/ChaptersPage'
import TypingConsolePage from '@/pages/TypingConsolePage'
import { Header } from '@/components/Header'

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chapters/:bookSlug" element={<ChaptersPage />} />
        <Route
          path="/typing-console/:bookSlug/:chapterIndex/:pageIndex"
          element={<TypingConsolePage />}
        />
      </Routes>
    </>
  )
}

export default App
