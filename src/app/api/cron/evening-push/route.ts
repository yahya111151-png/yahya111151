import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function initWebPush() {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
}

function isAuthorized(req: Request) {
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  return auth === `Bearer ${secret}`
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  initWebPush()
  const db = adminClient()

  const { data: subs } = await db
    .from('push_subscriptions')
    .select('user_id, endpoint, p256dh, auth')

  if (!subs?.length) return NextResponse.json({ sent: 0 })

  // Rotate between streak/social proof messages
  const day = new Date().getDay()
  const messages = [
    { title: '🔥 Don\'t break your streak!',       body: 'Complete today\'s challenge before midnight to keep your streak alive.',  url: '/dashboard' },
    { title: '🏆 The leaderboard just updated',    body: 'See where you stand among top Lens users right now.',                      url: '/leaderboard' },
    { title: '⭐ Someone might be rating you now',  body: 'Check your latest reflections and see what people think.',                 url: '/feed' },
    { title: '🌟 Time to reflect on someone',      body: 'Rate someone you know — it helps them grow and earns you XP.',             url: '/search' },
    { title: '🎯 Your score could be higher',      body: 'Ask someone who knows you well to reflect on you today.',                  url: '/dashboard' },
    { title: '🤝 Grow your Lens network',          body: 'More connections = more weight = higher score. Invite someone today.',     url: '/search' },
    { title: '💛 Good people deserve recognition', body: 'Is there someone in your life who\'s been there for you? Rate them now.',  url: '/search' },
  ]

  const msg = messages[day % messages.length]
  const payload = JSON.stringify(msg)

  const results = await Promise.allSettled(
    subs.map(s =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload
      )
    )
  )

  const failed = results
    .map((r, i) => (r.status === 'rejected' ? subs[i].endpoint : null))
    .filter(Boolean) as string[]
  if (failed.length) {
    await db.from('push_subscriptions').delete().in('endpoint', failed)
  }

  const sent = results.filter(r => r.status === 'fulfilled').length
  console.log(`[evening-push] sent=${sent} failed=${failed.length}`)
  return NextResponse.json({ sent, failed: failed.length })
}
