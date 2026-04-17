import { useCallback, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

export function useAuth() {
  const [status, setStatus] = useState(isSupabaseConfigured ? 'loading' : 'disabled')
  const [session, setSession] = useState(null)
  const [recoveryMode, setRecoveryMode] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      setSession(data.session ?? null)
      setStatus(data.session ? 'signedIn' : 'signedOut')
    })

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next ?? null)
      setStatus(next ? 'signedIn' : 'signedOut')
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true)
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email, password) => {
    if (!supabase) return { error: { message: 'Supabase not configured' } }
    const e = String(email || '').trim()
    const p = String(password || '')
    if (!e) return { error: { message: 'Enter your email' } }
    if (!p) return { error: { message: 'Enter your password' } }
    const { error } = await supabase.auth.signInWithPassword({ email: e, password: p })
    if (error) return { error }
    return { ok: true }
  }, [])

  const signUp = useCallback(async (email, password) => {
    if (!supabase) return { error: { message: 'Supabase not configured' } }
    const e = String(email || '').trim()
    const p = String(password || '')
    if (!e) return { error: { message: 'Enter your email' } }
    if (p.length < 6) return { error: { message: 'Password must be at least 6 characters' } }
    const { data, error } = await supabase.auth.signUp({
      email: e,
      password: p,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) return { error }
    // If email confirmation is disabled, signUp returns a session immediately.
    return { ok: true, needsConfirmation: !data.session }
  }, [])

  const sendPasswordReset = useCallback(async (email) => {
    if (!supabase) return { error: { message: 'Supabase not configured' } }
    const e = String(email || '').trim()
    if (!e) return { error: { message: 'Enter your email' } }
    const { error } = await supabase.auth.resetPasswordForEmail(e, {
      redirectTo: window.location.origin,
    })
    if (error) return { error }
    return { ok: true }
  }, [])

  const updatePassword = useCallback(async (password) => {
    if (!supabase) return { error: { message: 'Supabase not configured' } }
    if (String(password).length < 6) {
      return { error: { message: 'Password must be at least 6 characters' } }
    }
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return { error }
    setRecoveryMode(false)
    return { ok: true }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    setRecoveryMode(false)
    await supabase.auth.signOut()
  }, [])

  return {
    status,
    session,
    user: session?.user ?? null,
    recoveryMode,
    signIn,
    signUp,
    sendPasswordReset,
    updatePassword,
    signOut,
    enabled: isSupabaseConfigured,
  }
}
