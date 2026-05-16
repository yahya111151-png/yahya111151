import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-glow-primary pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 text-center max-w-lg space-y-6 animate-slide-up">
        <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-2">
          Reputation, quantified
        </div>

        <h1 className="text-6xl font-black tracking-tight">
          <span className="text-white">nose</span>
          <span className="text-primary" style={{ textShadow: '0 0 30px rgba(192,132,252,0.5)' }}>dive</span>
        </h1>

        <p className="text-muted text-lg leading-relaxed">
          Rate the people in your life. Be rated by them. Your score reflects{' '}
          <span className="text-white font-medium">who you really are</span> — weighted by how well they know you.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/auth/signup"
            className="px-8 py-3 bg-primary text-bg font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-glow-sm hover:shadow-glow-md"
          >
            Get Started
          </Link>
          <Link
            href="/auth/login"
            className="px-8 py-3 bg-surface border border-border text-white font-semibold rounded-2xl hover:border-primary/40 transition-colors"
          >
            Sign In
          </Link>
        </div>

        <div className="flex items-center justify-center gap-8 pt-4 text-muted text-sm">
          <div className="text-center">
            <p className="text-white font-bold text-2xl">6</p>
            <p>metrics</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="text-white font-bold text-2xl">∞</p>
            <p>connections</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <p className="text-white font-bold text-2xl">1</p>
            <p>score</p>
          </div>
        </div>
      </div>
    </main>
  )
}
