'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import ScoreRing from '@/components/ui/ScoreRing'
import RatingCard from '@/components/ui/RatingCard'
import QRCodeModal from '@/components/ui/QRCodeModal'
import RatingHistoryChart from '@/components/ui/RatingHistoryChart'
import { avatarUrl, coverGradient, scoreColor, memberSince } from '@/lib/utils'
import type { ProfileWithMetrics, Rating } from '@/types'
import { MapPin, Briefcase, Star, QrCode, Pencil, Loader2, Share2, MessageCircle } from 'lucide-react'
import TierBadge from '@/components/ui/TierBadge'
import RewardsTierCard from '@/components/ui/RewardsTierCard'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
} from 'recharts'

type Tab = 'overview' | 'ratings' | 'connections'

interface PageProps {
  params: { username: string }
}

export default function ProfilePage({ params }: PageProps) {
  const { username } = params
  const router = useRouter()

  const [profile, setProfile]         = useState<ProfileWithMetrics | null>(null)
  const [ratings, setRatings]         = useState<any[]>([])
  const [connections, setConnections] = useState<any[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading]         = useState(true)
  const [tab, setTab]                 = useState<Tab>('overview')
  const [showQR, setShowQR]           = useState(false)
  const [shared, setShared]           = useState(false)
  const [rateRequested, setRateRequested] = useState(false)
  const [rateRequestLoading, setRateRequestLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id ?? null)

      // Resolve "me" alias
      let resolvedUsername = username
      if (username === 'me') {
        if (!user) { router.push('/auth/login'); return }
        const { data: own } = await supabase.from('profiles').select('username').eq('id', user.id).single()
        if (own) resolvedUsername = own.username
        else { router.push('/auth/login'); return }
      }

      const [{ data: p }, { data: r }, { data: conn }] = await Promise.all([
        supabase.from('profile_with_metrics').select('*').eq('username', resolvedUsername).single(),
        supabase.from('ratings')
          .select('*, rating_scores(score, metric_id, rating_metrics(name, icon))')
          .eq('rated_id', (await supabase.from('profiles').select('id').eq('username', resolvedUsername).single()).data?.id ?? '')
          .eq('is_visible', true)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase.from('connections')
          .select('*, profiles!connections_connected_user_id_fkey(id, username, full_name, avatar_url, aggregate_score)')
          .eq('user_id', (await supabase.from('profiles').select('id').eq('username', resolvedUsername).single()).data?.id ?? '')
          .order('last_interaction_at', { ascending: false })
          .limit(30),
      ])

      if (!p) { router.push('/search'); return }
      setProfile(p as ProfileWithMetrics)
      setRatings(r ?? [])
      setConnections(conn ?? [])
      setLoading(false)
    }
    load()
  }, [username, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={32} className="text-primary animate-spin" />
      </div>
    )
  }
  if (!profile) return null

  const isOwn   = currentUserId === profile.id
  const avatar  = profile.avatar_url ?? avatarUrl(profile.username)

  async function handleShare() {
    const url  = `${window.location.origin}/profile/${profile!.username}`
    const text = `Check out ${profile!.full_name}'s profile on Lens — score ${profile!.aggregate_score >= 0 ? '+' : ''}${profile!.aggregate_score.toFixed(2)}`
    if (navigator.share) {
      try { await navigator.share({ title: profile!.full_name, text, url }); setShared(true) }
      catch {}
    } else {
      await navigator.clipboard.writeText(url)
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    }
  }
  async function handleRateRequest() {
    if (rateRequested || rateRequestLoading || !profile) return
    setRateRequestLoading(true)
    try {
      const res = await fetch('/api/request-rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: profile.id }),
      })
      if (res.ok) {
        setRateRequested(true)
      }
    } catch {}
    finally { setRateRequestLoading(false) }
  }

  const metrics = profile.metric_scores ?? []
  const radarData = metrics.map(m => ({ metric: m.metric_name, score: m.avg_score, fullMark: 5 }))

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'overview',     label: 'Overview' },
    { key: 'ratings',      label: 'Reflections', count: profile.total_ratings },
    { key: 'connections',  label: 'Connections',  count: connections.length },
  ]

  return (
    <div className="max-w-2xl mx-auto pb-24 md:pb-8 animate-fade-in">
      {/* ── Cover photo ── */}
      <div
        className="relative w-full h-44 sm:h-56"
        style={{ background: profile.cover_photo_url ? undefined : coverGradient(profile.username) }}
      >
        {profile.cover_photo_url && (
          <Image src={profile.cover_photo_url} alt="cover" fill className="object-cover" />
        )}

        {/* Score ring — top right */}
        <div className="absolute top-3 right-3">
          <ScoreRing score={profile.aggregate_score} size={72} strokeWidth={7} />
        </div>

        {/* Edit cover — own profile */}
        {isOwn && (
          <Link
            href="/settings"
            className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-gray-900/50 backdrop-blur-sm text-foreground text-xs font-medium rounded-xl border border-white/20 hover:bg-gray-900/70 transition-colors"
          >
            <Pencil size={12} /> Edit
          </Link>
        )}
      </div>

      {/* ── Avatar overlapping cover ── */}
      <div className="relative px-4">
        <div className="flex items-end justify-between -mt-11">
          <div className="relative">
            <Image
              src={avatar}
              alt={profile.full_name}
              width={88}
              height={88}
              className="rounded-2xl ring-4 ring-bg"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pb-1 flex-wrap justify-end">
            <button
              onClick={() => setShowQR(true)}
              className="p-2.5 bg-surface border border-border rounded-xl text-muted hover:text-foreground hover:border-primary/40 transition-colors"
              title="QR Code"
            >
              <QrCode size={18} />
            </button>
            <button
              onClick={handleShare}
              className="p-2.5 bg-surface border border-border rounded-xl text-muted hover:text-foreground hover:border-primary/40 transition-colors"
              title={shared ? 'Copied!' : 'Share profile'}
            >
              <Share2 size={18} className={shared ? 'text-primary' : ''} />
            </button>
            {!isOwn && currentUserId && (
              <>
                <Link
                  href={`/chat/new/${profile.id}`}
                  className="p-2.5 bg-surface border border-border rounded-xl text-muted hover:text-foreground hover:border-primary/40 transition-colors"
                  title="Message"
                >
                  <MessageCircle size={18} />
                </Link>
                {/* Rate Me — ask this person to rate you back */}
                <button
                  onClick={handleRateRequest}
                  disabled={rateRequested || rateRequestLoading}
                  title={rateRequested ? 'Request sent!' : `Ask ${profile.full_name} to rate you`}
                  className={`flex items-center gap-2 px-4 py-2.5 font-bold rounded-xl text-sm transition-all border ${
                    rateRequested
                      ? 'bg-green-500/15 border-green-500/40 text-green-400 cursor-default'
                      : 'bg-surface border-border text-foreground hover:border-yellow-400/60 hover:text-yellow-400'
                  }`}
                >
                  {rateRequested ? (
                    <><span>✓</span> Sent!</>
                  ) : rateRequestLoading ? (
                    <><span className="animate-spin inline-block">⭐</span> Sending…</>
                  ) : (
                    <><span>⭐</span> Rate me!</>
                  )}
                </button>
                <Link
                  href={`/rate/${profile.id}`}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-bold rounded-xl text-sm shadow-glow-sm hover:shadow-glow-md transition-all"
                >
                  <Star size={14} /> Reflect
                </Link>
              </>
            )}
            {isOwn && (
              <Link
                href="/settings"
                className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border text-foreground font-semibold rounded-xl text-sm hover:border-primary/40 transition-colors"
              >
                <Pencil size={14} /> Edit profile
              </Link>
            )}
          </div>
        </div>

        {/* ── Name + bio ── */}
        <div className="mt-3 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-black text-2xl text-foreground leading-tight">{profile.full_name}</h1>
            <TierBadge score={profile.aggregate_score} totalRatings={profile.total_ratings} size="sm" />
          </div>
          <p className="text-muted">@{profile.username}</p>

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
            {profile.occupation && (
              <span className="flex items-center gap-1 text-muted/80 text-sm">
                <Briefcase size={12} /> {profile.occupation}
              </span>
            )}
            {profile.location && (
              <span className="flex items-center gap-1 text-muted/80 text-sm">
                <MapPin size={12} /> {profile.location}
              </span>
            )}
          </div>

          {profile.bio && (
            <p className="text-foreground/70 text-sm mt-2 leading-relaxed">{profile.bio}</p>
          )}
        </div>

        {/* ── Stats row ── */}
        <div className="flex gap-5 mt-4 pt-4 border-t border-border">
          <div className="text-center">
            <p className={`font-black text-xl tabular-nums ${scoreColor(profile.aggregate_score)}`}>
              {profile.aggregate_score.toFixed(2)}
            </p>
            <p className="text-muted text-xs">Impression</p>
          </div>
          <div className="w-px bg-border" />
          <div className="text-center">
            <p className="font-black text-xl text-foreground">{profile.total_ratings}</p>
            <p className="text-muted text-xs">Reflections</p>
          </div>
          <div className="w-px bg-border" />
          <div className="text-center">
            <p className="font-black text-xl text-foreground">{connections.length}</p>
            <p className="text-muted text-xs">Connections</p>
          </div>
          <div className="w-px bg-border" />
          <div className="text-center">
            <p className="font-black text-xl text-foreground">{memberSince(profile.created_at).split(' ')[1]}</p>
            <p className="text-muted text-xs">Joined</p>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 mt-4 border-b border-border">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                tab === t.key ? 'text-primary' : 'text-muted hover:text-foreground'
              }`}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-border rounded-full text-xs">{t.count}</span>
              )}
              {tab === t.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="px-4 mt-5 space-y-4">

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div className="space-y-5">
            {/* Rewards tier card — own profile only */}
            {isOwn && (
              <RewardsTierCard score={profile.aggregate_score} totalRatings={profile.total_ratings} />
            )}
            {metrics.length === 0 ? (
              <div className="text-center py-10 text-muted">
                <p className="text-3xl mb-2">⭐</p>
                <p className="text-foreground font-semibold">No reflections yet</p>
                <p className="text-sm mt-1">
                  {isOwn ? 'Share your profile so others can reflect on you.' : `Be the first to share your thoughts on ${profile.full_name.split(' ')[0]}.`}
                </p>
                {!isOwn && currentUserId && (
                  <Link href={`/rate/${profile.id}`} className="inline-block mt-4 px-6 py-2.5 bg-primary text-white font-bold rounded-xl text-sm shadow-glow-sm">
                    Share your thoughts
                  </Link>
                )}
              </div>
            ) : (
              <>
                {/* History chart */}
                <RatingHistoryChart userId={profile.id} />

                {/* Radar chart */}
                <div className="bg-surface border border-border rounded-2xl p-4 h-52">
                  <p className="text-xs text-muted mb-2 font-medium uppercase tracking-wider">Skill radar</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} margin={{ top: 0, right: 20, bottom: 10, left: 20 }}>
                      <PolarGrid stroke="#fce7ec" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Radar dataKey="score" stroke="#e8476a" fill="#e8476a" fillOpacity={0.2} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Metric bars */}
                <div className="space-y-2">
                  {metrics.map(m => (
                    <div key={m.metric_id} className="bg-surface border border-border rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-foreground flex items-center gap-1.5">
                          <span>{m.metric_icon}</span>{m.metric_name}
                        </span>
                        <span className={`font-bold text-sm tabular-nums ${scoreColor(m.avg_score)}`}>
                          {m.avg_score > 0 ? '+' : ''}{m.avg_score.toFixed(1)}
                          <span className="text-muted font-normal text-xs"> / ±5</span>
                        </span>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${((m.avg_score + 5) / 10) * 100}%`,
                            background: m.avg_score >= 2 ? '#34d399' : m.avg_score >= 0 ? '#fbbf24' : '#f87171',
                            boxShadow: `0 0 6px ${m.avg_score >= 2 ? '#34d399' : m.avg_score >= 0 ? '#fbbf24' : '#f87171'}66`,
                            transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                          }}
                        />
                      </div>
                      <p className="text-muted text-xs mt-1">{m.rating_count} reflections</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* RATINGS TAB */}
        {tab === 'ratings' && (
          <div className="space-y-3">
            {ratings.length === 0 ? (
              <div className="text-center py-10 text-muted">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-foreground font-semibold">No reflections yet</p>
              </div>
            ) : (
              ratings.map((r: any) => {
                const metricScores = r.rating_scores?.map((rs: any) => ({
                  name: rs.rating_metrics?.name ?? '',
                  icon: rs.rating_metrics?.icon ?? '',
                  score: rs.score,
                })) ?? []
                return (
                  <RatingCard key={r.id} rating={r as Rating} metricScores={metricScores} isOwn={isOwn} />
                )
              })
            )}
          </div>
        )}

        {/* CONNECTIONS TAB */}
        {tab === 'connections' && (
          <div className="space-y-2">
            {connections.length === 0 ? (
              <div className="text-center py-10 text-muted">
                <p className="text-3xl mb-2">👥</p>
                <p className="text-foreground font-semibold">No connections yet</p>
              </div>
            ) : (
              connections.map((c: any) => {
                const p = c.profiles
                if (!p) return null
                return (
                  <Link
                    key={c.id}
                    href={`/profile/${p.username}`}
                    className="flex items-center gap-3 p-3 bg-surface border border-border rounded-xl hover:border-primary/40 transition-colors"
                  >
                    <Image
                      src={p.avatar_url ?? avatarUrl(p.username)}
                      alt={p.full_name}
                      width={44}
                      height={44}
                      className="rounded-xl"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">{p.full_name}</p>
                      <p className="text-muted text-xs">@{p.username}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-bold text-sm tabular-nums ${scoreColor(p.aggregate_score)}`}>
                        {p.aggregate_score.toFixed(2)}
                      </p>
                      <p className="text-muted text-xs capitalize">{c.connection_type}</p>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* QR Modal */}
      {showQR && (
        <QRCodeModal username={profile.username} fullName={profile.full_name} onClose={() => setShowQR(false)} />
      )}
    </div>
  )
}
