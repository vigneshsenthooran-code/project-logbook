import { useState, type ReactNode } from 'react';
import Sidebar from './Sidebar';

export default function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="shell">
      <button
        className="shell-hamburger btn btn-ghost"
        onClick={() => setMobileOpen((v) => !v)}
        aria-label="Toggle navigation"
      >
        ☰
      </button>
      <div
        className={`shell-sidebar ${mobileOpen ? 'is-open' : ''}`}
        onClick={() => setMobileOpen(false)}
      >
        <Sidebar />
      </div>
      {mobileOpen && <div className="shell-overlay" onClick={() => setMobileOpen(false)} />}
      <main className="shell-main">{children}</main>
    </div>
  );
}
