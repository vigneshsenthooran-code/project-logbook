import type { Category } from '../types';
import { INBOX_ID } from '../types';
import { blankCategories } from './blank';
import { utsCategories } from './uts';

export interface Preset {
  id: string;
  name: string;
  description: string;
  /** Categories WITHOUT the Inbox — Inbox is appended automatically. */
  categories: Category[];
}

const INBOX: Category = {
  id: INBOX_ID,
  name: 'Inbox',
  color: 'var(--color-muted)',
  order: 999,
  keywords: [],
};

export const PRESETS: Preset[] = [
  {
    id: 'blank',
    name: 'Blank / General',
    description: 'A clean general-purpose set of categories for any project.',
    categories: blankCategories,
  },
  {
    id: 'uts',
    name: 'UTS Architecture Design Log',
    description:
      'Feedback + Ideas capture, then the eleven UTS design-log headings in submission order.',
    categories: utsCategories,
  },
];

export function presetById(id: string): Preset {
  return PRESETS.find((p) => p.id === id) ?? PRESETS[0];
}

/** Build the full category list for a preset, with the Inbox fallback appended. */
export function categoriesForPreset(id: string): Category[] {
  const preset = presetById(id);
  const cats = preset.categories.map((c) => ({ ...c, keywords: [...c.keywords] }));
  return [...cats, { ...INBOX }];
}
