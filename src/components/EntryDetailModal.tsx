import type { Category, Entry } from '../types';
import { categoryName } from '../lib/categories';
import { isImageMime, isPdfMime, isTextMime } from '../lib/file';
import { useFilePreview } from '../lib/useFilePreview';

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
  const preview = useFilePreview(entry);
  const { url: mediaUrl, name: fileName, mime: fileMime, text: fileText, converting, unsupported } = preview;

  const cat = categories.find((c) => c.id === entry.categoryId);
  const sub = entry.subHeadingId ? categories.find((c) => c.id === entry.subHeadingId) : undefined;
  const relatesTo = entry.relatesTo ? categories.find((c) => c.id === entry.relatesTo) : undefined;

  const hasSplitMedia =
    entry.type === 'image' ||
    (entry.type === 'file' && !unsupported && !!mediaUrl && !!fileMime && isImageMime(fileMime)) ||
    (entry.type === 'file' && !!fileMime && isTextMime(fileMime) && fileText !== null) ||
    (entry.type === 'file' && !!mediaUrl && !!fileMime && isPdfMime(fileMime));
  const isLinkHero = entry.type === 'link' && !!entry.link?.thumbnailUrl;

  const modalClass = hasSplitMedia
    ? 'entry-detail-modal--split'
    : isLinkHero
      ? 'entry-detail-modal--hero'
      : '';

  const actions = (
    <div className="entry-detail-actions">
      <button className="icon-btn" aria-label="Edit entry" onClick={() => onEdit(entry)}>
        ✎
      </button>
      <button className="icon-btn" aria-label="Close" onClick={onClose}>
        ✕
      </button>
    </div>
  );

  return (
    <div className="scrim" onClick={onClose}>
      <div className={`modal entry-detail-modal ${modalClass}`} onClick={(e) => e.stopPropagation()}>
        {isLinkHero && entry.link && (
          <div className="entry-detail-hero">
            <img src={entry.link.thumbnailUrl} alt="" />
            <div className="entry-detail-actions--floating">{actions}</div>
          </div>
        )}

        <div className="entry-detail-layout">
          {hasSplitMedia && (
            <div className="entry-detail-media-col">
              {entry.type === 'image' && (
                <div className="entry-detail-media">
                  {converting ? (
                    <div className="entry-media-ph">Converting preview…</div>
                  ) : unsupported ? (
                    <div className="entry-media-ph">🖼️ Preview not available</div>
                  ) : mediaUrl ? (
                    <img src={mediaUrl} alt={entry.body || 'image'} />
                  ) : (
                    <div className="entry-media-ph" />
                  )}
                </div>
              )}

              {entry.type === 'file' && !unsupported && mediaUrl && fileMime && isImageMime(fileMime) && (
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
            </div>
          )}

          <div className="entry-detail-body">
            {!isLinkHero && (
              <div className="entry-detail-body-head">
                <div className="entry-card-tags">
                  <span className="tag">
                    <span className="tag-dot" style={{ background: cat?.color }} />
                    {categoryName(categories, entry.categoryId)}
                  </span>
                  {sub && <span className="tag entry-subtag">{sub.name}</span>}
                </div>
                {actions}
              </div>
            )}

            {isLinkHero && (
              <div className="entry-card-tags">
                <span className="tag">
                  <span className="tag-dot" style={{ background: cat?.color }} />
                  {categoryName(categories, entry.categoryId)}
                </span>
                {sub && <span className="tag entry-subtag">{sub.name}</span>}
              </div>
            )}

            {entry.type === 'text' && <p className="entry-detail-text">{entry.body}</p>}

            {entry.type === 'file' && (
              <div className="entry-detail-file">
                <p className="entry-detail-text">📄 {fileName ?? entry.body ?? 'Attached file'}</p>
                {unsupported && (
                  <p className="t-body-sm muted">Preview not available for this file type — download to view.</p>
                )}
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

            {entry.type === 'image' && unsupported && (
              <div className="entry-detail-file">
                <p className="t-body-sm muted">Preview not available for this image type — download to view.</p>
                {mediaUrl && (
                  <a className="btn btn-secondary btn-pill" href={mediaUrl} download={fileName ?? undefined}>
                    Download
                  </a>
                )}
              </div>
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
    </div>
  );
}
