import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import VisibilityToggle from './VisibilityToggle'
import DeleteRatingButton from './DeleteRatingButton'

const PAGE_SIZE = 25

export default async function AdminRatingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; filter?: string }>
}) {
  await requireAdmin()
  const db = createAdminClient()
  const { page = '1', filter = 'all' } = await searchParams
  const pageNum = Math.max(1, parseInt(page, 10))
  const from = (pageNum - 1) * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  let query = db
    .from('ratings')
    .select(`
      id, raw_avg_score, weighted_score, comment, is_visible, created_at,
      rater:profiles!ratings_rater_id_fkey(id,username,full_name),
      rated:profiles!ratings_rated_id_fkey(id,username,full_name)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (filter === 'hidden')  query = query.eq('is_visible', false)
  if (filter === 'visible') query = query.eq('is_visible', true)
  if (filter === 'flagged') query = query.lte('raw_avg_score', 1.5)

  const { data: ratings, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  function buildUrl(params: Record<string, string>) {
    const p = new URLSearchParams({ filter, page: String(pageNum), ...params })
    return `/admin/ratings?${p.toString()}`
  }

  const FILTERS = [
    { key: 'all',     label: 'All' },
    { key: 'visible', label: 'Visible' },
    { key: 'hidden',  label: 'Hidden' },
    { key: 'flagged', label: 'Low score (≤1.5)' },
  ]

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Ratings</h1>
        <p className="text-gray-500 text-sm mt-0.5">{count ?? 0} matching ratings</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <Link
            key={f.key}
            href={buildUrl({ filter: f.key, page: '1' })}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              filter === f.key
                ? 'bg-yellow-400 text-gray-900'
                : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-medium">Rated</th>
                <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Rater</th>
                <th className="text-right px-5 py-3 font-medium">Score</th>
                <th className="text-left px-5 py-3 font-medium hidden lg:table-cell">Comment</th>
                <th className="text-left px-5 py-3 font-medium hidden lg:table-cell">Date</th>
                <th className="text-center px-5 py-3 font-medium">Visible</th>
                <th className="text-right px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {(ratings ?? []).map((r: any) => {
                const scoreColor =
                  r.raw_avg_score >= 4   ? 'text-green-400'
                : r.raw_avg_score >= 2.5 ? 'text-yellow-400'
                :                          'text-red-400'
                const date = new Date(r.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: '2-digit',
                })
                return (
                  <tr key={r.id} className={`hover:bg-gray-800/40 transition-colors ${!r.is_visible ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="text-white font-semibold">{r.rated?.full_name ?? '—'}</p>
                        <Link
                          href={`/profile/${r.rated?.username}`}
                          target="_blank"
                          className="text-gray-500 text-xs hover:text-yellow-400 transition-colors"
                        >
                          @{r.rated?.username}
                        </Link>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <p className="text-gray-400 text-xs">{r.rater?.full_name ?? 'Anonymous'}</p>
                      <p className="text-gray-600 text-[10px]">@{r.rater?.username ?? '—'}</p>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`font-black tabular-nums text-base ${scoreColor}`}>
                        {Number(r.raw_avg_score).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell max-w-[200px]">
                      {r.comment
                        ? <p className="text-gray-400 text-xs italic truncate">"{r.comment}"</p>
                        : <span className="text-gray-700 text-xs">—</span>
                      }
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="text-gray-500 text-xs">{date}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <VisibilityToggle ratingId={r.id} isVisible={r.is_visible} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end">
                        <DeleteRatingButton ratingId={r.id} />
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!ratings?.length && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-600">
                    No ratings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-800">
            <p className="text-gray-500 text-xs">Page {pageNum} of {totalPages}</p>
            <div className="flex gap-2">
              {pageNum > 1 && (
                <Link href={buildUrl({ page: String(pageNum - 1) })}
                  className="px-3 py-1.5 text-xs rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors">
                  ← Prev
                </Link>
              )}
              {pageNum < totalPages && (
                <Link href={buildUrl({ page: String(pageNum + 1) })}
                  className="px-3 py-1.5 text-xs rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors">
                  Next →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
