'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import MetricSlider from '@/components/ui/MetricSlider'
import TokenPaywall from '@/components/ui/TokenPaywall'
import Avatar from '@/components/ui/Avatar'
import { computeProximityWeight, applyWeight, proximityLabel, proximityPercent } from '@/lib/algorithm/proximity'
import type { Profile, RatingMetric, ConnectionType } from '@/types'
import { ChevronLeft, Loader2, CheckCircle, Coins, Share2 } from 'lucide-react'

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
  const [shareCopied, setShareCopied] = useState(false)

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
        setError(rpcErr.message ?? 'Failed to share your thoughts.')
      }
      setSubmitting(false)
      return
    }

    // Send anonymous push notification to rated user
    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rated_id: profile.id }),
    }).catch(() => {}) // fire and forget

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

  async function handleShareRating() {
    if (!profile) return
    const avg = rawAvg()
    const sign = avg >= 0 ? '+' : ''
    const text = `I just shared my thoughts on ${profile.full_name} on Lens: ${sign}${avg.toFixed(1)} / ±5`
    const url  = `${window.location.origin}/profile/${profile.username}`
    if (navigator.share) {
      try { await navigator.share({ title: 'My Lens reflection', text, url }) } catch {}
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    }
  }

  if (success) {
    const avg  = rawAvg()
    const sign = avg >= 0 ? '+' : ''
    const pct  = proximityPercent(proximityWeight)
    return (
      <div className="max-w-sm mx-auto px-4 py-12 space-y-5 animate-fade-in">
        <div className="text-center space-y-2">
          <CheckCircle size={56} className="text-score-high mx-auto" style={{ filter: 'drop-shadow(0 0 16px #34d399)' }} />
          <h2 className="font-black text-2xl text-foreground">Reflection shared!</h2>
          <p className="text-muted text-sm">
            Your thoughts carried <span className="text-primary font-bold">{pct}%</span> weight
            based on your closeness to {profile?.full_name.split(' ')[0]}.
          </p>
        </div>

        {/* Share card */}
        <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
          <p className="text-xs text-muted uppercase tracking-widest font-semibold">Your reflection summary</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-lg font-black text-primary shrink-0">
              {profile?.full_name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground truncate">{profile?.full_name}</p>
              <p className="text-muted text-sm">@{profile?.username}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-black text-2xl tabular-nums" style={{ color: avg >= 2 ? '#16a34a' : avg >= 0 ? '#d97706' : '#dc2626' }}>
                {sign}{avg.toFixed(1)}
              </p>
              <p className="text-muted text-xs">/ ±5</p>
            </div>
          </div>
          {/* Metric scores row */}
          <div className="grid grid-cols-4 gap-1">
            {metrics.filter(m => scores[m.id] !== undefined).map(m => (
              <div key={m.id} className="text-center p-1.5 bg-bg rounded-xl">
                <p className="text-base">{m.icon}</p>
                <p className="text-xs font-bold text-foreground tabular-nums">
                  {scores[m.id] >= 0 ? '+' : ''}{scores[m.id]}
                </p>
              </div>
            ))}
          </div>
          <button
            onClick={handleShareRating}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary/10 border border-primary/20 text-primary font-semibold rounded-xl text-sm hover:bg-primary/15 transition-colors"
          >
            <Share2 size={15} />
            {shareCopied ? 'Link copied!' : 'Share my reflection'}
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <Link href={`/profile/${profile?.username}`} className="py-3 bg-primary text-[#1a0f40] font-bold rounded-xl shadow-glow-sm text-center">
            View their profile
          </Link>
          <Link href="/search" className="py-3 bg-surface border border-border text-foreground font-semibold rounded-xl text-center">
            Reflect on someone else
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
      <Link href={`/profile/${profile.username}`} className="flex items-center gap-1 text-muted text-sm hover:text-foreground">
        <ChevronLeft size={16} /> Back to profile
      </Link>

      {/* Target profile */}
      <div className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-4">
        <Avatar
          src={profile.avatar_url}
          username={profile.username}
          size={56}
          className="rounded-xl ring-2 ring-border"
        />
        <div className="flex-1">
          <h1 className="font-bold text-foreground">Reflect on {profile.full_name}</h1>
          <p className="text-muted text-sm">@{profile.username}</p>
        </div>
        {/* Token balance badge */}
        {canRateInfo && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/20">
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
            <p className="text-yellow-300 text-sm font-semibold">Daily free reflection used</p>
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
          <p className="font-semibold text-foreground text-sm">Your connection weight</p>
          <span
            className="font-black text-xl tabular-nums"
            style={{ color: `hsl(${pct * 1.2}, 80%, 65%)` }}
          >
            {pct}%
          </span>
        </div>
        <div className="h-2 bg-gray-900/30 rounded-full overflow-hidden">
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
          <h2 className="font-bold text-foreground text-sm">How do you know them?</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CONNECTION_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setConnectionType(opt.value)}
                className="p-3 rounded-xl border text-left transition-all duration-150"
                style={{
                  background: connectionType === opt.value ? '#FFD70015' : '#1a1035',
                  borderColor: connectionType === opt.value ? '#FFD700' : '#2d2052',
                  boxShadow: connectionType === opt.value ? '0 0 12px rgba(232,71,106,0.15)' : undefined,
                }}
              >
                <p className="text-foreground text-sm font-semibold">{opt.label}</p>
                <p className="text-muted text-xs">{opt.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Metric sliders */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-foreground text-sm">Weigh in on each dimension</h2>
            <span className={`text-xs font-bold tabular-nums ${ratedCount === metrics.length ? 'text-score-high' : 'text-muted'}`}>
              {ratedCount}/{metrics.length} ✓
            </span>
          </div>
          {/* Progress bar */}
          {metrics.length > 0 && (
            <div className="h-1 bg-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${(ratedCount / metrics.length) * 100}%` }}
              />
            </div>
          )}
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
              <p className="font-black text-2xl text-foreground tabular-nums">
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
              <p className="font-black text-2xl tabular-nums" style={{ color: '#FFD700' }}>
                {applyWeight(rawAvg(), proximityWeight) > 0 ? '+' : ''}
                {applyWeight(rawAvg(), proximityWeight).toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Comment */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground/80">Leave a comment (optional)</label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="What do you think of this person? (shown anonymously)"
            rows={3}
            maxLength={280}
            className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary/60 transition-colors resize-none text-sm"
          />
          <p className="text-muted text-xs text-right">{comment.length}/280</p>
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Progress hint */}
        {ratedCount === 0 && (
          <p className="text-center text-muted text-sm">Rate at least one metric above to submit</p>
        )}

        {/* Sticky submit at bottom on mobile */}
        <div className="sticky bottom-20 md:bottom-4 z-10">
          <button
            type="submit"
            disabled={submitting || ratedCount === 0}
            className="w-full py-4 bg-primary text-[#1a0f40] font-black rounded-2xl text-lg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-glow-md hover:shadow-glow-md"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={20} className="animate-spin" /> Submitting…
              </span>
            ) : ratedCount === 0 ? (
              'Rate metrics above to submit'
            ) : canRateInfo?.requires_token ? (
              <span className="flex items-center justify-center gap-2">
                <Coins size={18} /> Use 1 token · {pct}% influence
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                ⭐ Submit reflection · {pct}% weight
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
