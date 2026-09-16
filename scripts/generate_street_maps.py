#!/usr/bin/env python3

import json
import math
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ZOOM = 15
TILE_SIZE = 256
SOURCE_WIDTH = 768
SOURCE_HEIGHT = 512
OUTPUT_WIDTH = 1536
OUTPUT_HEIGHT = 1024
OUTPUT_DIR = Path(__file__).resolve().parents[1] / "public" / "maps"
OVERPASS_URLS = (
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass-api.de/api/interpreter",
)

MAPS = {
    "siris-mia-street-map.png": (10.7339474, 106.7072669),
    "siris-lune-street-map.png": (10.7339006, 106.7079854),
}

ROAD_STYLES = {
    "motorway": (16, "#7f9daf", "#b4cddd"),
    "motorway_link": (10, "#8ba6b8", "#c1d6e3"),
    "trunk": (15, "#829eaf", "#b7cede"),
    "trunk_link": (10, "#91aaba", "#c4d8e4"),
    "primary": (12, "#9eafbc", "#dbe4e9"),
    "primary_link": (8, "#acbbc7", "#e0e7eb"),
    "secondary": (9, "#b5c2cc", "#edf0ee"),
    "secondary_link": (7, "#bbc8d1", "#edf0ee"),
    "tertiary": (6, "#c2ced8", "#f4f1e8"),
    "tertiary_link": (5, "#c2ced8", "#f4f1e8"),
    "residential": (3, "#cbd5de", "#f4f1e8"),
    "unclassified": (3, "#cbd5de", "#f4f1e8"),
    "service": (2, "#d2dbe2", "#f4f1e8"),
    "living_street": (2, "#d2dbe2", "#f4f1e8"),
}


def world_pixel(lat: float, lon: float) -> tuple[float, float]:
    scale = TILE_SIZE * (2**ZOOM)
    sin_lat = math.sin(math.radians(lat))
    x = (lon + 180.0) / 360.0 * scale
    y = (0.5 - math.log((1 + sin_lat) / (1 - sin_lat)) / (4 * math.pi)) * scale
    return x, y


def lat_lon_from_world(x: float, y: float) -> tuple[float, float]:
    scale = TILE_SIZE * (2**ZOOM)
    lon = x / scale * 360.0 - 180.0
    mercator_y = math.pi * (1 - 2 * y / scale)
    lat = math.degrees(math.atan(math.sinh(mercator_y)))
    return lat, lon


def fetch_map_data(centers: list[tuple[float, float]]) -> list[dict]:
    cache = Path(__file__).with_name('street-geometry.json')
    if cache.exists():
        return json.loads(cache.read_text())
    bounds = []
    for center in centers:
        center_x, center_y = world_pixel(*center)
        left = center_x - SOURCE_WIDTH / 2
        top = center_y - SOURCE_HEIGHT / 2
        bounds.append((left, top, left + SOURCE_WIDTH, top + SOURCE_HEIGHT))
    left = min(bound[0] for bound in bounds)
    top = min(bound[1] for bound in bounds)
    right = max(bound[2] for bound in bounds)
    bottom = max(bound[3] for bound in bounds)
    south, west = lat_lon_from_world(left, bottom)
    north, east = lat_lon_from_world(right, top)
    bbox = f"{south},{west},{north},{east}"
    query = f"""
    [out:json][timeout:40];
    (
      way[highway]({bbox});
      way[waterway]({bbox});
      way[natural=water]({bbox});
      way[leisure=park]({bbox});
      way[landuse=grass]({bbox});
    );
    out geom;
    """
    last_error = None
    for endpoint in OVERPASS_URLS:
        request = urllib.request.Request(
            endpoint,
            data=urllib.parse.urlencode({"data": query}).encode(),
            headers={"User-Agent": "SirisResidencesStaticMap/2.0 (info@siris.vn)"},
        )
        try:
            with urllib.request.urlopen(request, timeout=90) as response:
                elements = json.loads(response.read())["elements"]
            break
        except Exception as error:
            last_error = error
    else:
        raise RuntimeError("Unable to fetch OpenStreetMap data") from last_error
    if not elements:
        raise RuntimeError('Empty map response; existing assets have been preserved')
    cache.write_text(json.dumps(elements))
    return elements


def project(geometry: list[dict], left: float, top: float) -> list[tuple[float, float]]:
    scale_x = OUTPUT_WIDTH / SOURCE_WIDTH
    scale_y = OUTPUT_HEIGHT / SOURCE_HEIGHT
    points = []
    for node in geometry:
        x, y = world_pixel(node["lat"], node["lon"])
        points.append(((x - left) * scale_x, (y - top) * scale_y))
    return points


