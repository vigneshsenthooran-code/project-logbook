# Project Logbook

A flexible logbook for capturing feedback, ideas, images, files, and links across any project —
and automatically filing each entry into the right category. Built for the UTS Master of
Architecture design studio (AUT 2026), but usable for any sustained, research-heavy project.

Vite + React + TypeScript single-page app. **All data is stored locally in your browser
(IndexedDB)** — no account, no server, no Google Drive. Use **Export / Import** in the sidebar to
back up or move your logbook between devices.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build to dist/
npm test         # unit tests (categorisation + export/import round-trip)
```

## How it works

- **Capture.** The composer on the Dashboard accepts text notes, images (with captions), files, and
  links. Link entries fetch a title + thumbnail via [microlink.io](https://microlink.io) and fall
  back to a plain URL card if that fails.
- **Categorise + confirm.** On submit, entry text is matched against each category's keyword list
  (local, deterministic — no AI). The strongest match is pre-selected; you confirm or pick another.
  No match → the **Inbox** fallback, never a silent guess.
- **Browse.** Every entry is a card in a filterable, sortable grid. Filter by category, sort by
  newest or by category order. Edit or delete any entry (delete is confirmed).
- **Plan.** A calendar and to-do list on the Dashboard double the logbook as a lightweight planner.
- **Presets.** Ships with a **Blank / General** preset and the **UTS Architecture Design Log**
  preset — Feedback + Ideas capture categories, then the eleven design-log headings in submission
  order, with sub-headings, an APA-7th citation field on image/link entries, and a "relates to"
  heading tag on Feedback/Ideas. Manage categories, keywords, sub-headings, colours, and order in
  **Settings**.

## Architecture

| Concern | Where |
|---|---|
| Data model | `src/types.ts` |
| Storage seam | `src/storage/StorageAdapter.ts` — `indexedDbAdapter.ts` is the only implementation today; a Drive adapter could slot in here later |
| App state | `src/store.ts` (Zustand) |
| Categorisation | `src/lib/categorize.ts` (pure, unit-tested) |
| Link previews | `src/lib/linkMeta.ts` |
| Presets | `src/presets/` (`blank.ts`, `uts.ts`) |
| Design tokens | `src/styles/tokens.css` (Airbnb-derived: white canvas, Rausch #ff385c accent) |
| Views | `src/views/` · Components `src/components/` |

## Deferred (future work)

Google Drive sync, submission-document export (PDF/Word), voice/audio entries, and full-text search.
The storage interface and one-file-per-entry-friendly model keep the Drive path open without rework.
