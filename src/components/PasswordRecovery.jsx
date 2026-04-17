import { useState } from 'react'
import { Lock, ArrowRight, Loader2 } from 'lucide-react'

export default function PasswordRecovery({ updatePassword, onCancel }) {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error: err } = await updatePassword(password)
    setBusy(false)
    if (err) setError(err.message || 'Could not update your password.')
  }

  return (
    <div className="auth-gate">
      <div className="auth-gate__card">
        <span className="auth-gate__petal" aria-hidden="true">❀</span>
        <h1 className="auth-gate__title">Set a new password</h1>
        <p className="auth-gate__lead">
          Pick a new password to finish recovering your account.
        </p>
        <form className="auth-gate__form" onSubmit={submit}>
          <div className="auth-gate__field">
            <Lock size={16} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              autoComplete="new-password"
              aria-label="New password"
            />
          </div>
          <button
            type="submit"
            className="auth-gate__submit"
            disabled={busy || password.length < 6}
          >
            {busy ? (
              <>
                <Loader2 size={16} className="auth-gate__spin" /> Saving…
              </>
            ) : (
              <>
                Save password <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
        {error && <p className="auth-gate__error">{error}</p>}
        <button type="button" className="auth-gate__link" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}
