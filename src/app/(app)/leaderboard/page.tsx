import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { avatarUrl } from '@/lib/utils'
import { getTier, TIERS } from '@/lib/tiers'
import { Trophy, Medal, Star, TrendingUp, Info, Gift } from 'lucide-react'

interface LeaderboardEntry {
  id: string
  username: string
  full_name: string
  avatar_url: string | null
  occupation: string | null
  aggregate_score: number
  total_ratings: number
  rank_score: number
  rank: number
}

function confidencePct(ratings: number): number {
  return Math.round((ratings / (ratings + 5)) * 100)
}

function scoreColor(score: number): string {
  if (score >= 2)  return '#16a34a'
  if (score >= 0)  return '#d97706'
  return '#dc2626'
}

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'] // gold, silver, bronze
const MEDAL_BG    = ['rgba(255,215,0,0.10)', 'rgba(192,192,192,0.08)', 'rgba(205,127,50,0.10)']
const MEDAL_BORDER= ['#FFD70040', '#C0C0C030', '#CD7F3240']

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data } = await supabase.rpc('get_leaderboard', { limit_count: 100 })
  const entries: LeaderboardEntry[] = (data as LeaderboardEntry[]) ?? []

  const top3   = entries.slice(0, 3)
  const rest   = entries.slice(3)

  // Find current user's rank (if present)
  const myEntry = entries.find(e => e.id === user.id)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={22} className="text-primary" />
          <h1 className="font-black text-2xl text-foreground">Spotlight</h1>
        </div>
        {myEntry && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-xl">
            <span className="text-muted text-xs">Your standing</span>
            <span className="font-black text-primary text-sm">#{myEntry.rank}</span>
          </div>
        )}
      </div>

      {/* Rewards banner — prominent */}
      <div className="rounded-3xl overflow-hidden border border-primary/40 shadow-glow-sm">
        {/* Bold header */}
        <div className="bg-gradient-to-r from-[#2D1B69] to-[#4c1d95] px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            <div>
              <p className="font-black text-lg text-primary leading-tight">Top impressions = real rewards</p>
              <p className="text-foreground/70 text-xs mt-0.5">Climb the Spotlight and unlock free coffee, discounts & VIP access.</p>
            </div>
          </div>
        </div>

        {/* Tier perks grid */}
        <div className="bg-surface px-4 pt-4 pb-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">What you unlock</p>
          <div className="grid grid-cols-2 gap-2">
            {TIERS.filter(t => t.key !== 'explorer').map(t => (
              <div
                key={t.key}
                className="flex items-center gap-2.5 p-2.5 bg-bg border border-border rounded-2xl"
              >
                <span className="text-2xl shrink-0">{t.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-black text-foreground leading-tight">{t.label}</p>
                  <p className="text-[10px] text-muted leading-tight truncate">{t.perkIcons[0]} {t.perks[0]}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-1.5 mt-3">
            <Info size={10} className="text-muted shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted leading-relaxed">
              Perks subject to availability & partner participation. Minimum thresholds required. Terms apply.
            </p>
          </div>
        </div>
      </div>

      {/* Formula explainer */}
      <div className="flex items-start gap-2 px-4 py-3 bg-surface border border-border rounded-2xl">
        <Info size={14} className="text-muted shrink-0 mt-0.5" />
        <p className="text-muted text-xs leading-relaxed">
          Your standing uses a <span className="text-foreground font-semibold">confidence level</span>: your impression is weighted by how many people have shared their thoughts on you.
          More voices = a clearer picture. A perfect impression from 1 person won't outshine a great one from 50.
        </p>
      </div>

      {/* ── Podium (top 3) ── */}
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-3 items-end">
          {/* 2nd place */}
          {top3[1] ? (
            <PodiumCard entry={top3[1]} position={2} />
          ) : <div />}

          {/* 1st place — taller */}
          {top3[0] && (
            <PodiumCard entry={top3[0]} position={1} tall />
          )}

          {/* 3rd place */}
          {top3[2] ? (
            <PodiumCard entry={top3[2]} position={3} />
          ) : <div />}
        </div>
      )}

      {/* ── Ranked list (4th+) ── */}
      {rest.length > 0 && (
        <div className="space-y-2">
          <p className="text-muted text-xs font-medium uppercase tracking-wider px-1">Full standings</p>
          <div className="space-y-1.5">
            {rest.map(entry => (
              <RankRow key={entry.id} entry={entry} isMe={entry.id === user.id} />
            ))}
          </div>
        </div>
      )}

      {entries.length === 0 && (
        <div className="text-center py-20 text-muted">
          <p className="text-5xl mb-4">🏆</p>
          <p className="font-bold text-foreground text-lg">No one here yet</p>
          <p className="text-sm mt-1">Be the first to appear in the Spotlight!</p>
          <Link
            href="/search"
            className="inline-block mt-5 px-6 py-3 bg-primary text-[#1a0f40] font-bold rounded-2xl shadow-glow-sm"
          >
            Discover people
          </Link>
        </div>
      )}
    </div>
  )
}

