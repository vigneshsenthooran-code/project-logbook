import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Category, EntryType } from '../types';
import { rankCategories } from '../lib/categorize';
import { subHeadings, topCategories } from '../lib/categories';
import { UTS_CAPTURE_IDS } from '../presets/uts';

export interface FilingResult {
  categoryId: string;
  subHeadingId?: string;
  citation?: string;
  relatesTo?: string;
}

interface Props {
  text: string;
  type: EntryType;
  categories: Category[];
  presetId: string;
  /** Pre-fill when editing an existing entry. */
  initial?: FilingResult;
  onConfirm: (result: FilingResult) => void;
  onCancel: () => void;
  confirmLabel?: string;
}

export default function CategoryConfirmModal({
  text,
  type,
  categories,
  presetId,
  initial,
  onConfirm,
  onCancel,
  confirmLabel = 'Save entry',
}: Props) {
  const ranked = useMemo(() => rankCategories(text, categories), [text, categories]);
  const suggestedId = initial?.categoryId ?? ranked[0]?.category.id ?? 'inbox';

  const [categoryId, setCategoryId] = useState(suggestedId);
  const [subHeadingId, setSubHeadingId] = useState<string | undefined>(initial?.subHeadingId);
  const [citation, setCitation] = useState(initial?.citation ?? '');
  const [relatesTo, setRelatesTo] = useState(initial?.relatesTo ?? '');

  const tops = topCategories(categories);
  const subs = subHeadings(categories, categoryId);
  const isUts = presetId === 'uts';
  const showCitation = isUts && (type === 'image' || type === 'link');
  const showRelatesTo = isUts && UTS_CAPTURE_IDS.includes(categoryId);
  const matched = !initial && ranked.length > 0;

  function pick(id: string) {
    setCategoryId(id);
    setSubHeadingId(undefined);
  }

  return createPortal(
    <div className="scrim modal-in" onClick={onCancel}>
      <div className="modal modal-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="t-display-sm">{initial ? 'Edit filing' : 'File this entry'}</h2>
          <p className="t-body-sm muted">
            {matched
              ? 'The logbook suggests a category — confirm or pick another.'
              : 'No keyword match — choose where this belongs (defaults to Inbox).'}
          </p>
        </div>

        <div className="modal-body">
          {matched && (
            <div className="confirm-suggestions">
              {ranked.slice(0, 4).map((r) => (
                <button
                  key={r.category.id}
                  className={`confirm-chip ${categoryId === r.category.id ? 'is-active' : ''}`}
                  onClick={() => pick(r.category.id)}
                >
                  <span className="tag-dot" style={{ background: r.category.color }} />
                  {r.category.name}
                </button>
              ))}
            </div>
          )}

          <label className="field">
            <span className="field-label">Category</span>
            <select className="input" value={categoryId} onChange={(e) => pick(e.target.value)}>
              {tops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          {subs.length > 0 && (
            <label className="field">
              <span className="field-label">Sub-heading (optional)</span>
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
              <span className="field-label">Relates to (optional)</span>
              <select
                className="input"
                value={relatesTo}
                onChange={(e) => setRelatesTo(e.target.value)}
              >
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
              <span className="field-label">APA 7th citation (optional)</span>
              <textarea
                className="textarea"
                style={{ minHeight: 64 }}
                placeholder="Author, A. A. (Year). Title of work. Source."
                value={citation}
                onChange={(e) => setCitation(e.target.value)}
              />
            </label>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() =>
              onConfirm({
                categoryId,
                subHeadingId,
                citation: citation.trim() || undefined,
                relatesTo: relatesTo || undefined,
              })
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
