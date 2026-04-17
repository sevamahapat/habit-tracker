import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'habit-tracker:habits:v4'
const LEGACY_V3 = 'habit-tracker:habits:v3'
const LEGACY_V2 = 'habit-tracker:habits:v2'
const LEGACY_V1 = 'habit-tracker:habits:v1'

const WEEKDAY_DAYS = [1, 2, 3, 4, 5]
const WEEKEND_DAYS = [0, 6]

export const TAG_COLORS = [
  '#e87aab', // pink
  '#a97de6', // lavender
  '#7cb87a', // sage
  '#f08659', // sunset
  '#3fa0d3', // ocean
  '#e5a13b', // honey
]

const DEFAULT_HABITS = [
  { label: 'Drink water', schedule: { type: 'daily' }, target: { kind: 'count', amount: 8, unit: 'cups' } },
  { label: 'Move for 30 min', schedule: { type: 'daily' }, target: { kind: 'count', amount: 30, unit: 'min' } },
  { label: 'Read', schedule: { type: 'daily' } },
  { label: 'Meditate', schedule: { type: 'daily' } },
  { label: 'Get outside', schedule: { type: 'daily' } },
  { label: 'Stretch', schedule: { type: 'daily' } },
  { label: 'Workout', schedule: { type: 'weekly', n: 3 } },
  { label: 'Tidy up', schedule: { type: 'days', days: [0] } },
]

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

const makeHabit = (label, schedule = { type: 'daily' }, id, extra = {}) => ({
  id: id || newId(),
  label,
  schedule,
  ...extra,
})

const emptyState = () => ({ habits: [], tags: [], dayExtras: {}, dayRemoved: {} })

const seedDefaults = () => ({
  habits: DEFAULT_HABITS.map((h) => makeHabit(h.label, h.schedule, undefined, h.target ? { target: h.target } : {})),
  tags: [],
  dayExtras: {},
  dayRemoved: {},
})

const isValidSchedule = (s) => {
  if (!s || typeof s !== 'object') return false
  if (s.type === 'daily') return true
  if (s.type === 'days') {
    return Array.isArray(s.days) && s.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)
  }
  if (s.type === 'interval') {
    return Number.isInteger(s.n) && s.n >= 1 && typeof s.anchor === 'string'
  }
  if (s.type === 'weekly') {
    return Number.isInteger(s.n) && s.n >= 1 && s.n <= 7
  }
  return false
}

const normalizeSchedule = (s) => (isValidSchedule(s) ? s : { type: 'daily' })

const isValidTarget = (t) => {
  if (!t || typeof t !== 'object') return false
  if (!['check', 'count'].includes(t.kind)) return false
  if (t.kind === 'check') return true
  return Number.isFinite(t.amount) && t.amount > 0 && typeof t.unit === 'string'
}

const normalizeTarget = (t) => (isValidTarget(t) ? t : undefined)

const isValidReminder = (r) => {
  if (!r || typeof r !== 'object') return false
  if (typeof r.time !== 'string') return false
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(r.time)) return false
  return true
}

const normalizeReminder = (r) => {
  if (!isValidReminder(r)) return undefined
  return { time: r.time, enabled: r.enabled !== false }
}

const normalizeTagIds = (ids, validIds) => {
  if (!Array.isArray(ids)) return undefined
  const set = new Set(ids.filter((x) => typeof x === 'string' && validIds.has(x)))
  return set.size > 0 ? [...set] : undefined
}

const normalizeTag = (t) => {
  if (!t || typeof t !== 'object' || typeof t.id !== 'string' || typeof t.name !== 'string') {
    return null
  }
  const color =
    typeof t.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(t.color) ? t.color : TAG_COLORS[0]
  return { id: t.id, name: t.name, color }
}

const normalizeHabit = (h, validTagIds) => {
  if (!h || typeof h !== 'object' || typeof h.label !== 'string' || typeof h.id !== 'string') {
    return null
  }
  const out = { id: h.id, label: h.label, schedule: normalizeSchedule(h.schedule) }
  const target = normalizeTarget(h.target)
  if (target) out.target = target
  const reminder = normalizeReminder(h.reminder)
  if (reminder) out.reminder = reminder
  const tagIds = normalizeTagIds(h.tagIds, validTagIds)
  if (tagIds) out.tagIds = tagIds
  return out
}

const normalizeV4 = (value) => {
  if (!value || typeof value !== 'object') return null
  if (!Array.isArray(value.habits)) return null
  const tags = Array.isArray(value.tags) ? value.tags.map(normalizeTag).filter(Boolean) : []
  const validTagIds = new Set(tags.map((t) => t.id))
  const habits = value.habits.map((h) => normalizeHabit(h, validTagIds)).filter(Boolean)
  return {
    habits,
    tags,
    dayExtras:
      value.dayExtras && typeof value.dayExtras === 'object' ? value.dayExtras : {},
    dayRemoved:
      value.dayRemoved && typeof value.dayRemoved === 'object' ? value.dayRemoved : {},
  }
}

