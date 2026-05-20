'use client'

interface MetricSliderProps {
  metricId: string
  name: string
  icon: string
  description: string
  value: number | null
  onChange: (metricId: string, value: number) => void
  onClear: (metricId: string) => void
}

const LABELS: Record<number, string> = {
  '-5': 'Terrible',
  '-4': 'Very Bad',
  '-3': 'Bad',
  '-2': 'Below Average',
  '-1': 'Poor',
  '0':  'Neutral',
  '1':  'Okay',
  '2':  'Good',
  '3':  'Great',
  '4':  'Excellent',
  '5':  'Outstanding',
}

function scoreColor(v: number): string {
  if (v <= -4) return '#ef4444'
  if (v <= -2) return '#f97316'
  if (v === -1) return '#fb923c'
  if (v ===  0) return '#6b7280'
  if (v ===  1) return '#86efac'
  if (v <=  3) return '#34d399'
  return '#10b981'
}

// position of thumb as percent 0–100
function thumbPct(v: number) {
  return ((v + 5) / 10) * 100
}

function trackGradient(v: number): string {
  const color = scoreColor(v)
  const pos = thumbPct(v)
  const neutral = '#fce7ec'
  if (v > 0)  return `linear-gradient(to right, ${neutral} 50%, ${color} 50%, ${color} ${pos}%, ${neutral} ${pos}%)`
  if (v < 0)  return `linear-gradient(to right, ${neutral} ${pos}%, ${color} ${pos}%, ${color} 50%, ${neutral} 50%)`
  return neutral
}

const QUICK = [-5, -3, 0, 3, 5]

export default function MetricSlider({
  metricId, name, icon, description, value, onChange, onClear,
}: MetricSliderProps) {
  const rated = value !== null
  const color = rated ? scoreColor(value!) : '#4b5563'

  return (
    <div
      className="rounded-2xl border p-4 space-y-3 transition-all duration-200"
      style={{
        background: rated ? '#fef6f7' : '#ffffff',
        borderColor: rated ? '#f9c0cb' : '#fce7ec',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl" style={{ opacity: rated ? 1 : 0.4 }}>{icon}</span>
          <div>
            <p className="font-semibold text-sm" style={{ color: rated ? '#1c1b22' : '#94a3b8' }}>{name}</p>
            <p className="text-xs text-muted">{description}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          {rated ? (
            <>
              <span className="font-black text-xl tabular-nums" style={{ color }}>
                {value! > 0 ? `+${value}` : value}
              </span>
              <button
                type="button"
                onClick={() => onClear(metricId)}
                className="text-muted text-xs hover:text-foreground transition-colors"
              >
                {LABELS[value!]} · clear
              </button>
            </>
          ) : (
            <span className="text-muted text-xs italic">not yet</span>
          )}
        </div>
      </div>

      {/* Quick-pick buttons */}
      <div className="flex gap-1.5 justify-between">
        {QUICK.map(q => (
          <button
            key={q}
            type="button"
            onClick={() => onChange(metricId, q)}
            className="flex-1 h-9 rounded-xl font-bold text-xs transition-all duration-150"
            style={{
              background: value === q ? scoreColor(q) + '22' : '#fce7ec',
              border: `1.5px solid ${value === q ? scoreColor(q) : '#f9c0cb'}`,
              color: value === q ? scoreColor(q) : '#94a3b8',
              boxShadow: value === q ? `0 0 8px ${scoreColor(q)}44` : undefined,
            }}
          >
            {q > 0 ? `+${q}` : q}
          </button>
        ))}
      </div>

      {/* Slider */}
      <div className="space-y-1">
        <input
          type="range"
          min={-5}
          max={5}
          step={1}
          value={value ?? 0}
          onChange={e => onChange(metricId, Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: rated ? trackGradient(value!) : '#fce7ec',
            accentColor: rated ? color : '#94a3b8',
          }}
        />
        <div className="flex justify-between text-muted text-xs px-0.5">
          <span>−5</span>
          <span>0</span>
          <span>+5</span>
        </div>
      </div>
    </div>
  )
}
