# AutoBan — Design Document

| | |
|---|---|
| **Document** | AutoBan Design Document |
| **Applies to** | AutoBan v1.0.0 (data schema 5) |
| **Document revision** | 1.0 |
| **Status** | Released |
| **Date** | 2026-10-05 |
| **Owner** | Le Yu |
| **Location** | `Documents/AutoBan/docs/AutoBan_Design_Document_v1.0.md` |

### Revision history

| Rev | Date | Author | Change |
|---|---|---|---|
| 1.0 | 2026-10-05 | Le Yu / Claude | Initial release with AutoBan v1.0.0 |

---

## 1. Purpose and scope

AutoBan is a personal work-management tool that combines three things engineers usually keep in separate places:

1. a **weekly Kanban** — the week's work package, broken into nested tasks and scheduled onto days;
2. a **month planner** — a calendar view of everything scheduled, with a complete item list beside it;
3. an **issue tracker** — structured problem records that move through Problem → Containment → Cause → Solution → Test → Release, with their actions living in the same task system.

Each item can carry evidence: links, pictures, videos, pasted tables and arbitrary files.

This document describes the requirements, architecture, data model, storage design, user interface and verification of version 1.0.0. It is the reference for maintaining the tool and for deciding whether a future change is a patch, a feature release or a breaking change (see §13).

**Out of scope for v1.0:** multi-user collaboration, server components, notifications/reminders, and integration with corporate systems (Jira, Outlook, SharePoint APIs).

## 2. Background and constraints

The tool was developed iteratively in response to concrete needs. Several of those needs shaped the architecture more than any feature did:

| Constraint | Consequence for the design |
|---|---|
| A Miro board cannot implement check-off logic, parent/child roll-up or scheduling behaviour. | Build a purpose-made application rather than a whiteboard template. |
| The company laptop cannot reach claude.ai artifacts or other hosted apps. | The tool must be a **single local HTML file** that runs from disk with **no network access**. |
| Data must be portable between machines (work laptop, other PCs). | Data lives in a **plain JSON file** the user chooses, typically inside a OneDrive-synced folder. |
| No installation rights can be assumed. | No build step, no runtime, no extensions. Chrome or Edge is the only dependency. |
| Engineering issues need evidence (screenshots, simulation videos, Excel tables, reports). | An attachment system that stores large binaries outside the JSON file. |

## 3. Requirements

### 3.1 Functional requirements

| ID | Requirement | Status in v1.0 |
|---|---|---|
| FR-01 | Hold a weekly work package of tasks. | Implemented |
| FR-02 | Tasks support parent/child nesting up to three levels. | Implemented |
| FR-03 | Typing works like an outliner: click a line to edit, Enter creates the next item, Tab indents, Shift+Tab outdents. | Implemented |
| FR-04 | Tasks can be scheduled to one **or several** days from a per-row M–F key strip. | Implemented |
| FR-05 | Tasks can be dragged between the package, day columns, issue sections and calendar dates. Whole rows are draggable. | Implemented |
| FR-06 | Items can be checked off; completion cascades to children and rolls up to parents. | Implemented |
| FR-07 | Mon–Fri fit on one screen; long text wraps; a two-per-row day layout is available. | Implemented |
| FR-08 | An issue list in parallel with the week, each issue having Problem, Containment, Cause, Solution, Test and Release sections. | Implemented |
| FR-09 | Issue actions support the same indentation as tasks. | Implemented |
| FR-10 | The package is the **complete list**: every issue appears automatically as a top-level item, with its actions nested under it. | Implemented |
| FR-11 | A Month tab shows a calendar of the whole month and a complete item list on the left. | Implemented |
| FR-12 | Each item can carry attachments: links, pictures, videos, pasted tables and arbitrary files. | Implemented |
| FR-13 | Pasted tables (Excel, Word, web) display natively as tables. | Implemented |
| FR-14 | Attachments open directly from the page where the browser can render them. | Implemented (see §8.4) |
| FR-15 | Data saves automatically to a local file that can be copied between machines. | Implemented |
| FR-16 | Data can be exported and imported (JSON) and exported as a readable report (Markdown). | Implemented |
| FR-17 | Unfinished tasks can be carried forward to the next week. | Implemented |

