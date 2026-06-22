// @vitest-environment node
import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { indexedDbAdapter } from './indexedDbAdapter';
import { categoriesForPreset } from '../presets';
import type { Entry } from '../types';

function makeEntry(id: string, categoryId: string): Entry {
  const ts = new Date().toISOString();
  return {
    id,
    type: 'text',
    createdAt: ts,
    updatedAt: ts,
    body: `entry ${id}`,
    categoryId,
    attachmentIds: [],
  };
}

describe('indexedDbAdapter export/import round-trip', () => {
  it('preserves config, entries, todos, events and attachments', async () => {
    await indexedDbAdapter.saveConfig({
      activePreset: 'uts',
      categories: categoriesForPreset('uts'),
    });
    await indexedDbAdapter.saveEntry(makeEntry('e1', 'feedback'));
    await indexedDbAdapter.saveEntry(makeEntry('e2', 'ideas'));
    await indexedDbAdapter.saveTodo({
      id: 't1',
      text: 'submit log',
      done: false,
      createdAt: new Date().toISOString(),
    });
    await indexedDbAdapter.saveEvent({ id: 'v1', title: 'crit', date: '2026-07-01' });
    const blob = new Blob(['hello world'], { type: 'text/plain' });
    await indexedDbAdapter.saveAttachment({
      id: 'a1',
      entryId: 'e1',
      name: 'note.txt',
      mime: 'text/plain',
      blob,
    });

    const bundle = await indexedDbAdapter.exportAll();
    expect(bundle.entries).toHaveLength(2);
    expect(bundle.attachments).toHaveLength(1);
    expect(bundle.attachments[0].dataUrl).toMatch(/^data:text\/plain/);

    // Re-import the bundle (importAll clears every store first).
    await indexedDbAdapter.importAll(bundle);

    const entries = await indexedDbAdapter.listEntries();
    const todos = await indexedDbAdapter.listTodos();
    const events = await indexedDbAdapter.listEvents();
    const att = await indexedDbAdapter.getAttachment('a1');
    const config = await indexedDbAdapter.getConfig();

    expect(entries.map((e) => e.id).sort()).toEqual(['e1', 'e2']);
    expect(todos).toHaveLength(1);
    expect(events).toHaveLength(1);
    expect(config?.activePreset).toBe('uts');
    expect(att).toBeDefined();
    expect(await att!.blob.text()).toBe('hello world');
  });
});
