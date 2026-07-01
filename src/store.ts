import { create } from 'zustand';
import type { Attachment, CalendarEvent, Category, Config, CustomPreset, Entry, Folder, Period, Project, Todo } from './types';
import { INBOX_ID } from './types';
import { indexedDbAdapter } from './storage/indexedDbAdapter';
import type { LogbookBundle, ProjectBundle, StorageAdapter } from './storage/StorageAdapter';
import { categoriesForPreset, categoriesFromSet } from './presets';
import { nowIso, toDateKey, uid } from './lib/id';
import { dataUrlToBlob } from './storage/blob';
import { DEMO_PROJECTS } from './lib/seedDemo';

let storage: StorageAdapter = indexedDbAdapter;

/** Swaps the backing store (e.g. switching Local <-> Cloud) and forces the next init() to reload from it. */
export function setActiveStorage(adapter: StorageAdapter): void {
  storage = adapter;
  initPromise = null;
}

const DEFAULT_PRESET = 'uts';

function blankConfig(presetId: string): Config {
  return { activePreset: presetId, categories: categoriesForPreset(presetId) };
}

/** Resolves a preset id against built-ins first, then the given custom-preset list. */
function configForPreset(presetId: string, customPresets: CustomPreset[]): Config {
  const custom = customPresets.find((p) => p.id === presetId);
  if (custom) return { activePreset: presetId, categories: categoriesFromSet(custom.categories) };
  return blankConfig(presetId);
}

interface AppState {
  ready: boolean;
  projects: Project[];
  activeProjectId: string;
  /** The active project's category config. Mirrors configsByProject[activeProjectId]. */
  config: Config;
  configsByProject: Record<string, Config>;
  entries: Entry[];
  todos: Todo[];
  events: CalendarEvent[];
  customPresets: CustomPreset[];
  folders: Folder[];
  /** The single, app-wide term/period. Null until the user configures one. */
  period: Period | null;

  init: () => Promise<void>;

  // projects
  addProject: (name: string, presetId?: string) => Promise<Project>;
  updateProject: (
    id: string,
    patch: Partial<Pick<Project, 'name' | 'description' | 'startDate' | 'folderId'>>
  ) => Promise<void>;
  setProjectCover: (id: string, file: { name: string; mime: string; blob: Blob }) => Promise<void>;
  removeProjectCover: (id: string) => Promise<void>;
  archiveProject: (id: string) => Promise<void>;
  unarchiveProject: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  switchProject: (id: string) => Promise<void>;
  exportProject: (id: string) => Promise<ProjectBundle>;
  importProject: (bundle: ProjectBundle) => Promise<Project>;
  moveProjectToFolder: (id: string, folderId: string | undefined) => Promise<void>;

