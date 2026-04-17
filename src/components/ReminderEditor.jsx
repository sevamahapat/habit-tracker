import { useEffect, useRef, useState } from 'react'
import { Bell, BellOff, Check } from 'lucide-react'

export default function ReminderEditor({
  reminder,
  onChange,
  onClose,
  permission,
  requestPermission,
  notificationsSupported,
}) {
  const ref = useRef(null)
  const [draft, setDraft] = useState(() => ({
    enabled: reminder?.enabled ?? true,
    time: reminder?.time ?? '09:00',
  }))

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

  const handleEnable = async () => {
    if (permission !== 'granted') {
      const result = await requestPermission()
      if (result !== 'granted') {
        setDraft({ ...draft, enabled: false })
        return
      }
    }
    setDraft({ ...draft, enabled: true })
  }

  const apply = () => {
    if (!draft.enabled) onChange(null)
    else onChange({ enabled: true, time: draft.time })
    onClose()
  }

  return (
    <div className="reminder-editor" ref={ref} role="dialog" aria-label="Edit habit reminder">
      <header className="reminder-editor__head">
        <span className="reminder-editor__title">Remind me</span>
        <button
          type="button"
          className={`reminder-editor__toggle ${draft.enabled ? 'is-on' : ''}`}
          onClick={() => (draft.enabled ? setDraft({ ...draft, enabled: false }) : handleEnable())}
        >
          {draft.enabled ? <Bell size={14} /> : <BellOff size={14} />}
          <span>{draft.enabled ? 'On' : 'Off'}</span>
        </button>
      </header>

      <label className="reminder-editor__field">
        <span>Time</span>
        <input
          type="time"
          value={draft.time}
          disabled={!draft.enabled}
          onChange={(e) => setDraft({ ...draft, time: e.target.value })}
        />
      </label>

      {!notificationsSupported && (
        <p className="reminder-editor__warn">
          Browser notifications aren&rsquo;t supported here.
        </p>
      )}
      {notificationsSupported && permission === 'denied' && (
        <p className="reminder-editor__warn">
          Notifications are blocked in your browser settings.
        </p>
      )}
      {notificationsSupported && permission === 'default' && (
        <p className="reminder-editor__hint">
          You&rsquo;ll be asked to allow notifications when you turn this on.
        </p>
      )}
      <p className="reminder-editor__hint">
        Reminders fire only while the Bloom tab is open.
      </p>

      <div className="reminder-editor__footer">
        <button type="button" className="reminder-editor__cancel" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="reminder-editor__save" onClick={apply}>
          <Check size={14} /> Save
        </button>
      </div>
    </div>
  )
}

export const summarizeReminder = (reminder) => {
  if (!reminder || !reminder.enabled || !reminder.time) return null
  return reminder.time
}
