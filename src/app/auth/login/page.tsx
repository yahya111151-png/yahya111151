'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-glow-primary pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm space-y-6 animate-slide-up">
        <div className="text-center">
          <Link href="/" className="text-3xl font-black tracking-tight">
            <span className="text-white">nose</span>
            <span className="text-primary">dive</span>
          </Link>
          <p className="text-muted mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-white/80">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-white placeholder:text-muted focus:outline-none focus:border-primary/60 transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-white/80">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
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
            className="w-full py-3 bg-primary text-bg font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-glow-sm hover:shadow-glow-md"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-muted text-sm">
          No account?{' '}
          <Link href="/auth/signup" className="text-primary hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  )
}
