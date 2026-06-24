import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Attachment, CalendarEvent, Config, Entry, Project, Todo } from '../types';
import type { LogbookBundle, StorageAdapter } from './StorageAdapter';
import { blobToDataUrl, dataUrlToBlob } from './blob';

const DB_NAME = 'project-logbook';
const DB_VERSION = 2;
const ACTIVE_PROJECT_KEY = 'activeProjectId';

interface LogbookDB extends DBSchema {
  projects: { key: string; value: Project };
  configs: { key: string; value: Config };
  meta: { key: string; value: string };
  entries: {
    key: string;
    value: Entry;
    indexes: { byCategory: string; byCreated: string; byProject: string };
  };
  attachments: { key: string; value: Attachment };
  todos: { key: string; value: Todo; indexes: { byProject: string } };
  calendar: { key: string; value: CalendarEvent; indexes: { byProject: string } };
}

let dbPromise: Promise<IDBPDatabase<LogbookDB>> | null = null;

function db(): Promise<IDBPDatabase<LogbookDB>> {
  if (!dbPromise) {
    dbPromise = openDB<LogbookDB>(DB_NAME, DB_VERSION, {
      upgrade(database, oldVersion) {
        // v1 had a single global config/entries/todos/calendar with no project
        // scoping. Multi-project support is a breaking schema change, so the old
        // stores are dropped and rebuilt rather than migrated.
        if (oldVersion < 2) {
          const raw = database as unknown as { objectStoreNames: DOMStringList; deleteObjectStore(name: string): void };
          for (const name of ['config', 'entries', 'attachments', 'todos', 'calendar']) {
            if (raw.objectStoreNames.contains(name)) raw.deleteObjectStore(name);
          }
        }
        database.createObjectStore('projects', { keyPath: 'id' });
        database.createObjectStore('configs');
        database.createObjectStore('meta');
        const entries = database.createObjectStore('entries', { keyPath: 'id' });
        entries.createIndex('byCategory', 'categoryId');
        entries.createIndex('byCreated', 'createdAt');
        entries.createIndex('byProject', 'projectId');
        database.createObjectStore('attachments', { keyPath: 'id' });
        const todos = database.createObjectStore('todos', { keyPath: 'id' });
        todos.createIndex('byProject', 'projectId');
        const calendar = database.createObjectStore('calendar', { keyPath: 'id' });
        calendar.createIndex('byProject', 'projectId');
      },
    });
  }
  return dbPromise;
}

