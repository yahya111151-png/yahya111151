import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Checks that the current user is an admin.
 * Admin emails are set in ADMIN_EMAILS env var (comma-separated).
 * Call this at the top of every admin Server Component.
 * Returns the current user's email on success.
 */
export async function requireAdmin(): Promise<{ userId: string; email: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)

  if (!user.email || !adminEmails.includes(user.email.toLowerCase())) {
    redirect('/dashboard') // not an admin — send home
  }

  return { userId: user.id, email: user.email }
}
