import type { CalendarEvent, Config, Entry, Project, Todo } from '../types';
import type { LogbookBundle, StorageAdapter } from './StorageAdapter';
import { supabase } from '../lib/supabaseClient';
import { blobToDataUrl, dataUrlToBlob } from './blob';

const BUCKET = 'attachments';

async function userId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Not signed in');
  return data.user.id;
}

function entryToRow(e: Entry, uid: string) {
  return {
    id: e.id,
    user_id: uid,
    project_id: e.projectId,
    type: e.type,
    created_at: e.createdAt,
    updated_at: e.updatedAt,
    body: e.body,
    category_id: e.categoryId,
    sub_heading_id: e.subHeadingId ?? null,
    attachment_ids: e.attachmentIds,
    link: e.link ?? null,
    citation: e.citation ?? null,
    relates_to: e.relatesTo ?? null,
  };
}

function rowToEntry(r: Record<string, unknown>): Entry {
  return {
    id: r.id as string,
    projectId: r.project_id as string,
    type: r.type as Entry['type'],
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
    body: r.body as string,
    categoryId: r.category_id as string,
    subHeadingId: (r.sub_heading_id as string | null) ?? undefined,
    attachmentIds: (r.attachment_ids as string[]) ?? [],
    link: (r.link as Entry['link']) ?? undefined,
    citation: (r.citation as string | null) ?? undefined,
    relatesTo: (r.relates_to as string | null) ?? undefined,
  };
}

function todoToRow(t: Todo, uid: string) {
  return {
    id: t.id,
    user_id: uid,
    project_id: t.projectId,
    text: t.text,
    done: t.done,
    due_date: t.dueDate ?? null,
    created_at: t.createdAt,
  };
}

function rowToTodo(r: Record<string, unknown>): Todo {
  return {
    id: r.id as string,
    projectId: r.project_id as string,
    text: r.text as string,
    done: r.done as boolean,
    dueDate: (r.due_date as string | null) ?? undefined,
    createdAt: r.created_at as string,
  };
}

function eventToRow(e: CalendarEvent, uid: string) {
  return {
    id: e.id,
    user_id: uid,
    project_id: e.projectId,
    title: e.title,
    date: e.date,
    note: e.note ?? null,
  };
}

function rowToEvent(r: Record<string, unknown>): CalendarEvent {
  return {
    id: r.id as string,
    projectId: r.project_id as string,
    title: r.title as string,
    date: r.date as string,
    note: (r.note as string | null) ?? undefined,
  };
}

function attachmentPath(uid: string, attachmentId: string, name: string): string {
  return `${uid}/${attachmentId}-${name}`;
}

