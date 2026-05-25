import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import ScoreRing from '@/components/ui/ScoreRing'
import UserCard from '@/components/ui/UserCard'
import TierBadge from '@/components/ui/TierBadge'
import RewardsTierCard from '@/components/ui/RewardsTierCard'
import DailyStreakCard from '@/components/ui/DailyStreakCard'
import AppSetupCard from '@/components/ui/AppSetupCard'
import InviteFriends from '@/components/ui/InviteFriends'
import { avatarUrl, scoreColor } from '@/lib/utils'
import type { ProfileWithMetrics, Profile } from '@/types'
import { Star, TrendingUp, Users, ChevronRight, Trophy, Share2, Zap } from 'lucide-react'
import NotificationBanner from '@/components/NotificationBanner'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profile_with_metrics')
    .select('*')
    .eq('id', user.id)
    .single() as { data: ProfileWithMetrics | null }

  if (!profile) redirect('/auth/login')

  const { data: recentRatings } = await supabase
    .from('ratings')
    .select('*')
    .eq('rated_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3)

  const { data: suggested } = await supabase
    .from('profiles')
    .select('*')
    .neq('id', user.id)
    .order('total_ratings', { ascending: false })
    .limit(6) as { data: Profile[] | null }

  const avatar = profile.avatar_url ?? avatarUrl(profile.username)
  const metrics = profile.metric_scores ?? []

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 animate-fade-in">

      {/* ── Hero card ── */}
      <div className="relative bg-surface border border-border rounded-3xl p-5 overflow-hidden">
        <div className="absolute inset-0 bg-glow-primary opacity-40 pointer-events-none" />
        <div className="relative flex items-center gap-4">
          <Image
            src={avatar}
            alt={profile.full_name}
            width={68}
            height={68}
            className="rounded-2xl ring-2 ring-primary/30 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-black text-xl text-foreground leading-tight">{profile.full_name}</h1>
              <TierBadge score={profile.aggregate_score} totalRatings={profile.total_ratings} size="xs" />
            </div>
            <p className="text-muted text-sm">@{profile.username}</p>
          </div>
          <ScoreRing score={profile.aggregate_score} size={80} strokeWidth={8} />
        </div>

        {/* Stats + quick actions */}
        <div className="relative flex items-center gap-3 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-4 flex-1">
            <div className="text-center">
              <p className="font-black text-lg text-foreground tabular-nums">{profile.total_ratings}</p>
              <p className="text-muted text-[10px]">reflections</p>
            </div>
            <div className="w-px h-6 bg-border" />
            <div className="text-center">
              <p className={`font-black text-lg tabular-nums ${scoreColor(profile.aggregate_score)}`}>
                {profile.aggregate_score >= 0 ? '+' : ''}{Number(profile.aggregate_score).toFixed(2)}
              </p>
              <p className="text-muted text-[10px]">impression</p>
            </div>
          </div>
          {/* Share my profile — quick access */}
          <Link
            href={`/profile/${profile.username}`}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary/15 border border-primary/30 text-primary text-sm font-bold rounded-xl hover:bg-primary/20 transition-colors"
          >
            My profile <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* ── Notification opt-in ── */}
      <NotificationBanner />

      {/* ── NEW REFLECTIONS — dopamine hit first ── */}
      {recentRatings && recentRatings.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              New reflections
            </h2>
            <Link href="/feed" className="text-sm text-primary font-semibold hover:underline flex items-center gap-1">
              See all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="space-y-2">
            {recentRatings.map((r, i) => (
              <div key={r.id} className="bg-surface border border-border rounded-xl p-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0 text-[#1a0f40] font-black text-sm bg-primary">
                  #{i + 1}
                </div>
                <div className="flex-1">
                  <span className="text-muted text-xs">Anonymous · just in</span>
                  <p className="text-foreground text-sm font-semibold mt-0.5">
                    Score: <span className={scoreColor(r.raw_avg_score)}>{r.raw_avg_score.toFixed(1)}</span>
                    <span className="text-muted font-normal ml-2">· weight {Math.round(r.proximity_weight * 100)}%</span>
                  </p>
                </div>
                {r.comment && (
                  <p className="text-muted text-xs italic truncate max-w-[100px]">"{r.comment}"</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── PRIMARY CTA: Reflect on someone ── */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#2D1B69] via-[#1a1035] to-[#0d0823] border border-primary/30 p-5 overflow-hidden">
        <div className="absolute top-0 right-0 text-[90px] opacity-5 leading-none pointer-events-none select-none rotate-12">⭐</div>
        <p className="font-black text-xl text-foreground">Rate someone today</p>
        <p className="text-muted text-sm mt-1 leading-relaxed">
          Every reflection you send comes back to you. The more you give, the more you get.
        </p>
        <div className="flex gap-3 mt-4">
          <Link
            href="/search"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-[#1a0f40] font-black rounded-2xl text-sm shadow-glow-sm hover:shadow-glow-md hover:bg-primary/90 transition-all"
          >
            <Star size={16} fill="#1a0f40" /> Reflect on someone
          </Link>
          <Link
            href={`/profile/${profile.username}`}
            className="flex items-center gap-1.5 px-4 py-3 bg-surface border border-border text-foreground font-semibold rounded-2xl text-sm hover:border-primary/40 transition-colors"
            title="Share your profile to get rated"
          >
            <Share2 size={15} className="text-primary" />
            My link
          </Link>
        </div>
      </div>

      {/* ── Discover people to rate ── */}
      {suggested && suggested.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <Users size={16} className="text-primary" />
              People to reflect on
            </h2>
            <Link href="/search" className="text-sm text-primary font-semibold hover:underline flex items-center gap-1">
              See all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="space-y-2">
            {suggested.map(p => <UserCard key={p.id} profile={p} />)}
          </div>
        </section>
      )}

      {/* ── Daily streak + challenge ── */}
      <DailyStreakCard username={profile.username} />

      {/* ── Metric breakdown ── */}
      {metrics.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              Your metrics
            </h2>
            <Link href={`/profile/${profile.username}`} className="text-sm text-primary font-semibold hover:underline flex items-center gap-1">
              Full profile <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {metrics.map(m => (
              <div key={m.metric_id} className="bg-surface border border-border rounded-2xl p-4 text-center">
                <span className="text-2xl">{m.metric_icon}</span>
                <p className="text-xs text-muted mt-1">{m.metric_name}</p>
                <p className={`text-xl font-black tabular-nums mt-1 ${scoreColor(m.avg_score)}`}>
                  {m.avg_score.toFixed(1)}
                </p>
                <p className="text-muted text-xs">{m.rating_count} reflections</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Invite friends ── */}
      <InviteFriends username={profile.username} fullName={profile.full_name} />

      {/* ── Leaderboard teaser ── */}
      <Link
        href="/leaderboard"
        className="flex items-center gap-4 p-4 bg-surface border border-border rounded-2xl hover:border-primary/40 hover:shadow-glow-sm transition-all group"
      >
        <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
          <Trophy size={22} className="text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-foreground">Spotlight</p>
          <p className="text-muted text-sm">See the most appreciated people on Lens</p>
        </div>
        <ChevronRight size={18} className="text-muted group-hover:text-primary transition-colors shrink-0" />
      </Link>

      {/* ── Rewards tier ── */}
      <RewardsTierCard score={profile.aggregate_score} totalRatings={profile.total_ratings} />

      {/* ── App setup checklist (least urgent, bottom) ── */}
      <AppSetupCard />

    </div>
  )
}
