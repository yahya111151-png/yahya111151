'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

export default function InstallPrompt() {
  const [prompt, setPrompt]     = useState<any>(null)
  const [show, setShow]         = useState(false)
  const [isIOS, setIsIOS]       = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Don't show if already installed (running as standalone PWA)
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if (localStorage.getItem('pwa-dismissed')) return

    // iOS detection — Safari shows "Add to Home Screen" manually
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream
    if (ios) {
      setIsIOS(true)
      setTimeout(() => setShow(true), 3000)
      return
    }

    // Android / Chrome — intercept the native install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e)
      setTimeout(() => setShow(true), 3000)
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
    if (outcome === 'accepted') setShow(false)
  }

  if (!show || dismissed) return null

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 z-50 max-w-sm mx-auto animate-slide-up">
      <div className="bg-surface border border-primary/30 rounded-2xl p-4 shadow-glow-sm flex gap-3 items-start">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <Download size={22} className="text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm">Install Nosedive</p>
          {isIOS ? (
            <p className="text-muted text-xs mt-0.5 leading-relaxed">
              Tap <span className="text-white">Share</span> then{' '}
              <span className="text-white">"Add to Home Screen"</span> to install.
            </p>
          ) : (
            <p className="text-muted text-xs mt-0.5">Add to your home screen for the best experience.</p>
          )}

          {!isIOS && (
            <button
              onClick={install}
              className="mt-2 px-4 py-1.5 bg-primary text-bg text-xs font-bold rounded-xl shadow-glow-sm"
            >
              Install app
            </button>
          )}
        </div>

        <button onClick={dismiss} className="p-1 text-muted hover:text-white transition-colors shrink-0">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