const migrateFromV3 = (raw) => {
  const v4ish = normalizeV4({ ...raw, tags: [] })
  return v4ish
}

const migrateFromV2 = (raw) => {
  if (!raw || typeof raw !== 'object') return null
  if (!Array.isArray(raw.weekday) || !Array.isArray(raw.weekend)) return null
  const weekday = raw.weekday
    .filter((h) => h && typeof h.id === 'string' && typeof h.label === 'string')
    .map((h) => makeHabit(h.label, { type: 'days', days: WEEKDAY_DAYS }, h.id))
  const weekend = raw.weekend
    .filter((h) => h && typeof h.id === 'string' && typeof h.label === 'string')
    .map((h) => makeHabit(h.label, { type: 'days', days: WEEKEND_DAYS }, h.id))
  return {
    habits: [...weekday, ...weekend],
    tags: [],
    dayExtras: raw.dayExtras && typeof raw.dayExtras === 'object' ? raw.dayExtras : {},
    dayRemoved: raw.dayRemoved && typeof raw.dayRemoved === 'object' ? raw.dayRemoved : {},
  }
}

const tryLoad = () => {
  try {
    const v4 = localStorage.getItem(STORAGE_KEY)
    if (v4) {
      const parsed = normalizeV4(JSON.parse(v4))
      if (parsed) return { state: parsed, firstRun: false }
    }
    const v3 = localStorage.getItem(LEGACY_V3)
    if (v3) {
      const parsed = migrateFromV3(JSON.parse(v3))
      if (parsed) return { state: parsed, firstRun: false }
    }
    const v2 = localStorage.getItem(LEGACY_V2)
    if (v2) {
      const parsed = migrateFromV2(JSON.parse(v2))
      if (parsed) return { state: parsed, firstRun: false }
    }
    const v1 = localStorage.getItem(LEGACY_V1)
    if (v1) {
      const parsed = migrateFromV2(JSON.parse(v1))
      if (parsed) return { state: parsed, firstRun: false }
    }
  } catch {
    /* ignore */
  }
  return { state: emptyState(), firstRun: true }
}

const stripTime = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()

const parseDateKey = (key) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const matchesSchedule = (habit, date) => {
  const s = habit.schedule || { type: 'daily' }
  if (s.type === 'daily') return true
  if (s.type === 'days') return Array.isArray(s.days) && s.days.includes(date.getDay())
  if (s.type === 'weekly') return true
  if (s.type === 'interval') {
    if (!s.anchor || !s.n || s.n < 1) return true
    const dayMs = 86400000
    const diff = Math.round((stripTime(date) - stripTime(parseDateKey(s.anchor))) / dayMs)
    return (((diff % s.n) + s.n) % s.n) === 0
  }
  return true
}

export const habitTargetAmount = (habit) => {
  if (!habit?.target || habit.target.kind === 'check') return 1
  return habit.target.amount || 1
}

