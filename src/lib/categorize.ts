import type { Category } from '../types';
import { INBOX_ID } from '../types';

export interface Ranked {
  category: Category;
  score: number;
}

/** Normalise to lowercase and collapse whitespace. */
function norm(text: string): string {
  return ` ${text.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu, ' ').replace(/\s+/g, ' ')} `;
}

/**
 * Count occurrences of a whole-word keyword (which may be multi-word) inside a
 * normalised, space-padded haystack. Longer / multi-word keywords score higher.
 */
function keywordScore(haystack: string, keyword: string): number {
  const k = keyword.toLowerCase().trim();
  if (!k) return 0;
  const needle = ` ${k} `;
  let count = 0;
  let idx = haystack.indexOf(needle);
  while (idx !== -1) {
    count++;
    idx = haystack.indexOf(needle, idx + 1);
  }
  if (count === 0) return 0;
  const words = k.split(' ').length;
  // Multi-word and longer keywords are stronger signals.
  const weight = words * 2 + Math.min(k.length / 6, 3);
  return count * weight;
}

/**
 * Rank categories by how well their keyword lists match the entry text.
 * Returns categories sorted by descending score; only positive scores included.
 * Sub-headings are scored on their own keywords AND contribute to their parent.
 */
export function rankCategories(text: string, categories: Category[]): Ranked[] {
  const hay = norm(text);
  const scores = new Map<string, number>();

  for (const cat of categories) {
    if (cat.id === INBOX_ID) continue;
    let s = 0;
    for (const kw of cat.keywords) s += keywordScore(hay, kw);
    if (s > 0) {
      scores.set(cat.id, (scores.get(cat.id) ?? 0) + s);
      // A sub-heading match also lifts its parent.
      if (cat.parentId) {
        scores.set(cat.parentId, (scores.get(cat.parentId) ?? 0) + s * 0.5);
      }
    }
  }

  const ranked: Ranked[] = [];
  for (const cat of categories) {
    const s = scores.get(cat.id);
    if (s && s > 0) ranked.push({ category: cat, score: s });
  }
  ranked.sort((a, b) => b.score - a.score || a.category.order - b.category.order);
  return ranked;
}

/**
 * The category the app pre-selects in the confirm step. Falls back to Inbox when
 * nothing matches — never a silent guess.
 */
export function suggestCategory(text: string, categories: Category[]): Category {
  const ranked = rankCategories(text, categories);
  if (ranked.length > 0) return ranked[0].category;
  return categories.find((c) => c.id === INBOX_ID) ?? categories[0];
}
