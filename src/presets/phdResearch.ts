import type { Category } from '../types';

/** A category set for longer-running PhD research — spans candidature, not a single study. */

interface Seed {
  id: string;
  name: string;
  color: string;
  keywords: string[];
  subs?: { id: string; name: string; keywords?: string[] }[];
}

const SEEDS: Seed[] = [
  {
    id: 'phd-supervisor',
    name: 'Supervisor feedback',
    color: 'var(--cat-1)',
    keywords: ['supervisor', 'meeting', 'feedback', 'said', 'suggested', 'panel'],
  },
  {
    id: 'phd-literature',
    name: 'Literature review',
    color: 'var(--cat-3)',
    keywords: ['literature', 'paper', 'citation', 'theory', 'framework', 'gap'],
  },
  {
    id: 'phd-methodology',
    name: 'Methodology',
    color: 'var(--cat-4)',
    keywords: ['method', 'methodology', 'design', 'approach', 'epistemology'],
  },
  {
    id: 'phd-data',
    name: 'Data collection & fieldwork',
    color: 'var(--cat-5)',
    keywords: ['data', 'fieldwork', 'interview', 'survey', 'sample', 'site visit'],
  },
  {
    id: 'phd-analysis',
    name: 'Analysis',
    color: 'var(--cat-6)',
    keywords: ['analysis', 'coding', 'theme', 'statistic', 'model', 'result'],
  },
  {
    id: 'phd-writing',
    name: 'Thesis writing',
    color: 'var(--cat-7)',
    keywords: ['chapter', 'draft', 'thesis', 'wrote', 'wordcount'],
    subs: [
      { id: 'phd-intro', name: 'Introduction' },
      { id: 'phd-chapters', name: 'Body chapters' },
      { id: 'phd-conclusion', name: 'Conclusion' },
    ],
  },
  {
    id: 'phd-publications',
    name: 'Publications & conferences',
    color: 'var(--cat-8)',
    keywords: ['publication', 'paper', 'journal', 'conference', 'submission', 'peer review'],
  },
  {
    id: 'phd-admin',
    name: 'Candidature admin & milestones',
    color: 'var(--cat-3)',
    keywords: ['milestone', 'confirmation', 'progress review', 'ethics', 'admin', 'deadline'],
  },
  {
    id: 'phd-ideas',
    name: 'Ideas & tangents',
    color: 'var(--cat-4)',
    keywords: ['idea', 'tangent', 'what if', 'future paper', 'side project'],
  },
];

export const phdResearchCategories: Category[] = (() => {
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
