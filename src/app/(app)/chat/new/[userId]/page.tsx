'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function NewChatPage() {
  const { userId } = useParams<{ userId: string }>()
  const router = useRouter()

  useEffect(() => {
    async function start() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: convoId, error } = await supabase.rpc('get_or_create_conversation', {
        p_other_id: userId,
      })

      if (!error && convoId) {
        router.replace(`/chat/${convoId}`)
      } else {
        router.replace('/chat')
      }
    }
    start()
  }, [userId, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 size={32} className="text-primary animate-spin" />
    </div>
  )
}
