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
          background: 'linear-gradient(135deg,#fff0f3 0%,#ffffff 60%,#fce7ec 100%)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: 'sans-serif', gap: 24,
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 900, color: '#1c1b22' }}>
          Le<span style={{ color: '#e8476a' }}>ns</span>
        </div>
        <div style={{ fontSize: 48, fontWeight: 900, color: '#1c1b22' }}>{name}</div>
        <div style={{ fontSize: 24, color: '#64748b' }}>@{user}</div>
        <div style={{
          display: 'flex', gap: 40, marginTop: 16,
          background: '#fff', borderRadius: 24, padding: '20px 48px',
          border: '2px solid #fce7ec',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 52, fontWeight: 900, color: '#e8476a' }}>{score}</div>
            <div style={{ fontSize: 18, color: '#94a3b8' }}>Score</div>
          </div>
          <div style={{ width: 2, background: '#fce7ec' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 52, fontWeight: 900, color: '#1c1b22' }}>{count}</div>
            <div style={{ fontSize: 18, color: '#94a3b8' }}>Ratings</div>
          </div>
        </div>
        <div style={{ fontSize: 18, color: '#94a3b8', marginTop: 8 }}>
          See through people, See More.
        </div>
      </div>
    ),
    { ...size }
  )
}
