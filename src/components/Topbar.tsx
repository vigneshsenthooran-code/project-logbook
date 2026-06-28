import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store';
import DecorMark from './DecorMark';

export default function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const seedDemoData = useStore((s) => s.seedDemoData);
  const clearDemoData = useStore((s) => s.clearDemoData);
  const hasDemo = useStore((s) => s.projects.some((p) => p.demo || p.name.startsWith('Demo — ')));
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);

  const [query, setQuery] = useState(() => (location.pathname === '/search' ? params.get('q') ?? '' : ''));

  function submitSearch() {
    const q = query.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  }

  async function handleSeedDemo() {
    if (seeding) return;
    if (!window.confirm('Add 3 demo projects with sample entries across their categories?')) return;
    setSeeding(true);
    try {
      await seedDemoData();
      navigate('/');
    } finally {
      setSeeding(false);
    }
  }

  async function handleClearDemo() {
    if (clearing) return;
    if (!window.confirm('Remove all demo projects and their entries?')) return;
    setClearing(true);
    try {
      await clearDemoData();
      navigate('/');
    } finally {
      setClearing(false);
    }
  }

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="topbar-brand">
          <DecorMark className="topbar-mark" size={30} />
          <span className="topbar-brand-name">Quire</span>
        </Link>

        <nav className="topbar-nav">
          <NavLink to="/" end className="topbar-navlink">
            Dashboard
          </NavLink>
          <NavLink to="/projects" className="topbar-navlink">
            Projects
          </NavLink>
          <NavLink to="/settings" className="topbar-navlink">
            Settings
          </NavLink>
        </nav>

        <label className="topbar-search">
          <span className="topbar-search-mark" aria-hidden>
            ⌖
          </span>
          <input
            type="search"
            placeholder="Search the logbook…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitSearch()}
          />
          <span className="topbar-search-corner topbar-search-corner-tl" aria-hidden />
          <span className="topbar-search-corner topbar-search-corner-tr" aria-hidden />
          <span className="topbar-search-corner topbar-search-corner-bl" aria-hidden />
          <span className="topbar-search-corner topbar-search-corner-br" aria-hidden />
        </label>

        {/* TEMPORARY demo seeder — remove with seedDemo.ts + store.seedDemoData */}
        <div className="topbar-demo-tools">
          <button
            type="button"
            className="btn btn-secondary btn-sm topbar-seed-btn"
            onClick={handleSeedDemo}
            disabled={seeding}
            title="Add 3 demo projects with sample entries"
          >
            {seeding ? 'Seeding…' : 'Seed demo'}
          </button>
          {hasDemo && (
            <button
              type="button"
              className="btn btn-ghost btn-sm topbar-seed-btn"
              onClick={handleClearDemo}
              disabled={clearing}
              title="Remove all demo projects"
            >
              {clearing ? 'Clearing…' : 'Clear demo'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
