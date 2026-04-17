import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import InlineRename from './InlineRename.jsx'
import { TAG_COLORS } from '../hooks/useHabits.js'

export default function TagManager({ tags, addTag, removeTag, renameTag, recolorTag }) {
  const [open, setOpen] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [draftColor, setDraftColor] = useState(TAG_COLORS[0])

  const submit = (e) => {
    e.preventDefault()
    if (!draftName.trim()) return
    addTag(draftName, draftColor)
    setDraftName('')
  }

  return (
    <div className="tag-manager">
      <button
        type="button"
        className="tag-manager__head"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>Tags ({tags.length})</span>
        <span className="tag-manager__chevron" aria-hidden="true">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="tag-manager__body">
          <ul className="tag-manager__list">
            {tags.length === 0 && (
              <li className="tag-manager__empty">No tags yet — add one below.</li>
            )}
            {tags.map((tag) => (
              <li key={tag.id} className="tag-manager__row">
                <span
                  className="tag-manager__swatch"
                  style={{ background: tag.color }}
                  aria-hidden="true"
                />
                <InlineRename
                  className="tag-manager__name"
                  value={tag.name}
                  onCommit={(name) => renameTag(tag.id, name)}
                  ariaLabel={`Rename ${tag.name}`}
                />
                <div className="tag-manager__colors">
                  {TAG_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`tag-manager__color ${tag.color === c ? 'is-active' : ''}`}
                      style={{ background: c }}
                      onClick={() => recolorTag(tag.id, c)}
                      aria-label={`Use color ${c}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className="tag-manager__delete"
                  onClick={() => removeTag(tag.id)}
                  aria-label={`Delete ${tag.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>

          <form className="tag-manager__add" onSubmit={submit}>
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="New tag name"
              aria-label="New tag name"
            />
            <div className="tag-manager__colors">
              {TAG_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`tag-manager__color ${draftColor === c ? 'is-active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setDraftColor(c)}
                  aria-label={`Pick color ${c}`}
                />
              ))}
            </div>
            <button type="submit" className="tag-manager__add-btn" aria-label="Add tag">
              <Plus size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
