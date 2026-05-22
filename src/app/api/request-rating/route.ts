import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import webpush from 'web-push'
import { Resend } from 'resend'

function initWebPush() {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
}

function adminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: Request) {
  // 1. Auth — get the requester
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { profileId } = await req.json()
  if (!profileId) return NextResponse.json({ error: 'Missing profileId' }, { status: 400 })
  if (profileId === user.id) return NextResponse.json({ error: 'Cannot request from yourself' }, { status: 400 })

  const db = adminClient()

  // 2. Get requester's name
  const { data: requester } = await db
    .from('profiles')
    .select('full_name, username')
    .eq('id', user.id)
    .single()

  if (!requester) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  // 3. Get target user's profile + email
  const { data: target } = await db
    .from('profiles')
    .select('full_name, username')
    .eq('id', profileId)
    .single()

  if (!target) return NextResponse.json({ error: 'Target not found' }, { status: 404 })

  // Get target email from auth.users
  const { data: authUser } = await db.auth.admin.getUserById(profileId)
  const targetEmail = authUser?.user?.email

  const requesterName = requester.full_name ?? `@${requester.username}`
  const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://yahya111151.vercel.app'}/profile/${requester.username}`
  const rateUrl    = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://yahya111151.vercel.app'}/rate/${user.id}`

  // 4. Push notification
  try {
    initWebPush()
    const { data: subs } = await db
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', profileId)

    if (subs?.length) {
      const payload = JSON.stringify({
        title: `${requesterName} wants your rating ⭐`,
        body: `Tap to reflect on ${requesterName} on Lens.`,
        url: rateUrl,
      })

      const results = await Promise.allSettled(
        subs.map(s =>
          webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload
          )
        )
      )

      // Clean up stale subscriptions
      const failed = results
        .map((r, i) => (r.status === 'rejected' ? subs[i].endpoint : null))
        .filter(Boolean) as string[]
      if (failed.length) {
        await db.from('push_subscriptions').delete().eq('user_id', profileId).in('endpoint', failed)
      }
    }
  } catch (err) {
    console.error('Push notification failed:', err)
    // Don't fail the whole request — email still goes out
  }

  // 5. Email via Resend
  if (targetEmail && process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'Lens <onboarding@resend.dev>',
        to: targetEmail,
        subject: `${requesterName} wants you to rate them on Lens ⭐`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#0d0823;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0823;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#1a1035;border-radius:16px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#2D1B69,#1a0f40);padding:32px;text-align:center;">
              <div style="font-size:32px;font-weight:900;color:#FFD700;letter-spacing:-1px;">Lens</div>
              <div style="color:#a78bfa;font-size:13px;margin-top:4px;">Social Reflection Platform</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px;">
              <p style="color:#e5e7eb;font-size:22px;font-weight:800;margin:0 0 8px;">
                ⭐ ${requesterName} wants your honest reflection
              </p>
              <p style="color:#9ca3af;font-size:15px;line-height:1.6;margin:0 0 28px;">
                Hey ${target.full_name ?? target.username},<br/><br/>
                <strong style="color:#e5e7eb;">${requesterName}</strong> has asked you to reflect on them on Lens.
                Your honest rating helps them grow and unlocks real rewards.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                <tr>
                  <td style="background:#FFD700;border-radius:12px;padding:14px 32px;text-align:center;">
                    <a href="${rateUrl}" style="color:#1a0f40;font-weight:900;font-size:16px;text-decoration:none;">
                      Rate ${requesterName} now →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- View profile link -->
              <p style="text-align:center;margin:0 0 24px;">
                <a href="${profileUrl}" style="color:#a78bfa;font-size:13px;">
                  View ${requesterName}'s profile first
                </a>
              </p>

              <hr style="border:none;border-top:1px solid #2d2052;margin:0 0 24px;" />

              <!-- Info blurb -->
              <p style="color:#6b7280;font-size:12px;line-height:1.6;margin:0;text-align:center;">
                Ratings on Lens are honest and can be anonymous.<br/>
                High-rated users unlock free perks at partner businesses.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0d0823;padding:20px 32px;text-align:center;">
              <p style="color:#4b5563;font-size:11px;margin:0;">
                You received this because ${requesterName} requested a rating on Lens.
                <br/>© ${new Date().getFullYear()} Lens App
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `.trim(),
      })
    } catch (err) {
      console.error('Email send failed:', err)
    }
  }

  return NextResponse.json({ ok: true })
}
