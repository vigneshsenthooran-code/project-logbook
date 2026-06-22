import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../store';
import EntryGrid from '../components/EntryGrid';
import FilterSortBar, { type SortMode } from '../components/FilterSortBar';
import { filterAndSort } from '../lib/sortEntries';

export default function Browse() {
  const entries = useStore((s) => s.entries);
  const categories = useStore((s) => s.config.categories);
  const [params, setParams] = useSearchParams();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortMode>('newest');

  // Honour ?cat=… deep links from the sidebar.
  useEffect(() => {
    const cat = params.get('cat');
    if (cat) setSelected(new Set([cat]));
  }, [params]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    if (params.get('cat')) setParams({}, { replace: true });
  }

  function clear() {
    setSelected(new Set());
    if (params.get('cat')) setParams({}, { replace: true });
  }

  const shown = filterAndSort(entries, categories, selected, sort);

  return (
    <div className="browse">
      <header className="view-head">
        <h1 className="t-display-xl">Browse</h1>
        <p className="muted">
          {shown.length} {shown.length === 1 ? 'entry' : 'entries'}
          {selected.size > 0 ? ' in selected categories' : ''}.
        </p>
      </header>

      <FilterSortBar
        categories={categories}
        selected={selected}
        onToggle={toggle}
        onClear={clear}
        sort={sort}
        onSort={setSort}
      />

      <EntryGrid
        entries={shown}
        categories={categories}
        emptyMessage={
          entries.length === 0
            ? 'No entries yet — capture something on the Dashboard.'
            : 'No entries match this filter.'
        }
      />
    </div>
  );
}
