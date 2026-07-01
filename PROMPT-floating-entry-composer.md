---
name: floating-entry-composer-prompt
description: Implementation prompt for compacting EntryComposer into a global, bottom-left floating-label entry field
---

# Prompt: Global floating-label entry composer

Paste this into a Claude session working in this repo to implement the change.

## Goal

Compact the current dashboard-only `EntryComposer` (`src/components/EntryComposer.tsx`) into a small, floating "quick capture" field docked bottom-left of the viewport, available on every route (not just `/`), using the **"Floating label"** input pattern from `entry_field_aesthetics.html` (variant #1 in that file). Keep all existing composer functionality — type tabs (Note/Image/File/Link), attachments, link preview, drag/drop/paste, `⌘/Ctrl+Enter` submit, category-confirm flow — intact once expanded.

## 1. Collapsed state

- `position: fixed; left: 24px; bottom: 24px; z-index: 40` (above page content, below modals/scrim which use `z-index: 50`).
- Renders as a single floating-label input, styled per `entry_field_aesthetics.html`'s "Floating label" example:
  - Rest state: placeholder-ish label ("New entry") sits inside the field at `left:14px; top:14px`, `font-size:14px`, `color: var(--color-muted)`.
  - On focus (or once the field has content): label animates to `top:6px`, shrinks to `10px`, uppercase, `letter-spacing:1px`, `color: var(--color-primary)` — 180ms ease transition, matching the reference file exactly.
  - Field chrome: `background: var(--color-surface-soft)`, `border: 1px solid var(--color-hairline)` → `var(--color-primary)` on focus, `border-radius: var(--r-sm)`, drop shadow `var(--shadow-1)` so it visibly floats over page content.
  - Width: fixed comfortable width when collapsed (e.g. `320px`), not full composer width.
- Typing, pasting a link/image, or clicking the field expands it in place (see §2) — growing from this same bottom-left anchor, not opening a separate modal/panel.

## 2. Expanded state

- Same bottom-left anchor, grows upward/outward into the full existing composer layout: type tabs → field body (attachments/link row/textarea) → foot bar.
- Reuse the current `EntryComposer` internals (`composer-tabs`, `composer-field`, attachment chips, link preview, textarea, file input) almost unchanged — just re-skin the entry point per §1 and re-parent per §4.
- Collapses back to the compact floating-label pill after a successful file (`handleConfirm` success) or on `Escape` / click-outside with an empty draft. If the draft is non-empty, clicking outside should NOT discard it — keep expanded (avoid silent data loss).

## 3. Keep the project caption — make it a project picker

- The existing foot-bar sentence (`Filed into your {config.activePreset === 'uts' ? 'UTS design log' : 'logbook'}` in `EntryComposer.tsx` line ~218) stays visible in the expanded state, but should say which **project** the entry files into (e.g. "Filed into `{project.name}`"), not the preset name.
- Make that sentence a button. Clicking it opens a dropdown/menu anchored to it, listing projects grouped the same way `src/views/Projects.tsx` / `Folder` groups them:
  - Group projects under their `Folder` (see `src/types.ts` — `Folder`, `Project.folderId`), folder name as a small uppercase section header, in `folder.order` order.
  - Unfiled projects (no `folderId`) in their own "Unfiled"/ungrouped section.
  - Exclude archived projects (`project.archived`).
  - Highlight the currently-selected target project.
- Selecting a project in this dropdown sets the **filing target** for the entry currently being composed — it should NOT necessarily call `switchProject` / navigate the user away from whatever page they're on. This means:
  - The composer needs its own local `targetProjectId` state, defaulting to `store.activeProjectId`.
  - Category confirmation (`CategoryConfirmModal`) and submission need to use `configsByProject[targetProjectId].categories` instead of the global `config.categories`.
  - `addEntry` in `src/store.ts` currently always files into `get().activeProjectId` (see line ~273) — extend it (or add a new store action) to accept an explicit `projectId` argument so entries can be filed into a project other than the one currently open.

## 4. Make it global

- Move the composer out of `src/views/Dashboard.tsx` (currently rendered inline at line 27) and mount it once at the app-shell level (`src/components/AppShell.tsx`) so it renders on every route and survives navigation.
- Dashboard's "Recent" entry grid should keep working as-is; only the composer's mount point changes.
- Guard against double-render/duplicate composer if `AppShell` wraps `Dashboard` — the composer should only ever exist once in the tree.

## 5. Non-goals / keep as-is

- Don't change the categorisation logic (`src/lib/categorize.ts`), `CategoryConfirmModal`, or attachment/link handling behaviour — only the shell/entry-point and project-targeting change.
- Don't redesign the expanded composer's internal layout beyond re-skinning the entry field per §1; tabs, dropzone hint, attachment chips, link preview stay as they are today.
- Don't introduce a new color/typography language — pull every value from `src/styles/tokens.css` (already dark olive/chartreuse, `--font: Archivo`, `--font-display: Fraunces`).

## Acceptance checklist

- [ ] Floating-label field visible bottom-left on every route, not just `/`.
- [ ] Label float animation matches `entry_field_aesthetics.html` variant #1 timing/scale/colour.
- [ ] Expands in place into the full composer; collapses back after successful submit or empty-draft dismiss.
- [ ] Project caption is clickable, opens a folder-grouped project dropdown (folders as headers, unfiled section, archived excluded).
- [ ] Choosing a different project in the dropdown files the entry there without forcing navigation/switching the active project view.
- [ ] All prior composer functionality (tabs, drag/drop, paste, attachments, link preview, `⌘/Ctrl+Enter`, category-confirm modal) still works unchanged.
