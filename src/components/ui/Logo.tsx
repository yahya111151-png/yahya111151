/**
 * Lens brand mark + optional wordmark.
 * The mark is a bold rounded "L" with small round glasses — friendly, clear, on-brand.
 *
 * <Logo />                 — mark only (default 28 px)
 * <Logo size={40} />       — mark only, larger
 * <Logo wordmark />        — mark + "Lens" text side-by-side
 * <Logo wordmark size={32} textSize="text-2xl" />
 */

interface Props {
  /** Pixel size of the aperture mark */
  size?: number
  /** Show the "Lens" wordmark next to the mark */
  wordmark?: boolean
  /** Tailwind text-size class for the wordmark text */
  textSize?: string
  className?: string
  showSlogan?: boolean
}

/**
 * "L with glasses" mark — transparent background, brand pink.
 * Matches icon.svg geometry: bold rounded L + two tiny round glasses frames.
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
      {/* Bold rounded L — vertical stroke */}
      <rect x="148" y="88"  width="92"  height="328" rx="46" fill="#e8476a"/>
      {/* Bold rounded L — horizontal stroke */}
      <rect x="148" y="324" width="220" height="92"  rx="46" fill="#e8476a"/>

      {/* Glasses */}
      <circle cx="162" cy="180" r="26" stroke="#fce7ec" strokeWidth="11"/>
      <circle cx="226" cy="180" r="26" stroke="#fce7ec" strokeWidth="11"/>
      <line   x1="188" y1="180" x2="200" y2="180" stroke="#fce7ec" strokeWidth="11" strokeLinecap="round"/>
      <line   x1="136" y1="180" x2="110" y2="189" stroke="#fce7ec" strokeWidth="11" strokeLinecap="round"/>
      <line   x1="252" y1="180" x2="278" y2="189" stroke="#fce7ec" strokeWidth="11" strokeLinecap="round"/>
    </svg>
  )
}

export default function Logo({ size = 28, wordmark = false, textSize = 'text-xl', className = '', showSlogan = false }: Props) {
  if (!wordmark) return <ApertureMark size={size} />

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <ApertureMark size={size} />
      <span className={`font-black tracking-tight leading-none ${textSize}`}>
        <span className="text-foreground">Le</span>
        <span className="text-primary">ns</span>
      </span>
    </span>
  )
}
