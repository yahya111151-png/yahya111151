'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

export default function InstallPrompt() {
  const [prompt,    setPrompt]    = useState<any>(null)
  const [show,      setShow]      = useState(false)
  const [isIOS,     setIsIOS]     = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Already installed as PWA — don't show
    if (window.matchMedia('(display-mode: standalone)').matches) return
    // Already permanently dismissed
    if (localStorage.getItem('pwa-dismissed')) return

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream
    if (ios) {
      setIsIOS(true)
      setShow(true) // show immediately on iOS
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e)
      setShow(true) // show immediately when browser fires event
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    setShow(false)
    setDismissed(true)
    localStorage.setItem('pwa-dismissed', '1')
  }

  async function install() {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') { setShow(false); setDismissed(true) }
  }

  if (!show || dismissed) return null

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 z-50 max-w-sm mx-auto animate-slide-up">
      <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-4 shadow-2xl shadow-primary/30 flex gap-4 items-center">
        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0 text-3xl">
          📲
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-black text-white text-base leading-tight">Install Lens</p>
          {isIOS ? (
            <p className="text-white/75 text-xs mt-1 leading-relaxed">
              Tap <strong className="text-white">Share ⬆️</strong> then <strong className="text-white">"Add to Home Screen"</strong>
            </p>
          ) : (
            <p className="text-white/75 text-xs mt-1">One tap to add Lens to your home screen.</p>
          )}

          {!isIOS && (
            <button
              onClick={install}
              className="mt-2 px-4 py-1.5 bg-white text-primary text-xs font-black rounded-xl shadow hover:opacity-90 transition-opacity"
            >
              Install now →
            </button>
          )}
        </div>

        <button
          onClick={dismiss}
          className="p-1.5 bg-white/15 hover:bg-white/25 rounded-xl text-white transition-colors shrink-0"
          title="Dismiss"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  )
}
