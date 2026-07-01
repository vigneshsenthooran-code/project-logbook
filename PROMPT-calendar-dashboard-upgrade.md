---
name: calendar-dashboard-upgrade-prompt
description: Implementation prompt for promoting CalendarWidget to a full-width, cross-project dashboard feature that absorbs to-dos and adds term/week scheduling
---

# Prompt: Full-width, universal calendar with term/week scheduling, absorbing to-dos

Paste this into a Claude Code session working in this repo to implement the change.

## Goal

Promote `src/components/CalendarWidget.tsx` from a narrow, per-project sidebar widget into the dashboard's primary, full-width feature that is **universal across all projects** — one calendar showing every project's events and tasks together, not scoped to `activeProjectId`. Remove `src/components/TodoList.tsx` as a separate widget and fold its functionality into the calendar as a task-type event. Add support for multi-day events, recurring events, reminders/due times, project + category colour-coding with per-project filter toggles, a week/agenda view toggle, and a single, app-wide configurable "term" (period) made of numbered weeks with designatable break weeks — modelling a university semester (e.g. 8 weeks class → study vacation week → 4 weeks class → study vacation week → assessment weeks). Match existing app aesthetics exactly; pull every value from `src/styles/tokens.css`, don't invent new colours/type.

## 1. Layout — full width, remove the rail split, de-scope from the active project

