import { useCallback, useEffect, useRef, useState } from 'react'
import { habitTargetAmount } from './useHabits.js'

const FIRED_KEY = 'habit-tracker:reminderFired:v1'
const TICK_MS = 30000

const todayKey = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const loadFired = () => {
  try {
    const raw = localStorage.getItem(FIRED_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    if (parsed.date !== todayKey()) return {}
    return parsed.fired || {}
  } catch {
    return {}
  }
}

const saveFired = (fired) => {
  try {
    localStorage.setItem(
      FIRED_KEY,
      JSON.stringify({ date: todayKey(), fired }),
    )
  } catch {
    /* ignore */
  }
}

const supportsNotifications = () =>
  typeof window !== 'undefined' && 'Notification' in window

export function useReminders({ habits, getValue, getHabitsForDay }) {
  const [permission, setPermission] = useState(() =>
    supportsNotifications() ? Notification.permission : 'unsupported',
  )
  const firedRef = useRef(loadFired())
  const swReadyRef = useRef(null)

  useEffect(() => {
    if (!supportsNotifications()) return
    if (!('serviceWorker' in navigator)) return
    // Service worker is registered globally by usePWA; just grab the ready
    // registration so we can call showNotification on it.
    navigator.serviceWorker.ready
      .then((reg) => {
        swReadyRef.current = reg
      })
      .catch(() => {
        /* fall back to the page-level Notification API */
      })
  }, [])

  const requestPermission = useCallback(async () => {
    if (!supportsNotifications()) return 'unsupported'
    if (Notification.permission === 'granted') {
      setPermission('granted')
      return 'granted'
    }
    if (Notification.permission === 'denied') {
      setPermission('denied')
      return 'denied'
    }
    const result = await Notification.requestPermission()
    setPermission(result)
    return result
  }, [])

  useEffect(() => {
    if (!supportsNotifications()) return
    if (permission !== 'granted') return

    const fire = (habit) => {
      const reg = swReadyRef.current
      const opts = {
        body: 'Time to check this off if you haven\u2019t already.',
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: `bloom:${habit.id}`,
        renotify: false,
      }
      try {
        if (reg && 'showNotification' in reg) {
          reg.showNotification(habit.label, opts)
        } else {
          new Notification(habit.label, opts)
        }
      } catch {
        /* swallow — some browsers throw if the page isn't visible */
      }
    }

    const checkOnce = () => {
      const now = new Date()
      // If a new day rolled over, clear fired map.
      const today = todayKey()
      if (firedRef.current.__date !== today) {
        firedRef.current = { __date: today }
      }
      const dayHabits = getHabitsForDay(now, today)
      for (const habit of dayHabits) {
        if (habit.isExtra) continue
        const r = habit.reminder
        if (!r || !r.enabled || typeof r.time !== 'string') continue
        const [hh, mm] = r.time.split(':').map(Number)
        if (!Number.isFinite(hh) || !Number.isFinite(mm)) continue
        const due = new Date(now)
        due.setHours(hh, mm, 0, 0)
        if (now < due) continue
        // Skip if already fired today
        if (firedRef.current[habit.id]) continue
        // Skip if already complete today
        const value = getValue(today, habit.id)
        if (value >= habitTargetAmount(habit)) continue
        fire(habit)
        firedRef.current[habit.id] = true
        saveFired(firedRef.current)
      }
    }

    checkOnce()
    const handle = window.setInterval(checkOnce, TICK_MS)
    return () => window.clearInterval(handle)
  }, [permission, habits, getHabitsForDay, getValue])

  const hasAnyReminders = habits.habits.some((h) => h.reminder?.enabled)

  return {
    permission,
    requestPermission,
    hasAnyReminders,
    notificationsSupported: supportsNotifications(),
  }
}
