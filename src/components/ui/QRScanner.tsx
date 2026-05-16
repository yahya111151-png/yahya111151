'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, X, Loader2 } from 'lucide-react'

export default function QRScanner() {
  const router = useRouter()
  const scannerRef = useRef<any>(null)
  const [status, setStatus] = useState<'idle' | 'starting' | 'scanning' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const containerId = 'qr-scanner-container'

  async function startScanner() {
    setStatus('starting')
    setError(null)
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode(containerId)
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText: string) => {
          // Extract username from a nosedive profile URL
          try {
            const url = new URL(decodedText)
            const match = url.pathname.match(/\/profile\/([^/]+)/)
            if (match) {
              stopScanner()
              router.push(`/profile/${match[1]}`)
            } else {
              setError('QR code is not a Nosedive profile.')
            }
          } catch {
            setError('Could not read this QR code.')
          }
        },
        () => {},
      )
      setStatus('scanning')
    } catch (err: any) {
      setError(err?.message ?? 'Camera access denied. Please allow camera permission.')
      setStatus('error')
    }
  }

  async function stopScanner() {
    if (scannerRef.current) {
      try { await scannerRef.current.stop() } catch {}
      scannerRef.current = null
    }
    setStatus('idle')
  }

  useEffect(() => {
    return () => { stopScanner() }
  }, [])

  return (
    <div className="space-y-4">
      {status === 'idle' && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Camera size={36} className="text-primary" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-white">Scan a Profile QR Code</p>
            <p className="text-muted text-sm mt-1">Point your camera at someone's Nosedive QR code to visit their profile</p>
          </div>
          <button
            onClick={startScanner}
            className="px-8 py-3 bg-primary text-bg font-bold rounded-2xl shadow-glow-sm hover:shadow-glow-md transition-all"
          >
            Open Camera
          </button>
        </div>
      )}

      {status === 'starting' && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="text-primary animate-spin" />
        </div>
      )}

      {status === 'scanning' && (
        <div className="space-y-3">
          <div className="relative rounded-2xl overflow-hidden bg-black border border-border">
            <div id={containerId} className="w-full" style={{ minHeight: 280 }} />
            {/* Corner guides */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-56 h-56 relative">
                {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(corner => (
                  <div
                    key={corner}
                    className="absolute w-8 h-8 border-primary"
                    style={{
                      borderTopWidth:    corner.includes('top')    ? 3 : 0,
                      borderLeftWidth:   corner.includes('left')   ? 3 : 0,
                      borderBottomWidth: corner.includes('bottom') ? 3 : 0,
                      borderRightWidth:  corner.includes('right')  ? 3 : 0,
                      top:    corner.includes('top')    ? 0 : 'auto',
                      bottom: corner.includes('bottom') ? 0 : 'auto',
                      left:   corner.includes('left')   ? 0 : 'auto',
                      right:  corner.includes('right')  ? 0 : 'auto',
                      borderRadius: corner.includes('top-left')     ? '8px 0 0 0'
                                  : corner.includes('top-right')    ? '0 8px 0 0'
                                  : corner.includes('bottom-left')  ? '0 0 0 8px'
                                  : '0 0 8px 0',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          <p className="text-center text-muted text-sm animate-pulse">Scanning…</p>
          <button
            onClick={stopScanner}
            className="w-full py-2.5 flex items-center justify-center gap-2 bg-surface border border-border rounded-xl text-white text-sm"
          >
            <X size={16} /> Cancel
          </button>
        </div>
      )}

      {error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
          {error}
          <button onClick={() => setError(null)} className="block mx-auto mt-2 text-red-400/70 underline text-xs">
            Try again
          </button>
        </div>
      )}
    </div>
  )
}
