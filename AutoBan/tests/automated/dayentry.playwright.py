"""AutoBan day-column entry test (headless Chromium): type tasks into a day, see them in the package."""
import asyncio, os, sys
from playwright.async_api import async_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
APP = "file://" + os.path.join(HERE, "..", "..", "src", "autoban.html").replace("\\", "/")
SHOT = os.environ.get("AUTOBAN_SHOT")

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={"width": 1400, "height": 900})
        errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto(APP); await pg.wait_for_timeout(300)
        pkg = pg.locator("#package .task .tt"); day = lambda i: pg.locator(".day").nth(i)
        await pg.click("#addLine"); await pg.keyboard.type("Package task"); await pg.keyboard.press("Escape")
        await day(2).locator(".dayadd").click()
        await pg.keyboard.type("Review drawings")
        assert "Review drawings" in await pkg.all_text_contents(); print("PASS package updates while typing in a day")
        await pg.keyboard.press("Enter"); await pg.keyboard.type("Send quote"); await pg.keyboard.press("Enter")
        await pg.keyboard.type("Order parts"); await pg.keyboard.press("Escape"); await pg.wait_for_timeout(50)
        got = await day(2).locator(".task .tt").all_text_contents()
        assert got == ["Review drawings", "Send quote", "Order parts"], got; print("PASS Enter chains tasks in the same day")
        assert await pkg.all_text_contents() == ["Package task", "Review drawings", "Send quote", "Order parts"]; print("PASS package lists them in typed order")
        assert await pg.locator("#package .task").nth(3).locator(".dstrip button").nth(2).get_attribute("aria-pressed") == "true"; print("PASS package day strip shows Wed")
        await day(0).locator(".dayadd").click(); await pg.keyboard.type("Monday item")
        await day(3).locator(".dayadd").click(); await pg.keyboard.type("Thursday item"); await pg.keyboard.press("Escape")
        assert await day(0).locator(".task .tt").all_text_contents() == ["Monday item"]; print("PASS clicking another day's + Add task keeps the first entry")
        await day(1).locator(".dayadd").click(); await pg.keyboard.press("Escape"); await pg.wait_for_timeout(50)
        assert await day(1).locator(".task").count() == 0 and len(await pkg.all_text_contents()) == 6; print("PASS empty entry discarded")
        await pg.locator("#package .task", has_text="Send quote").locator(".box").check(); await pg.wait_for_timeout(50)
        assert await day(2).locator(".task.done .tt").all_text_contents() == ["Send quote"]; print("PASS ticking in the package ticks the day")
        await pg.reload(); await pg.wait_for_timeout(300)
        assert await day(2).locator(".task .tt").all_text_contents() == ["Review drawings", "Send quote", "Order parts"]; print("PASS survives reload")
        if SHOT: await pg.screenshot(path=SHOT, full_page=False)
        assert not errs, errs; print("PASS no page errors")
        await b.close()

try: asyncio.run(main())
except AssertionError as e: print("FAIL", e); sys.exit(1)
