import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

// VAPID setup is deferred to handler time (not module level) so the build
// doesn't fail when env vars aren't present in the Vercel build environment.
function initWebPush() {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
}

export async function POST(request: Request) {
  const { rated_id } = await request.json()
  if (!rated_id) return NextResponse.json({ error: 'Missing rated_id' }, { status: 400 })

  initWebPush()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', rated_id)

  if (!subs || subs.length === 0) return NextResponse.json({ sent: 0 })

  const payload = JSON.stringify({
    title: 'New reflection ✨',
    body: 'Someone just shared their thoughts on you anonymously on Lens.',
    url: '/feed',
  })

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  )

  // Remove expired/invalid subscriptions
  const failed = results
    .map((r, i) => (r.status === 'rejected' ? subs[i].endpoint : null))
    .filter(Boolean) as string[]

  if (failed.length > 0) {
    await supabase.from('push_subscriptions')
      .delete()
      .eq('user_id', rated_id)
      .in('endpoint', failed)
  }

  return NextResponse.json({ sent: results.filter(r => r.status === 'fulfilled').length })
}
