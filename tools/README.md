# tools/

## logbook_to_quire.py

Converts an **Arch Logbook** folder tree into a **Quire ProjectBundle** (`version: 1`)
JSON file that the app imports via **Projects → "↑ Import project"**.

Pure standard library (no pip installs). Reads the entry `.md` files directly, so
it works even if `_index/master-log.csv` is out of date.

```bash
python3 tools/logbook_to_quire.py "<logbook_root>" -o "<logbook_root>/_exports/quire-import.json"
# optional: -n "Custom project name"
```

`<logbook_root>` is the `Arch Logbook <Semester>/` folder (the one containing
`00_Inbox`, `01_Personal`, `_index`, …).

**What it emits:** `{ project, config, entries[], todos[], events[], attachments[] }`.
`config.activePreset` is `uts` and the full UTS category set is embedded, so the
imported project shows the correct headings immediately. Every id is remapped by
the app on import, so re-importing always makes a fresh project.

**Mapping:** logbook folders map to the `uts` preset category ids
(`00_Inbox`→`inbox`, `02_Return Brief`→`return-brief`, `03_…Country`→`country`,
`04_Contextual Analysis`→`context`, `05_NCC`→`ncc`, `06_…Carbon`→`carbon`,
`07_Sustainability`→`sustainability`, `08_…Instruments`→`planning`,
`09_…Structural`→`structure`, `10_Process…`→`process`, `11_Reference List`→`references`,
`12_IPD Notes`→`ipd-notes`; `01_Personal/Feedback`→`feedback`,
`01_Personal/Ideas/*`→`ideas`, `01_Personal/Readings`→`references`).
Entry type is inferred (image/pdf sidecar → image/file, `http` source → link, else text);
`credit:` becomes the app `citation`. A frontmatter `subcategory:` that names a real
sub-heading id (e.g. `ctx-sun`) is carried through as `subHeadingId`.

> If the app's category ids in `src/presets/uts.ts` ever change, update the
> `UTS_CATEGORIES` / mapping tables near the top of the script to match.
