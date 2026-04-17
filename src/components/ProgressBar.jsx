export default function ProgressBar({ value, total, showMeta = true }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div>
      <div
        className="progress"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="progress__fill" style={{ width: `${pct}%` }} />
      </div>
      {showMeta && (
        <div className="progress__meta">
          <span>
            {value}/{total}
          </span>
          <span>{pct}%</span>
        </div>
      )}
    </div>
  )
}
