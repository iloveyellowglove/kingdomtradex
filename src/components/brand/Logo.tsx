export default function Logo({
  size = 'md',
  showText = true,
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}) {
  const heights: Record<string, number> = { sm: 32, md: 40, lg: 64 };
  const h = heights[size];

  return (
    <div className={`inline-flex items-center gap-2 ${className}`} style={{ height: h }}>
      <svg
        width={showText ? h * 5.5 : h}
        height={h}
        viewBox={showText ? '0 0 220 40' : '0 0 40 40'}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ height: h, width: 'auto' }}
      >
        {/* Cross - gold */}
        <g transform="translate(8, 4)">
          {/* Vertical bar */}
          <rect x="12" y="0" width="4" height="28" rx="2" fill="#FFD700" />
          {/* Horizontal bar - positioned at upper third */}
          <rect x="0" y="9" width="28" height="4" rx="2" fill="#FFD700" />
          {/* Inner glow on vertical */}
          <rect x="13" y="1" width="2" height="26" rx="1" fill="#FFE44D" opacity="0.4" />
        </g>

        {/* Dove - white, perched on right arm of cross, facing right */}
        <g transform="translate(18, 9)">
          {/* Dove body */}
          <path
            d="M0 6 C0 2 2 0 5 0 C8 0 10 2 10 5 C10 8 8 9 6 9 C3 9 0 8 0 6Z"
            fill="white"
          />
          {/* Dove head */}
          <circle cx="9" cy="2.5" r="2" fill="white" />
          {/* Beak */}
          <path d="M11 2 L13 2.5 L11 3" fill="#FFD700" />
          {/* Wing */}
          <path
            d="M2 1 C4 -1 7 -1 8 1 C8 3 6 6 4 7 C3 7.5 2 7 2 6 C2 4 3 2 2 1Z"
            fill="white"
            opacity="0.9"
          />
          {/* Olive branch from beak */}
          <line x1="13" y1="2.5" x2="17" y2="0" stroke="#FFD700" strokeWidth="0.6" />
          <ellipse cx="14.5" cy="1.2" rx="0.8" ry="0.4" fill="#FFD700" transform="rotate(-20 14.5 1.2)" />
          <ellipse cx="16" cy="0.3" rx="0.7" ry="0.35" fill="#FFD700" transform="rotate(-20 16 0.3)" />
        </g>

        {showText && (
          <text
            x="44"
            y="27"
            fill="#FFD700"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="17"
            fontWeight="800"
            letterSpacing="-0.3"
          >
            KingdomTradex
          </text>
        )}
      </svg>
    </div>
  );
}
