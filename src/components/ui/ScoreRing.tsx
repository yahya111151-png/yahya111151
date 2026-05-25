'use client'

import { scoreRingColor } from '@/lib/utils'

interface ScoreRingProps {
  score: number
  size?: number
  strokeWidth?: number
  label?: string
  showLabel?: boolean
  animated?: boolean
}

export default function ScoreRing({
  score,
  size = 120,
  strokeWidth = 10,
  label,
  showLabel = true,
  animated = true,
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  // score is -5 to +5, map to 0–1 for the ring fill
  const pct = Math.min(1, Math.max(0, (score + 5) / 10))
  const offset = circumference * (1 - pct)
  const color = scoreRingColor(score)
  const center = size / 2

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#2d2052"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            filter: `drop-shadow(0 0 6px ${color})`,
            transition: animated ? 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' : undefined,
          }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-bold tabular-nums" style={{ fontSize: size * 0.22, color }}>
            {score.toFixed(2)}
          </span>
          {label && (
            <span className="text-muted text-center leading-tight" style={{ fontSize: size * 0.1 }}>
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
