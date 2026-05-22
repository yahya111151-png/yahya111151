import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { getTier } from '@/lib/tiers'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function isAuthorized(req: Request) {
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  return auth === `Bearer ${secret}`
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yahya111151.vercel.app'

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 })
  }

  const db = adminClient()
  const resend = new Resend(process.env.RESEND_API_KEY)

  // Get all profiles
  const { data: profiles } = await db
    .from('profiles')
    .select('id, full_name, username, aggregate_score, total_ratings, created_at')

  if (!profiles?.length) return NextResponse.json({ sent: 0 })

  // Get all auth users (for emails)
  const { data: { users } } = await db.auth.admin.listUsers({ perPage: 1000 })
  const emailMap: Record<string, string> = {}
  users?.forEach(u => { if (u.email) emailMap[u.id] = u.email })

  // Ratings received this week
  const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString()
  const { data: weekRatings } = await db
    .from('ratings')
    .select('rated_id, raw_avg_score')
    .gte('created_at', weekAgo)

  const weekRatingsMap: Record<string, { count: number; avgScore: number }> = {}
  weekRatings?.forEach(r => {
    if (!weekRatingsMap[r.rated_id]) weekRatingsMap[r.rated_id] = { count: 0, avgScore: 0 }
    weekRatingsMap[r.rated_id].count++
    weekRatingsMap[r.rated_id].avgScore += Number(r.raw_avg_score)
  })
  Object.values(weekRatingsMap).forEach(v => { v.avgScore = v.avgScore / v.count })

  let sent = 0
  const errors: string[] = []

  for (const profile of profiles) {
    const email = emailMap[profile.id]
    if (!email) continue

    const tier = getTier(profile.aggregate_score, profile.total_ratings)
    const weekData = weekRatingsMap[profile.id]
    const score = Number(profile.aggregate_score).toFixed(2)
    const nextTierMap: Record<string, string> = {
      explorer: 'Rising Star',
      rising: 'Trusted',
      trusted: 'Stellar',
      stellar: 'Legend',
      legend: '',
    }
    const nextTier = nextTierMap[tier.key]

    // Personalised subject lines
    const subjects = [
      `${profile.full_name}, your Lens score this week 📊`,
      `How you're doing on Lens this week ${tier.icon}`,
      weekData?.count
        ? `You got ${weekData.count} new reflection${weekData.count > 1 ? 's' : ''} this week ⭐`
        : `Don't fall behind on Lens this week 🔥`,
    ]
    const subject = subjects[new Date().getDate() % subjects.length]

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0d0823;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0823;padding:32px 16px;">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background:#1a1035;border-radius:20px;overflow:hidden;">

  <!-- Header -->
  <tr>
    <td style="background:linear-gradient(135deg,#2D1B69 0%,#1a0f40 100%);padding:28px 32px;text-align:center;">
      <div style="font-size:28px;font-weight:900;color:#FFD700;letter-spacing:-1px;">Lens</div>
      <div style="color:#a78bfa;font-size:12px;margin-top:3px;">Your weekly reflection summary</div>
    </td>
  </tr>

  <!-- Greeting -->
  <tr>
    <td style="padding:28px 32px 0;">
      <p style="color:#e5e7eb;font-size:20px;font-weight:800;margin:0 0 6px;">Hey ${profile.full_name} 👋</p>
      <p style="color:#9ca3af;font-size:14px;line-height:1.6;margin:0;">Here's how your week looked on Lens.</p>
    </td>
  </tr>

  <!-- Score card -->
  <tr>
    <td style="padding:20px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0823;border-radius:14px;border:1px solid #2d2052;">
        <tr>
          <td style="padding:20px 24px;">
            <table width="100%">
              <tr>
                <td>
                  <p style="color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Your score</p>
                  <p style="color:#FFD700;font-size:36px;font-weight:900;margin:0;font-family:monospace;">${score}</p>
                  <p style="color:#a78bfa;font-size:13px;margin:4px 0 0;">${tier.icon} ${tier.label}</p>
                </td>
                <td style="text-align:right;vertical-align:top;">
                  <p style="color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Total reflections</p>
                  <p style="color:#e5e7eb;font-size:28px;font-weight:900;margin:0;">${profile.total_ratings}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- This week -->
  ${weekData ? `
  <tr>
    <td style="padding:0 32px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#16213e;border-radius:14px;border:1px solid #1e3a5f;">
        <tr>
          <td style="padding:18px 24px;">
            <p style="color:#60a5fa;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">This week</p>
            <table width="100%">
              <tr>
                <td>
                  <p style="color:#e5e7eb;font-size:22px;font-weight:900;margin:0;">${weekData.count}</p>
                  <p style="color:#9ca3af;font-size:12px;margin:2px 0 0;">new reflection${weekData.count > 1 ? 's' : ''}</p>
                </td>
                <td style="text-align:right;">
                  <p style="color:#34d399;font-size:22px;font-weight:900;margin:0;">${weekData.avgScore.toFixed(1)}</p>
                  <p style="color:#9ca3af;font-size:12px;margin:2px 0 0;">avg score this week</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  ` : `
  <tr>
    <td style="padding:0 32px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1010;border-radius:14px;border:1px solid #3b1c1c;">
        <tr>
          <td style="padding:18px 24px;">
            <p style="color:#f87171;font-size:13px;font-weight:700;margin:0 0 4px;">😴 No reflections this week</p>
            <p style="color:#9ca3af;font-size:12px;margin:0;">Share your profile or ask someone to rate you — don't fall behind!</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  `}

  <!-- Next tier nudge -->
  ${nextTier ? `
  <tr>
    <td style="padding:0 32px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1f1040,#0d0823);border-radius:14px;border:1px solid #4c1d95;">
        <tr>
          <td style="padding:18px 24px;">
            <p style="color:#c4b5fd;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">Next milestone</p>
            <p style="color:#e5e7eb;font-size:14px;margin:0;">Reach <strong style="color:#FFD700;">${nextTier}</strong> to unlock better perks — free coffees, VIP access &amp; more. 🎁</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  ` : `
  <tr>
    <td style="padding:0 32px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1a1200,#0d0823);border-radius:14px;border:1px solid #92400e;">
        <tr>
          <td style="padding:18px 24px;">
            <p style="color:#fbbf24;font-size:13px;font-weight:700;margin:0 0 4px;">🏆 You've reached Legend status!</p>
            <p style="color:#9ca3af;font-size:12px;margin:0;">The highest tier on Lens. Keep your score high to maintain your exclusive perks.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  `}

  <!-- CTA buttons -->
  <tr>
    <td style="padding:0 32px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-right:8px;" width="50%">
            <a href="${APP_URL}/dashboard" style="display:block;background:#FFD700;color:#1a0f40;font-weight:900;font-size:14px;text-align:center;padding:14px;border-radius:12px;text-decoration:none;">
              Open Lens →
            </a>
          </td>
          <td style="padding-left:8px;" width="50%">
            <a href="${APP_URL}/leaderboard" style="display:block;background:#2d2052;color:#e5e7eb;font-weight:700;font-size:14px;text-align:center;padding:14px;border-radius:12px;text-decoration:none;border:1px solid #4c3d8f;">
              Leaderboard
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background:#0d0823;padding:18px 32px;text-align:center;">
      <p style="color:#4b5563;font-size:11px;margin:0;">
        Weekly summary from Lens · <a href="${APP_URL}" style="color:#6b7280;">Open app</a>
        <br/>© ${new Date().getFullYear()} Lens App
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`.trim()

    try {
      await resend.emails.send({
        from: 'Lens <onboarding@resend.dev>',
        to: email,
        subject,
        html,
      })
      sent++
    } catch (err: any) {
      errors.push(`${email}: ${err.message}`)
    }

    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 100))
  }

  console.log(`[weekly-email] sent=${sent} errors=${errors.length}`)
  return NextResponse.json({ sent, errors: errors.length, details: errors.slice(0, 5) })
}
