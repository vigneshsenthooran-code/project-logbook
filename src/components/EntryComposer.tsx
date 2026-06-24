import { useRef, useState, type ClipboardEvent, type DragEvent } from 'react';
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

const URL_RE = /^https?:\/\/\S+$/i;

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
    setType('text');
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

  function attachFiles(list: FileList | File[]) {
    const arr = Array.from(list);
    if (arr.length === 0) return;
    const isImage = arr[0].type.startsWith('image/');
    const next: Pending[] = (isImage ? arr : arr.slice(0, 1)).map((f, i) => ({
      name: f.name || (isImage ? `pasted-image-${i}.png` : 'pasted-file'),
      mime: f.type || 'application/octet-stream',
      blob: f,
      previewUrl: isImage ? URL.createObjectURL(f) : undefined,
    }));
    setType(isImage ? 'image' : 'file');
    setFiles(next);
  }

  function removeFile(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function loadLink(url: string) {
    if (!url.trim()) return;
    setLinkLoading(true);
    const meta = await fetchLinkMeta(url);
    setLinkMeta(meta);
    setLinkLoading(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) attachFiles(e.dataTransfer.files);
  }

  function handlePaste(e: ClipboardEvent<HTMLDivElement>) {
    const clip = e.clipboardData;
    const fileItem = Array.from(clip.items).find((it) => it.kind === 'file');
    if (fileItem) {
      const f = fileItem.getAsFile();
      if (f) {
        e.preventDefault();
        attachFiles([f]);
        return;
      }
    }
    const text = clip.getData('text').trim();
    if (text && URL_RE.test(text) && body.trim().length === 0) {
      e.preventDefault();
      setType('link');
      setLinkUrl(text);
      void loadLink(text);
    }
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

      <div className="composer-field" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onPaste={handlePaste}>
        {(type === 'image' || type === 'file') && files.length > 0 && (
          <div className="composer-attachments">
            {files.map((f, i) => (
              <div key={i} className="composer-attachment-chip">
                {f.previewUrl ? (
                  <img src={f.previewUrl} alt={f.name} className="dropzone-thumb" />
                ) : (
                  <span className="dropzone-file">📄 {f.name}</span>
                )}
                <button
                  className="composer-attachment-remove"
                  onClick={() => removeFile(i)}
                  aria-label="Remove attachment"
                >
                  ✕
                </button>
              </div>
            ))}
            {type === 'image' && (
              <button className="composer-attach-more" onClick={() => fileInput.current?.click()}>
                + Add more
              </button>
            )}
          </div>
        )}

        {(type === 'image' || type === 'file') && files.length === 0 && (
          <button className="composer-attach-hint" onClick={() => fileInput.current?.click()}>
            Drop {type === 'image' ? 'an image' : 'a file'}, paste, or click to browse
          </button>
        )}

        {type === 'link' && (
          <div className="composer-link-row">
            <input
              className="input"
              placeholder="https://example.com/article"
              value={linkUrl}
              onChange={(e) => {
                setLinkUrl(e.target.value);
                setLinkMeta(null);
              }}
              onKeyDown={(e) => e.key === 'Enter' && void loadLink(linkUrl)}
            />
            <button className="btn btn-secondary" onClick={() => loadLink(linkUrl)} disabled={linkLoading}>
              {linkLoading ? 'Fetching…' : 'Preview'}
            </button>
          </div>
        )}

        {type === 'link' && linkMeta && (
          <div className="link-preview">
            {linkMeta.thumbnailUrl && <img src={linkMeta.thumbnailUrl} alt="" className="link-preview-thumb" />}
            <div>
              <div className="t-title">{linkMeta.title ?? linkMeta.domain}</div>
              <div className="t-caption-sm">{linkMeta.domain}</div>
            </div>
          </div>
        )}

        <textarea
          className="composer-textarea"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canSubmit) setConfirming(true);
          }}
          autoFocus
        />

        <input ref={fileInput} type="file" hidden multiple onChange={(e) => e.target.files && attachFiles(e.target.files)} />
      </div>

      <div className="composer-foot">
        <span className="t-caption-sm muted">
          Filed into your {config.activePreset === 'uts' ? 'UTS design log' : 'logbook'}
        </span>
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
