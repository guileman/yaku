# Uso:  python tools/test_app.py [URL o ruta de index.html] [all|desk|mob] [carpeta capturas]
# Sin argumentos prueba index.html de esta carpeta abierto como archivo (file://, igual que con doble clic).
import asyncio, sys, os, pathlib, tempfile
from playwright.async_api import async_playwright
_DEF = pathlib.Path(__file__).resolve().parent.parent / "index.html"
URL = sys.argv[1] if len(sys.argv) > 1 else str(_DEF)
if "://" not in URL: URL = pathlib.Path(URL).resolve().as_uri()
OUT = sys.argv[3] if len(sys.argv) > 3 else os.path.join(tempfile.gettempdir(), "shots")
os.makedirs(OUT, exist_ok=True)
ONLY = sys.argv[2] if len(sys.argv) > 2 else "all"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
        logs = []
        async def snap(pg, path, frames=36):
            await pg.evaluate(f"window.__app.viewer.advance({frames})")
            await pg.screenshot(path=path, timeout=120000)
        async def run(name, vp, mobile=False, steps=None):
            pg = await b.new_page(viewport=vp, device_scale_factor=1, is_mobile=mobile, has_touch=mobile)
            pg.on('console', lambda m: logs.append(f"[{name}] {m.type}: {m.text}") if m.type in ('error','warning') else None)
            pg.on('pageerror', lambda e: logs.append(f"[{name}] PAGEERR {e}"))
            await pg.goto(URL)
            await pg.wait_for_function("document.documentElement.dataset.ready==='1'", timeout=120000)
            model = await pg.evaluate("document.documentElement.dataset.model")
            print(name, "modelo:", model, "| piezas:", await pg.evaluate("window.__app.viewer.parts.size"), flush=True)
            if model != "ok": logs.append(f"[{name}] MODELO NO CARGADO: {model}")
            await pg.evaluate("window.__app.viewer.pause()")
            n = await pg.evaluate("window.__app.tour.pasos.length")
            for i in (steps if steps is not None else range(n)):
                await pg.evaluate(f"window.__app.tour.go({i})")
                await snap(pg, f"{OUT}/{name}_paso{i}.png")
                print("shot", name, i, flush=True)
            return pg
        if ONLY in ("all","desk"):
            pg = await run("desk", {'width':1280,'height':800})
            await pg.evaluate("window.__app.tour.go(0)")
            for sel,val in (('#in-q','35'),('#in-h','2.5')):
                await pg.fill(sel, val); await pg.dispatch_event(sel,'input')
            g = "({p:document.getElementById('r-p').textContent, eta:document.getElementById('r-eta').textContent, n:document.getElementById('r-n').textContent})"
            print("calc 35 L/s 2.5 m:", await pg.evaluate(g))
            await pg.click('#pr-medicion'); print("medicion:", await pg.evaluate(g))
            for sel,val in (('#in-q','15'),('#in-h','3')):
                await pg.fill(sel, val); await pg.dispatch_event(sel,'input')
            print("celda X:", await pg.evaluate(g))
            await pg.click('#pr-folleto'); print("folleto:", await pg.evaluate(g))
            print("rpm/omega:", await pg.evaluate("window.__app.fis.n"))
            await pg.fill('#explode', '1'); await pg.dispatch_event('#explode','input')
            await snap(pg, f"{OUT}/desk_despiece.png", 30)
            await pg.fill('#explode', '0'); await pg.dispatch_event('#explode','input')
            await pg.click('#tg-cut'); await snap(pg, f"{OUT}/desk_corte.png", 5); await pg.click('#tg-cut')
            await pg.click('#bt-next'); print("next ->", await pg.evaluate("window.__app.tour.i"))
            await pg.click('#bt-prev'); print("prev ->", await pg.evaluate("window.__app.tour.i"))
            await pg.keyboard.press('ArrowRight'); print("tecla -> :", await pg.evaluate("window.__app.tour.i"))
            await snap(pg, f"/tmp/x.png", 36)
            hs = await pg.query_selector('.hotspot')
            if hs:
                await hs.click(); await snap(pg, f"{OUT}/desk_info.png", 8)
                print("info:", await pg.evaluate("document.getElementById('info-title').textContent"))
            # pick por raycast en el centro del canvas
            await pg.keyboard.press('Escape')
            print("play btn:", await pg.evaluate("document.getElementById('bt-play').click(), window.__app.tour.playing"))
            await pg.evaluate("window.__app.tour.stop()")
        if ONLY in ("all","mob"):
            await run("mob", {'width':390,'height':844}, mobile=True, steps=[0,3,6])
        print("\n".join(logs) or "consola sin errores/advertencias")
        await b.close()
asyncio.run(main())
