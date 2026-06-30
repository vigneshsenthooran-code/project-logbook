import { useState } from 'react';
import { useStore } from '../store';
import CategoryListEditor from './CategoryListEditor';

export default function CategoryManager() {
  const categories = useStore((s) => s.config.categories);
  const setCategories = useStore((s) => s.setCategories);
  const addCustomPreset = useStore((s) => s.addCustomPreset);

  const [savingPreset, setSavingPreset] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');

  async function savePreset() {
    const name = presetName.trim();
    if (!name) return;
    await addCustomPreset(name, presetDescription.trim(), categories);
    setSavingPreset(false);
    setPresetName('');
    setPresetDescription('');
  }

  return (
    <div className="catmgr">
      <div className="catmgr-head">
        <h2 className="t-display-sm">Categories &amp; keywords</h2>
        <div className="catmgr-head-actions">
          <button className="btn btn-ghost" onClick={() => setSavingPreset((v) => !v)}>
            Save as preset
          </button>
        </div>
      </div>

      {savingPreset && (
        <div className="card catmgr-save-preset">
          <input
            className="input"
            placeholder="Preset name…"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
          />
          <input
            className="input"
            placeholder="Short description (optional)"
            value={presetDescription}
            onChange={(e) => setPresetDescription(e.target.value)}
          />
          <button className="btn btn-primary btn-sm" onClick={savePreset} disabled={!presetName.trim()}>
            Save
          </button>
          <button className="btn btn-text btn-sm" onClick={() => setSavingPreset(false)}>
            Cancel
          </button>
        </div>
      )}

      <CategoryListEditor categories={categories} onChange={(next) => void setCategories(next)} />
    </div>
  );
}
