import type { Category } from '../types';
import { INBOX_ID } from '../types';
import { blankCategories } from './blank';
import { utsCategories } from './uts';
import { bookCategories } from './book';
import { scientificStudyCategories } from './scientificStudy';
import { phdResearchCategories } from './phdResearch';

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
  {
    id: 'book',
    name: 'Book Writing',
    description: 'Premise, characters and world-building through chapters, feedback and revisions.',
    categories: bookCategories,
  },
  {
    id: 'scientific-study',
    name: 'Scientific Study',
    description: 'Hypothesis and literature through methodology, data, analysis and write-up.',
    categories: scientificStudyCategories,
  },
  {
    id: 'phd-research',
    name: 'PhD Research',
    description: 'Candidature-spanning categories: supervisor feedback, literature, fieldwork, thesis chapters and publications.',
    categories: phdResearchCategories,
  },
];

export function presetById(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}

/** Build the full category list for a built-in preset id, with the Inbox fallback appended. */
export function categoriesForPreset(id: string): Category[] {
  const preset = presetById(id) ?? PRESETS[0];
  const cats = preset.categories.map((c) => ({ ...c, keywords: [...c.keywords] }));
  return [...cats, { ...INBOX }];
}

/** Build the full category list (with Inbox appended) from an arbitrary category set, e.g. a custom preset. */
export function categoriesFromSet(categories: Category[]): Category[] {
  const cats = categories.filter((c) => c.id !== INBOX_ID).map((c) => ({ ...c, keywords: [...c.keywords] }));
  return [...cats, { ...INBOX }];
}
