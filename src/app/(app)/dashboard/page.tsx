import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import ScoreRing from '@/components/ui/ScoreRing'
import UserCard from '@/components/ui/UserCard'
import { avatarUrl, scoreColor } from '@/lib/utils'
import type { ProfileWithMetrics, Profile } from '@/types'
import { Star, TrendingUp, Users, ChevronRight, Trophy } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch own profile with metrics
  const { data: profile } = await supabase
    .from('profile_with_metrics')
    .select('*')
    .eq('id', user.id)
    .single() as { data: ProfileWithMetrics | null }

  if (!profile) redirect('/auth/login')

  // Fetch recent ratings received
  const { data: recentRatings } = await supabase
    .from('ratings')
    .select('*')
    .eq('rated_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3)

  // Fetch suggested users (random public profiles, not self)
  const { data: suggested } = await supabase
    .from('profiles')
    .select('*')
    .neq('id', user.id)
    .order('total_ratings', { ascending: false })
    .limit(4) as { data: Profile[] | null }

  const avatar = profile.avatar_url ?? avatarUrl(profile.username)
  const metrics = profile.metric_scores ?? []

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      {/* Hero card */}
      <div className="relative bg-surface border border-border rounded-3xl p-6 overflow-hidden">
        <div className="absolute inset-0 bg-glow-primary opacity-50 pointer-events-none" />
        <div className="relative flex items-center gap-5">
          <Image
            src={avatar}
            alt={profile.full_name}
            width={72}
            height={72}
            className="rounded-2xl ring-2 ring-primary/30"
          />
          <div className="flex-1">
            <h1 className="font-black text-xl text-foreground">{profile.full_name}</h1>
            <p className="text-muted text-sm">@{profile.username}</p>
            {profile.occupation && <p className="text-muted/70 text-xs mt-0.5">{profile.occupation}</p>}
          </div>
          <ScoreRing score={profile.aggregate_score} size={88} />
        </div>

        <div className="relative flex gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-sm">
            <Star size={14} className="text-primary" />
            <span className="text-muted">{profile.total_ratings} ratings received</span>
          </div>
          <Link
            href={`/profile/${profile.username}`}
            className="ml-auto flex items-center gap-1 text-sm text-primary hover:underline"
          >
            View profile <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* Metric breakdown */}
      {metrics.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" />
            Your metrics
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {metrics.map(m => (
              <div key={m.metric_id} className="bg-surface border border-border rounded-2xl p-4 text-center">
                <span className="text-2xl">{m.metric_icon}</span>
                <p className="text-xs text-muted mt-1">{m.metric_name}</p>
                <p className={`text-xl font-black tabular-nums mt-1 ${scoreColor(m.avg_score)}`}>
                  {m.avg_score.toFixed(1)}
                </p>
                <p className="text-muted text-xs">{m.rating_count} ratings</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent ratings */}
      {recentRatings && recentRatings.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-foreground">Recent ratings</h2>
            <Link href="/feed" className="text-sm text-primary hover:underline">See all</Link>
          </div>
          <div className="space-y-2">
            {recentRatings.map(r => (
              <div key={r.id} className="bg-surface border border-border rounded-xl p-3 flex items-center gap-3">
                <div className="flex-1">
                  <span className="text-muted text-xs">Anonymous rating</span>
                  <p className="text-foreground text-sm font-semibold mt-0.5">
                    Score: <span className={scoreColor(r.raw_avg_score)}>{r.raw_avg_score.toFixed(1)}</span>
                    <span className="text-muted font-normal ml-2">· weight {Math.round(r.proximity_weight * 100)}%</span>
                  </p>
                </div>
                {r.comment && (
                  <p className="text-muted text-xs italic truncate max-w-[120px]">"{r.comment}"</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Leaderboard teaser */}
      <Link
        href="/leaderboard"
        className="flex items-center gap-4 p-4 bg-surface border border-border rounded-2xl hover:border-primary/40 hover:shadow-glow-sm transition-all group"
      >
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <Trophy size={22} className="text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-foreground">Leaderboard</p>
          <p className="text-muted text-sm">See the highest-rated people on Lens</p>
        </div>
        <ChevronRight size={18} className="text-muted group-hover:text-primary transition-colors shrink-0" />
      </Link>

      {/* People to rate */}
      {suggested && suggested.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <Users size={16} className="text-primary" />
              Discover people
            </h2>
            <Link href="/search" className="text-sm text-primary hover:underline">Browse all</Link>
          </div>
          <div className="space-y-2">
            {suggested.map(p => <UserCard key={p.id} profile={p} />)}
          </div>
        </section>
      )}
    </div>
  )
}
