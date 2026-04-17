import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'habit-tracker:checks:v1'

const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const readValue = (entry) => {
  if (entry === true) return 1
  if (typeof entry === 'number' && Number.isFinite(entry)) return entry
  return 0
}

export function useChecks() {
  const [checks, setChecks] = useState(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checks))
    } catch {
      /* ignore quota errors */
    }
  }, [checks])

  const getValue = useCallback(
    (dateKey, habitId) => readValue(checks[dateKey]?.[habitId]),
    [checks],
  )

  const isChecked = useCallback(
    (dateKey, habitId, threshold = 1) =>
      readValue(checks[dateKey]?.[habitId]) >= threshold,
    [checks],
  )

  const setValue = useCallback((dateKey, habitId, value) => {
    setChecks((prev) => {
      const day = { ...(prev[dateKey] || {}) }
      const v = Math.max(0, Number(value) || 0)
      if (v <= 0) {
        delete day[habitId]
      } else if (v === 1) {
        // Store as `true` for legacy interop / smaller payload
        day[habitId] = true
      } else {
        day[habitId] = v
      }
      const next = { ...prev }
      if (Object.keys(day).length === 0) delete next[dateKey]
      else next[dateKey] = day
      return next
    })
  }, [])

  const toggleCheck = useCallback((dateKey, habitId, target = 1) => {
    setChecks((prev) => {
      const day = { ...(prev[dateKey] || {}) }
      const current = readValue(day[habitId])
      if (current >= target) {
        delete day[habitId]
      } else if (target === 1) {
        day[habitId] = true
      } else {
        day[habitId] = target
      }
      const next = { ...prev }
      if (Object.keys(day).length === 0) delete next[dateKey]
      else next[dateKey] = day
      return next
    })
  }, [])

  const incrementValue = useCallback((dateKey, habitId, delta) => {
    setChecks((prev) => {
      const day = { ...(prev[dateKey] || {}) }
      const current = readValue(day[habitId])
      const v = Math.max(0, current + (Number(delta) || 0))
      if (v <= 0) {
        delete day[habitId]
      } else if (v === 1) {
        day[habitId] = true
      } else {
        day[habitId] = v
      }
      const next = { ...prev }
      if (Object.keys(day).length === 0) delete next[dateKey]
      else next[dateKey] = day
      return next
    })
  }, [])

  const countChecked = useCallback(
    (dateKey, habitIds) => {
      const day = checks[dateKey]
      if (!day) return 0
      let n = 0
      for (const id of habitIds) if (readValue(day[id]) >= 1) n++
      return n
    },
    [checks],
  )

  const replaceAll = useCallback((incoming) => {
    if (!incoming || typeof incoming !== 'object') return false
    const cleaned = {}
    for (const [dateKey, day] of Object.entries(incoming)) {
      if (day && typeof day === 'object') {
        const flags = {}
        for (const [habitId, v] of Object.entries(day)) {
          const value = readValue(v)
          if (value > 0) {
            flags[habitId] = value === 1 ? true : value
          }
        }
        if (Object.keys(flags).length > 0) cleaned[dateKey] = flags
      }
    }
    setChecks(cleaned)
    return true
  }, [])

  return {
    isChecked,
    toggleCheck,
    countChecked,
    getValue,
    setValue,
    incrementValue,
    replaceAll,
    checks,
  }
}
