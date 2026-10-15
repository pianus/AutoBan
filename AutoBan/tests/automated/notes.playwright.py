"""AutoBan task note test (headless Chromium): type a note in the attachment panel, save, export, older-version read."""
import asyncio, json, os, sys
from playwright.async_api import async_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..", "..")
url = lambda *p: "file://" + os.path.abspath(os.path.join(ROOT, *p)).replace("\\", "/")
APP = url("src", "autoban.html"); OLD = url("releases", "AutoBan_v1.2.0.html")
SHOT = os.environ.get("AUTOBAN_SHOT")
NOTE = "Called supplier, waiting on quote.\nCheck again Friday."

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(accept_downloads=True, viewport={"width": 1400, "height": 900})
        pg = await ctx.new_page(); errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto(APP); await pg.wait_for_timeout(300)
        await pg.click("#addLine"); await pg.keyboard.type("Order parts"); await pg.keyboard.press("Escape")
        row = pg.locator("#package .task").first
        await row.hover(); await row.locator(".clip").click()
        await pg.click("#drNote"); await pg.keyboard.type("Called supplier, waiting on quote.")
        await pg.keyboard.press("Enter"); await pg.keyboard.type("Check again Friday.")
        assert await pg.locator("#drNote").input_value() == NOTE; print("PASS Enter adds a new line in the note")
        await pg.wait_for_timeout(400)
        cache = lambda: pg.evaluate("JSON.parse(localStorage.getItem('wp:cache'))")
        task = lambda c: [t for w in c["weeks"].values() for t in w["tasks"]][0]
        assert task(await cache())["note"] == NOTE; print("PASS note saves while typing")
        await pg.evaluate("""()=>{const dt=new DataTransfer(); dt.setData('text/plain','https://example.com/quote');
            document.dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt,bubbles:true}));}""")
        await pg.wait_for_timeout(100)
        assert await pg.locator("#drLinks .att-link").count() == 0; print("PASS pasting a link while typing a note doesn't turn it into a link attachment")
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(50)
        assert not await pg.locator("#drawer").is_hidden(); print("PASS first Escape leaves the note, panel stays open")
        if SHOT: await pg.screenshot(path=SHOT, full_page=False)
        clip = pg.locator("#package .task").first.locator(".clip")
        assert "has" in (await clip.get_attribute("class")) and await clip.locator(".nd").count() == 1; print("PASS row clip shows a note marker")
        assert (await clip.get_attribute("title")) == "Note"; print("PASS clip tooltip says Note")
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(50)
        assert await pg.locator("#drawer").is_hidden(); print("PASS second Escape closes the panel")
        async with pg.expect_download() as dl: await pg.click("#mdBtn")
        md = open(await (await dl.value).path(), encoding="utf-8").read()
        assert "  - Note: Called supplier, waiting on quote.\n    Check again Friday." in md, md; print("PASS Export readable includes the note")
        await pg.reload(); await pg.wait_for_timeout(300)
        await pg.locator("#package .task").first.locator(".clip").click()
        assert await pg.locator("#drNote").input_value() == NOTE; print("PASS note survives reload")
        await pg.click("#addLine"); await pg.keyboard.type("Second task"); await pg.keyboard.press("Escape")
        r2 = pg.locator("#package .task").nth(1); await r2.hover(); await r2.locator(".clip").click()
        assert await pg.locator("#drNote").input_value() == ""; print("PASS another task's panel starts with an empty note")
        await pg.locator("#package .task").first.locator(".clip").click()
        await pg.fill("#drNote", ""); await pg.wait_for_timeout(400)
        assert "note" not in task(await cache()); print("PASS clearing the note removes it from the file")
        await pg.fill("#drNote", NOTE); await pg.locator("#drNote").blur(); await pg.wait_for_timeout(400)
        # Older version reads the same data and keeps the note when it saves.
        await pg.goto(OLD); await pg.wait_for_timeout(300)
        assert (await pg.locator("#package .task .tt").all_text_contents())[:2] == ["Order parts", "Second task"]; print("PASS v1.2.0 opens a file with notes")
        await pg.locator("#package .task").first.locator(".box").check(); await pg.wait_for_timeout(400)
        t = task(await cache()); assert t["done"] and t["note"] == NOTE; print("PASS v1.2.0 keeps the note when it saves")
        assert not errs, errs; print("PASS no page errors")
        await b.close()

try: asyncio.run(main())
except AssertionError as e: print("FAIL", e); sys.exit(1)
