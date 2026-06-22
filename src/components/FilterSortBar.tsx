import type { Category } from '../types';
import { topCategories } from '../lib/categories';

export type SortMode = 'newest' | 'category';

export default function FilterSortBar({
  categories,
  selected,
  onToggle,
  onClear,
  sort,
  onSort,
}: {
  categories: Category[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onClear: () => void;
  sort: SortMode;
  onSort: (s: SortMode) => void;
}) {
  const tops = topCategories(categories);

  return (
    <div className="filterbar">
      <div className="filterbar-chips">
        <button
          className={`filter-chip ${selected.size === 0 ? 'is-active' : ''}`}
          onClick={onClear}
        >
          All
        </button>
        {tops.map((c) => (
          <button
            key={c.id}
            className={`filter-chip ${selected.has(c.id) ? 'is-active' : ''}`}
            onClick={() => onToggle(c.id)}
          >
            <span className="tag-dot" style={{ background: c.color }} />
            {c.name}
          </button>
        ))}
      </div>
      <div className="filterbar-sort">
        <label className="t-caption-sm muted" htmlFor="sort">
          Sort
        </label>
        <select
          id="sort"
          className="input filterbar-select"
          value={sort}
          onChange={(e) => onSort(e.target.value as SortMode)}
        >
          <option value="newest">Newest first</option>
          <option value="category">Category order</option>
        </select>
      </div>
    </div>
  );
}
