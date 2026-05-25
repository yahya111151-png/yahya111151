import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'
export const size    = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OgImage({ params }: { params: { username: string } }) {
  const supabase = await createClient()
  const { data: p } = await supabase
    .from('profile_with_metrics')
    .select('full_name,username,aggregate_score,total_ratings')
    .eq('username', params.username)
    .single()

  const name  = p?.full_name ?? 'Lens Profile'
  const user  = p?.username  ?? ''
  const score = p ? `${p.aggregate_score >= 0 ? '+' : ''}${Number(p.aggregate_score).toFixed(2)}` : '—'
  const count = p?.total_ratings ?? 0

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%',
          background: 'linear-gradient(135deg,#2D1B69 0%,#0d0823 60%,#1a1035 100%)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: 'sans-serif', gap: 24,
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 900, color: '#ffffff' }}>
          Le<span style={{ color: '#FFD700' }}>ns</span>
        </div>
        <div style={{ fontSize: 48, fontWeight: 900, color: '#e5e7eb' }}>{name}</div>
        <div style={{ fontSize: 24, color: '#a78bfa' }}>@{user}</div>
        <div style={{
          display: 'flex', gap: 40, marginTop: 16,
          background: '#1a1035', borderRadius: 24, padding: '20px 48px',
          border: '2px solid #2d2052',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 52, fontWeight: 900, color: '#FFD700' }}>{score}</div>
            <div style={{ fontSize: 18, color: '#9ca3af' }}>Score</div>
          </div>
          <div style={{ width: 2, background: '#2d2052' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 52, fontWeight: 900, color: '#e5e7eb' }}>{count}</div>
            <div style={{ fontSize: 18, color: '#9ca3af' }}>Ratings</div>
          </div>
        </div>
        <div style={{ fontSize: 18, color: '#a78bfa', marginTop: 8 }}>
          See through people, See More.
        </div>
      </div>
    ),
    { ...size }
  )
}
