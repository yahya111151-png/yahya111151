'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Coins, Zap, Lock, ChevronLeft, CheckCircle, Loader2 } from 'lucide-react'
import { avatarUrl } from '@/lib/utils'
import type { Profile } from '@/types'

interface TokenPackage {
  id: string
  tokens: number
  price: string
  popular?: boolean
  bonus?: string
}

const PACKAGES: TokenPackage[] = [
  { id: 'pack_5',  tokens: 5,  price: '$0.99' },
  { id: 'pack_20', tokens: 20, price: '$2.99', popular: true, bonus: '+5 bonus' },
  { id: 'pack_50', tokens: 50, price: '$5.99', bonus: '+15 bonus' },
]

interface TokenPaywallProps {
  profile: Profile
  tokens: number
  requiresToken: boolean
  onUseToken: () => void
  onBack: () => void
}

export default function TokenPaywall({ profile, tokens, requiresToken, onUseToken, onBack }: TokenPaywallProps) {
  const [buying, setBuying] = useState(false)
  const [purchased, setPurchased] = useState(false)
  const [selectedPack, setSelectedPack] = useState<string | null>(null)

  const hasTokens = tokens > 0

  async function handleBuy(pack: TokenPackage) {
    setSelectedPack(pack.id)
    setBuying(true)
    // Simulate purchase flow (Stripe integration would go here)
    await new Promise(r => setTimeout(r, 1800))
    setBuying(false)
    setPurchased(true)
  }

  if (purchased) {
    return (
      <div className="max-w-sm mx-auto px-4 py-20 text-center space-y-4 animate-fade-in">
        <CheckCircle size={56} className="text-score-high mx-auto" style={{ filter: 'drop-shadow(0 0 16px #34d399)' }} />
        <h2 className="font-black text-2xl text-foreground">Tokens added!</h2>
        <p className="text-muted text-sm">Your token balance has been updated. You can now rate again.</p>
        <button
          onClick={onUseToken}
          className="w-full py-3 bg-primary text-bg font-bold rounded-xl shadow-glow-sm mt-4"
        >
          Continue rating
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-6 space-y-5 animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-1 text-muted text-sm hover:text-foreground">
        <ChevronLeft size={16} /> Back to profile
      </button>

      {/* Locked state header */}
      <div className="bg-surface border border-border rounded-2xl p-6 text-center space-y-3">
        <div className="relative inline-block">
          <Image
            src={profile.avatar_url ?? avatarUrl(profile.username)}
            alt={profile.full_name}
            width={64}
            height={64}
            className="rounded-xl ring-2 ring-border opacity-40 mx-auto"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock size={28} className="text-primary drop-shadow-lg" />
          </div>
        </div>
        <div>
          <h2 className="font-black text-foreground text-xl">Daily limit reached</h2>
          <p className="text-muted text-sm mt-1">
            You've already rated <span className="text-foreground font-semibold">{profile.full_name.split(' ')[0]}</span> today.
            Rate again with a token.
          </p>
        </div>

        {/* Token balance */}
        <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900/40 border border-border">
          <Coins size={16} className="text-yellow-400" />
          <span className="text-yellow-400 font-bold">{tokens} token{tokens !== 1 ? 's' : ''} remaining</span>
        </div>

        {hasTokens && (
          <button
            onClick={onUseToken}
            className="w-full py-3 bg-primary text-bg font-bold rounded-xl shadow-glow-sm hover:bg-primary/90 transition-all"
          >
            <span className="flex items-center justify-center gap-2">
              <Coins size={16} /> Use 1 token to rate now
            </span>
          </button>
        )}
      </div>

      {/* Buy tokens section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-primary" />
          <h3 className="font-bold text-foreground text-sm">Get more tokens</h3>
        </div>

        <div className="space-y-2">
          {PACKAGES.map(pack => (
            <button
              key={pack.id}
              onClick={() => handleBuy(pack)}
              disabled={buying}
              className="w-full p-4 rounded-xl border text-left transition-all duration-150 relative overflow-hidden disabled:opacity-50"
              style={{
                background: pack.popular ? '#e8476a11' : '#0f0f1a',
                borderColor: pack.popular ? '#e8476a' : '#1e1e30',
                boxShadow: pack.popular ? '0 0 16px rgba(192,132,252,0.15)' : undefined,
              }}
            >
              {pack.popular && (
                <span className="absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full bg-primary text-bg">
                  Popular
                </span>
              )}
              <div className="flex items-center justify-between pr-16">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
                    <Coins size={18} className="text-yellow-400" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">
                      {pack.tokens} tokens
                      {pack.bonus && <span className="text-score-high text-xs ml-1.5">{pack.bonus}</span>}
                    </p>
                    <p className="text-muted text-xs">Rate up to {pack.tokens} more times today</p>
                  </div>
                </div>
                <div className="text-right">
                  {buying && selectedPack === pack.id ? (
                    <Loader2 size={18} className="text-primary animate-spin" />
                  ) : (
                    <span className="font-black text-primary text-lg">{pack.price}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        <p className="text-center text-muted text-xs pt-1">
          Tokens never expire · Secure payment via Stripe
        </p>
      </div>
    </div>
  )
}
