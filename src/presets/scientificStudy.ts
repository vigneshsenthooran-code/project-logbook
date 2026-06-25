import type { Category } from '../types';

/** A category set for running a scientific study — literature through to write-up. */

interface Seed {
  id: string;
  name: string;
  color: string;
  keywords: string[];
  subs?: { id: string; name: string; keywords?: string[] }[];
}

const SEEDS: Seed[] = [
  {
    id: 'study-question',
    name: 'Research question & hypothesis',
    color: 'var(--cat-1)',
    keywords: ['hypothesis', 'question', 'aim', 'objective', 'prediction'],
  },
  {
    id: 'study-literature',
    name: 'Literature review',
    color: 'var(--cat-3)',
    keywords: ['literature', 'paper', 'citation', 'review', 'prior work', 'gap'],
  },
  {
    id: 'study-methodology',
    name: 'Methodology',
    color: 'var(--cat-4)',
    keywords: ['method', 'methodology', 'protocol', 'design', 'sample', 'variable', 'control'],
    subs: [
      { id: 'study-ethics', name: 'Ethics & approvals', keywords: ['ethics', 'approval', 'consent', 'irb'] },
      { id: 'study-materials', name: 'Materials & instruments', keywords: ['material', 'instrument', 'equipment'] },
    ],
  },
  {
    id: 'study-data',
    name: 'Data collection',
    color: 'var(--cat-5)',
    keywords: ['data', 'collection', 'measurement', 'observation', 'survey', 'experiment'],
  },
  {
    id: 'study-analysis',
    name: 'Analysis',
    color: 'var(--cat-6)',
    keywords: ['analysis', 'statistic', 'model', 'result', 'p-value', 'significance', 'chart'],
  },
  {
    id: 'study-findings',
    name: 'Findings & discussion',
    color: 'var(--cat-7)',
    keywords: ['finding', 'discussion', 'implication', 'interpretation', 'conclusion'],
  },
  {
    id: 'study-limitations',
    name: 'Limitations & future work',
    color: 'var(--cat-8)',
    keywords: ['limitation', 'future work', 'caveat', 'confound', 'bias'],
  },
  {
    id: 'study-writeup',
    name: 'Write-up & submission',
    color: 'var(--cat-3)',
    keywords: ['manuscript', 'draft', 'journal', 'submission', 'peer review', 'revision'],
  },
];

export const scientificStudyCategories: Category[] = (() => {
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
