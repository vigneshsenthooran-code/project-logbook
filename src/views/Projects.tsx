import { useRef, useState } from 'react';
import { useStore } from '../store';
import type { Project } from '../types';
import type { ProjectBundle } from '../storage/StorageAdapter';
import { PRESETS } from '../presets';
import ProjectTile from '../components/ProjectTile';
import ProjectEditModal from '../components/ProjectEditModal';
import ProjectCreateModal from '../components/ProjectCreateModal';
import CategoryManager from '../components/CategoryManager';

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'project';
}

export default function Projects() {
  const projects = useStore((s) => s.projects);
  const entries = useStore((s) => s.entries);
  const activeProjectId = useStore((s) => s.activeProjectId);
  const switchProject = useStore((s) => s.switchProject);
  const archiveProject = useStore((s) => s.archiveProject);
  const unarchiveProject = useStore((s) => s.unarchiveProject);
  const deleteProject = useStore((s) => s.deleteProject);
  const exportProject = useStore((s) => s.exportProject);
  const importProject = useStore((s) => s.importProject);
  const config = useStore((s) => s.config);
  const applyPreset = useStore((s) => s.applyPreset);
  const customPresets = useStore((s) => s.customPresets);
  const deleteCustomPreset = useStore((s) => s.deleteCustomPreset);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const active = [...projects].filter((p) => !p.archived).sort((a, b) => a.order - b.order);
  const archived = [...projects].filter((p) => p.archived).sort((a, b) => a.order - b.order);
  const openProject = openProjectId ? projects.find((p) => p.id === openProjectId) : undefined;

  function entryCount(id: string): number {
    return entries.filter((e) => e.projectId === id).length;
  }

  async function openDetail(id: string) {
    await switchProject(id);
    setOpenProjectId(id);
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
    if (openProjectId === p.id) setOpenProjectId(null);
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

      {openProject ? (
        <section className="project-detail">
          <button className="btn btn-ghost project-detail-back" onClick={() => setOpenProjectId(null)}>
            ← All projects
          </button>
          <h2 className="t-display-sm">{openProject.name}</h2>

          <div className="settings-section">
            <h3 className="t-display-sm">Preset</h3>
            <p className="t-body-sm muted">Pick the category set that fits this project.</p>
            <div className="preset-list">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  className={`preset-card card ${config.activePreset === p.id ? 'is-active' : ''}`}
                  onClick={() => {
                    if (p.id === config.activePreset) return;
                    const msg =
                      entryCount(openProject.id) > 0
                        ? 'Switching preset replaces your category set. Existing entries are kept but may need re-filing. Continue?'
                        : 'Switch to this preset?';
                    if (confirm(msg)) void applyPreset(p.id);
                  }}
                >
                  <div className="preset-card-head">
                    <span className="t-title">{p.name}</span>
                    {config.activePreset === p.id && <span className="preset-badge">Active</span>}
                  </div>
                  <p className="t-body-sm muted">{p.description}</p>
                </button>
              ))}
              {customPresets.map((p) => (
                <div key={p.id} className={`preset-card card ${config.activePreset === p.id ? 'is-active' : ''}`}>
                  <button
                    className="preset-card-trigger"
                    onClick={() => {
                      if (p.id === config.activePreset) return;
                      const msg =
                        entryCount(openProject.id) > 0
                          ? 'Switching preset replaces your category set. Existing entries are kept but may need re-filing. Continue?'
                          : 'Switch to this preset?';
                      if (confirm(msg)) void applyPreset(p.id);
                    }}
                  >
                    <div className="preset-card-head">
                      <span className="t-title">{p.name}</span>
                      {config.activePreset === p.id && <span className="preset-badge">Active</span>}
                    </div>
                    <p className="t-body-sm muted">{p.description || 'Custom preset'}</p>
                  </button>
                  <button
                    className="btn btn-ghost btn-sm preset-card-del"
                    onClick={() => {
                      if (confirm(`Delete the "${p.name}" preset? Projects already using it keep their categories.`)) {
                        void deleteCustomPreset(p.id);
                      }
                    }}
                  >
                    Delete preset
                  </button>
                </div>
              ))}
            </div>
          </div>

          <section className="settings-section">
            <CategoryManager />
          </section>
        </section>
      ) : (
        <>
          <div className="project-grid">
            {active.map((p) => (
              <ProjectTile
                key={p.id}
                project={p}
                isActive={p.id === activeProjectId}
                entryCount={entryCount(p.id)}
                onOpen={() => void openDetail(p.id)}
                onEdit={() => setEditing(p)}
                onArchiveToggle={() => void handleArchiveToggle(p)}
                onExport={() => void handleExport(p)}
                onDelete={() => void handleDelete(p)}
              />
            ))}
          </div>

          {archived.length > 0 && (
            <div className="projects-archived">
              <button className="btn btn-ghost" onClick={() => setShowArchived((v) => !v)}>
                {showArchived ? '▾' : '▸'} Archived ({archived.length})
              </button>
              {showArchived && (
                <div className="project-grid">
                  {archived.map((p) => (
                    <ProjectTile
                      key={p.id}
                      project={p}
                      isActive={false}
                      entryCount={entryCount(p.id)}
                      onOpen={() => void openDetail(p.id)}
                      onEdit={() => setEditing(p)}
                      onArchiveToggle={() => void handleArchiveToggle(p)}
                      onExport={() => void handleExport(p)}
                      onDelete={() => void handleDelete(p)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {creating && <ProjectCreateModal onClose={() => setCreating(false)} />}
      {editing && <ProjectEditModal project={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
