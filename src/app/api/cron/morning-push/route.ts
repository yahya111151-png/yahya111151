import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'
import { getDailyChallenge } from '@/lib/tiers'

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

// Vercel calls crons with Authorization: Bearer CRON_SECRET
function isAuthorized(req: Request) {
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret) return true // no secret set → allow (dev mode)
  return auth === `Bearer ${secret}`
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://see-more-lens.vercel.app'

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  initWebPush()
  const db = adminClient()
  const challenge = getDailyChallenge()

  // Simulated profile view count (1–12 range for FOMO)
  const viewHint = Math.floor(Math.random() * 8) + 3

  // Get all push subscriptions
  const { data: subs } = await db
    .from('push_subscriptions')
    .select('user_id, endpoint, p256dh, auth')

  if (!subs?.length) return NextResponse.json({ sent: 0 })

  const messages = [
    {
      title: `${challenge.icon} Daily challenge is live!`,
      body: `${challenge.label} — earn ${challenge.xp} XP today`,
      url: '/dashboard',
    },
    {
      title: `👀 ${viewHint} people viewed your profile`,
      body: "Check who's been looking at your Lens score",
      url: '/dashboard',
    },
    {
      title: '⭐ Your daily Lens challenge awaits',
      body: `${challenge.label}`,
      url: '/dashboard',
    },
  ]

  // Rotate message based on day of week for variety
  const msg = messages[new Date().getDay() % messages.length]
  const payload = JSON.stringify({ ...msg })

  const results = await Promise.allSettled(
    subs.map(s =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload
      )
    )
  )

  // Clean up expired subscriptions
  const failed = results
    .map((r, i) => (r.status === 'rejected' ? subs[i].endpoint : null))
    .filter(Boolean) as string[]
  if (failed.length) {
    await db.from('push_subscriptions').delete().in('endpoint', failed)
  }

  const sent = results.filter(r => r.status === 'fulfilled').length
  console.log(`[morning-push] sent=${sent} failed=${failed.length}`)
  return NextResponse.json({ sent, failed: failed.length })
}
