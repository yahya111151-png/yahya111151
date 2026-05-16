'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', fullName: '', username: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    // Check username uniqueness
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', form.username.toLowerCase())
      .single()

    if (existing) {
      setError('Username already taken. Try another.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          username: form.username.toLowerCase(),
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-glow-primary pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm space-y-6 animate-slide-up">
        <div className="text-center">
          <Link href="/" className="text-3xl font-black tracking-tight">
            <span className="text-white">nose</span>
            <span className="text-primary">dive</span>
          </Link>
          <p className="text-muted mt-2">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-white/80">Full Name</label>
              <input
                required
                value={form.fullName}
                onChange={set('fullName')}
                placeholder="Alex Chen"
                className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-white placeholder:text-muted focus:outline-none focus:border-primary/60 transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-white/80">Username</label>
              <input
                required
                value={form.username}
                onChange={set('username')}
                placeholder="alex_c"
                pattern="[a-zA-Z0-9_]+"
                title="Letters, numbers, underscores only"
                className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-white placeholder:text-muted focus:outline-none focus:border-primary/60 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-white/80">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={set('email')}
              placeholder="you@example.com"
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-white placeholder:text-muted focus:outline-none focus:border-primary/60 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-white/80">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={set('password')}
              placeholder="Min. 8 characters"
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-white placeholder:text-muted focus:outline-none focus:border-primary/60 transition-colors"
            />
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-bg font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all shadow-glow-sm hover:shadow-glow-md"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-muted text-sm">
          Have an account?{' '}
          <Link href="/auth/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
