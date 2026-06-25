import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

export default function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  const [query, setQuery] = useState(() => (location.pathname === '/browse' ? params.get('q') ?? '' : ''));

  function submitSearch() {
    const q = query.trim();
    navigate(q ? `/browse?q=${encodeURIComponent(q)}` : '/browse');
  }

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="topbar-brand">
          <svg className="topbar-mark" viewBox="0 0 36 36" fill="none" aria-hidden>
            <rect x="10" y="10" width="21" height="22" rx="6" fill="#ffffff" stroke="#5ea33d" strokeWidth="2" />
            <rect x="5" y="5" width="24" height="24" rx="6" fill="var(--color-primary)" stroke="#4f8f33" strokeWidth="2.2" />
            <rect x="10.5" y="12.6" width="13" height="2.6" rx="1.3" fill="#4f8f33" />
            <rect x="10.5" y="17.3" width="13" height="2.6" rx="1.3" fill="#4f8f33" />
            <rect x="10.5" y="22" width="8" height="2.6" rx="1.3" fill="#4f8f33" />
          </svg>
          <span className="topbar-brand-name">Quire</span>
        </Link>

        <nav className="topbar-nav">
          <NavLink to="/" end className="topbar-navlink">
            Dashboard
          </NavLink>
          <NavLink to="/browse" className="topbar-navlink">
            Browse
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
      </div>
    </header>
  );
}
