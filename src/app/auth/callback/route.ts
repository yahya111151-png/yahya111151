import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (pairs) => pairs.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Create profile if this is the first social login
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!existing) {
        const meta = data.user.user_metadata
        const email = data.user.email ?? ''
        const baseName = (meta.full_name ?? meta.name ?? email.split('@')[0] ?? 'user').replace(/\s+/g, '_').toLowerCase()
        // Make username unique by appending random suffix
        const username = `${baseName}_${Math.random().toString(36).slice(2, 6)}`

        await supabase.from('profiles').insert({
          id: data.user.id,
          username,
          full_name: meta.full_name ?? meta.name ?? 'New User',
          avatar_url: meta.avatar_url ?? meta.picture ?? null,
        })
      }

      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=oauth_failed`)
}
