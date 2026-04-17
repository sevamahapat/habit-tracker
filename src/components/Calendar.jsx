import DayCard, { fmtDateKey } from './DayCard.jsx'

const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const isWeekendDay = (date) => {
  const d = date.getDay()
  return d === 0 || d === 6
}

export default function Calendar({
  year,
  month,
  tags,
  getHabitsForDay,
  isChecked,
  toggleCheck,
  getValue,
  setValue,
  incrementValue,
  addDayHabit,
  removeDayHabit,
  renameHabit,
  renameDayHabit,
  focusedDateKey,
  onFocusDate,
  activeTagId,
}) {
  const firstDay = new Date(year, month, 1)
  const lastDate = new Date(year, month + 1, 0).getDate()
  const leadBlanks = firstDay.getDay()
  const totalCells = Math.ceil((leadBlanks + lastDate) / 7) * 7

  const cells = []
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - leadBlanks + 1
    if (dayNum < 1 || dayNum > lastDate) {
      cells.push(null)
    } else {
      cells.push(new Date(year, month, dayNum))
    }
  }

  const filterByTag = (list) => {
    if (!activeTagId) return list
    return list.filter((h) => h.isExtra || h.tagIds?.includes(activeTagId))
  }

  return (
    <div className="calendar">
      <div className="calendar__weekhead">
        {WEEKDAY_HEADERS.map((h) => (
          <div key={h} className="calendar__weekhead-cell">
            {h}
          </div>
        ))}
      </div>
      <div className="calendar__grid">
        {cells.map((date, idx) => {
          if (!date) return <div key={`blank-${idx}`} className="calendar__blank" />
          const weekend = isWeekendDay(date)
          const dateKey = fmtDateKey(date)
          return (
            <DayCard
              key={dateKey}
              date={date}
              habits={filterByTag(getHabitsForDay(date, dateKey))}
              tags={tags}
              isWeekend={weekend}
              isFocused={focusedDateKey === dateKey}
              isChecked={isChecked}
              toggleCheck={toggleCheck}
              getValue={getValue}
              setValue={setValue}
              incrementValue={incrementValue}
              addDayHabit={addDayHabit}
              removeDayHabit={removeDayHabit}
              renameHabit={renameHabit}
              renameDayHabit={renameDayHabit}
              onFocus={() => onFocusDate?.(dateKey)}
            />
          )
        })}
      </div>
    </div>
  )
}
