"""Import native inventory renders, checked against an official Minecraft client JAR.

Requires Pillow. Run with --check to validate the committed catalogue offline.
"""

import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import io
import json
from pathlib import Path
import re
import tempfile
import time
from urllib.request import Request, urlopen
import zipfile

from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "outils" / "generateur-cdc"
ASSETS = ROOT / "minecraft-item-textures" / "inventory"
REPORT = ROOT / "minecraft-inventory-audit.json"
VERSION = "26.2"
CLIENT_SHA = "2dc72797acbc1b63fc16a11c4ac393605f453754"
SOURCE_CLIENT_SHA = "b54b78348ced53071e4506b798845e9ec65bf5a4"
RENDER_COMMIT = "96b9b546b8797b1b544a8d9eed67c29b2a90b4cc"
SOURCE = f"https://raw.githubusercontent.com/Owen1212055/mc-assets/{RENDER_COMMIT}"
CACHE = Path(tempfile.gettempdir()) / "neodium-minecraft-26.2-audit"


def download(url):
    for attempt in range(4):
        try:
            with urlopen(Request(url, headers={"User-Agent": "Neodium-asset-audit"}), timeout=40) as response:
                return response.read()
        except Exception:
            if attempt == 3:
                raise
            time.sleep(attempt + 1)


def read_js(name):
    text = (ROOT / name).read_text(encoding="utf-8-sig")
    return json.loads(text[text.index("=") + 1:].strip().rstrip(";"))


def validate_png(data, item_id):
    with Image.open(io.BytesIO(data)) as image:
        image.load()
        if image.format != "PNG" or image.width != image.height:
            raise ValueError(f"Invalid inventory PNG: {item_id}")
        if image.convert("RGBA").getchannel("A").getbbox() is None:
            raise ValueError(f"Empty inventory PNG: {item_id}")


def check():
    report = json.loads(REPORT.read_text(encoding="utf-8"))
    catalogue = read_js("minecraft-items-catalog.js")
    mapping = read_js("minecraft-inventory-icons.js")
    for item_id in catalogue:
        if item_id in report["nonVisualItems"] or item_id in report["customItems"]:
            continue
        if item_id not in mapping:
            raise ValueError(f"Missing icon mapping: {item_id}")
    for item_id, relative in mapping.items():
        path = ROOT / "minecraft-item-textures" / f"{relative}.png"
        data = path.read_bytes()
        validate_png(data, item_id)
        if hashlib.sha256(data).hexdigest() != report["sha256"][item_id]:
            raise ValueError(f"Icon checksum mismatch: {item_id}")
    textures = read_js("minecraft-item-texture-map.js")
    for item_id in report["customItems"]:
        with Image.open(ROOT / "minecraft-item-textures" / f"{textures[item_id]}.png") as image:
            image.verify()
    print(f"OK: {len(catalogue)} catalogue entries, {len(mapping)} valid local icons.")


