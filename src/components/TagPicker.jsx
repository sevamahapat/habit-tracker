import { useEffect, useRef } from 'react'

export default function TagPicker({ tags, selectedIds, onChange, onClose }) {
  const ref = useRef(null)
  const selected = new Set(selectedIds || [])

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

  const toggle = (id) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange([...next])
  }

  return (
    <div className="tag-picker" ref={ref} role="dialog" aria-label="Choose tags">
      {tags.length === 0 && (
        <p className="tag-picker__empty">Add tags first in the sidebar.</p>
      )}
      {tags.length > 0 && (
        <ul className="tag-picker__list">
          {tags.map((tag) => {
            const on = selected.has(tag.id)
            return (
              <li key={tag.id}>
                <button
                  type="button"
                  className={`tag-picker__row ${on ? 'is-active' : ''}`}
                  onClick={() => toggle(tag.id)}
                >
                  <span
                    className="tag-picker__dot"
                    style={{ background: tag.color }}
                  />
                  <span className="tag-picker__name">{tag.name}</span>
                  <span className="tag-picker__check" aria-hidden="true">
                    {on ? '✓' : ''}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
