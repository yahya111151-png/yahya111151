'use client'

import { useState } from 'react'
import { getTier, getNextTier, progressToNextTier, TIERS } from '@/lib/tiers'
import { ChevronDown, ChevronUp, Gift, Info, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RewardsTierCardProps {
  score: number
  totalRatings: number
}

export default function RewardsTierCard({ score, totalRatings }: RewardsTierCardProps) {
  const [expanded, setExpanded] = useState(false)
  const tier     = getTier(score, totalRatings)
  const nextTier = getNextTier(tier)
  const progress = progressToNextTier(score, totalRatings)

  const scoreNeeded   = nextTier ? Math.max(0, nextTier.minScore - score).toFixed(1) : null
  const ratingsNeeded = nextTier ? Math.max(0, nextTier.minRatings - totalRatings) : null

  return (
    <div className={cn('rounded-3xl border overflow-hidden', tier.border, tier.bg)}>
      {/* Header row */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left"
      >
        <div className={cn(
          'w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 border',
          tier.border, 'bg-white/60'
        )}>
          {tier.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('font-black text-base', tier.text)}>{tier.label}</span>
            <span className="text-xs text-muted font-medium">— your current tier</span>
          </div>
          <p className="text-xs text-muted mt-0.5 truncate">{tier.tagline}</p>
        </div>

        <div className="shrink-0">
          {expanded
            ? <ChevronUp size={18} className="text-muted" />
            : <ChevronDown size={18} className="text-muted" />
          }
        </div>
      </button>

      {/* Progress to next tier */}
      {nextTier && (
        <div className="px-5 pb-3 -mt-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted">Progress to {nextTier.icon} {nextTier.label}</span>
            <span className={cn('text-xs font-bold', tier.text)}>{progress}%</span>
          </div>
          <div className="h-2 bg-black/8 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progress}%`, background: tier.color }}
            />
          </div>
          <p className="text-[10px] text-muted mt-1.5">
            {scoreNeeded !== '0.0' && `+${scoreNeeded} impression score`}
            {scoreNeeded !== '0.0' && ratingsNeeded! > 0 && ' · '}
            {ratingsNeeded! > 0 && `${ratingsNeeded} more reflection${ratingsNeeded === 1 ? '' : 's'}`}
          </p>
        </div>
      )}

      {/* Expanded: current perks + all tiers */}
      {expanded && (
        <div className="border-t border-black/8 px-5 pt-4 pb-5 space-y-5">

          {/* Current perks */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Gift size={13} className={tier.text} />
              <span className={cn('text-xs font-bold uppercase tracking-wider', tier.text)}>
                Your perks
              </span>
            </div>
            <div className="space-y-2">
              {tier.perks.map((perk, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="text-base w-6 shrink-0">{tier.perkIcons[i]}</span>
                  <span className="text-sm text-foreground/80 leading-snug">{perk}</span>
                </div>
              ))}
            </div>
          </div>

          {/* All tiers overview */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted mb-3">All tiers</p>
            <div className="space-y-2">
              {TIERS.filter(t => t.key !== 'explorer').map(t => {
                const unlocked = t.minScore <= score && t.minRatings <= totalRatings
                const isCurrent = t.key === tier.key
                return (
                  <div
                    key={t.key}
                    className={cn(
                      'flex items-center gap-3 p-2.5 rounded-xl border text-sm transition-all',
                      isCurrent ? cn(t.border, t.bg) : 'border-border bg-white/50',
                      unlocked && !isCurrent ? 'opacity-90' : '',
                      !unlocked && !isCurrent ? 'opacity-40' : '',
                    )}
                  >
                    <span className="text-xl">{t.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className={cn('font-bold', isCurrent ? t.text : 'text-foreground')}>{t.label}</span>
                      <p className="text-xs text-muted truncate">{t.perks[0]}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {unlocked ? (
                        <span className="text-xs text-green-600 font-semibold">✓ Unlocked</span>
                      ) : (
                        <div className="flex items-center gap-1 text-muted">
                          <Lock size={11} />
                          <span className="text-xs">+{t.minScore} · {t.minRatings}+</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 p-3 bg-black/5 rounded-xl border border-black/8">
            <Info size={12} className="text-muted shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted leading-relaxed">
              Lens partners with local businesses to offer perks to highly-regarded community members.
              Rewards and offers are subject to availability and partner participation in your area.
              Impressions must be genuine and meet minimum reflection thresholds to qualify.
              Lens reserves the right to modify or revoke tier perks at any time. By using Lens, you agree
              that impressions reflect personal opinions and are not verified by Lens.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
