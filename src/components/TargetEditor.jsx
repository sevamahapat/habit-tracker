import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'

const PRESET_UNITS = ['min', 'L', 'pages', 'reps', 'km', 'cups']

export default function TargetEditor({ target, onChange, onClose }) {
  const ref = useRef(null)
  const [draft, setDraft] = useState(() => {
    if (!target || target.kind === 'check') {
      return { kind: 'check', amount: 1, unit: 'min' }
    }
    return { kind: 'count', amount: target.amount, unit: target.unit }
  })

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

  const apply = () => {
    if (draft.kind === 'check') onChange(null)
    else onChange({ kind: 'count', amount: Number(draft.amount) || 1, unit: draft.unit })
    onClose()
  }

  return (
    <div className="target-editor" ref={ref} role="dialog" aria-label="Edit habit target">
      <div className="target-editor__tabs">
        <button
          type="button"
          className={`target-editor__tab ${draft.kind === 'check' ? 'is-active' : ''}`}
          onClick={() => setDraft({ ...draft, kind: 'check' })}
        >
          Checkbox
        </button>
        <button
          type="button"
          className={`target-editor__tab ${draft.kind === 'count' ? 'is-active' : ''}`}
          onClick={() => setDraft({ ...draft, kind: 'count' })}
        >
          Count toward target
        </button>
      </div>

      {draft.kind === 'count' && (
        <div className="target-editor__row">
          <label className="target-editor__field">
            <span>Daily target</span>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={draft.amount}
              onChange={(e) =>
                setDraft({ ...draft, amount: Math.max(0.1, Number(e.target.value) || 0.1) })
              }
            />
          </label>
          <label className="target-editor__field">
            <span>Unit</span>
            <input
              type="text"
              list="unit-presets"
              value={draft.unit}
              onChange={(e) => setDraft({ ...draft, unit: e.target.value.slice(0, 12) })}
              placeholder="min"
            />
            <datalist id="unit-presets">
              {PRESET_UNITS.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </label>
        </div>
      )}

      {draft.kind === 'check' && (
        <p className="target-editor__hint">A simple done/not-done checkbox.</p>
      )}

      <div className="target-editor__footer">
        <button type="button" className="target-editor__cancel" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="target-editor__save" onClick={apply}>
          <Check size={14} /> Save
        </button>
      </div>
    </div>
  )
}

export const summarizeTarget = (target) => {
  if (!target || target.kind === 'check') return null
  return `${formatNumber(target.amount)} ${target.unit}`
}

const formatNumber = (n) => {
  if (Number.isInteger(n)) return String(n)
  return String(Math.round(n * 10) / 10)
}
