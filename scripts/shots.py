"""Shader smoke check and contact sheet.

Node has no WebGL2, so shader compilation cannot be verified under `bun test`.
This loads the running dev server in Chromium, forces each scene, and fails on
any console error, which is what a broken shader produces. The PNGs it writes
are a side effect worth keeping: they are how you judge a change to a scene.

    bun run dev          # in one shell
    bun run shots        # in another
"""

import asyncio
import base64
import pathlib
import sys

from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "shots"
URL = "http://localhost:5273/"
# Walked with ArrowRight from scene 1, so this stays correct as scenes are added.
SCENES = [
    "wave", "radial", "vortex", "droste", "mandala", "metatron", "kali",
    "mandelbulb", "girder", "moire", "beams", "sunset", "discoball", "prism",
    "strobe",
]
SETTLE_MS = 2200


async def main() -> int:
    OUT.mkdir(exist_ok=True)
    errors: list[str] = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--use-angle=metal", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
        )
        page = await browser.new_page(viewport={"width": 1280, "height": 640})
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))

        await page.goto(URL, wait_until="load")
        await page.wait_for_timeout(1200)

        info = await page.evaluate("""() => {
            const gl = document.getElementById('stage').getContext('webgl2');
            const dbg = gl.getExtension('WEBGL_debug_renderer_info');
            return {
                renderer: gl.getParameter(dbg ? dbg.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
                err: gl.getError(),
            };
        }""")
        print(f"renderer: {info['renderer']}  glError: {info['err']}")
        if info["err"] != 0:
            errors.append(f"glError {info['err']}")

        await page.evaluate("() => dispatchEvent(new KeyboardEvent('keydown', {key:'l'}))")
        await page.evaluate("() => dispatchEvent(new KeyboardEvent('keydown', {key:'1'}))")
        for i, name in enumerate(SCENES):
            if i:
                await page.evaluate(
                    "() => dispatchEvent(new KeyboardEvent('keydown', {key:'ArrowRight'}))"
                )
            await page.wait_for_timeout(SETTLE_MS)
            data = await page.evaluate(
                """() => new Promise(r => requestAnimationFrame(
                    () => r(document.getElementById('stage').toDataURL('image/png'))))"""
            )
            raw = base64.b64decode(data.split(",", 1)[1])
            (OUT / f"{name}.png").write_bytes(raw)
            print(f"  {name:<11} {len(raw) // 1024}kb")

        print("hud:", await page.evaluate("() => document.querySelector('.stat').textContent"))
        await browser.close()

    real = [e for e in errors if "favicon" not in e]
    if real:
        print("\nFAIL, console errors:", *real, sep="\n  ")
        return 1

    try:
        from PIL import Image
    except ImportError:
        print("\nok (install pillow for the contact sheet)")
        return 0

    cols, cw, ch = 3, 640, 320
    rows = (len(SCENES) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * cw, rows * ch), (0, 0, 0))
    for i, name in enumerate(SCENES):
        sheet.paste(Image.open(OUT / f"{name}.png").resize((cw, ch)), ((i % cols) * cw, (i // cols) * ch))
    sheet.convert("RGB").save(OUT / "contact-sheet.jpg", quality=88, optimize=True)
    print("\nok, wrote shots/contact-sheet.jpg")
    return 0


sys.exit(asyncio.run(main()))
