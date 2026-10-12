# AutoBan v1.1.0 — Release Notes

| | |
|---|---|
| **Version** | 1.1.0 |
| **Release date** | 2026-10-12 |
| **Data schema** | 5 (unchanged) |
| **Build** | `AutoBan.html` (identical copy: `releases/AutoBan_v1.1.0.html`) |
| **Git tag** | `v1.1.0` |

## Summary

Easier to work with a long package and issue list. No data migration: files written by 1.1 open in 1.0 and the reverse. Two new optional settings (`groupStyle`, `hideDoneTop`) are stored in the file's `settings` and ignored by 1.0.

## What's new

- **One package for all weeks.** Tasks are not tied to a week: the package lists every task, whichever week it was created in. Counts, Clear completed, Paste list and Export readable cover them all.
- **Clearer top-level groups.** The **Groups** button (below the day columns) cycles a brighter separator line above each top-level task, a colored rail beside its sub-tasks, both, or off.
- **Hide done.** Hides completed top-level tasks with their sub-tasks; a "N hidden · show" link brings them back.
- **Collapse issues.** **Collapse all / Expand all** in the Issues header; each issue's arrow collapses it to its title row.
- **Auto-scroll while dragging.** Hold a dragged row near the top or bottom edge of the window to scroll.
- **Paste list keeps dates.** Dates outside the shown week are written as `@YYYY-MM-DD`, and ids and attachments survive for unchanged titles.

## Removed

- **Carry forward**: open tasks now stay visible in the package, so copying them would duplicate them.

## Tests

`tests/automated/smoke.jsdom.test.js` (27 checks) and `attachments.playwright.py` (4 checks) pass.
