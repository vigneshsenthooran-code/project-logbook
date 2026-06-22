import type { Category } from '../types';

/**
 * UTS mArch / bLhons design-log preset (AUT 2026).
 * Opens with Feedback + Ideas capture categories, then the eleven design-log
 * headings in submission order. Representative sub-headings and starter keyword
 * lists are drawn from the design-log brief.
 */

interface Seed {
  id: string;
  name: string;
  color: string;
  keywords: string[];
  subs?: { id: string; name: string; keywords?: string[] }[];
}

const SEEDS: Seed[] = [
  {
    id: 'feedback',
    name: 'Feedback',
    color: 'var(--cat-1)',
    keywords: ['feedback', 'tutor', 'reviewer', 'comment', 'crit', 'review', 'suggested', 'said'],
  },
  {
    id: 'ideas',
    name: 'Ideas',
    color: 'var(--cat-3)',
    keywords: ['idea', 'sketch', 'concept', 'direction', 'what if', 'thought', 'maybe'],
  },
  {
    id: 'return-brief',
    name: 'Return brief',
    color: 'var(--cat-4)',
    keywords: ['brief', 'typology', 'program', 'area', 'gfa', 'pervious', 'impervious', 'schedule'],
    subs: [
      { id: 'rb-typology', name: 'Typology + program' },
      { id: 'rb-areas', name: 'Area calculations' },
      { id: 'rb-program', name: 'Semester program' },
    ],
  },
  {
    id: 'country',
    name: 'Connecting with Country',
    color: 'var(--cat-5)',
    keywords: [
      'country',
      'indigenous',
      'icip',
      'hydrology',
      'geology',
      'songline',
      'astronomy',
      'ecology',
      'habitat',
      'seasonality',
      'ethics',
    ],
    subs: [
      { id: 'cwc-positioning', name: 'Positioning, ethics + ICIP', keywords: ['ethics', 'icip'] },
      { id: 'cwc-hydrology', name: 'Hydrology', keywords: ['hydrology', 'water'] },
      { id: 'cwc-geology', name: 'Geology', keywords: ['geology', 'soil', 'rock'] },
      { id: 'cwc-songlines', name: 'Songlines', keywords: ['songline', 'dreaming'] },
      { id: 'cwc-astronomy', name: 'Astronomy', keywords: ['astronomy', 'stars', 'sky'] },
      { id: 'cwc-materials', name: 'Materials', keywords: ['material'] },
      { id: 'cwc-ecologies', name: 'Ecologies + habitats', keywords: ['ecology', 'habitat'] },
      { id: 'cwc-seasonality', name: 'Seasonality', keywords: ['seasonality', 'season'] },
      { id: 'cwc-timeline', name: 'Timeline of connection', keywords: ['timeline'] },
    ],
  },
  {
    id: 'context',
    name: 'Contextual analysis',
    color: 'var(--cat-6)',
    keywords: [
      'context',
      'orientation',
      'sun path',
      'overshadowing',
      'views',
      'sight line',
      'vegetation',
      'transport',
      'colonial',
    ],
    subs: [
      { id: 'ctx-colonial', name: 'Existing colonial conditions' },
      { id: 'ctx-sun', name: 'Orientation, sun path + overshadowing', keywords: ['sun', 'shadow'] },
      { id: 'ctx-views', name: 'Views + sight lines', keywords: ['view', 'sight line'] },
      { id: 'ctx-landscape', name: 'Landscape systems', keywords: ['landscape', 'soil', 'land use'] },
    ],
  },
  {
    id: 'ncc',
    name: 'NCC',
    color: 'var(--cat-7)',
    keywords: ['ncc', 'classification', 'code', 'worksheet', 'ipd', 'compliance', 'bca'],
    subs: [
      { id: 'ncc-class', name: 'Building classification' },
      { id: 'ncc-worksheets', name: 'NCC worksheets' },
      { id: 'ncc-codes', name: 'Codes applied' },
    ],
  },
  {
    id: 'carbon',
    name: 'Whole life carbon',
    color: 'var(--cat-8)',
    keywords: [
      'carbon',
      'embodied',
      'energy',
      'emissions',
      'epic',
      'half-carbon',
      'materials matrix',
      'lca',
    ],
    subs: [
      { id: 'wlc-matrix', name: 'Materials matrix' },
      { id: 'wlc-embodied', name: 'Embodied energy/water' },
      { id: 'wlc-transport', name: 'Transport emissions' },
      { id: 'wlc-calcs', name: 'Carbon calculations' },
    ],
  },
  {
    id: 'sustainability',
    name: 'Sustainability',
    color: 'var(--cat-4)',
    keywords: [
      'sustainability',
      'resilience',
      'passive',
      'active',
      'biodiversity',
      'water',
      'energy',
      'lighting',
      'acoustics',
      'social',
      'economic',
    ],
    subs: [
      { id: 'sus-considerations', name: 'Social, economic + Country' },
      { id: 'sus-resilience', name: 'Resilience' },
      { id: 'sus-systems', name: 'Active + passive systems' },
      { id: 'sus-bio', name: 'Biodiversity, water, energy, light + acoustics' },
    ],
  },
  {
    id: 'planning',
    name: 'Planning instruments',
    color: 'var(--cat-5)',
    keywords: [
      'planning',
      'fsr',
      'setback',
      'envelope',
      'zone',
      'heritage',
      'lep',
      'dcp',
      'da',
      'standard',
    ],
    subs: [
      { id: 'pi-controls', name: 'FSR, setbacks, envelope, zone' },
      { id: 'pi-heritage', name: 'Heritage items' },
      { id: 'pi-instruments', name: 'LEPs / DCPs / codes' },
      { id: 'pi-da', name: 'DA pathway' },
    ],
  },
  {
    id: 'structure',
    name: 'Structural logic systems',
    color: 'var(--cat-6)',
    keywords: ['structure', 'structural', 'engineer', 'axo', 'span', 'load', 'beam', 'column'],
    subs: [
      { id: 'str-engineer', name: 'Engineer consultation mark-ups' },
      { id: 'str-axo', name: 'Exploded axo' },
      { id: 'str-lifecycle', name: 'Material life-cycle in selection' },
    ],
  },
  {
    id: 'process',
    name: 'Process, form-making + precedent',
    color: 'var(--cat-3)',
    keywords: [
      'process',
      'form',
      'precedent',
      'sketch',
      'mark-up',
      'iteration',
      'option',
      'site planning',
      'massing',
    ],
    subs: [
      { id: 'pf-sketches', name: 'Sketches + mark-ups' },
      { id: 'pf-precedent', name: 'Precedent analysis' },
      { id: 'pf-options', name: 'Site-planning + design options' },
    ],
  },
  {
    id: 'references',
    name: 'Reference list',
    color: 'var(--cat-7)',
    keywords: ['reference', 'apa', 'citation', 'cite', 'source', 'bibliography', 'quote'],
  },
  {
    id: 'ipd-notes',
    name: 'IPD / lecture notes',
    color: 'var(--cat-8)',
    keywords: ['ipd', 'lecture', 'notes', 'seminar', 'addendum', 'session'],
  },
];

export const utsCategories: Category[] = (() => {
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

/** Categories that expose the "relates to" heading tag in the composer. */
export const UTS_CAPTURE_IDS = ['feedback', 'ideas'];
