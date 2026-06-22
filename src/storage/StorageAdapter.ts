import type { Attachment, CalendarEvent, Config, Entry, Todo } from '../types';

/** A portable snapshot of the whole logbook, used for export / import. */
export interface LogbookBundle {
  version: 1;
  exportedAt: string;
  config: Config;
  entries: Entry[];
  todos: Todo[];
  events: CalendarEvent[];
  /** Attachments with their blob encoded as a base64 data URL. */
  attachments: { id: string; entryId: string; name: string; mime: string; dataUrl: string }[];
}

/**
 * The single seam between the app and where data lives. The IndexedDB adapter is
 * the only implementation today; a Google Drive adapter could be dropped in later
 * without touching app logic.
 */
export interface StorageAdapter {
  getConfig(): Promise<Config | undefined>;
  saveConfig(config: Config): Promise<void>;

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

  exportAll(): Promise<LogbookBundle>;
  importAll(bundle: LogbookBundle): Promise<void>;
}
