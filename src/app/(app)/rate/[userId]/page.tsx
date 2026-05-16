'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import MetricSlider from '@/components/ui/MetricSlider'
import TokenPaywall from '@/components/ui/TokenPaywall'
import { computeProximityWeight, applyWeight, proximityLabel, proximityPercent } from '@/lib/algorithm/proximity'
import { avatarUrl } from '@/lib/utils'
import type { Profile, RatingMetric, ConnectionType } from '@/types'
import { ChevronLeft, Loader2, CheckCircle, Coins } from 'lucide-react'

const CONNECTION_OPTIONS: { value: ConnectionType; label: string; description: string }[] = [
  { value: 'stranger',     label: 'Stranger',     description: 'Never really interacted' },
  { value: 'acquaintance', label: 'Acquaintance', description: 'Met a few times' },
  { value: 'colleague',    label: 'Colleague',    description: 'Work or study together' },
  { value: 'friend',       label: 'Friend',       description: 'Close personal relationship' },
  { value: 'family',       label: 'Family',       description: 'Family member' },
]

interface CanRateResult {
  can_rate: boolean
  requires_token: boolean
  tokens: number
}

export default function RatePage() {
  const { userId } = useParams<{ userId: string }>()
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [metrics, setMetrics] = useState<RatingMetric[]>([])
  const [scores, setScores] = useState<Record<string, number>>({})
  const [connectionType, setConnectionType] = useState<ConnectionType>('acquaintance')
  const [comment, setComment] = useState('')
  const [proximityWeight, setProximityWeight] = useState(0.5)
  const [existingConnection, setExistingConnection] = useState<any>(null)
  const [mutualCount, setMutualCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [canRateInfo, setCanRateInfo] = useState<CanRateResult | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setCurrentUserId(user.id)

      const [{ data: p }, { data: m }, { data: conn }, { data: mutuals }, { data: canRate }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('rating_metrics').select('*').eq('active', true).order('sort_order'),
        supabase.from('connections').select('*').eq('user_id', user.id).eq('connected_user_id', userId).single(),
        supabase.rpc('get_mutual_connection_count', { user_a: user.id, user_b: userId }),
        supabase.rpc('check_can_rate', { p_rated_id: userId }),
      ])

      if (!p) { router.push('/search'); return }
      if (p.id === user.id) { router.push('/dashboard'); return }

      setProfile(p as Profile)
      setMetrics((m as RatingMetric[]) ?? [])
      setMutualCount((mutuals as number) ?? 0)

      if (canRate) {
        setCanRateInfo(canRate as CanRateResult)
        if (!canRate.can_rate) {
          setShowPaywall(true)
        }
      }

      if (conn) {
        setExistingConnection(conn)
        setConnectionType(conn.connection_type as ConnectionType)
      }

      setScores({})

      setLoading(false)
    }
    load()
  }, [userId, router])

  useEffect(() => {
    if (!existingConnection && !loading) {
      const weight = computeProximityWeight({
        interactionCount: 0,
        connectionType,
        lastInteractionAt: new Date(),
        mutualConnectionCount: mutualCount,
      })
      setProximityWeight(weight)
      return
    }
    if (existingConnection) {
      const weight = computeProximityWeight({
        interactionCount: existingConnection.interaction_count,
        connectionType,
        lastInteractionAt: new Date(existingConnection.last_interaction_at),
        mutualConnectionCount: mutualCount,
      })
      setProximityWeight(weight)
    }
  }, [connectionType, existingConnection, mutualCount, loading])

  function setScore(metricId: string, value: number) {
    setScores(prev => ({ ...prev, [metricId]: value }))
  }

  function clearScore(metricId: string) {
    setScores(prev => {
      const next = { ...prev }
      delete next[metricId]
      return next
    })
  }

  function rawAvg(): number {
    const vals = Object.values(scores)
    if (vals.length === 0) return 0
    return vals.reduce((a, b) => a + b, 0) / vals.length
  }

  const ratedCount = Object.keys(scores).length

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile || !currentUserId) return
    setSubmitting(true)
    setError(null)

    const supabase = createClient()
    const avg = rawAvg()
    const weighted = applyWeight(avg, proximityWeight)

    const scoreRows = metrics
      .filter(m => scores[m.id] !== undefined)
      .map(m => ({
        metric_id: m.id,
        score: scores[m.id],
        weighted_score: applyWeight(scores[m.id], proximityWeight),
      }))

    const { error: rpcErr } = await supabase.rpc('submit_rating', {
      p_rater_id:         currentUserId,
      p_rated_id:         profile.id,
      p_proximity_weight: proximityWeight,
      p_closeness_score:  proximityWeight,
      p_raw_avg_score:    Math.round(avg * 100) / 100,
      p_weighted_score:   weighted,
      p_comment:          comment.trim() || null,
      p_connection_type:  connectionType,
      p_scores:           scoreRows,
    })

    if (rpcErr) {
      if (rpcErr.message?.includes('NO_TOKENS')) {
        setShowPaywall(true)
        setCanRateInfo(prev => prev ? { ...prev, can_rate: false } : null)
      } else {
        setError(rpcErr.message ?? 'Failed to submit rating.')
      }
      setSubmitting(false)
      return
    }

    setSuccess(true)
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={32} className="text-primary animate-spin" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="max-w-sm mx-auto px-4 py-16 text-center space-y-4 animate-fade-in">
        <CheckCircle size={56} className="text-score-high mx-auto" style={{ filter: 'drop-shadow(0 0 16px #34d399)' }} />
        <h2 className="font-black text-2xl text-white">Rating submitted!</h2>
        <p className="text-muted">
          Your rating carried <span className="text-primary font-bold">{proximityPercent(proximityWeight)}%</span> weight
          based on your closeness to {profile?.full_name.split(' ')[0]}.
        </p>
        <div className="flex flex-col gap-3 pt-4">
          <Link href={`/profile/${profile?.username}`} className="py-3 bg-primary text-bg font-bold rounded-xl shadow-glow-sm">
            View their profile
          </Link>
          <Link href="/search" className="py-3 bg-surface border border-border text-white font-semibold rounded-xl">
            Rate someone else
          </Link>
        </div>
      </div>
    )
  }

  if (!profile) return null

  if (showPaywall) {
    return (
      <TokenPaywall
        profile={profile}
        tokens={canRateInfo?.tokens ?? 0}
        requiresToken={canRateInfo?.requires_token ?? false}
        onUseToken={() => {
          setShowPaywall(false)
          setCanRateInfo(prev => prev ? { ...prev, can_rate: true } : null)
        }}
        onBack={() => router.push(`/profile/${profile.username}`)}
      />
    )
  }

  const pct = proximityPercent(proximityWeight)
  const label = proximityLabel(proximityWeight)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 animate-fade-in">
      <Link href={`/profile/${profile.username}`} className="flex items-center gap-1 text-muted text-sm hover:text-white">
        <ChevronLeft size={16} /> Back to profile
      </Link>

      {/* Target profile */}
      <div className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-4">
        <Image
          src={profile.avatar_url ?? avatarUrl(profile.username)}
          alt={profile.full_name}
          width={56}
          height={56}
          className="rounded-xl ring-2 ring-border"
        />
        <div className="flex-1">
          <h1 className="font-bold text-white">Rate {profile.full_name}</h1>
          <p className="text-muted text-sm">@{profile.username}</p>
        </div>
        {/* Token balance badge */}
        {canRateInfo && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/30 border border-border">
            <Coins size={14} className="text-yellow-400" />
            <span className="text-yellow-400 font-bold text-sm tabular-nums">{canRateInfo.tokens}</span>
          </div>
        )}
      </div>

      {/* Token warning banner */}
      {canRateInfo?.requires_token && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
          <Coins size={18} className="text-yellow-400 shrink-0" />
          <div>
            <p className="text-yellow-300 text-sm font-semibold">Daily free rating used</p>
            <p className="text-yellow-400/70 text-xs">Submitting will spend 1 token ({canRateInfo.tokens} remaining)</p>
          </div>
        </div>
      )}

      {/* Proximity preview */}
      <div
        className="rounded-2xl p-4 border"
        style={{
          background: `hsl(${pct * 1.2}, 60%, 10%)`,
          borderColor: `hsl(${pct * 1.2}, 50%, 25%)`,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="font-semibold text-white text-sm">Your rating influence</p>
          <span
            className="font-black text-xl tabular-nums"
            style={{ color: `hsl(${pct * 1.2}, 80%, 65%)` }}
          >
            {pct}%
          </span>
        </div>
        <div className="h-2 bg-black/30 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: `hsl(${pct * 1.2}, 70%, 55%)`,
              boxShadow: `0 0 10px hsl(${pct * 1.2}, 70%, 55%)`,
            }}
          />
        </div>
        <p className="text-xs mt-1.5" style={{ color: `hsl(${pct * 1.2}, 60%, 55%)` }}>
          {label} · {mutualCount > 0 ? `${mutualCount} mutual connection${mutualCount !== 1 ? 's' : ''}` : 'No mutual connections'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Connection type picker */}
        <div className="space-y-2">
          <h2 className="font-bold text-white text-sm">How do you know them?</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CONNECTION_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setConnectionType(opt.value)}
                className="p-3 rounded-xl border text-left transition-all duration-150"
                style={{
                  background: connectionType === opt.value ? '#c084fc22' : '#0f0f1a',
                  borderColor: connectionType === opt.value ? '#c084fc' : '#1e1e30',
                  boxShadow: connectionType === opt.value ? '0 0 12px rgba(192,132,252,0.2)' : undefined,
                }}
              >
                <p className="text-white text-sm font-semibold">{opt.label}</p>
                <p className="text-muted text-xs">{opt.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Metric sliders */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white text-sm">Score each dimension</h2>
            <span className="text-muted text-xs">{ratedCount}/{metrics.length} rated</span>
          </div>
          {metrics.map(m => (
            <MetricSlider
              key={m.id}
              metricId={m.id}
              name={m.name}
              icon={m.icon}
              description={m.description}
              value={scores[m.id] ?? null}
              onChange={setScore}
              onClear={clearScore}
            />
          ))}
        </div>

        {/* Overall preview */}
        {ratedCount > 0 && (
          <div className="bg-surface border border-border rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-muted text-sm">Raw average</p>
              <p className="font-black text-2xl text-white tabular-nums">
                {rawAvg() > 0 ? '+' : ''}{rawAvg().toFixed(1)}
                <span className="text-muted font-normal text-base"> / ±5</span>
              </p>
            </div>
            <div className="text-center">
              <p className="text-muted text-xs">×</p>
              <p className="text-primary font-bold">{pct}% weight</p>
            </div>
            <div className="text-right">
              <p className="text-muted text-sm">Weighted contribution</p>
              <p className="font-black text-2xl tabular-nums" style={{ color: '#c084fc' }}>
                {applyWeight(rawAvg(), proximityWeight) > 0 ? '+' : ''}
                {applyWeight(rawAvg(), proximityWeight).toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Comment */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-white/80">Leave a comment (optional)</label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="What do you think of this person? (shown anonymously)"
            rows={3}
            maxLength={280}
            className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-white placeholder:text-muted focus:outline-none focus:border-primary/60 transition-colors resize-none text-sm"
          />
          <p className="text-muted text-xs text-right">{comment.length}/280</p>
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || ratedCount === 0}
          className="w-full py-4 bg-primary text-bg font-bold rounded-2xl text-lg hover:bg-primary/90 disabled:opacity-50 transition-all shadow-glow-sm hover:shadow-glow-md"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={20} className="animate-spin" /> Submitting…
            </span>
          ) : canRateInfo?.requires_token ? (
            <span className="flex items-center justify-center gap-2">
              <Coins size={18} /> Use 1 token · {pct}% influence
            </span>
          ) : `Submit rating · ${pct}% influence`}
        </button>
      </form>
    </div>
  )
}
