import { Routes, Route } from 'react-router-dom'
import HomePage from '@/pages/HomePage'
import AboutPage from '@/pages/AboutPage'
import { ChaptersPage } from '@/pages/ChaptersPage'
import TypingConsolePage from '@/pages/TypingConsolePage'
import { Header } from '@/components/Header'
import { useAdSense } from '@/hooks/useAdSense'
import CookieConsentBanner from '@/components/CookieConsentBanner'

function App() {
  useAdSense()
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/chapters/:bookSlug" element={<ChaptersPage />} />
        <Route
          path="/typing-console/:bookSlug/:chapterIndex/:pageIndex"
          element={<TypingConsolePage />}
        />
      </Routes>
      <CookieConsentBanner />
    </>
  )
}

export default App
