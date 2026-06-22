import { useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { entryCounts, topCategories } from '../lib/categories';
import type { LogbookBundle } from '../storage/StorageAdapter';

export default function Sidebar() {
  const config = useStore((s) => s.config);
  const entries = useStore((s) => s.entries);
  const exportBundle = useStore((s) => s.exportBundle);
  const importBundle = useStore((s) => s.importBundle);
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const counts = entryCounts(entries);
  const cats = topCategories(config.categories);

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
      alert('That file does not look like a Project Logbook export.');
    }
  }

  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-mark">▦</span>
        <span className="t-title">Project Logbook</span>
      </div>

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

      <div className="sidebar-footer">
        <button className="btn btn-ghost t-body-sm" onClick={handleExport}>
          ⬇ Export
        </button>
        <button className="btn btn-ghost t-body-sm" onClick={() => fileRef.current?.click()}>
          ⬆ Import
        </button>
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
    </nav>
  );
}
