import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import MetricRow from './MetricRow'
import AddMetricForm from './AddMetricForm'

export default async function AdminMetricsPage() {
  await requireAdmin()
  const db = createAdminClient()

  const { data: metrics } = await db
    .from('rating_metrics')
    .select('*')
    .order('sort_order')

  // Count rating_scores per metric
  const metricUsage: Record<string, number> = {}
  if (metrics?.length) {
    const counts = await Promise.all(
      metrics.map(m =>
        db
          .from('rating_scores')
          .select('*', { count: 'exact', head: true })
          .eq('metric_id', m.id)
          .then(r => ({ id: m.id, count: r.count ?? 0 }))
      )
    )
    counts.forEach(r => { metricUsage[r.id] = r.count })
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Rating Metrics</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Configure the dimensions people are rated on. Inactive metrics are hidden from the rating UI.
        </p>
      </div>

      {/* Metrics list */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-800">
        {(metrics ?? []).map((m: any) => (
          <MetricRow key={m.id} metric={m} usageCount={metricUsage[m.id] ?? 0} />
        ))}
        {!metrics?.length && (
          <p className="text-center py-10 text-gray-600">No metrics yet</p>
        )}
      </div>

      {/* Add new metric */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="font-bold text-white mb-4">Add a new metric</h2>
        <AddMetricForm nextOrder={(metrics?.length ?? 0) + 1} />
      </div>
    </div>
  )
}
