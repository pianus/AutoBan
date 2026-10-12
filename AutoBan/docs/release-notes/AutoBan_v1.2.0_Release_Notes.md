# AutoBan v1.2.0 — Release Notes

| | |
|---|---|
| **Version** | 1.2.0 |
| **Release date** | 2026-10-12 |
| **Data schema** | 5 (unchanged) |
| **Build** | `AutoBan.html` (identical copy: `releases/AutoBan_v1.2.0.html`) |
| **Git tag** | `v1.2.0` |

## Summary

Type tasks directly into a day. No data migration: files written by 1.2 open in 1.0 and 1.1, and the reverse.

## What's new

- **+ Add task in every day column.** Click it under Mon–Fri (or the weekend days when shown) and type. The task is scheduled on that day and added to the end of the package; the package row fills in as you type.
- **Keep typing.** Enter starts another task for the same day. Escape or clicking elsewhere finishes; an empty entry is dropped.
- Tasks typed this way are ordinary package tasks: indent them, tick them, attach files or schedule more days from either side.

## Tests

`tests/automated/smoke.jsdom.test.js` (36 checks), `attachments.playwright.py` (4 checks) and the new `dayentry.playwright.py` (9 checks, real keyboard input in Chromium) pass.
