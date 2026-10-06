"""AutoBan attachment test (headless Chromium): pasted table, PDF viewer, Office hand-off."""
import asyncio, os, sys, tempfile
from playwright.async_api import async_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
APP = "file://" + os.path.join(HERE, "..", "..", "src", "autoban.html").replace("\\", "/")
TABLE = ("<table><tr><td>Run</td><td>kV</td><td>Deflection</td></tr>"
         "<tr><td>12</td><td>30</td><td>4.2</td></tr><tr><td>13</td><td>30</td><td>6.8</td></tr></table>")

async def main():
    tmp = tempfile.mkdtemp()
    pdf = os.path.join(tmp, "report.pdf"); open(pdf, "wb").write(b"%PDF-1.1\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF")
    xlsx = os.path.join(tmp, "Budget.xlsx"); open(xlsx, "wb").write(b"PK test")
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(accept_downloads=True); pg = await ctx.new_page()
        errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto(APP); await pg.wait_for_timeout(300)
        await pg.click("#addLine"); await pg.keyboard.type("Charging simulation"); await pg.keyboard.press("Escape")
        row = pg.locator("#package .task").first; await row.hover(); await row.locator(".clip").click()
        await pg.evaluate("""h=>{const dt=new DataTransfer(); dt.setData('text/html',h);
            document.dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt,bubbles:true}));}""", TABLE)
        await pg.wait_for_timeout(150)
        assert await pg.locator("#drTables table.ntable tr").count() == 3; print("PASS pasted table renders natively")
        await pg.set_input_files("#drFile", [pdf, xlsx]); await pg.wait_for_timeout(400)
        await pg.click("#drFiles .att-link >> nth=0"); await pg.wait_for_timeout(300)
        assert await pg.locator("#viewer iframe").count() == 1; print("PASS PDF opens in viewer")
        await pg.keyboard.press("Escape")
        async with pg.expect_download() as dl: await pg.click("#drFiles .att-link >> nth=1")
        assert (await dl.value).suggested_filename == "Budget.xlsx"; print("PASS Office file handed off with original name")
        assert not errs, errs; print("PASS no page errors")
        await b.close()

try: asyncio.run(main())
except AssertionError as e: print("FAIL", e); sys.exit(1)
