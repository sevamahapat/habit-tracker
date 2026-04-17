import { Minus, Plus } from 'lucide-react'

const formatValue = (n) => {
  if (Number.isInteger(n)) return String(n)
  return String(Math.round(n * 10) / 10)
}

export default function QuantInput({ value, target, unit, onIncrement, onSet }) {
  const reached = value >= target
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0

  const handleInput = (e) => {
    const v = Number(e.target.value)
    if (!Number.isFinite(v) || v < 0) return
    onSet(v)
  }

  return (
    <div className={`quant ${reached ? 'quant--done' : ''}`}>
      <button
        type="button"
        className="quant__btn"
        onClick={() => onIncrement(-Math.max(target / 6, 0.5))}
        aria-label="Decrease"
      >
        <Minus size={12} />
      </button>
      <div className="quant__bar" aria-hidden="true">
        <div className="quant__fill" style={{ width: `${pct}%` }} />
      </div>
      <button
        type="button"
        className="quant__btn"
        onClick={() => onIncrement(Math.max(target / 6, 0.5))}
        aria-label="Increase"
      >
        <Plus size={12} />
      </button>
      <input
        type="number"
        className="quant__value"
        min="0"
        step="0.1"
        value={formatValue(value)}
        onChange={handleInput}
        aria-label={`Value, target ${target} ${unit}`}
      />
      <span className="quant__unit">/ {formatValue(target)} {unit}</span>
    </div>
  )
}
