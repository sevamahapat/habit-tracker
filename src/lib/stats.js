import { matchesSchedule, habitTargetAmount } from '../hooks/useHabits.js'

const DAY_MS = 86400000

export const fmtKey = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const parseKey = (key) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const addDays = (date, n) => {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export const stripTime = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate())

export const isoWeek = (date) => {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = tmp.getUTCDay() || 7
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
  const weekNum = Math.ceil(((tmp - yearStart) / DAY_MS + 1) / 7)
  return [tmp.getUTCFullYear(), weekNum]
}

export const isoWeekKey = (date) => {
  const [y, w] = isoWeek(date)
  return `${y}-W${String(w).padStart(2, '0')}`
}

export const isScheduled = (habit, date, dayRemoved) => {
  if (!matchesSchedule(habit, date)) return false
  const key = fmtKey(date)
  const removed = dayRemoved?.[key]
  if (removed && removed.includes(habit.id)) return false
  return true
}

const readValue = (v) => {
  if (v === true) return 1
  if (typeof v === 'number' && Number.isFinite(v)) return v
  return 0
}

const isCheckedOn = (checks, dateKey, habit) => {
  const v = readValue(checks?.[dateKey]?.[habit.id])
  return v >= habitTargetAmount(habit)
}

const findEarliestCheck = (checks) => {
  let earliest = null
  for (const key of Object.keys(checks || {})) {
    if (!earliest || key < earliest) earliest = key
  }
  return earliest
}

const findEarliestCheckForHabit = (checks, habitId) => {
  let earliest = null
  for (const [key, day] of Object.entries(checks || {})) {
    if (day?.[habitId]) {
      if (!earliest || key < earliest) earliest = key
    }
  }
  return earliest
}

export const currentStreak = ({
  habit,
  checks,
  dayRemoved,
  graceDaysPerWeek = 1,
  today = new Date(),
}) => {
  if (habit.schedule?.type === 'weekly') {
    return currentWeeklyStreak({ habit, checks, today })
  }

  let cursor = stripTime(today)
  let streak = 0
  let graceUsedThisWeek = 0
  let currentWeek = isoWeekKey(cursor)
  const earliest = findEarliestCheckForHabit(checks, habit.id)
  if (!earliest) return 0
  const earliestDate = parseKey(earliest)

  // If today is scheduled and unchecked, give grace and start from yesterday
  if (isScheduled(habit, cursor, dayRemoved)) {
    const checkedToday = isCheckedOn(checks, fmtKey(cursor), habit)
    if (!checkedToday) {
      cursor = addDays(cursor, -1)
      currentWeek = isoWeekKey(cursor)
    }
  } else {
    cursor = addDays(cursor, -1)
    currentWeek = isoWeekKey(cursor)
  }

  while (cursor >= earliestDate) {
    const week = isoWeekKey(cursor)
    if (week !== currentWeek) {
      currentWeek = week
      graceUsedThisWeek = 0
    }
    if (!isScheduled(habit, cursor, dayRemoved)) {
      cursor = addDays(cursor, -1)
      continue
    }
    const checked = isCheckedOn(checks, fmtKey(cursor), habit)
    if (checked) {
      streak += 1
      cursor = addDays(cursor, -1)
      continue
    }
    if (graceUsedThisWeek < graceDaysPerWeek) {
      graceUsedThisWeek += 1
      cursor = addDays(cursor, -1)
      continue
    }
    break
  }
  return streak
}

export const longestStreak = ({
  habit,
  checks,
  dayRemoved,
  graceDaysPerWeek = 1,
  today = new Date(),
}) => {
  if (habit.schedule?.type === 'weekly') {
    return longestWeeklyStreak({ habit, checks, today })
  }
  const earliest = findEarliestCheckForHabit(checks, habit.id)
  if (!earliest) return 0
  let cursor = parseKey(earliest)
  const end = stripTime(today)
  let best = 0
  let run = 0
  let currentWeek = isoWeekKey(cursor)
  let graceUsed = 0
  while (cursor <= end) {
    const week = isoWeekKey(cursor)
    if (week !== currentWeek) {
      currentWeek = week
      graceUsed = 0
    }
    if (!isScheduled(habit, cursor, dayRemoved)) {
      cursor = addDays(cursor, 1)
      continue
    }
    const checked = isCheckedOn(checks, fmtKey(cursor), habit)
    if (checked) {
      run += 1
      best = Math.max(best, run)
    } else if (graceUsed < graceDaysPerWeek) {
      graceUsed += 1
    } else {
      run = 0
    }
    cursor = addDays(cursor, 1)
  }
  return best
}

