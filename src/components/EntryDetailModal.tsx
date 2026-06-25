import { useEffect, useState } from 'react';
import type { Category, Entry } from '../types';
import { useStore } from '../store';
import { categoryName } from '../lib/categories';
import { isImageMime, isPdfMime, isTextMime } from '../lib/file';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function EntryDetailModal({
  entry,
  categories,
  onClose,
  onEdit,
}: {
  entry: Entry;
  categories: Category[];
  onClose: () => void;
  onEdit: (e: Entry) => void;
}) {
  const getAttachment = useStore((s) => s.getAttachment);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileMime, setFileMime] = useState<string | null>(null);
  const [fileText, setFileText] = useState<string | null>(null);

  const cat = categories.find((c) => c.id === entry.categoryId);
  const sub = entry.subHeadingId ? categories.find((c) => c.id === entry.subHeadingId) : undefined;
  const relatesTo = entry.relatesTo ? categories.find((c) => c.id === entry.relatesTo) : undefined;

  useEffect(() => {
    let url: string | null = null;
    let alive = true;
    if ((entry.type === 'image' || entry.type === 'file') && entry.attachmentIds.length > 0) {
      void getAttachment(entry.attachmentIds[0]).then((att) => {
        if (att && alive) {
          url = URL.createObjectURL(att.blob);
          setMediaUrl(url);
          setFileName(att.name);
          setFileMime(att.mime);
          if (isTextMime(att.mime)) void att.blob.text().then((text) => alive && setFileText(text));
        }
      });
    }
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [entry, getAttachment]);

  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal entry-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="entry-detail-actions">
          <button className="icon-btn" aria-label="Edit entry" onClick={() => onEdit(entry)}>
            ✎
          </button>
          <button className="icon-btn" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>

        {entry.type === 'image' && (
          <div className="entry-detail-media">
            {mediaUrl ? <img src={mediaUrl} alt={entry.body || 'image'} /> : <div className="entry-media-ph" />}
          </div>
        )}

        {entry.type === 'link' && entry.link && entry.link.thumbnailUrl && (
          <div className="entry-detail-media">
            <img src={entry.link.thumbnailUrl} alt="" />
          </div>
        )}

        {entry.type === 'file' && mediaUrl && fileMime && isImageMime(fileMime) && (
          <div className="entry-detail-media">
            <img src={mediaUrl} alt={fileName ?? entry.body ?? 'file'} />
          </div>
        )}

        {entry.type === 'file' && fileMime && isTextMime(fileMime) && fileText !== null && (
          <div className="entry-detail-media entry-detail-media-file">
            <pre className="entry-detail-media-text">{fileText}</pre>
          </div>
        )}

        {entry.type === 'file' && mediaUrl && fileMime && isPdfMime(fileMime) && (
          <div className="entry-detail-media entry-detail-media-file">
            <iframe className="entry-detail-media-frame" src={mediaUrl} title={fileName ?? entry.body ?? 'file preview'} />
          </div>
        )}

        <div className="entry-detail-body">
          <div className="entry-card-tags">
            <span className="tag">
              <span className="tag-dot" style={{ background: cat?.color }} />
              {categoryName(categories, entry.categoryId)}
            </span>
            {sub && <span className="tag entry-subtag">{sub.name}</span>}
          </div>

          {entry.type === 'text' && <p className="entry-detail-text">{entry.body}</p>}

          {entry.type === 'file' && (
            <div className="entry-detail-file">
              <p className="entry-detail-text">📄 {fileName ?? entry.body ?? 'Attached file'}</p>
              {mediaUrl && (
                <a className="btn btn-secondary btn-pill" href={mediaUrl} download={fileName ?? undefined}>
                  Download
                </a>
              )}
              {entry.body && fileName && <p className="t-body-sm muted">{entry.body}</p>}
            </div>
          )}

          {entry.type === 'link' && entry.link && (
            <a className="entry-link-title" href={entry.link.url} target="_blank" rel="noreferrer">
              {entry.link.title ?? entry.link.url}
            </a>
          )}

          {(entry.type === 'image' || entry.type === 'link') && entry.body && (
            <p className="entry-detail-text">{entry.body}</p>
          )}

          {entry.citation && <p className="entry-citation t-body-sm">“{entry.citation}”</p>}

          {relatesTo && (
            <p className="t-body-sm muted">Relates to: {relatesTo.name}</p>
          )}

          <div className="entry-detail-meta t-caption-sm muted">
            <span>Filed {formatDate(entry.createdAt)}</span>
            {entry.updatedAt !== entry.createdAt && <span>· Updated {formatDate(entry.updatedAt)}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
