// @vitest-environment node
import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { indexedDbAdapter } from './indexedDbAdapter';
import { categoriesForPreset } from '../presets';
import type { Entry } from '../types';

const PROJECT_ID = 'p1';

function makeEntry(id: string, categoryId: string): Entry {
  const ts = new Date().toISOString();
  return {
    id,
    projectId: PROJECT_ID,
    type: 'text',
    createdAt: ts,
    updatedAt: ts,
    body: `entry ${id}`,
    categoryId,
    attachmentIds: [],
  };
}

describe('indexedDbAdapter export/import round-trip', () => {
  it('preserves projects, config, entries, todos, events and attachments', async () => {
    await indexedDbAdapter.saveProject({ id: PROJECT_ID, name: 'Test project', order: 0 });
    await indexedDbAdapter.setActiveProjectId(PROJECT_ID);
    await indexedDbAdapter.saveConfig(PROJECT_ID, {
      activePreset: 'uts',
      categories: categoriesForPreset('uts'),
    });
    await indexedDbAdapter.saveEntry(makeEntry('e1', 'feedback'));
    await indexedDbAdapter.saveEntry(makeEntry('e2', 'ideas'));
    await indexedDbAdapter.saveTodo({
      id: 't1',
      projectId: PROJECT_ID,
      text: 'submit log',
      done: false,
      createdAt: new Date().toISOString(),
    });
    await indexedDbAdapter.saveEvent({
      id: 'v1',
      projectId: PROJECT_ID,
      title: 'crit',
      date: '2026-07-01',
      kind: 'event',
    });
    const blob = new Blob(['hello world'], { type: 'text/plain' });
    await indexedDbAdapter.saveAttachment({
      id: 'a1',
      entryId: 'e1',
      name: 'note.txt',
      mime: 'text/plain',
      blob,
    });

    const bundle = await indexedDbAdapter.exportAll();
    expect(bundle.projects).toHaveLength(1);
    expect(bundle.entries).toHaveLength(2);
    expect(bundle.attachments).toHaveLength(1);
    expect(bundle.attachments[0].dataUrl).toMatch(/^data:text\/plain/);

    // Re-import the bundle (importAll clears every store first).
    await indexedDbAdapter.importAll(bundle);

    const projects = await indexedDbAdapter.listProjects();
    const entries = await indexedDbAdapter.listEntries();
    const todos = await indexedDbAdapter.listTodos();
    const events = await indexedDbAdapter.listEvents();
    const att = await indexedDbAdapter.getAttachment('a1');
    const config = await indexedDbAdapter.getConfig(PROJECT_ID);
    const activeProjectId = await indexedDbAdapter.getActiveProjectId();

    expect(projects.map((p) => p.id)).toEqual([PROJECT_ID]);
    expect(entries.map((e) => e.id).sort()).toEqual(['e1', 'e2']);
    expect(todos).toHaveLength(1);
    expect(events).toHaveLength(1);
    expect(config?.activePreset).toBe('uts');
    expect(activeProjectId).toBe(PROJECT_ID);
    expect(att).toBeDefined();
    expect(await att!.blob.text()).toBe('hello world');
  });

  it('deleteProject removes its entries, attachments, todos and events', async () => {
    await indexedDbAdapter.saveProject({ id: 'p2', name: 'Doomed project', order: 1 });
    await indexedDbAdapter.saveConfig('p2', { activePreset: 'blank', categories: categoriesForPreset('blank') });
    const entry: Entry = {
      id: 'e3',
      projectId: 'p2',
      type: 'text',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      body: 'doomed entry',
      categoryId: 'notes',
      attachmentIds: ['a2'],
    };
    await indexedDbAdapter.saveEntry(entry);
    await indexedDbAdapter.saveAttachment({
      id: 'a2',
      entryId: 'e3',
      name: 'f.txt',
      mime: 'text/plain',
      blob: new Blob(['x']),
    });
    await indexedDbAdapter.saveTodo({ id: 't2', projectId: 'p2', text: 'x', done: false, createdAt: new Date().toISOString() });
    await indexedDbAdapter.saveEvent({ id: 'v2', projectId: 'p2', title: 'x', date: '2026-01-01', kind: 'event' });

    await indexedDbAdapter.deleteProject('p2');

    expect(await indexedDbAdapter.getEntry('e3')).toBeUndefined();
    expect(await indexedDbAdapter.getAttachment('a2')).toBeUndefined();
    expect((await indexedDbAdapter.listTodos()).find((t) => t.id === 't2')).toBeUndefined();
    expect((await indexedDbAdapter.listEvents()).find((e) => e.id === 'v2')).toBeUndefined();
    expect((await indexedDbAdapter.listProjects()).find((p) => p.id === 'p2')).toBeUndefined();
    expect(await indexedDbAdapter.getConfig('p2')).toBeUndefined();
  });
});
