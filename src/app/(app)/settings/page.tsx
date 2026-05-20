'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { avatarUrl, coverGradient } from '@/lib/utils'
import type { Profile } from '@/types'
import { Camera, MapPin, Loader2, CheckCircle, ChevronLeft, Upload, X, Bell, BellOff, Trash2, AlertTriangle } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import Link from 'next/link'
import { usePushNotifications } from '@/hooks/usePushNotifications'

type Section = 'profile' | 'contact' | 'privacy'

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [section, setSection] = useState<Section>('profile')
  const [locating, setLocating] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    full_name: '',
    username: '',
    bio: '',
    occupation: '',
    location: '',
    avatar_url: '',
    cover_photo_url: '',
    phone: '',
    phone_public: false,
    location_public: false,
    latitude: null as number | null,
    longitude: null as number | null,
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (!data) { router.push('/auth/login'); return }
      const p = data as Profile
      setProfile(p)
      setForm({
        full_name:       p.full_name ?? '',
        username:        p.username ?? '',
        bio:             p.bio ?? '',
        occupation:      p.occupation ?? '',
        location:        p.location ?? '',
        avatar_url:      p.avatar_url ?? '',
        cover_photo_url: p.cover_photo_url ?? '',
        phone:           p.phone ?? '',
        phone_public:    p.phone_public ?? false,
        location_public: p.location_public ?? false,
        latitude:        p.latitude ?? null,
        longitude:       p.longitude ?? null,
      })
      setLoading(false)
    }
    load()
  }, [router])

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))
  }

  function toggle(key: 'phone_public' | 'location_public') {
    setForm(f => ({ ...f, [key]: !f[key] }))
  }

  async function captureLocation() {
    setLocating(true)
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      )
      setForm(f => ({
        ...f,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        location_public: true,
      }))
    } catch {
      alert('Location access denied. Please allow location in your browser settings.')
    }
    setLocating(false)
  }

  async function uploadImage(file: File, type: 'avatar' | 'cover') {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Use a fixed path per type (no extension) so overwrites always hit the same object
    const path = `${user.id}/${type}`

    if (type === 'avatar') setUploadingAvatar(true)
    else setUploadingCover(true)

    // Remove the old file first so the subsequent upload is always a fresh INSERT
    // (Supabase storage upsert can silently fail when the UPDATE RLS has no WITH CHECK)
    await supabase.storage.from('avatars').remove([path])

    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, file, { contentType: file.type, cacheControl: '3600' })

    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      // Append cache-buster so the browser shows the new image immediately
      const freshUrl = `${publicUrl}?t=${Date.now()}`
      setForm(f => ({
        ...f,
        [type === 'avatar' ? 'avatar_url' : 'cover_photo_url']: freshUrl,
      }))
    } else {
      alert(`Upload failed: ${error.message}`)
    }

    if (type === 'avatar') setUploadingAvatar(false)
    else setUploadingCover(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Strip the cache-buster query param before persisting to DB
    const cleanUrl = (url: string) => url ? url.split('?')[0] : null

    await supabase.from('profiles').update({
      full_name:       form.full_name,
      bio:             form.bio || null,
      occupation:      form.occupation || null,
      location:        form.location || null,
      avatar_url:      cleanUrl(form.avatar_url),
      cover_photo_url: cleanUrl(form.cover_photo_url),
      phone:           form.phone || null,
      phone_public:    form.phone_public,
      latitude:        form.latitude,
      longitude:       form.longitude,
      location_public: form.location_public,
      updated_at:      new Date().toISOString(),
    }).eq('id', user.id)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 size={32} className="text-primary animate-spin" />
      </div>
    )
  }

  const avatar = form.avatar_url || avatarUrl(form.username)

  const SECTIONS: { key: Section; label: string }[] = [
    { key: 'profile',  label: 'Profile info' },
    { key: 'contact',  label: 'Contact & phone' },
    { key: 'privacy',  label: 'Privacy & location' },
  ]

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24 md:pb-8 space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href={`/profile/${profile?.username}`} className="p-2 rounded-xl hover:bg-surface transition-colors">
          <ChevronLeft size={20} className="text-muted" />
        </Link>
        <h1 className="font-black text-2xl text-foreground">Edit Profile</h1>
      </div>

      {/* Cover + avatar upload */}
      <div className="relative rounded-2xl overflow-visible">
        {/* Cover photo */}
        <button
          type="button"
          onClick={() => coverInputRef.current?.click()}
          disabled={uploadingCover}
          className="relative h-28 w-full rounded-2xl overflow-hidden group block"
          style={{
            background: form.cover_photo_url ? undefined : coverGradient(form.username),
            backgroundImage: form.cover_photo_url ? `url(${form.cover_photo_url})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gray-900/0 group-hover:bg-gray-900/40 transition-colors flex items-center justify-center">
            {uploadingCover ? (
              <Loader2 size={24} className="text-foreground animate-spin" />
            ) : (
              <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-foreground text-sm font-semibold bg-gray-900/50 px-3 py-1.5 rounded-lg">
                <Camera size={16} /> Change cover
              </span>
            )}
          </div>
        </button>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, 'cover') }}
        />

        {/* Avatar */}
        <div className="absolute bottom-0 left-4 translate-y-1/2">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="relative group"
          >
            <Avatar src={form.avatar_url || null} username={form.username} size={64} className="rounded-xl ring-4 ring-bg" />
            <div className="absolute inset-0 rounded-xl bg-gray-900/0 group-hover:bg-gray-900/50 transition-colors flex items-center justify-center">
              {uploadingAvatar ? (
                <Loader2 size={16} className="text-foreground animate-spin" />
              ) : (
                <Upload size={16} className="text-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, 'avatar') }}
          />
        </div>
      </div>

      {/* Notifications toggle */}
      <NotificationToggle />

      {/* Section tabs */}
      <div className="flex gap-1 bg-surface border border-border rounded-2xl p-1">
        {SECTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${
              section === s.key ? 'bg-primary/15 text-primary border border-primary/30' : 'text-muted hover:text-foreground'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="space-y-4">

        {/* PROFILE INFO */}
        {section === 'profile' && (
          <div className="space-y-3">
            <Field label="Full name">
              <input value={form.full_name} onChange={set('full_name')} required className={inputCls} placeholder="Your full name" />
            </Field>
            <Field label="Username">
              <input value={form.username} disabled className={`${inputCls} opacity-50 cursor-not-allowed`} />
              <p className="text-muted text-xs mt-1">Username cannot be changed.</p>
            </Field>
            <Field label="Bio">
              <textarea
                value={form.bio}
                onChange={set('bio')}
                rows={3}
                maxLength={160}
                placeholder="A short bio about yourself"
                className={`${inputCls} resize-none`}
              />
              <p className="text-muted text-xs text-right">{form.bio.length}/160</p>
            </Field>
            <Field label="Occupation">
              <input value={form.occupation} onChange={set('occupation')} className={inputCls} placeholder="e.g. Software Engineer" />
            </Field>
            <Field label="City / Location (text)">
              <input value={form.location} onChange={set('location')} className={inputCls} placeholder="e.g. New York, NY" />
            </Field>
            <div className="flex items-center gap-3 px-4 py-3 bg-surface border border-border rounded-xl">
              <Camera size={16} className="text-muted shrink-0" />
              <p className="text-muted text-xs">Tap your avatar or cover photo above to upload a new image (max 5 MB).</p>
            </div>
          </div>
        )}

        {/* CONTACT */}
        {section === 'contact' && (
          <div className="space-y-3">
            <Field label="Phone number">
              <input
                value={form.phone}
                onChange={set('phone')}
                type="tel"
                className={inputCls}
                placeholder="+1 555 000 0000"
              />
            </Field>
            <Toggle
              label="Allow phone search"
              description="Let others find your profile by your phone number"
              checked={form.phone_public}
              onChange={() => toggle('phone_public')}
            />
          </div>
        )}

        {/* PRIVACY & LOCATION */}
        {section === 'privacy' && (
          <div className="space-y-4">
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
              <p className="font-semibold text-foreground text-sm">Location discovery</p>
              <p className="text-muted text-xs leading-relaxed">
                When enabled, people nearby can discover your profile. Your exact coordinates are never shown.
              </p>

              {form.latitude && form.longitude ? (
                <div className="flex items-center gap-2 text-score-high text-sm">
                  <MapPin size={14} />
                  <span>Location saved ({form.latitude.toFixed(3)}, {form.longitude.toFixed(3)})</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={captureLocation}
                  disabled={locating}
                  className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-xl text-foreground text-sm hover:border-primary/40 transition-colors"
                >
                  {locating ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} className="text-primary" />}
                  {locating ? 'Getting location…' : 'Use my current location'}
                </button>
              )}

              <Toggle
                label="Show me in Nearby search"
                description="Appear in the 'Nearby' tab for users in your area"
                checked={form.location_public}
                onChange={() => toggle('location_public')}
              />

              {form.latitude && (
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, latitude: null, longitude: null, location_public: false }))}
                  className="text-red-400 text-xs underline"
                >
                  Remove saved location
                </button>
              )}
            </div>
          </div>
        )}

        {/* Save button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 disabled:opacity-50 transition-all shadow-glow-sm hover:shadow-glow-md flex items-center justify-center gap-2"
        >
          {saving ? (
            <><Loader2 size={18} className="animate-spin" /> Saving…</>
          ) : saved ? (
            <><CheckCircle size={18} /> Saved!</>
          ) : 'Save changes'}
        </button>
      </form>

      {/* Danger zone */}
      <DeleteAccountSection />
    </div>
  )
}

const inputCls = 'w-full px-4 py-3 bg-bg border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary/60 transition-colors text-sm'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground/80">{label}</label>
      {children}
    </div>
  )
}

function DeleteAccountSection() {
  const router = useRouter()
  const [open, setOpen]         = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [done, setDone]         = useState(false)
  const [typedWord, setTyped]   = useState('')
  const CONFIRM_WORD = 'DELETE'

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch('/api/delete-account', { method: 'DELETE' })
    if (res.ok) {
      setDone(true)
      setTimeout(() => router.push('/'), 1800)
    } else {
      setDeleting(false)
      alert('Something went wrong. Please try again.')
    }
  }

  if (done) {
    return (
      <div className="text-center py-8 space-y-2">
        <CheckCircle size={36} className="text-score-high mx-auto" />
        <p className="font-bold text-foreground">Account deleted</p>
        <p className="text-muted text-sm">Redirecting…</p>
      </div>
    )
  }

  return (
    <div className="border border-red-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setTyped('') }}
        className="w-full flex items-center gap-3 px-4 py-4 bg-red-50/60 hover:bg-red-50 transition-colors text-left"
      >
        <div className="w-9 h-9 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center shrink-0">
          <Trash2 size={16} className="text-red-500" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-red-600 text-sm">Delete account</p>
          <p className="text-red-400 text-xs">Permanently remove your profile and all data</p>
        </div>
        <span className="text-red-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {/* Confirmation panel */}
      {open && (
        <div className="px-4 pb-4 pt-3 bg-red-50/40 space-y-3 border-t border-red-100">
          <div className="flex items-start gap-2 p-3 bg-red-100/60 rounded-xl">
            <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-red-600 text-xs leading-relaxed">
              This permanently deletes your profile, all ratings you gave and received, and all messages.
              <strong className="block mt-1">This cannot be undone.</strong>
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-red-500">
              Type <strong>{CONFIRM_WORD}</strong> to confirm
            </label>
            <input
              type="text"
              value={typedWord}
              onChange={e => setTyped(e.target.value.toUpperCase())}
              placeholder={CONFIRM_WORD}
              className="w-full px-3 py-2 bg-white border border-red-200 rounded-xl text-sm text-foreground placeholder:text-red-200 focus:outline-none focus:border-red-400 transition-colors font-mono tracking-widest"
            />
          </div>

          <button
            type="button"
            onClick={handleDelete}
            disabled={typedWord !== CONFIRM_WORD || deleting}
            className="w-full py-2.5 bg-red-500 text-white font-bold rounded-xl text-sm hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {deleting
              ? <><Loader2 size={15} className="animate-spin" /> Deleting…</>
              : <><Trash2 size={15} /> Delete my account</>}
          </button>
        </div>
      )}
    </div>
  )
}

function NotificationToggle() {
  const { permission, subscribed, subscribe, unsubscribe } = usePushNotifications()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const isEnabled = subscribed || permission === 'granted'
  const isDenied  = permission === 'denied'

  async function handleToggle() {
    setLoading(true)
    setDone(false)
    if (isEnabled) {
      await unsubscribe()
    } else {
      await subscribe()
    }
    setLoading(false)
    setDone(true)
    setTimeout(() => setDone(false), 2000)
  }

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-4 bg-surface border border-border rounded-2xl">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isEnabled ? 'bg-primary/10 border border-primary/20' : 'bg-border/50 border border-border'}`}>
          {isEnabled
            ? <Bell size={18} className="text-primary" />
            : <BellOff size={18} className="text-muted" />}
        </div>
        <div>
          <p className="font-semibold text-foreground text-sm">Push notifications</p>
          <p className="text-muted text-xs">
            {isDenied
              ? 'Blocked in browser — enable in browser settings'
              : isEnabled
              ? 'You\'ll be notified when someone reflects on you'
              : 'Get notified when someone shares their thoughts on you'}
          </p>
        </div>
      </div>

      {isDenied ? (
        <span className="text-xs text-muted shrink-0">Blocked</span>
      ) : (
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`relative shrink-0 w-12 h-6 rounded-full transition-colors disabled:opacity-50 ${isEnabled ? 'bg-primary' : 'bg-border'}`}
          title={isEnabled ? 'Disable notifications' : 'Enable notifications'}
        >
          {loading
            ? <span className="absolute inset-0 flex items-center justify-center"><Loader2 size={12} className="text-white animate-spin" /></span>
            : <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${isEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
          }
        </button>
      )}
    </div>
  )
}

function Toggle({ label, description, checked, onChange }: {
  label: string; description: string; checked: boolean; onChange: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-foreground text-sm font-medium">{label}</p>
        <p className="text-muted text-xs mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-border'}`}
      >
        <span
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
        />
      </button>
    </div>
  )
}
