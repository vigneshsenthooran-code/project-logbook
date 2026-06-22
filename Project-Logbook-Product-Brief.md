# Product Brief — Project Logbook

**Working title:** Project Logbook (a flexible logbook for capturing feedback, ideas, and references across any project)
**Author:** Vignesh
**Date:** 21 June 2026
**Status:** Draft for build in Claude Code
**Primary use case:** Collating the UTS Master of Architecture design studio logbook (AUT 2026)

---

## 1. Summary

Project Logbook is a web application (Vite + React, hosted on Vercel) for capturing the messy, continuous stream of thinking that happens during a project — ideas, feedback you receive, images, files, and links — and automatically filing each entry into the right category. It replaces the scattered mix of notes apps, photo rolls, browser bookmarks, and email threads that a project's "working memory" usually lives in. The user's data lives in their own Google Drive, so it syncs across devices and remains theirs.

Entries are added through a single prominent entry field. The app reads the text (and any caption you give an image) and suggests a category based on keyword matching; you confirm or correct the suggestion before it is filed. Everything is then browsable as a grid of cards that can be filtered and sorted. A dashboard surrounds the entry field with a calendar and a to-do list so the logbook doubles as a lightweight planner.

The category system is fully customisable and ships with presets. The flagship preset opens with Feedback and Ideas capture categories and then mirrors the eleven official UTS School of Architecture design-log headings in submission order, turning a semester of captured material into a structured, submission-ready record.

**Stack at a glance:** Vite + React single-page app, deployed on Vercel. Storage is the user's Google Drive via the Drive API and Google OAuth. Categorisation is local keyword matching in the browser — no LLM calls.

## 2. Goals and non-goals

**Goals**

- Make capturing a thought or a piece of feedback as fast and frictionless as a single text box.
- Automatically sort entries into categories with a confirm step, so filing never feels like data entry.
- Give every entry — text, image, file, or link — a consistent card representation that is easy to browse, filter, and edit.
- Store everything in plain, portable files inside the user's own Google Drive so the data outlives the app and syncs across devices.
- Ship an architecture-studio preset that maps directly onto the UTS design-log brief.
- Stay genuinely pleasant to use: a considered, calm interface, not a generic dashboard template.

**Non-goals (for the first version)**

- No multi-user accounts, sharing, or real-time collaboration. Sign-in exists only to authorise access to the user's own Google Drive.
- No app-owned backend database. The only server-side code is a minimal OAuth token exchange (a Vercel serverless function); all user data lives in the user's Drive, not on our servers.
- No AI/LLM calls. Categorisation is local keyword matching only, keeping the app free to run and the logic deterministic.
- No mobile-native app. It is a responsive web app that works in a mobile browser, but native packaging is out of scope.

## 3. Target users

The first and defining user is an architecture student assembling a design log across a 12–14 week studio, who needs to capture tutor feedback, site research, precedents, sketches, and reference material as it arrives and have it organised under the headings their submission will be marked against.

The broader audience is anyone running a sustained, research-heavy project — a thesis, a design portfolio, a renovation, a startup, a piece of writing — who wants one place to dump and later retrieve everything related to it. The customisable category system is what lets the same tool serve all of them.

## 4. User workflow

The core loop is deliberately short:

1. The user types an idea or a piece of feedback into the entry field, or attaches one or more images (with a short description), a file, or a website link.
2. On submit, the app scans the text and caption for keywords and proposes the category it best matches.
3. The user confirms the suggestion or picks a different category, then saves.
4. The entry appears as a card in the grid view, filed under its category and stamped with the date.
5. The user can browse all entries as cards, filter by category, sort by newest or by category order, and edit or delete any entry.
6. Alongside this, the user interacts with the calendar and to-do list on the dashboard, and scrolls down to review entries.

A short, supportive failure path matters: if no keyword matches, the app proposes an "Uncategorised" / "Inbox" bucket rather than guessing, so nothing is ever lost or mis-filed silently.

## 5. Key features

**Entry capture (the centrepiece).** A large, always-available entry field is the visual and functional heart of the dashboard. It accepts free text, image uploads with captions, file uploads (PDF/docs), and website links. Link entries fetch a title and, where possible, a thumbnail so they read as rich cards rather than bare URLs.

**Keyword categorisation with confirm.** Each category carries a list of trigger keywords (editable in settings). On submit the app matches entry text and captions against these lists, ranks the categories, and pre-selects the strongest match. The user always gets a confirm step — the app suggests, the user decides.

