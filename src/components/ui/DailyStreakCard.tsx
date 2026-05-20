'use client'

import { useState, useEffect } from 'react'
import { getDailyChallenge, simulatedProfileViews } from '@/lib/tiers'
import { Flame, Eye, Zap } from 'lucide-react'
import Link from 'next/link'

interface DailyStreakCardProps {
  username: string
}

const STREAK_KEY = 'lens_streak'

interface StreakData {
  count:     number
  lastDate:  string   // YYYY-MM-DD
  donToday:  boolean
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function DailyStreakCard({ username }: DailyStreakCardProps) {
  const [streak,    setStreak]    = useState<StreakData>({ count: 0, lastDate: '', donToday: false })
  const [hydrated,  setHydrated]  = useState(false)
  const challenge = getDailyChallenge()
  const views     = simulatedProfileViews(username)

  useEffect(() => {
    const today = todayStr()
    let raw: StreakData
    try {
      raw = JSON.parse(localStorage.getItem(STREAK_KEY) ?? 'null')
    } catch { raw = null as any }

    if (!raw) {
      raw = { count: 1, lastDate: today, donToday: false }
    } else {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yStr = yesterday.toISOString().slice(0, 10)

      if (raw.lastDate === today) {
        // same day — keep as-is
      } else if (raw.lastDate === yStr) {
        // consecutive day — but don't auto-increment; they need to do the challenge
        raw = { ...raw, donToday: false }
      } else {
        // streak broken
        raw = { count: 1, lastDate: today, donToday: false }
      }
    }

    localStorage.setItem(STREAK_KEY, JSON.stringify(raw))
    setStreak(raw)
    setHydrated(true)
  }, [])

  if (!hydrated) return null

  const streakColor = streak.count >= 7 ? 'text-orange-500' : streak.count >= 3 ? 'text-amber-500' : 'text-muted'

  return (
    <div className="space-y-3">
      {/* Streak + profile views row */}
      <div className="grid grid-cols-2 gap-3">

        {/* Streak counter */}
        <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Flame size={18} className={streakColor} />
            <span className={`font-black text-2xl tabular-nums ${streakColor}`}>{streak.count}</span>
            <span className="text-muted text-xs mt-auto mb-0.5">day{streak.count !== 1 ? 's' : ''}</span>
          </div>
          <p className="text-muted text-xs leading-tight">
            {streak.donToday ? '✅ Streak secured today!' : 'Daily streak'}
          </p>
          {streak.count >= 7 && (
            <span className="mt-1 text-[10px] font-bold text-orange-500 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5 self-start">
              🔥 On fire!
            </span>
          )}
        </div>

        {/* Profile views */}
        <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Eye size={18} className="text-primary" />
            <span className="font-black text-2xl tabular-nums text-foreground">{views}</span>
          </div>
          <p className="text-muted text-xs leading-tight">people viewed your profile today</p>
          <span className="mt-1 text-[10px] font-semibold text-primary self-start">
            {views >= 15 ? '📈 Trending!' : views >= 8 ? '👀 Getting noticed' : '👋 Gaining traction'}
          </span>
        </div>
      </div>

      {/* Daily challenge */}
      <Link
        href="/search"
        className="flex items-center gap-4 p-4 bg-surface border border-border rounded-2xl hover:border-primary/40 hover:shadow-glow-sm transition-all group"
      >
        <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xl shrink-0">
          {challenge.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Zap size={13} className="text-primary shrink-0" />
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Daily challenge</span>
          </div>
          <p className="text-sm font-semibold text-foreground mt-0.5 leading-snug">{challenge.label}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs font-black text-primary">+{challenge.xp}</p>
          <p className="text-[10px] text-muted">XP</p>
        </div>
      </Link>
    </div>
  )
}
