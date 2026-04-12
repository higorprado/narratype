import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ProgressProvider } from '@/context/ProgressContext'
import { SettingsProvider } from '@/context/SettingsContext'
import './styles/reset.css'
import './styles/global.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SettingsProvider>
        <ProgressProvider>
          <App />
        </ProgressProvider>
      </SettingsProvider>
    </BrowserRouter>
  </StrictMode>,
)
