# AutoBan v1.3.0 — Release Notes

| | |
|---|---|
| **Version** | 1.3.0 |
| **Release date** | 2026-10-13 |
| **Data schema** | 5 (unchanged) |
| **Build** | `AutoBan.html` (identical copy: `releases/AutoBan_v1.3.0.html`) |
| **Git tag** | `v1.3.0` |

## Summary

Type notes directly into a task's attachment panel. No data migration: the note is an optional `note` field on the task, so files written by 1.3 open in 1.0–1.2, and those versions keep the note when they save.

## What's new

- **Note box in every attachment panel.** Click a task's paperclip and type in **Note** at the top. It saves as you type; Enter adds a new line.
- **Note marker.** A small dot next to the paperclip shows which tasks have a note.
- **Escape** leaves the note box; a second Escape closes the panel.
- Notes are listed under their task in **Export readable** and kept by **Paste list**. Issue actions get notes too.

## Tests

`smoke.jsdom.test.js` (36 checks), `attachments.playwright.py` (4), `dayentry.playwright.py` (9) and the new `notes.playwright.py` (14 checks, including opening and saving the file in v1.2.0) pass. The month-view smoke check was made independent of whether today already has a task.