  // project folders (global, app-wide groupings shown on the Projects page)
  addFolder: (name: string) => Promise<Folder>;
  renameFolder: (id: string, name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;

  // custom presets (global, app-wide)
  addCustomPreset: (name: string, description: string, categories: Category[]) => Promise<CustomPreset>;
  updateCustomPreset: (id: string, patch: Partial<Pick<CustomPreset, 'name' | 'description' | 'categories'>>) => Promise<void>;
  deleteCustomPreset: (id: string) => Promise<void>;

  // entries
  addEntry: (
    entry: Omit<Entry, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>,
    attachments?: { name: string; mime: string; blob: Blob }[],
    projectId?: string
  ) => Promise<Entry>;
  updateEntry: (id: string, patch: Partial<Entry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  getAttachment: (id: string) => Promise<Attachment | undefined>;

  // categories / config (apply to the active project)
  setCategories: (categories: Category[]) => Promise<void>;
  applyPreset: (presetId: string) => Promise<void>;

  // planner — legacy per-project to-do plumbing, kept as a data safety net;
  // the UI now surfaces to-dos as calendar items (kind: 'task') instead.
  addTodo: (text: string, dueDate?: string) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;

  // calendar — universal across all projects
  addCalendarItem: (input: Omit<CalendarEvent, 'id'>) => Promise<CalendarEvent>;
  toggleCalendarEvent: (id: string) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;

  // term / period (global singleton)
  savePeriod: (period: Omit<Period, 'id'>) => Promise<void>;
  /** Resets the term's dates/weeks/breaks/labels back to factory defaults. */
  resetPeriod: () => Promise<void>;

  // export / import
  exportBundle: () => Promise<LogbookBundle>;
  importBundle: (bundle: LogbookBundle) => Promise<void>;
  /** Wipes every project, entry and preset, then re-seeds a fresh default project. */
  resetAll: () => Promise<void>;

  // TEMPORARY demo helpers — seed / remove extra showcase projects + entries.
  seedDemoData: () => Promise<void>;
  clearDemoData: () => Promise<void>;
}

// React.StrictMode double-invokes effects in dev, which would otherwise race
// init() and create two default projects before either save lands.
let initPromise: Promise<void> | null = null;

export const useStore = create<AppState>((set, get) => ({
  ready: false,
  projects: [],
  activeProjectId: '',
  config: blankConfig(DEFAULT_PRESET),
  configsByProject: {},
  entries: [],
  todos: [],
  events: [],
  customPresets: [],
  folders: [],
  period: null,

  async init() {
    if (initPromise) return initPromise;
    initPromise = (async () => {
      const customPresets = await storage.listCustomPresets();
      const folders = await storage.listFolders();

      let projects = await storage.listProjects();
      if (projects.length === 0) {
        const project: Project = { id: uid(), name: 'Architecture Logbook', order: 0, createdAt: nowIso() };
        await storage.saveProject(project);
        await storage.saveConfig(project.id, blankConfig(DEFAULT_PRESET));
        projects = [project];
      }
      projects = [...projects].sort((a, b) => a.order - b.order);

      const configsByProject: Record<string, Config> = {};
      for (const p of projects) {
        configsByProject[p.id] = (await storage.getConfig(p.id)) ?? configForPreset('blank', customPresets);
      }

      let activeProjectId = await storage.getActiveProjectId();
      if (!activeProjectId || !projects.some((p) => p.id === activeProjectId && !p.archived)) {
        activeProjectId = (projects.find((p) => !p.archived) ?? projects[0]).id;
        await storage.setActiveProjectId(activeProjectId);
      }

      const [entries, todos, events, period] = await Promise.all([
        storage.listEntries(),
        storage.listTodos(),
        storage.listEvents(),
        storage.getPeriod(),
      ]);

      // One-time migration: fold existing Todos into calendar tasks. The
      // migrated event's id is derived from the todo's, so this is idempotent
      // across reloads — the underlying `todos` store is left untouched.
      const existingIds = new Set(events.map((e) => e.id));
      const migrated: CalendarEvent[] = [];
      for (const t of todos) {
        const evId = `todo-${t.id}`;
        if (existingIds.has(evId)) continue;
        migrated.push({
          id: evId,
          projectId: t.projectId,
          title: t.text,
          date: t.dueDate ?? toDateKey(new Date()),
          kind: 'task',
          done: t.done,
        });
      }
      for (const ev of migrated) await storage.saveEvent(ev);

      set({
        projects,
        configsByProject,
        activeProjectId,
        config: configsByProject[activeProjectId],
        entries,
        todos,
        events: [...events, ...migrated],
        customPresets,
        folders,
        period: period ?? null,
        ready: true,
      });
    })();
    return initPromise;
  },

  async addProject(name, presetId = 'blank') {
    const projects = get().projects;
    const maxOrder = Math.max(-1, ...projects.map((p) => p.order));
    const project: Project = { id: uid(), name, order: maxOrder + 1, createdAt: nowIso() };
    const config = configForPreset(presetId, get().customPresets);
    await storage.saveProject(project);
    await storage.saveConfig(project.id, config);
    set({
      projects: [...projects, project],
      configsByProject: { ...get().configsByProject, [project.id]: config },
    });
    await get().switchProject(project.id);
    return project;
  },

  async updateProject(id, patch) {
    const project = get().projects.find((p) => p.id === id);
    if (!project) return;
    const updated = { ...project, ...patch };
    await storage.saveProject(updated);
    set({ projects: get().projects.map((p) => (p.id === id ? updated : p)) });
  },

  async setProjectCover(id, file) {
    const project = get().projects.find((p) => p.id === id);
    if (!project) return;
    const oldCoverId = project.coverAttachmentId;
    const coverAttachmentId = uid();
    await storage.saveAttachment({ id: coverAttachmentId, entryId: id, ...file });
    if (oldCoverId) await storage.deleteAttachment(oldCoverId);
    const updated = { ...project, coverAttachmentId };
    await storage.saveProject(updated);
    set({ projects: get().projects.map((p) => (p.id === id ? updated : p)) });
  },

  async removeProjectCover(id) {
    const project = get().projects.find((p) => p.id === id);
    if (!project?.coverAttachmentId) return;
    await storage.deleteAttachment(project.coverAttachmentId);
    const updated = { ...project, coverAttachmentId: undefined };
    await storage.saveProject(updated);
    set({ projects: get().projects.map((p) => (p.id === id ? updated : p)) });
  },

  async archiveProject(id) {
    const projects = get().projects;
    const target = projects.find((p) => p.id === id);
    if (!target || target.archived) return;
    if (projects.filter((p) => !p.archived).length <= 1) {
      throw new Error('You need at least one active project.');
    }
    const updated = { ...target, archived: true };
    await storage.saveProject(updated);
    const nextProjects = projects.map((p) => (p.id === id ? updated : p));

    let activeProjectId = get().activeProjectId;
    let config = get().config;
    if (activeProjectId === id) {
      activeProjectId = nextProjects.find((p) => !p.archived)!.id;
      config = get().configsByProject[activeProjectId];
      await storage.setActiveProjectId(activeProjectId);
    }
    set({ projects: nextProjects, activeProjectId, config });
  },

  async unarchiveProject(id) {
    const project = get().projects.find((p) => p.id === id);
    if (!project || !project.archived) return;
    const updated = { ...project, archived: false };
    await storage.saveProject(updated);
    set({ projects: get().projects.map((p) => (p.id === id ? updated : p)) });
  },

  async deleteProject(id) {
    const projects = get().projects;
    if (projects.length <= 1) return; // always keep at least one project
    const target = projects.find((p) => p.id === id);
    if (target?.coverAttachmentId) await storage.deleteAttachment(target.coverAttachmentId);
    await storage.deleteProject(id);
    const remaining = projects.filter((p) => p.id !== id).sort((a, b) => a.order - b.order);
    const configsByProject = { ...get().configsByProject };
    delete configsByProject[id];
    const entries = get().entries.filter((e) => e.projectId !== id);
    const todos = get().todos.filter((t) => t.projectId !== id);
    const events = get().events.filter((e) => e.projectId !== id);

    let activeProjectId = get().activeProjectId;
    let config = get().config;
    if (activeProjectId === id) {
      activeProjectId = (remaining.find((p) => !p.archived) ?? remaining[0]).id;
      config = configsByProject[activeProjectId];
      await storage.setActiveProjectId(activeProjectId);
    }
    set({ projects: remaining, configsByProject, entries, todos, events, activeProjectId, config });
  },

  async switchProject(id) {
    if (id === get().activeProjectId) return;
    const config = get().configsByProject[id];
    if (!config) return;
    await storage.setActiveProjectId(id);
    set({ activeProjectId: id, config });
  },

  async addEntry(input, attachments = [], projectId) {
    const id = uid();
    projectId = projectId ?? get().activeProjectId;
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
      projectId,
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
    const activeProjectId = get().activeProjectId;
    const config = { ...get().config, categories };
    await storage.saveConfig(activeProjectId, config);
    set({ config, configsByProject: { ...get().configsByProject, [activeProjectId]: config } });
  },

  async applyPreset(presetId) {
    const activeProjectId = get().activeProjectId;
    const config = configForPreset(presetId, get().customPresets);
    await storage.saveConfig(activeProjectId, config);
    set({ config, configsByProject: { ...get().configsByProject, [activeProjectId]: config } });
  },

  async addCustomPreset(name, description, categories) {
    const preset: CustomPreset = {
      id: uid(),
      name,
      description,
      categories: categories.filter((c) => c.id !== INBOX_ID).map((c) => ({ ...c, keywords: [...c.keywords] })),
      createdAt: nowIso(),
    };
    await storage.saveCustomPreset(preset);
    set({ customPresets: [...get().customPresets, preset] });
    return preset;
  },

  async updateCustomPreset(id, patch) {
    const preset = get().customPresets.find((p) => p.id === id);
    if (!preset) return;
    const updated: CustomPreset = {
      ...preset,
      ...patch,
      categories: patch.categories
        ? patch.categories.filter((c) => c.id !== INBOX_ID).map((c) => ({ ...c, keywords: [...c.keywords] }))
        : preset.categories,
    };
    await storage.saveCustomPreset(updated);
    set({ customPresets: get().customPresets.map((p) => (p.id === id ? updated : p)) });
  },

  async deleteCustomPreset(id) {
    await storage.deleteCustomPreset(id);
    set({ customPresets: get().customPresets.filter((p) => p.id !== id) });
  },

  async moveProjectToFolder(id, folderId) {
    await get().updateProject(id, { folderId });
  },

  async addFolder(name) {
    const folders = get().folders;
    const maxOrder = Math.max(-1, ...folders.map((f) => f.order));
    const folder: Folder = { id: uid(), name, order: maxOrder + 1, createdAt: nowIso() };
    await storage.saveFolder(folder);
    set({ folders: [...folders, folder] });
    return folder;
  },

  async renameFolder(id, name) {
    const folder = get().folders.find((f) => f.id === id);
    if (!folder) return;
    const updated = { ...folder, name };
    await storage.saveFolder(updated);
    set({ folders: get().folders.map((f) => (f.id === id ? updated : f)) });
  },

  async deleteFolder(id) {
    await storage.deleteFolder(id);
    const affected = get().projects.filter((p) => p.folderId === id);
    for (const p of affected) {
      const updated = { ...p, folderId: undefined };
      await storage.saveProject(updated);
    }
    set({
      folders: get().folders.filter((f) => f.id !== id),
      projects: get().projects.map((p) => (p.folderId === id ? { ...p, folderId: undefined } : p)),
    });
  },

  exportProject(id) {
    return storage.exportProject(id);
  },

  async importProject(bundle) {
    const idMap = new Map<string, string>();
    const remap = (oldId: string) => {
      if (!idMap.has(oldId)) idMap.set(oldId, uid());
      return idMap.get(oldId)!;
    };

    const projects = get().projects;
    const maxOrder = Math.max(-1, ...projects.map((p) => p.order));
    const newProjectId = uid();

    for (const a of bundle.attachments) {
      const blob = await dataUrlToBlob(a.dataUrl);
      const entryId = a.entryId === bundle.project.id ? newProjectId : remap(a.entryId);
      await storage.saveAttachment({ id: remap(a.id), entryId, name: a.name, mime: a.mime, blob });
    }

    const project: Project = {
      ...bundle.project,
      id: newProjectId,
      order: maxOrder + 1,
      archived: false,
      coverAttachmentId: bundle.project.coverAttachmentId ? remap(bundle.project.coverAttachmentId) : undefined,
      folderId: undefined, // the source folder doesn't exist in this app — file as unfiled
    };
    await storage.saveProject(project);
    await storage.saveConfig(newProjectId, bundle.config);

    const newEntries: Entry[] = [];
    for (const e of bundle.entries) {
      const entry: Entry = {
        ...e,
        id: remap(e.id),
        projectId: newProjectId,
        attachmentIds: e.attachmentIds.map((aid) => remap(aid)),
      };
      await storage.saveEntry(entry);
      newEntries.push(entry);
    }
    const newTodos: Todo[] = [];
    for (const t of bundle.todos) {
      const todo: Todo = { ...t, id: remap(t.id), projectId: newProjectId };
      await storage.saveTodo(todo);
      newTodos.push(todo);
    }
    const newEvents: CalendarEvent[] = [];
    for (const ev of bundle.events) {
      const event: CalendarEvent = { ...ev, id: remap(ev.id), projectId: newProjectId };
      await storage.saveEvent(event);
      newEvents.push(event);
    }

    set({
      projects: [...projects, project],
      configsByProject: { ...get().configsByProject, [newProjectId]: bundle.config },
      entries: [...get().entries, ...newEntries],
      todos: [...get().todos, ...newTodos],
      events: [...get().events, ...newEvents],
    });
    return project;
  },

  async addTodo(text, dueDate) {
    const todo: Todo = {
      id: uid(),
      projectId: get().activeProjectId,
      text,
      done: false,
      dueDate,
      createdAt: nowIso(),
    };
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

  async addCalendarItem(input) {
    const ev: CalendarEvent = { id: uid(), ...input };
    await storage.saveEvent(ev);
    set({ events: [...get().events, ev] });
    return ev;
  },
  async toggleCalendarEvent(id) {
    const e = get().events.find((x) => x.id === id);
    if (!e) return;
    const updated = { ...e, done: !e.done };
    await storage.saveEvent(updated);
    set({ events: get().events.map((x) => (x.id === id ? updated : x)) });
  },
  async deleteEvent(id) {
    await storage.deleteEvent(id);
    set({ events: get().events.filter((x) => x.id !== id) });
  },

  async savePeriod(period) {
    const full: Period = { id: 'global', ...period };
    await storage.savePeriod(full);
    set({ period: full });
  },

  async resetPeriod() {
    if (!get().period) return;
    await storage.clearPeriod();
    set({ period: null });
  },

  exportBundle() {
    return storage.exportAll();
  },
  async importBundle(bundle) {
    await storage.importAll(bundle);
    initPromise = null; // force a fresh load of the just-imported data
    await get().init();
  },

  async resetAll() {
    for (const p of get().projects) await storage.deleteProject(p.id);
    for (const cp of get().customPresets) await storage.deleteCustomPreset(cp.id);
    for (const f of get().folders) await storage.deleteFolder(f.id);
    initPromise = null; // init() will recreate a fresh default project
    await get().init();
  },

  // TEMPORARY: adds three demo projects (each on a different preset) plus a
  // spread of entries across their categories. Idempotent — clears any prior
  // demo projects first so repeat clicks replace rather than stack.
  async seedDemoData() {
    await get().clearDemoData();
    const existing = get().projects;
    let order = Math.max(-1, ...existing.map((p) => p.order));
    const newProjects: Project[] = [];
    const newConfigs: Record<string, Config> = {};
    const newEntries: Entry[] = [];

    for (const sp of DEMO_PROJECTS) {
      const projectId = uid();
      const project: Project = {
        id: projectId,
        name: sp.name,
        description: sp.description,
        order: ++order,
        createdAt: nowIso(),
        demo: true,
      };
      const config = configForPreset(sp.presetId, get().customPresets);
      await storage.saveProject(project);
      await storage.saveConfig(projectId, config);
      newProjects.push(project);
      newConfigs[projectId] = config;

      for (const se of sp.entries) {
        const ts = new Date(Date.now() - (se.daysAgo ?? 0) * 86_400_000).toISOString();
        const entry: Entry = {
          id: uid(),
          projectId,
          type: se.type,
          createdAt: ts,
          updatedAt: ts,
          body: se.body,
          categoryId: se.categoryId,
          subHeadingId: se.subHeadingId,
          attachmentIds: [],
          link: se.link,
          relatesTo: se.relatesTo,
          citation: se.citation,
        };
        await storage.saveEntry(entry);
        newEntries.push(entry);
      }
    }

    set({
      projects: [...existing, ...newProjects],
      configsByProject: { ...get().configsByProject, ...newConfigs },
      entries: [...get().entries, ...newEntries],
    });
    if (newProjects[0]) await get().switchProject(newProjects[0].id);
  },

  // TEMPORARY: removes every demo project (and its entries/config/etc). Matches
  // the demo flag or the "Demo — " name prefix so older seed runs are caught too.
  async clearDemoData() {
    const isDemo = (p: Project) => p.demo || p.name.startsWith('Demo — ');
    const demoIds = new Set(get().projects.filter(isDemo).map((p) => p.id));
    if (demoIds.size === 0) return;

    for (const id of demoIds) {
      const target = get().projects.find((p) => p.id === id);
      if (target?.coverAttachmentId) await storage.deleteAttachment(target.coverAttachmentId);
      await storage.deleteProject(id);
    }

    const remaining = get().projects.filter((p) => !demoIds.has(p.id)).sort((a, b) => a.order - b.order);
    const configsByProject = { ...get().configsByProject };
    for (const id of demoIds) delete configsByProject[id];
    const entries = get().entries.filter((e) => !demoIds.has(e.projectId));
    const todos = get().todos.filter((t) => !demoIds.has(t.projectId));
    const events = get().events.filter((e) => !e.projectId || !demoIds.has(e.projectId));

    let activeProjectId = get().activeProjectId;
    let config = get().config;
    if (demoIds.has(activeProjectId)) {
      activeProjectId = (remaining.find((p) => !p.archived) ?? remaining[0]).id;
      config = configsByProject[activeProjectId];
      await storage.setActiveProjectId(activeProjectId);
    }
    set({ projects: remaining, configsByProject, entries, todos, events, activeProjectId, config });
  },
}));
