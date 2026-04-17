export default function TagFilter({ tags, activeTagId, setActiveTagId }) {
  if (!tags || tags.length === 0) return null
  return (
    <div className="tag-filter" role="tablist" aria-label="Filter by tag">
      <button
        type="button"
        role="tab"
        aria-selected={!activeTagId}
        className={`tag-filter__pill ${!activeTagId ? 'is-active' : ''}`}
        onClick={() => setActiveTagId(null)}
      >
        All
      </button>
      {tags.map((tag) => {
        const active = activeTagId === tag.id
        return (
          <button
            key={tag.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={`tag-filter__pill ${active ? 'is-active' : ''}`}
            style={
              active
                ? { background: tag.color, color: '#fff', borderColor: tag.color }
                : { borderColor: tag.color }
            }
            onClick={() => setActiveTagId(active ? null : tag.id)}
          >
            <span className="tag-filter__dot" style={{ background: tag.color }} />
            {tag.name}
          </button>
        )
      })}
    </div>
  )
}
