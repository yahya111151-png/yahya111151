'use client'

interface MetricSliderProps {
  metricId: string
  name: string
  icon: string
  description: string
  value: number
  onChange: (metricId: string, value: number) => void
}

const LABELS = ['', 'Poor', 'Below Average', 'Average', 'Good', 'Excellent']
const COLORS = ['', '#f87171', '#fb923c', '#fbbf24', '#34d399', '#10b981']

export default function MetricSlider({
  metricId, name, icon, description, value, onChange,
}: MetricSliderProps) {
  return (
    <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <div>
            <p className="font-semibold text-white text-sm">{name}</p>
            <p className="text-muted text-xs">{description}</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="font-bold text-lg tabular-nums" style={{ color: COLORS[value] }}>
            {value}/5
          </span>
          <span className="text-xs" style={{ color: COLORS[value] }}>
            {LABELS[value]}
          </span>
        </div>
      </div>

      {/* Star buttons */}
      <div className="flex gap-2 justify-between">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(metricId, star)}
            className="flex-1 h-10 rounded-xl font-bold text-sm transition-all duration-150"
            style={{
              background: value >= star ? COLORS[star] + '33' : '#1e1e30',
              border: `1.5px solid ${value >= star ? COLORS[star] : '#1e1e30'}`,
              color: value >= star ? COLORS[star] : '#6b7280',
              boxShadow: value === star ? `0 0 10px ${COLORS[star]}55` : undefined,
            }}
          >
            {star}
          </button>
        ))}
      </div>

      {/* Slider */}
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={e => onChange(metricId, Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${COLORS[value]} ${(value - 1) * 25}%, #1e1e30 ${(value - 1) * 25}%)`,
          accentColor: COLORS[value],
        }}
      />
    </div>
  )
}
