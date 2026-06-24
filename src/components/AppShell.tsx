import type { ReactNode } from 'react';
import Topbar from './Topbar';
import ProjectPillBar from './ProjectPillBar';

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="shell">
      <div className="shell-col">
        <Topbar />
        <main className="shell-main">{children}</main>
      </div>
      <ProjectPillBar />
    </div>
  );
}
