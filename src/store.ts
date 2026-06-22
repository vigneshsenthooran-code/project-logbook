import { create } from 'zustand';
import type { Attachment, CalendarEvent, Category, Config, Entry, Todo } from './types';
import { indexedDbAdapter } from './storage/indexedDbAdapter';
import type { LogbookBundle } from './storage/StorageAdapter';
import { categoriesForPreset } from './presets';
import { nowIso, uid } from './lib/id';

const storage = indexedDbAdapter;

interface AppState {
  ready: boolean;
  config: Config;
  entries: Entry[];
  todos: Todo[];
  events: CalendarEvent[];

  init: () => Promise<void>;

  // entries
  addEntry: (
    entry: Omit<Entry, 'id' | 'createdAt' | 'updatedAt'>,
    attachments?: { name: string; mime: string; blob: Blob }[]
  ) => Promise<Entry>;
  updateEntry: (id: string, patch: Partial<Entry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  getAttachment: (id: string) => Promise<Attachment | undefined>;

  // categories / config
  setCategories: (categories: Category[]) => Promise<void>;
  applyPreset: (presetId: string) => Promise<void>;

  // planner
  addTodo: (text: string, dueDate?: string) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  addEvent: (title: string, date: string, note?: string) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;

  // export / import
  exportBundle: () => Promise<LogbookBundle>;
  importBundle: (bundle: LogbookBundle) => Promise<void>;
}

const DEFAULT_PRESET = 'uts';

export const useStore = create<AppState>((set, get) => ({
  ready: false,
  config: { activePreset: DEFAULT_PRESET, categories: categoriesForPreset(DEFAULT_PRESET) },
  entries: [],
  todos: [],
  events: [],

  async init() {
    let config = await storage.getConfig();
    if (!config) {
      config = { activePreset: DEFAULT_PRESET, categories: categoriesForPreset(DEFAULT_PRESET) };
      await storage.saveConfig(config);
    }
    const [entries, todos, events] = await Promise.all([
      storage.listEntries(),
      storage.listTodos(),
      storage.listEvents(),
    ]);
    set({ config, entries, todos, events, ready: true });
  },

  async addEntry(input, attachments = []) {
    const id = uid();
    const ts = nowIso();
    const attachmentIds: string[] = [];
    for (const a of attachments) {
      const attId = uid();
      attachmentIds.push(attId);
      await storage.saveAttachment({ id: attId, entryId: id, ...a });
    }
    const entry: Entry = {
      ...input,
      id,
      createdAt: ts,
      updatedAt: ts,
      attachmentIds: [...input.attachmentIds, ...attachmentIds],
    };
    await storage.saveEntry(entry);
    set({ entries: [...get().entries, entry] });
    return entry;
  },

  async updateEntry(id, patch) {
    const existing = get().entries.find((e) => e.id === id);
    if (!existing) return;
    const updated: Entry = { ...existing, ...patch, id, updatedAt: nowIso() };
    await storage.saveEntry(updated);
    set({ entries: get().entries.map((e) => (e.id === id ? updated : e)) });
  },

  async deleteEntry(id) {
    const existing = get().entries.find((e) => e.id === id);
    if (existing) {
      for (const attId of existing.attachmentIds) await storage.deleteAttachment(attId);
    }
    await storage.deleteEntry(id);
    set({ entries: get().entries.filter((e) => e.id !== id) });
  },

  getAttachment(id) {
    return storage.getAttachment(id);
  },

  async setCategories(categories) {
    const config = { ...get().config, categories };
    await storage.saveConfig(config);
    set({ config });
  },

  async applyPreset(presetId) {
    const config: Config = { activePreset: presetId, categories: categoriesForPreset(presetId) };
    await storage.saveConfig(config);
    set({ config });
  },

  async addTodo(text, dueDate) {
    const todo: Todo = { id: uid(), text, done: false, dueDate, createdAt: nowIso() };
    await storage.saveTodo(todo);
    set({ todos: [...get().todos, todo] });
  },
  async toggleTodo(id) {
    const t = get().todos.find((x) => x.id === id);
    if (!t) return;
    const updated = { ...t, done: !t.done };
    await storage.saveTodo(updated);
    set({ todos: get().todos.map((x) => (x.id === id ? updated : x)) });
  },
  async deleteTodo(id) {
    await storage.deleteTodo(id);
    set({ todos: get().todos.filter((x) => x.id !== id) });
  },

  async addEvent(title, date, note) {
    const ev: CalendarEvent = { id: uid(), title, date, note };
    await storage.saveEvent(ev);
    set({ events: [...get().events, ev] });
  },
  async deleteEvent(id) {
    await storage.deleteEvent(id);
    set({ events: get().events.filter((x) => x.id !== id) });
  },

  exportBundle() {
    return storage.exportAll();
  },
  async importBundle(bundle) {
    await storage.importAll(bundle);
    await get().init();
  },
}));
