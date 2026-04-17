import { CalendarDays, BarChart3, Grid3X3 } from 'lucide-react'

const TABS = [
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
  { id: 'heatmap', label: 'Heatmap', icon: Grid3X3 },
]

export default function ViewTabs({ view, setView }) {
  return (
    <div className="view-tabs" role="tablist">
      {TABS.map((t) => {
        const Icon = t.icon
        const active = view === t.id
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={`view-tabs__tab ${active ? 'is-active' : ''}`}
            onClick={() => setView(t.id)}
          >
            <Icon size={15} />
            <span>{t.label}</span>
          </button>
        )
      })}
    </div>
  )
}
