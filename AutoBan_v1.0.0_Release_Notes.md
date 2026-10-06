# AutoBan v1.0.0 — Release Notes

| | |
|---|---|
| **Version** | 1.0.0 |
| **Release date** | 2026-10-05 |
| **Data schema** | 5 |
| **Build** | `AutoBan.html` (identical copy: `releases/AutoBan_v1.0.0.html`) |
| **Git tag** | `v1.0.0` |

## Summary

First formal release. AutoBan combines a weekly Kanban, a month planner and a structured issue tracker in a single offline HTML file, with data saved to a JSON file you control and evidence attached directly to each task.

## What's in 1.0

**Weekly board**
- Work package with up to three levels of nested tasks, typed like an outliner (click, Enter, Tab, Shift+Tab).
- Per-row M–F day keys; a task can span several days.
- Day columns, two per row or five across, with completion gauges.
- Whole-row drag and drop with above/below insertion.
- Check-off cascades to sub-tasks and rolls up to parents.
- Carry forward unfinished tasks; Paste list for bulk entry.

**Issue tracker**
- Issues numbered `I-001…`, each with Problem, Containment, Cause, Solution, Test and Release sections (notes plus nested actions).
- Six-segment stage bar; current stage computed automatically.
- Every issue and its actions appear in the package, so the package is the complete list.
- Drop any task onto an issue header to file it into the current stage.

**Month planner**
- Calendar for the whole month; week labels open the Week tab.
- All-items list on the left, grouped by week, plus all issues.
- Drag to schedule, move between dates, or unschedule.

**Attachments**
- Links (web, SharePoint, `\\server\share`, `C:\…`), pictures, videos, any file type.
- Ctrl+V pastes screenshots, links, and Excel/Word tables, which render as native tables.
- Drop files onto any row or the attachment panel.
- PDFs, pictures, video, text and tables open inside AutoBan; Office files open in their desktop app.

**Data**
- Autosave to `autoban-data.json` (≈ 0.6 s after each change) plus a browser mirror.
- Remembers the file and the attachments folder; one-click reconnect.
- Picks up changes synced from another machine when you return to the tab.
- Export copy (JSON), Import copy, Export readable (Markdown report, including attachments and tables).

**Look**
- Graphite and brass dark theme: brass for issue-related elements, steel blue for your actions.

## Installing

1. Extract the `AutoBan` folder into `Documents` so you have `Documents\AutoBan\AutoBan.html`.
2. Open `AutoBan.html` in Chrome or Edge and bookmark it.
3. In the banner, choose **Create new file…** and save `autoban-data.json` in `Documents\AutoBan\data\`.
4. Open any paperclip → **Choose folder…** → create and pick `Documents\AutoBan\data\attachments`.

## Upgrading from pre-release builds (v0.x)

- Replace the old HTML with `AutoBan.html`. If you open it from the **same browser**, it reconnects to your existing data file and folder automatically.
- If you open it from a new location or browser, use **Open existing file…** and pick your existing data file. Old formats are migrated on load.
- Data from the claude.ai hosted versions is not visible to the local file. Export it there (**Export data**) and use **Import copy** here.
- New backups and reports are named `autoban-backup-YYYY-MM-DD.json` and `autoban-report-YYYY-MM-DD.md`.

## Compatibility

| Browser | Support |
|---|---|
| Chrome / Edge 86+ | Full |
| Chrome / Edge 122+ | Full, with optional *Allow on every visit* |
| Firefox / Safari | Browser-only storage, Export/Import, embedded attachments ≤ 3 MB |

## Known issues

- One reconnect click per browser session unless *Allow on every visit* is enabled.
- Simultaneous editing on two machines: last writer wins.
- Office files open via the browser download hand-off; set *Always open files of this type* once per file type.
- No undo; use Export copy before large reorganisations.

## Verification

All scenarios in the design document §11 passed on the release build: migration, outline editing, issue mirroring, drag and drop across lists and dates, month view, file storage, attachment paste/open, and zero page errors.
