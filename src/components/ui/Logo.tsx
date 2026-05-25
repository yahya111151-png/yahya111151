interface Props {
  size?: number
  wordmark?: boolean
  textSize?: string
  className?: string
  showSlogan?: boolean
}

function Lensmark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="100" height="100" rx="24" fill="#2D1B69"/>
      {/* L vertical stroke, center at x=37 */}
      <rect x="28" y="30" width="18" height="52" rx="7" fill="#FFD700"/>
      {/* L horizontal stroke */}
      <rect x="28" y="64" width="44" height="18" rx="7" fill="#FFD700"/>
      {/* Glasses — left lens centered on vertical stroke (cx=37), right at cx=63, pair center=50 */}
      <circle cx="37" cy="22" r="10" stroke="white" strokeWidth="4" fill="none"/>
      <circle cx="63" cy="22" r="10" stroke="white" strokeWidth="4" fill="none"/>
      <line x1="47" y1="22" x2="53" y2="22" stroke="white" strokeWidth="4" strokeLinecap="round"/>
      <line x1="27" y1="22" x2="20" y2="20" stroke="white" strokeWidth="4" strokeLinecap="round"/>
      <line x1="73" y1="22" x2="80" y2="20" stroke="white" strokeWidth="4" strokeLinecap="round"/>
    </svg>
  )
}

export default function Logo({ size = 28, wordmark = false, textSize = 'text-xl', className = '', showSlogan = false }: Props) {
  if (!wordmark) return <Lensmark size={size} />

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Lensmark size={size} />
      <span className="flex flex-col justify-center leading-none gap-1">
        <span className={`font-black tracking-tight leading-none ${textSize}`}>
          <span className="text-foreground">Le</span>
          <span className="text-primary">ns</span>
        </span>
        {showSlogan && (
          <span
            className="font-bold tracking-widest uppercase"
            style={{ fontSize: `${Math.max(7, Math.round(size * 0.28))}px`, color: '#FFD700', opacity: 0.85, letterSpacing: '0.2em' }}
          >
            See More
          </span>
        )}
      </span>
    </span>
  )
}
