'use client'

import { getTier } from '@/lib/tiers'
import { cn } from '@/lib/utils'

interface TierBadgeProps {
  score: number
  totalRatings: number
  size?: 'xs' | 'sm' | 'md'
  showLabel?: boolean
}

export default function TierBadge({ score, totalRatings, size = 'sm', showLabel = true }: TierBadgeProps) {
  const tier = getTier(score, totalRatings)
  if (tier.key === 'explorer') return null // don't show badge for default tier

  const sizes = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1',
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-bold rounded-full border shrink-0',
        tier.bg, tier.border, tier.text,
        sizes[size]
      )}
    >
      <span>{tier.icon}</span>
      {showLabel && <span>{tier.label}</span>}
    </span>
  )
}
