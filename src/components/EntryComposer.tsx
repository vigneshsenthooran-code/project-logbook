import { useEffect, useMemo, useRef, useState, type ClipboardEvent, type DragEvent } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store';
import type { EntryType, LinkMeta } from '../types';
import { fetchLinkMeta } from '../lib/linkMeta';
import { groupProjects } from '../lib/groupProjects';
import CategoryConfirmModal, { type FilingResult } from './CategoryConfirmModal';
import DecorMark from './DecorMark';
import ComposerHint from './ComposerHint';

type Pending = { name: string; mime: string; blob: Blob; previewUrl?: string };

const TABS: { type: EntryType; label: string; icon: string }[] = [
  { type: 'text', label: 'Note', icon: '✎' },
  { type: 'image', label: 'Image', icon: '🖼' },
  { type: 'file', label: 'File', icon: '📎' },
  { type: 'link', label: 'Link', icon: '🔗' },
];

const URL_RE = /^https?:\/\/\S+$/i;

export default function EntryComposer() {
  const projects = useStore((s) => s.projects);
  const folders = useStore((s) => s.folders);
  const activeProjectId = useStore((s) => s.activeProjectId);
  const configsByProject = useStore((s) => s.configsByProject);
  const addEntry = useStore((s) => s.addEntry);

  const [expanded, setExpanded] = useState(false);
  const [targetProjectId, setTargetProjectId] = useState(activeProjectId);
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [projectDropdownPos, setProjectDropdownPos] = useState<{ left: number; bottom: number } | null>(null);

  const [type, setType] = useState<EntryType>('text');
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<Pending[]>([]);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkMeta, setLinkMeta] = useState<LinkMeta | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const projectPickerRef = useRef<HTMLDivElement>(null);
  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const collapsedInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isEmpty = body.trim().length === 0 && files.length === 0 && linkUrl.trim().length === 0 && linkMeta === null;

  // Both layers stay mounted so opening/closing is a CSS transition, not a swap —
  // move real focus to whichever field is now visible.
  useEffect(() => {
    if (expanded) {
      collapsedInputRef.current?.blur();
      textareaRef.current?.focus();
    } else {
      collapsedInputRef.current?.blur();
    }
  }, [expanded]);

  // Click-outside / Escape collapse back to the pill — but never while there's an unsaved draft.
  // The project dropdown is portaled to <body>, so a click inside it isn't a
  // DOM descendant of rootRef either — treat it as "inside" too.
  useEffect(() => {
    if (!expanded) return;
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      const insideRoot = rootRef.current?.contains(target);
      const insideDropdown = projectDropdownRef.current?.contains(target);
      if (isEmpty && !insideRoot && !insideDropdown) {
        setExpanded(false);
        setProjectPickerOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isEmpty) {
        setExpanded(false);
        setProjectPickerOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [expanded, isEmpty]);

  // The project picker dropdown closes on outside click independent of draft state.
  // It's portaled to <body>, so "inside" means either the anchor button or the
  // portaled dropdown itself — neither is a DOM descendant of the other.
  useEffect(() => {
    if (!projectPickerOpen) return;
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      const insideAnchor = projectPickerRef.current?.contains(target);
      const insideDropdown = projectDropdownRef.current?.contains(target);
      if (!insideAnchor && !insideDropdown) setProjectPickerOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [projectPickerOpen]);

  // The composer's own card scrolls internally and would clip a plain
  // absolutely-positioned dropdown, so it's portaled to <body> and positioned
  // from the anchor's viewport rect instead — recomputed on resize while open.
  useEffect(() => {
    if (!projectPickerOpen) return;
    function reposition() {
      const el = projectPickerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setProjectDropdownPos({ left: rect.left, bottom: window.innerHeight - rect.top + 10 });
    }
    reposition();
    window.addEventListener('resize', reposition);
    return () => window.removeEventListener('resize', reposition);
  }, [projectPickerOpen]);

  const config = configsByProject[targetProjectId] ?? configsByProject[activeProjectId];
  const targetProject = projects.find((p) => p.id === targetProjectId) ?? projects.find((p) => p.id === activeProjectId);
  const projectGroups = useMemo(() => groupProjects(projects, folders), [projects, folders]);

  function reset() {
    setType('text');
    setBody('');
    setFiles([]);
    setLinkUrl('');
    setLinkMeta(null);
  }

  function switchType(t: EntryType) {
    setExpanded(true);
    setType(t);
    setFiles([]);
    setLinkMeta(null);
  }

  function attachFiles(list: FileList | File[]) {
    const arr = Array.from(list);
    if (arr.length === 0) return;
    setExpanded(true);
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
      setExpanded(true);
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
        : [],
      targetProjectId
    );
    setConfirming(false);
    setExpanded(false);
    reset();
  }

  if (!config || !targetProject) return null;

  return (
    <div className={`floating-composer ${expanded ? 'is-expanded' : ''}`} ref={rootRef}>
      <div
        className="composer-collapsed-wrap"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onPaste={handlePaste}
      >
        <input
          id="composer-quick-capture"
          ref={collapsedInputRef}
          className="composer-collapsed-input"
          placeholder=" "
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onFocus={() => setExpanded(true)}
          tabIndex={expanded ? -1 : 0}
        />
        <label htmlFor="composer-quick-capture">New entry</label>
      </div>

      <section className="composer card">
          <ComposerHint />
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
              ref={textareaRef}
              className="composer-textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter' || e.shiftKey) return;
                if (!canSubmit) return;
                e.preventDefault();
                setConfirming(true);
              }}
              tabIndex={expanded ? 0 : -1}
            />

            <input ref={fileInput} type="file" hidden multiple onChange={(e) => e.target.files && attachFiles(e.target.files)} />
          </div>

          <div className="composer-foot">
            <div className="composer-foot-project" ref={projectPickerRef}>
              <button className="composer-foot-project-btn" onClick={() => setProjectPickerOpen((v) => !v)}>
                Filed into <strong>{targetProject.name}</strong>
              </button>
              {projectPickerOpen &&
                projectDropdownPos &&
                createPortal(
                  <div
                    ref={projectDropdownRef}
                    className="composer-project-dropdown"
                    style={{ left: projectDropdownPos.left, bottom: projectDropdownPos.bottom }}
                  >
                    {projectGroups.map((g) => (
                      <div key={g.key}>
                        <div className="composer-project-group-label">{g.label}</div>
                        {g.projects.map((p) => (
                          <button
                            key={p.id}
                            className={`composer-project-option ${p.id === targetProjectId ? 'is-active' : ''}`}
                            onClick={() => {
                              setTargetProjectId(p.id);
                              setProjectPickerOpen(false);
                            }}
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>,
                  document.body
                )}
            </div>
            <button
              className="composer-submit-btn"
              disabled={!canSubmit}
              onClick={() => setConfirming(true)}
              aria-label="File entry"
              title="File entry"
            >
              <DecorMark size={20} />
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
    </div>
  );
}