export const indexedDbAdapter: StorageAdapter = {
  async listProjects() {
    return (await db()).getAll('projects');
  },
  async saveProject(project) {
    await (await db()).put('projects', project);
  },
  async deleteProject(id) {
    const database = await db();
    const [entryIds, todoIds, eventIds] = await Promise.all([
      database.getAllKeysFromIndex('entries', 'byProject', id),
      database.getAllKeysFromIndex('todos', 'byProject', id),
      database.getAllKeysFromIndex('calendar', 'byProject', id),
    ]);
    const entries = await Promise.all(entryIds.map((eid) => database.get('entries', eid)));
    const tx = database.transaction(
      ['projects', 'configs', 'entries', 'attachments', 'todos', 'calendar'],
      'readwrite'
    );
    await Promise.all([
      tx.objectStore('projects').delete(id),
      tx.objectStore('configs').delete(id),
      ...entryIds.map((eid) => tx.objectStore('entries').delete(eid)),
      ...todoIds.map((tid) => tx.objectStore('todos').delete(tid)),
      ...eventIds.map((vid) => tx.objectStore('calendar').delete(vid)),
      ...entries.flatMap((e) =>
        e ? e.attachmentIds.map((aid) => tx.objectStore('attachments').delete(aid)) : []
      ),
    ]);
    await tx.done;
  },

  async getActiveProjectId() {
    return (await db()).get('meta', ACTIVE_PROJECT_KEY);
  },
  async setActiveProjectId(id) {
    await (await db()).put('meta', id, ACTIVE_PROJECT_KEY);
  },

  async getConfig(projectId) {
    return (await db()).get('configs', projectId);
  },
  async saveConfig(projectId, config) {
    await (await db()).put('configs', config, projectId);
  },

  async listEntries() {
    return (await db()).getAll('entries');
  },
  async getEntry(id) {
    return (await db()).get('entries', id);
  },
  async saveEntry(entry) {
    await (await db()).put('entries', entry);
  },
  async deleteEntry(id) {
    await (await db()).delete('entries', id);
  },

  async saveAttachment(att) {
    await (await db()).put('attachments', att);
  },
  async getAttachment(id) {
    return (await db()).get('attachments', id);
  },
  async deleteAttachment(id) {
    await (await db()).delete('attachments', id);
  },

  async listTodos() {
    return (await db()).getAll('todos');
  },
  async saveTodo(todo) {
    await (await db()).put('todos', todo);
  },
  async deleteTodo(id) {
    await (await db()).delete('todos', id);
  },

  async listEvents() {
    return (await db()).getAll('calendar');
  },
  async saveEvent(event) {
    await (await db()).put('calendar', event);
  },
  async deleteEvent(id) {
    await (await db()).delete('calendar', id);
  },

  async exportAll() {
    const database = await db();
    const projects = await database.getAll('projects');
    const configEntries = await Promise.all(
      projects.map(async (p) => [p.id, await database.get('configs', p.id)] as const)
    );
    const configs: Record<string, Config> = {};
    for (const [id, config] of configEntries) if (config) configs[id] = config;
    const activeProjectId = (await database.get('meta', ACTIVE_PROJECT_KEY)) ?? projects[0]?.id ?? '';
    const entries = await database.getAll('entries');
    const todos = await database.getAll('todos');
    const events = await database.getAll('calendar');
    const rawAttachments = await database.getAll('attachments');
    const attachments = await Promise.all(
      rawAttachments.map(async (a) => ({
        id: a.id,
        entryId: a.entryId,
        name: a.name,
        mime: a.mime,
        dataUrl: await blobToDataUrl(a.blob),
      }))
    );
    return {
      version: 2,
      exportedAt: new Date().toISOString(),
      projects,
      configs,
      activeProjectId,
      entries,
      todos,
      events,
      attachments,
    } satisfies LogbookBundle;
  },

  async importAll(bundle) {
    const database = await db();
    // Replace everything with the bundle's contents.
    const tx = database.transaction(
      ['projects', 'configs', 'meta', 'entries', 'attachments', 'todos', 'calendar'],
      'readwrite'
    );
    await Promise.all([
      tx.objectStore('projects').clear(),
      tx.objectStore('configs').clear(),
      tx.objectStore('meta').clear(),
      tx.objectStore('entries').clear(),
      tx.objectStore('attachments').clear(),
      tx.objectStore('todos').clear(),
      tx.objectStore('calendar').clear(),
    ]);
    for (const p of bundle.projects) await tx.objectStore('projects').put(p);
    for (const [projectId, config] of Object.entries(bundle.configs)) {
      await tx.objectStore('configs').put(config, projectId);
    }
    if (bundle.activeProjectId) {
      await tx.objectStore('meta').put(bundle.activeProjectId, ACTIVE_PROJECT_KEY);
    }
    for (const e of bundle.entries) await tx.objectStore('entries').put(e);
    for (const t of bundle.todos) await tx.objectStore('todos').put(t);
    for (const ev of bundle.events) await tx.objectStore('calendar').put(ev);
    for (const a of bundle.attachments) {
      const blob = await dataUrlToBlob(a.dataUrl);
      await tx
        .objectStore('attachments')
        .put({ id: a.id, entryId: a.entryId, name: a.name, mime: a.mime, blob });
    }
    await tx.done;
  },
};
