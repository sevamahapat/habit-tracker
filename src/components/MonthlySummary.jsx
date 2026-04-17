import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { monthSummary } from '../lib/stats.js'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const lastCompletedMonth = () => {
  const now = new Date()
  // Default to the previous calendar month
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return { year: d.getFullYear(), month: d.getMonth() }
}

export default function MonthlySummary({ habits, checks, settings }) {
  const [cursor, setCursor] = useState(lastCompletedMonth)

  const summary = useMemo(
    () =>
      monthSummary({
        year: cursor.year,
        month: cursor.month,
        habits: habits.habits,
        checks,
        dayExtras: habits.dayExtras,
        dayRemoved: habits.dayRemoved,
        graceDaysPerWeek: settings.graceDaysPerWeek,
      }),
    [cursor.year, cursor.month, habits, checks, settings.graceDaysPerWeek],
  )

  const shift = (delta) => {
    setCursor((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  const exportImage = async () => {
    const svg = renderSummarySVG(summary)
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    try {
      const png = await svgUrlToPngBlob(url, 1200, 800)
      const link = document.createElement('a')
      link.href = URL.createObjectURL(png)
      link.download = `bloom-${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}.png`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(link.href)
    } catch {
      // Fallback: download SVG itself
      const link = document.createElement('a')
      link.href = url
      link.download = `bloom-${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}.svg`
      document.body.appendChild(link)
      link.click()
      link.remove()
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  return (
    <article className="summary-card">
      <header className="summary-card__head">
        <div className="summary-card__nav">
          <button
            type="button"
            className="summary-card__nav-btn"
            onClick={() => shift(-1)}
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <h2 className="summary-card__month">
            {MONTH_NAMES[cursor.month]} {cursor.year}
          </h2>
          <button
            type="button"
            className="summary-card__nav-btn"
            onClick={() => shift(1)}
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <button
          type="button"
          className="summary-card__export"
          onClick={exportImage}
        >
          <Download size={14} /> Save as image
        </button>
      </header>

      <div className="summary-card__headline">{summary.headline}</div>

      <div className="summary-card__grid">
        <div className="summary-card__stat">
          <span className="summary-card__num">{summary.totalChecks}</span>
          <span className="summary-card__caption">checks total</span>
        </div>
        <div className="summary-card__stat">
          <span className="summary-card__num">{summary.perfectDays}</span>
          <span className="summary-card__caption">perfect days</span>
        </div>
        <div className="summary-card__stat">
          <span className="summary-card__num">{summary.zeroDays}</span>
          <span className="summary-card__caption">zero days</span>
        </div>
        <div className="summary-card__stat">
          <span className="summary-card__num">
            {summary.daysCounted}/{summary.monthDays}
          </span>
          <span className="summary-card__caption">days counted</span>
        </div>
      </div>

      {summary.topHabits.length > 0 && (
        <div className="summary-card__top">
          <h3 className="summary-card__top-title">Top habits</h3>
          <ul className="summary-card__top-list">
            {summary.topHabits.map(({ habit, percent, checked, scheduled }) => (
              <li key={habit.id} className="summary-card__top-row">
                <span className="summary-card__top-label">{habit.label}</span>
                <span className="summary-card__top-bar">
                  <span
                    className="summary-card__top-fill"
                    style={{ width: `${Math.min(100, percent)}%` }}
                  />
                </span>
                <span className="summary-card__top-pct">
                  {percent}% <span className="summary-card__top-frac">{checked}/{scheduled}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  )
}

const renderSummarySVG = (summary) => {
  const W = 1200
  const H = 800
  const tops = summary.topHabits
  const escape = (s) =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

  const rows = tops.map((t, i) => {
    const y = 540 + i * 70
    const barW = 600
    const fillW = Math.max(8, (Math.min(100, t.percent) / 100) * barW)
    return `
      <text x="80" y="${y - 14}" fill="#3a2a3f" font-family="Playfair Display, Georgia, serif" font-size="26" font-weight="600">${escape(t.habit.label)}</text>
      <text x="${80 + barW + 30}" y="${y + 12}" fill="#6b5a72" font-family="Nunito, sans-serif" font-size="22" font-weight="700">${t.percent}%</text>
      <rect x="80" y="${y}" width="${barW}" height="14" rx="7" fill="#f7f1ff" />
      <rect x="80" y="${y}" width="${fillW}" height="14" rx="7" fill="url(#bloomGrad)" />
    `
  }).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff1f6" />
      <stop offset="100%" stop-color="#f7f1ff" />
    </linearGradient>
    <linearGradient id="bloomGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#a97de6" />
      <stop offset="100%" stop-color="#e87aab" />
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)" />
  <text x="80" y="100" fill="#8a5dd1" font-family="Playfair Display, Georgia, serif" font-size="28" font-style="italic">❀ Bloom</text>
  <text x="80" y="180" fill="#3a2a3f" font-family="Playfair Display, Georgia, serif" font-size="56" font-weight="700">${escape(MONTH_NAMES[summary.month])} ${summary.year}</text>
  <text x="80" y="270" fill="#d4537e" font-family="Playfair Display, Georgia, serif" font-size="64" font-style="italic" font-weight="700">${escape(summary.headline)}</text>

  <g font-family="Nunito, sans-serif">
    <text x="80" y="380" fill="#3a2a3f" font-size="60" font-weight="700">${summary.totalChecks}</text>
    <text x="80" y="410" fill="#6b5a72" font-size="20" font-weight="600">checks total</text>
    <text x="350" y="380" fill="#3a2a3f" font-size="60" font-weight="700">${summary.perfectDays}</text>
    <text x="350" y="410" fill="#6b5a72" font-size="20" font-weight="600">perfect days</text>
    <text x="620" y="380" fill="#3a2a3f" font-size="60" font-weight="700">${summary.zeroDays}</text>
    <text x="620" y="410" fill="#6b5a72" font-size="20" font-weight="600">zero days</text>
    <text x="890" y="380" fill="#3a2a3f" font-size="60" font-weight="700">${summary.daysCounted}/${summary.monthDays}</text>
    <text x="890" y="410" fill="#6b5a72" font-size="20" font-weight="600">days counted</text>
  </g>

  ${rows}

  <text x="${W - 80}" y="${H - 40}" text-anchor="end" fill="#b5a6c0" font-family="Nunito, sans-serif" font-size="16">bloom · habit tracker</text>
</svg>`
}

const svgUrlToPngBlob = (url, w, h) =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('canvas.toBlob returned null'))
      }, 'image/png')
    }
    img.onerror = () => reject(new Error('Failed to render summary image'))
    img.src = url
  })
