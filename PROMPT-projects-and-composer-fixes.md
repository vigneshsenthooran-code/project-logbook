---
name: projects-and-composer-fixes-prompt
description: Implementation prompt for four UI fixes — looping/grouped project list, Enter-to-submit composer, "File this entry" modal sizing bug, project card button layout
---

# Prompt: Projects list grouping/loop scroll, composer Enter-to-submit, filing-modal sizing fix, project card buttons

Paste this into a Claude session working in this repo to implement the changes. Four independent fixes — can be done in any order, ideally as separate commits.

## 1. Projects list: folder-grouped, collapsible, looping scroll

**Where:** `src/views/Projects.tsx` (currently renders one flat `Masonry` grid of `active` projects, filtered to a single folder via the `folder-rail` pills and `selectedFolder` state).

**Change:**
- When `selectedFolder === ALL`, render projects grouped under folder headers instead of one flat grid: a small uppercase header per folder (name + project count) in `folder.order` order, each followed by that folder's `Masonry` grid, with a trailing "Unfiled" group for projects with no `folderId`. This grouping logic already exists once, duplicated as `groupProjects()` in `src/components/EntryComposer.tsx` (lines ~20–31) — extract it into a shared helper (e.g. `src/lib/groupProjects.ts`) and use it from both places instead of re-deriving it here.
- When a specific folder pill is selected (not `ALL`), keep today's behavior — a single flat grid, no headers (there's only one group, a header would be redundant).
- Each folder header gets a collapse/expand chevron (reuse the `▾`/`▸` pattern already used for the Archived section at `Projects.tsx` line ~295-297). Collapsed state should persist across sessions per folder — store it in `localStorage`, not component state, since navigating away and back or reloading shouldn't re-expand everything. Default: expanded.
- Archived section stays as-is (its own trailing, collapsible block after all folder groups).

**Endless/looping scroll — gated by a threshold:** only activate looping once there's meaningfully more content than fits on screen. Don't loop a handful of projects — a short list would repeat almost immediately after a small scroll, which reads as broken, not intentional.

- Gate on actual overflow, not a raw project count: enable the loop only once the grouped list's scrollable height is at least ~1.5–2x the visible container height. This scales correctly with collapsed folders — a user with 40 projects but everything collapsed shouldn't loop, while a user with 15 projects fully expanded might.
- Recompute this threshold check whenever it could change: on mount, on window resize, and whenever a folder's collapsed state toggles (not just once on mount) — a collapse/expand can push content above or below the threshold live, and looping should turn on/off accordingly rather than getting stuck in whatever state it started in.
- Implementation once the threshold is met: render the project list content twice in sequence (real + cloned copy), and when the user's scroll position crosses into the cloned copy, silently reset `scrollTop` back to the equivalent position in the real copy (no visible jump).
- Below the threshold: render normally, no clone, no loop — scrolling just stops at the bottom like a normal list.

## 2. Composer: Enter to submit, Shift+Enter for newline

**Where:** `src/components/EntryComposer.tsx`, the `composer-textarea`'s `onKeyDown` handler (currently ~line 315-317):

```tsx
onKeyDown={(e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canSubmit) setConfirming(true);
}}
```

**Change:** extend this so a plain `Enter` (no Shift, no Cmd/Ctrl) also opens the filing step (`setConfirming(true)`) when `canSubmit` is true, and calls `e.preventDefault()` so it doesn't also insert a newline. `Shift+Enter` must fall through untouched (default textarea behavior — inserts a newline). Keep the existing `Cmd/Ctrl+Enter` shortcut working alongside it.

