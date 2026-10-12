# Changelog

All notable changes to AutoBan are recorded here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [Semantic Versioning](https://semver.org/) — see design document §13.

## [1.1.0] — 2026-10-12
Data schema 5 (unchanged; files stay readable by 1.0).

### Added
- Top-level task grouping in the package: **Groups** button cycles a separator line, a colored rail along sub-tasks, both, or off (default: line).
- **Hide done** in the package header hides completed top-level tasks with their sub-tasks.
- **Collapse all / Expand all** in the Issues header; a collapsed issue shows only its title row and stage.
- Auto-scroll while dragging a row near the top or bottom edge of the window.
- Paste list accepts `@YYYY-MM-DD` and writes dates outside the shown week that way.

### Changed
- The package lists every task from every week, not only the current week; counts, Clear completed, Paste list and Export readable cover all tasks.
- Paste list keeps item ids and attachments for unchanged titles.

### Removed
- Carry forward (open tasks now always stay in the package).

## [1.0.0] — 2026-10-05
First formal release. Data schema 5.

### Added
- Product name **AutoBan**; brand and version badge in the top bar; version and schema in the footer.
- `appVersion` field written to the data file.
- Project structure: design document, release notes, changelog, Git history with tags, test scripts and manual checklist.

### Changed
- Default data file name `autoban-data.json`; backups `autoban-backup-YYYY-MM-DD.json`; reports `autoban-report-YYYY-MM-DD.md`.
- Data file `app` identifier `autoban` (older identifiers still accepted).

## [0.9.1] — 2026-10-05
### Added
- Ctrl+V of Excel, Word or web tables renders a native table attachment (expand, copy back to Excel).
- Any file type can be attached; drop files on any row or the attachment panel.
- In-page viewer for PDF, text, CSV, JSON, audio; other types hand off to the default desktop app.

## [0.9.0] — 2026-10-05
### Added
- Attachment panel per item: links (web, SharePoint, UNC, drive paths), pictures, videos.
- Optional attachments folder; pictures embedded (compressed) when no folder is linked.
### Changed
- Graphite and brass dark theme.

## [0.8.0] — 2026-10-05
### Changed
- Visual refinement: elevation instead of hairlines, dark top bar with integrated Week/Month switch, sentence-case labels, accent drop rings (Stone and oxblood palette).

## [0.7.0] — 2026-10-05
### Added
- Week/Month tabs; month calendar with all-items list; drag to schedule, move and unschedule dates.
### Changed
- Items store absolute dates; day columns show tasks from every week.

## [0.6.0] — 2026-10-05
### Added
- Issues and their actions mirrored into the package as top-level items.
- Indentation (three levels) inside issue sections.
- Whole-row drag with above/below insertion; click text to edit.
### Changed
- Unified flat outline model (`lvl`) for tasks and actions; legacy data migrated.

## [0.5.0] — 2026-10-05
### Added
- Offline single-file build with a local JSON data file (File System Access API), remembered handle, browser mirror, conflict prompt, external-change detection.
### Removed
- Hosted claude.ai storage and web fonts.

## Pre-repository history (0.1 – 0.4)
Developed before source control; builds not retained.
- **0.4** — Issue list with six sections, cross-list drag, hosted version with account storage, JSON/Markdown export.
- **0.3** — Inline outliner input, three nesting levels, per-row multi-day keys, wrapping text, two-per-row day layout.
- **0.2** — Compact rows, removal of hour estimates, text-outline import.
- **0.1** — Weekly Kanban prototype with parent/child tasks, day scheduling and check-off.
