import { useRef, useState } from 'react';
import { useStore } from '../store';
import type { EntryType, LinkMeta } from '../types';
import { fetchLinkMeta } from '../lib/linkMeta';
import CategoryConfirmModal, { type FilingResult } from './CategoryConfirmModal';

type Pending = { name: string; mime: string; blob: Blob; previewUrl?: string };

const TABS: { type: EntryType; label: string; icon: string }[] = [
  { type: 'text', label: 'Note', icon: '✎' },
  { type: 'image', label: 'Image', icon: '🖼' },
  { type: 'file', label: 'File', icon: '📎' },
  { type: 'link', label: 'Link', icon: '🔗' },
];

export default function EntryComposer() {
  const config = useStore((s) => s.config);
  const addEntry = useStore((s) => s.addEntry);

  const [type, setType] = useState<EntryType>('text');
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<Pending[]>([]);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkMeta, setLinkMeta] = useState<LinkMeta | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  function reset() {
    setBody('');
    setFiles([]);
    setLinkUrl('');
    setLinkMeta(null);
  }

  function switchType(t: EntryType) {
    setType(t);
    setFiles([]);
    setLinkMeta(null);
  }

  function onFilesChosen(list: FileList | null) {
    if (!list) return;
    const next: Pending[] = Array.from(list).map((f) => ({
      name: f.name,
      mime: f.type || 'application/octet-stream',
      blob: f,
      previewUrl: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
    }));
    setFiles(type === 'image' ? next : next.slice(0, 1));
  }

  async function loadLink() {
    if (!linkUrl.trim()) return;
    setLinkLoading(true);
    const meta = await fetchLinkMeta(linkUrl);
    setLinkMeta(meta);
    setLinkLoading(false);
  }

  // Text used for keyword categorisation.
  const categoriseText = [body, linkMeta?.title, linkMeta?.domain].filter(Boolean).join(' ');

  const canSubmit =
    (type === 'text' && body.trim().length > 0) ||
    (type === 'image' && files.length > 0) ||
    (type === 'file' && files.length > 0) ||
    (type === 'link' && (linkMeta !== null || linkUrl.trim().length > 0));

  async function handleConfirm(result: FilingResult) {
    let link: LinkMeta | undefined;
    if (type === 'link') {
      link = linkMeta ?? (await fetchLinkMeta(linkUrl));
    }
    await addEntry(
      {
        type,
        body: body.trim(),
        categoryId: result.categoryId,
        subHeadingId: result.subHeadingId,
        attachmentIds: [],
        link,
        citation: result.citation,
        relatesTo: result.relatesTo,
      },
      type === 'image' || type === 'file'
        ? files.map((f) => ({ name: f.name, mime: f.mime, blob: f.blob }))
        : []
    );
    setConfirming(false);
    reset();
  }

  return (
    <section className="composer card">
      <div className="composer-tabs">
        {TABS.map((t) => (
          <button
            key={t.type}
            className={`composer-tab ${type === t.type ? 'is-active' : ''}`}
            onClick={() => switchType(t.type)}
          >
            <span aria-hidden>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      <div className="composer-body">
        {type === 'text' && (
          <textarea
            className="textarea composer-textarea"
            placeholder="Capture a thought, a piece of feedback, an idea…  (⌘/Ctrl + Enter to file)"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canSubmit) setConfirming(true);
            }}
            autoFocus
          />
        )}

        {(type === 'image' || type === 'file') && (
          <div className="composer-attach">
            <button className="dropzone" onClick={() => fileInput.current?.click()}>
              {files.length === 0 ? (
                <span className="muted">
                  Click to choose {type === 'image' ? 'image(s)' : 'a file'}
                </span>
              ) : (
                <div className="dropzone-files">
                  {files.map((f, i) =>
                    f.previewUrl ? (
                      <img key={i} src={f.previewUrl} alt={f.name} className="dropzone-thumb" />
                    ) : (
                      <span key={i} className="dropzone-file">
                        📄 {f.name}
                      </span>
                    )
                  )}
                </div>
              )}
            </button>
            <input
              ref={fileInput}
              type="file"
              hidden
              accept={type === 'image' ? 'image/*' : undefined}
              multiple={type === 'image'}
              onChange={(e) => onFilesChosen(e.target.files)}
            />
            <textarea
              className="textarea"
              placeholder={type === 'image' ? 'Caption (helps categorise)…' : 'Description…'}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
        )}

        {type === 'link' && (
          <div className="composer-link">
            <div className="composer-link-row">
              <input
                className="input"
                placeholder="https://example.com/article"
                value={linkUrl}
                onChange={(e) => {
                  setLinkUrl(e.target.value);
                  setLinkMeta(null);
                }}
                onKeyDown={(e) => e.key === 'Enter' && void loadLink()}
              />
              <button className="btn btn-secondary" onClick={loadLink} disabled={linkLoading}>
                {linkLoading ? 'Fetching…' : 'Preview'}
              </button>
            </div>
            {linkMeta && (
              <div className="link-preview">
                {linkMeta.thumbnailUrl && (
                  <img src={linkMeta.thumbnailUrl} alt="" className="link-preview-thumb" />
                )}
                <div>
                  <div className="t-title">{linkMeta.title ?? linkMeta.domain}</div>
                  <div className="t-caption-sm">{linkMeta.domain}</div>
                </div>
              </div>
            )}
            <textarea
              className="textarea"
              placeholder="Note (optional)…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="composer-foot">
        <span className="t-caption-sm muted">Filed into your {config.activePreset === 'uts' ? 'UTS design log' : 'logbook'}</span>
        <button className="btn btn-primary" disabled={!canSubmit} onClick={() => setConfirming(true)}>
          File entry →
        </button>
      </div>

      {confirming && (
        <CategoryConfirmModal
          text={categoriseText}
          type={type}
          categories={config.categories}
          presetId={config.activePreset}
          onConfirm={handleConfirm}
          onCancel={() => setConfirming(false)}
        />
      )}
    </section>
  );
}
