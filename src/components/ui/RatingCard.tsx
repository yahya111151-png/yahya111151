import { proximityLabel, proximityPercent } from '@/lib/algorithm/proximity'
import { scoreColor, timeAgo } from '@/lib/utils'
import type { Rating } from '@/types'

interface RatingCardProps {
  rating: Rating
  metricScores?: { name: string; icon: string; score: number }[]
  isOwn?: boolean
}

export default function RatingCard({ rating, metricScores, isOwn }: RatingCardProps) {
  const pct = proximityPercent(rating.closeness_score)
  const label = proximityLabel(rating.closeness_score)

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 space-y-3 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className={`font-bold text-lg tabular-nums ${scoreColor(rating.raw_avg_score)}`}>
              {rating.raw_avg_score > 0 ? '+' : ''}{rating.raw_avg_score.toFixed(1)}
            </span>
            <span className="text-muted text-sm">/ ±5</span>
          </div>
          <p className="text-muted text-xs mt-0.5">{timeAgo(rating.created_at)}</p>
        </div>

        {/* Proximity badge */}
        <div className="flex flex-col items-end gap-1">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{
              background: `hsl(${pct * 1.2}, 70%, 94%)`,
              color: `hsl(${pct * 1.2}, 60%, 40%)`,
              border: `1px solid hsl(${pct * 1.2}, 50%, 80%)`,
            }}
          >
            <span className="font-bold">{pct}%</span>
            <span>weight</span>
          </div>
          <span className="text-muted text-xs">{label}</span>
        </div>
      </div>

      {/* Metric breakdown */}
      {metricScores && metricScores.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {metricScores.map(m => (
            <div key={m.name} className="bg-bg rounded-xl p-2 text-center">
              <span className="text-base">{m.icon}</span>
              <p className="text-xs text-muted mt-0.5">{m.name}</p>
              <p className={`text-sm font-bold tabular-nums ${scoreColor(m.score)}`}>{m.score > 0 ? `+${m.score}` : m.score}</p>
            </div>
          ))}
        </div>
      )}

      {/* Comment */}
      {rating.comment && (
        <p className="text-sm text-foreground/80 italic border-l-2 border-primary/40 pl-3">
          "{rating.comment}"
        </p>
      )}

      {/* Weighted impact notice */}
      {isOwn && (
        <p className="text-xs text-muted/60">
          Weighted contribution: <span className="text-primary">{rating.weighted_score.toFixed(3)}</span> pts
        </p>
      )}
    </div>
  )
}
