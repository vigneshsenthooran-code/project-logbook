import type { Category, Entry, Project } from '../types';

export interface SearchSnippet {
  before: string;
  match: string;
  after: string;
}

export interface SearchPreviewResult {
  entry: Entry;
  projectName: string;
  categoryName: string;
  snippet: SearchSnippet;
}

/** Word-boundary-aware "keyword in context" snippet: a few words either side
 * of the match, so a hit reads like "...the buried [secret] into the..."
 * rather than a raw substring. */
function buildSnippet(text: string, query: string, contextWords = 4): SearchSnippet {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const startIdx = lower.indexOf(q);
  if (startIdx === -1) {
    return { before: '', match: text.slice(0, 80), after: text.length > 80 ? '…' : '' };
  }
  const endIdx = startIdx + query.length;

  const words = text.split(/\s+/).filter(Boolean);
  let charPos = 0;
  let startWord = 0;
  let endWord = words.length - 1;
  for (let i = 0; i < words.length; i++) {
    const wordStart = charPos;
    const wordEnd = wordStart + words[i].length;
    if (startIdx >= wordStart && startIdx <= wordEnd) startWord = i;
    if (endIdx >= wordStart && endIdx <= wordEnd) {
      endWord = i;
      break;
    }
    charPos = wordEnd + 1;
  }

  const ctxStart = Math.max(0, startWord - contextWords);
  const ctxEnd = Math.min(words.length, endWord + contextWords + 1);

  const before = words.slice(ctxStart, startWord).join(' ');
  const match = words.slice(startWord, endWord + 1).join(' ');
  const after = words.slice(endWord + 1, ctxEnd).join(' ');

  return {
    before: (ctxStart > 0 ? '… ' : '') + before,
    match,
    after: after + (ctxEnd < words.length ? ' …' : ''),
  };
}

function entrySearchText(entry: Entry, categoryName: string): string {
  return [entry.body, entry.citation, entry.link?.title, entry.link?.domain, entry.link?.url, categoryName]
    .filter(Boolean)
    .join(' ');
}

/** Top live-search matches across every project, newest first, for the
 * topbar typeahead. Reuses the same fields as the full /search page. */
export function findSearchPreviews(
  query: string,
  projects: Project[],
  configsByProject: Record<string, { categories: Category[] }>,
  entries: Entry[],
  limit: number
): SearchPreviewResult[] {
  const q = query.trim();
  if (!q) return [];
  const qLower = q.toLowerCase();

  const projectNames = new Map(projects.map((p) => [p.id, p.name]));
  const results: SearchPreviewResult[] = [];

  for (const entry of entries) {
    const categories = configsByProject[entry.projectId]?.categories ?? [];
    const categoryName = categories.find((c) => c.id === entry.categoryId)?.name ?? '';
    const text = entrySearchText(entry, categoryName);
    if (!text.toLowerCase().includes(qLower)) continue;
    results.push({
      entry,
      projectName: projectNames.get(entry.projectId) ?? '',
      categoryName,
      snippet: buildSnippet(text, q),
    });
  }

  results.sort((a, b) => b.entry.createdAt.localeCompare(a.entry.createdAt));
  return results.slice(0, limit);
}
