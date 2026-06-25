import { useEffect, useRef, useState } from 'react';
import type { Project } from '../types';
import { useStore } from '../store';

export default function ProjectEditModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const updateProject = useStore((s) => s.updateProject);
  const setProjectCover = useStore((s) => s.setProjectCover);
  const removeProjectCover = useStore((s) => s.removeProjectCover);
  const getAttachment = useStore((s) => s.getAttachment);

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
    setCoverPreview(URL.createObjectURL(file));
    setHasCover(true);
    await setProjectCover(project.id, { name: file.name, mime: file.type, blob: file });
  }

  async function clearCover() {
    setCoverPreview(null);
    setHasCover(false);
    await removeProjectCover(project.id);
  }

  async function save() {
    await updateProject(project.id, {
      name: name.trim() || project.name,
      description: description.trim() || undefined,
      startDate: startDate || undefined,
    });
    onClose();
  }

  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
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
            <input
              className="input"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
        </div>

        <div className="modal-foot">
          <button className="btn btn-text" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary btn-sm" onClick={save}>
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
