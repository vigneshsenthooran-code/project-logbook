export type StorageMode = 'local' | 'cloud';

const KEY = 'quire.storageMode';

export function getStorageMode(): StorageMode | undefined {
  const v = localStorage.getItem(KEY);
  return v === 'local' || v === 'cloud' ? v : undefined;
}

export function setStorageMode(mode: StorageMode): void {
  localStorage.setItem(KEY, mode);
}
