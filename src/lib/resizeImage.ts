/** Downscales an image file to fit within maxDim on its longest edge,
 * re-encoding as JPEG. Cover thumbnails are rendered at a few hundred px —
 * storing (and decoding/compositing) the original upload resolution is
 * pure waste and tanks scroll/paint performance on cards that use it. */
export async function resizeImageFile(file: File, maxDim = 1600, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  if (scale === 1) {
    bitmap.close();
    return file;
  }

  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  return blob ?? file;
}
