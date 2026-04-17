import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'habit-tracker:settings:v1'

const DEFAULTS = { graceDaysPerWeek: 1 }

const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return DEFAULTS
    const grace = Number(parsed.graceDaysPerWeek)
    return {
      graceDaysPerWeek:
        Number.isFinite(grace) && grace >= 0 && grace <= 7 ? grace : DEFAULTS.graceDaysPerWeek,
    }
  } catch {
    return DEFAULTS
  }
}

export function useSettings() {
  const [settings, setSettings] = useState(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      /* ignore */
    }
  }, [settings])

  const updateSettings = useCallback((patch) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }, [])

  return { settings, updateSettings }
}
