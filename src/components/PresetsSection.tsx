import { useState } from 'react';
import { useStore } from '../store';
import { PRESETS } from '../presets';
import CategoryListEditor from './CategoryListEditor';
import type { Category } from '../types';

export default function PresetsSection() {
  const customPresets = useStore((s) => s.customPresets);
  const addCustomPreset = useStore((s) => s.addCustomPreset);
  const updateCustomPreset = useStore((s) => s.updateCustomPreset);
  const deleteCustomPreset = useStore((s) => s.deleteCustomPreset);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function handleNewPreset() {
    const preset = await addCustomPreset('New preset', '', []);
    setExpandedId(preset.id);
  }

  async function handleDuplicate(name: string, description: string, categories: Category[]) {
    const preset = await addCustomPreset(`${name} (copy)`, description, categories);
    setExpandedId(preset.id);
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete the "${name}" preset? Projects already using it keep their categories.`)) return;
    if (expandedId === id) setExpandedId(null);
    void deleteCustomPreset(id);
  }

  return (
    <section className="settings-section">
      <div className="catmgr-head">
        <div>
          <h2 className="t-display-sm">Presets</h2>
          <p className="t-body-sm muted">Category sets you can apply to any project.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => void handleNewPreset()}>
          + New preset
        </button>
      </div>

      <div className="preset-mgr-list">
        {customPresets.length === 0 && (
          <p className="t-body-sm muted">No custom presets yet — build one below or save one from a project's categories.</p>
        )}
        {customPresets.map((p) => (
          <div key={p.id} className="card preset-mgr-item">
            <div className="preset-mgr-row">
              <input
                className="input preset-mgr-name"
                value={p.name}
                onChange={(e) => void updateCustomPreset(p.id, { name: e.target.value })}
              />
              <input
                className="input preset-mgr-desc"
                placeholder="Short description (optional)"
                value={p.description}
                onChange={(e) => void updateCustomPreset(p.id, { description: e.target.value })}
              />
              <div className="catmgr-actions">
                <button
                  className="btn btn-ghost"
                  onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                >
                  {expandedId === p.id ? 'Hide categories' : `Edit categories (${p.categories.length})`}
                </button>
                <button className="btn btn-ghost catmgr-del" onClick={() => handleDelete(p.id, p.name)}>
                  Delete
                </button>
              </div>
            </div>

            {expandedId === p.id && (
              <CategoryListEditor
                categories={p.categories}
                onChange={(categories) => void updateCustomPreset(p.id, { categories })}
              />
            )}
          </div>
        ))}
      </div>

      <div className="preset-mgr-builtins">
        <h3 className="t-title">Built-in presets</h3>
        <p className="t-body-sm muted">Always available, can't be edited — duplicate one to customise it.</p>
        <div className="preset-list">
          {PRESETS.map((p) => (
            <div key={p.id} className="preset-card card">
              <div className="preset-card-head">
                <span className="t-title">{p.name}</span>
              </div>
              <p className="t-body-sm muted">{p.description}</p>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => void handleDuplicate(p.name, p.description, p.categories)}
              >
                Duplicate as custom preset
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
