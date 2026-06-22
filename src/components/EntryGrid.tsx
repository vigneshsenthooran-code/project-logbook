import { useState } from 'react';
import type { Category, Entry } from '../types';
import EntryCard from './EntryCard';
import EntryEditModal from './EntryEditModal';

export default function EntryGrid({
  entries,
  categories,
  emptyMessage = 'Nothing here yet.',
}: {
  entries: Entry[];
  categories: Category[];
  emptyMessage?: string;
}) {
  const [editing, setEditing] = useState<Entry | null>(null);

  if (entries.length === 0) {
    return (
      <div className="empty card">
        <div className="empty-mark">▦</div>
        <p className="t-body muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="entry-grid">
        {entries.map((e) => (
          <EntryCard key={e.id} entry={e} categories={categories} onEdit={setEditing} />
        ))}
      </div>
      {editing && (
        <EntryEditModal entry={editing} categories={categories} onClose={() => setEditing(null)} />
      )}
    </>
  );
}
