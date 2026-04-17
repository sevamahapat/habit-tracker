import { useState } from 'react'
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'

export default function AuthGate({
  enabled,
  signIn,
  signUp,
  sendPasswordReset,
  onGuest,
}) {
  // mode: 'signin' | 'signup' | 'reset' | 'reset-sent' | 'check-email'
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const reset = (next) => {
    setMode(next)
    setError('')
    setBusy(false)
  }

  const handleSignIn = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error: err } = await signIn(email, password)
    setBusy(false)
    if (err) setError(err.message || 'Could not sign you in.')
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error: err, needsConfirmation } = await signUp(email, password)
    setBusy(false)
    if (err) {
      setError(err.message || 'Could not create your account.')
      return
    }
    if (needsConfirmation) reset('check-email')
    // Otherwise the auth listener will switch the app into signed-in state.
  }

  const handleReset = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error: err } = await sendPasswordReset(email)
    setBusy(false)
    if (err) setError(err.message || 'Could not send reset link.')
    else reset('reset-sent')
  }

  const isSignIn = mode === 'signin'
  const isSignUp = mode === 'signup'
  const isReset = mode === 'reset'

  return (
    <div className="auth-gate">
      <div className="auth-gate__card">
        <span className="auth-gate__petal" aria-hidden="true">❀</span>
        <h1 className="auth-gate__title">Welcome to Bloom</h1>

        {!enabled && (
          <>
            <p className="auth-gate__lead">
              Sign-in isn&rsquo;t configured for this build. You can still use Bloom
              locally — your data stays in this browser.
            </p>
            <button
              type="button"
              className="auth-gate__guest auth-gate__guest--primary"
              onClick={onGuest}
            >
              Continue without account
            </button>
          </>
        )}

        {enabled && mode === 'check-email' && (
          <>
            <p className="auth-gate__lead">
              We sent a confirmation link to <strong>{email}</strong>. Click it
              to activate your account, then come back here to sign in.
            </p>
            <button
              type="button"
              className="auth-gate__guest auth-gate__guest--primary"
              onClick={() => reset('signin')}
            >
              Back to sign in
            </button>
          </>
        )}

        {enabled && mode === 'reset-sent' && (
          <>
            <p className="auth-gate__lead">
              Check <strong>{email}</strong> for a password reset link.
            </p>
            <button
              type="button"
              className="auth-gate__guest auth-gate__guest--primary"
              onClick={() => reset('signin')}
            >
              Back to sign in
            </button>
          </>
        )}

        {enabled && (isSignIn || isSignUp || isReset) && (
          <>
            <p className="auth-gate__lead">
              {isSignIn && 'Sign in to sync your habits across devices.'}
              {isSignUp && 'Create a free account to keep your habits in sync.'}
              {isReset && 'Enter your email and we&rsquo;ll send you a reset link.'}
            </p>

            <form
              className="auth-gate__form"
              onSubmit={isSignIn ? handleSignIn : isSignUp ? handleSignUp : handleReset}
            >
              <div className="auth-gate__field">
                <Mail size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  aria-label="Email"
                />
              </div>

              {!isReset && (
                <div className="auth-gate__field">
                  <Lock size={16} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isSignUp ? 'At least 6 characters' : 'Password'}
                    required
                    minLength={isSignUp ? 6 : undefined}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    aria-label="Password"
                  />
                </div>
              )}

              <button
                type="submit"
                className="auth-gate__submit"
                disabled={busy || !email.trim() || (!isReset && !password)}
              >
                {busy ? (
                  <>
                    <Loader2 size={16} className="auth-gate__spin" />
                    {isSignIn && ' Signing in…'}
                    {isSignUp && ' Creating account…'}
                    {isReset && ' Sending…'}
                  </>
                ) : (
                  <>
                    {isSignIn && 'Sign in'}
                    {isSignUp && 'Create account'}
                    {isReset && 'Send reset link'}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {error && <p className="auth-gate__error">{error}</p>}

            <div className="auth-gate__switch">
              {isSignIn && (
                <>
                  <button
                    type="button"
                    className="auth-gate__link"
                    onClick={() => reset('signup')}
                  >
                    Don&rsquo;t have an account? Sign up
                  </button>
                  <button
                    type="button"
                    className="auth-gate__link"
                    onClick={() => reset('reset')}
                  >
                    Forgot password?
                  </button>
                </>
              )}
              {isSignUp && (
                <button
                  type="button"
                  className="auth-gate__link"
                  onClick={() => reset('signin')}
                >
                  Already have an account? Sign in
                </button>
              )}
              {isReset && (
                <button
                  type="button"
                  className="auth-gate__link"
                  onClick={() => reset('signin')}
                >
                  Back to sign in
                </button>
              )}
            </div>

            <button
              type="button"
              className="auth-gate__guest"
              onClick={onGuest}
            >
              or continue without an account
            </button>
          </>
        )}
      </div>
    </div>
  )
}
