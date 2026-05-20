'use client'

import { useState } from 'react'
import { getTier, getNextTier, progressToNextTier, TIERS } from '@/lib/tiers'
import { ChevronDown, ChevronUp, Info, Lock, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RewardsTierCardProps {
  score: number
  totalRatings: number
}

export default function RewardsTierCard({ score, totalRatings }: RewardsTierCardProps) {
  const [showAllTiers, setShowAllTiers] = useState(false)

  const tier     = getTier(score, totalRatings)
  const nextTier = getNextTier(tier)
  const progress = progressToNextTier(score, totalRatings)

  const scoreNeeded   = nextTier ? Math.max(0, nextTier.minScore - score).toFixed(1) : null
  const ratingsNeeded = nextTier ? Math.max(0, nextTier.minRatings - totalRatings) : null

  // Gradient per tier
  const gradients: Record<string, string> = {
    explorer: 'from-slate-100 to-slate-50',
    rising:   'from-amber-100 via-yellow-50 to-amber-50',
    trusted:  'from-blue-100 via-blue-50 to-sky-50',
    stellar:  'from-violet-100 via-purple-50 to-violet-50',
    legend:   'from-yellow-100 via-amber-50 to-yellow-50',
  }
  const headerGradients: Record<string, string> = {
    explorer: 'from-slate-400 to-slate-500',
    rising:   'from-amber-400 to-yellow-500',
    trusted:  'from-blue-500 to-sky-600',
    stellar:  'from-violet-500 to-purple-600',
    legend:   'from-yellow-500 to-amber-600',
  }

  return (
    <div className={cn('rounded-3xl border overflow-hidden', tier.border, `bg-gradient-to-br ${gradients[tier.key]}`)}>

      {/* ── Header: tier name + tagline ── */}
      <div className={cn('bg-gradient-to-r px-5 pt-5 pb-4', headerGradients[tier.key])}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl drop-shadow">{tier.icon}</span>
            <div>
              <p className="font-black text-xl text-white leading-tight tracking-tight">{tier.label}</p>
              <p className="text-white/70 text-xs font-medium mt-0.5">Your reward tier</p>
            </div>
          </div>
          <button
            onClick={() => setShowAllTiers(v => !v)}
            className="flex items-center gap-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl text-white text-xs font-semibold transition-colors"
          >
            All tiers {showAllTiers ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
        <p className="text-white/80 text-sm mt-2 italic">{tier.tagline}</p>
      </div>

      {/* ── Current perks — ALWAYS VISIBLE ── */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-1.5 mb-3">
          <Sparkles size={14} style={{ color: tier.color }} />
          <span className="text-xs font-black uppercase tracking-widest" style={{ color: tier.color }}>
            Your perks
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {tier.perks.map((perk, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-1.5 p-3 bg-white/70 border rounded-2xl text-center"
              style={{ borderColor: tier.color + '30' }}
            >
              <span className="text-2xl">{tier.perkIcons[i]}</span>
              <span className="text-[11px] font-semibold text-foreground leading-tight">{perk}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Progress to next tier ── */}
      {nextTier && (
        <div className="px-5 pb-4">
          <div className="bg-white/50 border border-black/8 rounded-2xl p-3.5">
            {/* Progress bar */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-foreground">
                Next: {nextTier.icon} {nextTier.label}
              </span>
              <span className="text-xs font-black tabular-nums" style={{ color: tier.color }}>
                {progress}%
              </span>
            </div>
            <div className="h-2.5 bg-black/8 rounded-full overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progress}%`, background: tier.color, boxShadow: `0 0 8px ${tier.color}66` }}
              />
            </div>
            <p className="text-[11px] text-muted mb-3">
              {scoreNeeded !== '0.0' && `+${scoreNeeded} more impression score`}
              {scoreNeeded !== '0.0' && ratingsNeeded! > 0 && ' · '}
              {ratingsNeeded! > 0 && `${ratingsNeeded} more reflection${ratingsNeeded === 1 ? '' : 's'} needed`}
            </p>

            {/* Locked next-tier perks as a teaser */}
            <div className="flex items-center gap-1 mb-2">
              <Lock size={11} className="text-muted" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Unlock with {nextTier.label}</span>
            </div>
            <div className="flex gap-2">
              {nextTier.perks.map((perk, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/5 border border-black/8 rounded-xl opacity-60"
                >
                  <span className="text-sm">{nextTier.perkIcons[i]}</span>
                  <span className="text-[10px] font-semibold text-muted truncate max-w-[70px]">{perk}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── All tiers ladder (collapsible) ── */}
      {showAllTiers && (
        <div className="border-t border-black/8 px-5 pt-4 pb-5 space-y-2">
          <p className="text-xs font-black uppercase tracking-wider text-muted mb-3">All tiers</p>
          {TIERS.filter(t => t.key !== 'explorer').map(t => {
            const unlocked  = t.minScore <= score && t.minRatings <= totalRatings
            const isCurrent = t.key === tier.key
            return (
              <div
                key={t.key}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-2xl border transition-all',
                  isCurrent
                    ? `border-2 bg-white/80`
                    : unlocked
                      ? 'border border-green-200 bg-green-50/50'
                      : 'border border-black/8 bg-white/30 opacity-50',
                )}
                style={isCurrent ? { borderColor: t.color } : {}}
              >
                <span className="text-2xl">{t.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm" style={{ color: isCurrent ? t.color : undefined }}>{t.label}</span>
                    {isCurrent && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white" style={{ background: t.color }}>
                        YOU
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted truncate">{t.perkIcons[0]} {t.perks[0]}</p>
                </div>
                <div className="text-right shrink-0">
                  {unlocked ? (
                    <span className="text-xs text-green-600 font-bold">✓ Unlocked</span>
                  ) : (
                    <div className="text-[10px] text-muted font-medium">
                      <div>+{t.minScore} score</div>
                      <div>{t.minRatings}+ reflections</div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Disclaimer ── */}
      <div className="flex items-start gap-2 px-5 pb-4">
        <Info size={11} className="text-muted/60 shrink-0 mt-0.5" />
        <p className="text-[10px] text-muted/60 leading-relaxed">
          Perks subject to availability & partner participation. Minimum reflection thresholds required. Terms apply.
        </p>
      </div>
    </div>
  )
}
