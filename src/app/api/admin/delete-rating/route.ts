import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { ratingId } = await req.json()
  if (!ratingId) return NextResponse.json({ error: 'Missing ratingId' }, { status: 400 })

  const db = createAdminClient()
  const { error } = await db.from('ratings').delete().eq('id', ratingId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
