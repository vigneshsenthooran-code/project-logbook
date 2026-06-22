import { useState } from 'react';

export default function KeywordEditor({
  keywords,
  onChange,
}: {
  keywords: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  function add() {
    const k = draft.trim().toLowerCase();
    if (k && !keywords.includes(k)) onChange([...keywords, k]);
    setDraft('');
  }

  return (
    <div className="kw-editor">
      <div className="kw-chips">
        {keywords.map((k) => (
          <span key={k} className="kw-chip">
            {k}
            <button
              className="kw-remove"
              onClick={() => onChange(keywords.filter((x) => x !== k))}
              aria-label={`Remove ${k}`}
            >
              ×
            </button>
          </span>
        ))}
        {keywords.length === 0 && <span className="muted t-caption-sm">No keywords</span>}
      </div>
      <div className="kw-add">
        <input
          className="input"
          placeholder="Add keyword + Enter"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
        />
      </div>
    </div>
  );
}
