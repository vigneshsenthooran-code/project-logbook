import { useState } from 'react';
import { useStore } from '../store';
import { PRESETS } from '../presets';
import CategoryManager from '../components/CategoryManager';

export default function Settings() {
  const activePreset = useStore((s) => s.config.activePreset);
  const applyPreset = useStore((s) => s.applyPreset);
  const entries = useStore((s) => s.entries);
  const projects = useStore((s) => s.projects);
  const activeProjectId = useStore((s) => s.activeProjectId);
  const addProject = useStore((s) => s.addProject);
  const renameProject = useStore((s) => s.renameProject);
  const deleteProject = useStore((s) => s.deleteProject);
  const switchProject = useStore((s) => s.switchProject);

  const [newName, setNewName] = useState('');
  const [newPreset, setNewPreset] = useState(PRESETS[0].id);

  function choosePreset(id: string) {
    if (id === activePreset) return;
    const msg =
      entries.length > 0
        ? 'Switching preset replaces your category set. Existing entries are kept but may need re-filing. Continue?'
        : 'Switch to this preset?';
    if (confirm(msg)) void applyPreset(id);
  }

  function createProject() {
    const name = newName.trim();
    if (!name) return;
    void addProject(name, newPreset);
    setNewName('');
  }

  function removeProject(id: string, name: string) {
    if (projects.length <= 1) {
      alert('You need at least one project.');
      return;
    }
    if (confirm(`Delete "${name}" and everything filed in it? This cannot be undone.`)) {
      void deleteProject(id);
    }
  }

  return (
    <div className="settings">
      <header className="view-head">
        <h1 className="t-display-xl">Settings</h1>
        <p className="muted">Tune your categories, keywords, and preset.</p>
      </header>

      <section className="settings-section">
        <h2 className="t-display-sm">Projects</h2>
        <p className="t-body-sm muted">
          Separate capture spaces — each with its own categories and entries.
        </p>
        <div className="project-list">
          {[...projects]
            .sort((a, b) => a.order - b.order)
            .map((p) => (
              <div key={p.id} className={`project-row card ${p.id === activeProjectId ? 'is-active' : ''}`}>
                <input
                  className="input project-row-name"
                  value={p.name}
                  onChange={(e) => void renameProject(p.id, e.target.value)}
                />
                {p.id === activeProjectId ? (
                  <span className="preset-badge">Active</span>
                ) : (
                  <button className="btn btn-secondary" onClick={() => void switchProject(p.id)}>
                    Switch to
                  </button>
                )}
                <button
                  className="btn btn-ghost catmgr-del"
                  onClick={() => removeProject(p.id, p.name)}
                  disabled={projects.length <= 1}
                >
                  Delete
                </button>
              </div>
            ))}
        </div>

        <div className="project-add card">
          <input
            className="input"
            placeholder="New project name…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createProject()}
          />
          <select className="input" value={newPreset} onChange={(e) => setNewPreset(e.target.value)}>
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={createProject}>
            + Add project
          </button>
        </div>
      </section>

      <section className="settings-section">
        <h2 className="t-display-sm">Preset</h2>
        <p className="t-body-sm muted">Pick the category set that fits this project.</p>
        <div className="preset-list">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              className={`preset-card card ${activePreset === p.id ? 'is-active' : ''}`}
              onClick={() => choosePreset(p.id)}
            >
              <div className="preset-card-head">
                <span className="t-title">{p.name}</span>
                {activePreset === p.id && <span className="preset-badge">Active</span>}
              </div>
              <p className="t-body-sm muted">{p.description}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <CategoryManager />
      </section>
    </div>
  );
}
