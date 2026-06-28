import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { entryCounts, topCategories } from '../lib/categories';
import { INBOX_ID } from '../types';

export default function ProjectPillBar() {
  const projects = useStore((s) => s.projects);
  const activeProjectId = useStore((s) => s.activeProjectId);
  const switchProject = useStore((s) => s.switchProject);
  const categories = useStore((s) => s.config.categories);
  const entries = useStore((s) => s.entries);
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const visible = projects.filter((p) => !p.archived);
  const idx = visible.findIndex((p) => p.id === activeProjectId);
  const active = visible[idx];

  if (!active) return null;

  const counts = entryCounts(entries.filter((e) => e.projectId === activeProjectId));
  const cats = topCategories(categories).filter((c) => c.id !== INBOX_ID);

  function step(dir: -1 | 1) {
    if (visible.length < 2) return;
    const next = visible[(idx + dir + visible.length) % visible.length];
    setExpanded(false);
    void switchProject(next.id);
  }

  function goToCategory(catId: string) {
    setExpanded(false);
    navigate(`/projects/${activeProjectId}?cat=${encodeURIComponent(catId)}`);
  }

  return (
    <div className="projectbar">
      {expanded && (
        <div className="projectbar-panel card">
          <div className="projectbar-panel-head t-caption-sm muted t-uppercase">
            {active.name} · categories
          </div>
          <div className="projectbar-cats">
            {cats.map((c) => (
              <button key={c.id} className="projectbar-cat" onClick={() => goToCategory(c.id)}>
                <span className="tag-dot" style={{ background: c.color }} />
                <span className="projectbar-cat-name">{c.name}</span>
                <span className="projectbar-cat-count">{counts.get(c.id) ?? 0}</span>
              </button>
            ))}
            {cats.length === 0 && (
              <div className="t-body-sm muted projectbar-empty">No categories yet.</div>
            )}
          </div>
        </div>
      )}

      <div className="projectbar-pill">
        <button
          className="projectbar-arrow"
          onClick={() => step(-1)}
          disabled={visible.length < 2}
          aria-label="Previous project"
        >
          ‹
        </button>
        <button
          className={`projectbar-name ${expanded ? 'is-open' : ''}`}
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {active.name}
        </button>
        <button
          className="projectbar-arrow"
          onClick={() => step(1)}
          disabled={visible.length < 2}
          aria-label="Next project"
        >
          ›
        </button>
      </div>
    </div>
  );
}
