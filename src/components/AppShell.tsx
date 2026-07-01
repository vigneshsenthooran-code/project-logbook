import type { ReactNode } from 'react';
import Topbar from './Topbar';
import ContourBackground from './ContourBackground';
import EntryComposer from './EntryComposer';
import Footer from './Footer';

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="shell">
      <ContourBackground />
      <div className="shell-col">
        <Topbar />
        <main className="shell-main">
          {children}
          <Footer />
        </main>
      </div>
      <EntryComposer />
    </div>
  );
}
