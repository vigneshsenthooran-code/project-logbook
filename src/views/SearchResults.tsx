import { Link, useSearchParams } from 'react-router-dom';
import { useStore } from '../store';
import EntryGrid from '../components/EntryGrid';
import { filterAndSort } from '../lib/sortEntries';

export default function SearchResults() {
  const [params] = useSearchParams();
  const query = (params.get('q') ?? '').trim();

  const projects = useStore((s) => s.projects);
  const configsByProject = useStore((s) => s.configsByProject);
  const allEntries = useStore((s) => s.entries);

  // Match within each project using that project's own category names, then
  // keep only the projects that have at least one hit.
  const groups = [...projects]
    .sort((a, b) => a.order - b.order)
    .map((p) => {
      const categories = configsByProject[p.id]?.categories ?? [];
      const entries = allEntries.filter((e) => e.projectId === p.id);
      const matches = query ? filterAndSort(entries, categories, new Set(), 'newest', query) : [];
      return { project: p, categories, matches };
    })
    .filter((g) => g.matches.length > 0);

  const total = groups.reduce((n, g) => n + g.matches.length, 0);

  return (
    <div className="browse">
      <header className="view-head">
        <h1 className="t-display-xl">Search</h1>
        <p className="muted">
          {!query
            ? 'Type in the search bar above to find entries across all your projects.'
            : `${total} ${total === 1 ? 'result' : 'results'} for “${query}” across ${groups.length} ${
                groups.length === 1 ? 'project' : 'projects'
              }.`}
        </p>
      </header>

      {query && total === 0 && (
        <div className="empty card">
          <div className="empty-mark">▦</div>
          <p className="t-body muted">No entries match “{query}”.</p>
        </div>
      )}

      {groups.map((g) => (
        <section key={g.project.id} className="search-group">
          <div className="section-head">
            <h2 className="t-display-sm">{g.project.name}</h2>
            <Link to={`/projects/${g.project.id}`} className="t-caption-sm">
              Open project →
            </Link>
          </div>
          <EntryGrid entries={g.matches} categories={g.categories} />
        </section>
      ))}
    </div>
  );
}
