import { useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store';
import type { LogbookBundle } from '../storage/StorageAdapter';

export default function Topbar() {
  const exportBundle = useStore((s) => s.exportBundle);
  const importBundle = useStore((s) => s.importBundle);
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(() => (location.pathname === '/browse' ? params.get('q') ?? '' : ''));

  function submitSearch() {
    const q = query.trim();
    navigate(q ? `/browse?q=${encodeURIComponent(q)}` : '/browse');
  }

  async function handleExport() {
    const bundle = await exportBundle();
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logbook-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportFile(file: File) {
    const text = await file.text();
    try {
      const bundle = JSON.parse(text) as LogbookBundle;
      if (!Array.isArray(bundle.projects) || !Array.isArray(bundle.entries)) throw new Error('bad');
      if (!confirm('Importing will replace your current logbook. Continue?')) return;
      await importBundle(bundle);
      navigate('/');
    } catch {
      alert('That file does not look like a Quire export.');
    }
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

        <div className="topbar-tools" role="group" aria-label="Logbook data">
          <button className="topbar-tool" onClick={handleExport}>
            <span className="topbar-tool-index">01</span>
            <span className="topbar-tool-icon" aria-hidden>
              ↓
            </span>
            <span className="topbar-tool-label">Export</span>
          </button>
          <span className="topbar-tool-divider" aria-hidden />
          <button className="topbar-tool" onClick={() => fileRef.current?.click()}>
            <span className="topbar-tool-index">02</span>
            <span className="topbar-tool-icon" aria-hidden>
              ↑
            </span>
            <span className="topbar-tool-label">Import</span>
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleImportFile(f);
            e.target.value = '';
          }}
        />
      </div>
    </header>
  );
}
