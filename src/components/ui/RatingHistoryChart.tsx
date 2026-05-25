'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, ReferenceLine, CartesianGrid, Area, AreaChart,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface DataPoint {
  received_at: string
  raw_score: number
  running_avg: number
}

interface Props {
  userId: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const avg   = payload.find((p: any) => p.dataKey === 'running_avg')?.value
  const score = payload.find((p: any) => p.dataKey === 'raw_score')?.value
  return (
    <div className="bg-surface border border-border rounded-xl px-3 py-2 shadow-glow-sm text-xs">
      <p className="text-muted mb-1">{label}</p>
      {score  !== undefined && <p className="text-foreground/70">Rating: <span className="font-bold text-foreground">{score >= 0 ? '+' : ''}{Number(score).toFixed(1)}</span></p>}
      {avg    !== undefined && <p className="text-primary">Avg: <span className="font-bold">{avg >= 0 ? '+' : ''}{Number(avg).toFixed(2)}</span></p>}
    </div>
  )
}

export default function RatingHistoryChart({ userId }: Props) {
  const [data, setData] = useState<DataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: rows } = await supabase.rpc('get_rating_history', { p_user_id: userId })
      setData((rows as DataPoint[]) ?? [])
      setLoading(false)
    }
    load()
  }, [userId])

  if (loading) return <div className="h-40 bg-border/30 rounded-2xl animate-pulse" />
  if (data.length < 2) return null

  const first = Number(data[0].running_avg)
  const last  = Number(data[data.length - 1].running_avg)
  const diff  = last - first
  const trend = diff > 0.05 ? 'up' : diff < -0.05 ? 'down' : 'flat'

  const chartData = data.map(d => ({
    date:        formatDate(d.received_at),
    raw_score:   Number(d.raw_score),
    running_avg: Number(d.running_avg),
  }))

  // y-axis domain with padding
  const allVals = data.flatMap(d => [Number(d.raw_score), Number(d.running_avg)])
  const yMin = Math.max(-5, Math.floor(Math.min(...allVals)) - 0.5)
  const yMax = Math.min(5,  Math.ceil(Math.max(...allVals))  + 0.5)

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted uppercase tracking-wider font-semibold">Score history</p>
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${
          trend === 'up'   ? 'bg-score-high/10 text-score-high' :
          trend === 'down' ? 'bg-score-low/10 text-score-low'   :
                             'bg-border text-muted'
        }`}>
          {trend === 'up'   && <TrendingUp  size={12} />}
          {trend === 'down' && <TrendingDown size={12} />}
          {trend === 'flat' && <Minus        size={12} />}
          {diff >= 0 ? '+' : ''}{diff.toFixed(2)}
        </div>
      </div>

      {/* Chart */}
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#FFD700" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#FFD700" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2052" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => (v >= 0 ? `+${v}` : `${v}`)}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#2d2052" strokeDasharray="4 4" />
            {/* Individual rating dots */}
            <Line
              type="monotone"
              dataKey="raw_score"
              stroke="#FFD700"
              strokeOpacity={0.35}
              strokeWidth={0}
              dot={{ r: 3, fill: '#FFD700', fillOpacity: 0.45, strokeWidth: 0 }}
              activeDot={false}
              isAnimationActive={false}
            />
            {/* Running average line */}
            <Area
              type="monotone"
              dataKey="running_avg"
              stroke="#FFD700"
              strokeWidth={2.5}
              fill="url(#avgGrad)"
              dot={false}
              activeDot={{ r: 5, fill: '#FFD700', strokeWidth: 2, stroke: '#1a1035' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[10px] text-muted text-center">
        Dots = individual ratings · Line = running average · {data.length} ratings total
      </p>
    </div>
  )
}
