import type { Category, Entry } from '../types';
import type { SortMode } from '../components/FilterSortBar';

export function filterAndSort(
  entries: Entry[],
  categories: Category[],
  selected: Set<string>,
  sort: SortMode
): Entry[] {
  const order = new Map(categories.map((c) => [c.id, c.order]));
  const filtered =
    selected.size === 0 ? entries : entries.filter((e) => selected.has(e.categoryId));
  const sorted = [...filtered];
  if (sort === 'newest') {
    sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } else {
    sorted.sort(
      (a, b) =>
        (order.get(a.categoryId) ?? 999) - (order.get(b.categoryId) ?? 999) ||
        b.createdAt.localeCompare(a.createdAt)
    );
  }
  return sorted;
}
