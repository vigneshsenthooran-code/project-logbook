import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store';
import DecorMark from './DecorMark';
import TopbarSearchResults from './TopbarSearchResults';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/projects', label: 'Projects', end: false },
  { to: '/settings', label: 'Settings', end: false },
];

function currentPageLabel(pathname: string): string {
  if (pathname === '/search') return 'Search';
  const match = NAV_ITEMS.find((item) => (item.end ? pathname === item.to : pathname.startsWith(item.to)));
  return match?.label ?? 'Menu';
}

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
  const [searchOpen, setSearchOpen] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuWrapRef = useRef<HTMLDivElement>(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuWrapRef = useRef<HTMLDivElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!searchOpen) return;
    searchInputRef.current?.focus();
    function handlePointerDown(e: PointerEvent) {
      if (!searchWrapRef.current?.contains(e.target as Node)) setSearchOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setSearchOpen(false);
    }
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [searchOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    function handlePointerDown(e: PointerEvent) {
      if (!menuWrapRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    function handlePointerDown(e: PointerEvent) {
      if (!mobileMenuWrapRef.current?.contains(e.target as Node)) setMobileMenuOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    }
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  function submitSearch() {
    const q = query.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
    setSearchOpen(false);
    setMobileMenuOpen(false);
  }

  async function handleSeedDemo() {
    if (seeding) return;
    if (!window.confirm('Add 3 demo projects with sample entries across their categories?')) return;
    setSeeding(true);
    try {
      await seedDemoData();
      navigate('/');
      setMenuOpen(false);
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
      setMenuOpen(false);
    } finally {
      setClearing(false);
    }
  }

  return (
    <header className="topbar">
      <Link to="/" className="topbar-brand">
        <DecorMark className="topbar-mark" size={30} />
        <span className="topbar-brand-name">Quire</span>
      </Link>

      <div className="topbar-center">
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

        <div className="topbar-search-wrap" ref={searchWrapRef}>
          <button
            type="button"
            className={`topbar-search-toggle ${searchOpen ? 'is-open' : ''}`}
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Search the logbook"
            aria-expanded={searchOpen}
          >
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden>
              <circle cx="8.5" cy="8.5" r="6" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path d="M13.2 13.2 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>

          {searchOpen && (
            <div className="topbar-search-dropdown">
              <div className="topbar-search-dropdown-row">
                <svg className="topbar-search-dropdown-mark" viewBox="0 0 20 20" width="15" height="15" aria-hidden>
                  <circle cx="8.5" cy="8.5" r="6" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M13.2 13.2 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="search"
                  placeholder="Search the logbook…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitSearch()}
                />
              </div>
              <TopbarSearchResults query={query} onSelect={submitSearch} />
            </div>
          )}
        </div>

        {/* TEMPORARY demo seeder — remove with seedDemo.ts + store.seedDemoData */}
        <div className="topbar-menu-wrap" ref={menuWrapRef}>
          <button
            type="button"
            className={`topbar-menu-toggle ${menuOpen ? 'is-open' : ''}`}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="More actions"
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>

          {menuOpen && (
            <div className="topbar-menu-dropdown">
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
          )}
        </div>
      </div>

      {/* Collapsed mobile/narrow layout: current page tab + hamburger, everything
          else (nav, search, demo tools) lives inside the menu it opens. */}
      <div className="topbar-mobile" ref={mobileMenuWrapRef}>
        <div className="topbar-mobile-bar">
          <span className="topbar-mobile-current">{currentPageLabel(location.pathname)}</span>
          <button
            type="button"
            className={`topbar-mobile-toggle ${mobileMenuOpen ? 'is-open' : ''}`}
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={mobileMenuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="topbar-mobile-menu">
            <nav className="topbar-mobile-nav">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className="topbar-mobile-navlink">
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="topbar-mobile-menu-divider" />

            <div className="topbar-mobile-search-wrap">
              <div className="topbar-mobile-search">
                <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden>
                  <circle cx="8.5" cy="8.5" r="6" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M13.2 13.2 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                <input
                  ref={mobileSearchInputRef}
                  type="search"
                  placeholder="Search the logbook…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitSearch()}
                />
              </div>
              <TopbarSearchResults query={query} onSelect={submitSearch} />
            </div>

            <div className="topbar-mobile-menu-divider" />

            <div className="topbar-mobile-demo-tools">
              <button
                type="button"
                className="btn btn-secondary btn-sm topbar-seed-btn"
                onClick={handleSeedDemo}
                disabled={seeding}
              >
                {seeding ? 'Seeding…' : 'Seed demo'}
              </button>
              {hasDemo && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm topbar-seed-btn"
                  onClick={handleClearDemo}
                  disabled={clearing}
                >
                  {clearing ? 'Clearing…' : 'Clear demo'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
