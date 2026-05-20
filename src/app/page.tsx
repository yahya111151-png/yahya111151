import Link from 'next/link'
import { Star, Users, Trophy, Shield, Zap, Eye, ChevronRight } from 'lucide-react'
import Logo from '@/components/ui/Logo'

const FEATURES = [
  {
    icon: Star,
    title: '8 dimensions of a person',
    desc: 'Kindness, friendship, humor, honesty — then leadership, reliability, creativity, and professionalism.',
  },
  {
    icon: Users,
    title: 'Weighted by closeness',
    desc: "A close friend's perspective carries more weight than a stranger's. Proximity matters.",
  },
  {
    icon: Trophy,
    title: 'Community Spotlight',
    desc: 'Standing uses confidence levels — more voices means a more accurate picture.',
  },
  {
    icon: Shield,
    title: 'Always anonymous',
    desc: 'Perspectives stay private. Honest thoughts without social pressure.',
  },
  {
    icon: Zap,
    title: 'Live impression',
    desc: 'Your impression updates the moment someone shares their thoughts. Watch it in real time.',
  },
  {
    icon: Eye,
    title: 'See the full picture',
    desc: 'Radar charts, dimension breakdowns, and trend data — not just a single number.',
  },
]

const MOCK_PROFILES = [
  { name: 'Sarah K.',  username: 'sarah_k',  score: '+4.21', color: '#16a34a', ratings: 38 },
  { name: 'James L.', username: 'james_l',  score: '+2.88', color: '#d97706', ratings: 14 },
  { name: 'Maya T.',  username: 'maya_t',   score: '+3.74', color: '#16a34a', ratings: 61 },
  { name: 'Omar R.',  username: 'omar_r',   score: '-1.20', color: '#dc2626', ratings: 9  },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Find someone', desc: 'Search by name, scan their QR code, or browse people nearby.' },
  { step: '02', title: 'Share your thoughts', desc: 'Weigh in on each dimension on a −5 to +5 scale. Your closeness to them shapes your impact.' },
  { step: '03', title: 'See the truth', desc: 'Their impression updates instantly. Check the Spotlight — or your own profile.' },
]

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden">

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center px-4 pt-20 pb-12 overflow-hidden">

        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-rose-50 via-white to-white pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/6 rounded-full blur-3xl pointer-events-none" />

        {/* Content — no absolute children inside, so nothing can overlap */}
        <div className="relative z-10 text-center max-w-2xl w-full space-y-6 animate-slide-up">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold">
            <Eye size={14} />
            Social reputation, quantified
          </div>

          {/* Wordmark + slogan */}
          <div className="flex flex-col items-center gap-3">
            <Logo wordmark size={56} textSize="text-7xl sm:text-8xl" className="tracking-tight leading-none" />
            <p className="text-2xl sm:text-3xl font-black text-foreground/80 tracking-tight">
              See through people, See More.
            </p>
          </div>

          {/* Description */}
          <p className="text-muted text-lg sm:text-xl leading-relaxed max-w-md mx-auto">
            Discover how the people around you see you across{' '}
            <span className="text-foreground font-semibold">8 dimensions</span>.
            Your closeness to them shapes how much your perspective counts.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
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

          {/* Trust strip */}
          <div className="flex items-center justify-center gap-6 text-sm text-muted pt-2">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-score-high" />
              Always anonymous
            </span>
            <span className="w-px h-4 bg-border" />
            <span>Free to join</span>
            <span className="w-px h-4 bg-border" />
            <span>Works on mobile</span>
          </div>
        </div>

        {/* Profile cards row — below content, no overlap possible */}
        <div className="relative z-10 w-full max-w-2xl mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {MOCK_PROFILES.map((p) => (
            <div
              key={p.name}
              className="flex items-center gap-2.5 px-3 py-2.5 bg-white/90 border border-rose-100 rounded-2xl shadow-sm select-none"
            >
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-xs font-black text-primary shrink-0">
                {p.name[0]}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-foreground text-xs truncate">{p.name}</p>
                <p className="text-[11px] font-semibold" style={{ color: p.color }}>{p.score}</p>
              </div>
            </div>
          ))}
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
                <p className="text-5xl font-black text-primary/15 leading-none mb-3">{step.step}</p>
                <h3 className="font-black text-foreground text-lg mb-2">{step.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{step.desc}</p>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden sm:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-0.5">
                    <ChevronRight size={18} className="text-border" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Score showcase ── */}
      <section className="py-20 px-4 bg-rose-50/40">
        <div className="max-w-4xl mx-auto flex flex-col lg:flex-row items-center gap-12">

          {/* Left: text */}
          <div className="flex-1 space-y-4">
            <p className="text-primary text-sm font-bold uppercase tracking-widest">Your impression</p>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground leading-tight">
              A picture that actually<br />means something
            </h2>
            <p className="text-muted leading-relaxed">
              Measured on a −5 to +5 scale. A close friend's perspective carries more weight than a
              stranger's. The more people who know you, the clearer your picture becomes.
            </p>
            <ul className="space-y-2 text-sm">
              {['Weighted by proximity', 'Per-dimension breakdown', 'Radar chart overview', 'Anonymous — no pressure'].map(item => (
                <li key={item} className="flex items-center gap-2 text-foreground/80">
                  <span className="w-4 h-4 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: mock profile card */}
          <div className="w-full max-w-xs bg-white border border-border rounded-3xl p-5 shadow-glow-sm shrink-0">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-300 to-pink-400 flex items-center justify-center text-xl font-black text-white shadow-sm">
                Y
              </div>
              <div className="flex-1">
                <p className="font-black text-foreground">Your Name</p>
                <p className="text-muted text-sm">@username</p>
              </div>
              <div className="text-right">
                <p className="font-black text-2xl text-score-high">+3.74</p>
                <p className="text-muted text-xs">impression</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {[
                { name: 'Kindness',   icon: '💛', pct: 91 },
                { name: 'Humor',      icon: '😄', pct: 68 },
                { name: 'Honesty',    icon: '🫂', pct: 78 },
                { name: 'Leadership', icon: '🎯', pct: 74 },
              ].map(m => (
                <div key={m.name} className="flex items-center gap-2">
                  <span className="text-sm w-5 text-center shrink-0">{m.icon}</span>
                  <p className="text-xs text-muted w-20 shrink-0">{m.name}</p>
                  <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${m.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted">
              <span>24 reflections received</span>
              <span className="text-primary font-semibold">Spot #12 →</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-primary text-sm font-bold uppercase tracking-widest mb-2">Built for depth</p>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground">Everything you need to understand people</h2>
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
            Ready to see<br />
            <span className="text-primary">through people?</span>
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
              See Spotlight
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-4 border-t border-border bg-white">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <Logo wordmark size={18} textSize="text-xl" />
          <p className="text-muted text-sm">See through people, See More.</p>
          <div className="flex gap-4 text-sm text-muted">
            <Link href="/auth/login"  className="hover:text-primary transition-colors">Sign in</Link>
            <Link href="/auth/signup" className="hover:text-primary transition-colors">Sign up</Link>
            <Link href="/leaderboard" className="hover:text-primary transition-colors">Spotlight</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
