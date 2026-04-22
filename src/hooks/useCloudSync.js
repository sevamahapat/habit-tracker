import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const DEBOUNCE_MS = 1200

const isMeaningful = (payload) => {
  if (!payload || typeof payload !== 'object') return false
  const habits = payload.habits
  if (habits && typeof habits === 'object') {
    const list = Array.isArray(habits.habits) ? habits.habits : []
    if (list.length > 0) return true
  }
  if (payload.checks && Object.keys(payload.checks).length > 0) return true
  return false
}

export function useCloudSync({ user, payload, applyPayload }) {
  // hydration: 'idle' | 'pulling' | 'ready'
  const [hydration, setHydration] = useState('idle')
  const [serverPayload, setServerPayload] = useState(null)
  const [pushing, setPushing] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState(null)
  const skipNextPushRef = useRef(false)
  const debounceRef = useRef(null)

  // 1. On user change: pull from server.
  useEffect(() => {
    if (!user || !supabase) {
      setHydration('idle')
      setServerPayload(null)
      return
    }
    let cancelled = false
    setHydration('pulling')
    supabase
      .from('user_data')
      .select('payload, updated_at')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('[bloom] cloud pull failed', error)
          setHydration('ready') // continue offline; local stays as-is
          return
        }
        const server = data?.payload
        if (server && isMeaningful(server)) {
          // Server has data → apply it (overrides local for consistency).
          skipNextPushRef.current = true
          applyPayload(server)
          setServerPayload(server)
          setLastSyncedAt(data.updated_at || new Date().toISOString())
        }
        // Server empty → fall through; the push effect will upload local data.
        setHydration('ready')
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // 2. After hydration is ready: push local changes to server (debounced).
  useEffect(() => {
    if (!user || !supabase) return
    if (hydration !== 'ready') return
    if (skipNextPushRef.current) {
      skipNextPushRef.current = false
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setPushing(true)
      const { error } = await supabase.from('user_data').upsert(
        {
          user_id: user.id,
          payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )
      setPushing(false)
      if (error) {
        console.error('[bloom] cloud push failed', error)
      } else {
        setLastSyncedAt(new Date().toISOString())
      }
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, hydration, payload])

  return {
    hydration,
    pushing,
    lastSyncedAt,
    serverPayload,
  }
}
