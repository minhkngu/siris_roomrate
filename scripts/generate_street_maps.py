#!/usr/bin/env python3

import io
import math
import tempfile
import urllib.request
from pathlib import Path

from PIL import Image, ImageEnhance


ZOOM = 16
TILE_SIZE = 256
WIDTH = 1536
HEIGHT = 1024
OUTPUT_DIR = Path(__file__).resolve().parents[1] / "public" / "maps"

MAPS = {
    "siris-mia-street-map.png": (10.7339474, 106.7072669),
    "siris-lune-street-map.png": (10.7339006, 106.7079854),
}


def world_pixel(lat: float, lon: float) -> tuple[float, float]:
    scale = TILE_SIZE * (2**ZOOM)
    sin_lat = math.sin(math.radians(lat))
    x = (lon + 180.0) / 360.0 * scale
    y = (0.5 - math.log((1 + sin_lat) / (1 - sin_lat)) / (4 * math.pi)) * scale
    return x, y


def download_tile(x: int, y: int, cache_dir: Path) -> Image.Image:
    cached = cache_dir / f"{ZOOM}-{x}-{y}.png"
    if not cached.exists():
        request = urllib.request.Request(
            f"https://tile.openstreetmap.de/{ZOOM}/{x}/{y}.png",
            headers={"User-Agent": "SirisResidencesStaticMap/1.0 (info@siris.vn)"},
        )
        with urllib.request.urlopen(request, timeout=30) as response:
            cached.write_bytes(response.read())
    return Image.open(io.BytesIO(cached.read_bytes())).convert("RGB")


def render_map(center: tuple[float, float], output: Path, cache_dir: Path) -> None:
    center_x, center_y = world_pixel(*center)
    left = center_x - WIDTH / 2
    top = center_y - HEIGHT / 2
    right = center_x + WIDTH / 2
    bottom = center_y + HEIGHT / 2

    min_tile_x = math.floor(left / TILE_SIZE)
    max_tile_x = math.floor((right - 1) / TILE_SIZE)
    min_tile_y = math.floor(top / TILE_SIZE)
    max_tile_y = math.floor((bottom - 1) / TILE_SIZE)

    mosaic = Image.new(
        "RGB",
        ((max_tile_x - min_tile_x + 1) * TILE_SIZE, (max_tile_y - min_tile_y + 1) * TILE_SIZE),
        "white",
    )
    for tile_y in range(min_tile_y, max_tile_y + 1):
        for tile_x in range(min_tile_x, max_tile_x + 1):
            tile = download_tile(tile_x, tile_y, cache_dir)
            mosaic.paste(tile, ((tile_x - min_tile_x) * TILE_SIZE, (tile_y - min_tile_y) * TILE_SIZE))

    crop_left = round(left - min_tile_x * TILE_SIZE)
    crop_top = round(top - min_tile_y * TILE_SIZE)
    image = mosaic.crop((crop_left, crop_top, crop_left + WIDTH, crop_top + HEIGHT))
    image = ImageEnhance.Color(image).enhance(0.82)
    image = ImageEnhance.Brightness(image).enhance(1.04)
    image = ImageEnhance.Contrast(image).enhance(0.96)
    image.save(output, optimize=True)


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="siris-map-tiles-") as temp_dir:
        cache_dir = Path(temp_dir)
        for filename, center in MAPS.items():
            render_map(center, OUTPUT_DIR / filename, cache_dir)


if __name__ == "__main__":
    main()
