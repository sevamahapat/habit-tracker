import { useRef, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, Trash2, X, Download, Upload, Bell, Tag, Target } from 'lucide-react'
import ScheduleEditor, { summarizeSchedule } from './ScheduleEditor.jsx'
import TargetEditor, { summarizeTarget } from './TargetEditor.jsx'
import ReminderEditor, { summarizeReminder } from './ReminderEditor.jsx'
import TagPicker from './TagPicker.jsx'
import TagManager from './TagManager.jsx'
import InlineRename from './InlineRename.jsx'

function SortableHabit({
  habit,
  tags,
  onRename,
  onDelete,
  onUpdateSchedule,
  onUpdateTarget,
  onUpdateReminder,
  onUpdateTags,
  reminders,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: habit.id })

  const [openPanel, setOpenPanel] = useState(null) // 'schedule' | 'target' | 'reminder' | 'tags'

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const close = () => setOpenPanel(null)
  const targetSummary = summarizeTarget(habit.target)
  const reminderSummary = summarizeReminder(habit.reminder)
  const tagMap = new Map((tags || []).map((t) => [t.id, t]))
  const habitTags = (habit.tagIds || []).map((id) => tagMap.get(id)).filter(Boolean)

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`habit-item ${isDragging ? 'habit-item--dragging' : ''}`}
    >
      <span
        className="habit-item__handle"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        ⋮⋮
      </span>
      <div className="habit-item__main">
        <InlineRename
          className="habit-item__label"
          value={habit.label}
          onCommit={onRename}
          ariaLabel={`Rename ${habit.label}`}
        />
        <div className="habit-item__chips">
          <div className="habit-item__chip-wrap">
            <button
              type="button"
              className="habit-item__schedule"
              onClick={() => setOpenPanel(openPanel === 'schedule' ? null : 'schedule')}
              aria-label={`Schedule: ${summarizeSchedule(habit.schedule)} — click to edit`}
              aria-expanded={openPanel === 'schedule'}
            >
              {summarizeSchedule(habit.schedule)}
            </button>
            {openPanel === 'schedule' && (
              <ScheduleEditor
                schedule={habit.schedule}
                onChange={onUpdateSchedule}
                onClose={close}
              />
            )}
          </div>

          <div className="habit-item__chip-wrap">
            <button
              type="button"
              className={`habit-item__icon-chip ${targetSummary ? 'is-set' : ''}`}
              onClick={() => setOpenPanel(openPanel === 'target' ? null : 'target')}
              aria-label="Edit target"
              aria-expanded={openPanel === 'target'}
            >
              <Target size={11} />
              <span>{targetSummary ?? 'check'}</span>
            </button>
            {openPanel === 'target' && (
              <TargetEditor
                target={habit.target}
                onChange={onUpdateTarget}
                onClose={close}
              />
            )}
          </div>

          <div className="habit-item__chip-wrap">
            <button
              type="button"
              className={`habit-item__icon-chip ${reminderSummary ? 'is-set' : ''}`}
              onClick={() => setOpenPanel(openPanel === 'reminder' ? null : 'reminder')}
              aria-label="Edit reminder"
              aria-expanded={openPanel === 'reminder'}
            >
              <Bell size={11} />
              <span>{reminderSummary ?? 'off'}</span>
            </button>
            {openPanel === 'reminder' && (
              <ReminderEditor
                reminder={habit.reminder}
                onChange={onUpdateReminder}
                onClose={close}
                permission={reminders.permission}
                requestPermission={reminders.requestPermission}
                notificationsSupported={reminders.notificationsSupported}
              />
            )}
          </div>

          <div className="habit-item__chip-wrap">
            <button
              type="button"
              className={`habit-item__icon-chip ${habitTags.length > 0 ? 'is-set' : ''}`}
              onClick={() => setOpenPanel(openPanel === 'tags' ? null : 'tags')}
              aria-label="Edit tags"
              aria-expanded={openPanel === 'tags'}
            >
              <Tag size={11} />
              {habitTags.length === 0 ? (
                <span>none</span>
              ) : (
                <span className="habit-item__tag-dots">
                  {habitTags.map((t) => (
                    <span
                      key={t.id}
                      className="habit-item__tag-dot"
                      style={{ background: t.color }}
                    />
                  ))}
                </span>
              )}
            </button>
            {openPanel === 'tags' && (
              <TagPicker
                tags={tags}
                selectedIds={habit.tagIds || []}
                onChange={onUpdateTags}
                onClose={close}
              />
            )}
          </div>
        </div>
      </div>
      <button
        className="habit-item__delete"
        onClick={onDelete}
        aria-label={`Delete ${habit.label}`}
        type="button"
      >
        <Trash2 size={16} />
      </button>
    </li>
  )
}

