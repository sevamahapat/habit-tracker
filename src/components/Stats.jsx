import { useMemo } from 'react'
import { Flame, Trophy } from 'lucide-react'
import Sparkline from './Sparkline.jsx'
import MonthlySummary from './MonthlySummary.jsx'
import { summarizeSchedule } from './ScheduleEditor.jsx'
import {
  currentStreak,
  longestStreak,
  completionRate,
  last7Days,
} from '../lib/stats.js'

export default function Stats({ habits, checks, settings }) {
  const grace = settings.graceDaysPerWeek
  const habitList = habits.habits

  const rows = useMemo(
    () =>
      habitList.map((habit) => {
        const cs = currentStreak({
          habit,
          checks,
          dayRemoved: habits.dayRemoved,
          graceDaysPerWeek: grace,
        })
        const ls = longestStreak({
          habit,
          checks,
          dayRemoved: habits.dayRemoved,
          graceDaysPerWeek: grace,
        })
        const cr = completionRate({
          habit,
          checks,
          dayRemoved: habits.dayRemoved,
          periodDays: 30,
        })
        const week = last7Days({
          habit,
          checks,
          dayRemoved: habits.dayRemoved,
        })
        return { habit, cs, ls, cr, week }
      }),
    [habitList, checks, habits.dayRemoved, grace],
  )

  return (
    <section className="stats-page">
      <MonthlySummary
        habits={habits}
        checks={checks}
        settings={settings}
      />

      <div className="stats-page__head">
        <h2 className="stats-page__title">Per-habit insights</h2>
        <span className="stats-page__hint">
          {grace === 0
            ? 'No grace days — streaks break on the first miss.'
            : `${grace} grace day${grace === 1 ? '' : 's'} per week`}
        </span>
      </div>

      {rows.length === 0 && (
        <p className="stats-page__empty">
          Add a habit to start seeing streaks and completion rates here.
        </p>
      )}

      <ul className="stats-list">
        {rows.map(({ habit, cs, ls, cr, week }) => (
          <li key={habit.id} className="stats-row">
            <div className="stats-row__head">
              <div className="stats-row__title">
                <span className="stats-row__label">{habit.label}</span>
                <span className="stats-row__chip">{summarizeSchedule(habit.schedule)}</span>
              </div>
              <Sparkline days={week} />
            </div>
            <div className="stats-row__metrics">
              <div className="metric">
                <Flame size={14} className="metric__icon metric__icon--flame" />
                <span className="metric__value">{cs}</span>
                <span className="metric__label">current</span>
              </div>
              <div className="metric">
                <Trophy size={14} className="metric__icon metric__icon--trophy" />
                <span className="metric__value">{ls}</span>
                <span className="metric__label">longest</span>
              </div>
              <div className="metric metric--wide">
                <span className="metric__value">{cr.percent}%</span>
                <span className="metric__label">
                  last 30d ({cr.checked}/{cr.scheduled})
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
