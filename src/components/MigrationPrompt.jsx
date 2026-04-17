import { Upload } from 'lucide-react'

export default function MigrationPrompt({ onAccept, onCancel, summary }) {
  return (
    <div className="migration">
      <div className="migration__card">
        <span className="migration__icon" aria-hidden="true">
          <Upload size={20} />
        </span>
        <h2 className="migration__title">Bring your data over?</h2>
        <p className="migration__lead">
          Your account is empty, but this device has habits already. Want to
          upload them so they sync everywhere?
        </p>
        {summary && (
          <ul className="migration__summary">
            {summary.habits != null && <li>{summary.habits} habits</li>}
            {summary.checks != null && (
              <li>
                {summary.checks} day{summary.checks === 1 ? '' : 's'} of check-ins
              </li>
            )}
            {summary.tags != null && summary.tags > 0 && (
              <li>
                {summary.tags} tag{summary.tags === 1 ? '' : 's'}
              </li>
            )}
          </ul>
        )}
        <div className="migration__actions">
          <button
            type="button"
            className="migration__btn migration__btn--primary"
            onClick={onAccept}
          >
            Upload to my account
          </button>
          <button type="button" className="migration__btn" onClick={onCancel}>
            Sign out instead
          </button>
        </div>
        <p className="migration__hint">
          Signing out keeps your local data untouched. You can sign in again
          later or use Bloom in guest mode.
        </p>
      </div>
    </div>
  )
}
