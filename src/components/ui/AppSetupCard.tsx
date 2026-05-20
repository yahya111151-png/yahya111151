'use client'

import { useEffect, useState } from 'react'
import { Bell, Download, CheckCircle2, ChevronRight, Smartphone } from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export default function AppSetupCard() {
  const { permission, subscribed, subscribe } = usePushNotifications()

  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [isInstalled,   setIsInstalled]   = useState(false)
  const [isIOS,         setIsIOS]         = useState(false)
  const [iosModalOpen,  setIosModalOpen]  = useState(false)
  const [notifLoading,  setNotifLoading]  = useState(false)
  const [notifDone,     setNotifDone]     = useState(false)
  const [hydrated,      setHydrated]      = useState(false)

  useEffect(() => {
    setHydrated(true)

    // Check if already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    // iOS detection
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(ios)

    // Capture Android/Chrome install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Notification is done if already granted/subscribed
  const notifEnabled = notifDone || subscribed || permission === 'granted'

  // Hide card entirely when both tasks are complete
  if (!hydrated) return null
  if (isInstalled && notifEnabled) return null

  async function handleInstall() {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setIsInstalled(true)
  }

  async function handleNotif() {
    setNotifLoading(true)
    const ok = await subscribe()
    setNotifLoading(false)
    if (ok) setNotifDone(true)
  }

  const steps = [
    {
      id: 'install',
      done: isInstalled,
      icon: '📲',
      title: 'Install Lens',
      subtitle: isIOS
        ? 'Tap Share → "Add to Home Screen"'
        : installPrompt
          ? 'Add to your home screen in one tap'
          : 'Open in Chrome or Safari to install',
      action: isIOS
        ? () => setIosModalOpen(true)
        : installPrompt
          ? handleInstall
          : null,
      label: isIOS ? 'How to install' : 'Install app',
      available: isIOS || !!installPrompt,
    },
    {
      id: 'notif',
      done: notifEnabled,
      icon: '🔔',
      title: 'Enable notifications',
      subtitle: permission === 'denied'
        ? 'Blocked in browser — enable in site settings'
        : 'Know instantly when someone rates you',
      action: permission === 'denied' ? null : handleNotif,
      label: notifLoading ? 'Enabling…' : 'Enable',
      available: permission !== 'denied',
    },
  ]

  const doneCount = steps.filter(s => s.done).length

  return (
    <>
      <div className="rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/6 via-primary/3 to-transparent overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-center gap-3 border-b border-primary/10">
          <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
            <Smartphone size={18} className="text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-black text-sm text-foreground">Set up Lens</p>
            <p className="text-xs text-muted">{doneCount} of {steps.length} done</p>
          </div>
          {/* Progress dots */}
          <div className="flex gap-1.5">
            {steps.map(s => (
              <div
                key={s.id}
                className={`w-2 h-2 rounded-full transition-all ${s.done ? 'bg-primary scale-110' : 'bg-primary/20'}`}
              />
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="divide-y divide-primary/8">
          {steps.map(step => (
            <div key={step.id} className="flex items-center gap-4 px-5 py-4">
              {/* Check / icon */}
              <div className="shrink-0">
                {step.done ? (
                  <CheckCircle2 size={28} className="text-primary" strokeWidth={2.5} />
                ) : (
                  <span className="text-2xl">{step.icon}</span>
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm ${step.done ? 'text-muted line-through' : 'text-foreground'}`}>
                  {step.title}
                </p>
                <p className="text-xs text-muted mt-0.5 leading-snug">{step.subtitle}</p>
              </div>

              {/* CTA */}
              {!step.done && step.available && step.action && (
                <button
                  onClick={step.action}
                  className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-black rounded-xl shadow-glow-sm hover:shadow-glow-md transition-all active:scale-95"
                >
                  {step.label}
                  <ChevronRight size={13} />
                </button>
              )}
              {!step.done && !step.available && (
                <span className="shrink-0 text-xs text-muted px-3 py-2 bg-border/50 rounded-xl">Unavailable</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* iOS install instructions modal */}
      {iosModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setIosModalOpen(false)}>
          <div className="w-full max-w-sm bg-bg rounded-3xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <p className="font-black text-xl text-foreground mb-4">Install Lens on iOS</p>
            <ol className="space-y-4">
              {[
                { step: '1', icon: '⬆️', text: 'Tap the Share button at the bottom of Safari' },
                { step: '2', icon: '📋', text: 'Scroll down and tap "Add to Home Screen"' },
                { step: '3', icon: '✅', text: 'Tap "Add" in the top right corner' },
              ].map(s => (
                <li key={s.step} className="flex items-start gap-3">
                  <span className="text-2xl">{s.icon}</span>
                  <p className="text-sm text-foreground/80 leading-relaxed">{s.text}</p>
                </li>
              ))}
            </ol>
            <button
              onClick={() => setIosModalOpen(false)}
              className="mt-6 w-full py-3 bg-primary text-white font-black rounded-2xl shadow-glow-sm"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  )
}
