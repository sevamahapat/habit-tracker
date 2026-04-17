import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { yearGrid } from '../lib/stats.js'

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const intensityClass = (cell, isPerHabit) => {
  if (!cell) return 'heatmap__cell heatmap__cell--blank'
  if (cell.future) return 'heatmap__cell heatmap__cell--future'
  if (isPerHabit) {
    if (!cell.scheduled) return 'heatmap__cell heatmap__cell--off'
    return cell.ratio >= 1
      ? 'heatmap__cell heatmap__cell--lvl4'
      : 'heatmap__cell heatmap__cell--miss'
  }
  const r = cell.ratio
  if (!r || r === 0) return 'heatmap__cell heatmap__cell--lvl0'
  if (r < 0.25) return 'heatmap__cell heatmap__cell--lvl1'
  if (r < 0.5) return 'heatmap__cell heatmap__cell--lvl2'
  if (r < 0.85) return 'heatmap__cell heatmap__cell--lvl3'
  return 'heatmap__cell heatmap__cell--lvl4'
}

const cellTitle = (cell, isPerHabit) => {
  if (!cell) return ''
  const dateStr = cell.date.toDateString()
  if (cell.future) return `${dateStr} — upcoming`
  if (isPerHabit) {
    if (!cell.scheduled) return `${dateStr} — not scheduled`
    return cell.ratio >= 1 ? `${dateStr} — done` : `${dateStr} — missed`
  }
  return `${dateStr} — ${cell.checked}/${cell.total} (${Math.round(cell.ratio * 100)}%)`
}

export default function YearHeatmap({ habits, checks }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [habitId, setHabitId] = useState('')

  const { rows, weeks } = useMemo(
    () =>
      yearGrid({
        year,
        habits: habits.habits,
        checks,
        dayExtras: habits.dayExtras,
        dayRemoved: habits.dayRemoved,
        habitId: habitId || undefined,
      }),
    [year, habits, checks, habitId],
  )

  // Build month label positions: column index where each month starts
  const monthMarkers = useMemo(() => {
    const markers = []
    let currentMonth = -1
    for (let c = 0; c < weeks; c++) {
      // Inspect first non-null cell in this column
      for (let r = 0; r < 7; r++) {
        const cell = rows[r][c]
        if (cell && cell.date.getFullYear() === year) {
          const m = cell.date.getMonth()
          if (m !== currentMonth) {
            currentMonth = m
            markers.push({ col: c, label: MONTH_LABELS[m] })
          }
          break
        }
      }
    }
    return markers
  }, [rows, weeks, year])

  const isPerHabit = Boolean(habitId)

  return (
    <section className="heatmap-page">
      <header className="heatmap-page__head">
        <div className="heatmap-page__nav">
          <button
            type="button"
            className="heatmap-page__nav-btn"
            onClick={() => setYear((y) => y - 1)}
            aria-label="Previous year"
          >
            <ChevronLeft size={16} />
          </button>
          <h2 className="heatmap-page__title">{year}</h2>
          <button
            type="button"
            className="heatmap-page__nav-btn"
            onClick={() => setYear((y) => y + 1)}
            aria-label="Next year"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <label className="heatmap-page__select">
          <span>View:</span>
          <select value={habitId} onChange={(e) => setHabitId(e.target.value)}>
            <option value="">All habits (aggregated)</option>
            {habits.habits.map((h) => (
              <option key={h.id} value={h.id}>{h.label}</option>
            ))}
          </select>
        </label>
      </header>

      <div className="heatmap__scroll">
        <div className="heatmap" style={{ '--cols': weeks }}>
          <div className="heatmap__months">
            {monthMarkers.map((m) => (
              <span
                key={`${m.col}-${m.label}`}
                className="heatmap__month"
                style={{ gridColumn: m.col + 1 }}
              >
                {m.label}
              </span>
            ))}
          </div>
          <div className="heatmap__grid">
            {rows.map((row, r) => (
              <div key={r} className="heatmap__row">
                {row.map((cell, c) => (
                  <span
                    key={c}
                    className={intensityClass(cell, isPerHabit)}
                    title={cellTitle(cell, isPerHabit)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="heatmap__legend">
        <span>Less</span>
        <span className="heatmap__cell heatmap__cell--lvl0" />
        <span className="heatmap__cell heatmap__cell--lvl1" />
        <span className="heatmap__cell heatmap__cell--lvl2" />
        <span className="heatmap__cell heatmap__cell--lvl3" />
        <span className="heatmap__cell heatmap__cell--lvl4" />
        <span>More</span>
      </footer>
    </section>
  )
}
