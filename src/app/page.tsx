import Link from 'next/link'
import { Star, Users, Trophy, Shield, Zap, Eye, ChevronRight } from 'lucide-react'

const FEATURES = [
  {
    icon: Star,
    title: '8 rating dimensions',
    desc: 'Intelligence, kindness, humor, honesty and more — get a full picture of a person.',
  },
  {
    icon: Users,
    title: 'Weighted by closeness',
    desc: "A friend's rating carries more weight than a stranger's. Proximity matters.",
  },
  {
    icon: Trophy,
    title: 'Live leaderboard',
    desc: 'Rankings use confidence scoring — more ratings means more influence on your rank.',
  },
  {
    icon: Shield,
    title: 'Anonymous ratings',
    desc: 'Raters stay private. Honest feedback without social pressure.',
  },
  {
    icon: Zap,
    title: 'Instant score',
    desc: 'Your score updates the moment a rating is submitted. Watch it move in real time.',
  },
  {
    icon: Eye,
    title: 'See the full picture',
    desc: 'Radar charts, metric breakdowns, and trend data — not just a single number.',
  },
]

const MOCK_PROFILES = [
  { name: 'Sarah K.',   score: '+4.21', color: '#16a34a', angle: '-6deg',  x: '-260px', y: '0px'   },
  { name: 'James L.',  score: '+2.88', color: '#d97706', angle:  '4deg',  x:  '260px', y: '20px'  },
  { name: 'Maya T.',   score: '+3.74', color: '#16a34a', angle: '-3deg',  x: '-180px', y: '120px' },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Find someone', desc: 'Search by name, scan their QR code, or browse people nearby.' },
  { step: '02', title: 'Rate them', desc: 'Score each dimension on a −5 to +5 scale. Your closeness to them weights your impact.' },
  { step: '03', title: 'See the truth', desc: 'Their score updates instantly. Check the leaderboard — or your own profile.' },
]

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden">

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20 overflow-hidden">

        {/* Background gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-rose-50 via-white to-white pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-primary/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

        {/* Floating mock profile cards — desktop only */}
        {MOCK_PROFILES.map((p) => (
          <div
            key={p.name}
            className="hidden lg:flex absolute items-center gap-3 px-4 py-3 bg-white/80 backdrop-blur-sm border border-rose-100 rounded-2xl shadow-glow-sm pointer-events-none select-none"
            style={{
              left: '50%',
              top: '50%',
              transform: `translate(calc(-50% + ${p.x}), calc(-50% + ${p.y})) rotate(${p.angle})`,
              opacity: 0.85,
            }}
          >
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-black text-primary shrink-0">
              {p.name[0]}
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">{p.name}</p>
              <p className="text-xs" style={{ color: p.color }}>{p.score}</p>
            </div>
          </div>
        ))}

        {/* Hero content */}
        <div className="relative z-10 text-center max-w-2xl space-y-6 animate-slide-up">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold">
            <Eye size={14} />
            Social reputation, quantified
          </div>

          {/* Wordmark */}
          <div className="space-y-1">
            <h1 className="text-7xl sm:text-8xl font-black tracking-tight leading-none">
              <span className="text-foreground">Le</span><span className="text-primary">ns</span>
            </h1>
            <p className="text-3xl sm:text-4xl font-black text-foreground/80 tracking-tight">
              See More.
            </p>
          </div>

          {/* Sub-tagline */}
          <p className="text-muted text-lg sm:text-xl leading-relaxed max-w-lg mx-auto">
            Rate the people around you across <span className="text-foreground font-semibold">8 dimensions</span>.
            Your closeness to them shapes how much your opinion counts.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/auth/signup"
              className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-glow-sm hover:shadow-glow-md text-lg"
            >
              Get Started
              <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-white border border-border text-foreground font-semibold rounded-2xl hover:border-primary/40 hover:shadow-glow-sm transition-all text-lg"
            >
              Sign In
            </Link>
          </div>

          {/* Social proof strip */}
          <div className="flex items-center justify-center gap-6 pt-4 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-score-high animate-pulse" />
              Anonymous ratings
            </span>
            <span className="w-px h-4 bg-border" />
            <span>Free to join</span>
            <span className="w-px h-4 bg-border" />
            <span>Works on mobile</span>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-muted/60 text-xs animate-bounce">
          <div className="w-px h-6 bg-gradient-to-b from-transparent to-muted/40" />
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-primary text-sm font-bold uppercase tracking-widest mb-2">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground">Three steps to clarity</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <div
                key={step.step}
                className="relative p-6 rounded-3xl border border-border bg-surface hover:border-primary/30 hover:shadow-glow-sm transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl font-black text-primary/20 leading-none">{step.step}</span>
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div className="hidden sm:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                      <ChevronRight size={20} className="text-border" />
                    </div>
                  )}
                </div>
                <h3 className="font-black text-foreground text-lg mb-2">{step.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Score showcase ── */}
      <section className="py-20 px-4 bg-gradient-to-b from-white to-rose-50/60">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-primary text-sm font-bold uppercase tracking-widest mb-2">Your score</p>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground">A number that actually means something</h2>
            <p className="text-muted mt-3 max-w-md mx-auto">
              Rated on a −5 to +5 scale. A close friend's vote counts more than a stranger's.
              Confidence grows with every rating.
            </p>
          </div>

          {/* Mock score card */}
          <div className="max-w-sm mx-auto bg-white border border-border rounded-3xl p-6 shadow-glow-sm">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-200 to-pink-300 flex items-center justify-center text-2xl font-black text-white shadow-glow-sm">
                Y
              </div>
              <div>
                <p className="font-black text-foreground text-lg">Your Name</p>
                <p className="text-muted text-sm">@username</p>
              </div>
              <div className="ml-auto text-right">
                <p className="font-black text-3xl text-score-high">+3.74</p>
                <p className="text-muted text-xs">aggregate score</p>
              </div>
            </div>

            {/* Metric bars */}
            <div className="space-y-2">
              {[
                { name: 'Intelligence', icon: '🧠', val: 0.82 },
                { name: 'Kindness',     icon: '💛', val: 0.91 },
                { name: 'Humor',        icon: '😄', val: 0.68 },
                { name: 'Honesty',      icon: '🤝', val: 0.78 },
              ].map(m => (
                <div key={m.name} className="flex items-center gap-3">
                  <span className="text-base w-6 text-center shrink-0">{m.icon}</span>
                  <p className="text-xs text-muted w-20 shrink-0">{m.name}</p>
                  <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${m.val * 100}%` }}
                    />
                  </div>
                  <p className="text-xs font-bold text-primary w-8 text-right shrink-0">
                    +{((m.val * 10) - 5).toFixed(1)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-primary text-sm font-bold uppercase tracking-widest mb-2">Built for depth</p>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground">Everything you need to see clearly</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="p-5 rounded-2xl border border-border bg-surface hover:border-primary/30 hover:shadow-glow-sm transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <Icon size={18} className="text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-1">{title}</h3>
                <p className="text-muted text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-4 bg-gradient-to-b from-rose-50/60 to-white">
        <div className="max-w-lg mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold">
            <Eye size={14} />
            Join Lens today
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-foreground leading-tight">
            Ready to<br />
            <span className="text-primary">See More?</span>
          </h2>
          <p className="text-muted text-lg">
            Create your profile in seconds. Start rating. See where you stand.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/signup"
              className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-glow-sm hover:shadow-glow-md text-lg"
            >
              Create your profile
              <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-surface border border-border text-foreground font-semibold rounded-2xl hover:border-primary/40 hover:shadow-glow-sm transition-all text-lg"
            >
              <Trophy size={18} className="text-primary" />
              See leaderboard
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-4 border-t border-border bg-white">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-black text-xl">
            <span className="text-foreground">Le</span><span className="text-primary">ns</span>
          </span>
          <p className="text-muted text-sm">See More. Know more. Be honest.</p>
          <div className="flex gap-4 text-sm text-muted">
            <Link href="/auth/login"  className="hover:text-primary transition-colors">Sign in</Link>
            <Link href="/auth/signup" className="hover:text-primary transition-colors">Sign up</Link>
            <Link href="/leaderboard" className="hover:text-primary transition-colors">Leaderboard</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
