import { useStore } from '../store';
import { PRESETS } from '../presets';
import CategoryManager from '../components/CategoryManager';

export default function Settings() {
  const activePreset = useStore((s) => s.config.activePreset);
  const applyPreset = useStore((s) => s.applyPreset);
  const entries = useStore((s) => s.entries);

  function choosePreset(id: string) {
    if (id === activePreset) return;
    const msg =
      entries.length > 0
        ? 'Switching preset replaces your category set. Existing entries are kept but may need re-filing. Continue?'
        : 'Switch to this preset?';
    if (confirm(msg)) void applyPreset(id);
  }

  return (
    <div className="settings">
      <header className="view-head">
        <h1 className="t-display-xl">Settings</h1>
        <p className="muted">Tune your categories, keywords, and preset.</p>
      </header>

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
