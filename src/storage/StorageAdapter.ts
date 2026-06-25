import type { Attachment, CalendarEvent, Config, CustomPreset, Entry, Project, Todo } from '../types';

/** A portable snapshot of the whole app (every project), used for export / import. */
export interface LogbookBundle {
  version: 2;
  exportedAt: string;
  projects: Project[];
  /** Each project's category config, keyed by project id. */
  configs: Record<string, Config>;
  activeProjectId: string;
  entries: Entry[];
  todos: Todo[];
  events: CalendarEvent[];
  /** Attachments with their blob encoded as a base64 data URL. */
  attachments: { id: string; entryId: string; name: string; mime: string; dataUrl: string }[];
  /** Global, app-wide custom presets (not scoped to any one project). Absent in older exports. */
  customPresets?: CustomPreset[];
}

/** A portable snapshot of a single project, used for per-project export / import. */
export interface ProjectBundle {
  version: 1;
  exportedAt: string;
  project: Project;
  config: Config;
  entries: Entry[];
  todos: Todo[];
  events: CalendarEvent[];
  attachments: { id: string; entryId: string; name: string; mime: string; dataUrl: string }[];
}

/**
 * The single seam between the app and where data lives. The IndexedDB adapter is
 * the only implementation today; a Google Drive adapter could be dropped in later
 * without touching app logic.
 */
export interface StorageAdapter {
  listProjects(): Promise<Project[]>;
  saveProject(project: Project): Promise<void>;
  /** Removes the project and everything filed under it (config, entries, attachments, todos, events). */
  deleteProject(id: string): Promise<void>;

  getActiveProjectId(): Promise<string | undefined>;
  setActiveProjectId(id: string): Promise<void>;

  getConfig(projectId: string): Promise<Config | undefined>;
  saveConfig(projectId: string, config: Config): Promise<void>;

  listEntries(): Promise<Entry[]>;
  getEntry(id: string): Promise<Entry | undefined>;
  saveEntry(entry: Entry): Promise<void>;
  deleteEntry(id: string): Promise<void>;

  saveAttachment(att: Attachment): Promise<void>;
  getAttachment(id: string): Promise<Attachment | undefined>;
  deleteAttachment(id: string): Promise<void>;

  listTodos(): Promise<Todo[]>;
  saveTodo(todo: Todo): Promise<void>;
  deleteTodo(id: string): Promise<void>;

  listEvents(): Promise<CalendarEvent[]>;
  saveEvent(event: CalendarEvent): Promise<void>;
  deleteEvent(id: string): Promise<void>;

  listCustomPresets(): Promise<CustomPreset[]>;
  saveCustomPreset(preset: CustomPreset): Promise<void>;
  deleteCustomPreset(id: string): Promise<void>;

  exportAll(): Promise<LogbookBundle>;
  importAll(bundle: LogbookBundle): Promise<void>;

  /** A portable snapshot of a single project — used for per-project export. */
  exportProject(projectId: string): Promise<ProjectBundle>;
}
