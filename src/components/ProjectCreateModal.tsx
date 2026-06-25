import { useState } from 'react';
import { useStore } from '../store';
import { PRESETS } from '../presets';

export default function ProjectCreateModal({ onClose }: { onClose: (createdId?: string) => void }) {
  const addProject = useStore((s) => s.addProject);
  const updateProject = useStore((s) => s.updateProject);
  const customPresets = useStore((s) => s.customPresets);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [presetId, setPresetId] = useState(PRESETS[0].id);

  async function create() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const project = await addProject(trimmed, presetId);
    if (description.trim() || startDate) {
      await updateProject(project.id, {
        description: description.trim() || undefined,
        startDate: startDate || undefined,
      });
    }
    onClose(project.id);
  }

  return (
    <div className="scrim" onClick={() => onClose()}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="t-display-sm">New project</h2>
          <p className="t-body-sm muted">A standalone capture space with its own categories.</p>
        </div>

        <div className="modal-body">
          <label className="field">
            <span className="field-label">Name</span>
            <input
              className="input"
              autoFocus
              placeholder="Project name…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void create()}
            />
          </label>

          <label className="field">
            <span className="field-label">Description (optional)</span>
            <textarea
              className="textarea"
              style={{ minHeight: 64 }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <label className="field">
            <span className="field-label">Start date (optional)</span>
            <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>

          <label className="field">
            <span className="field-label">Preset</span>
            <select className="input" value={presetId} onChange={(e) => setPresetId(e.target.value)}>
              <optgroup label="Built-in">
                {PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
              {customPresets.length > 0 && (
                <optgroup label="Your presets">
                  {customPresets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>
        </div>

        <div className="modal-foot">
          <button className="btn btn-text" onClick={() => onClose()}>
            Cancel
          </button>
          <button className="btn btn-primary btn-sm" onClick={create} disabled={!name.trim()}>
            Create project
          </button>
        </div>
      </div>
    </div>
  );
}
