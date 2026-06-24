import { useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
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
      if (!bundle.config || !Array.isArray(bundle.entries)) throw new Error('bad');
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
