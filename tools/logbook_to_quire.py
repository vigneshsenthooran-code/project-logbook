#!/usr/bin/env python3
"""
logbook_to_quire.py  —  Arch Logbook  ->  Project Logbook / Quire app importer.

Walks the entry .md files of an Arch Logbook folder tree and emits a Quire
ProjectBundle (version: 1) JSON file. Import it in the app via
    Projects -> "Import project" -> pick the file.

Pure standard library. No pip installs. Does NOT rely on _index/master-log.csv;
it reads the entry .md files directly, so it works even if the index is stale.

Usage:
    python3 logbook_to_quire.py "<logbook_root>" [-o out.json] [-n "Project name"]

<logbook_root> is the "Arch Logbook <Semester>/" folder (the one that contains
00_Inbox, 01_Personal, _index, _dashboard, ...).
"""

from __future__ import annotations

import argparse
import base64
import datetime as _dt
import json
import mimetypes
import os
import re
import sys
import uuid
from pathlib import Path


# ---------------------------------------------------------------------------
# Category mapping  (logbook folder  ->  app `uts` preset category id)
#
# These ids MUST match src/presets/uts.ts in the app. Sub-heading ids from the
# preset are used for `subHeadingId` when we can infer them; otherwise the entry
# just carries the top-level categoryId.
# ---------------------------------------------------------------------------

# Top-level design-log folders, keyed by their numeric prefix.
FOLDER_PREFIX_TO_CAT = {
    "00": "inbox",
    "02": "return-brief",
    "03": "country",
    "04": "context",
    "05": "ncc",
    "06": "carbon",
    "07": "sustainability",
    "08": "planning",
    "09": "structure",
    "10": "process",
    "11": "references",
    "12": "ipd-notes",
}

# Personal sub-folders under 01_Personal/.
PERSONAL_SUBFOLDER_TO_CAT = {
    "feedback": "feedback",
    "ideas": "ideas",          # Design / Model / General all collapse to Ideas
    "readings": "references",  # readings live under the Reference list heading
}

# Valid app category ids (top-level + sub-headings) from the uts preset, so we
# can accept a sub-heading id that a frontmatter `subcategory:` happens to name.
VALID_SUBHEADING_IDS = {
    "rb-typology", "rb-areas", "rb-program",
    "cwc-positioning", "cwc-hydrology", "cwc-geology", "cwc-songlines",
    "cwc-astronomy", "cwc-materials", "cwc-ecologies", "cwc-seasonality",
    "cwc-timeline",
    "ctx-colonial", "ctx-sun", "ctx-views", "ctx-landscape",
    "ncc-class", "ncc-worksheets", "ncc-codes",
    "wlc-matrix", "wlc-embodied", "wlc-transport", "wlc-calcs",
    "sus-considerations", "sus-resilience", "sus-systems", "sus-bio",
    "pi-controls", "pi-heritage", "pi-instruments", "pi-da",
    "str-engineer", "str-axo", "str-lifecycle",
    "pf-sketches", "pf-precedent", "pf-options",
}

