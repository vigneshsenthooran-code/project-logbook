import { useEffect, useState } from 'react';
import type { Entry } from '../types';
import { useStore } from '../store';
import { isHeicMime, isTextMime } from './file';

export interface FilePreview {
  url: string | null;
  mime: string | null;
  name: string | null;
  text: string | null;
  converting: boolean;
  unsupported: boolean;
}

// Loads the entry's first attachment as an object URL, decoding HEIC/HEIF
// on the fly (browsers other than Safari can't render it directly) and
// reading text content for text/* attachments.
export function useFilePreview(entry: Entry): FilePreview {
  const getAttachment = useStore((s) => s.getAttachment);
  const [state, setState] = useState<FilePreview>({
    url: null,
    mime: null,
    name: null,
    text: null,
    converting: false,
    unsupported: false,
  });

  useEffect(() => {
    let objectUrl: string | null = null;
    let alive = true;
    setState({ url: null, mime: null, name: null, text: null, converting: false, unsupported: false });

    if ((entry.type === 'image' || entry.type === 'file') && entry.attachmentIds.length > 0) {
      void getAttachment(entry.attachmentIds[0]).then(async (att) => {
        if (!att || !alive) return;

        let blob = att.blob;
        let mime = att.mime;

        if (isHeicMime(mime, att.name)) {
          if (alive) setState((s) => ({ ...s, name: att.name, converting: true }));
          try {
            const heic2any = (await import('heic2any')).default;
            const converted = await heic2any({ blob, toType: 'image/jpeg', quality: 0.85 });
            blob = Array.isArray(converted) ? converted[0] : converted;
            mime = 'image/jpeg';
          } catch {
            // Decoding failed — still expose the original file so it can be
            // downloaded, just flagged as unsupported so callers don't try
            // to render it as an <img>.
            if (!alive) return;
            objectUrl = URL.createObjectURL(att.blob);
            setState((s) => ({ ...s, url: objectUrl, mime: att.mime, name: att.name, converting: false, unsupported: true }));
            return;
          }
        }

        if (!alive) return;
        objectUrl = URL.createObjectURL(blob);
        setState((s) => ({ ...s, url: objectUrl, mime, name: att.name, converting: false }));
        if (isTextMime(mime)) void blob.text().then((text) => alive && setState((s) => ({ ...s, text })));
      });
    }

    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [entry, getAttachment]);

  return state;
}