```tsx
onKeyDown={(e) => {
  if (e.key !== 'Enter' || e.shiftKey) return;
  if ((e.metaKey || e.ctrlKey) || !e.shiftKey) {
    if (canSubmit) {
      e.preventDefault();
      setConfirming(true);
    }
  }
}}
```
(Simplify this to whatever's cleanest — the intent is: `Enter` alone → submit if `canSubmit`; `Shift+Enter` → newline; `Cmd/Ctrl+Enter` → still submits, unchanged.)

**Scope:** this only applies to the composer's own textarea (`EntryComposer.tsx`) — not `EntryEditModal.tsx`'s body textarea. The edit modal is a multi-field form (category, sub-heading, citation, etc.) with an explicit "Save changes" button; wiring Enter-to-submit there would be surprising mid-edit. Leave it as-is unless separately requested.

## 3. Fix "File this entry" modal sizing/scroll bug

**Root cause:** `CategoryConfirmModal` renders a `.scrim`/`.modal` pair (`.scrim` is `position: fixed; inset: 0; z-index: 50` — see `src/styles/tokens.css` lines 400-410) but it's mounted as a *child* of `<section className="composer card">` inside the floating composer (`EntryComposer.tsx` lines 362-371), not at the app root. That composer section has `transform: scale(...)` applied for its own open/close animation and `overflow-y: auto; max-height: calc(100vh - 48px)` (`src/styles/app.css` lines 1001-1017). A CSS `transform` on an ancestor creates a new containing block for descendant `position: fixed` elements — so the scrim's `fixed` positioning resolves against the transformed composer box instead of the viewport. That's exactly the bug in the screenshot: the "File this entry" dialog gets clipped to the composer's bounds, shows the composer's edges as a border, and inherits the composer's scrollbar instead of covering the screen.

**Fix:** in `src/components/CategoryConfirmModal.tsx`, render the `.scrim`/`.modal` tree through `ReactDOM.createPortal(..., document.body)` instead of inline in place. This makes it escape any transformed/scrollable ancestor regardless of where the component is used (composer, edit flows, etc.), matching how every other modal in the app already behaves correctly (`EntryEditModal`, `ProjectEditModal`, `ProjectCreateModal` aren't nested inside a transformed ancestor, so they never hit this).

**Preserve:** the floating composer's own expand/collapse transition (`.composer-collapsed-wrap` / `.floating-composer .composer` opacity+transform, `src/styles/app.css` lines 988-1017) must be untouched by this — the portal only relocates the confirm modal's DOM position, not the composer shell's animation.

**Nice-to-have (optional):** the confirm modal currently has no entrance transition of its own — it just appears. Since the ask is to "maintain the smooth transitions," consider giving the portaled `.scrim`/`.modal` a quick fade+scale-in using the same easing already used elsewhere in the app (`cubic-bezier(0.16, 1, 0.3, 1)`, e.g. `src/styles/app.css` line 988) so this step feels consistent with the rest of the UI. Not required — the core fix is the portal.

## 4. Project card button layout + delete bin icon

**Where:** `src/components/ProjectTile.tsx` lines 83-96 (`.project-tile-actions`), styled at `src/styles/app.css` lines 2802-2808.

**Problems today:**
- Four buttons (Edit / Export / Archive / Delete) in one `flex-wrap` row with plain `gap`, mixed styles (`btn-secondary` for Edit, `btn-ghost` for the rest) and no visual grouping — on the ~260px-wide masonry tile they wrap awkwardly.
- Delete uses `btn btn-ghost btn-sm project-tile-del`, with `.project-tile-del { color: var(--color-error) }` as an ad hoc override — inconsistent with how destructive actions look everywhere else.

**Reference pattern — entries already do this correctly:** `src/components/EntryEditModal.tsx` lines 142-155 uses `btn btn-danger-ghost btn-sm` (an existing token-level class, see `src/styles/tokens.css`) with a `🗑` glyph prefixed to the label, and separates it from the other actions via `.modal-foot-split` (delete pinned left, Cancel/Save grouped right).

**Change:**
- Swap the Delete button's classes from `btn btn-ghost btn-sm project-tile-del` to `btn btn-danger-ghost btn-sm`, drop the now-redundant `.project-tile-del` color override, and prefix the label with the same `🗑` glyph: `🗑 Delete`.
- Visually separate Delete from Edit/Export/Archive rather than having all four wrap together — e.g. group Edit/Export/Archive on the left and push Delete right with `margin-left: auto` on `.project-tile-actions .project-tile-del` (mirrors the left/right split `.modal-foot-split` already does for modals), or wrap the three non-destructive actions in their own inner flex group.
- Tidy `.project-tile-actions` spacing so buttons don't wrap raggedly at the tile's minimum width (260px, see `Masonry` `minColumnWidth` in `Projects.tsx`) — consistent gap, sensible wrap order, Delete visually anchored on its own.

## Acceptance checklist

- [ ] `/projects` groups active projects under folder headers (folder order, trailing Unfiled) when "All projects" is selected; a single flat grid (no headers) when one folder pill is selected.
- [ ] Each folder group collapses/expands via a chevron; collapsed state persists across reloads per folder.
- [ ] Looping scroll only activates once content overflows the viewport by ~1.5–2x; short lists scroll normally with no loop.
- [ ] Loop activation re-evaluates live as folders collapse/expand (can turn on or off without a reload), and the loop point itself stays seamless (no visible jump) whenever it's active.
- [ ] In the composer, plain `Enter` submits (opens the filing modal) when there's fileable content; `Shift+Enter` inserts a newline; `Cmd/Ctrl+Enter` still works.
- [ ] "File this entry" modal covers the full viewport like every other modal in the app — no clipped borders, no inherited composer scrollbar — after clicking submit or hitting Enter in the composer.
- [ ] Composer's existing expand/collapse transition is unaffected by the modal portal change.
- [ ] Project card Delete button uses `btn-danger-ghost` + `🗑` glyph, matching the entry edit modal's delete affordance.
- [ ] Project card action buttons (Edit/Export/Archive/Delete) have clean, non-wrapping spacing with Delete visually separated from the rest.