**Card grid browser.** All entries render as uniform cards in a responsive grid, each showing type, title/snippet, category tag, date, and a thumbnail for images and links.

**Filtering and sorting.** Filter by one or more categories; sort by newest first or by the defined category order. Category order is itself configurable so the studio preset can mirror the submission sequence.

**Edit and delete.** Any entry can be edited (text, caption, category, attached link) or removed, with a confirm step on delete.

**Folder-like organisation.** Categories behave like folders that hold their entries. The flagship preset additionally supports sub-headings (e.g. Connecting with Country → Hydrology, Songlines, Seasonality) so nested studio structure is preserved.

**Dashboard planner.** The entry field occupies the main column; a calendar and a to-do list sit to one side. Calendar events and to-do items are stored alongside entries so the logbook is also a lightweight project planner.

**Sidebar for settings and management.** A persistent sidebar holds navigation, category management (add/rename/reorder/recolour categories and edit keyword lists), preset selection, and app settings.

**Presets.** Ship with at least a blank/general preset and the UTS architecture design-log preset (Section 7). Users can switch presets per project and customise from there.

## 6. Information architecture and data model

Because storage is the user's Google Drive holding plain files, the data model is designed to be human-readable and portable — the folder is useful even if the app disappears. The app creates and works inside a single dedicated folder in the user's Drive (using the `drive.file` scope, so it can only see files it created — not the user's whole Drive).

Suggested layout inside the app's Drive folder:

```
ProjectLogbook/                # a folder in the user's Google Drive
  config.json            # categories, keywords, order, colours, active preset
  entries/
    2026-06-21T0930-uuid.json   # one file per entry (metadata + text/caption + refs)
  attachments/
    uuid-sketch.jpg             # uploaded images and files, referenced by entries
  planner/
    todos.json
    calendar.json
```

Each Drive file is addressed by its Drive file id; the app keeps a small in-memory/IndexedDB index mapping entry ids to Drive file ids so it doesn't have to list the whole folder on every load.

Each **entry** record carries: a unique id, created/updated timestamps, type (`text` | `image` | `file` | `link`), the body text or caption, a category id (and optional sub-heading), an array of attachment references, and for links the URL plus fetched title/thumbnail.

Each **category** carries: id, display name, colour, order index, an array of trigger keywords, and an optional parent (for sub-headings).

A note on the Google Drive choice: it gives the user free cross-device sync and backup with no app-owned database, and the data stays in an account they already trust. The cost is the OAuth flow, dependence on Drive API availability and rate limits, and network latency on every read/write — so the app should cache reads locally (IndexedDB) and write through to Drive, rather than hitting the API on every interaction. One-file-per-entry keeps the blast radius of any single sync conflict to one entry rather than a whole database.

## 7. UTS architecture design-log preset

This preset is the original motivation for the app. It mirrors the AUT 2026 mArch / bLhons design-log brief so captured material lands directly under the headings the submission is assessed against. It opens with two working-capture categories — **Feedback** and **Ideas** — for the day-to-day stream of tutor comments and your own thinking, which can later be referenced or moved into the formal headings. The eleven design-log headings follow in submission order. Categories (with representative sub-headings drawn from the brief):

1. **Feedback** — tutor and reviewer comments captured as received, tagged to the heading they relate to.
2. **Ideas** — your own thoughts, sketches, and directions as they occur, before they are worked into a formal section.
3. **Return brief** — typology + program description, area calculations (site / building / landscape pervious + impervious / GFA), scheduled semester program.
4. **Connecting with Country** — Positioning, ethics + ICIP, Hydrology, Geology, Songlines, Astronomy, Materials, Ecologies + habitats, Seasonality, Timeline of connection.
5. **Contextual analysis** — existing colonial conditions, orientation, sun path + overshadowing, views + sight lines, landscape systems (hydrology, soils, vegetation, land uses, transport).
6. **NCC** — building classification, NCC worksheets (IPD sessions), codes applied to the project.
7. **Whole life carbon** — materials matrix, embodied energy/water, transport emissions, carbon calculations (EPIC / half-carbon).
8. **Sustainability** — social, economic, and Country considerations; resilience; active and passive systems; biodiversity, water, energy, lighting + acoustics.
9. **Planning instruments** — FSR, setbacks, envelope, zone, heritage items, LEPs/DCPs, codes + standards, DA pathway.
10. **Structural logic systems** — engineer consultation mark-ups, exploded axo, material life-cycle in structural selection.
11. **Process, form-making + precedent** — sketches, mark-ups, precedent analysis, three (3) site-planning options and iterative design options.
12. **Reference list** — full APA 7th reference list for all images, quotes, and sources.
13. **IPD / lecture notes** — IPD and lecture session notes, included as an addendum.

Each entry in this preset should retain space for APA 7th citation, since the brief stresses that every image and quote must be referenced — a "citation" field on image and link entries would directly serve this. Feedback and Ideas entries benefit from an optional "relates to" tag pointing at one of the formal headings, so a comment captured in the moment can later be traced to the section it informs.

## 8. Architecture decisions

Based on your confirmed choices, the recommended stack and the reasoning behind each call:

| Decision | Choice | Why | Trade-off accepted |
|---|---|---|---|
| Build tool + framework | Vite + React | Fast dev server and build; component model suits the card grid, filtering, calendar, and live entry field; deploys cleanly to Vercel | Build tooling and a JS bundle vs. plain HTML |
| Hosting | Vercel (static SPA + serverless functions) | Zero-config React deploys, free tier, HTTPS out of the box; serverless functions cover the small amount of server work needed | App is internet-hosted, so it can't touch a local folder directly — hence Google Drive for storage |
| Storage | User's Google Drive via Drive API (`drive.file` scope) | Free cross-device sync and backup in an account the user already trusts; no app-owned database; data stays the user's | OAuth flow to set up; Drive API rate limits and network latency; dependence on Google availability |
| Auth | Google OAuth 2.0 (Google Identity Services, PKCE) | Required to access the user's Drive; the only reason sign-in exists | Users must have/accept a Google account and grant the scope |
| Server-side code | Minimal Vercel serverless function for OAuth token exchange + (optional) link-metadata fetch | Keeps the client secret off the client and lets link previews bypass browser CORS | One small function to maintain; not a full backend |
| Categorisation | Local keyword matching in the browser, no API | Free, private, deterministic, easy to tune per category; the confirm step covers its imperfection | Won't catch synonyms or intent the way an LLM would; relies on good keyword lists |
| File format | One JSON file per entry + attachments in the Drive folder, cached in IndexedDB | Limits any sync conflict to a single entry; local cache avoids hitting Drive on every read; easy to inspect and migrate | More files than a single database; needs a local index of Drive file ids |
| Deliverable scope (v1) | Text, image+caption, file, and link entries; card grid; filter/sort; edit/delete; calendar + to-do; sidebar management; two presets | Covers the full core loop you described | Voice/audio entries deferred to a later version |

**Consequences.** What gets easier: capturing and retrieving project material in one place; reaching it from any device via Drive; adapting the tool to any project via custom categories; trusting the data because it stays in your own Drive. What gets harder: every read/write crosses the network, so the app needs a local cache and graceful offline/error handling; you must register a Google Cloud OAuth client and configure consent; categorisation quality is only as good as the keyword lists, so settings need a genuinely good keyword-editing experience. What to revisit later: an optional AI categorisation mode, voice/audio entries, full-text search across entries, and export to PDF/Word for submission.

## 9. Suggested build order

A pragmatic sequence that keeps a working app at every step:

1. Project scaffold — `npm create vite@latest` (React), Vercel project linked, SPA shell and routing.
2. Google auth + Drive plumbing — register a Google Cloud OAuth client, wire Google Identity Services (PKCE), the serverless token-exchange function, and a Drive service that creates the `ProjectLogbook` folder and reads/writes `config.json`. Add the IndexedDB cache layer.
3. Entry capture for text only — written as one JSON file per entry in Drive (cached locally); render the card grid.
4. Categories + keyword matching + the confirm step; sidebar category management.
5. Image, file, and link entry types — attachments uploaded to the Drive folder; link-metadata fetch via the serverless function.
6. Filter and sort controls; edit and delete.
7. Calendar and to-do list on the dashboard.
8. Presets — blank preset and the UTS design-log preset, with sub-headings and a citation field.
9. Polish pass — visual design, empty/loading/offline states, the "Inbox" fallback for unmatched entries, keyboard shortcuts.

## 10. Open questions

- Should sub-headings be a first-class feature for all presets, or only for the UTS preset?
- For links, is fetching a title/thumbnail worth the serverless-function complexity in v1, or is a plain saved URL enough to start?
- Will the app stay unverified (fine for personal use, but Google shows an "unverified app" warning) or go through Google's OAuth verification? `drive.file` scope keeps verification lighter than full Drive access.
- Should the app cache enough in IndexedDB to be read-only usable offline, or require a live connection?
- Is a built-in export to PDF/Word needed for the studio submission, or will the Drive folder be assembled into the final document separately?
