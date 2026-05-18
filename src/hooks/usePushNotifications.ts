'use client'

import { useState, useEffect } from 'react'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
      // Check if already subscribed
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(reg =>
          reg.pushManager.getSubscription().then(sub => {
            if (sub) setSubscribed(true)
          })
        ).catch(() => {})
      }
    }
  }, [])

  async function subscribe() {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('[Push] Service worker or PushManager not supported')
        return false
      }

      const result = await Notification.requestPermission()
      setPermission(result)
      if (result !== 'granted') return false

      const reg = await navigator.serviceWorker.ready

      // Unsubscribe from any old subscription first to force a fresh one
      const existing = await reg.pushManager.getSubscription()
      if (existing) await existing.unsubscribe()

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        console.error('[Push] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set')
        return false
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })

      if (!res.ok) {
        const err = await res.json()
        console.error('[Push] Subscribe API error:', err)
        return false
      }

      setSubscribed(true)
      return true
    } catch (err) {
      console.error('[Push] subscribe() error:', err)
      return false
    }
  }

  async function unsubscribe() {
    try {
      if (!('serviceWorker' in navigator)) return
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (!sub) return
      await fetch('/api/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      })
      await sub.unsubscribe()
      setSubscribed(false)
    } catch (err) {
      console.error('[Push] unsubscribe() error:', err)
    }
  }

  return { permission, subscribed, subscribe, unsubscribe }
}
