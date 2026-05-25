import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'
import { formatScore, scoreColor } from '@/lib/utils'
import type { Profile } from '@/types'
import { Star } from 'lucide-react'

interface UserCardProps {
  profile: Profile
  showScore?: boolean
  compact?: boolean
}

export default function UserCard({ profile, showScore = true, compact = false }: UserCardProps) {
  if (compact) {
    return (
      <Link
        href={`/profile/${profile.username}`}
        className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border hover:border-primary/40 transition-colors"
      >
        <Avatar src={profile.avatar_url} username={profile.username} size={40} className="rounded-full" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">{profile.full_name}</p>
          <p className="text-muted text-xs truncate">@{profile.username}</p>
        </div>
        {showScore && (
          <span className={`font-bold text-sm tabular-nums ${scoreColor(profile.aggregate_score)}`}>
            {formatScore(profile.aggregate_score)}
          </span>
        )}
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface border border-border hover:border-primary/30 transition-all duration-200 group">
      {/* Avatar + name — links to profile */}
      <Link href={`/profile/${profile.username}`} className="flex items-center gap-4 flex-1 min-w-0">
        <Avatar src={profile.avatar_url} username={profile.username} size={52} className="rounded-xl ring-2 ring-border shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-foreground truncate">{profile.full_name}</p>
          <p className="text-muted text-sm truncate">@{profile.username}</p>
          {profile.occupation && (
            <p className="text-muted text-xs truncate mt-0.5">{profile.occupation}</p>
          )}
        </div>
      </Link>

      {/* Right side: score + reflect button */}
      <div className="flex flex-col items-end gap-2 shrink-0">
        {showScore && profile.total_ratings > 0 && (
          <div className="text-right">
            <span className={`font-bold text-lg tabular-nums ${scoreColor(profile.aggregate_score)}`}>
              {formatScore(profile.aggregate_score)}
            </span>
            <p className="text-muted text-[10px]">{profile.total_ratings} ratings</p>
          </div>
        )}
        {/* Primary action: Reflect */}
        <Link
          href={`/rate/${profile.id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-[#1a0f40] text-xs font-black rounded-xl shadow-glow-sm hover:shadow-glow-md hover:bg-primary/90 transition-all active:scale-95"
          onClick={e => e.stopPropagation()}
        >
          <Star size={11} fill="#1a0f40" />
          Reflect
        </Link>
      </div>
    </div>
  )
}
