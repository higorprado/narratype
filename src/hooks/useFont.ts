import { useEffect } from 'react'
import type { FontName } from '@/types'

const FONT_MAP: Record<FontName, string> = {
  literata: '"Literata", Georgia, serif',
  hyperlegible: '"Atkinson Hyperlegible", sans-serif',
  'open-dyslexic': '"OpenDyslexic", sans-serif',
  'fira-code': '"Fira Code", monospace',
  'courier-prime': '"Courier Prime", monospace',
  lora: '"Lora", Georgia, serif',
  bitter: '"Bitter", serif',
  'comic-sans': '"Comic Sans MS", cursive',
}

export function useFont(font: FontName) {
  useEffect(() => {
    document.documentElement.style.setProperty('--font-family', FONT_MAP[font])
  }, [font])
}
