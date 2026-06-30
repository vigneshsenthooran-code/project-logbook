import type { Category } from '../types';
import { INBOX_ID } from '../types';
import { subHeadings, topCategories } from '../lib/categories';
import { uid } from '../lib/id';
import KeywordEditor from './KeywordEditor';

const SWATCHES = [
  'var(--cat-1)',
  'var(--cat-2)',
  'var(--cat-3)',
  'var(--cat-4)',
  'var(--cat-5)',
  'var(--cat-6)',
  'var(--cat-7)',
  'var(--cat-8)',
];

/**
 * Presentational categories-and-keywords editor — owns no state of its own, so
 * it can drive either a live project's config (CategoryManager) or a custom
 * preset's standalone category list (PresetsSection).
 */
export default function CategoryListEditor({
  categories,
  onChange,
}: {
  categories: Category[];
  onChange: (categories: Category[]) => void;
}) {
  const tops = topCategories(categories).filter((c) => c.id !== INBOX_ID);

  function update(id: string, patch: Partial<Category>) {
    onChange(categories.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function remove(id: string) {
    // Drop the category and any sub-headings under it.
    onChange(categories.filter((c) => c.id !== id && c.parentId !== id));
  }

  function addCategory() {
    const maxOrder = Math.max(0, ...categories.filter((c) => c.id !== INBOX_ID).map((c) => c.order));
    const next: Category = {
      id: uid(),
      name: 'New category',
      color: SWATCHES[categories.length % SWATCHES.length],
      order: maxOrder + 1,
      keywords: [],
    };
    onChange([...categories, next]);
  }

  function addSub(parent: Category) {
    const next: Category = {
      id: uid(),
      name: 'New sub-heading',
      color: parent.color,
      order: parent.order + 0.5,
      keywords: [],
      parentId: parent.id,
    };
    // Re-normalise order so the 0.5 slots in cleanly.
    const merged = [...categories, next].sort((a, b) => a.order - b.order);
    merged.forEach((c, i) => (c.order = i));
    onChange(merged);
  }

  function move(id: string, dir: -1 | 1) {
    const list = topCategories(categories).filter((c) => c.id !== INBOX_ID);
    const idx = list.findIndex((c) => c.id === id);
    const swap = idx + dir;
    if (swap < 0 || swap >= list.length) return;
    const a = list[idx];
    const b = list[swap];
    onChange(
      categories.map((c) => {
        if (c.id === a.id) return { ...c, order: b.order };
        if (c.id === b.id) return { ...c, order: a.order };
        return c;
      })
    );
  }

  return (
    <div className="catmgr-list">
      {tops.map((cat, i) => (
        <div key={cat.id} className="catmgr-item card">
          <div className="catmgr-row">
            <div className="swatches">
              {SWATCHES.map((s) => (
                <button
                  key={s}
                  className={`swatch ${cat.color === s ? 'is-active' : ''}`}
                  style={{ background: s }}
                  onClick={() => update(cat.id, { color: s })}
                  aria-label="Set colour"
                />
              ))}
            </div>
            <input
              className="input catmgr-name"
              value={cat.name}
              onChange={(e) => update(cat.id, { name: e.target.value })}
            />
            <div className="catmgr-actions">
              <button className="btn btn-ghost" onClick={() => move(cat.id, -1)} disabled={i === 0}>
                ↑
              </button>
              <button className="btn btn-ghost" onClick={() => move(cat.id, 1)} disabled={i === tops.length - 1}>
                ↓
              </button>
              <button className="btn btn-ghost catmgr-del" onClick={() => remove(cat.id)}>
                Delete
              </button>
            </div>
          </div>

          <KeywordEditor keywords={cat.keywords} onChange={(kw) => update(cat.id, { keywords: kw })} />

          <div className="catmgr-subs">
            {subHeadings(categories, cat.id).map((sub) => (
              <div key={sub.id} className="catmgr-sub">
                <span className="catmgr-sub-bullet">↳</span>
                <input
                  className="input catmgr-name"
                  value={sub.name}
                  onChange={(e) => update(sub.id, { name: e.target.value })}
                />
                <KeywordEditor keywords={sub.keywords} onChange={(kw) => update(sub.id, { keywords: kw })} />
                <button className="btn btn-ghost catmgr-del" onClick={() => remove(sub.id)}>
                  ×
                </button>
              </div>
            ))}
            <button className="btn btn-ghost catmgr-addsub" onClick={() => addSub(cat)}>
              + Add sub-heading
            </button>
          </div>
        </div>
      ))}

      <button className="btn btn-secondary" onClick={addCategory}>
        + Add category
      </button>
    </div>
  );
}
