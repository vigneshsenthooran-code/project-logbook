// Right-of-map project list on the dashboard. Plain name bars; clicking a
// row switches the active project.
import { useMemo } from 'react';
import { useStore } from '../store';

export default function ProjectSwitcher() {
  const allProjects = useStore((s) => s.projects);
  const activeProjectId = useStore((s) => s.activeProjectId);
  const switchProject = useStore((s) => s.switchProject);

  const projects = useMemo(() => allProjects.filter((p) => !p.archived), [allProjects]);

  return (
    <aside className="project-switcher">
      <div className="project-switcher-list">
        {projects.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`project-switcher-item ${p.id === activeProjectId ? 'is-active' : ''}`}
            onClick={() => switchProject(p.id)}
          >
            <span className="project-switcher-item-name">{p.name}</span>
          </button>
        ))}
        {projects.length === 0 && <p className="project-switcher-empty t-caption-sm muted">No projects yet.</p>}
      </div>
    </aside>
  );
}