export function useHabits() {
  const [initial] = useState(tryLoad)
  const [habits, setHabits] = useState(initial.state)
  const [firstRun, setFirstRun] = useState(initial.firstRun)

  useEffect(() => {
    if (firstRun) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(habits))
    } catch {
      /* ignore */
    }
  }, [habits, firstRun])

  const addHabit = useCallback((label, schedule) => {
    const trimmed = label.trim()
    if (!trimmed) return
    setHabits((prev) => ({
      ...prev,
      habits: [...prev.habits, makeHabit(trimmed, schedule)],
    }))
  }, [])

  const removeHabit = useCallback((id) => {
    setHabits((prev) => ({
      ...prev,
      habits: prev.habits.filter((h) => h.id !== id),
    }))
  }, [])

  const renameHabit = useCallback((id, label) => {
    const trimmed = label.trim()
    if (!trimmed) return
    setHabits((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => (h.id === id ? { ...h, label: trimmed } : h)),
      dayExtras: Object.fromEntries(
        Object.entries(prev.dayExtras).map(([k, list]) => [
          k,
          list.map((h) => (h.id === id ? { ...h, label: trimmed } : h)),
        ]),
      ),
    }))
  }, [])

  const updateHabitSchedule = useCallback((id, schedule) => {
    const safe = normalizeSchedule(schedule)
    setHabits((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => (h.id === id ? { ...h, schedule: safe } : h)),
    }))
  }, [])

  const updateHabitTarget = useCallback((id, target) => {
    const safe = target === null ? null : normalizeTarget(target)
    setHabits((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => {
        if (h.id !== id) return h
        const next = { ...h }
        if (!safe) delete next.target
        else next.target = safe
        return next
      }),
    }))
  }, [])

  const updateHabitReminder = useCallback((id, reminder) => {
    const safe = reminder === null ? null : normalizeReminder(reminder)
    setHabits((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => {
        if (h.id !== id) return h
        const next = { ...h }
        if (!safe) delete next.reminder
        else next.reminder = safe
        return next
      }),
    }))
  }, [])

  const setHabitTags = useCallback((id, tagIds) => {
    setHabits((prev) => {
      const valid = new Set(prev.tags.map((t) => t.id))
      const filtered = (tagIds || []).filter((t) => valid.has(t))
      return {
        ...prev,
        habits: prev.habits.map((h) => {
          if (h.id !== id) return h
          const next = { ...h }
          if (filtered.length === 0) delete next.tagIds
          else next.tagIds = filtered
          return next
        }),
      }
    })
  }, [])

  const reorderHabits = useCallback((fromIndex, toIndex) => {
    setHabits((prev) => {
      const list = [...prev.habits]
      const [moved] = list.splice(fromIndex, 1)
      list.splice(toIndex, 0, moved)
      return { ...prev, habits: list }
    })
  }, [])

  const addDayHabit = useCallback((dateKey, label) => {
    const trimmed = label.trim()
    if (!trimmed) return
    setHabits((prev) => {
      const existing = prev.dayExtras[dateKey] || []
      return {
        ...prev,
        dayExtras: {
          ...prev.dayExtras,
          [dateKey]: [...existing, makeHabit(trimmed)],
        },
      }
    })
  }, [])

  const removeDayHabit = useCallback((dateKey, habitId, isExtra) => {
    setHabits((prev) => {
      if (isExtra) {
        const list = (prev.dayExtras[dateKey] || []).filter((h) => h.id !== habitId)
        const nextExtras = { ...prev.dayExtras }
        if (list.length === 0) delete nextExtras[dateKey]
        else nextExtras[dateKey] = list
        return { ...prev, dayExtras: nextExtras }
      }
      const removed = new Set(prev.dayRemoved[dateKey] || [])
      removed.add(habitId)
      return {
        ...prev,
        dayRemoved: { ...prev.dayRemoved, [dateKey]: [...removed] },
      }
    })
  }, [])

  const renameDayHabit = useCallback((dateKey, habitId, label) => {
    const trimmed = label.trim()
    if (!trimmed) return
    setHabits((prev) => {
      const list = prev.dayExtras[dateKey] || []
      if (!list.some((h) => h.id === habitId)) return prev
      return {
        ...prev,
        dayExtras: {
          ...prev.dayExtras,
          [dateKey]: list.map((h) => (h.id === habitId ? { ...h, label: trimmed } : h)),
        },
      }
    })
  }, [])

  const getHabitsForDay = useCallback(
    (date, dateKey) => {
      const removed = new Set(habits.dayRemoved[dateKey] || [])
      const extras = habits.dayExtras[dateKey] || []
      const base = habits.habits
        .filter((h) => matchesSchedule(h, date))
        .filter((h) => !removed.has(h.id))
        .map((h) => ({ ...h, isExtra: false }))
      return [...base, ...extras.map((h) => ({ ...h, isExtra: true }))]
    },
    [habits],
  )

  const replaceAll = useCallback((incoming) => {
    const v4 = normalizeV4(incoming)
    if (v4) {
      setHabits(v4)
      setFirstRun(false)
      return true
    }
    const v3 = migrateFromV3(incoming)
    if (v3) {
      setHabits(v3)
      setFirstRun(false)
      return true
    }
    const v2 = migrateFromV2(incoming)
    if (v2) {
      setHabits(v2)
      setFirstRun(false)
      return true
    }
    return false
  }, [])

  const finishOnboarding = useCallback((variant) => {
    setHabits(variant === 'starter' ? seedDefaults() : emptyState())
    setFirstRun(false)
  }, [])

  const addTag = useCallback((name, color) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const safeColor =
      typeof color === 'string' && /^#[0-9a-fA-F]{6}$/.test(color) ? color : TAG_COLORS[0]
    setHabits((prev) => ({
      ...prev,
      tags: [...prev.tags, { id: newId(), name: trimmed, color: safeColor }],
    }))
  }, [])

  const removeTag = useCallback((id) => {
    setHabits((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t.id !== id),
      habits: prev.habits.map((h) => {
        if (!h.tagIds?.includes(id)) return h
        const next = { ...h, tagIds: h.tagIds.filter((t) => t !== id) }
        if (next.tagIds.length === 0) delete next.tagIds
        return next
      }),
    }))
  }, [])

  const renameTag = useCallback((id, name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setHabits((prev) => ({
      ...prev,
      tags: prev.tags.map((t) => (t.id === id ? { ...t, name: trimmed } : t)),
    }))
  }, [])

  const recolorTag = useCallback((id, color) => {
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) return
    setHabits((prev) => ({
      ...prev,
      tags: prev.tags.map((t) => (t.id === id ? { ...t, color } : t)),
    }))
  }, [])

  return {
    habits,
    firstRun,
    addHabit,
    removeHabit,
    renameHabit,
    updateHabitSchedule,
    updateHabitTarget,
    updateHabitReminder,
    setHabitTags,
    reorderHabits,
    addDayHabit,
    removeDayHabit,
    renameDayHabit,
    getHabitsForDay,
    replaceAll,
    finishOnboarding,
    addTag,
    removeTag,
    renameTag,
    recolorTag,
  }
}

export { matchesSchedule, WEEKDAY_DAYS, WEEKEND_DAYS }