def line_length(points: list[tuple[float, float]]) -> float:
    return sum(math.dist(start, end) for start, end in zip(points, points[1:]))


def draw_road_label(image: Image.Image, text: str, points: list[tuple[float, float]], font: ImageFont.FreeTypeFont) -> None:
    segments = [(math.dist(start, end), start, end) for start, end in zip(points, points[1:])]
    length, start, end = max(segments, key=lambda segment: segment[0])
    if length < 28:
        return
    x = (start[0] + end[0]) / 2
    y = (start[1] + end[1]) / 2
    if not 80 < x < OUTPUT_WIDTH - 80 or not 50 < y < OUTPUT_HEIGHT - 50:
        return
    angle = math.degrees(math.atan2(end[1] - start[1], end[0] - start[0]))
    if angle > 90:
        angle -= 180
    elif angle < -90:
        angle += 180
    bbox = font.getbbox(text, stroke_width=3)
    label = Image.new("RGBA", (bbox[2] - bbox[0] + 16, bbox[3] - bbox[1] + 16), (0, 0, 0, 0))
    label_draw = ImageDraw.Draw(label)
    label_draw.text(
        (8 - bbox[0], 8 - bbox[1]),
        text,
        font=font,
        fill="#64717a",
        stroke_width=3,
        stroke_fill="#ffffff",
    )
    label = label.rotate(-angle, resample=Image.Resampling.BICUBIC, expand=True)
    image.paste(label, (round(x - label.width / 2), round(y - label.height / 2)), label)


def render_map(center: tuple[float, float], elements: list[dict], output: Path) -> None:
    center_x, center_y = world_pixel(*center)
    left = center_x - SOURCE_WIDTH / 2
    top = center_y - SOURCE_HEIGHT / 2
    image = Image.new("RGB", (OUTPUT_WIDTH, OUTPUT_HEIGHT), "#f4f1e8")
    draw = ImageDraw.Draw(image)
    water_areas, waterways, green_areas, roads = [], [], [], []

    for element in elements:
        geometry = element.get("geometry", [])
        if len(geometry) < 2:
            continue
        tags = element.get("tags", {})
        if tags.get("natural") == "water" and geometry[0] == geometry[-1]:
            water_areas.append(geometry)
        elif (tags.get("leisure") == "park" or tags.get("landuse") == "grass") and geometry[0] == geometry[-1]:
            green_areas.append(geometry)
        elif "waterway" in tags:
            waterways.append((geometry, tags.get("waterway")))
        elif "highway" in tags:
            roads.append((geometry, tags.get("highway"), tags.get("name") or tags.get("name:vi"), int(tags.get('layer', '0'))))

    for geometry in green_areas:
        draw.polygon(project(geometry, left, top), fill="#d7f1df")
    for geometry in water_areas:
        draw.polygon(project(geometry, left, top), fill="#95d9e8")
    for geometry, waterway_type in waterways:
        width = 9 if waterway_type in {"river", "canal"} else 4
        draw.line(project(geometry, left, top), fill="#95d9e8", width=width, joint="curve")

    road_priority = list(reversed(list(ROAD_STYLES)))
    roads.sort(key=lambda road: road_priority.index(road[1]) if road[1] in road_priority else -1)
    label_candidates = {}
    # Draw all casings before the fills within each layer/type so adjoining
    # segments meet without a seam; bridges remain above surface roads.
    for layer in sorted({road[3] for road in roads}):
        for road_type in road_priority:
            group = [road for road in roads if road[1] == road_type and road[3] == layer]
            width, casing, fill = ROAD_STYLES[road_type]
            for color, stroke in [(casing, width), (fill, max(1, width - 3))]:
                if width <= 3 and color == fill:
                    continue
                for geometry, _, _, _ in group:
                    draw.line(project(geometry, left, top), fill=color, width=stroke, joint='curve')
    for geometry, road_type, road_name, _ in roads:
        style = ROAD_STYLES.get(road_type)
        if not style:
            continue
        width, casing, fill = style
        points = project(geometry, left, top)
        if road_name and road_type in {"motorway", "trunk", "primary", "secondary"}:
            length = line_length(points)
            if length > label_candidates.get(road_name, (0, []))[0]:
                label_candidates[road_name] = (length, points)

    font_path = "/System/Library/Fonts/Supplemental/Arial.ttf"
    font = ImageFont.truetype(font_path, 20)
    # Main street labels are rendered by React, remaining legible on mobile.

    image.save(output, optimize=True)


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    elements = fetch_map_data(list(MAPS.values()))
    for filename, center in MAPS.items():
        render_map(center, elements, OUTPUT_DIR / filename)


if __name__ == "__main__":
    main()
