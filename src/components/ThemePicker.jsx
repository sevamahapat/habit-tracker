import { useEffect, useRef, useState } from 'react'
import { THEMES } from '../hooks/useTheme.js'

export default function ThemePicker({ theme, setTheme }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const active = THEMES.find((t) => t.id === theme) || THEMES[0]

  return (
    <div className="theme-picker" ref={ref}>
      <button
        type="button"
        className="theme-picker__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Change theme (current: ${active.label})`}
        aria-expanded={open}
      >
        <span
          className="theme-picker__dot"
          style={{
            background: `linear-gradient(135deg, ${active.swatch[0]}, ${active.swatch[1]})`,
          }}
        />
      </button>
      {open && (
        <div className="theme-picker__menu" role="menu">
          <div className="theme-picker__title">Theme</div>
          <div className="theme-picker__grid">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`theme-picker__option ${
                  t.id === theme ? 'theme-picker__option--active' : ''
                }`}
                onClick={() => {
                  setTheme(t.id)
                  setOpen(false)
                }}
                aria-label={`Use ${t.label} theme`}
              >
                <span
                  className="theme-picker__swatch"
                  style={{
                    background: `linear-gradient(135deg, ${t.swatch[0]}, ${t.swatch[1]})`,
                  }}
                />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
