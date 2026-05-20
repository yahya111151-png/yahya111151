'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GripVertical, Pencil, Trash2, Check, X } from 'lucide-react'

interface Metric {
  id: string
  name: string
  description: string | null
  icon: string | null
  sort_order: number
  active: boolean
}

export default function MetricRow({
  metric,
  usageCount,
}: {
  metric: Metric
  usageCount: number
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(metric.name)
  const [description, setDescription] = useState(metric.description ?? '')
  const [icon, setIcon] = useState(metric.icon ?? '')
  const [active, setActive] = useState(metric.active)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const router = useRouter()

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/update-metric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: metric.id, name, description, icon, active }),
      })
      if (res.ok) { setEditing(false); router.refresh() }
      else { const d = await res.json(); alert(d.error ?? 'Failed') }
    } finally { setSaving(false) }
  }

  async function toggleActive() {
    const next = !active
    setActive(next)
    const res = await fetch('/api/admin/update-metric', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: metric.id, active: next }),
    })
    if (!res.ok) setActive(!next)
    else router.refresh()
  }

  async function handleDelete() {
    const res = await fetch('/api/admin/delete-metric', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: metric.id }),
    })
    if (res.ok) router.refresh()
    else { const d = await res.json(); alert(d.error ?? 'Failed') }
  }

  return (
    <div className={`flex items-start gap-3 px-5 py-4 ${!active ? 'opacity-50' : ''}`}>
      {/* Drag handle (visual only) */}
      <GripVertical size={16} className="text-gray-700 mt-1 shrink-0" />

      {/* Icon */}
      <div className="w-9 h-9 rounded-xl bg-gray-800 flex items-center justify-center text-lg shrink-0">
        {metric.icon ?? '📊'}
      </div>

      {/* Content */}
      {editing ? (
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <input
              value={icon}
              onChange={e => setIcon(e.target.value)}
              placeholder="Icon"
              className="w-16 px-2 py-1.5 text-sm rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-yellow-400"
            />
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Metric name"
              className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-yellow-400"
            />
          </div>
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full px-3 py-1.5 text-sm rounded-lg bg-gray-800 border border-gray-700 text-gray-300 focus:outline-none focus:border-yellow-400"
          />
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-yellow-400 text-gray-900 hover:bg-yellow-300 disabled:opacity-50 transition-colors"
            >
              <Check size={12} /> Save
            </button>
            <button
              onClick={() => { setEditing(false); setName(metric.name); setDescription(metric.description ?? ''); setIcon(metric.icon ?? '') }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
            >
              <X size={12} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-white font-semibold">{metric.name}</p>
            {!active && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-700 text-gray-500 font-semibold uppercase tracking-wide">
                Inactive
              </span>
            )}
          </div>
          {metric.description && (
            <p className="text-gray-500 text-xs mt-0.5">{metric.description}</p>
          )}
          <p className="text-gray-700 text-[10px] mt-1">{usageCount.toLocaleString()} rating scores</p>
        </div>
      )}

      {/* Actions */}
      {!editing && (
        <div className="flex items-center gap-1 shrink-0">
          {/* Active toggle */}
          <button
            onClick={toggleActive}
            title={active ? 'Deactivate' : 'Activate'}
            className={`w-9 h-5 rounded-full transition-colors relative ${active ? 'bg-green-500' : 'bg-gray-700'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${active ? 'left-4' : 'left-0.5'}`} />
          </button>

          <button
            onClick={() => setEditing(true)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <Pencil size={13} />
          </button>

          {confirmDelete ? (
            <>
              <button
                onClick={handleDelete}
                className="px-2 py-1 text-[10px] font-bold rounded-md bg-red-600 text-white hover:bg-red-500 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 text-[10px] rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
              >
                No
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={usageCount > 0}
              title={usageCount > 0 ? 'Cannot delete — metric has usage data' : 'Delete metric'}
              className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