### 3.2 Non-functional requirements

| ID | Requirement | How it is met |
|---|---|---|
| NFR-01 | Runs offline from a local file. | Single HTML file; no external scripts, fonts or requests. |
| NFR-02 | No installation. | Plain HTML/CSS/JavaScript; opened by double-click or a `file:///` bookmark. |
| NFR-03 | The user owns the data. | Human-readable JSON in a user-chosen location; attachments as ordinary files. |
| NFR-04 | No data loss on crash or close. | Debounced autosave (≤ 0.6 s), browser-storage mirror, unload guard. |
| NFR-05 | Safe with multiple machines via file sync. | External-change detection and a conflict prompt (§6.4). |
| NFR-06 | Readable for long sessions. | Dark Graphite and brass theme; consistent semantic colours (§7.3). |
| NFR-07 | Maintainable without tooling. | One file, sectioned code, this document, Git history. |

## 4. Architecture

### 4.1 Overview

AutoBan is a single-page application contained entirely in `AutoBan.html`. There is no framework; the page renders from an in-memory state object into the DOM on every structural change.

```
                 ┌──────────────────────────── AutoBan.html ────────────────────────────┐
  user input ──► │  Event handlers ─► Model operations ─► save() ─► render()            │
                 │        │                 │               │           │               │
                 │   drag / edit /     outline helpers   markDirty   week view         │
                 │   paste / keys      issue model           │       month view        │
                 │                     attachments           │       issue cards       │
                 │                                           ▼       drawer / viewer   │
                 │                         ┌──── persistence layer ────┐                │
                 │                         │ localStorage mirror (250ms)│                │
                 │                         │ JSON data file   (600ms)  │                │
                 │                         │ attachments folder (on add)│               │
                 │                         └────────────────────────────┘               │
                 └──────────────────────────────────────────────────────────────────────┘
                                │ File System Access API          │ IndexedDB
                                ▼                                 ▼
                    Documents/AutoBan/data/autoban-data.json   remembered file + folder handles
                    Documents/AutoBan/data/attachments/…
```

### 4.2 Code modules (sections inside the script)

| Section | Responsibility |
|---|---|
| Utils | Date arithmetic (ISO week, Monday-start weeks), DOM helpers, ID generation. |
| Outline helpers | Operations on flat outline arrays: subtree, children, parent, indent, outdent, insert, remove, level repair, completion cascade. |
| Storage | Snapshot/adopt, migration, browser mirror, data-file write, IndexedDB handle store, attach/open/reconnect, external-change check, banner. |
| Issue model | Issue creation, stage computation, item lookup across all lists, date toggling, cross-list `moveItem`. |
| Drag plumbing | Drag payload encoding, drop zones, above/below insertion markers. |
| Editing | Click-to-edit state, caret placement, deferred re-render, keyboard handling. |
| Text outline | “Paste list” serialisation and parsing for bulk entry. |
| Render | Header, package, day rack, issue cards, shared `itemRow` and `issueHeaderRow` builders. |
| Attachments | Folder handling, file ingestion, image compression, table parsing, link normalisation, drawer, viewer. |
| Month view | Calendar grid, all-items list, week headers. |
| Export/import | JSON backup, Markdown report. |
| Events / boot | Global listeners, navigation, start-up sequence. |

### 4.3 Rendering model

Every structural change (add, move, indent, check, schedule) mutates state, calls `save()`, then `render()`. The render is a full rebuild of the active tab, which keeps the code simple and the views consistent. Two mechanisms make this compatible with in-place editing:

- **Edit state survives re-render.** The item being edited is identified by `view:itemId` (the same item can appear in the package, a day column and the issue panel at once). After each render the matching textarea is re-focused and the caret restored.
- **Deferred render on blur.** When a text field loses focus because the user pressed the mouse on another control, the re-render is queued until the pointer is released. Rebuilding the DOM between mousedown and click would otherwise swallow the click.

Typing does not re-render; it updates the model and mirrors the text live into every other view showing the same item.

