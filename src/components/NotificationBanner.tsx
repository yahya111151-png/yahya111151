'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, X } from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export default function NotificationBanner() {
  const { permission, subscribed, subscribe } = usePushNotifications()
  const [hidden, setHidden] = useState(false)
  const [loading, setLoading] = useState(false)

  // Don't show if already enabled, denied, or dismissed this session
  if (hidden || subscribed || permission === 'granted' || permission === 'denied') return null

  async function handleEnable() {
    setLoading(true)
    const ok = await subscribe()
    setLoading(false)
    if (ok) setHidden(true)
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-primary/8 border border-primary/20 rounded-2xl">
      <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
        <Bell size={16} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">Enable notifications</p>
        <p className="text-xs text-muted">Know instantly when someone rates you</p>
      </div>
      <button
        onClick={handleEnable}
        disabled={loading}
        className="shrink-0 px-3 py-1.5 bg-primary text-[#1a0f40] text-xs font-bold rounded-lg hover:bg-primary/90 disabled:opacity-60 transition-colors"
      >
        {loading ? '…' : 'Enable'}
      </button>
      <button
        onClick={() => setHidden(true)}
        className="shrink-0 text-muted hover:text-foreground transition-colors"
        title="Dismiss"
      >
        <X size={15} />
      </button>
    </div>
  )
}
