// ── Tier definitions ──────────────────────────────────────────────────────────
// Score is on a -5 to +5 scale. Tier requires BOTH score threshold AND
// a minimum number of reflections (so gaming is hard).

export interface Tier {
  key:   'explorer' | 'rising' | 'trusted' | 'stellar' | 'legend'
  label: string
  icon:  string
  color: string          // CSS color for badge
  bg:    string          // tailwind bg class
  border:string          // tailwind border class
  text:  string          // tailwind text class
  minScore:    number
  minRatings:  number
  perks: string[]
  perkIcons: string[]
  tagline: string
}

export const TIERS: Tier[] = [
  {
    key: 'explorer',
    label: 'Explorer',
    icon: '🔭',
    color: '#94a3b8',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    text: 'text-slate-500',
    minScore: -99,
    minRatings: 0,
    perks: ['Access the Lens app', 'Share impressions of people you know', 'View public profiles'],
    perkIcons: ['📱', '💬', '👁️'],
    tagline: 'Just getting started. Keep growing.',
  },
  {
    key: 'rising',
    label: 'Rising Star',
    icon: '🌟',
    color: '#d97706',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-600',
    minScore: 1.0,
    minRatings: 5,
    perks: ['Free coffee at Lens partner cafés', 'Priority in search results', 'Rising Star profile badge'],
    perkIcons: ['☕', '🔝', '🌟'],
    tagline: 'People are noticing. Keep it up.',
  },
  {
    key: 'trusted',
    label: 'Trusted',
    icon: '🤝',
    color: '#2563eb',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-600',
    minScore: 2.0,
    minRatings: 15,
    perks: ['Exclusive discounts at partner businesses', 'Trusted badge on your profile', 'Access to Lens Trusted events'],
    perkIcons: ['🏷️', '🤝', '🎟️'],
    tagline: 'Consistently great. People trust you.',
  },
  {
    key: 'stellar',
    label: 'Stellar',
    icon: '⭐',
    color: '#7c3aed',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    text: 'text-violet-600',
    minScore: 3.0,
    minRatings: 30,
    perks: ['VIP access at partner venues', 'Free upgrades & priority service', 'Stellar badge + exclusive profile frame'],
    perkIcons: ['👑', '⬆️', '⭐'],
    tagline: 'You stand out. The best around you.',
  },
  {
    key: 'legend',
    label: 'Legend',
    icon: '🏆',
    color: '#b45309',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    minScore: 4.0,
    minRatings: 50,
    perks: ['All Stellar perks', 'Legend status in the Lens community', 'Exclusive partner deals & lifetime rewards'],
    perkIcons: ['🏆', '🌍', '🎁'],
    tagline: 'You\'re one of a kind. Truly.',
  },
]

/** Returns the current tier for a given score + rating count */
export function getTier(score: number, totalRatings: number): Tier {
  // Walk tiers highest → lowest, return first match
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (score >= TIERS[i].minScore && totalRatings >= TIERS[i].minRatings) {
      return TIERS[i]
    }
  }
  return TIERS[0] // Explorer fallback
}

/** Returns the next tier, or null if already Legend */
export function getNextTier(current: Tier): Tier | null {
  const idx = TIERS.findIndex(t => t.key === current.key)
  return idx < TIERS.length - 1 ? TIERS[idx + 1] : null
}

/** 0-100 progress toward next tier, based on score */
export function progressToNextTier(score: number, totalRatings: number): number {
  const current = getTier(score, totalRatings)
  const next    = getNextTier(current)
  if (!next) return 100 // already Legend

  // Progress = whichever is the more limiting factor (score OR ratings)
  const scorePct   = Math.min(100, Math.max(0,
    ((score - current.minScore) / (next.minScore - current.minScore)) * 100
  ))
  const ratingPct  = Math.min(100, Math.max(0,
    ((totalRatings - current.minRatings) / (next.minRatings - current.minRatings)) * 100
  ))

  return Math.round(Math.min(scorePct, ratingPct))
}

/** Deterministic "profile view" count — looks real, changes daily per user */
export function simulatedProfileViews(username: string): number {
  const today = new Date().toISOString().slice(0, 10)
  let hash = 0
  for (const ch of username + today) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return 3 + (hash % 24) // 3–26 views
}

/** Daily challenges — deterministic by weekday */
export const DAILY_CHALLENGES = [
  { icon: '⭐', label: 'Rate 1 person you know today',         xp: 10 },
  { icon: '💬', label: 'Leave a thoughtful comment on a reflection', xp: 15 },
  { icon: '🔍', label: 'Discover someone new on Lens',         xp: 8  },
  { icon: '📤', label: 'Share your Lens profile with someone', xp: 12 },
  { icon: '🤝', label: 'Rate 2 people you work with',          xp: 20 },
  { icon: '🌟', label: 'Rate someone with 0 reflections',      xp: 18 },
  { icon: '🔗', label: 'Invite a friend to join Lens',         xp: 25 },
]

export function getDailyChallenge() {
  const day = new Date().getDay() // 0-6
  return DAILY_CHALLENGES[day]
}