## 5. Data model

### 5.1 File format (schema 5)

```json
{
  "app": "autoban",
  "appVersion": "1.0.0",
  "version": 5,
  "savedAt": "2026-10-05T19:42:10.512Z",
  "settings": {
    "showWeekend": false,
    "pairs": true,
    "hideReleased": false,
    "tab": "week",
    "monthScope": "month"
  },
  "issues": {
    "seq": 2,
    "list": [ /* Issue, newest first */ ]
  },
  "weeks": {
    "2026-10-05": { "tasks": [ /* Item, in outline order */ ] }
  }
}
```

`version` is the **data schema** number. It changes only when the file structure changes in a way older builds cannot read (§13).

### 5.2 Item

The same shape is used for package tasks and issue actions. Lists are **flat arrays in display order**; hierarchy is expressed by `lvl`.

| Field | Type | Meaning |
|---|---|---|
| `id` | string | Unique ID. Prefix `t` for tasks, `a` for actions (informational only). |
| `title` | string | Item text; may contain line breaks. |
| `done` | boolean | Completion state. |
| `dates` | string[] | Scheduled dates, ISO `YYYY-MM-DD`, sorted. Any number, any week. |
| `lvl` | 0–2 | Indent level within its list. |
| `att` | Attachment[] | Optional. See §5.4. |

**Outline invariants** (enforced by `fixLevels`): the first item has `lvl` 0; each item's `lvl` is at most one more than the previous item's; `lvl` never exceeds 2. A parent is the nearest preceding item with a lower level; an item's subtree is the run of following items with a higher level.

**Why flat arrays with levels** rather than parent pointers: moving, indenting and reordering become contiguous array splices; a subtree always moves as one block; and the structure maps one-to-one onto the on-screen order. Versions before 0.6 used parent pointers; they are migrated on load (§5.5).

### 5.3 Issue

| Field | Type | Meaning |
|---|---|---|
| `id` | string | Unique ID. |
| `num` | integer | Display number, shown as `I-001`. Never reused. |
| `title` | string | Issue title. |
| `open` | boolean | Expanded in the issue panel. |
| `pkgCollapsed` | boolean | Collapsed in the package and all-items list. |
| `sec` | object | Keys `problem`, `containment`, `cause`, `solution`, `test`, `release`; each `{ notes: string, actions: Item[] }`. |

**Stage logic.** A section is *done* when it has actions and all are checked, or when it has no actions but has notes. The issue's current stage is the first section that is not done; when all six are done the issue reads *Released*. Dropping an item onto an issue header files it into the current stage.

### 5.4 Attachment

| Field | Type | Applies to | Meaning |
|---|---|---|---|
| `id` | string | all | Unique ID. |
| `kind` | `link` \| `image` \| `video` \| `file` \| `table` | all | Attachment type. |
| `title` | string | all | Display name (original file name for files). |
| `added` | ISO datetime | all | Creation time. |
| `url` | string | link | Normalised URL (`https:`, `file:`). |
| `file` | string | image, video, file | File name inside the attachments folder. |
| `data` | data URL | image, file, video | Embedded content when no folder is linked. |
| `mime`, `size` | string, number | image, video, file | Original type and size. |
| `rows` | string[][] | table | Cell text; first row is the header. |

### 5.5 Migration on load

| Legacy form | Converted to |
|---|---|
| `parent` pointers (≤ v0.5) | Depth-first order with `lvl` = depth (capped at 2). |
| `day` / `days` weekday indices (≤ v0.6) | Absolute `dates` relative to that week's Monday. |
| `hours` | Dropped. |
| Actions without `lvl` or `dates` | `lvl` 0, `dates` []. |
| Week keys `tracker:week:YYYY-MM-DD` (early exports) | Plain `YYYY-MM-DD`. |

Migration is idempotent and runs on every load, import and file open.

## 6. Persistence design

### 6.1 Layers

