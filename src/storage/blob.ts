/** Blob <-> base64 data URL helpers for the export/import bundle.
 *  Uses arrayBuffer + base64 (no FileReader/fetch) so it works identically in
 *  the browser and in test environments. */

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const mime = blob.type || 'application/octet-stream';
  return `data:${mime};base64,${bytesToBase64(bytes)}`;
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const match = /^data:([^;]*);base64,(.*)$/s.exec(dataUrl);
  if (!match) return new Blob([]);
  const [, mime, b64] = match;
  return new Blob([base64ToBytes(b64) as unknown as BlobPart], { type: mime });
}
