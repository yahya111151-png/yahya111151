'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { avatarUrl, coverGradient } from '@/lib/utils'
import type { Profile } from '@/types'
import { Camera, MapPin, Loader2, CheckCircle, ChevronLeft, Upload, X } from 'lucide-react'
import Avatar from '@/components/ui/Avatar'
import Link from 'next/link'

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

    const ext = file.name.split('.').pop()
    const path = `${user.id}/${type}.${ext}`

    if (type === 'avatar') setUploadingAvatar(true)
    else setUploadingCover(true)

    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })

    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      const bustedUrl = `${publicUrl}?t=${Date.now()}`
      setForm(f => ({
        ...f,
        [type === 'avatar' ? 'avatar_url' : 'cover_photo_url']: bustedUrl,
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

    await supabase.from('profiles').update({
      full_name:       form.full_name,
      bio:             form.bio || null,
      occupation:      form.occupation || null,
      location:        form.location || null,
      avatar_url:      form.avatar_url || null,
      cover_photo_url: form.cover_photo_url || null,
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
        <h1 className="font-black text-2xl text-white">Edit Profile</h1>
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
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            {uploadingCover ? (
              <Loader2 size={24} className="text-white animate-spin" />
            ) : (
              <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-white text-sm font-semibold bg-black/50 px-3 py-1.5 rounded-lg">
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
            <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
              {uploadingAvatar ? (
                <Loader2 size={16} className="text-white animate-spin" />
              ) : (
                <Upload size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
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

      {/* Section tabs */}
      <div className="flex gap-1 mt-8 bg-surface border border-border rounded-2xl p-1">
        {SECTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${
              section === s.key ? 'bg-primary/15 text-primary border border-primary/30' : 'text-muted hover:text-white'
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
              <p className="font-semibold text-white text-sm">Location discovery</p>
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
                  className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-xl text-white text-sm hover:border-primary/40 transition-colors"
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
          className="w-full py-3.5 bg-primary text-bg font-bold rounded-2xl hover:bg-primary/90 disabled:opacity-50 transition-all shadow-glow-sm hover:shadow-glow-md flex items-center justify-center gap-2"
        >
          {saving ? (
            <><Loader2 size={18} className="animate-spin" /> Saving…</>
          ) : saved ? (
            <><CheckCircle size={18} /> Saved!</>
          ) : 'Save changes'}
        </button>
      </form>
    </div>
  )
}

const inputCls = 'w-full px-4 py-3 bg-bg border border-border rounded-xl text-white placeholder:text-muted focus:outline-none focus:border-primary/60 transition-colors text-sm'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-white/80">{label}</label>
      {children}
    </div>
  )
}

function Toggle({ label, description, checked, onChange }: {
  label: string; description: string; checked: boolean; onChange: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-white text-sm font-medium">{label}</p>
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
