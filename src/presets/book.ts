import type { Category } from '../types';

/** A category set for drafting a book — outline through to revisions. */

interface Seed {
  id: string;
  name: string;
  color: string;
  keywords: string[];
  subs?: { id: string; name: string; keywords?: string[] }[];
}

const SEEDS: Seed[] = [
  {
    id: 'book-premise',
    name: 'Premise & outline',
    color: 'var(--cat-1)',
    keywords: ['premise', 'outline', 'synopsis', 'pitch', 'logline', 'structure', 'beat sheet'],
  },
  {
    id: 'book-characters',
    name: 'Characters',
    color: 'var(--cat-3)',
    keywords: ['character', 'protagonist', 'antagonist', 'arc', 'backstory', 'voice', 'cast'],
  },
  {
    id: 'book-worldbuilding',
    name: 'World & setting',
    color: 'var(--cat-4)',
    keywords: ['world', 'setting', 'place', 'lore', 'timeline', 'map', 'history'],
  },
  {
    id: 'book-chapters',
    name: 'Chapters & drafting',
    color: 'var(--cat-5)',
    keywords: ['chapter', 'scene', 'draft', 'word count', 'wrote', 'manuscript'],
    subs: [
      { id: 'book-act1', name: 'Act / part one' },
      { id: 'book-act2', name: 'Act / part two' },
      { id: 'book-act3', name: 'Act / part three' },
    ],
  },
  {
    id: 'book-research',
    name: 'Research',
    color: 'var(--cat-6)',
    keywords: ['research', 'source', 'fact check', 'interview', 'reference', 'reading'],
  },
  {
    id: 'book-feedback',
    name: 'Feedback',
    color: 'var(--cat-7)',
    keywords: ['feedback', 'beta reader', 'critique', 'editor', 'review', 'comment'],
  },
  {
    id: 'book-revisions',
    name: 'Revisions',
    color: 'var(--cat-8)',
    keywords: ['revision', 'rewrite', 'edit', 'continuity', 'proofread', 'cut'],
  },
  {
    id: 'book-craft-notes',
    name: 'Craft notes',
    color: 'var(--cat-3)',
    keywords: ['craft', 'technique', 'style', 'pacing', 'tense', 'pov'],
  },
];

export const bookCategories: Category[] = (() => {
  const out: Category[] = [];
  let order = 0;
  for (const seed of SEEDS) {
    out.push({ id: seed.id, name: seed.name, color: seed.color, order: order++, keywords: seed.keywords });
    for (const sub of seed.subs ?? []) {
      out.push({
        id: sub.id,
        name: sub.name,
        color: seed.color,
        order: order++,
        keywords: sub.keywords ?? [],
        parentId: seed.id,
      });
    }
  }
  return out;
})();