export default function HabitSidebar({
  habits,
  addHabit,
  removeHabit,
  renameHabit,
  updateHabitSchedule,
  updateHabitTarget,
  updateHabitReminder,
  setHabitTags,
  reorderHabits,
  addTag,
  removeTag,
  renameTag,
  recolorTag,
  reminders,
  onExport,
  onImport,
  settings,
  updateSettings,
  open,
  onClose,
}) {
  const [value, setValue] = useState('')
  const fileRef = useRef(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const items = habits.habits

  const handleSubmit = (e) => {
    e.preventDefault()
    addHabit(value)
    setValue('')
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = items.findIndex((i) => i.id === active.id)
    const to = items.findIndex((i) => i.id === over.id)
    if (from < 0 || to < 0) return
    reorderHabits(from, to)
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) await onImport(file)
  }

  const ids = items.map((i) => i.id)

  return (
    <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
      <div className="sidebar__header">
        <h2 className="sidebar__title">My Habits</h2>
        <button
          className="sidebar__close"
          onClick={onClose}
          aria-label="Close sidebar"
          type="button"
        >
          <X size={20} />
        </button>
      </div>

      <div className="habit-section">
        <form className="habit-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Add a habit…"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label="Add habit"
          />
          <button type="submit" className="habit-form__btn" aria-label="Add habit">
            <Plus size={18} />
          </button>
        </form>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <ul className="habit-list">
              {items.length === 0 && (
                <li className="habit-list__empty">No habits yet — add one above.</li>
              )}
              {items.map((habit) => (
                <SortableHabit
                  key={habit.id}
                  habit={habit}
                  tags={habits.tags}
                  reminders={reminders}
                  onRename={(label) => renameHabit(habit.id, label)}
                  onDelete={() => removeHabit(habit.id)}
                  onUpdateSchedule={(schedule) => updateHabitSchedule(habit.id, schedule)}
                  onUpdateTarget={(target) => updateHabitTarget(habit.id, target)}
                  onUpdateReminder={(reminder) => updateHabitReminder(habit.id, reminder)}
                  onUpdateTags={(tagIds) => setHabitTags(habit.id, tagIds)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </div>

      <TagManager
        tags={habits.tags}
        addTag={addTag}
        removeTag={removeTag}
        renameTag={renameTag}
        recolorTag={recolorTag}
      />

      <div className="sidebar__settings">
        <label className="sidebar__setting">
          <span className="sidebar__setting-label">Grace days / week</span>
          <input
            type="number"
            min="0"
            max="7"
            value={settings?.graceDaysPerWeek ?? 1}
            onChange={(e) => {
              const n = Math.max(0, Math.min(7, Number(e.target.value) || 0))
              updateSettings?.({ graceDaysPerWeek: n })
            }}
          />
        </label>
        <p className="sidebar__setting-hint">
          Misses you can absorb each week without breaking a streak.
        </p>
      </div>

      <footer className="sidebar__footer">
        <button type="button" className="sidebar__io-btn" onClick={onExport}>
          <Download size={14} /> Export
        </button>
        <button
          type="button"
          className="sidebar__io-btn"
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={14} /> Import
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFile}
          hidden
        />
      </footer>
    </aside>
  )
}
