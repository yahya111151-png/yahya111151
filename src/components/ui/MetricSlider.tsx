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

const LABELS = ['', 'Poor', 'Below Average', 'Average', 'Good', 'Excellent']
const COLORS = ['', '#f87171', '#fb923c', '#fbbf24', '#34d399', '#10b981']

export default function MetricSlider({
  metricId, name, icon, description, value, onChange, onClear,
}: MetricSliderProps) {
  const rated = value !== null

  return (
    <div
      className="rounded-2xl border p-4 space-y-3 transition-all duration-200"
      style={{
        background: rated ? '#0f0f1a' : '#09090f',
        borderColor: rated ? '#1e1e30' : '#13131f',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl" style={{ opacity: rated ? 1 : 0.4 }}>{icon}</span>
          <div>
            <p className="font-semibold text-sm" style={{ color: rated ? '#fff' : '#4b5563' }}>{name}</p>
            <p className="text-xs text-muted">{description}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          {rated ? (
            <>
              <span className="font-bold text-lg tabular-nums" style={{ color: COLORS[value!] }}>
                {value}/5
              </span>
              <button
                type="button"
                onClick={() => onClear(metricId)}
                className="text-muted text-xs hover:text-white transition-colors"
              >
                {LABELS[value!]} · clear
              </button>
            </>
          ) : (
            <span className="text-muted text-xs italic">not rated</span>
          )}
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
              background: rated && value! >= star ? COLORS[star] + '33' : '#1e1e30',
              border: `1.5px solid ${rated && value! >= star ? COLORS[star] : '#1e1e30'}`,
              color: rated && value! >= star ? COLORS[star] : '#6b7280',
              boxShadow: value === star ? `0 0 10px ${COLORS[star]}55` : undefined,
            }}
          >
            {star}
          </button>
        ))}
      </div>

      {/* Slider — only visible once rated */}
      {rated && (
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={value!}
          onChange={e => onChange(metricId, Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${COLORS[value!]} ${(value! - 1) * 25}%, #1e1e30 ${(value! - 1) * 25}%)`,
            accentColor: COLORS[value!],
          }}
        />
      )}
    </div>
  )
}