# The full uts preset category set, mirrored from src/presets/uts.ts, so the
# imported project renders with the correct headings even before the user picks
# a preset. Inbox is appended automatically (matches categoriesForPreset()).
UTS_CATEGORIES = [
    {"id": "feedback", "name": "Feedback", "color": "var(--cat-1)", "order": 0, "keywords": ["feedback", "tutor", "reviewer", "comment", "crit", "review", "suggested", "said"]},
    {"id": "ideas", "name": "Ideas", "color": "var(--cat-3)", "order": 1, "keywords": ["idea", "sketch", "concept", "direction", "what if", "thought", "maybe"]},
    {"id": "return-brief", "name": "Return brief", "color": "var(--cat-4)", "order": 2, "keywords": ["brief", "typology", "program", "area", "gfa", "pervious", "impervious", "schedule"]},
    {"id": "rb-typology", "name": "Typology + program", "color": "var(--cat-4)", "order": 3, "keywords": [], "parentId": "return-brief"},
    {"id": "rb-areas", "name": "Area calculations", "color": "var(--cat-4)", "order": 4, "keywords": [], "parentId": "return-brief"},
    {"id": "rb-program", "name": "Semester program", "color": "var(--cat-4)", "order": 5, "keywords": [], "parentId": "return-brief"},
    {"id": "country", "name": "Connecting with Country", "color": "var(--cat-5)", "order": 6, "keywords": ["country", "indigenous", "icip", "hydrology", "geology", "songline", "astronomy", "ecology", "habitat", "seasonality", "ethics"]},
    {"id": "cwc-positioning", "name": "Positioning, ethics + ICIP", "color": "var(--cat-5)", "order": 7, "keywords": ["ethics", "icip"], "parentId": "country"},
    {"id": "cwc-hydrology", "name": "Hydrology", "color": "var(--cat-5)", "order": 8, "keywords": ["hydrology", "water"], "parentId": "country"},
    {"id": "cwc-geology", "name": "Geology", "color": "var(--cat-5)", "order": 9, "keywords": ["geology", "soil", "rock"], "parentId": "country"},
    {"id": "cwc-songlines", "name": "Songlines", "color": "var(--cat-5)", "order": 10, "keywords": ["songline", "dreaming"], "parentId": "country"},
    {"id": "cwc-astronomy", "name": "Astronomy", "color": "var(--cat-5)", "order": 11, "keywords": ["astronomy", "stars", "sky"], "parentId": "country"},
    {"id": "cwc-materials", "name": "Materials", "color": "var(--cat-5)", "order": 12, "keywords": ["material"], "parentId": "country"},
    {"id": "cwc-ecologies", "name": "Ecologies + habitats", "color": "var(--cat-5)", "order": 13, "keywords": ["ecology", "habitat"], "parentId": "country"},
    {"id": "cwc-seasonality", "name": "Seasonality", "color": "var(--cat-5)", "order": 14, "keywords": ["seasonality", "season"], "parentId": "country"},
    {"id": "cwc-timeline", "name": "Timeline of connection", "color": "var(--cat-5)", "order": 15, "keywords": ["timeline"], "parentId": "country"},
    {"id": "context", "name": "Contextual analysis", "color": "var(--cat-6)", "order": 16, "keywords": ["context", "orientation", "sun path", "overshadowing", "views", "sight line", "vegetation", "transport", "colonial"]},
    {"id": "ctx-colonial", "name": "Existing colonial conditions", "color": "var(--cat-6)", "order": 17, "keywords": [], "parentId": "context"},
    {"id": "ctx-sun", "name": "Orientation, sun path + overshadowing", "color": "var(--cat-6)", "order": 18, "keywords": ["sun", "shadow"], "parentId": "context"},
    {"id": "ctx-views", "name": "Views + sight lines", "color": "var(--cat-6)", "order": 19, "keywords": ["view", "sight line"], "parentId": "context"},
    {"id": "ctx-landscape", "name": "Landscape systems", "color": "var(--cat-6)", "order": 20, "keywords": ["landscape", "soil", "land use"], "parentId": "context"},
    {"id": "ncc", "name": "NCC", "color": "var(--cat-7)", "order": 21, "keywords": ["ncc", "classification", "code", "worksheet", "ipd", "compliance", "bca"]},
    {"id": "ncc-class", "name": "Building classification", "color": "var(--cat-7)", "order": 22, "keywords": [], "parentId": "ncc"},
    {"id": "ncc-worksheets", "name": "NCC worksheets", "color": "var(--cat-7)", "order": 23, "keywords": [], "parentId": "ncc"},
    {"id": "ncc-codes", "name": "Codes applied", "color": "var(--cat-7)", "order": 24, "keywords": [], "parentId": "ncc"},
    {"id": "carbon", "name": "Whole life carbon", "color": "var(--cat-8)", "order": 25, "keywords": ["carbon", "embodied", "energy", "emissions", "epic", "half-carbon", "materials matrix", "lca"]},
    {"id": "wlc-matrix", "name": "Materials matrix", "color": "var(--cat-8)", "order": 26, "keywords": [], "parentId": "carbon"},
    {"id": "wlc-embodied", "name": "Embodied energy/water", "color": "var(--cat-8)", "order": 27, "keywords": [], "parentId": "carbon"},
    {"id": "wlc-transport", "name": "Transport emissions", "color": "var(--cat-8)", "order": 28, "keywords": [], "parentId": "carbon"},
    {"id": "wlc-calcs", "name": "Carbon calculations", "color": "var(--cat-8)", "order": 29, "keywords": [], "parentId": "carbon"},
    {"id": "sustainability", "name": "Sustainability", "color": "var(--cat-4)", "order": 30, "keywords": ["sustainability", "resilience", "passive", "active", "biodiversity", "water", "energy", "lighting", "acoustics", "social", "economic"]},
    {"id": "sus-considerations", "name": "Social, economic + Country", "color": "var(--cat-4)", "order": 31, "keywords": [], "parentId": "sustainability"},
    {"id": "sus-resilience", "name": "Resilience", "color": "var(--cat-4)", "order": 32, "keywords": [], "parentId": "sustainability"},
    {"id": "sus-systems", "name": "Active + passive systems", "color": "var(--cat-4)", "order": 33, "keywords": [], "parentId": "sustainability"},
    {"id": "sus-bio", "name": "Biodiversity, water, energy, light + acoustics", "color": "var(--cat-4)", "order": 34, "keywords": [], "parentId": "sustainability"},
    {"id": "planning", "name": "Planning instruments", "color": "var(--cat-5)", "order": 35, "keywords": ["planning", "fsr", "setback", "envelope", "zone", "heritage", "lep", "dcp", "da", "standard"]},
    {"id": "pi-controls", "name": "FSR, setbacks, envelope, zone", "color": "var(--cat-5)", "order": 36, "keywords": [], "parentId": "planning"},
    {"id": "pi-heritage", "name": "Heritage items", "color": "var(--cat-5)", "order": 37, "keywords": [], "parentId": "planning"},
    {"id": "pi-instruments", "name": "LEPs / DCPs / codes", "color": "var(--cat-5)", "order": 38, "keywords": [], "parentId": "planning"},
    {"id": "pi-da", "name": "DA pathway", "color": "var(--cat-5)", "order": 39, "keywords": [], "parentId": "planning"},
    {"id": "structure", "name": "Structural logic systems", "color": "var(--cat-6)", "order": 40, "keywords": ["structure", "structural", "engineer", "axo", "span", "load", "beam", "column"]},
    {"id": "str-engineer", "name": "Engineer consultation mark-ups", "color": "var(--cat-6)", "order": 41, "keywords": [], "parentId": "structure"},
    {"id": "str-axo", "name": "Exploded axo", "color": "var(--cat-6)", "order": 42, "keywords": [], "parentId": "structure"},
    {"id": "str-lifecycle", "name": "Material life-cycle in selection", "color": "var(--cat-6)", "order": 43, "keywords": [], "parentId": "structure"},
    {"id": "process", "name": "Process, form-making + precedent", "color": "var(--cat-3)", "order": 44, "keywords": ["process", "form", "precedent", "sketch", "mark-up", "iteration", "option", "site planning", "massing"]},
    {"id": "pf-sketches", "name": "Sketches + mark-ups", "color": "var(--cat-3)", "order": 45, "keywords": [], "parentId": "process"},
    {"id": "pf-precedent", "name": "Precedent analysis", "color": "var(--cat-3)", "order": 46, "keywords": [], "parentId": "process"},
    {"id": "pf-options", "name": "Site-planning + design options", "color": "var(--cat-3)", "order": 47, "keywords": [], "parentId": "process"},
    {"id": "references", "name": "Reference list", "color": "var(--cat-7)", "order": 48, "keywords": ["reference", "apa", "citation", "cite", "source", "bibliography", "quote"]},
    {"id": "ipd-notes", "name": "IPD / lecture notes", "color": "var(--cat-8)", "order": 49, "keywords": ["ipd", "lecture", "notes", "seminar", "addendum", "session"]},
]