| Layer | Content | When written | Purpose |
|---|---|---|---|
| In-memory state | Everything | Immediately | Working copy. |
| Browser mirror (`localStorage`, key `wp:cache`) | Full snapshot | 250 ms after the last change | Crash safety; works when no file is linked or the browser lacks file access. |
| Data file (`autoban-data.json`) | Full snapshot, pretty-printed | 600 ms after the last change; flushed on week change, tab hide and unload | The source of truth and the thing that syncs between machines. |
| Attachments folder | One file per attachment | When the attachment is added | Keeps large binaries out of the JSON. |
| IndexedDB (`wp-file`) | File and folder **handles** only | On link | Lets the page reconnect without a picker. |

Internal storage keys (`wp:cache`, `wp-file`) keep their pre-release names so existing installations reconnect without migration.

### 6.2 Start-up sequence

1. Load the browser mirror (or legacy keys) and render immediately.
2. If the File System Access API is unavailable, show the *browser-only* banner and stop.
3. Look up the remembered file handle. If permission is still granted, open the file; otherwise show **Reconnect** (browsers require one click per visit unless the user chose *Allow on every visit*).
4. Look up the remembered attachments folder the same way; the attachment panel offers **Reconnect** if needed.

### 6.3 Opening a file

- **Open existing file / Reconnect**: the file's content is adopted. At start-up, if the browser mirror is more than 3 s newer than the file (edits made while the file was unreachable), the user chooses which version to keep.
- **Create new file**: the current state is written to the new file.
- An empty file is initialised from the current state.

### 6.4 Multi-machine safety

On window focus and tab visibility, AutoBan compares the file's `lastModified` with the time of its own last write. If the file is newer (for example OneDrive delivered edits made on another PC) and there are no pending local edits and no field is being edited, the file is reloaded. This makes the expected workflow — edit on one machine, switch, edit on the other — safe. Simultaneous editing on two machines is not supported; the last writer wins.

### 6.5 Failure handling

| Failure | Behaviour |
|---|---|
| File write fails (permission revoked, file moved) | Handle is dropped, status warns, **Reconnect** banner appears; edits continue in the browser mirror. |
| Folder write fails | Attachment is skipped with a warning. |
| Corrupt or non-AutoBan JSON on open | Rejected with a message; current data untouched. |
| Browser closes with pending edits | Mirror is written synchronously; the browser's leave-page prompt is raised while a file write is pending. |

## 7. User interface design

### 7.1 Layout

**Top bar**: AutoBan brand and version · current week or month · Week/Month switch · save status · tallies · Prev / This week / Next.

**Week tab** — three columns:

| Package (330 px) | Days (flexible) | Issues (380 px) |
|---|---|---|
| Own tasks for the week, then every issue with its actions nested. Per-row day keys, paperclip, delete. | Mon–Fri (optionally Sat–Sun), two per row with Friday full width, or all five in a row. Each column shows a completion gauge. | Issue cards with stage bar and the six sections, each with notes and actions. |

Below 1320 px wide the issue panel moves under the board; below 900 px everything stacks.

**Month tab** — two columns: *All items* list (weeks overlapping the month, or all weeks; then issues) and the calendar grid with week labels that jump to the Week tab.

**Attachment drawer** slides in from the right; the **viewer** is a full-screen overlay.

### 7.2 Interaction model

**Editing.** Text is displayed as plain text; clicking it switches that row to an editor with the caret where the user clicked. Clicking elsewhere returns it to display. An item left empty is removed automatically.

| Key | Action |
|---|---|
| Enter | New item below at the same level (in a date view, scheduled on that date). |
| Shift+Enter | Line break inside the item. |
| Tab / Shift+Tab | Indent / outdent, with the subtree. |
| Backspace on an empty item | Delete it and move to the previous item. |
| ↑ at start / ↓ at end | Move to the previous / next item. |
| Esc | Stop editing; close the drawer or viewer. |
| Enter in an issue title (package) | New action in the issue's current stage. |
| Ctrl+Enter in Paste list | Apply. |
| Ctrl+V with the drawer open | Paste a table, picture or link as an attachment. |

**Drag and drop.** A whole row is the drag handle (except while it is being edited).

