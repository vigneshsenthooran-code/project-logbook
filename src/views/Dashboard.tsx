import { Link } from 'react-router-dom';
import { useStore } from '../store';
import EntryComposer from '../components/EntryComposer';
import EntryGrid from '../components/EntryGrid';
import CalendarWidget from '../components/CalendarWidget';
import TodoList from '../components/TodoList';
import { filterAndSort } from '../lib/sortEntries';

export default function Dashboard() {
  const activeProjectId = useStore((s) => s.activeProjectId);
  const entries = useStore((s) => s.entries).filter((e) => e.projectId === activeProjectId);
  const categories = useStore((s) => s.config.categories);

  const recent = filterAndSort(entries, categories, new Set(), 'newest').slice(0, 8);

  return (
    <div className="dashboard">
      <header className="view-head">
        <h1 className="t-display-xl">Dashboard</h1>
        <p className="muted">Capture anything — the logbook will suggest where it belongs.</p>
      </header>

      <div className="dashboard-grid">
        <div className="dashboard-main">
          <EntryComposer />
          <div className="dashboard-recent">
            <div className="section-head">
              <h2 className="t-display-sm">Recent</h2>
              <Link to="/browse" className="t-caption-sm">
                Browse all →
              </Link>
            </div>
            <EntryGrid
              entries={recent}
              categories={categories}
              emptyMessage="Your first entry will appear here. Capture a thought above to begin."
            />
          </div>
        </div>

        <aside className="dashboard-rail">
          <CalendarWidget />
          <TodoList />
        </aside>
      </div>
    </div>
  );
}
