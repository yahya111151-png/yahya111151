'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import UserCard from '@/components/ui/UserCard'
import QRScanner from '@/components/ui/QRScanner'
import { avatarUrl, scoreColor, distanceLabel } from '@/lib/utils'
import type { Profile, NearbyUser } from '@/types'
import { Search, MapPin, QrCode, Phone, Loader2, Navigation } from 'lucide-react'

type Tab = 'search' | 'nearby' | 'qr' | 'phone'

const TABS = [
  { key: 'search' as Tab, icon: Search,     label: 'Search'   },
  { key: 'nearby' as Tab, icon: MapPin,     label: 'Nearby'   },
  { key: 'qr'     as Tab, icon: QrCode,     label: 'QR Scan'  },
  { key: 'phone'  as Tab, icon: Phone,      label: 'Phone'    },
]

export default function SearchPage() {
  const [tab, setTab] = useState<Tab>('search')

  // ── Text search ──
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<Profile[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched]   = useState(false)

  // ── Nearby ──
  const [nearbyUsers, setNearbyUsers]   = useState<NearbyUser[]>([])
  const [nearbyLoading, setNearbyLoading] = useState(false)
  const [nearbyError, setNearbyError]   = useState<string | null>(null)
  const [locationGranted, setLocationGranted] = useState(false)

  // ── Phone ──
  const [phone, setPhone]         = useState('')
  const [phoneResult, setPhoneResult] = useState<Profile | null>(null)
  const [phoneSearched, setPhoneSearched] = useState(false)
  const [phoneLoading, setPhoneLoading]   = useState(false)

  const textSearch = useCallback(async (q: string) => {
    setSearching(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    let query_builder = supabase
      .from('profiles')
      .select('*')
      .order('aggregate_score', { ascending: false })
      .limit(50)
    if (user) query_builder = query_builder.neq('id', user.id)
    if (q.trim()) {
      query_builder = query_builder.or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
    }
    const { data } = await query_builder
    setResults((data as Profile[]) ?? [])
    setSearched(true)
    setSearching(false)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => textSearch(query), 300)
    return () => clearTimeout(t)
  }, [query, textSearch])

  // Load all users on mount
  useEffect(() => { textSearch('') }, [textSearch])

  async function getNearby() {
    setNearbyLoading(true)
    setNearbyError(null)
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      )
      setLocationGranted(true)
      const { latitude, longitude } = pos.coords
      const supabase = createClient()
      const { data, error } = await supabase.rpc('get_nearby_users', {
        user_lat: latitude,
        user_lng: longitude,
        radius_km: 50,
        max_results: 20,
      })
      if (error) throw error
      setNearbyUsers((data as NearbyUser[]) ?? [])
    } catch (err: any) {
      if (err?.code === 1) {
        setNearbyError('Location access denied. Please allow location in your browser settings.')
      } else {
        setNearbyError('Could not get your location. Try again.')
      }
    }
    setNearbyLoading(false)
  }

  async function searchByPhone() {
    if (!phone.trim()) return
    setPhoneLoading(true); setPhoneSearched(true)
    const supabase = createClient()
    const { data } = await supabase.rpc('find_by_phone', { search_phone: phone.trim() })
    setPhoneResult(data?.[0] ?? null)
    setPhoneLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4 animate-fade-in">
      <h1 className="font-black text-2xl text-white">Find people</h1>

      {/* Tab bar */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-surface border border-border rounded-2xl">
        {TABS.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all ${
              tab === key
                ? 'bg-primary/15 text-primary border border-primary/30'
                : 'text-muted hover:text-white'
            }`}
          >
            <Icon size={18} strokeWidth={tab === key ? 2.5 : 1.8} />
            {label}
          </button>
        ))}
      </div>

      {/* ── TEXT SEARCH ── */}
      {tab === 'search' && (
        <div className="space-y-4">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name or username…"
              autoFocus
              className="w-full pl-11 pr-4 py-3.5 bg-surface border border-border rounded-2xl text-white placeholder:text-muted focus:outline-none focus:border-primary/60 transition-colors"
            />
            {searching && <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted animate-spin" />}
          </div>

          {searching && results.length === 0 && (
            <div className="flex justify-center py-10">
              <Loader2 size={28} className="text-primary animate-spin" />
            </div>
          )}
          {searched && !searching && results.length === 0 && (
            <div className="text-center py-10 text-muted">
              <p className="text-3xl mb-2">🔍</p>
              <p>No users found for <span className="text-white">"{query}"</span></p>
            </div>
          )}
          {results.length > 0 && (
            <div className="space-y-2">
              <p className="text-muted text-sm">
                {query.trim() ? `${results.length} result${results.length !== 1 ? 's' : ''}` : `${results.length} users`}
              </p>
              {results.map(p => <UserCard key={p.id} profile={p} />)}
            </div>
          )}
        </div>
      )}

      {/* ── NEARBY ── */}
      {tab === 'nearby' && (
        <div className="space-y-4">
          {!locationGranted && !nearbyLoading && nearbyUsers.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Navigation size={36} className="text-primary" />
              </div>
              <div>
                <p className="font-semibold text-white">Discover people nearby</p>
                <p className="text-muted text-sm mt-1 max-w-xs">
                  Find Nosedive users within 50 km of you. Only users who opted in appear here.
                </p>
              </div>
              <button
                onClick={getNearby}
                className="px-8 py-3 bg-primary text-bg font-bold rounded-2xl shadow-glow-sm hover:shadow-glow-md transition-all"
              >
                Enable Location
              </button>
            </div>
          )}

          {nearbyLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="text-primary animate-spin" />
            </div>
          )}

          {nearbyError && (
            <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
              {nearbyError}
              <button onClick={getNearby} className="block mx-auto mt-2 underline text-xs">Try again</button>
            </div>
          )}

          {locationGranted && nearbyUsers.length === 0 && !nearbyLoading && (
            <div className="text-center py-10 text-muted">
              <p className="text-3xl mb-2">🗺️</p>
              <p className="text-white font-semibold">No one nearby</p>
              <p className="text-sm mt-1">No users with location enabled within 50 km.</p>
              <button onClick={getNearby} className="mt-4 px-6 py-2 bg-surface border border-border rounded-xl text-white text-sm">
                Refresh
              </button>
            </div>
          )}

          {nearbyUsers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-muted text-sm">{nearbyUsers.length} people nearby</p>
                <button onClick={getNearby} className="text-primary text-xs hover:underline">Refresh</button>
              </div>
              {nearbyUsers.map(u => (
                <Link
                  key={u.id}
                  href={`/profile/${u.username}`}
                  className="flex items-center gap-3 p-3 bg-surface border border-border rounded-xl hover:border-primary/40 transition-colors"
                >
                  <Image
                    src={u.avatar_url ?? avatarUrl(u.username)}
                    alt={u.full_name}
                    width={48}
                    height={48}
                    className="rounded-xl"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{u.full_name}</p>
                    <p className="text-muted text-xs">@{u.username}</p>
                    {u.occupation && <p className="text-muted/70 text-xs truncate">{u.occupation}</p>}
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <p className={`font-bold text-sm tabular-nums ${scoreColor(u.aggregate_score)}`}>
                      {u.aggregate_score.toFixed(2)}
                    </p>
                    <p className="flex items-center gap-1 text-muted text-xs">
                      <MapPin size={10} /> {distanceLabel(u.distance_km)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── QR SCAN ── */}
      {tab === 'qr' && <QRScanner />}

      {/* ── PHONE ── */}
      {tab === 'phone' && (
        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-2xl p-4 text-sm text-muted">
            <p className="text-white font-semibold mb-1">Find by phone number</p>
            <p>Only users who opted to make their phone public will appear.</p>
          </div>

          <div className="flex gap-2">
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchByPhone()}
              placeholder="+1 555 000 0000"
              className="flex-1 px-4 py-3.5 bg-surface border border-border rounded-2xl text-white placeholder:text-muted focus:outline-none focus:border-primary/60 transition-colors"
            />
            <button
              onClick={searchByPhone}
              disabled={phoneLoading || !phone.trim()}
              className="px-5 py-3 bg-primary text-bg font-bold rounded-2xl disabled:opacity-50 transition-all shadow-glow-sm"
            >
              {phoneLoading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            </button>
          </div>

          {phoneSearched && !phoneLoading && !phoneResult && (
            <div className="text-center py-10 text-muted">
              <p className="text-3xl mb-2">📵</p>
              <p>No user found with that number.</p>
            </div>
          )}

          {phoneResult && (
            <div className="space-y-2">
              <p className="text-muted text-sm">Found 1 user</p>
              <UserCard profile={phoneResult as any} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
