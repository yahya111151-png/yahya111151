'use client'

import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export default function NotificationPrompt() {
  const { permission, subscribed, subscribe } = usePushNotifications()
  const [dismissed, setDismissed] = useState(true) // start hidden

  useEffect(() => {
    const wasDismissed = localStorage.getItem('notif-dismissed')
    if (!wasDismissed && permission === 'default') {
      // Show after a short delay
      const t = setTimeout(() => setDismissed(false), 3000)
      return () => clearTimeout(t)
    }
  }, [permission])

  function dismiss() {
    setDismissed(true)
    localStorage.setItem('notif-dismissed', '1')
  }

  async function handleEnable() {
    const ok = await subscribe()
    if (ok) dismiss()
  }

  if (dismissed || permission === 'denied' || subscribed || permission === 'granted') return null

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 z-50 animate-slide-up">
      <div className="bg-surface border border-primary/30 rounded-2xl p-4 shadow-glow-sm flex gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Bell size={18} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm">Enable notifications</p>
          <p className="text-muted text-xs mt-0.5">Get notified when someone rates you</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleEnable}
              className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors"
            >
              Enable
            </button>
            <button
              onClick={dismiss}
              className="px-3 py-1.5 bg-surface border border-border text-muted text-xs rounded-lg hover:text-foreground transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
        <button onClick={dismiss} className="text-muted hover:text-foreground shrink-0">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