export const supabaseAdapter: StorageAdapter = {
  async listProjects() {
    const { data, error } = await supabase.from('projects').select('*');
    if (error) throw error;
    return (data ?? []).map((r) => ({ id: r.id, name: r.name, order: r.order }) as Project);
  },
  async saveProject(project) {
    const uid = await userId();
    const { error } = await supabase
      .from('projects')
      .upsert({ id: project.id, user_id: uid, name: project.name, order: project.order });
    if (error) throw error;
  },
  async deleteProject(id) {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
  },

  async getActiveProjectId() {
    const uid = await userId();
    const { data } = await supabase.from('meta').select('active_project_id').eq('user_id', uid).maybeSingle();
    return data?.active_project_id ?? undefined;
  },
  async setActiveProjectId(id) {
    const uid = await userId();
    const { error } = await supabase.from('meta').upsert({ user_id: uid, active_project_id: id });
    if (error) throw error;
  },

  async getConfig(projectId) {
    const { data } = await supabase.from('configs').select('*').eq('project_id', projectId).maybeSingle();
    if (!data) return undefined;
    return { activePreset: data.active_preset, categories: data.categories } as Config;
  },
  async saveConfig(projectId, config) {
    const uid = await userId();
    const { error } = await supabase.from('configs').upsert({
      project_id: projectId,
      user_id: uid,
      active_preset: config.activePreset,
      categories: config.categories,
    });
    if (error) throw error;
  },

  async listEntries() {
    const { data, error } = await supabase.from('entries').select('*');
    if (error) throw error;
    return (data ?? []).map(rowToEntry);
  },
  async getEntry(id) {
    const { data } = await supabase.from('entries').select('*').eq('id', id).maybeSingle();
    return data ? rowToEntry(data) : undefined;
  },
  async saveEntry(entry) {
    const uid = await userId();
    const { error } = await supabase.from('entries').upsert(entryToRow(entry, uid));
    if (error) throw error;
  },
  async deleteEntry(id) {
    const { error } = await supabase.from('entries').delete().eq('id', id);
    if (error) throw error;
  },

  async saveAttachment(att) {
    const uid = await userId();
    const path = attachmentPath(uid, att.id, att.name);
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, att.blob, { contentType: att.mime, upsert: true });
    if (uploadError) throw uploadError;
    const { error } = await supabase.from('attachments').upsert({
      id: att.id,
      user_id: uid,
      entry_id: att.entryId,
      name: att.name,
      mime: att.mime,
      storage_path: path,
    });
    if (error) throw error;
  },
  async getAttachment(id) {
    const { data } = await supabase.from('attachments').select('*').eq('id', id).maybeSingle();
    if (!data) return undefined;
    const { data: file, error } = await supabase.storage.from(BUCKET).download(data.storage_path);
    if (error || !file) return undefined;
    return { id: data.id, entryId: data.entry_id, name: data.name, mime: data.mime, blob: file };
  },
  async deleteAttachment(id) {
    const { data } = await supabase.from('attachments').select('storage_path').eq('id', id).maybeSingle();
    if (data) await supabase.storage.from(BUCKET).remove([data.storage_path]);
    const { error } = await supabase.from('attachments').delete().eq('id', id);
    if (error) throw error;
  },

  async listTodos() {
    const { data, error } = await supabase.from('todos').select('*');
    if (error) throw error;
    return (data ?? []).map(rowToTodo);
  },
  async saveTodo(todo) {
    const uid = await userId();
    const { error } = await supabase.from('todos').upsert(todoToRow(todo, uid));
    if (error) throw error;
  },
  async deleteTodo(id) {
    const { error } = await supabase.from('todos').delete().eq('id', id);
    if (error) throw error;
  },

  async listEvents() {
    const { data, error } = await supabase.from('calendar_events').select('*');
    if (error) throw error;
    return (data ?? []).map(rowToEvent);
  },
  async saveEvent(event) {
    const uid = await userId();
    const { error } = await supabase.from('calendar_events').upsert(eventToRow(event, uid));
    if (error) throw error;
  },
  async deleteEvent(id) {
    const { error } = await supabase.from('calendar_events').delete().eq('id', id);
    if (error) throw error;
  },

  async exportAll() {
    const projects = await this.listProjects();
    const configEntries = await Promise.all(
      projects.map(async (p) => [p.id, await this.getConfig(p.id)] as const)
    );
    const configs: Record<string, Config> = {};
    for (const [id, config] of configEntries) if (config) configs[id] = config;
    const activeProjectId = (await this.getActiveProjectId()) ?? projects[0]?.id ?? '';
    const entries = await this.listEntries();
    const todos = await this.listTodos();
    const events = await this.listEvents();
    const { data: attRows, error } = await supabase.from('attachments').select('*');
    if (error) throw error;
    const attachments = await Promise.all(
      (attRows ?? []).map(async (r) => {
        const { data: file } = await supabase.storage.from(BUCKET).download(r.storage_path);
        return {
          id: r.id as string,
          entryId: r.entry_id as string,
          name: r.name as string,
          mime: r.mime as string,
          dataUrl: file ? await blobToDataUrl(file) : '',
        };
      })
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
    for (const p of bundle.projects) await this.saveProject(p);
    for (const [projectId, config] of Object.entries(bundle.configs)) {
      await this.saveConfig(projectId, config);
    }
    if (bundle.activeProjectId) await this.setActiveProjectId(bundle.activeProjectId);
    for (const e of bundle.entries) await this.saveEntry(e);
    for (const t of bundle.todos) await this.saveTodo(t);
    for (const ev of bundle.events) await this.saveEvent(ev);
    for (const a of bundle.attachments) {
      const blob = await dataUrlToBlob(a.dataUrl);
      await this.saveAttachment({ id: a.id, entryId: a.entryId, name: a.name, mime: a.mime, blob });
    }
  },
};
