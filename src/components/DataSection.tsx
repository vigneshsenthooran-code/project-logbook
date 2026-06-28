import { useRef, useState } from 'react';
import { useStore } from '../store';
import type { LogbookBundle } from '../storage/StorageAdapter';

export default function DataSection() {
  const exportBundle = useStore((s) => s.exportBundle);
  const importBundle = useStore((s) => s.importBundle);
  const resetAll = useStore((s) => s.resetAll);
  const [busy, setBusy] = useState<'export' | 'import' | 'reset' | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    setBusy('export');
    try {
      const bundle = await exportBundle();
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quire-logbook-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(null);
    }
  }

  async function handleImport(file: File) {
    if (!confirm('Import a full logbook backup? This replaces all current projects and entries on this device.')) return;
    setBusy('import');
    try {
      const bundle = JSON.parse(await file.text()) as LogbookBundle;
      if (!Array.isArray(bundle.projects) || !Array.isArray(bundle.entries)) throw new Error('bad');
      await importBundle(bundle);
    } catch {
      alert('That file does not look like a Quire logbook backup.');
    } finally {
      setBusy(null);
    }
  }

  async function handleReset() {
    if (!confirm('Erase ALL projects, entries and presets on this device? This cannot be undone.')) return;
    if (!confirm('Are you absolutely sure? Everything will be deleted and a fresh empty project created.')) return;
    setBusy('reset');
    try {
      await resetAll();
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="settings-section">
      <h2 className="t-display-sm">Data management</h2>
      <p className="t-body-sm muted">Back up your entire logbook, restore a backup, or start fresh.</p>

      <div className="settings-actions">
        <button className="btn btn-secondary" onClick={() => void handleExport()} disabled={busy !== null}>
          {busy === 'export' ? 'Exporting…' : '↓ Export everything'}
        </button>
        <button className="btn btn-secondary" onClick={() => fileRef.current?.click()} disabled={busy !== null}>
          {busy === 'import' ? 'Importing…' : '↑ Import backup'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleImport(f);
            e.target.value = '';
          }}
        />
      </div>

      <div className="settings-danger">
        <div>
          <p className="t-title">Reset logbook</p>
          <p className="t-body-sm muted">Permanently deletes everything on this device.</p>
        </div>
        <button className="btn btn-danger" onClick={() => void handleReset()} disabled={busy !== null}>
          {busy === 'reset' ? 'Resetting…' : 'Reset all data'}
        </button>
      </div>
    </section>
  );
}
