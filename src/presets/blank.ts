import type { Category } from '../types';

/** A general-purpose starter set. No sub-headings (the model still supports them). */
export const blankCategories: Category[] = [
  {
    id: 'notes',
    name: 'Notes',
    color: 'var(--cat-5)',
    order: 0,
    keywords: ['note', 'thought', 'remember', 'reminder'],
  },
  {
    id: 'ideas',
    name: 'Ideas',
    color: 'var(--cat-3)',
    order: 1,
    keywords: ['idea', 'concept', 'what if', 'could', 'maybe', 'brainstorm'],
  },
  {
    id: 'tasks',
    name: 'Tasks',
    color: 'var(--cat-4)',
    order: 2,
    keywords: ['todo', 'task', 'do', 'action', 'follow up', 'deadline'],
  },
  {
    id: 'research',
    name: 'Research',
    color: 'var(--cat-6)',
    order: 3,
    keywords: ['research', 'source', 'reference', 'study', 'paper', 'article', 'read'],
  },
  {
    id: 'references',
    name: 'References',
    color: 'var(--cat-7)',
    order: 4,
    keywords: ['link', 'bookmark', 'reference', 'cite', 'url', 'website'],
  },
];
