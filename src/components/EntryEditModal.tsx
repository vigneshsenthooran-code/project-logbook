import { useState } from 'react';
import type { Category, Entry } from '../types';
import { useStore } from '../store';
import { subHeadings, topCategories } from '../lib/categories';
import { UTS_CAPTURE_IDS } from '../presets/uts';

export default function EntryEditModal({
  entry,
  categories,
  onClose,
}: {
  entry: Entry;
  categories: Category[];
  onClose: () => void;
}) {
  const updateEntry = useStore((s) => s.updateEntry);
  const deleteEntry = useStore((s) => s.deleteEntry);
  const presetId = useStore((s) => s.config.activePreset);

  const [body, setBody] = useState(entry.body);
  const [categoryId, setCategoryId] = useState(entry.categoryId);
  const [subHeadingId, setSubHeadingId] = useState<string | undefined>(entry.subHeadingId);
  const [citation, setCitation] = useState(entry.citation ?? '');
  const [relatesTo, setRelatesTo] = useState(entry.relatesTo ?? '');
  const [linkUrl, setLinkUrl] = useState(entry.link?.url ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const tops = topCategories(categories);
  const subs = subHeadings(categories, categoryId);
  const isUts = presetId === 'uts';
  const showCitation = isUts && (entry.type === 'image' || entry.type === 'link');
  const showRelatesTo = isUts && UTS_CAPTURE_IDS.includes(categoryId);

  async function save() {
    await updateEntry(entry.id, {
      body: body.trim(),
      categoryId,
      subHeadingId,
      citation: citation.trim() || undefined,
      relatesTo: relatesTo || undefined,
      link:
        entry.link && linkUrl.trim()
          ? { ...entry.link, url: linkUrl.trim() }
          : entry.link,
    });
    onClose();
  }

  async function doDelete() {
    await deleteEntry(entry.id);
    onClose();
  }

  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="t-display-sm">Edit entry</h2>
          <p className="t-body-sm muted">{entry.type} · filed {new Date(entry.createdAt).toLocaleDateString()}</p>
        </div>

        <div className="modal-body">
          <label className="field">
            <span className="field-label">
              {entry.type === 'text' ? 'Text' : entry.type === 'link' ? 'Note' : 'Caption'}
            </span>
            <textarea className="textarea" value={body} onChange={(e) => setBody(e.target.value)} />
          </label>

          {entry.type === 'link' && (
            <label className="field">
              <span className="field-label">URL</span>
              <input className="input" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
            </label>
          )}

          <label className="field">
            <span className="field-label">Category</span>
            <select
              className="input"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setSubHeadingId(undefined);
              }}
            >
              {tops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          {subs.length > 0 && (
            <label className="field">
              <span className="field-label">Sub-heading</span>
              <select
                className="input"
                value={subHeadingId ?? ''}
                onChange={(e) => setSubHeadingId(e.target.value || undefined)}
              >
                <option value="">— None —</option>
                {subs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {showRelatesTo && (
            <label className="field">
              <span className="field-label">Relates to</span>
              <select className="input" value={relatesTo} onChange={(e) => setRelatesTo(e.target.value)}>
                <option value="">— No heading —</option>
                {tops
                  .filter((c) => !UTS_CAPTURE_IDS.includes(c.id) && c.id !== 'inbox')
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </label>
          )}

          {showCitation && (
            <label className="field">
              <span className="field-label">APA 7th citation</span>
              <textarea
                className="textarea"
                style={{ minHeight: 64 }}
                value={citation}
                onChange={(e) => setCitation(e.target.value)}
              />
            </label>
          )}
        </div>

        <div className="modal-foot modal-foot-split">
          {confirmDelete ? (
            <div className="confirm-delete">
              <span className="t-body-sm">Delete this entry?</span>
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={doDelete}>
                Delete
              </button>
            </div>
          ) : (
            <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
              Delete
            </button>
          )}
          <div className="modal-foot-right">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={save}>
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
