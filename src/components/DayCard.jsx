import { useEffect, useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'
import ProgressBar from './ProgressBar.jsx'
import InlineRename from './InlineRename.jsx'
import QuantInput from './QuantInput.jsx'
import { habitTargetAmount } from '../hooks/useHabits.js'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const fmtDateKey = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const isSameDate = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

export default function DayCard({
  date,
  habits,
  tags,
  isWeekend,
  isFocused,
  isChecked,
  toggleCheck,
  getValue,
  setValue,
  incrementValue,
  addDayHabit,
  removeDayHabit,
  renameHabit,
  renameDayHabit,
  onFocus,
}) {
  const dateKey = fmtDateKey(date)
  const dayName = DAY_NAMES[date.getDay()]
  const today = isSameDate(date, new Date())
  const articleRef = useRef(null)
  const tagMap = new Map((tags || []).map((t) => [t.id, t]))

  const [adding, setAdding] = useState(false)
  const [value, setLocalValue] = useState('')

  useEffect(() => {
    if (isFocused && articleRef.current) {
      articleRef.current.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }
  }, [isFocused])

  const checkedCount = habits.reduce((acc, h) => {
    const v = getValue(dateKey, h.id)
    return acc + (v >= habitTargetAmount(h) ? 1 : 0)
  }, 0)

  const cardClass = [
    'day-card',
    isWeekend ? 'day-card--weekend' : 'day-card--weekday',
    today ? 'day-card--today' : '',
    isFocused ? 'day-card--focused' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const submitAdd = (e) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (trimmed) addDayHabit(dateKey, trimmed)
    setLocalValue('')
    setAdding(false)
  }

  const cancelAdd = () => {
    setAdding(false)
    setLocalValue('')
  }

  return (
    <article
      ref={articleRef}
      className={cardClass}
      onClick={onFocus}
      data-date={dateKey}
    >
      <span className="day-card__petal" aria-hidden="true">
        ✿
      </span>
      <header className="day-card__header">
        <span className="day-card__date">{date.getDate()}</span>
        <span className="day-card__day-name">{dayName}</span>
      </header>

      <ul className="day-card__habits">
        {habits.length === 0 && !adding && (
          <li className="habit-row habit-row--empty">No habits</li>
        )}
        {habits.map((habit) => {
          const target = habitTargetAmount(habit)
          const v = getValue(dateKey, habit.id)
          const complete = v >= target
          const isCount = habit.target?.kind === 'count'
          const handleRename = (label) => {
            if (habit.isExtra) renameDayHabit(dateKey, habit.id, label)
            else renameHabit(habit.id, label)
          }
          const habitTagDots = (habit.tagIds || [])
            .map((id) => tagMap.get(id))
            .filter(Boolean)

          return (
            <li key={habit.id} className="habit-row-wrap">
              <div className={`habit-row ${complete ? 'habit-row--checked' : ''}`}>
                {!isCount && (
                  <button
                    type="button"
                    className="habit-row__check"
                    onClick={() => toggleCheck(dateKey, habit.id, target)}
                    aria-label={`${complete ? 'Uncheck' : 'Check'} ${habit.label}`}
                    aria-pressed={complete}
                  >
                    <span className="habit-row__box" aria-hidden="true">
                      {complete ? '✓' : ''}
                    </span>
                  </button>
                )}
                <div className="habit-row__main">
                  <div className="habit-row__title">
                    <InlineRename
                      className="habit-row__label"
                      value={habit.label}
                      onCommit={handleRename}
                      ariaLabel={`Rename ${habit.label}`}
                    />
                    {habitTagDots.length > 0 && (
                      <span className="habit-row__tags" aria-hidden="true">
                        {habitTagDots.map((t) => (
                          <span
                            key={t.id}
                            className="habit-row__tag-dot"
                            style={{ background: t.color }}
                            title={t.name}
                          />
                        ))}
                      </span>
                    )}
                  </div>
                  {isCount && (
                    <QuantInput
                      value={v}
                      target={target}
                      unit={habit.target?.unit || ''}
                      onIncrement={(delta) => incrementValue(dateKey, habit.id, delta)}
                      onSet={(val) => setValue(dateKey, habit.id, val)}
                    />
                  )}
                </div>
              </div>
              <button
                type="button"
                className="habit-row__delete"
                onClick={() => removeDayHabit(dateKey, habit.id, habit.isExtra)}
                aria-label={`Remove ${habit.label} from this day`}
                title="Remove from this day"
              >
                <X size={12} />
              </button>
            </li>
          )
        })}
        {adding ? (
          <li>
            <form className="day-card__add-form" onSubmit={submitAdd}>
              <input
                autoFocus
                value={value}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={submitAdd}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') cancelAdd()
                }}
                placeholder="New habit…"
                aria-label="Add habit for this day"
              />
            </form>
          </li>
        ) : (
          <li>
            <button
              type="button"
              className="day-card__add-btn"
              onClick={() => setAdding(true)}
              aria-label="Add habit to this day"
            >
              <Plus size={12} />
              <span>add</span>
            </button>
          </li>
        )}
      </ul>

      <ProgressBar value={checkedCount} total={habits.length} />
    </article>
  )
}
