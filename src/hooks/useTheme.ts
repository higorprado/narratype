import { useEffect } from 'react'
import type { ThemeName } from '@/types'

import '../styles/themes/classic-dark.css'
import '../styles/themes/classic-light.css'
import '../styles/themes/timber.css'
import '../styles/themes/ocean.css'
import '../styles/themes/bubblegum.css'
import '../styles/themes/newsprint.css'
import '../styles/themes/cinder.css'
import '../styles/themes/bumblebee.css'
import '../styles/themes/terracotta.css'
import '../styles/themes/canopy.css'
import '../styles/themes/lagoon.css'
import '../styles/themes/mellow.css'
import '../styles/themes/surf.css'
import '../styles/themes/platoon.css'
import '../styles/themes/beachside.css'
import '../styles/themes/pulse.css'
import '../styles/themes/catppuccin-latte.css'
import '../styles/themes/catppuccin-frappe.css'
import '../styles/themes/catppuccin-macchiato.css'
import '../styles/themes/catppuccin-mocha.css'

export function useTheme(theme: ThemeName) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])
}
