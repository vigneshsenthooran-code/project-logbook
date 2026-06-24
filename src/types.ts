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

export interface CalendarEvent {
  id: string;
  projectId: string;
  title: string;
  date: string; // ISO date (YYYY-MM-DD)
  note?: string;
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
}

/** The reserved fallback bucket for unmatched entries. */
export const INBOX_ID = 'inbox';