/* ── Podium card ── */
function PodiumCard({ entry, position, tall = false }: { entry: LeaderboardEntry; position: number; tall?: boolean }) {
  const avatar = entry.avatar_url ?? avatarUrl(entry.username)
  const medalColor  = MEDAL_COLORS[position - 1]
  const bgColor     = MEDAL_BG[position - 1]
  const borderColor = MEDAL_BORDER[position - 1]
  const conf        = confidencePct(entry.total_ratings)
  const sColor      = scoreColor(entry.aggregate_score)
  const tier        = getTier(entry.aggregate_score, entry.total_ratings)

  return (
    <Link
      href={`/profile/${entry.username}`}
      className={`flex flex-col items-center gap-2 rounded-2xl border p-3 text-center transition-all hover:shadow-glow-sm ${tall ? 'pb-4 pt-4' : ''}`}
      style={{ background: bgColor, borderColor }}
    >
      {/* Medal icon */}
      <div className="relative">
        <Image
          src={avatar}
          alt={entry.full_name}
          width={tall ? 64 : 52}
          height={tall ? 64 : 52}
          className="rounded-xl"
          style={{ outline: `3px solid ${medalColor}`, outlineOffset: 2 }}
        />
        <span
          className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow-sm"
          style={{ background: medalColor, color: position === 1 ? '#1a0f40' : position === 2 ? '#1a1035' : '#1a0f40' }}
        >
          {position}
        </span>
      </div>

      <div className="mt-1 w-full min-w-0">
        <p className="font-bold text-foreground text-xs truncate leading-tight">{entry.full_name}</p>
        <p className="text-muted text-[10px] truncate">@{entry.username}</p>
        {tier.key !== 'explorer' && (
          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full border mt-1"
            style={{ color: tier.color, borderColor: tier.color + '40', background: tier.color + '12' }}>
            {tier.icon} {tier.label}
          </span>
        )}
      </div>

      <div>
        <p className="font-black text-lg tabular-nums" style={{ color: sColor }}>
          {entry.aggregate_score > 0 ? '+' : ''}{entry.aggregate_score.toFixed(2)}
        </p>
        <p className="text-muted text-[10px]">{entry.total_ratings} reflections</p>
      </div>

      {/* Confidence bar */}
      <div className="w-full space-y-0.5">
        <div className="h-1 bg-black/10 rounded-full overflow-hidden w-full">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${conf}%`, background: medalColor }}
          />
        </div>
        <p className="text-[9px]" style={{ color: medalColor }}>{conf}% confidence</p>
      </div>
    </Link>
  )
}

/* ── Rank row ── */
function RankRow({ entry, isMe }: { entry: LeaderboardEntry; isMe: boolean }) {
  const avatar = entry.avatar_url ?? avatarUrl(entry.username)
  const conf   = confidencePct(entry.total_ratings)
  const sColor = scoreColor(entry.aggregate_score)
  const tier   = getTier(entry.aggregate_score, entry.total_ratings)

  return (
    <Link
      href={`/profile/${entry.username}`}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all hover:border-primary/30 hover:shadow-glow-sm"
      style={{
        background: isMe ? '#FFD7000a' : '#1a1035',
        borderColor: isMe ? '#FFD70040' : '#2d2052',
      }}
    >
      {/* Rank number */}
      <span className="w-7 text-center font-black tabular-nums text-sm shrink-0"
        style={{ color: entry.rank <= 10 ? '#FFD700' : '#9ca3af' }}>
        {entry.rank}
      </span>

      {/* Avatar */}
      <Image
        src={avatar}
        alt={entry.full_name}
        width={40}
        height={40}
        className="rounded-xl shrink-0"
      />

      {/* Name + occupation */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-semibold text-foreground text-sm truncate">{entry.full_name}</p>
          {isMe && (
            <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/20 text-[#1a0f40]">you</span>
          )}
          {tier.key !== 'explorer' && (
            <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full border"
              style={{ color: tier.color, borderColor: tier.color + '40', background: tier.color + '12' }}>
              {tier.icon} {tier.label}
            </span>
          )}
        </div>
        <p className="text-muted text-xs truncate">@{entry.username}</p>
      </div>

      {/* Confidence bar + ratings count */}
      <div className="hidden sm:flex flex-col items-end gap-1 w-20 shrink-0">
        <div className="w-full h-1 bg-border rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${conf}%`, background: sColor }}
          />
        </div>
        <p className="text-muted text-[10px]">{entry.total_ratings} reflections</p>
      </div>

      {/* Score */}
      <div className="text-right shrink-0">
        <p className="font-black text-base tabular-nums" style={{ color: sColor }}>
          {entry.aggregate_score > 0 ? '+' : ''}{entry.aggregate_score.toFixed(2)}
        </p>
        <p className="text-muted text-[10px] sm:hidden">{entry.total_ratings} ratings</p>
      </div>
    </Link>
  )
}
