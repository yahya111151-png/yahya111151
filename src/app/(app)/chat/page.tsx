'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { avatarUrl, timeAgo } from '@/lib/utils'
import { MessageCircle, Loader2 } from 'lucide-react'

interface ConversationRow {
  id: string
  last_message: string | null
  last_at: string | null
  other: {
    id: string
    full_name: string
    username: string
    avatar_url: string | null
  }
  unread: number
}

export default function ChatListPage() {
  const router = useRouter()
  const [convos, setConvos] = useState<ConversationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [myId, setMyId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setMyId(user.id)

      const { data: rows } = await supabase
        .from('conversations')
        .select(`
          id, last_message, last_at,
          user_a, user_b,
          profile_a:profiles!conversations_user_a_fkey(id,full_name,username,avatar_url),
          profile_b:profiles!conversations_user_b_fkey(id,full_name,username,avatar_url)
        `)
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .order('last_at', { ascending: false })

      if (!rows) { setLoading(false); return }

      const formatted: ConversationRow[] = await Promise.all(rows.map(async (r: any) => {
        const other = r.user_a === user.id ? r.profile_b : r.profile_a

        // Count unread messages
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', r.id)
          .neq('sender_id', user.id)
          .is('read_at', null)

        return {
          id: r.id,
          last_message: r.last_message,
          last_at: r.last_at,
          other,
          unread: count ?? 0,
        }
      }))

      setConvos(formatted)
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={32} className="text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <MessageCircle size={20} className="text-primary" />
        <h1 className="font-black text-2xl text-foreground">Messages</h1>
      </div>

      {convos.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <p className="text-4xl mb-3">💬</p>
          <p className="font-semibold text-foreground">No conversations yet</p>
          <p className="text-sm mt-1">Find someone on Lens and start a conversation.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {convos.map(c => (
            <Link
              key={c.id}
              href={`/chat/${c.id}`}
              className="flex items-center gap-3 p-3.5 bg-surface border border-border rounded-2xl hover:border-primary/40 transition-colors"
            >
              <div className="relative shrink-0">
                <Image
                  src={c.other.avatar_url ?? avatarUrl(c.other.username)}
                  alt={c.other.full_name}
                  width={48}
                  height={48}
                  className="rounded-xl"
                />
                {c.unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full text-white text-[10px] font-black flex items-center justify-center">
                    {c.unread > 9 ? '9+' : c.unread}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold truncate ${c.unread > 0 ? 'text-foreground' : 'text-foreground/80'}`}>
                  {c.other.full_name}
                </p>
                <p className={`text-sm truncate ${c.unread > 0 ? 'text-foreground/70 font-medium' : 'text-muted'}`}>
                  {c.last_message ?? 'Start a conversation'}
                </p>
              </div>
              {c.last_at && (
                <p className="text-muted text-xs shrink-0">{timeAgo(c.last_at)}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
