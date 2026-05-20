import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const db = createAdminClient()

  // Safety check: don't delete metrics that have been used
  const { count } = await db
    .from('rating_scores')
    .select('*', { count: 'exact', head: true })
    .eq('metric_id', id)

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: 'Cannot delete a metric that has existing rating scores. Deactivate it instead.' },
      { status: 409 }
    )
  }

  const { error } = await db.from('rating_metrics').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
