---
name: first-time-intro-walkthrough-prompt
description: Implementation prompt for a full-screen, first-visit onboarding walkthrough overlaid above the Dashboard
---

# Prompt: First-time intro walkthrough overlay

Paste this into a Claude session working in this repo to implement the change.

## Goal

Build a full-screen onboarding overlay that appears above the Dashboard the very first time someone
opens Quire in a browser, walking them through the app's workflow in a sequence of steps (a
carousel, not a scrolling document). It should teach the full loop — capture, categorise, browse,
projects, planner, settings — in under a minute, then get out of the way and never interrupt again
unless the person deliberately reopens it.

This matters beyond a nice-to-have: a marker/teacher opening the deployed app cold (see
`AT2-Submission-Plan.md`) should immediately understand what they're looking at without narration.

## 1. Trigger & persistence

- On app load, after `ready` is true and routing lands on `/` (Dashboard), show the overlay if
  `localStorage.getItem('quire-intro-seen')` is not `'1'`.
- Do this once per browser, not per project — it's an app-level tour, not project-specific. Check in
  `App.tsx` (near the existing `ready`/`authChecked`/`minTimeElapsed` gating) or as a small effect in
  `AppShell.tsx` — pick whichever keeps `App.tsx`'s existing loading/auth flow easiest to read.
- Finishing the last step, or dismissing early (see §2), sets `localStorage.setItem('quire-intro-seen', '1')`
  and closes the overlay. Never show it again automatically after that.
- **Replay entry point:** add a "How it works" item to the Topbar's existing overflow menu
  (`Topbar.tsx`, the `topbar-menu-dropdown` that currently holds "Seed demo" / "Clear demo" —
  see lines ~185–210). Clicking it reopens the overlay from step 1 regardless of the localStorage
  flag, and finishing/dismissing it again just re-sets the flag (already `'1'`, so a no-op).
- Seeding demo data (`handleSeedDemo`) should NOT auto-trigger or auto-dismiss the overlay — the two
  are independent. If both a fresh browser and "Seed demo" are used together, the overlay still shows
  once per the localStorage rule.

## 2. Structure & navigation

Full-screen takeover, not a centered card — the overlay should feel like a deliberate "welcome"
moment, on-brand with the dark olive/chartreuse look already in `tokens.css`, not like a generic
modal dialog.

- `position: fixed; inset: 0`, rendered via `createPortal(..., document.body)` like
  `CategoryConfirmModal.tsx` does, so it sits outside the normal DOM flow.
- `z-index: 70` — above the existing `.scrim` modal layer (`z-index: 50`, `tokens.css` line ~431) and
  the composer's project dropdown (`z-index: 60`, `app.css` line ~1148), since this overlay should be
  able to appear over everything, including if a modal happened to be open.
- Background: full `var(--color-surface-soft)` (or a very slightly translucent version of it) rather
  than the existing `.scrim`'s dimmed-see-through treatment — this covers the app entirely rather than
  dimming it, so it reads as its own screen, not a dialog on top of the dashboard.
- Content is centered, one step visible at a time: a large icon, a short headline (`t-display` scale),
  1–2 sentences of body copy (`t-body` scale), then navigation controls.
- Navigation controls, bottom of the centered content:
  - Progress dots (one per step, current step filled with `--color-primary`, others
    `--color-hairline`) — clicking a dot jumps directly to that step.
  - "Back" (ghost button, hidden/disabled on step 1).
  - "Next" (primary button) on steps 1 through 5; becomes "Get started" (primary button) on the final
    step, which closes the overlay and sets the localStorage flag.
  - A "Skip" text-link/button top-right of the overlay, visible on every step, which closes the
    overlay immediately and sets the localStorage flag (skipping still counts as "seen").
- Keyboard: `ArrowRight`/`Enter` advances, `ArrowLeft` goes back, `Escape` skips (same effect as the
  Skip button). Trap focus within the overlay while it's open, same pattern as the existing modals.
- Transition between steps: a quick fade/slide (~180–220ms), consistent with the `220ms
  cubic-bezier(0.16, 1, 0.3, 1)` easing already used for `.modal-in`/`scrim-fade-in` in `app.css`.

## 3. Steps (content)

