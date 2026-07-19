/**
 * The Resonance waveform mark — an SVG recreation of the brand logo:
 * a blue sine sweep rising into yellow/orange bars and settling into red.
 * If /public/logo.png exists it can replace this, but the SVG stays crisp
 * at any size and inherits no background.
 */
export function LogoMark({ className = "h-10 w-auto" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 132 64"
      className={className}
      role="img"
      aria-label="Resonance logo"
      fill="none"
    >
      <path
        d="M6 38 C 14 38, 15 24, 22 24 C 29 24, 27 46, 34 46 C 40 46, 39 30, 43 26"
        stroke="#2E9BDE"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <rect x="52" y="4" width="10" height="52" rx="5" fill="#F7B32B" />
      <rect x="52" y="26" width="10" height="30" rx="5" fill="#F2711B" opacity="0.92" />
      <rect x="68" y="12" width="10" height="44" rx="5" fill="#F2914B" />
      <rect x="84" y="22" width="9" height="22" rx="4.5" fill="#E85555" />
      <path
        d="M102 30 C 106 30, 106 40, 111 40 C 116 40, 115 34, 121 34"
        stroke="#E85555"
        strokeWidth="8"
        strokeLinecap="round"
      />
    </svg>
  );
}
