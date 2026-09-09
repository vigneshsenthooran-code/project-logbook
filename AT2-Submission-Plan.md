# AT2 Submission Plan — Skill + App Video, Export, Checklist

## 1. Video script (target 2:45, hard cap 3:00)

**00:00–00:10 — Cold open**
"This is Project Logbook — a Claude skill that files studio material as it arrives, and a web app that turns it into a submission-ready design log." Show both on screen briefly (Cowork project folder, then the deployed app).

**00:10–01:10 — Skill (60s)**

*What*
- `/arch-logbook`: a Cowork skill that classifies and files whatever you give it — typed notes, tutor feedback, images, PDFs, links — into the 11 official UTS design-log headings or your personal categories.

*Why* (say as dot points, don't over-explain)
- Filing by hand across a 14-week studio doesn't happen — you either lose material or do it in one exhausting session at the end.
- Wanted zero-friction capture that still lands in the exact structure the submission is marked against.

*How* (live demo, in the Cowork project folder that holds your actual logbook — not the app repo)
1. Drop a piece of tutor feedback or a precedent image into chat, nothing else typed.
2. Show it auto-classify — category, generated ID, frontmatter, entry file written.
3. Show `_index/master-log.csv`/`.md` gain the new row.
4. Open `_dashboard/index.html`, show the new card land in the grid live.
5. Say "export to app" — show `_exports/quire-import.json` appear. One line: "that's the file that feeds the app."

**01:10–03:00 — App (110s)**

*What*
- Project Logbook (repo name `quire`): Vite + React, local-first (IndexedDB, no account, no server), deployed on Vercel. Ships a Blank preset and the UTS Architecture preset that mirrors the design-log headings.

*Why* (dot points)
- Wanted one browsable, filterable record instead of scattered notes/photos/bookmarks.
- Wanted it reusable beyond architecture — categories, keywords, and headings are fully editable, so the same tool works for any sustained project.

*How* (live, on the deployed link)
1. Land on **Projects** → click **"↑ Import project"** → pick the `quire-import.json` you just exported → new project appears, already filed under the UTS headings. (This is the live version of "prefilled data" — see note below on also using the Seed demo button.)
2. Open the project → **Dashboard**: entry composer front and centre (text / image+caption / file / link), calendar + to-do panel beside it.
3. Submit one entry live — show the keyword match suggest a category, confirm, watch the card land in the grid.
4. Use the **filter/sort bar** — filter by category, search, sort newest vs. category order.
5. Open **Settings** — category manager (add/reorder/recolour, edit keyword lists), preset switcher (Blank / UTS / others).
6. Close on Export/Import in the sidebar — mention data stays portable, no lock-in.

**Close (last 5s):** GitHub + live app link on screen.

Trim ruthlessly if you're running long — cut step 5 (Settings) first, it's the least essential to show live.

---

## 2. Exporting the skill + making entries readable by your teacher

Do this in the **Cowork session connected to your actual `Arch Logbook <Semester>/` folder** — that's a different project/folder than this app repo, and it's the one with your real entries.

**Step 1 — Export your logged entries to the app format**
Say `export to app` (or run the script directly):
```bash
python3 "<path to AT2 - Application>/tools/logbook_to_quire.py" "<path to Arch Logbook <Semester>>" \
  -o "<path to Arch Logbook <Semester>>/_exports/quire-import.json"
```
This produces one JSON file (a Quire `ProjectBundle`) with every entry, to-do, event, and attachment reference. It reads the `.md` files directly, so it works even if the index is stale.

**Step 2 — Sanity-check it**
Open `quire-import.json` and confirm the entry count roughly matches the row count in `_index/master-log.csv`.

**Step 3 — Test the real import path before you record**
Open the deployed app (or `npm run dev`) → **Projects** → **"↑ Import project"** → select `quire-import.json` → confirm a project appears with entries filed under the correct UTS headings. Do this once now so you're not discovering a bug on camera.

**Step 4 — Package what your teacher needs to see, without touching the app**
`_dashboard/index.html` is fully self-contained — all entry data is embedded as a JS array, so it opens directly in any browser with no server and no app install. That's your safety net: even if your teacher never touches the app, they can browse, filter, and search every entry you've logged just by opening one HTML file.

Build one submission zip:
```
arch-logbook-submission.zip
├── SKILL.md                     ← copy from the skill folder
├── references/                  ← categories.md, dashboard.md, folder-structure.md
└── sample-logbook/
    ├── _dashboard/index.html    ← your real, current dashboard — opens standalone
    ├── _index/                  ← master-log.md/.csv (optional but nice — shows the raw index)
    └── (category folders)       ← include these only if you want the dashboard's
                                     "Open file" links to actually resolve to entry .md files
```
If you skip the category folders, the dashboard still fully works — cards already show title, date, week, phase, category, tags, and a snippet inline; only the "Open file" deep-link would 404.

Optionally also drop `quire-import.json` in the zip root, so your teacher can import it into the live app themselves if they want to poke around there too.

**Step 5 — Verify cold**
Unzip to a fresh folder, double-click `sample-logbook/_dashboard/index.html`, confirm it renders and the filters/search work with zero setup.

**Step 6 — Upload**
Name it `.zip` (safest — it has extra folders beyond the bare skill directory, so don't rely on `.skill` auto-install behaviour here). Upload to Canvas in the Skill submission slot.

---

## 3. Everything else before you submit

**Repo / deploy**
- Your local repo currently has uncommitted changes (`vite.config.ts` deleted-and-recreated, plus edits to `App.tsx`, `store.ts`, `seedDemo.ts`, `types.ts`, `EntryCard.tsx`, and others) and a stray `.git/index.lock`. Resolve/commit these on your machine before you redeploy or record — otherwise the live Vercel build and the GitHub link the teacher opens won't match what's in your video.
- Confirm the Vercel deployment is live and reflects your latest push.
- Confirm the GitHub repo (`vigneshsenthooran-code/project-logbook`) is set to **public** — a private repo is unreachable from the submitted link.

**Prefilled data rule ("don't make me set it up")**
- You already have this: the topbar's **"Seed demo"** button (`seedDemoData`) one-click populates a sample UTS project. Keep it — it's the fallback if a marker doesn't want to import a JSON file. Consider whether "Seed demo" or "Import project" is the better one to feature in the video; importing your real `quire-import.json` is more authentic and doubles as the skill→app demo.
- Test "Seed demo" from an incognito window (empty IndexedDB) to make sure it still behaves like a first-time user would see it.

**Presentation**
- You're doing video, not the PDF — good, that satisfies "not both." Keep it inside 2–3 minutes; going over loses marks per the announcement.
- Export as mp4 (or whatever Canvas accepts), and include both the app link and the GitHub link somewhere in the submission (description or on-screen in the video).

**Canva one-pager**
- Use the template at the link your teacher gave you — 1 page, no layout changes.
- One screenshot of the app + exactly 5 dot points.
- Link to the **app** only (not GitHub).

**Final pass**
- Do one full cold run-through as if you were the marker: fresh browser, unzip the skill submission, click through both — nothing should require you to explain a missing step out loud.