| Drop target | Effect |
|---|---|
| Upper / lower half of another row | Insert above / below that row at its level; sub-items move along. Works across package tasks, issue actions and other weeks. |
| Issue header row | File into that issue's current stage. |
| Issue section background | Append to that section (from the same section's day item: unschedule that date). |
| Week header (month list) | Move into that week's task list. |
| Day column or calendar date | Add that date. Date → date moves the date. |
| Package / issue panel / month list background, from a day or date | Remove that specific date. |
| Files from the desktop onto a row or the drawer | Attach them. |

### 7.3 Visual design (Graphite and brass)

Colour is semantic: **brass** means *issue-related*, **steel blue** means *your action / state*.

| Token | Value | Use |
|---|---|---|
| `--paper` | `#1B1F24` | Canvas |
| `--panel` | `#23282F` | Panels, day columns, calendar cells |
| `--card` / `--card-2` / `--card-3` | `#2A3038` / `#272D35` / `#252A31` | Rows by indent level |
| `--ink` / `--ink-2` / `--ink-3` | `#E6E9EC` / `#B4BCC5` / `#8A94A0` | Primary / secondary / muted text |
| `--vac` | `#7FA7C9` | Checked boxes, selected day keys, drop rings, primary buttons |
| `--brass` | `#C9A45C` | Issue numbers, section tags, action edges, current stage, today, brand |
| `--bar` | `#14171B` | Top bar |
| `--danger` | `#E07A6A` | Delete hover |

Depth comes from elevation (soft shadows) rather than outlines. Labels use sentence-case sans-serif (Segoe UI on Windows); monospace is reserved for dates, counts and identifiers. No web fonts are loaded.

## 8. Attachment subsystem

### 8.1 Storage policy

| Kind | Attachments folder linked | No folder linked |
|---|---|---|
| Link | Stored in JSON | Stored in JSON |
| Picture | Original copied to folder | Re-encoded to JPEG (≤ 1600 px, quality 0.85) and embedded |
| Video | Copied to folder | Embedded if ≤ 3 MB, otherwise refused with a prompt to choose a folder |
| Other file | Copied to folder | Embedded if ≤ 3 MB, otherwise refused |
| Table | Stored in JSON (cell text) | Stored in JSON |

Folder files are named `<attachmentId>-<sanitised original name>` to avoid collisions. Removing an attachment deletes its folder copy.

### 8.2 Paste resolution order

When the drawer is open, Ctrl+V is resolved in this order:

1. HTML clipboard containing a `<table>` → **table** (checked first because Excel also places a bitmap of the selection on the clipboard);
2. tab-separated plain text → **table** (only when not typing in a field);
3. clipboard files (screenshots) → **picture/file**;
4. text that looks like a URL, UNC path or drive path → **link**.

Tables are cleaned (non-breaking spaces, empty edge rows and columns) and capped at 300 rows × 40 columns. Cells are stored as text and rendered with `textContent`; pasted HTML is never inserted into the page.

### 8.3 Link normalisation

| Input | Stored as |
|---|---|
| `\\server\share\file.mp4` | `file://server/share/file.mp4` |
| `C:\Data\scan.jpg` | `file:///C:/Data/scan.jpg` |
| `asml.com/x` | `https://asml.com/x` |
| Anything with a scheme | Unchanged |

### 8.4 Opening attachments

| Type | Behaviour |
|---|---|
| Picture, video, audio | In-page viewer. |
| PDF, text, CSV, JSON | In-page viewer (iframe); HTML and SVG are sandboxed with scripts disabled. |
| Table | In-page viewer; **Copy for Excel** puts tab-separated text on the clipboard. |
| Office and other files | Handed to the browser as a download with the original name; Windows opens it with the default app. Setting *Always open files of this type* in Chrome/Edge makes this one click. Browsers cannot launch desktop applications directly. |
| Link | New browser tab. |

## 9. Security and privacy

- The page makes **no network requests**; nothing leaves the machine unless the user opens a link.
- Data and attachments live only where the user puts them. Placing them in a company OneDrive keeps them under company data controls.
- File and folder access is granted per origin by the browser and can be revoked in site settings.
- Pasted content is stored as text; attachment previews of HTML/SVG are sandboxed.
- There is no telemetry, account or licence check.

## 10. Compatibility

| Environment | Support |
|---|---|
| Chrome / Edge 86+ on Windows or macOS, opened from disk | Full (data file, attachments folder, all features). |
| Chrome / Edge 122+ | As above, plus optional *Allow on every visit* to skip the reconnect click. |
| Firefox, Safari | Runs with browser-only storage; Export/Import for moving data; attachments embedded only (≤ 3 MB). |
| IT policy disabling the File System Access API | Same as Firefox; the banner explains it. |

## 11. Verification

Automated checks were run in a headless DOM (jsdom) and headless Chromium against the release build. The scripts are in `tests/automated/`; the manual checklist is in `tests/manual-test-checklist.md`.

| Area | Check | Result |
|---|---|---|
| Migration | Legacy parent/day data loads as nested items with dates. | Pass |
| Outline | Enter / Tab / indent limits; three levels in sections; package shows issue actions one level deeper. | Pass |
| Mirroring | Issue created in the panel appears in the package; edits mirror between views. | Pass |
| Drag | Task with subtree onto issue header files into current stage; action to day schedules; day item back to package unschedules that date. | Pass |
| Month | Calendar size for the month; list → date; date → date; date → list; Enter inside a date creates an item on that date; week label opens Week tab. | Pass |
| Storage | Create file, autosave writes, browser mirror present; browser-only fallback without File System Access. | Pass |
| Attachments | Picture embed, web link, UNC and drive path conversion; pasted HTML table renders 4×4 with numeric alignment; PDF opens in viewer; `.xlsx` handed off with original name. | Pass |
| Errors | No page errors during any scenario. | Pass |

## 12. Known limitations

1. Reconnecting the data file needs one click per browser session unless *Allow on every visit* is chosen.
2. Simultaneous editing on two machines is last-writer-wins.
3. Office files open via the browser's download hand-off, not in place.
4. Embedded attachments enlarge the JSON file; linking an attachments folder is recommended.
5. Issue-level attachments are not supported (attach to an action instead).
6. Rich text inside items is not supported.
7. Undo/redo is not implemented; exported backups and OneDrive version history are the recovery path.

## 13. Versioning and change control

AutoBan follows **Semantic Versioning** (`MAJOR.MINOR.PATCH`):

| Change | Version bump | Examples |
|---|---|---|
| Data schema change older builds cannot read | MAJOR | New required structure, renamed fields without migration. |
| New feature, backward-compatible data | MINOR | New attachment type, new view, new setting with a default. |
| Bug fix, styling, copy | PATCH | Layout fix, colour tweak. |

The data schema number (`version` in the file) is independent and increments only with structural changes. Every release:

1. updates `VERSION`, `APP_VERSION` in the HTML, the header badge and footer;
2. adds an entry to `CHANGELOG.md` and a file under `docs/release-notes/`;
3. copies the build to `releases/AutoBan_vX.Y.Z.html`;
4. is committed and tagged `vX.Y.Z` in Git;
5. revises this document if requirements, data model or behaviour changed.

## 14. Roadmap candidates (post-1.0)

| Candidate | Notes |
|---|---|
| Undo/redo | Snapshot stack per session. |
| Issue-level attachments and notes history | Extend `Issue` with `att`. |
| Search and filter | Across all weeks and issues. |
| Due dates and overdue highlighting | Distinct from scheduled work dates. |
| Print/PDF weekly report | Print stylesheet for the week and issue cards. |
| Theme switcher | Restore Stone and oxblood as an option. |
| Automatic dated backups | Rolling copies in `data/backups/`. |

## 15. Glossary

| Term | Meaning |
|---|---|
| Package | The complete list for the week: own tasks plus all issues and their actions. |
| Item | A task or an action; same structure. |
| Action | An item inside an issue section. |
| Stage | The first unfinished section of an issue. |
| Data file | `autoban-data.json`, the source of truth. |
| Attachments folder | Folder holding copied pictures, videos and files. |
| Mirror | The browser's local copy of the data. |