Six steps, matching the app's actual feature set — do not invent features that don't exist yet, and
do not describe the Google Drive storage model from the old product brief (the app is IndexedDB-local
today, with optional Supabase cloud sync in Settings). Suggested copy (tighten/rephrase as needed for
the app's actual voice, but keep the facts accurate to the current codebase):

1. **Welcome** — "Capture everything, instantly." The floating entry field (bottom-left, on every
   page) accepts a quick note, an image with a caption, a file, or a link. `⌘/Ctrl+Enter` submits
   without touching the mouse.
2. **Categorise & confirm** — "It files itself — you just confirm." On submit, Quire matches your
   text against each category's keywords and suggests the best fit. You always get a confirm step;
   no match means it lands in Inbox rather than a silent guess.
3. **Browse, filter, sort** — "Every entry, one filterable grid." Entries appear as cards with type,
   category, and date. Filter by category, search, and sort by newest or by category order. Edit or
   delete any entry at any time.
4. **Projects & folders** — "One logbook, many projects." Everything lives inside a project; switch
   between them from the dashboard, organise them into folders on the Projects page, and export or
   import a project as a single portable file to back it up or move it between devices.
5. **Calendar & planner** — "Plan alongside what you capture." A calendar and to-do list sit right on
   the dashboard next to the entry field, so the logbook doubles as a lightweight planner.
6. **Presets & settings** — "Shaped to fit the project." Switch between the general-purpose preset
   and the UTS Architecture Design Log preset (the eleven official design-log headings, with
   sub-headings and citation fields built in), or fully customise categories, keywords, colours, and
   order yourself in Settings.

## 4. Visual design

- Build a small set of flat, multi-tone SVG icons — one per step — in the same style as
  `DecorMark.tsx` (flat shapes, app palette via CSS custom properties like `var(--color-primary)`,
  `var(--color-card-strong)`, not `currentColor` gradients or photographic imagery). Simple
  geometric/iconographic representations are enough (e.g. a stacked-card icon for step 3, a
  grid-of-folders icon for step 4) — no attempt at literal UI screenshots.
- Typography: headline in the display serif (`Fraunces`, via the existing `t-display-*` classes),
  body copy in `Archivo` (`t-body-*`), matching every other view in the app. Don't introduce new type
  scales.
- Respect existing spacing/radius tokens (`--s-*`, `--r-*`) rather than hardcoding pixel values.
- Should look and feel like a natural extension of the app, not a third-party tour library dropped in
  — no external onboarding package; build it with the existing component/CSS conventions.

## 5. Files

- New component: `src/components/IntroWalkthrough.tsx` — owns step state, keyboard handling, portal
  rendering, and the localStorage read/write. Accepts an optional `forceOpen`/`onClose` pair (or an
  internal store flag) so the Topbar's "How it works" item can trigger it imperatively rather than the
  component only reacting to its own mount.
- New icon components (or a single file exporting several small SVGs), e.g.
  `src/components/IntroIcons.tsx`, following `DecorMark.tsx`'s conventions.
- Mount `IntroWalkthrough` once at the `AppShell` level (alongside `EntryComposer`, per
  `AppShell.tsx`) so it can portal correctly and isn't tied to the Dashboard route unmounting.
- Add the "How it works" trigger inside `Topbar.tsx`'s existing menu dropdown (desktop) — check
  whether it also belongs in the mobile menu (`topbar-mobile-menu`) for consistency; if so, add it
  there too using the same trigger function.
- New CSS rules in `src/styles/app.css` (or a new `intro-walkthrough.css` imported alongside it, if
  that keeps `app.css` more manageable) — reuse existing class-naming conventions (`intro-*` prefix).

## 6. Non-goals / keep as-is

- Don't touch `CategoryConfirmModal`, `EntryComposer`, `CalendarWidget`, or any other existing
  component's behaviour — this is purely additive.
- Don't gate the overlay behind auth/storage mode (`AuthScreen`) — it only concerns itself with
  whether the *Dashboard* has been seen, not sign-in state.
- Don't persist the "seen" flag anywhere but `localStorage` (no store/IndexedDB/Supabase field) — it's
  a per-browser UI preference, not user data.
- Don't build a generic/reusable "tour engine" for arbitrary future overlays — a purpose-built
  component for these six fixed steps is fine; avoid over-engineering.

## Acceptance checklist

- [ ] Fresh browser (empty `localStorage`) landing on `/` shows the overlay automatically, full-screen,
      above everything else.
- [ ] All six steps present, in order, with accurate copy matching the app's real current features.
- [ ] Back/Next/dot navigation and keyboard (arrows, Enter, Escape) all work; Back is disabled/hidden
      on step 1; final step's primary button reads "Get started".
- [ ] Skip (and finishing normally) both set `quire-intro-seen` in `localStorage` and the overlay never
      reappears on reload.
- [ ] "How it works" in the Topbar menu (desktop, and mobile menu if applicable) reopens the overlay
      from step 1 at any time, regardless of the localStorage flag.
- [ ] Visual language (type scale, colour tokens, spacing, icon style, transition easing) matches the
      rest of the app — no external UI library, no hardcoded colours/px values that bypass the tokens.
- [ ] Overlay renders above the existing modal (`.scrim`, z-index 50) and composer project dropdown
      (z-index 60) — verify by opening "How it works" while a modal happens to be open.
- [ ] `npm run build` (type-check + build) passes with no new TypeScript errors.
