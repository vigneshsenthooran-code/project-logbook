import { Link, NavLink } from 'react-router-dom';
import { useStore } from '../store';
import { entryCounts, topCategories } from '../lib/categories';

export default function Sidebar() {
  const config = useStore((s) => s.config);
  const entries = useStore((s) => s.entries);

  const counts = entryCounts(entries);
  const cats = topCategories(config.categories);

  return (
    <nav className="sidebar">
      <Link to="/" className="sidebar-brand">
        <svg className="sidebar-mark" viewBox="0 0 36 36" fill="none" aria-hidden>
          <rect x="10" y="10" width="21" height="22" rx="6" fill="#ffffff" stroke="#5ea33d" strokeWidth="2" />
          <rect x="5" y="5" width="24" height="24" rx="6" fill="var(--color-primary)" stroke="#4f8f33" strokeWidth="2.2" />
          <rect x="10.5" y="12.6" width="13" height="2.6" rx="1.3" fill="#4f8f33" />
          <rect x="10.5" y="17.3" width="13" height="2.6" rx="1.3" fill="#4f8f33" />
          <rect x="10.5" y="22" width="8" height="2.6" rx="1.3" fill="#4f8f33" />
        </svg>
        <span className="sidebar-brand-name">Quire</span>
      </Link>

      <div className="sidebar-nav">
        <NavLink to="/" end className="sidebar-link">
          <span>◉</span> Dashboard
        </NavLink>
        <NavLink to="/browse" className="sidebar-link">
          <span>▤</span> Browse
        </NavLink>
        <NavLink to="/settings" className="sidebar-link">
          <span>⚙</span> Settings
        </NavLink>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-head t-uppercase muted">Categories</div>
        <div className="sidebar-folders">
          {cats.map((c) => (
            <NavLink
              key={c.id}
              to={`/browse?cat=${encodeURIComponent(c.id)}`}
              className="sidebar-folder"
            >
              <span className="tag-dot" style={{ background: c.color }} />
              <span className="sidebar-folder-name">{c.name}</span>
              <span className="sidebar-folder-count">{counts.get(c.id) ?? 0}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
