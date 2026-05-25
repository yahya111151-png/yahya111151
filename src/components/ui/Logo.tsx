/**
 * Lens brand mark + optional wordmark.
 * Colors: deep purple #2D1B69, electric yellow #FFD700, white.
 * Slogan: "See More"
 *
 * <Logo />                        — mark only
 * <Logo wordmark />               — mark + "Lens" + "See More" slogan
 * <Logo wordmark size={40} />
 */

interface Props {
  size?: number
  wordmark?: boolean
  textSize?: string
  className?: string
  showSlogan?: boolean
}

/**
 * Eye/lens mark — circular aperture with a bold "L" inside.
 * Yellow eye shape on deep purple background.
 */
function ApertureMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Outer circle — deep purple */}
      <circle cx="256" cy="256" r="240" fill="#2D1B69"/>

      {/* Eye shape — yellow */}
      <ellipse cx="256" cy="256" rx="180" ry="110" fill="#FFD700"/>

      {/* Iris — deep purple */}
      <circle cx="256" cy="256" r="72" fill="#2D1B69"/>

      {/* Pupil highlight — yellow */}
      <circle cx="256" cy="256" r="38" fill="#FFD700"/>

      {/* Bold L — white, inside the iris */}
      <rect x="228" y="196" width="32" height="120" rx="10" fill="white"/>
      <rect x="228" y="284" width="76" height="32"  rx="10" fill="white"/>

      {/* Shine dot */}
      <circle cx="296" cy="208" r="14" fill="white" opacity="0.5"/>
    </svg>
  )
}

export default function Logo({ size = 28, wordmark = false, textSize = 'text-xl', className = '', showSlogan = false }: Props) {
  if (!wordmark) return <ApertureMark size={size} />

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <ApertureMark size={size} />
      <span className="flex flex-col leading-none">
        <span className={`font-black tracking-tight leading-none ${textSize}`}>
          <span className="text-foreground">Le</span>
          <span style={{ color: '#FFD700' }}>ns</span>
        </span>
        {showSlogan && (
          <span className="text-[10px] font-bold tracking-widest uppercase mt-0.5" style={{ color: '#FFD700', opacity: 0.8 }}>
            See More
          </span>
        )}
      </span>
    </span>
  )
}
