import { useMemo } from 'react';
import { useStore } from '../store';
import { findSearchPreviews } from '../lib/searchPreview';

const LIMIT = 5;

export default function TopbarSearchResults({ query, onSelect }: { query: string; onSelect: () => void }) {
  const projects = useStore((s) => s.projects);
  const configsByProject = useStore((s) => s.configsByProject);
  const entries = useStore((s) => s.entries);

  const results = useMemo(
    () => findSearchPreviews(query, projects, configsByProject, entries, LIMIT),
    [query, projects, configsByProject, entries]
  );

  if (!query.trim()) return null;

  return (
    <div className="topbar-search-results">
      {results.length === 0 ? (
        <p className="topbar-search-results-empty t-caption-sm muted">No entries match “{query.trim()}”.</p>
      ) : (
        results.map((r) => (
          <button key={r.entry.id} type="button" className="topbar-search-result" onClick={onSelect}>
            <span className="topbar-search-result-meta t-caption-sm muted">
              {r.projectName}
              {r.categoryName ? ` · ${r.categoryName}` : ''}
            </span>
            <span className="topbar-search-result-snippet">
              {r.snippet.before && <span>{r.snippet.before} </span>}
              <strong>{r.snippet.match}</strong>
              {r.snippet.after && <span> {r.snippet.after}</span>}
            </span>
          </button>
        ))
      )}
      <button type="button" className="topbar-search-results-footer" onClick={onSelect}>
        See all results for “{query.trim()}” →
      </button>
    </div>
  );
}
