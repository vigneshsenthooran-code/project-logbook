// Flat, multi-tone step icons for the intro walkthrough — same conventions as
// DecorMark.tsx (app palette via CSS custom properties, gap strokes matching
// the surface they sit on, no currentColor/photographic imagery).

interface IconProps {
  size?: number;
  className?: string;
}

const gap = 'var(--color-surface-soft)';

export function IconCapture({ size = 96, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden>
      <rect x="10" y="36" width="70" height="30" rx="15" fill="var(--color-card-strong)" stroke={gap} strokeWidth="2" />
      <rect x="10" y="36" width="42" height="30" rx="15" fill="var(--color-primary-neutral)" stroke={gap} strokeWidth="2" />
      <circle cx="68" cy="51" r="21" fill="var(--color-primary)" stroke={gap} strokeWidth="3" />
      <path d="M68 42v18M59 51h18" stroke="var(--color-on-primary)" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconCategorize({ size = 96, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden>
      <path
        d="M12 30a6 6 0 0 1 6-6h17l8 10h27a6 6 0 0 1 6 6v32a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6z"
        fill="var(--color-primary-neutral)"
        stroke={gap}
        strokeWidth="2"
      />
      <circle cx="72" cy="68" r="21" fill="var(--color-primary)" stroke={gap} strokeWidth="3" />
      <path
        d="M63 68l6 6 12-13"
        fill="none"
        stroke="var(--color-on-primary)"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconBrowse({ size = 96, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden>
      <rect x="10" y="10" width="36" height="36" rx="8" fill="var(--color-card-strong)" stroke={gap} strokeWidth="2" />
      <rect x="54" y="10" width="36" height="36" rx="8" fill="var(--color-primary-neutral)" stroke={gap} strokeWidth="2" />
      <rect x="10" y="54" width="36" height="36" rx="8" fill="var(--color-primary-neutral)" stroke={gap} strokeWidth="2" />
      <rect x="54" y="54" width="36" height="36" rx="8" fill="var(--color-primary)" stroke={gap} strokeWidth="2" />
    </svg>
  );
}

export function IconProjects({ size = 96, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden>
      <path d="M10 28a5 5 0 0 1 5-5h15l6 8h19a5 5 0 0 1 5 5v9H10z" fill="var(--color-card-strong)" />
      <rect x="10" y="35" width="50" height="32" rx="6" fill="var(--color-primary-neutral)" stroke={gap} strokeWidth="2" />
      <path d="M44 42a5 5 0 0 1 5-5h13l5 6h18a5 5 0 0 1 5 5v7H44z" fill="var(--color-card-strong)" />
      <rect x="44" y="48" width="46" height="30" rx="6" fill="var(--color-primary)" stroke={gap} strokeWidth="2" />
    </svg>
  );
}

export function IconCalendar({ size = 96, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden>
      <rect x="12" y="20" width="76" height="64" rx="10" fill="var(--color-card-strong)" stroke={gap} strokeWidth="2" />
      <rect x="12" y="20" width="76" height="20" rx="10" fill="var(--color-primary-neutral)" />
      <rect x="26" y="11" width="7" height="18" rx="3.5" fill="var(--color-primary)" />
      <rect x="67" y="11" width="7" height="18" rx="3.5" fill="var(--color-primary)" />
      <circle cx="31" cy="58" r="5.5" fill="var(--color-primary)" />
      <circle cx="50" cy="58" r="5.5" fill="var(--color-hairline)" />
      <circle cx="69" cy="58" r="5.5" fill="var(--color-hairline)" />
      <circle cx="31" cy="73" r="5.5" fill="var(--color-hairline)" />
      <circle cx="50" cy="73" r="5.5" fill="var(--color-primary)" />
      <circle cx="69" cy="73" r="5.5" fill="var(--color-hairline)" />
    </svg>
  );
}

export function IconSettings({ size = 96, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden>
      <rect x="14" y="28" width="72" height="6" rx="3" fill="var(--color-hairline)" />
      <circle cx="38" cy="31" r="11" fill="var(--color-primary)" stroke={gap} strokeWidth="3" />
      <rect x="14" y="50" width="72" height="6" rx="3" fill="var(--color-hairline)" />
      <circle cx="68" cy="53" r="11" fill="var(--color-primary-neutral)" stroke={gap} strokeWidth="3" />
      <rect x="14" y="72" width="72" height="6" rx="3" fill="var(--color-hairline)" />
      <circle cx="50" cy="75" r="11" fill="var(--color-card-strong)" stroke={gap} strokeWidth="3" />
    </svg>
  );
}