const weeksOfHabit = (habit, checks, today) => {
  const earliest = findEarliestCheckForHabit(checks, habit.id)
  if (!earliest) return []
  const start = parseKey(earliest)
  const end = stripTime(today)
  const buckets = new Map()
  let cursor = stripTime(start)
  while (cursor <= end) {
    const wk = isoWeekKey(cursor)
    if (!buckets.has(wk)) buckets.set(wk, { week: wk, checked: 0 })
    if (isCheckedOn(checks, fmtKey(cursor), habit)) {
      buckets.get(wk).checked += 1
    }
    cursor = addDays(cursor, 1)
  }
  return [...buckets.values()]
}

export const currentWeeklyStreak = ({ habit, checks, today = new Date() }) => {
  const target = habit.schedule?.n ?? 1
  const buckets = weeksOfHabit(habit, checks, today)
  if (buckets.length === 0) return 0
  let streak = 0
  for (let i = buckets.length - 1; i >= 0; i--) {
    const isCurrentWeek = i === buckets.length - 1
    if (buckets[i].checked >= target) {
      streak += 1
    } else if (isCurrentWeek) {
      // current week not done yet — don't break the run
      continue
    } else {
      break
    }
  }
  return streak
}

export const longestWeeklyStreak = ({ habit, checks, today = new Date() }) => {
  const target = habit.schedule?.n ?? 1
  const buckets = weeksOfHabit(habit, checks, today)
  let best = 0
  let run = 0
  for (let i = 0; i < buckets.length; i++) {
    if (buckets[i].checked >= target) {
      run += 1
      best = Math.max(best, run)
    } else {
      run = 0
    }
  }
  return best
}

export const completionRate = ({
  habit,
  checks,
  dayRemoved,
  periodDays = 30,
  today = new Date(),
}) => {
  const end = stripTime(today)
  let scheduled = 0
  let checked = 0
  if (habit.schedule?.type === 'weekly') {
    // weekly: count weeks in window where target met
    const weeks = Math.max(1, Math.ceil(periodDays / 7))
    const start = addDays(end, -periodDays + 1)
    const buckets = new Map()
    let cursor = stripTime(start)
    while (cursor <= end) {
      const wk = isoWeekKey(cursor)
      if (!buckets.has(wk)) buckets.set(wk, 0)
      if (isCheckedOn(checks, fmtKey(cursor), habit)) {
        buckets.set(wk, buckets.get(wk) + 1)
      }
      cursor = addDays(cursor, 1)
    }
    const target = habit.schedule.n ?? 1
    let weeksMet = 0
    for (const c of buckets.values()) {
      if (c >= target) weeksMet += 1
    }
    return {
      checked: weeksMet,
      scheduled: weeks,
      percent: Math.round((weeksMet / weeks) * 100),
    }
  }
  let cursor = addDays(end, -periodDays + 1)
  while (cursor <= end) {
    if (isScheduled(habit, cursor, dayRemoved)) {
      scheduled += 1
      if (isCheckedOn(checks, fmtKey(cursor), habit)) checked += 1
    }
    cursor = addDays(cursor, 1)
  }
  return {
    checked,
    scheduled,
    percent: scheduled === 0 ? 0 : Math.round((checked / scheduled) * 100),
  }
}

export const last7Days = ({ habit, checks, dayRemoved, today = new Date() }) => {
  const end = stripTime(today)
  const out = []
  for (let i = 6; i >= 0; i--) {
    const d = addDays(end, -i)
    const key = fmtKey(d)
    out.push({
      date: d,
      key,
      scheduled: isScheduled(habit, d, dayRemoved),
      checked: isCheckedOn(checks, key, habit),
    })
  }
  return out
}

export const dayCompletionRatio = ({
  date,
  habits,
  checks,
  dayExtras,
  dayRemoved,
}) => {
  const dateKey = fmtKey(date)
  const removed = new Set(dayRemoved?.[dateKey] || [])
  const extras = dayExtras?.[dateKey] || []
  const base = habits.filter((h) => matchesSchedule(h, date) && !removed.has(h.id))
  const all = [...base, ...extras]
  if (all.length === 0) return { ratio: 0, checked: 0, total: 0 }
  let checked = 0
  for (const h of all) {
    if (isCheckedOn(checks, dateKey, h)) checked += 1
  }
  return { ratio: checked / all.length, checked, total: all.length }
}

