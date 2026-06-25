import { useEffect, useState } from 'react';
import type { Project } from '../types';
import { useStore } from '../store';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

const COVER_GRADIENTS = [
  'linear-gradient(135deg, var(--cat-1), var(--cat-3))',
  'linear-gradient(135deg, var(--cat-4), var(--cat-6))',
  'linear-gradient(135deg, var(--cat-5), var(--cat-7))',
  'linear-gradient(135deg, var(--cat-8), var(--cat-3))',
];

export default function ProjectTile({
  project,
  isActive,
  entryCount,
  onOpen,
  onEdit,
  onArchiveToggle,
  onExport,
  onDelete,
}: {
  project: Project;
  isActive: boolean;
  entryCount: number;
  onOpen: () => void;
  onEdit: () => void;
  onArchiveToggle: () => void;
  onExport: () => void;
  onDelete: () => void;
}) {
  const getAttachment = useStore((s) => s.getAttachment);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    let url: string | null = null;
    let alive = true;
    if (project.coverAttachmentId) {
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
  }, [project.coverAttachmentId, getAttachment]);

  const gradient = COVER_GRADIENTS[Math.abs(hashCode(project.id)) % COVER_GRADIENTS.length];

  return (
    <article className={`project-tile card ${project.archived ? 'is-archived' : ''} ${isActive ? 'is-active' : ''}`}>
      <button className="project-tile-cover" onClick={onOpen} style={!coverUrl ? { background: gradient } : undefined}>
        {coverUrl ? <img src={coverUrl} alt="" /> : <span className="project-tile-cover-mark">{project.name.slice(0, 1).toUpperCase()}</span>}
        {isActive && <span className="project-tile-badge">Active</span>}
        {project.archived && <span className="project-tile-badge project-tile-badge-archived">Archived</span>}
      </button>

      <div className="project-tile-body">
        <button className="project-tile-name" onClick={onOpen} title="Open project">
          {project.name}
        </button>
        {project.description && <p className="t-body-sm muted project-tile-desc">{project.description}</p>}
        <div className="project-tile-meta t-caption-sm muted">
          {project.startDate && <span>Started {formatDate(project.startDate)}</span>}
          <span>{entryCount} {entryCount === 1 ? 'entry' : 'entries'}</span>
        </div>

        <div className="project-tile-actions">
          <button className="btn btn-secondary btn-sm" onClick={onEdit}>
            Edit
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onExport}>
            Export
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onArchiveToggle}>
            {project.archived ? 'Unarchive' : 'Archive'}
          </button>
          <button className="btn btn-ghost btn-sm project-tile-del" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}
