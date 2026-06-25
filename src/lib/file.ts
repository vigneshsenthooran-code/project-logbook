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
