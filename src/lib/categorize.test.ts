import { describe, it, expect } from 'vitest';
import { rankCategories, suggestCategory } from './categorize';
import type { Category } from '../types';
import { INBOX_ID } from '../types';

const cats: Category[] = [
  { id: 'inbox', name: 'Inbox', color: '', order: 999, keywords: [] },
  { id: 'feedback', name: 'Feedback', color: '', order: 0, keywords: ['feedback', 'tutor', 'review'] },
  { id: 'carbon', name: 'Carbon', color: '', order: 1, keywords: ['carbon', 'embodied energy'] },
  { id: 'country', name: 'Country', color: '', order: 2, keywords: ['country'] },
  { id: 'cwc-hydrology', name: 'Hydrology', color: '', order: 3, keywords: ['hydrology'], parentId: 'country' },
];

describe('rankCategories', () => {
  it('picks the category whose keyword appears', () => {
    const r = rankCategories('My tutor gave good feedback today', cats);
    expect(r[0].category.id).toBe('feedback');
  });

  it('weights multi-word keywords higher than single words', () => {
    const r = rankCategories('notes on embodied energy and carbon', cats);
    // "embodied energy" (2 words) + "carbon" both hit the carbon category.
    expect(r[0].category.id).toBe('carbon');
  });

  it('lifts a parent when a sub-heading matches', () => {
    const r = rankCategories('site hydrology study', cats);
    const ids = r.map((x) => x.category.id);
    expect(ids).toContain('cwc-hydrology');
    expect(ids).toContain('country'); // parent lifted
    expect(ids.indexOf('cwc-hydrology')).toBeLessThan(ids.indexOf('country'));
  });

  it('returns nothing for unmatched text', () => {
    expect(rankCategories('xyzzy plugh', cats)).toHaveLength(0);
  });

  it('does not match substrings of larger words', () => {
    // "carbonara" should not match "carbon"
    const r = rankCategories('I ate carbonara', cats);
    expect(r.find((x) => x.category.id === 'carbon')).toBeUndefined();
  });
});

describe('suggestCategory', () => {
  it('falls back to Inbox when nothing matches', () => {
    expect(suggestCategory('xyzzy plugh', cats).id).toBe(INBOX_ID);
  });

  it('returns the strongest match', () => {
    expect(suggestCategory('tutor review notes', cats).id).toBe('feedback');
  });
});
