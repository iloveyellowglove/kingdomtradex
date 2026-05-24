export default function CrossDove({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      {/* Small cross */}
      <rect x="9" y="2" width="2" height="18" rx="1" fill="#FFD700" />
      <rect x="3" y="8" width="14" height="2" rx="1" fill="#FFD700" />
      {/* Tiny dove */}
      <g transform="translate(10, 2) scale(0.45)">
        <path d="M0 6 C0 2 2 0 5 0 C8 0 10 2 10 5 C10 8 8 9 6 9 C3 9 0 8 0 6Z" fill="white" />
        <circle cx="9" cy="2.5" r="2" fill="white" />
        <path d="M11 2 L13 2.5 L11 3" fill="#FFD700" />
        <path d="M2 1 C4 -1 7 -1 8 1 C8 3 6 6 4 7 C3 7.5 2 7 2 6 C2 4 3 2 2 1Z" fill="white" opacity="0.9" />
        <line x1="13" y1="2.5" x2="17" y2="0" stroke="#FFD700" strokeWidth="0.6" />
        <ellipse cx="14.5" cy="1.2" rx="0.8" ry="0.4" fill="#FFD700" transform="rotate(-20 14.5 1.2)" />
        <ellipse cx="16" cy="0.3" rx="0.7" ry="0.35" fill="#FFD700" transform="rotate(-20 16 0.3)" />
      </g>
    </svg>
  );
}
