export default function CrossBackground({ opacity = 0.03 }: { opacity?: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ opacity }}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="cross-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
            {/* Simple cross shape */}
            <rect x="38" y="22" width="4" height="36" rx="1.5" fill="#FFD700" opacity="0.5" />
            <rect x="24" y="34" width="32" height="4" rx="1.5" fill="#FFD700" opacity="0.5" />
            {/* Small dove shape */}
            <circle cx="44" cy="26" r="1.5" fill="white" opacity="0.4" />
          </pattern>
          {/* Larger scattered crosses */}
          <pattern id="cross-scatter" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
            <rect x="96" y="50" width="8" height="60" rx="3" fill="#FFD700" opacity="0.3" />
            <rect x="74" y="72" width="52" height="8" rx="3" fill="#FFD700" opacity="0.3" />
            {/* Dove near the large cross */}
            <path d="M110 58 C110 54 111 52 113 53 C114 54 114 56 112 57Z" fill="white" opacity="0.2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cross-pattern)" />
        <rect width="100%" height="100%" fill="url(#cross-scatter)" />
      </svg>
    </div>
  );
}
