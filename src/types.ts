export type EntryType = 'text' | 'image' | 'file' | 'link';

export interface LinkMeta {
  url: string;
  title?: string;
  thumbnailUrl?: string;
  domain: string;
}

export interface Entry {
  id: string;
  projectId: string;
  type: EntryType;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  body: string; // free text or image/file caption
  categoryId: string;
  subHeadingId?: string;
  attachmentIds: string[];
  link?: LinkMeta;
  citation?: string; // APA 7th — surfaced on image/link entries
  relatesTo?: string; // categoryId a Feedback/Ideas entry points at
}

export interface Category {
  id: string;
  name: string;
  color: string;
  order: number;
  keywords: string[];
  parentId?: string; // present => sub-heading
}

export interface Attachment {
  id: string;
  entryId: string;
  name: string;
  mime: string;
  blob: Blob;
}

export interface Todo {
  id: string;
  projectId: string;
  text: string;
  done: boolean;
  dueDate?: string; // ISO date (YYYY-MM-DD)
  createdAt: string;
}

export type CalendarItemKind = 'event' | 'task';

export interface CalendarEvent {
  id: string;
  projectId?: string; // absent => project-less / general
  title: string;
  date: string; // ISO date (YYYY-MM-DD) — start date
  endDate?: string; // ISO date — inclusive end date; absent/equal to `date` = single-day
  time?: string; // HH:mm, optional
  reminder?: boolean;
  kind: CalendarItemKind;
  done?: boolean; // only meaningful when kind === 'task'
  categoryId?: string; // only meaningful when projectId is set
  recurrence?: {
    freq: 'weekly';
    until: string; // ISO date — stop recurring after this date
    excludeDates?: string[]; // dates skipped (e.g. break weeks)
  };
  note?: string;
}

/** A single, global, app-wide term/period made of numbered weeks with break weeks. */
export interface Period {
  id: string; // singleton — always 'global'
  startDate: string; // ISO date — Week 1 start (a Monday)
  weekCount: number;
  breakWeeks: number[]; // 1-based week numbers marked as break/study-vacation weeks
  labels?: Record<number, string>; // optional custom label per week number
}

export interface Config {
  activePreset: string;
  categories: Category[];
}

/** A standalone capture space — its own categories, entries, to-dos and calendar. */
export interface Project {
  id: string;
  name: string;
  order: number;
  description?: string;
  coverAttachmentId?: string;
  startDate?: string; // ISO date (YYYY-MM-DD)
  archived?: boolean;
  createdAt?: string; // ISO
  demo?: boolean; // TEMPORARY: marks a project seeded by the demo button
  folderId?: string; // present => filed under a project folder, absent => unfiled
}

/** A user-created group that projects can be filed under on the Projects page. */
export interface Folder {
  id: string;
  name: string;
  order: number;
  createdAt?: string; // ISO
}

/** A user-saved, reusable category set — appears in the preset picker for every project. */
export interface CustomPreset {
  id: string;
  name: string;
  description: string;
  categories: Category[];
  createdAt: string;
}

/** The reserved fallback bucket for unmatched entries. */
export const INBOX_ID = 'inbox';
