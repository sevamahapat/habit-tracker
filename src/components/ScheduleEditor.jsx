import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const DAY_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const todayKey = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const summarizeSchedule = (schedule) => {
  const s = schedule || { type: 'daily' }
  if (s.type === 'daily') return 'Every day'
  if (s.type === 'days') {
    if (!s.days || s.days.length === 0) return 'No days'
    if (s.days.length === 7) return 'Every day'
    const set = new Set(s.days)
    const isWeekday = [1, 2, 3, 4, 5].every((d) => set.has(d)) && set.size === 5
    const isWeekend = set.has(0) && set.has(6) && set.size === 2
    if (isWeekday) return 'Weekdays'
    if (isWeekend) return 'Weekends'
    return [...s.days].sort().map((d) => DAY_FULL[d].slice(0, 3)).join(' ')
  }
  if (s.type === 'interval') {
    if (s.n === 2) return 'Every other day'
    return `Every ${s.n} days`
  }
  if (s.type === 'weekly') return `${s.n}× per week`
  return 'Every day'
}

export default function ScheduleEditor({ schedule, onChange, onClose }) {
  const ref = useRef(null)
  const [draft, setDraft] = useState(() => ({ ...(schedule || { type: 'daily' }) }))

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const setType = (type) => {
    if (type === 'daily') setDraft({ type: 'daily' })
    else if (type === 'days')
      setDraft({ type: 'days', days: draft.days?.length ? draft.days : [1, 2, 3, 4, 5] })
    else if (type === 'interval')
      setDraft({ type: 'interval', n: draft.n && draft.n >= 2 ? draft.n : 2, anchor: draft.anchor || todayKey() })
    else if (type === 'weekly')
      setDraft({ type: 'weekly', n: draft.n && draft.n >= 1 ? draft.n : 3 })
  }

  const toggleDay = (d) => {
    const set = new Set(draft.days || [])
    if (set.has(d)) set.delete(d)
    else set.add(d)
    setDraft({ ...draft, days: [...set].sort() })
  }

  const apply = () => {
    onChange(draft)
    onClose()
  }

  return (
    <div className="schedule-editor" ref={ref} role="dialog" aria-label="Edit habit schedule">
      <div className="schedule-editor__tabs">
        <button
          type="button"
          className={`schedule-editor__tab ${draft.type === 'daily' ? 'is-active' : ''}`}
          onClick={() => setType('daily')}
        >
          Daily
        </button>
        <button
          type="button"
          className={`schedule-editor__tab ${draft.type === 'days' ? 'is-active' : ''}`}
          onClick={() => setType('days')}
        >
          Days
        </button>
        <button
          type="button"
          className={`schedule-editor__tab ${draft.type === 'interval' ? 'is-active' : ''}`}
          onClick={() => setType('interval')}
        >
          Every N
        </button>
        <button
          type="button"
          className={`schedule-editor__tab ${draft.type === 'weekly' ? 'is-active' : ''}`}
          onClick={() => setType('weekly')}
        >
          N×/wk
        </button>
      </div>

      <div className="schedule-editor__body">
        {draft.type === 'daily' && (
          <p className="schedule-editor__hint">Shows up on every day of the year.</p>
        )}

        {draft.type === 'days' && (
          <>
            <div className="schedule-editor__day-row">
              {DAY_LETTERS.map((letter, idx) => {
                const active = draft.days?.includes(idx)
                return (
                  <button
                    key={idx}
                    type="button"
                    className={`schedule-editor__day ${active ? 'is-active' : ''}`}
                    onClick={() => toggleDay(idx)}
                    aria-label={DAY_FULL[idx]}
                    aria-pressed={active}
                  >
                    {letter}
                  </button>
                )
              })}
            </div>
            <div className="schedule-editor__presets">
              <button
                type="button"
                className="schedule-editor__preset"
                onClick={() => setDraft({ type: 'days', days: [1, 2, 3, 4, 5] })}
              >
                Weekdays
              </button>
              <button
                type="button"
                className="schedule-editor__preset"
                onClick={() => setDraft({ type: 'days', days: [0, 6] })}
              >
                Weekends
              </button>
            </div>
          </>
        )}

        {draft.type === 'interval' && (
          <div className="schedule-editor__interval">
            <label className="schedule-editor__field">
              <span>Every</span>
              <input
                type="number"
                min="2"
                max="30"
                value={draft.n}
                onChange={(e) =>
                  setDraft({ ...draft, n: Math.max(2, Math.min(30, Number(e.target.value) || 2)) })
                }
              />
              <span>days</span>
            </label>
            <label className="schedule-editor__field">
              <span>Starting</span>
              <input
                type="date"
                value={draft.anchor}
                onChange={(e) => setDraft({ ...draft, anchor: e.target.value || todayKey() })}
              />
            </label>
          </div>
        )}

        {draft.type === 'weekly' && (
          <div className="schedule-editor__weekly">
            <label className="schedule-editor__field">
              <input
                type="number"
                min="1"
                max="7"
                value={draft.n}
                onChange={(e) =>
                  setDraft({ ...draft, n: Math.max(1, Math.min(7, Number(e.target.value) || 1)) })
                }
              />
              <span>times per week</span>
            </label>
            <p className="schedule-editor__hint">
              Shows every day — check it off any {draft.n} days you choose.
            </p>
          </div>
        )}
      </div>

      <div className="schedule-editor__footer">
        <button type="button" className="schedule-editor__cancel" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="schedule-editor__save" onClick={apply}>
          <Check size={14} /> Save
        </button>
      </div>
    </div>
  )
}
