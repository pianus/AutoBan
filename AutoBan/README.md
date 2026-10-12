# AutoBan

Weekly Kanban, month planner and issue tracker in one offline HTML file.

**Current release: v1.1.0** · data schema 5 · see [`docs/release-notes/AutoBan_v1.1.0_Release_Notes.md`](docs/release-notes/AutoBan_v1.1.0_Release_Notes.md)

## Quick start

1. Open **`AutoBan.html`** in Chrome or Edge (double-click, then bookmark it).
2. Banner → **Create new file…** → save `autoban-data.json` in `data\`.
3. Any paperclip → **Choose folder…** → pick `data\attachments\` (create it in the picker).

Everything saves automatically. On another machine, open `AutoBan.html` and choose **Open existing file…**.

## Folder layout

```
AutoBan/
├── AutoBan.html                 ← open this (current release)
├── VERSION                      ← 1.1.0
├── README.md
├── CHANGELOG.md
├── docs/
│   ├── AutoBan_Design_Document_v1.0.md
│   └── release-notes/
│       ├── AutoBan_v1.0.0_Release_Notes.md
│       └── AutoBan_v1.1.0_Release_Notes.md
├── releases/
│   ├── AutoBan_v1.0.0.html      ← frozen copy of each release
│   └── AutoBan_v1.1.0.html
├── src/
│   └── autoban.html             ← working source (history tracked in Git)
├── tests/
│   ├── manual-test-checklist.md
│   └── automated/               ← jsdom and Playwright smoke tests
└── data/                        ← your data and attachments (not in Git)
```

## Version control

The folder is a Git repository (`main` branch, tag per release: `v0.5.0` … `v1.1.0`).

```bash
git log --oneline --decorate     # history
git show v1.0.0                  # what shipped in 1.0.0
git diff v0.9.1 v1.0.0 -- src/   # changes between releases
```

No Git on the machine? The folder still works; `CHANGELOG.md` and `releases/` hold the same history in readable form.

### Release procedure

1. Edit `src/autoban.html`; bump `APP_VERSION` and the header/footer badges.
2. Run the checks in `tests/` (manual checklist at minimum).
3. Update `VERSION`, `CHANGELOG.md`, add `docs/release-notes/AutoBan_vX.Y.Z_Release_Notes.md`; revise the design document if behaviour or data changed.
4. Copy `src/autoban.html` to `AutoBan.html` and `releases/AutoBan_vX.Y.Z.html`.
5. `git commit` and `git tag -a vX.Y.Z`.

Version rules (SemVer): **MAJOR** for data changes older builds can't read, **MINOR** for new features, **PATCH** for fixes and styling. Details in the design document §13.
