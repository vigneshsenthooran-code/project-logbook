// Right-of-map project list on the dashboard. Folder-grouped, collapsible
// groups; clicking a row switches the active project.
import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { groupProjects } from '../lib/groupProjects';

// Persisted per-folder collapse state, separate from the Projects page's own
// collapse state since this is a different list in a different context.
const COLLAPSE_STORAGE_KEY = 'quire.projectSwitcher.collapsedFolders';

function readCollapsedFolders(): Set<string> {
  try {
    const raw = localStorage.getItem(COLLAPSE_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function writeCollapsedFolders(set: Set<string>) {
  localStorage.setItem(COLLAPSE_STORAGE_KEY, JSON.stringify([...set]));
}

export default function ProjectSwitcher() {
  const allProjects = useStore((s) => s.projects);
  const folders = useStore((s) => s.folders);
  const activeProjectId = useStore((s) => s.activeProjectId);
  const switchProject = useStore((s) => s.switchProject);

  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(() => readCollapsedFolders());

  const projects = useMemo(() => allProjects.filter((p) => !p.archived), [allProjects]);
  const sortedFolders = useMemo(() => [...folders].sort((a, b) => a.order - b.order), [folders]);
  const groups = useMemo(() => groupProjects(projects, sortedFolders), [projects, sortedFolders]);

  function toggleFolderCollapsed(key: string) {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      writeCollapsedFolders(next);
      return next;
    });
  }

  return (
    <aside className="project-switcher">
      <div className="project-switcher-list">
        {groups.map((g) => (
          <div key={g.key} className="project-switcher-group">
            <button className="project-switcher-group-head" onClick={() => toggleFolderCollapsed(g.key)}>
              {collapsedFolders.has(g.key) ? '▸' : '▾'}
              <span className="project-switcher-group-name">{g.label}</span>
              <span className="project-switcher-group-count">{g.projects.length}</span>
            </button>
            {!collapsedFolders.has(g.key) &&
              g.projects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`project-switcher-item ${p.id === activeProjectId ? 'is-active' : ''}`}
                  onClick={() => switchProject(p.id)}
                >
                  <span className="project-switcher-item-name">{p.name}</span>
                </button>
              ))}
          </div>
        ))}
        {projects.length === 0 && <p className="project-switcher-empty t-caption-sm muted">No projects yet.</p>}
      </div>
    </aside>
  );
}
