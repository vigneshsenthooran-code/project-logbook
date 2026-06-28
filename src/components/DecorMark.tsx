// Flat-colour mark — a quire: a stack of bound books/folios fanned out,
// the bookbinding term for a gathering of pages. Uses the app's own
// lime/olive palette (back-to-front: darkest to brand lime) rather than
// currentColor, since it's a multi-tone flat icon, not monoline art.

export default function DecorMark({
  size = 72,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const gap = 'var(--color-canvas)';
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden
    >
      {/* Back book */}
      <rect x="38" y="24" width="46" height="60" rx="6" fill="var(--color-card-strong)" stroke={gap} strokeWidth="2" />
      <path d="M44 24v60" stroke={gap} strokeWidth="2" />
      {/* Middle book */}
      <rect x="29" y="18" width="46" height="60" rx="6" fill="var(--color-primary-neutral)" stroke={gap} strokeWidth="2" />
      <path d="M35 18v60" stroke={gap} strokeWidth="2" />
      {/* Front book */}
      <rect x="16" y="12" width="46" height="60" rx="6" fill="var(--color-primary)" stroke={gap} strokeWidth="2" />
      <path d="M22 12v60" stroke={gap} strokeWidth="2" />
    </svg>
  );
}
