export function isPreviewableMime(mime: string): boolean {
  return mime === 'application/pdf' || mime.startsWith('text/') || mime.startsWith('image/');
}

export function isTextMime(mime: string): boolean {
  return mime.startsWith('text/');
}

export function isImageMime(mime: string): boolean {
  return mime.startsWith('image/');
}

export function isPdfMime(mime: string): boolean {
  return mime === 'application/pdf';
}

export function isHeicMime(mime: string, name?: string): boolean {
  if (/^image\/heif|^image\/heic/i.test(mime)) return true;
  return !!name && /\.hei[cf]$/i.test(name);
}
