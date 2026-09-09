/** Villrose-logo — fem kronblad rundt støvdragere, håndtegnet strek */
export function WildRose({ className = '', strokeWidth = 1.5 }: { className?: string; strokeWidth?: number }) {
  const petals = [0, 72, 144, 216, 288]
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      {petals.map((deg) => (
        <path
          key={deg}
          d="M24 22 C 19 14, 19 7, 24 3.5 C 29 7, 29 14, 24 22 Z"
          transform={`rotate(${deg} 24 24)`}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      ))}
      <circle cx="24" cy="24" r="3" stroke="currentColor" strokeWidth={strokeWidth} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <line
          key={deg}
          x1="24"
          y1="21.5"
          x2="24"
          y2="18.5"
          transform={`rotate(${deg} 24 24)`}
          stroke="currentColor"
          strokeWidth={strokeWidth * 0.8}
          strokeLinecap="round"
        />
      ))}
    </svg>
  )
}

/** Åttekantet stjerne (khatam) — gjennomgående motiv */
export function EightStar({ className = '', strokeWidth = 1.4 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <path
        d="M24 2l5.6 13.6L43 10l-5.6 13.6L51 29.2l-13.6 5.6L43 48.4 29.4 42.8 24 56.4l-5.4-13.6L5 48.4l5.6-13.6L-3 29.2l13.6-5.6L5 10l13.4 5.6L24 2z"
        transform="translate(0 -2) scale(0.92) translate(2 2)"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <circle cx="24" cy="27.2" r="4.4" stroke="currentColor" strokeWidth={strokeWidth} />
    </svg>
  )
}

/** Dekorativ skillebue med stjerne */
export function StarDivider({ className = 'text-majorelle' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`} aria-hidden="true">
      <span className="h-px flex-1 bg-current opacity-40" />
      <EightStar className="h-5 w-5 animate-spin-slow" />
      <span className="h-px flex-1 bg-current opacity-40" />
    </div>
  )
}

/** Marokkansk bue-ramme rundt bilder */
export function ArchFrame({
  src,
  alt,
  className = '',
  imgClassName = '',
}: {
  src: string
  alt: string
  className?: string
  imgClassName?: string
}) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute -inset-2 rounded-t-full border border-majorelle/60" aria-hidden="true" />
      <div className="overflow-hidden rounded-t-full">
        <img src={src} alt={alt} className={`h-full w-full object-cover ${imgClassName}`} loading="lazy" />
      </div>
    </div>
  )
}
