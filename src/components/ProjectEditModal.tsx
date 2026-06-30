import { useEffect, useRef, useState } from 'react';
import type { Project } from '../types';
import { useStore } from '../store';
import { PRESETS } from '../presets';
import CategoryManager from './CategoryManager';
import { resizeImageFile } from '../lib/resizeImage';

export default function ProjectEditModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const updateProject = useStore((s) => s.updateProject);
  const setProjectCover = useStore((s) => s.setProjectCover);
  const removeProjectCover = useStore((s) => s.removeProjectCover);
  const getAttachment = useStore((s) => s.getAttachment);
  const config = useStore((s) => s.config);
  const applyPreset = useStore((s) => s.applyPreset);
  const customPresets = useStore((s) => s.customPresets);
  const deleteCustomPreset = useStore((s) => s.deleteCustomPreset);
  const entryCount = useStore((s) => s.entries.filter((e) => e.projectId === project.id).length);

  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? '');
  const [startDate, setStartDate] = useState(project.startDate ?? '');
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [hasCover, setHasCover] = useState(!!project.coverAttachmentId);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let url: string | null = null;
    let alive = true;
    if (project.coverAttachmentId) {
      void getAttachment(project.coverAttachmentId).then((att) => {
        if (att && alive) {
          url = URL.createObjectURL(att.blob);
          setCoverPreview(url);
        }
      });
    }
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [project.coverAttachmentId, getAttachment]);

  async function pickCover(file: File) {
    const resized = await resizeImageFile(file);
    setCoverPreview(URL.createObjectURL(resized));
    setHasCover(true);
    await setProjectCover(project.id, { name: file.name, mime: resized.type || file.type, blob: resized });
  }

  async function clearCover() {
    setCoverPreview(null);
    setHasCover(false);
    await removeProjectCover(project.id);
  }

  function choosePreset(presetId: string) {
    if (presetId === config.activePreset) return;
    const msg =
      entryCount > 0
        ? 'Switching preset replaces this project’s category set. Existing entries are kept but may need re-filing. Continue?'
        : 'Switch to this preset?';
    if (confirm(msg)) void applyPreset(presetId);
  }

  async function saveDetails() {
    await updateProject(project.id, {
      name: name.trim() || project.name,
      description: description.trim() || undefined,
      startDate: startDate || undefined,
    });
    onClose();
  }

  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="t-display-sm">Edit project</h2>
        </div>

        <div className="modal-body">
          <label className="field">
            <span className="field-label">Cover image</span>
            <div className="project-cover-edit">
              <div className="project-cover-edit-preview">
                {coverPreview ? <img src={coverPreview} alt="" /> : <span className="t-caption-sm muted">No cover</span>}
              </div>
              <div className="project-cover-edit-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>
                  Upload image
                </button>
                {hasCover && (
                  <button className="btn btn-ghost btn-sm" onClick={clearCover}>
                    Remove
                  </button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void pickCover(f);
                  e.target.value = '';
                }}
              />
            </div>
          </label>

          <label className="field">
            <span className="field-label">Name</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </label>

          <label className="field">
            <span className="field-label">Description</span>
            <textarea
              className="textarea"
              style={{ minHeight: 72 }}
              placeholder="What's this project for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <label className="field">
            <span className="field-label">Start date</span>
            <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>

          <div className="modal-section">
            <h3 className="t-title">Preset</h3>
            <p className="t-body-sm muted">Pick the category set that fits this project.</p>
            <div className="preset-list">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  className={`preset-card card ${config.activePreset === p.id ? 'is-active' : ''}`}
                  onClick={() => choosePreset(p.id)}
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
                  <button className="preset-card-trigger" onClick={() => choosePreset(p.id)}>
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

          <div className="modal-section">
            <CategoryManager />
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn btn-text" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary btn-sm" onClick={saveDetails}>
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
