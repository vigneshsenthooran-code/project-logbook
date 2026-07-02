import type { Folder, Project } from '../types';

export const UNFILED_GROUP_KEY = '__unfiled__';

export interface ProjectGroup {
  key: string;
  label: string;
  projects: Project[];
}

/** Groups active projects under their folder (folder.order order), with a trailing Unfiled group. */
export function groupProjects(projects: Project[], folders: Folder[]): ProjectGroup[] {
  const active = projects.filter((p) => !p.archived);
  const groups: ProjectGroup[] = [];
  for (const f of [...folders].sort((a, b) => a.order - b.order)) {
    const inFolder = active.filter((p) => p.folderId === f.id);
    if (inFolder.length > 0) groups.push({ key: f.id, label: f.name, projects: inFolder });
  }
  const unfiled = active.filter((p) => !p.folderId);
  if (unfiled.length > 0) groups.push({ key: UNFILED_GROUP_KEY, label: 'Unfiled', projects: unfiled });
  return groups;
}
