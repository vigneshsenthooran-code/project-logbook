import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import type { Project } from '../types';
import type { ProjectBundle } from '../storage/StorageAdapter';
import ProjectTile from '../components/ProjectTile';
import ProjectEditModal from '../components/ProjectEditModal';
import ProjectCreateModal from '../components/ProjectCreateModal';
import Masonry from '../components/Masonry';

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'project';
}

export default function Projects() {
  const navigate = useNavigate();
  const projects = useStore((s) => s.projects);
  const entries = useStore((s) => s.entries);
  const activeProjectId = useStore((s) => s.activeProjectId);
  const switchProject = useStore((s) => s.switchProject);
  const archiveProject = useStore((s) => s.archiveProject);
  const unarchiveProject = useStore((s) => s.unarchiveProject);
  const deleteProject = useStore((s) => s.deleteProject);
  const exportProject = useStore((s) => s.exportProject);
  const importProject = useStore((s) => s.importProject);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const active = [...projects].filter((p) => !p.archived).sort((a, b) => a.order - b.order);
  const archived = [...projects].filter((p) => p.archived).sort((a, b) => a.order - b.order);

  function entryCount(id: string): number {
    return entries.filter((e) => e.projectId === id).length;
  }

  async function openProject(id: string) {
    await switchProject(id);
    navigate(`/projects/${id}`);
  }

  // Editing categories/preset acts on the active project, so make the project
  // being edited active before opening the modal.
  async function openEdit(p: Project) {
    await switchProject(p.id);
    setEditing(p);
  }

  async function handleArchiveToggle(p: Project) {
    try {
      if (p.archived) await unarchiveProject(p.id);
      else await archiveProject(p.id);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not archive project.');
    }
  }

  async function handleDelete(p: Project) {
    if (projects.length <= 1) {
      alert('You need at least one project.');
      return;
    }
    if (!confirm(`Delete "${p.name}" and everything filed in it? This cannot be undone.`)) return;
    await deleteProject(p.id);
  }

  async function handleExport(p: Project) {
    const bundle = await exportProject(p.id);
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quire-${slugify(p.name)}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportFile(file: File) {
    const text = await file.text();
    try {
      const bundle = JSON.parse(text) as ProjectBundle;
      if (!bundle.project || !bundle.config || !Array.isArray(bundle.entries)) throw new Error('bad');
      await importProject(bundle);
    } catch {
      alert('That file does not look like a Quire project export.');
    }
  }

  return (
    <div className="settings">
      <header className="view-head projects-head">
        <div>
          <h1 className="t-display-xl">Projects</h1>
          <p className="muted">Separate capture spaces — each with its own categories and entries.</p>
        </div>
        <div className="projects-head-actions">
          <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
            ↑ Import project
          </button>
          <button className="btn btn-primary" onClick={() => setCreating(true)}>
            + New project
          </button>
        </div>
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
      </header>

      <Masonry
        className="project-grid"
        minColumnWidth={260}
        gap={16}
        items={active.map((p) => ({
          key: p.id,
          node: (
            <ProjectTile
              project={p}
              isActive={p.id === activeProjectId}
              entryCount={entryCount(p.id)}
              onOpen={() => void openProject(p.id)}
              onEdit={() => void openEdit(p)}
              onArchiveToggle={() => void handleArchiveToggle(p)}
              onExport={() => void handleExport(p)}
              onDelete={() => void handleDelete(p)}
            />
          ),
        }))}
      />

      {archived.length > 0 && (
        <div className="projects-archived">
          <button className="btn btn-ghost" onClick={() => setShowArchived((v) => !v)}>
            {showArchived ? '▾' : '▸'} Archived ({archived.length})
          </button>
          {showArchived && (
            <Masonry
              className="project-grid"
              minColumnWidth={260}
              gap={16}
              items={archived.map((p) => ({
                key: p.id,
                node: (
                  <ProjectTile
                    project={p}
                    isActive={false}
                    entryCount={entryCount(p.id)}
                    onOpen={() => void openProject(p.id)}
                    onEdit={() => void openEdit(p)}
                    onArchiveToggle={() => void handleArchiveToggle(p)}
                    onExport={() => void handleExport(p)}
                    onDelete={() => void handleDelete(p)}
                  />
                ),
              }))}
            />
          )}
        </div>
      )}

      {creating && <ProjectCreateModal onClose={() => setCreating(false)} />}
      {editing && <ProjectEditModal project={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
