'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { avatarUrl, timeAgo } from '@/lib/utils'
import { ChevronLeft, Send, Loader2 } from 'lucide-react'

interface Message {
  id: string
  sender_id: string
  body: string
  read_at: string | null
  created_at: string
}

interface OtherUser {
  id: string
  full_name: string
  username: string
  avatar_url: string | null
}

export default function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const router = useRouter()

  const [messages, setMessages]     = useState<Message[]>([])
  const [other, setOther]           = useState<OtherUser | null>(null)
  const [myId, setMyId]             = useState<string | null>(null)
  const [draft, setDraft]           = useState('')
  const [sending, setSending]       = useState(false)
  const [loading, setLoading]       = useState(true)
  const bottomRef                   = useRef<HTMLDivElement>(null)
  const inputRef                    = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setMyId(user.id)

      // Get conversation + other user
      const { data: convo } = await supabase
        .from('conversations')
        .select(`
          id, user_a, user_b,
          profile_a:profiles!conversations_user_a_fkey(id,full_name,username,avatar_url),
          profile_b:profiles!conversations_user_b_fkey(id,full_name,username,avatar_url)
        `)
        .eq('id', conversationId)
        .single()

      if (!convo) { router.push('/chat'); return }

      const otherProfile = convo.user_a === user.id ? (convo as any).profile_b : (convo as any).profile_a
      setOther(otherProfile)

      // Load messages
      const { data: msgs } = await supabase
        .from('messages')
        .select('id,sender_id,body,read_at,created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(100)

      setMessages((msgs as Message[]) ?? [])
      setLoading(false)

      // Mark incoming messages as read
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .is('read_at', null)
    }
    load()
  }, [conversationId, router])

  // Scroll after messages load
  useEffect(() => {
    if (!loading) setTimeout(scrollToBottom, 50)
  }, [loading, scrollToBottom])

  // Realtime subscription
  useEffect(() => {
    if (loading) return
    const supabase = createClient()

    const channel = supabase
      .channel(`convo-${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        async (payload) => {
          const msg = payload.new as Message
          setMessages(prev => {
            if (prev.find(m => m.id === msg.id)) return prev
            return [...prev, msg]
          })
          setTimeout(scrollToBottom, 50)

          // Mark as read if it's from the other person
          if (msg.sender_id !== myId) {
            await supabase
              .from('messages')
              .update({ read_at: new Date().toISOString() })
              .eq('id', msg.id)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId, loading, myId, scrollToBottom])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const body = draft.trim()
    if (!body || !myId || sending) return

    setSending(true)
    setDraft('')

    const supabase = createClient()

    // Optimistic
    const tempId = `temp-${Date.now()}`
    const optimistic: Message = {
      id: tempId,
      sender_id: myId,
      body,
      read_at: null,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])
    setTimeout(scrollToBottom, 50)

    const { data: msg, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: myId, body })
      .select('id,sender_id,body,read_at,created_at')
      .single()

    if (!error && msg) {
      // Replace optimistic with real
      setMessages(prev => prev.map(m => m.id === tempId ? (msg as Message) : m))

      // Update conversation last_message
      await supabase
        .from('conversations')
        .update({ last_message: body, last_at: new Date().toISOString() })
        .eq('id', conversationId)
    } else {
      // Rollback
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setDraft(body)
    }

    setSending(false)
    inputRef.current?.focus()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={32} className="text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[100dvh] md:h-[calc(100vh-3.5rem)] max-w-lg mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-bg/95 backdrop-blur-sm shrink-0">
        <Link href="/chat" className="text-muted hover:text-foreground transition-colors">
          <ChevronLeft size={22} />
        </Link>
        {other && (
          <>
            <Link href={`/profile/${other.username}`}>
              <Image
                src={other.avatar_url ?? avatarUrl(other.username)}
                alt={other.full_name}
                width={40}
                height={40}
                className="rounded-xl"
              />
            </Link>
            <Link href={`/profile/${other.username}`} className="flex-1 min-w-0">
              <p className="font-bold text-foreground truncate">{other.full_name}</p>
              <p className="text-muted text-xs">@{other.username}</p>
            </Link>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.length === 0 && (
          <div className="text-center py-12 text-muted">
            <p className="text-3xl mb-2">👋</p>
            <p className="text-sm">Say hello to {other?.full_name.split(' ')[0]}!</p>
          </div>
        )}
        {messages.map((m, i) => {
          const isMine = m.sender_id === myId
          const prevSame = i > 0 && messages[i - 1].sender_id === m.sender_id
          return (
            <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${prevSame ? 'mt-0.5' : 'mt-3'}`}>
              <div className="max-w-[75%] space-y-0.5">
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMine
                      ? 'bg-primary text-white rounded-br-md'
                      : 'bg-surface border border-border text-foreground rounded-bl-md'
                  }`}
                >
                  {m.body}
                </div>
                {!prevSame && (
                  <p className={`text-[10px] text-muted ${isMine ? 'text-right' : 'text-left'} px-1`}>
                    {timeAgo(m.created_at)}
                    {isMine && m.read_at && ' · Seen'}
                  </p>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-3 px-4 py-3 border-t border-border bg-bg/95 backdrop-blur-sm shrink-0"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
      >
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder={`Message ${other?.full_name.split(' ')[0] ?? ''}…`}
          className="flex-1 px-4 py-2.5 bg-surface border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary/60 transition-colors text-sm"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center disabled:opacity-40 transition-all shadow-glow-sm hover:shadow-glow-md shrink-0"
        >
          {sending ? <Loader2 size={16} className="text-white animate-spin" /> : <Send size={16} className="text-white" />}
        </button>
      </form>
    </div>
  )
}
