import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Attachment, CalendarEvent, Config, Entry, Todo } from '../types';
import type { LogbookBundle, StorageAdapter } from './StorageAdapter';
import { blobToDataUrl, dataUrlToBlob } from './blob';

const DB_NAME = 'project-logbook';
const DB_VERSION = 1;
const CONFIG_KEY = 'config';

interface LogbookDB extends DBSchema {
  config: { key: string; value: Config };
  entries: {
    key: string;
    value: Entry;
    indexes: { byCategory: string; byCreated: string };
  };
  attachments: { key: string; value: Attachment };
  todos: { key: string; value: Todo };
  calendar: { key: string; value: CalendarEvent };
}

let dbPromise: Promise<IDBPDatabase<LogbookDB>> | null = null;

function db(): Promise<IDBPDatabase<LogbookDB>> {
  if (!dbPromise) {
    dbPromise = openDB<LogbookDB>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        database.createObjectStore('config');
        const entries = database.createObjectStore('entries', { keyPath: 'id' });
        entries.createIndex('byCategory', 'categoryId');
        entries.createIndex('byCreated', 'createdAt');
        database.createObjectStore('attachments', { keyPath: 'id' });
        database.createObjectStore('todos', { keyPath: 'id' });
        database.createObjectStore('calendar', { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
}

export const indexedDbAdapter: StorageAdapter = {
  async getConfig() {
    return (await db()).get('config', CONFIG_KEY);
  },
  async saveConfig(config) {
    await (await db()).put('config', config, CONFIG_KEY);
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
    const config = (await database.get('config', CONFIG_KEY)) as Config;
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
      version: 1,
      exportedAt: new Date().toISOString(),
      config,
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
      ['config', 'entries', 'attachments', 'todos', 'calendar'],
      'readwrite'
    );
    await Promise.all([
      tx.objectStore('config').clear(),
      tx.objectStore('entries').clear(),
      tx.objectStore('attachments').clear(),
      tx.objectStore('todos').clear(),
      tx.objectStore('calendar').clear(),
    ]);
    await tx.objectStore('config').put(bundle.config, CONFIG_KEY);
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
