import { useEffect, useState } from 'react';
import type { Category, Entry } from '../types';
import { useStore } from '../store';
import { categoryName } from '../lib/categories';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function EntryCard({
  entry,
  categories,
  onView,
}: {
  entry: Entry;
  categories: Category[];
  onView: (e: Entry) => void;
}) {
  const getAttachment = useStore((s) => s.getAttachment);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  const cat = categories.find((c) => c.id === entry.categoryId);
  const sub = entry.subHeadingId ? categories.find((c) => c.id === entry.subHeadingId) : undefined;

  useEffect(() => {
    let url: string | null = null;
    let alive = true;
    if (entry.type === 'image' && entry.attachmentIds.length > 0) {
      void getAttachment(entry.attachmentIds[0]).then((att) => {
        if (att && alive) {
          url = URL.createObjectURL(att.blob);
          setThumbUrl(url);
        }
      });
    }
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [entry, getAttachment]);

  return (
    <article className="entry-card card" onClick={() => onView(entry)}>
      {entry.type === 'image' && (
        <div className="entry-media">
          {thumbUrl ? <img src={thumbUrl} alt={entry.body || 'image'} /> : <div className="entry-media-ph" />}
        </div>
      )}

      {entry.type === 'link' && entry.link && (
        <div className="entry-media entry-media-link">
          {entry.link.thumbnailUrl ? (
            <img src={entry.link.thumbnailUrl} alt="" />
          ) : (
            <div className="entry-media-ph">🔗 {entry.link.domain}</div>
          )}
        </div>
      )}

      <div className="entry-card-body">
        <div className="entry-card-tags">
          <span className="tag">
            <span className="tag-dot" style={{ background: cat?.color }} />
            {categoryName(categories, entry.categoryId)}
          </span>
          {sub && <span className="tag entry-subtag">{sub.name}</span>}
        </div>

        {entry.type === 'text' && <p className="entry-text">{entry.body}</p>}

        {entry.type === 'file' && (
          <p className="entry-text">
            📄 {entry.body || 'Attached file'}
          </p>
        )}

        {entry.type === 'link' && entry.link && (
          <a
            className="entry-link-title"
            href={entry.link.url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            {entry.link.title ?? entry.link.url}
          </a>
        )}

        {(entry.type === 'image' || entry.type === 'link') && entry.body && (
          <p className="entry-caption t-body-sm muted">{entry.body}</p>
        )}

        {entry.citation && <p className="entry-citation t-caption-sm">“{entry.citation}”</p>}

        <div className="entry-card-foot">
          <span className="t-caption-sm muted">{formatDate(entry.createdAt)}</span>
        </div>
      </div>
    </article>
  );
}
