import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import type { Project } from '../types';
import type { ProjectBundle } from '../storage/StorageAdapter';
import ProjectTile from '../components/ProjectTile';
import ProjectEditModal from '../components/ProjectEditModal';
import ProjectCreateModal from '../components/ProjectCreateModal';
import Masonry from '../components/Masonry';

const UNFILED = '__unfiled__';
const ALL = '__all__';

type SortMode = 'recent' | 'alphabetical' | 'manual';

const SORTERS: Record<SortMode, (a: Project, b: Project) => number> = {
  recent: (a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
  alphabetical: (a, b) => a.name.localeCompare(b.name),
  manual: (a, b) => a.order - b.order,
};

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'project';
}

export default function Projects() {
  const navigate = useNavigate();
  const projects = useStore((s) => s.projects);
  const entries = useStore((s) => s.entries);
  const folders = useStore((s) => s.folders);
  const activeProjectId = useStore((s) => s.activeProjectId);
  const switchProject = useStore((s) => s.switchProject);
  const archiveProject = useStore((s) => s.archiveProject);
  const unarchiveProject = useStore((s) => s.unarchiveProject);
  const deleteProject = useStore((s) => s.deleteProject);
  const exportProject = useStore((s) => s.exportProject);
  const importProject = useStore((s) => s.importProject);
  const moveProjectToFolder = useStore((s) => s.moveProjectToFolder);
  const addFolder = useStore((s) => s.addFolder);
  const renameFolder = useStore((s) => s.renameFolder);
  const deleteFolder = useStore((s) => s.deleteFolder);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>(ALL);
  const [sortMode, setSortMode] = useState<SortMode>('manual');
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const sortedFolders = useMemo(() => [...folders].sort((a, b) => a.order - b.order), [folders]);

  function inSelectedFolder(p: Project): boolean {
    if (selectedFolder === ALL) return true;
    if (selectedFolder === UNFILED) return !p.folderId;
    return p.folderId === selectedFolder;
  }

  const visible = projects.filter(inSelectedFolder);
  const active = [...visible].filter((p) => !p.archived).sort(SORTERS[sortMode]);
  const archived = [...visible].filter((p) => p.archived).sort(SORTERS[sortMode]);

  function folderCount(id: string | null): number {
    return projects.filter((p) => (id === null ? !p.folderId : p.folderId === id) && !p.archived).length;
  }

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

  async function submitNewFolder() {
    const name = newFolderName.trim();
    if (name) await addFolder(name);
    setNewFolderName('');
    setAddingFolder(false);
  }

  function startRenameFolder(id: string, currentName: string) {
    setRenamingFolderId(id);
    setRenameValue(currentName);
  }

  async function submitRenameFolder() {
    const id = renamingFolderId;
    const name = renameValue.trim();
    if (id && name) await renameFolder(id, name);
    setRenamingFolderId(null);
    setRenameValue('');
  }

  function handleDeleteFolder(id: string, name: string) {
    if (!confirm(`Delete the "${name}" folder? Its projects move to Unfiled — nothing is deleted.`)) return;
    if (selectedFolder === id) setSelectedFolder(ALL);
    void deleteFolder(id);
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

      <div className="projects-toolbar">
        <div className="folder-rail">
          <button
            className={`folder-pill ${selectedFolder === ALL ? 'is-active' : ''}`}
            onClick={() => setSelectedFolder(ALL)}
          >
            All projects
            <span className="folder-pill-count">{projects.filter((p) => !p.archived).length}</span>
          </button>
          <button
            className={`folder-pill ${selectedFolder === UNFILED ? 'is-active' : ''}`}
            onClick={() => setSelectedFolder(UNFILED)}
          >
            Unfiled
            <span className="folder-pill-count">{folderCount(null)}</span>
          </button>
          {sortedFolders.map((f) =>
            renamingFolderId === f.id ? (
              <input
                key={f.id}
                className="input folder-pill-input"
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void submitRenameFolder();
                  if (e.key === 'Escape') setRenamingFolderId(null);
                }}
                onBlur={() => void submitRenameFolder()}
              />
            ) : (
              <div key={f.id} className={`folder-pill folder-pill-group ${selectedFolder === f.id ? 'is-active' : ''}`}>
                <button className="folder-pill-main" onClick={() => setSelectedFolder(f.id)}>
                  {f.name}
                  <span className="folder-pill-count">{folderCount(f.id)}</span>
                </button>
                <button
                  className="folder-pill-edit"
                  title="Rename folder"
                  onClick={() => startRenameFolder(f.id, f.name)}
                >
                  ✎
                </button>
                <button
                  className="folder-pill-del"
                  title="Delete folder"
                  onClick={() => handleDeleteFolder(f.id, f.name)}
                >
                  ×
                </button>
              </div>
            )
          )}
          {addingFolder ? (
            <input
              className="input folder-pill-input"
              autoFocus
              placeholder="Folder name…"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void submitNewFolder();
                if (e.key === 'Escape') {
                  setAddingFolder(false);
                  setNewFolderName('');
                }
              }}
              onBlur={() => void submitNewFolder()}
            />
          ) : (
            <button className="folder-pill folder-pill-new" onClick={() => setAddingFolder(true)}>
              + Folder
            </button>
          )}
        </div>

        <label className="projects-sort">
          <span className="t-caption-sm muted">Sort</span>
          <select className="input" value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)}>
            <option value="manual">Manual order</option>
            <option value="recent">Most recent</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
        </label>
      </div>

      {active.length === 0 && (
        <p className="t-body-sm muted projects-empty">No projects here yet.</p>
      )}

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
              folders={sortedFolders}
              onOpen={() => void openProject(p.id)}
              onEdit={() => void openEdit(p)}
              onArchiveToggle={() => void handleArchiveToggle(p)}
              onExport={() => void handleExport(p)}
              onDelete={() => void handleDelete(p)}
              onMoveToFolder={(folderId) => void moveProjectToFolder(p.id, folderId)}
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
                    folders={sortedFolders}
                    onOpen={() => void openProject(p.id)}
                    onEdit={() => void openEdit(p)}
                    onArchiveToggle={() => void handleArchiveToggle(p)}
                    onExport={() => void handleExport(p)}
                    onDelete={() => void handleDelete(p)}
                    onMoveToFolder={(folderId) => void moveProjectToFolder(p.id, folderId)}
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
