import { useEffect, useRef, useState } from 'react'
import { LogOut, Cloud, CloudOff, User, RefreshCw } from 'lucide-react'

const formatRelative = (iso) => {
  if (!iso) return null
  const ts = new Date(iso).getTime()
  if (!Number.isFinite(ts)) return null
  const diff = Math.max(0, Date.now() - ts)
  const sec = Math.round(diff / 1000)
  if (sec < 60) return 'just now'
  const min = Math.round(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  return new Date(iso).toLocaleDateString()
}

export default function AccountMenu({ user, onSignOut, sync }) {
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

  if (!user) return null
  const initials = (user.email || '?').slice(0, 1).toUpperCase()

  const syncedLabel = sync?.pushing
    ? 'syncing…'
    : sync?.lastSyncedAt
      ? `synced ${formatRelative(sync.lastSyncedAt)}`
      : sync?.hydration === 'pulling'
        ? 'loading…'
        : 'idle'
  const SyncIcon = sync?.pushing ? RefreshCw : sync?.lastSyncedAt ? Cloud : CloudOff

  return (
    <div className="account-menu" ref={ref}>
      <button
        type="button"
        className="account-menu__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Account: ${user.email}`}
        aria-expanded={open}
      >
        <span className="account-menu__avatar">{initials}</span>
      </button>
      {open && (
        <div className="account-menu__panel" role="menu">
          <div className="account-menu__head">
            <span className="account-menu__avatar account-menu__avatar--lg">
              {initials}
            </span>
            <div className="account-menu__who">
              <span className="account-menu__email">{user.email}</span>
              <span className="account-menu__sync">
                <SyncIcon
                  size={12}
                  className={sync?.pushing ? 'account-menu__spin' : ''}
                />
                {syncedLabel}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="account-menu__item"
            onClick={() => {
              setOpen(false)
              onSignOut()
            }}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}

export function GuestPill({ onSignIn }) {
  return (
    <button type="button" className="account-pill" onClick={onSignIn}>
      <User size={14} /> Sign in to sync
    </button>
  )
}
