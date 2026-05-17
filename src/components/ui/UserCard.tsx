import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'
import { formatScore, scoreColor } from '@/lib/utils'
import type { Profile } from '@/types'

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
          <p className="font-semibold text-white text-sm truncate">{profile.full_name}</p>
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
    <Link
      href={`/profile/${profile.username}`}
      className="flex items-center gap-4 p-4 rounded-2xl bg-surface border border-border hover:border-primary/40 hover:shadow-glow-sm transition-all duration-200"
    >
      <Avatar src={profile.avatar_url} username={profile.username} size={56} className="rounded-full ring-2 ring-border" />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white truncate">{profile.full_name}</p>
        <p className="text-muted text-sm truncate">@{profile.username}</p>
        {profile.occupation && (
          <p className="text-muted text-xs truncate mt-0.5">{profile.occupation}</p>
        )}
      </div>
      {showScore && profile.total_ratings > 0 && (
        <div className="flex flex-col items-end shrink-0">
          <span className={`font-bold text-xl tabular-nums ${scoreColor(profile.aggregate_score)}`}>
            {formatScore(profile.aggregate_score)}
          </span>
          <span className="text-muted text-xs">{profile.total_ratings} ratings</span>
        </div>
      )}
    </Link>
  )
}
