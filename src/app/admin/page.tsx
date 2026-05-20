import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTier } from '@/lib/tiers'
import Link from 'next/link'
import { Users, Star, TrendingUp, CalendarDays, ChevronRight, Activity } from 'lucide-react'

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string | number; sub?: string; color: string
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
        <Icon size={20} />
      </div>
      <p className="text-2xl font-black text-white tabular-nums">{value}</p>
      <p className="text-gray-400 text-sm font-medium mt-0.5">{label}</p>
      {sub && <p className="text-gray-600 text-xs mt-1">{sub}</p>}
    </div>
  )
}

export default async function AdminOverviewPage() {
  await requireAdmin()
  const db = createAdminClient()

  const now   = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const week  = new Date(Date.now() - 7 * 86400_000).toISOString()

  // ── Parallel queries ──
  const [
    { count: totalUsers },
    { count: totalRatings },
    { count: ratingsToday },
    { count: usersToday },
    { count: usersThisWeek },
    { data: recentUsers },
    { data: recentRatings },
    { data: allProfiles },
  ] = await Promise.all([
    db.from('profiles').select('*', { count: 'exact', head: true }),
    db.from('ratings').select('*',  { count: 'exact', head: true }),
    db.from('ratings').select('*',  { count: 'exact', head: true }).gte('created_at', today),
    db.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', today),
    db.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', week),
    db.from('profiles').select('id,username,full_name,aggregate_score,total_ratings,created_at')
      .order('created_at', { ascending: false }).limit(8),
    db.from('ratings').select('id,rated_id,raw_avg_score,comment,created_at,profiles!ratings_rated_id_fkey(full_name,username)')
      .order('created_at', { ascending: false }).limit(8),
    db.from('profiles').select('aggregate_score,total_ratings'),
  ])

  // Tier breakdown
  const tierCounts: Record<string, number> = { explorer: 0, rising: 0, trusted: 0, stellar: 0, legend: 0 }
  for (const p of (allProfiles ?? [])) {
    const t = getTier(p.aggregate_score, p.total_ratings)
    tierCounts[t.key] = (tierCounts[t.key] ?? 0) + 1
  }

  const TIER_LABELS = [
    { key: 'legend',   icon: '🏆', color: 'text-yellow-400' },
    { key: 'stellar',  icon: '⭐', color: 'text-violet-400' },
    { key: 'trusted',  icon: '🤝', color: 'text-blue-400'   },
    { key: 'rising',   icon: '🌟', color: 'text-amber-400'  },
    { key: 'explorer', icon: '🔭', color: 'text-gray-500'   },
  ]

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Overview</h1>
        <p className="text-gray-500 text-sm mt-0.5">Real-time stats for the Lens platform</p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}        label="Total users"      value={totalUsers ?? 0}   color="bg-blue-500/15 text-blue-400"   />
        <StatCard icon={Star}         label="Total ratings"    value={totalRatings ?? 0} color="bg-yellow-500/15 text-yellow-400" />
        <StatCard icon={Activity}     label="Ratings today"    value={ratingsToday ?? 0} color="bg-green-500/15 text-green-400"  />
        <StatCard icon={CalendarDays} label="New users (7d)"   value={usersThisWeek ?? 0} sub={`${usersToday ?? 0} today`} color="bg-violet-500/15 text-violet-400" />
      </div>

      {/* ── Tier breakdown ── */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <h2 className="font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-yellow-400" />
          Users by reward tier
        </h2>
        <div className="grid grid-cols-5 gap-3">
          {TIER_LABELS.map(({ key, icon, color }) => (
            <div key={key} className="text-center bg-gray-800/60 rounded-xl p-3">
              <span className="text-2xl">{icon}</span>
              <p className={`font-black text-xl mt-1 tabular-nums ${color}`}>
                {tierCounts[key] ?? 0}
              </p>
              <p className="text-gray-500 text-xs capitalize mt-0.5">{key}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* ── Recent signups ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <h2 className="font-bold text-white text-sm">Recent signups</h2>
            <Link href="/admin/users" className="text-xs text-yellow-400 hover:underline flex items-center gap-1">
              View all <ChevronRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-800">
            {(recentUsers ?? []).map((u: any) => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-sm font-black text-gray-400 shrink-0">
                  {u.full_name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{u.full_name}</p>
                  <p className="text-gray-500 text-xs">@{u.username}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-yellow-400 tabular-nums">{u.aggregate_score.toFixed(1)}</p>
                  <p className="text-gray-600 text-[10px]">{u.total_ratings} ratings</p>
                </div>
              </div>
            ))}
            {!recentUsers?.length && (
              <p className="text-gray-600 text-sm text-center py-8">No users yet</p>
            )}
          </div>
        </div>

        {/* ── Recent ratings ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <h2 className="font-bold text-white text-sm">Recent ratings</h2>
            <Link href="/admin/ratings" className="text-xs text-yellow-400 hover:underline flex items-center gap-1">
              View all <ChevronRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-800">
            {(recentRatings ?? []).map((r: any) => (
              <div key={r.id} className="flex items-start gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-sm shrink-0 mt-0.5">
                  ⭐
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">
                    {(r.profiles as any)?.full_name ?? 'Unknown'}
                  </p>
                  {r.comment && (
                    <p className="text-gray-500 text-xs italic mt-0.5 truncate">"{r.comment}"</p>
                  )}
                </div>
                <div className="shrink-0">
                  <span className={`text-xs font-black tabular-nums ${r.raw_avg_score >= 3.5 ? 'text-green-400' : r.raw_avg_score >= 2.5 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {r.raw_avg_score.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
            {!recentRatings?.length && (
              <p className="text-gray-600 text-sm text-center py-8">No ratings yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
