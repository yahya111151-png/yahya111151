'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function VisibilityToggle({
  ratingId,
  isVisible,
}: {
  ratingId: string
  isVisible: boolean
}) {
  const [visible, setVisible] = useState(isVisible)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function toggle() {
    setLoading(true)
    const next = !visible
    setVisible(next) // optimistic
    try {
      const res = await fetch('/api/admin/toggle-rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ratingId, isVisible: next }),
      })
      if (!res.ok) {
        setVisible(!next) // revert
        const data = await res.json()
        alert(data.error ?? 'Failed to update')
      } else {
        router.refresh()
      }
    } catch {
      setVisible(!next)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={visible ? 'Click to hide' : 'Click to show'}
      className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
        visible
          ? 'text-green-400 hover:text-gray-400 hover:bg-gray-700'
          : 'text-gray-600 hover:text-green-400 hover:bg-gray-700'
      }`}
    >
      {visible ? <Eye size={14} /> : <EyeOff size={14} />}
    </button>
  )
}
