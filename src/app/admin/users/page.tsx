import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTier } from '@/lib/tiers'
import Link from 'next/link'
import { Search, ExternalLink } from 'lucide-react'
import DeleteUserButton from './DeleteUserButton'

const PAGE_SIZE = 20

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  await requireAdmin()
  const db = createAdminClient()
  const { q = '', page = '1' } = await searchParams
  const pageNum = Math.max(1, parseInt(page, 10))
  const from = (pageNum - 1) * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  // Build query
  let query = db
    .from('profiles')
    .select('id,username,full_name,aggregate_score,total_ratings,created_at,avatar_url,occupation,location', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (q.trim()) {
    query = query.or(`username.ilike.%${q.trim()}%,full_name.ilike.%${q.trim()}%`)
  }

  const { data: users, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  function buildUrl(params: Record<string, string>) {
    const p = new URLSearchParams({ ...(q ? { q } : {}), page: String(pageNum), ...params })
    return `/admin/users?${p.toString()}`
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white">Users</h1>
          <p className="text-gray-500 text-sm mt-0.5">{count ?? 0} total members</p>
        </div>

        {/* Search */}
        <form method="GET" className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search name or username…"
              className="pl-8 pr-4 py-2 text-sm rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 w-64"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-semibold rounded-xl bg-yellow-400 text-gray-900 hover:bg-yellow-300 transition-colors"
          >
            Search
          </button>
          {q && (
            <Link
              href="/admin/users"
              className="px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-medium">User</th>
                <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Location / Job</th>
                <th className="text-right px-5 py-3 font-medium">Score</th>
                <th className="text-right px-5 py-3 font-medium">Ratings</th>
                <th className="text-left px-5 py-3 font-medium hidden lg:table-cell">Tier</th>
                <th className="text-left px-5 py-3 font-medium hidden lg:table-cell">Joined</th>
                <th className="text-right px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {(users ?? []).map((u: any) => {
                const tier = getTier(u.aggregate_score, u.total_ratings)
                const joined = new Date(u.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })
                return (
                  <tr key={u.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center text-sm font-black text-gray-400 shrink-0">
                          {u.full_name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-semibold truncate">{u.full_name}</p>
                          <p className="text-gray-500 text-xs">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <p className="text-gray-400 text-xs truncate max-w-[160px]">
                        {[u.occupation, u.location].filter(Boolean).join(' · ') || <span className="text-gray-700">—</span>}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="font-black tabular-nums text-yellow-400">
                        {Number(u.aggregate_score).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-gray-400 tabular-nums">
                      {u.total_ratings}
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: `${tier.color}22`, color: tier.color }}>
                        {tier.icon} {tier.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="text-gray-500 text-xs">{joined}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/profile/${u.username}`}
                          target="_blank"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-700 transition-colors"
                          title="View profile"
                        >
                          <ExternalLink size={13} />
                        </Link>
                        <DeleteUserButton userId={u.id} username={u.username} />
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!users?.length && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-600">
                    {q ? `No users matching "${q}"` : 'No users yet'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-800">
            <p className="text-gray-500 text-xs">
              Page {pageNum} of {totalPages}
            </p>
            <div className="flex gap-2">
              {pageNum > 1 && (
                <Link
                  href={buildUrl({ page: String(pageNum - 1) })}
                  className="px-3 py-1.5 text-xs rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  ← Prev
                </Link>
              )}
              {pageNum < totalPages && (
                <Link
                  href={buildUrl({ page: String(pageNum + 1) })}
                  className="px-3 py-1.5 text-xs rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
                >
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
