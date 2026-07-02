import { useEffect, useRef } from 'react';
import type { Category, Entry } from '../types';
import { useStore } from '../store';
import { categoryName } from '../lib/categories';
import { isImageMime, isPdfMime, isTextMime } from '../lib/file';
import { fetchLinkMeta } from '../lib/linkMeta';
import { useFilePreview } from '../lib/useFilePreview';
import { toDateKey } from '../lib/id';
import { weekLabel, weekNumberForDate } from '../lib/period';

function formatDayMonth(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
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
  const updateEntry = useStore((s) => s.updateEntry);
  const period = useStore((s) => s.period);
  const { url: thumbUrl, mime: thumbMime, name: thumbName, text: thumbText, unsupported: thumbUnsupported } =
    useFilePreview(entry);
  const backfillingLink = useRef(false);

  const cat = categories.find((c) => c.id === entry.categoryId);
  const sub = entry.subHeadingId ? categories.find((c) => c.id === entry.subHeadingId) : undefined;

  const entryWeekNum = period ? weekNumberForDate(period, toDateKey(new Date(entry.createdAt))) : null;
  const entryWeekLabel = entryWeekNum ? weekLabel(period!, entryWeekNum) : null;

  // Older/seeded link entries were saved without a fetched thumbnail — backfill
  // it lazily on view so their cards get a real preview instead of the emoji placeholder.
  useEffect(() => {
    if (entry.type !== 'link' || !entry.link || entry.link.thumbnailUrl || backfillingLink.current) return;
    backfillingLink.current = true;
    void fetchLinkMeta(entry.link.url).then((meta) => {
      if (!meta.thumbnailUrl) return;
      void updateEntry(entry.id, {
        link: { ...entry.link!, title: entry.link!.title ?? meta.title, thumbnailUrl: meta.thumbnailUrl },
      });
    });
  }, [entry, updateEntry]);

  return (
    <article className="entry-card" onClick={() => onView(entry)}>
      <div className="entry-card-outline">
      <div className="entry-card-surface card-cutout">
      {entry.type === 'image' && (
        <div className="entry-media">
          {thumbUnsupported ? (
            <div className="entry-media-ph">🖼️</div>
          ) : thumbUrl ? (
            <img src={thumbUrl} alt={entry.body || 'image'} />
          ) : (
            <div className="entry-media-ph" />
          )}
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

      {entry.type === 'file' && (
        <div className="entry-media">
          {thumbUrl && thumbMime && isImageMime(thumbMime) && !thumbUnsupported ? (
            <img src={thumbUrl} alt={thumbName ?? entry.body ?? 'file'} />
          ) : thumbMime && isTextMime(thumbMime) && thumbText !== null ? (
            <pre className="entry-media-text">{thumbText}</pre>
          ) : thumbUrl && thumbMime && isPdfMime(thumbMime) ? (
            <iframe className="entry-media-frame" src={`${thumbUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} title={thumbName ?? entry.body ?? 'file preview'} tabIndex={-1} />
          ) : (
            <div className="entry-media-ph">📄</div>
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
            📄 {thumbName ?? entry.body ?? 'Attached file'}
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
      </div>
      </div>
      </div>

      <div className="card-notch-label">
        {entryWeekLabel && <span className="card-notch-week">{entryWeekLabel}</span>}
        <span className="card-notch-title">{formatDayMonth(entry.createdAt)}</span>
        <span className="card-notch-year">{new Date(entry.createdAt).getFullYear()}</span>
      </div>
    </article>
  );
}
