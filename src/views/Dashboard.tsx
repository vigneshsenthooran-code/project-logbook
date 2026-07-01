import { Link } from 'react-router-dom';
import { useStore } from '../store';
import EntryGrid from '../components/EntryGrid';
import CalendarWidget from '../components/CalendarWidget';
import ProjectMap from '../components/ProjectMap';
import ProjectSwitcher from '../components/ProjectSwitcher';
import { filterAndSort } from '../lib/sortEntries';

export default function Dashboard() {
  const activeProjectId = useStore((s) => s.activeProjectId);
  const entries = useStore((s) => s.entries).filter((e) => e.projectId === activeProjectId);
  const categories = useStore((s) => s.config.categories);

  const recent = filterAndSort(entries, categories, new Set(), 'newest').slice(0, 8);

  return (
    <div className="dashboard">
      <div className="dashboard-hero">
        <ProjectMap />
        <ProjectSwitcher />
      </div>
      <div className="dashboard-body" id="dashboard-body">
        <CalendarWidget />
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
    </div>
  );
}