- In `src/views/Dashboard.tsx`, remove `TodoList` entirely and stop rendering `CalendarWidget` inside `.dashboard-rail`.
- Replace the current `.dashboard-grid` (`grid-template-columns: 1fr 340px` in `src/styles/app.css` line ~808) two-column split with the calendar rendered as its own full-width section, then the existing `.dashboard-recent` block below it (that "Recent" grid stays scoped to `activeProjectId` as today — only the calendar becomes universal). Remove `.dashboard-main` / `.dashboard-rail` from the DOM once nothing else uses them (check `ProjectMap`/`ProjectSwitcher` aren't relying on the rail — they currently sit in `.dashboard-hero`, unaffected).
- Suggested order: hero (`ProjectMap` + `ProjectSwitcher`) → full-width calendar → "Recent" entry grid. Flip this if it reads better once built, but the calendar should be the first thing under the hero, not buried after entries.
- Update the `@media` responsive rules around `.dashboard-grid`/`.dashboard-rail` (app.css line ~2482 and ~2523) since that column split no longer exists.
- The calendar keeps the `panel card` surface treatment it already uses — same border-radius (`--r-xl`), same `--color-card` background — just wider. Don't restyle the base chrome, only the internal grid/typography scale for the extra width (e.g. bigger day cells, room for event chips/labels instead of just a dot).
- In `CalendarWidget.tsx`, change `useStore((s) => s.events).filter((e) => e.projectId === activeProjectId)` to read **all** events (`useStore((s) => s.events)`), independent of `ProjectSwitcher`. Switching the active project must not change what the calendar shows.

## 2. Data model changes (`src/types.ts`)

Extend `CalendarEvent`:

```ts
export type CalendarItemKind = 'event' | 'task';

export interface CalendarEvent {
  id: string;
  projectId?: string;  // now OPTIONAL — events can be filed under a project or left general/project-less
  title: string;
  date: string;       // ISO date (YYYY-MM-DD) — start date
  endDate?: string;    // ISO date — inclusive end date; absent/equal to `date` = single-day
  time?: string;       // HH:mm, optional
  reminder?: boolean;  // surface a visual due/reminder indicator
  kind: CalendarItemKind; // 'task' replaces the old Todo concept
  done?: boolean;      // only meaningful when kind === 'task'
  categoryId?: string; // optional secondary tint — only meaningful when projectId is set, drives colour-coding via existing Category.color
  recurrence?: {
    freq: 'weekly';
    until: string;     // ISO date — stop recurring after this date (typically term end)
    excludeDates?: string[]; // dates skipped (e.g. break weeks), computed from the global Period
  };
  note?: string;
}
```

Add a new type for the term/period configuration — this is now a **single, global, app-wide singleton**, not per-project (the calendar itself is universal, so one real semester's schedule should apply everywhere):

```ts
export interface Period {
  id: string;          // singleton — always the same id (e.g. 'global')
  startDate: string;   // ISO date — Week 1 start (a Monday)
  weekCount: number;   // total numbered weeks in the period
  breakWeeks: number[]; // 1-based week numbers marked as break/study-vacation weeks
  labels?: Record<number, string>; // optional custom label per week number, e.g. {9: 'Study vacation', 13: 'Study vacation', 14: 'Assessment'}
}
```

Keep the `Todo` interface and its storage plumbing in place for now (see §3 migration) rather than deleting it outright — don't break existing stored data.

## 3. Fold to-dos into the calendar as tasks

- Tasks are `CalendarEvent`s with `kind: 'task'`. They render on their due date in the grid with a checkbox affordance (reuse the visual language of `.todo-check`/`.todo-item.is-done` from `app.css` line ~1888) rather than the plain dot used for `kind: 'event'`.
- Inside the day detail area (the `.cal-events` panel that currently opens on selecting a date), tasks show a checkbox that toggles `done` in place; events show their title/time only. Both share one "Add" row, with a small kind switch (Event / Task) — task mode hides the end-date/time-range controls that don't apply and shows a due-date + optional reminder toggle instead.
- Add `addCalendarItem` / update `toggleCalendarEvent(id)` / keep `deleteEvent` in `src/store.ts`, replacing the current `addTodo`/`toggleTodo`/`deleteTodo` call sites. `toggleTodo`'s existing logic (flip `done`, persist, update state) is a good template for `toggleCalendarEvent`.
- One-time migration on load (in the store's init/hydrate path, alongside where `listTodos`/`listEvents` are currently called in `src/store.ts` ~line 147): convert any existing `Todo` records into `CalendarEvent`s with `kind: 'task'`, `date: todo.dueDate ?? <today>`, carrying over `text → title`, `done`, and `projectId` (existing todos already belong to a project — keep that link so the migrated task still shows the right project tag). Persist the converted events, then stop surfacing the old todos in any UI (leave the underlying `todos` table/store untouched as a safety net — don't delete data).

## 4. Project tagging & filter chips

- Since the calendar now aggregates every project, each event/task needs a way to show which project it belongs to — or that it belongs to none. When creating an event/task, include a project picker defaulting to the currently active project (`activeProjectId`), plus an explicit "No project" option that sets `projectId` to `undefined`.
- Assign each project a stable colour swatch for calendar purposes only (don't touch `ProjectTile`'s existing neutral-gradient styling) — derive it deterministically from the project's position in `store.projects` indexed into the existing `--cat-1` … `--cat-8` palette (wrap around if there are more than 8 projects). Project-less events get the current neutral `var(--color-muted)`/`var(--color-primary)` treatment.
- Show a small coloured tag/pill with the project name on each event in the day-detail list and agenda view (reuse the `.tag`/`.tag-dot` pattern already defined in `app.css` line ~412). On month/week grid chips, the project colour is the chip's tint; the label itself can stay implicit (colour + hover/tooltip) since grid cells are tight on space.
- Add project filter chips above the calendar grid (near `.cal-head`/`.cal-nav`): one toggle chip per project (using its assigned swatch colour) plus a "No project" chip, all active by default. Toggling a chip off hides that project's events/tasks from the grid, detail list, and agenda view without deleting anything. Persist the filter selection in local component state (no need to persist across sessions).

## 5. Colour-coding — project first, category as a secondary accent

- Primary tint on every chip/dot is the event's **project** colour from §4 (or the neutral project-less treatment). This is what makes a cross-project calendar scannable at a glance.
- `CalendarEvent.categoryId` is optional and, only when the event also has a `projectId`, layers a secondary accent (e.g. a small inner dot or left-edge stripe on the chip, not a full re-tint) using `categoryColor(configsByProject[event.projectId].categories, categoryId)` from `src/lib/categories.ts` (already used elsewhere — reuse it, don't reimplement). Category sets are per-project, so always resolve via the event's own `projectId`, never the currently active project.
- Project-less events never show a category accent (categories don't exist without a project).

## 6. Multi-day events

- Selection model: click a start day, then click an end day, to define the range (matches existing single-click-to-select interaction in `CalendarWidget`, just extended to two clicks). Clicking the same day twice keeps it a single-day event. Clicking a new day while a range is "armed" but not yet confirmed resets the start.
- Give the user a clear indicator of "pick end date" state (e.g. the armed start cell gets a distinct outline/style, `t-caption-sm` hint text appears: "Pick an end date…").
- On the grid, render multi-day events as a horizontal bar/chip spanning their date cells (not just a dot repeated on each day) — this is the main visual payoff of the full-width layout, so give it real room. Tint per §5; style should follow the existing hairline/radius language, not introduce new visual primitives.
- `endDate < date` should be rejected/swapped, not silently broken.

## 7. Recurring events

- Support weekly recurrence only (`recurrence.freq: 'weekly'`), sufficient for "this class happens every Tuesday for the term." Adding this to an event should default `until` to the global `Period`'s end date if one is configured, otherwise require the user to pick an end date.
- Recurrence expansion happens at render time (compute occurrences for the visible month from the stored rule), not by writing one row per occurrence — keeps edits/deletes simple. Deleting or editing "this occurrence" vs "the whole series" is out of scope; edit/delete acts on the whole series for v1.
- When the global `Period` exists and its break weeks are known, weekly recurrences should automatically skip dates that fall inside a break week (populate `recurrence.excludeDates` from the period's break-week date ranges) — this is the actual payoff of linking recurrence to the term model (a weekly class doesn't meet during study vacation).

## 8. Reminders / due times

- `time` (HH:mm) is optional on any event or task; when set, show it in the day-detail list (e.g. "14:00 — Studio crit") and in the spanning chip's tooltip/label if there's room.
- `reminder: boolean` just adds a small visual marker (reuse an existing icon-free convention — e.g. a `--color-warning` dot or the existing `.cal-dot` recoloured) on the day cell and in the detail list. No actual browser notification/push — this is a visual "flag this" affordance only, keep it that simple.

## 9. Term / period builder (inline, single global schedule)

- Inline, collapsible section within `CalendarWidget` (e.g. a "Term settings" disclosure at the top or bottom of the panel, collapsed by default once configured). Exactly **one** `Period` for the whole app — no project picker here, this describes the real semester everyone's projects live inside.
- Fields: start date (Week 1, must land on or snap to a Monday), total week count, and a way to toggle individual weeks as "break" weeks with an optional custom label per week (defaults to "Break" if unlabelled; support relabelling a week to e.g. "Assessment" per the brief's assessment-weeks case — a labelled non-teaching week doesn't strictly have to mean "skip recurrence," so keep `breakWeeks` as the thing that drives recurrence-skipping and `labels` as the display string, letting assessment weeks be labelled without necessarily being in `breakWeeks` if classes/deadlines should still show that week).
- Once configured, the month grid should surface week numbers relative to the period (e.g. a slim "Wk 6" / "Break" label per grid row or a header strip), so the calendar visibly maps onto the semester structure — this is the actual "prominent" payoff of the feature, don't bury it as a settings-only concept.
- Persist via new `getPeriod`/`savePeriod` methods on `StorageAdapter` (`src/storage/StorageAdapter.ts`) — singleton read/write, not a list. Implement in `src/storage/indexedDbAdapter.ts` (new `period` object store holding a single fixed-key record, bump the IndexedDB schema version) and `src/storage/supabaseAdapter.ts` (new `periods` table keyed by `user_id primary key`, following the existing `meta` table pattern in `supabase/schema.sql` line ~90 — one row per authenticated user, not per project). Add a corresponding Supabase migration file under `supabase/migrations/` (next number after `003_project_folders.sql`) with the new table and an RLS policy consistent with `meta`'s existing policy.

## 10. Week / agenda view toggle

- Add a view toggle (Month / Week / Agenda) near the existing month-nav controls (`.cal-nav`), styled consistently (small pill/segmented control using `.btn-ghost`/`.btn-pill` conventions, not a new control style).
- Week view: single row of 7 days, taller cells, room for stacked event chips and times.
- Agenda view: a scrollable list grouped by date, each row showing time (if set), title, project tag, category accent, and task checkbox where applicable — closest analogue to the old to-do list's linear feel, useful now that tasks live inside the calendar.
- Default to Month view; persisting the last-used view/filter selection per session is a nice-to-have, not required.

## 11. Storage / schema changes summary

- `src/storage/StorageAdapter.ts`: existing `listEvents`/`saveEvent`/`deleteEvent` signatures stay the same (the type they operate on just grew fields, including optional `projectId`); add `getPeriod`/`savePeriod` for the new singleton.
- `src/storage/indexedDbAdapter.ts`: bump DB version, add a `period` store (single record) — mirror the existing `calendar` store setup at line ~21 but without a `byProject` index since it's now a singleton, not project-scoped.
- `src/storage/supabaseAdapter.ts`: migrate `calendar_events` — add columns (`end_date`, `time`, `reminder`, `kind`, `done`, `category_id`, `recurrence` as jsonb) and **drop the `not null` constraint on `project_id`** (schema.sql line ~83) so project-less events are allowed; add a `periods` table (per §9) + adapter methods.
- `supabase/schema.sql`: keep in sync with the new migration so a fresh environment matches an upgraded one.

## 12. Non-goals

- No drag-to-reschedule of existing events, no ICS import/export, no push/browser notifications for reminders, no per-occurrence editing of recurring events, no daily/monthly (only weekly) recurrence.
- Don't touch `EntryComposer`, `EntryGrid`, categorisation logic, or anything outside the calendar/todo/dashboard-layout surface described above. The "Recent" entries grid on the dashboard stays scoped to `activeProjectId` — only the calendar becomes universal.
- Don't introduce a new colour or type scale — every new visual element (chips, week-number strip, view toggle, break-week labels, project swatches) must resolve to existing tokens in `src/styles/tokens.css`.

## Acceptance checklist

- [ ] Calendar renders full-width on the dashboard; `TodoList` is gone from the UI, `.dashboard-grid`/`.dashboard-rail` split removed and responsive rules updated.
- [ ] Calendar shows events/tasks from every project simultaneously; switching the active project via `ProjectSwitcher` does not change what the calendar displays.
- [ ] Existing `Todo` records are migrated into `kind: 'task'` calendar events on load (keeping their `projectId`), with no data loss (old `todos` store left intact as a safety net).
- [ ] Can create a task (checkbox, due date, optional reminder) and a timed/untimed event from the same add flow, with a project picker (including "No project").
- [ ] Can create a multi-day event via click-start/click-end and see it render as a spanning chip across its date range.
- [ ] Project filter chips toggle each project's (and project-less) events on/off in the grid, detail list, and agenda view.
- [ ] Can set up a weekly recurring event that auto-skips configured break weeks.
- [ ] Events are tinted primarily by project colour; events with a `categoryId` additionally show a category accent resolved from their own project's category set.
- [ ] Can configure the single global term period (Week 1 start, week count, break weeks with labels) inline in the calendar panel, and the month grid shows week-number/break labelling driven by it.
- [ ] Month / Week / Agenda view toggle works and looks consistent with existing `.cal-nav`/button styling.
- [ ] `calendar_events.project_id` is nullable in Supabase; new `periods` table (singleton per user) has a migration file and matches `supabase/schema.sql`; IndexedDB schema version bumped with a working upgrade path for existing local data.
- [ ] No new colours, fonts, radii, or shadows introduced outside `src/styles/tokens.css`.
