# Minecraft inventory icons

Native 256x256 inventory renders from [Owen1212055/mc-assets](https://github.com/Owen1212055/mc-assets), pinned to commit `96b9b546b8797b1b544a8d9eed67c29b2a90b4cc` (26.2 Pre-Release 2). Minecraft artwork belongs to Mojang/Microsoft.

The catalogue is extracted from the official **Java 26.2** client JAR, verified against Mojang's SHA-1. All item definitions, models and textures (excluding particles) were compared byte-for-byte between the render-source client and the final 26.2 client. They match. Air intentionally has no visible icon. Custom Neodium assets remain in their original directories.

These PNGs are served with the site, so vanilla GUI/craft previews do not depend on an external image API. Only icons used by the current inventory are requested. Custom HeadDatabase previews still use mc-heads.net.

From the repository root:

```powershell
python scripts/sync-minecraft-inventory.py --check
node scripts/check-minecraft-inventory.cjs
```

To reproduce the import, run `python scripts/sync-minecraft-inventory.py` (Python with Pillow and network access). The importer stops if an official item lacks a render or the source models/textures differ. To support a future release, update the pinned versions/checksums and choose compatible native renders before importing; updating the version number alone is not sufficient.

The coverage report, added IDs and PNG checksums are recorded in `../../minecraft-inventory-audit.json`.
