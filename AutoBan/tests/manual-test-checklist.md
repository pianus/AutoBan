# AutoBan — Manual Test Checklist

Run before every release in Chrome or Edge, using a **throwaway** data file (e.g. `data/test-data.json`). Record the result in the release notes.

| # | Area | Steps | Expected |
|---|---|---|---|
| 1 | Start-up | Open `AutoBan.html` with no file linked. | Banner offers Create / Open. Header shows *AutoBan v1.x*. |
| 2 | Data file | Create new file. Add a task. Wait 1 s. Open the JSON in Notepad. | Task is in the file; `appVersion` matches. |
| 3 | Reconnect | Close and reopen the page. | Reconnect banner (or auto-reconnect); data intact. |
| 4 | Outliner | Type three tasks with Enter; Tab the 2nd and 3rd; Tab the 3rd again; try a 4th level. | Levels 0/1/2; fourth level refused with a message. |
| 5 | Check-off | Check both children. | Parent checks itself; uncheck one → parent unchecks. |
| 6 | Day keys | Click M and W on a task. | Appears in Mon and Wed columns. |
| 7 | Drag | Drag a task onto the lower half of another row; drag a day item back to the package. | Inserted below with subtree; date removed. |
| 8 | Issues | + Issue, title it, add actions in Cause with a sub-action. | Issue shows in package with actions one level deeper; stage bar shows Problem as current. |
| 9 | Filing | Drag a package task onto the issue header in the package. | Task moves into the current stage section. |
| 10 | Month | Month tab → drag an item to a date → drag it to another date → back to the list. | Scheduled, moved, unscheduled. |
| 11 | Attach link | Paperclip → paste `\\server\share\a.pdf`. | Stored as `file://server/share/a.pdf`. |
| 12 | Attach table | Copy 3×3 cells in Excel → Ctrl+V in the panel. | Native table, header row bold, numbers right-aligned. |
| 13 | Attach files | Choose folder; drop a PNG, an MP4, a PDF, an XLSX onto a row. | Files appear in `data/attachments`; picture/video/PDF open in viewer; XLSX opens in Excel. |
| 14 | Sync | Edit the JSON on another machine (or edit `savedAt`/title in Notepad and save), return to the tab. | Page reloads the external change. |
| 15 | Export | Export copy; Export readable. | `autoban-backup-…json`, `autoban-report-…md` with attachments listed. |
| 16 | Import | Import the backup into a fresh browser profile. | Identical board. |
| 17 | Type into a day | Click + Add task under Wed, type a title, Enter, type another, Escape. | Both appear under Wed and at the end of the package with W marked; the package row fills in while typing. |
