'use client'

import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { X, Copy, Check, Share2 } from 'lucide-react'

interface QRCodeModalProps {
  username: string
  fullName: string
  onClose: () => void
}

export default function QRCodeModal({ username, fullName, onClose }: QRCodeModalProps) {
  const [url, setUrl] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setUrl(`${window.location.origin}/profile/${username}`)
  }, [username])

  async function copyLink() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function share() {
    if (navigator.share) {
      await navigator.share({ title: `${fullName} on Nosedive`, url })
    } else {
      copyLink()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs bg-surface border border-border rounded-3xl p-6 space-y-5 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white">Scan to visit profile</h3>
            <p className="text-muted text-sm">@{username}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-border transition-colors">
            <X size={18} className="text-muted" />
          </button>
        </div>

        {/* QR Code */}
        <div className="flex justify-center">
          <div className="p-4 bg-white rounded-2xl">
            {url && (
              <QRCodeSVG
                value={url}
                size={180}
                bgColor="#ffffff"
                fgColor="#07070f"
                level="M"
              />
            )}
          </div>
        </div>

        {/* URL */}
        <div className="bg-bg border border-border rounded-xl px-3 py-2">
          <p className="text-muted text-xs truncate">{url}</p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={copyLink}
            className="flex items-center justify-center gap-2 py-3 bg-surface border border-border rounded-xl text-white font-medium text-sm hover:border-primary/40 transition-colors"
          >
            {copied ? <Check size={16} className="text-score-high" /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy link'}
          </button>
          <button
            onClick={share}
            className="flex items-center justify-center gap-2 py-3 bg-primary text-bg font-bold rounded-xl text-sm shadow-glow-sm"
          >
            <Share2 size={16} />
            Share
          </button>
        </div>
      </div>
    </div>
  )
}