export const monthSummary = ({
  year,
  month,
  habits,
  checks,
  dayExtras,
  dayRemoved,
  graceDaysPerWeek = 1,
}) => {
  const lastDay = new Date(year, month + 1, 0).getDate()
  const today = stripTime(new Date())
  const monthStart = stripTime(new Date(year, month, 1))
  const monthEnd = stripTime(new Date(year, month, lastDay))
  const isFuture = monthStart > today
  const effectiveEnd = isFuture
    ? monthStart
    : monthEnd <= today
      ? monthEnd
      : today
  const daysCounted = isFuture ? 0 : effectiveEnd.getDate()

  const days = []
  let totalChecks = 0
  let perfectDays = 0
  let zeroDays = 0
  for (let i = 1; i <= daysCounted; i++) {
    const d = new Date(year, month, i)
    const r = dayCompletionRatio({ date: d, habits, checks, dayExtras, dayRemoved })
    days.push({ date: d, ...r })
    totalChecks += r.checked
    if (r.total > 0 && r.checked === r.total) perfectDays += 1
    if (r.total > 0 && r.checked === 0) zeroDays += 1
  }

  const habitStats = isFuture
    ? []
    : habits.map((h) => {
        const cr = completionRate({
          habit: h,
          checks,
          dayRemoved,
          periodDays: daysCounted,
          today: effectiveEnd,
        })
        return { habit: h, ...cr }
      })

  const ranked = [...habitStats]
    .filter((s) => s.scheduled > 0)
    .sort((a, b) => b.percent - a.percent || b.checked - a.checked)

  const topHabits = ranked.slice(0, 3)

  let headline = null
  if (isFuture) {
    headline = 'Yet to come'
  } else if (ranked.length > 0) {
    const top = ranked[0]
    if (top.percent >= 80) {
      headline = `${top.percent}% on ${top.habit.label}`
    } else if (perfectDays > 0) {
      headline = `${perfectDays} perfect day${perfectDays === 1 ? '' : 's'}`
    } else if (totalChecks > 0) {
      headline = `${totalChecks} habit${totalChecks === 1 ? '' : 's'} checked`
    } else {
      headline = 'A fresh start'
    }
  } else {
    headline = 'A fresh start'
  }

  return {
    year,
    month,
    daysCounted,
    monthDays: lastDay,
    totalChecks,
    perfectDays,
    zeroDays,
    topHabits,
    headline,
  }
}

export const yearGrid = ({ year, habits, checks, dayExtras, dayRemoved, habitId }) => {
  // Returns 7×N grid (rows = weekday Sun→Sat in display order, columns = weeks)
  // Each cell = { date, key, ratio (or null if before first day of year / future) }
  const start = new Date(year, 0, 1)
  const end = new Date(year, 11, 31)
  const today = stripTime(new Date())
  const totalDays = Math.round((stripTime(end) - stripTime(start)) / DAY_MS) + 1

  const cells = []
  // Pad before with nulls so the grid starts on Sunday
  const lead = start.getDay()
  for (let i = 0; i < lead; i++) cells.push(null)
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(year, 0, 1 + i)
    if (d > today) {
      cells.push({ date: d, key: fmtKey(d), ratio: null, future: true })
      continue
    }
    if (habitId) {
      const habit = habits.find((h) => h.id === habitId)
      if (!habit) {
        cells.push({ date: d, key: fmtKey(d), ratio: 0, scheduled: false })
        continue
      }
      const scheduled = isScheduled(habit, d, dayRemoved)
      const checked = isCheckedOn(checks, fmtKey(d), habit)
      cells.push({
        date: d,
        key: fmtKey(d),
        ratio: checked ? 1 : 0,
        scheduled,
      })
    } else {
      const r = dayCompletionRatio({ date: d, habits, checks, dayExtras, dayRemoved })
      cells.push({ date: d, key: fmtKey(d), ratio: r.ratio, ...r })
    }
  }
  // Pad end so length is multiple of 7
  while (cells.length % 7 !== 0) cells.push(null)
  // Build rows: 7 rows × (cells/7) columns
  const cols = cells.length / 7
  const rows = Array.from({ length: 7 }, (_, r) =>
    Array.from({ length: cols }, (_, c) => cells[c * 7 + r]),
  )
  return { rows, weeks: cols }
}
