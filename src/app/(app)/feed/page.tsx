import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RatingCard from '@/components/ui/RatingCard'
import { timeAgo } from '@/lib/utils'
import type { Rating } from '@/types'
import { Bell } from 'lucide-react'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // All ratings received, with per-metric scores
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
      <div className="flex items-center gap-2">
        <Bell size={20} className="text-primary" />
        <h1 className="font-black text-2xl text-foreground">Your ratings</h1>
      </div>

      {(!ratings || ratings.length === 0) ? (
        <div className="text-center py-16 text-muted">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-semibold text-foreground">No ratings yet</p>
          <p className="text-sm mt-1">Share your profile link to get your first rating.</p>
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
        </div>
      )}
    </div>
  )
}