INBOX_CATEGORY = {"id": "inbox", "name": "Inbox", "color": "var(--color-muted)", "order": 999, "keywords": []}

# Folders that are bookkeeping, not entry material.
SKIP_DIRS = {"_index", "_dashboard", "_exports"}

# Extensions treated as image attachments vs generic file attachments.
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tif", ".tiff", ".svg", ".heic"}
DOC_EXTS = {".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".txt", ".rtf", ".odt"}


def new_id() -> str:
    """Short unique id. The app remaps every id on import, so these only need to
    be internally consistent within the bundle."""
    return uuid.uuid4().hex[:12]


# ---------------------------------------------------------------------------
# Frontmatter parsing (tiny YAML-ish subset — no external deps)
# ---------------------------------------------------------------------------

def parse_entry(md_path: Path):
    """Return (frontmatter: dict, body: str) for an entry .md file."""
    raw = md_path.read_text(encoding="utf-8", errors="replace")
    fm = {}
    body = raw
    if raw.startswith("---"):
        end = raw.find("\n---", 3)
        if end != -1:
            block = raw[3:end].strip("\n")
            body = raw[end + 4:].lstrip("\n")
            fm = _parse_frontmatter(block)
    return fm, body.strip()


def _parse_frontmatter(block: str) -> dict:
    fm = {}
    for line in block.splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        m = re.match(r"^([A-Za-z0-9_]+)\s*:\s*(.*)$", line)
        if not m:
            continue
        key, val = m.group(1), m.group(2).strip()
        fm[key] = _coerce(val)
    return fm


def _coerce(val: str):
    if val == "":
        return ""
    # inline list  [a, b, c]
    if val.startswith("[") and val.endswith("]"):
        inner = val[1:-1].strip()
        if not inner:
            return []
        return [x.strip().strip("'\"") for x in inner.split(",") if x.strip()]
    return val.strip().strip("'\"")


# ---------------------------------------------------------------------------
# Category resolution
# ---------------------------------------------------------------------------

def resolve_category(rel_parts, fm):
    """Given the entry's path parts (relative to the logbook root) and its
    frontmatter, return (categoryId, subHeadingId|None)."""
    top = rel_parts[0] if rel_parts else ""
    sub_id = None

    # Personal tree
    if top.lower().startswith("01_personal") or top.lower() == "01_personal":
        if len(rel_parts) >= 2:
            second = rel_parts[1].lower()
            cat = PERSONAL_SUBFOLDER_TO_CAT.get(second, "inbox")
        else:
            cat = "inbox"
    else:
        prefix = top[:2]
        cat = FOLDER_PREFIX_TO_CAT.get(prefix, "inbox")

    # Let an explicit subcategory frontmatter override with a real sub-heading id.
    fm_sub = (fm.get("subcategory") or "").strip()
    if fm_sub in VALID_SUBHEADING_IDS:
        sub_id = fm_sub

    return cat, sub_id


def entry_type(fm, sidecar_target: Path | None):
    """text | image | file | link, inferred from a sidecar target or source."""
    if sidecar_target is not None:
        ext = sidecar_target.suffix.lower()
        if ext in IMAGE_EXTS:
            return "image"
        return "file"
    src = (fm.get("source") or "").strip()
    if src.lower().startswith("http"):
        return "link"
    return "text"


# ---------------------------------------------------------------------------
# Attachment encoding
# ---------------------------------------------------------------------------

def encode_attachment(path: Path, entry_id: str):
    mime, _ = mimetypes.guess_type(str(path))
    if not mime:
        mime = "application/octet-stream"
    data = path.read_bytes()
    b64 = base64.b64encode(data).decode("ascii")
    data_url = f"data:{mime};base64,{b64}"
    return {
        "id": new_id(),
        "entryId": entry_id,
        "name": path.name,
        "mime": mime,
        "dataUrl": data_url,
    }


# ---------------------------------------------------------------------------
# Main walk
# ---------------------------------------------------------------------------

def find_sidecar_target(md_path: Path) -> Path | None:
    """If this .md is a sidecar for an image/doc (same basename, different ext in
    the same folder), return that original file. Otherwise None."""
    stem = md_path.stem
    for sibling in md_path.parent.iterdir():
        if sibling == md_path or not sibling.is_file():
            continue
        if sibling.stem == stem:
            ext = sibling.suffix.lower()
            if ext in IMAGE_EXTS or ext in DOC_EXTS:
                return sibling
    return None


def iso_from_date(datestr: str) -> str:
    datestr = (datestr or "").strip()
    m = re.match(r"(\d{4})-(\d{2})-(\d{2})", datestr)
    if m:
        return f"{m.group(0)}T00:00:00.000Z"
    return _dt.datetime.now(_dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")


def read_project_info(root: Path) -> dict:
    info_path = root / "_index" / "project-info.md"
    if not info_path.exists():
        return {}
    fm, _ = parse_entry(info_path)
    return fm


def build_bundle(root: Path, project_name: str | None):
    info = read_project_info(root)

    entries = []
    attachments = []

    for md_path in sorted(root.rglob("*.md")):
        rel = md_path.relative_to(root)
        rel_parts = rel.parts
        top = rel_parts[0] if rel_parts else ""
        if top in SKIP_DIRS or top.startswith("_"):
            continue

        fm, body = parse_entry(md_path)
        sidecar_target = find_sidecar_target(md_path)
        cat, sub_id = resolve_category(rel_parts, fm)
        etype = entry_type(fm, sidecar_target)

        eid = new_id()
        created = iso_from_date(fm.get("date", ""))

        entry = {
            "id": eid,
            "projectId": "PROJECT",  # placeholder; app assigns real id on import
            "type": etype,
            "createdAt": created,
            "updatedAt": created,
            "body": body,
            "categoryId": cat,
            "attachmentIds": [],
        }
        if sub_id:
            entry["subHeadingId"] = sub_id

        credit = (fm.get("credit") or "").strip()
        if credit:
            entry["citation"] = credit

        src = (fm.get("source") or "").strip()
        if etype == "link" and src.lower().startswith("http"):
            domain = re.sub(r"^https?://(www\.)?", "", src).split("/")[0]
            link = {"url": src, "domain": domain}
            title = (fm.get("title") or "").strip()
            if title:
                link["title"] = title
            entry["link"] = link

        # Attach the sidecar original, if any.
        if sidecar_target is not None:
            att = encode_attachment(sidecar_target, eid)
            attachments.append(att)
            entry["attachmentIds"].append(att["id"])

        entries.append(entry)

    # Project name / start date
    name = project_name
    if not name:
        who = (info.get("name") or "").strip()
        sem = (info.get("semester") or "").strip()
        if who and sem:
            name = f"{who} — {sem}"
        elif sem:
            name = f"Arch Logbook {sem}"
        else:
            name = root.name

    start_date = None
    created_raw = (info.get("created") or "").strip()
    if re.match(r"\d{4}-\d{2}-\d{2}", created_raw):
        start_date = created_raw[:10]

    now_iso = _dt.datetime.now(_dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    project = {
        "id": "PROJECT",
        "name": name,
        "order": 0,
        "createdAt": now_iso,
    }
    desc = (info.get("studio") or "").strip()
    if desc:
        project["description"] = desc
    if start_date:
        project["startDate"] = start_date

    config = {
        "activePreset": "uts",
        "categories": [dict(c) for c in UTS_CATEGORIES] + [dict(INBOX_CATEGORY)],
    }

    bundle = {
        "version": 1,
        "exportedAt": now_iso,
        "project": project,
        "config": config,
        "entries": entries,
        "todos": [],
        "events": [],
        "attachments": attachments,
    }
    return bundle


def main(argv=None):
    ap = argparse.ArgumentParser(description="Convert an Arch Logbook folder to a Quire ProjectBundle JSON.")
    ap.add_argument("root", help="Path to the 'Arch Logbook <Semester>/' folder")
    ap.add_argument("-o", "--out", help="Output JSON path (default: <root>/_exports/quire-import.json)")
    ap.add_argument("-n", "--name", help="Override the project name")
    args = ap.parse_args(argv)

    root = Path(args.root).expanduser().resolve()
    if not root.is_dir():
        print(f"error: not a folder: {root}", file=sys.stderr)
        return 2

    out = Path(args.out).expanduser().resolve() if args.out else (root / "_exports" / "quire-import.json")
    out.parent.mkdir(parents=True, exist_ok=True)

    bundle = build_bundle(root, args.name)
    out.write_text(json.dumps(bundle, ensure_ascii=False, indent=2), encoding="utf-8")

    n_entries = len(bundle["entries"])
    n_att = len(bundle["attachments"])
    print(f"OK  {n_entries} entries, {n_att} attachments -> {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
