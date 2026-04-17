import { useCallback, useEffect, useState } from 'react'

const isStandalone = () => {
  if (typeof window === 'undefined') return false
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true
  // iOS Safari
  if ('standalone' in window.navigator && window.navigator.standalone) return true
  return false
}

export function usePWA() {
  const [installPromptEvent, setInstallPromptEvent] = useState(null)
  const [installed, setInstalled] = useState(isStandalone)

  // 1. Register the service worker once.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/service-worker.js').catch((err) => {
      console.warn('[bloom] service worker registration failed', err)
    })
  }, [])

  // 2. Capture the install prompt so we can trigger it on demand.
  useEffect(() => {
    const onBeforeInstall = (event) => {
      event.preventDefault()
      setInstallPromptEvent(event)
    }
    const onInstalled = () => {
      setInstallPromptEvent(null)
      setInstalled(true)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!installPromptEvent) return { outcome: 'unavailable' }
    installPromptEvent.prompt()
    const result = await installPromptEvent.userChoice
    setInstallPromptEvent(null)
    return result
  }, [installPromptEvent])

  return {
    canInstall: Boolean(installPromptEvent) && !installed,
    installed,
    promptInstall,
  }
}