def sync():
    CACHE.mkdir(parents=True, exist_ok=True)
    jar_path = CACHE / "client.jar"
    if not jar_path.exists():
        jar_path.write_bytes(download(f"https://piston-data.mojang.com/v1/objects/{CLIENT_SHA}/client.jar"))
    if hashlib.sha1(jar_path.read_bytes()).hexdigest() != CLIENT_SHA:
        raise ValueError("The client JAR does not match Mojang's checksum")
    source_jar_path = CACHE / "pre2.jar"
    if not source_jar_path.exists():
        source_jar_path.write_bytes(download(f"https://piston-data.mojang.com/v1/objects/{SOURCE_CLIENT_SHA}/client.jar"))
    if hashlib.sha1(source_jar_path.read_bytes()).hexdigest() != SOURCE_CLIENT_SHA:
        raise ValueError("The render-source JAR does not match Mojang's checksum")
    with zipfile.ZipFile(jar_path) as jar:
        official = sorted(Path(name).stem for name in jar.namelist()
                          if re.fullmatch(r"assets/minecraft/items/[a-z0-9_]+\.json", name))
        with zipfile.ZipFile(source_jar_path) as source_jar:
            visual_assets = [name for name in jar.namelist() if name.startswith((
                "assets/minecraft/items/", "assets/minecraft/models/", "assets/minecraft/textures/"))
                and not name.startswith("assets/minecraft/textures/particle/") and not name.endswith("/")]
            changed = [name for name in visual_assets if name not in source_jar.NameToInfo
                       or jar.read(name) != source_jar.read(name)]
            if changed:
                raise ValueError(f"Render source has outdated models/textures: {changed}")
    old = read_js("minecraft-items-catalog.js")
    source = (ROOT / "cdc-generator.js").read_text(encoding="utf-8-sig")
    custom = json.loads(re.search(r"const CUSTOM_MINECRAFT_ITEM_KEYS = (\[[\s\S]*?\]);", source)[1])
    tree = json.loads(download(f"https://api.github.com/repos/Owen1212055/mc-assets/git/trees/{RENDER_COMMIT}?recursive=1"))
    available = {Path(entry["path"]).stem.lower() for entry in tree["tree"]
                 if re.fullmatch(r"item-assets/[A-Z0-9_]+\.png", entry["path"])}
    # Air has no inventory model; keep old IDs so saved CDCs remain compatible.
    non_visual = ["air"]
    catalogue = sorted(set(official) | set(old))
    missing = sorted(set(catalogue) - available - set(non_visual) - set(custom))
    if missing:
        raise ValueError(f"Missing native renders (no partial import): {missing}")
    ASSETS.mkdir(parents=True, exist_ok=True)

    def fetch_icon(item_id):
        path = ASSETS / f"{item_id}.png"
        data = path.read_bytes() if path.exists() else download(f"{SOURCE}/item-assets/{item_id.upper()}.png")
        validate_png(data, item_id)
        if not path.exists():
            path.write_bytes(data)
        return item_id, hashlib.sha256(data).hexdigest()

    ids = sorted(set(catalogue) - set(non_visual) - set(custom))
    hashes = {}
    with ThreadPoolExecutor(max_workers=8) as pool:
        for item_id, checksum in pool.map(fetch_icon, ids):
            hashes[item_id] = checksum
            if len(hashes) % 100 == 0:
                print(f"Validated {len(hashes)}/{len(ids)} icons", flush=True)
    mapping = {item_id: f"inventory/{item_id}" for item_id in ids}
    (ROOT / "minecraft-items-catalog.js").write_text(
        "window.BUILTIN_MINECRAFT_ITEM_IDS = " + json.dumps(catalogue, indent=4) + ";\n", encoding="utf-8")
    (ROOT / "minecraft-inventory-icons.js").write_text(
        "window.MINECRAFT_INVENTORY_ICONS = " + json.dumps(mapping, indent=2) + ";\n", encoding="utf-8")
    previous_report = json.loads(REPORT.read_text()) if REPORT.exists() else {}
    report = {
        "minecraftVersion": VERSION,
        "clientSha1": CLIENT_SHA,
        "renderSource": "https://github.com/Owen1212055/mc-assets",
        "renderCommit": RENDER_COMMIT,
        "renderSourceVersion": "26.2 Pre-Release 2",
        "sourceClientSha1": SOURCE_CLIENT_SHA,
        "matchingReleaseVisualAssets": len(visual_assets),
        "officialItemCount": len(official),
        "catalogueCount": len(catalogue),
        "iconCount": len(ids),
        "addedItems": sorted(set(official) - set(old)) or previous_report.get("addedItems", []),
        "legacyItems": sorted(set(old) - set(official)),
        "nonVisualItems": non_visual,
        "customItems": custom,
        "missingIcons": [],
        "sha256": hashes,
    }
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    check()
    print("Added items:", report["addedItems"])


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    check() if args.check else sync()
