'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export default function NotificationPrompt() {
  const { permission, subscribed, subscribe } = usePushNotifications()
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    const wasDismissed = localStorage.getItem('notif-dismissed')
    // Show immediately if never dismissed and permission not yet decided
    if (!wasDismissed && permission === 'default') {
      setDismissed(false)
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
      <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-3xl p-4 shadow-2xl shadow-purple-500/30 flex gap-4 items-center">
        <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-3xl shrink-0">
          🔔
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-white text-base leading-tight">Don't miss a thing</p>
          <p className="text-white/75 text-xs mt-1 leading-snug">Get notified the moment someone reflects on you.</p>
          <div className="flex gap-2 mt-2.5">
            <button
              onClick={handleEnable}
              className="px-4 py-1.5 bg-white text-purple-700 text-xs font-black rounded-xl hover:opacity-90 transition-opacity"
            >
              Enable →
            </button>
            <button
              onClick={dismiss}
              className="px-3 py-1.5 bg-white/15 text-white text-xs font-semibold rounded-xl hover:bg-white/25 transition-colors"
            >
              Later
            </button>
          </div>
        </div>
        <button onClick={dismiss} className="p-1.5 bg-white/15 hover:bg-white/25 rounded-xl text-white shrink-0">
          <X size={15} />
        </button>
      </div>
    </div>
  )
}
