import type { Category, Entry } from '../types';

export function categoryMap(categories: Category[]): Map<string, Category> {
  return new Map(categories.map((c) => [c.id, c]));
}

/** Top-level categories (no parent), in order. */
export function topCategories(categories: Category[]): Category[] {
  return categories.filter((c) => !c.parentId).sort((a, b) => a.order - b.order);
}

export function subHeadings(categories: Category[], parentId: string): Category[] {
  return categories.filter((c) => c.parentId === parentId).sort((a, b) => a.order - b.order);
}

/** Count of entries filed directly under each category id. */
export function entryCounts(entries: Entry[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const e of entries) m.set(e.categoryId, (m.get(e.categoryId) ?? 0) + 1);
  return m;
}

export function categoryColor(categories: Category[], id?: string): string {
  if (!id) return 'var(--color-muted)';
  return categories.find((c) => c.id === id)?.color ?? 'var(--color-muted)';
}

export function categoryName(categories: Category[], id?: string): string {
  if (!id) return 'Uncategorised';
  return categories.find((c) => c.id === id)?.name ?? 'Uncategorised';
}
