const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function Sparkline({ days }) {
  return (
    <div className="sparkline" aria-label="Last 7 days">
      {days.map((d, i) => {
        const cls = !d.scheduled
          ? 'sparkline__cell sparkline__cell--off'
          : d.checked
            ? 'sparkline__cell sparkline__cell--on'
            : 'sparkline__cell sparkline__cell--miss'
        const title = !d.scheduled
          ? `${d.key} — not scheduled`
          : d.checked
            ? `${d.key} — done`
            : `${d.key} — missed`
        return (
          <span
            key={d.key}
            className={cls}
            title={title}
            aria-label={title}
          >
            <span className="sparkline__letter" aria-hidden="true">
              {DAY_LETTERS[d.date.getDay()]}
            </span>
          </span>
        )
      })}
    </div>
  )
}
