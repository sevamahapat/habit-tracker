import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'habit-tracker:theme:v1'

export const THEMES = [
  { id: 'bloom', label: 'Bloom', swatch: ['#e87aab', '#a97de6'] },
  { id: 'sage', label: 'Sage', swatch: ['#7cb87a', '#c7a85f'] },
  { id: 'sunset', label: 'Sunset', swatch: ['#f08659', '#e5a13b'] },
  { id: 'ocean', label: 'Ocean', swatch: ['#3fa0d3', '#3fa187'] },
  { id: 'midnight', label: 'Midnight', swatch: ['#c794d9', '#9a8ce4'] },
  { id: 'mono', label: 'Mono', swatch: ['#52525b', '#a1a1aa'] },
]

const DEFAULT = 'bloom'

const load = () => {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v && THEMES.some((t) => t.id === v)) return v
  } catch {
    /* ignore */
  }
  return DEFAULT
}

export function useTheme() {
  const [theme, setTheme] = useState(load)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  const pick = useCallback((id) => {
    if (THEMES.some((t) => t.id === id)) setTheme(id)
  }, [])

  return { theme, setTheme: pick }
}
