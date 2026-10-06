# Automated smoke tests

Optional; need Node.js 18+ (for `smoke.jsdom.test.js`) and Python 3 with Playwright (for `attachments.playwright.py`). They exercise `../../src/autoban.html`.

```bash
npm install jsdom@24
node smoke.jsdom.test.js

pip install playwright && playwright install chromium
python attachments.playwright.py
```

Both print `PASS` lines and exit non-zero on failure.
