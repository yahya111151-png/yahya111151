import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import RatingCard from '@/components/ui/RatingCard'
import type { Rating } from '@/types'
import { Bell, Star, Share2 } from 'lucide-react'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, full_name')
    .eq('id', user.id)
    .single()

  const { data: ratings } = await supabase
    .from('ratings')
    .select(`
      *,
      rating_scores (
        score,
        metric_id,
        rating_metrics ( name, icon )
      )
    `)
    .eq('rated_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50) as { data: any[] | null }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={20} className="text-primary" />
          <h1 className="font-black text-2xl text-foreground">Your reflections</h1>
        </div>
        {ratings && ratings.length > 0 && (
          <span className="px-3 py-1 bg-primary/15 border border-primary/25 text-primary text-sm font-bold rounded-xl">
            {ratings.length}
          </span>
        )}
      </div>

      {(!ratings || ratings.length === 0) ? (
        <div className="text-center py-12 space-y-5">
          <div className="text-5xl">📭</div>
          <div>
            <p className="font-black text-xl text-foreground">No reflections yet</p>
            <p className="text-muted text-sm mt-1 leading-relaxed max-w-xs mx-auto">
              Rate others to encourage them to rate you back — or share your profile link.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/search"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-[#1a0f40] font-black rounded-2xl shadow-glow-sm hover:shadow-glow-md transition-all"
            >
              <Star size={15} fill="#1a0f40" /> Reflect on someone
            </Link>
            {profile && (
              <Link
                href={`/profile/${profile.username}`}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-surface border border-border text-foreground font-semibold rounded-2xl hover:border-primary/40 transition-colors"
              >
                <Share2 size={15} className="text-primary" /> My profile
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {ratings.map((r: any) => {
            const metricScores = r.rating_scores?.map((rs: any) => ({
              name: rs.rating_metrics?.name ?? '',
              icon: rs.rating_metrics?.icon ?? '',
              score: rs.score,
            })) ?? []
            return (
              <RatingCard
                key={r.id}
                rating={r as Rating}
                metricScores={metricScores}
                isOwn
              />
            )
          })}

          {/* Bottom CTA — keep the loop going */}
          <div className="pt-2 pb-4 text-center space-y-3">
            <p className="text-muted text-sm">The more you reflect, the more you get back ⭐</p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-[#1a0f40] font-black rounded-2xl shadow-glow-sm hover:shadow-glow-md transition-all"
            >
              <Star size={15} fill="#1a0f40" /> Reflect on someone
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
