import { useEffect, useState } from 'react';
import type { Folder, Project } from '../types';
import { useStore } from '../store';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

// Cover fallback when no image is set — kept within the app's dark
// olive/near-black/lime language instead of the old bright cat-color swatches,
// so untouched tiles read as part of the same surface as everything else.
const COVER_GRADIENTS = [
  'linear-gradient(135deg, var(--color-surface-strong), var(--color-card))',
  'linear-gradient(135deg, var(--color-card-strong), var(--color-surface-strong))',
  'linear-gradient(135deg, var(--color-primary-pale), var(--color-card))',
  'linear-gradient(135deg, var(--color-card), var(--color-canvas))',
];

export default function ProjectTile({
  project,
  isActive,
  entryCount,
  folders,
  onOpen,
  onEdit,
  onArchiveToggle,
  onExport,
  onDelete,
  onMoveToFolder,
}: {
  project: Project;
  isActive: boolean;
  entryCount: number;
  folders: Folder[];
  onOpen: () => void;
  onEdit: () => void;
  onArchiveToggle: () => void;
  onExport: () => void;
  onDelete: () => void;
  onMoveToFolder: (folderId: string | undefined) => void;
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
    <article className={`project-tile ${project.archived ? 'is-archived' : ''} ${isActive ? 'is-active' : ''}`}>
      <div className="project-tile-outline">
        <div className="project-tile-surface card-cutout">
          <button className="project-tile-cover" onClick={onOpen} style={!coverUrl ? { background: gradient } : undefined}>
            {coverUrl ? <img src={coverUrl} alt="" /> : <span className="project-tile-cover-mark">{project.name.slice(0, 1).toUpperCase()}</span>}
            {isActive && <span className="project-tile-badge">Active</span>}
            {project.archived && <span className="project-tile-badge project-tile-badge-archived">Archived</span>}
          </button>

          <div className="project-tile-body">
            <button className="project-tile-name" onClick={onOpen}>{project.name}</button>
            {project.description && <p className="t-body-sm muted project-tile-desc">{project.description}</p>}
            <div className="project-tile-meta t-caption-sm muted">
              {project.startDate && <span>Started {formatDate(project.startDate)}</span>}
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

            {folders.length > 0 && (
              <select
                className="input project-tile-folder-select"
                value={project.folderId ?? ''}
                onChange={(e) => onMoveToFolder(e.target.value || undefined)}
                onClick={(e) => e.stopPropagation()}
              >
                <option value="">Unfiled</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      <button className="card-notch-label project-tile-notch" onClick={onOpen} title="Open project">
        <span className="card-notch-title">{entryCount}</span>
        <span className="card-notch-year">{entryCount === 1 ? 'entry' : 'entries'}</span>
      </button>
    </article>
  );
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}
