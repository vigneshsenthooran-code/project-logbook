import { Link } from 'react-router-dom';
import { useStore } from '../store';
import EntryComposer from '../components/EntryComposer';
import EntryGrid from '../components/EntryGrid';
import CalendarWidget from '../components/CalendarWidget';
import TodoList from '../components/TodoList';
import DecorMark from '../components/DecorMark';
import { filterAndSort } from '../lib/sortEntries';

export default function Dashboard() {
  const activeProjectId = useStore((s) => s.activeProjectId);
  const activeProject = useStore((s) => s.projects.find((p) => p.id === s.activeProjectId));
  const entries = useStore((s) => s.entries).filter((e) => e.projectId === activeProjectId);
  const categories = useStore((s) => s.config.categories);

  const recent = filterAndSort(entries, categories, new Set(), 'newest').slice(0, 8);

  return (
    <div className="dashboard">
      <section className="hero">
        <div className="hero-inner">
          <DecorMark className="hero-mark" size={64} />
          <p className="hero-eyebrow t-eyebrow">
            {activeProject ? activeProject.name : 'Project Logbook'} · {entries.length} entries
          </p>
          <h1 className="hero-title">
            <span className="hero-line">CAPTURE THE</span>
            <span className="hero-line">
              <span className="serif-accent">work,</span> FILE THE
            </span>
            <span className="hero-line">
              <span className="serif-accent">thinking.</span>
            </span>
          </h1>
          <a className="hero-scroll" href="#dashboard-body">
            Scroll to your logbook
            <span className="hero-scroll-arrow" aria-hidden>
              ↓
            </span>
          </a>
        </div>
      </section>

      <div className="dashboard-body" id="dashboard-body">
        <div className="dashboard-grid">
          <div className="dashboard-main">
            <EntryComposer />
            <div className="dashboard-recent">
              <div className="section-head">
                <h2 className="t-display-sm">Recent</h2>
                <Link to={`/projects/${activeProjectId}`} className="t-caption-sm">
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
    </div>
  );
}
