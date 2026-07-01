import type { Project } from '../types';

const CAT_PALETTE = [
  'var(--cat-1)',
  'var(--cat-2)',
  'var(--cat-3)',
  'var(--cat-4)',
  'var(--cat-5)',
  'var(--cat-6)',
  'var(--cat-7)',
  'var(--cat-8)',
];

/** Deterministic calendar swatch for a project, from its position in `projects`. */
export function projectColor(projects: Project[], projectId?: string): string {
  if (!projectId) return 'var(--color-muted)';
  const index = projects.findIndex((p) => p.id === projectId);
  if (index < 0) return 'var(--color-muted)';
  return CAT_PALETTE[index % CAT_PALETTE.length];
}
