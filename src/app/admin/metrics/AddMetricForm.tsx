'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AddMetricForm({ nextOrder }: { nextOrder: number }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('')
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/add-metric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim(), icon: icon.trim(), sort_order: nextOrder }),
      })
      if (res.ok) {
        setName(''); setDescription(''); setIcon('')
        router.refresh()
      } else {
        const d = await res.json()
        alert(d.error ?? 'Failed to add metric')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <input
          value={icon}
          onChange={e => setIcon(e.target.value)}
          placeholder="📊"
          maxLength={4}
          className="w-16 px-2 py-2 text-sm rounded-xl bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-yellow-400 text-center"
        />
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Metric name (e.g. Honesty)"
          required
          className="flex-1 px-3 py-2 text-sm rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400"
        />
      </div>
      <input
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Short description (optional)"
        className="w-full px-3 py-2 text-sm rounded-xl bg-gray-800 border border-gray-700 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-yellow-400"
      />
      <button
        type="submit"
        disabled={saving || !name.trim()}
        className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl bg-yellow-400 text-gray-900 hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Plus size={16} />
        {saving ? 'Adding…' : 'Add metric'}
      </button>
    </form>
  )
}
