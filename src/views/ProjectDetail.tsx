import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useStore } from '../store';
import EntryGrid from '../components/EntryGrid';
import FilterSortBar, { type SortMode } from '../components/FilterSortBar';
import ProjectEditModal from '../components/ProjectEditModal';
import { filterAndSort } from '../lib/sortEntries';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ProjectDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const project = useStore((s) => s.projects.find((p) => p.id === id));
  const categories = useStore((s) => s.configsByProject[id]?.categories ?? []);
  const entries = useStore((s) => s.entries).filter((e) => e.projectId === id);
  const switchProject = useStore((s) => s.switchProject);
  const getAttachment = useStore((s) => s.getAttachment);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortMode>('newest');
  const [editing, setEditing] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const query = params.get('q') ?? '';

  // Keep the rest of the app (pill bar, capture) pointed at this project.
  useEffect(() => {
    if (id) void switchProject(id);
  }, [id, switchProject]);

  // A project may have been deleted out from under this route.
  useEffect(() => {
    if (project === undefined) navigate('/projects', { replace: true });
  }, [project, navigate]);

  // Honour ?cat=… deep links from the project pill bar.
  useEffect(() => {
    const cat = params.get('cat');
    if (cat) setSelected(new Set([cat]));
  }, [params]);

  useEffect(() => {
    let url: string | null = null;
    let alive = true;
    if (project?.coverAttachmentId) {
      void getAttachment(project.coverAttachmentId).then((att) => {
        if (att && alive) {
          url = URL.createObjectURL(att.blob);
          setCoverUrl(url);
        }
      });
    } else {
      setCoverUrl(null);
    }
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [project?.coverAttachmentId, getAttachment]);

  function toggle(catId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
    if (params.get('cat')) setParams({}, { replace: true });
  }

  function clear() {
    setSelected(new Set());
    if (params.get('cat')) setParams({}, { replace: true });
  }

  if (!project) return null;

  const shown = filterAndSort(entries, categories, selected, sort, query);

  return (
    <div className="browse project-page">
      <Link to="/projects" className="btn btn-ghost project-detail-back">
        ← All projects
      </Link>

      <header className="project-page-head card">
        <div
          className="project-page-cover"
          style={
            coverUrl
              ? { backgroundImage: `url(${coverUrl})` }
              : { background: 'linear-gradient(135deg, var(--cat-1), var(--cat-3))' }
          }
        >
          {!coverUrl && <span className="project-page-cover-mark">{project.name.slice(0, 1).toUpperCase()}</span>}
        </div>
        <div className="project-page-head-body">
          <h1 className="t-display-xl">{project.name}</h1>
          {project.description && <p className="muted">{project.description}</p>}
          <div className="project-page-meta t-caption-sm muted">
            {project.startDate && <span>Started {formatDate(project.startDate)}</span>}
            <span>
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>
          <div className="project-page-actions">
            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
              Edit project
            </button>
          </div>
        </div>
      </header>

      <FilterSortBar
        categories={categories}
        selected={selected}
        onToggle={toggle}
        onClear={clear}
        sort={sort}
        onSort={setSort}
      />

      <EntryGrid
        entries={shown}
        categories={categories}
        emptyMessage={
          entries.length === 0
            ? 'No entries yet — capture something on the Dashboard.'
            : 'No entries match this filter.'
        }
      />

      {editing && <ProjectEditModal project={project} onClose={() => setEditing(false)} />}
    </div>
  );
}
