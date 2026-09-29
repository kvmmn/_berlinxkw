#!/usr/bin/env python3
"""Extract dark bear silhouette from logo.png and vectorize with potrace."""
from __future__ import annotations

import re
import subprocess
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "logo.png"
OUT_SVG = ROOT / "public" / "brand" / "logo-mark-flat.svg"
TMP_PBM = ROOT / "scripts" / ".logo-mark-mask.pbm"
COMPARE = ROOT / "scripts" / ".logo-compare.png"
ARTIFACT_COMPARE = Path("/opt/cursor/artifacts/logo-mark-comparison-large.png")


def build_bear_mask(arr: np.ndarray) -> np.ndarray:
    r = arr[:, :, 0].astype(np.int16)
    g = arr[:, :, 1].astype(np.int16)
    b = arr[:, :, 2].astype(np.int16)

    # Pure / near-black letterbox padding
    black_bg = (r < 22) & (g < 22) & (b < 22)
    # Lime orb / glow — require strong green so grey bear pixels are kept
    chroma = g - (r + b) // 2
    greenish = (g > 95) & (chroma > 18)
    luminance = 0.299 * r + 0.587 * g + 0.114 * b
    bear = (luminance < 95) & (~black_bg) & (~greenish)
    return (bear.astype(np.uint8) * 255)


def largest_component(mask: np.ndarray) -> np.ndarray:
    h, w = mask.shape
    visited = np.zeros_like(mask, dtype=bool)
    best: list[tuple[int, int]] = []

    for y0 in range(h):
        for x0 in range(w):
            if mask[y0, x0] <= 127 or visited[y0, x0]:
                continue
            q: deque[tuple[int, int]] = deque([(x0, y0)])
            visited[y0, x0] = True
            comp: list[tuple[int, int]] = []
            while q:
                x, y = q.popleft()
                comp.append((x, y))
                for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and not visited[ny, nx] and mask[ny, nx] > 127:
                        visited[ny, nx] = True
                        q.append((nx, ny))
            if len(comp) > len(best):
                best = comp

    out = np.zeros_like(mask)
    for x, y in best:
        out[y, x] = 255
    return out


def fill_holes(mask: np.ndarray) -> np.ndarray:
    """Fill interior holes (eyes / mouth negative space stays if connected to edge)."""
    h, w = mask.shape
    outside = np.zeros((h, w), dtype=bool)
    q: deque[tuple[int, int]] = deque()
    for x in range(w):
        if mask[0, x] <= 127:
            q.append((x, 0))
            outside[0, x] = True
        if mask[h - 1, x] <= 127:
            q.append((x, h - 1))
            outside[h - 1, x] = True
    for y in range(h):
        if mask[y, 0] <= 127:
            q.append((0, y))
            outside[y, 0] = True
        if mask[y, w - 1] <= 127:
            q.append((w - 1, y))
            outside[y, w - 1] = True
    while q:
        x, y = q.popleft()
        for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not outside[ny, nx] and mask[ny, nx] <= 127:
                outside[ny, nx] = True
                q.append((nx, ny))
    filled = mask.copy()
    filled[~outside & (mask <= 127)] = 255
    return filled


def crop_to_content(mask: np.ndarray, padding: int = 10) -> np.ndarray:
    ys, xs = np.where(mask > 0)
    if len(xs) == 0:
        return mask
    y0, y1 = max(0, ys.min() - padding), min(mask.shape[0], ys.max() + padding + 1)
    x0, x1 = max(0, xs.min() - padding), min(mask.shape[1], xs.max() + padding + 1)
    return mask[y0:y1, x0:x1]


def mask_to_pbm(mask: np.ndarray, path: Path) -> None:
    h, w = mask.shape
    with path.open("wb") as f:
        f.write(f"P4\n{w} {h}\n".encode())
        for y in range(h):
            row = mask[y]
            packed = bytearray((w + 7) // 8)
            for x in range(w):
                if row[x] > 127:
                    packed[x // 8] |= 128 >> (x % 8)
            f.write(packed)


def simplify_svg(svg_text: str) -> str:
    svg_text = svg_text.replace('fill="#000000"', 'fill="#000000"')
    svg_text = re.sub(r'\s(width|height)="[^"]*"', "", svg_text, count=2)
    svg_text = svg_text.replace('stroke="none"', "")
    return svg_text


def silhouette_from_mask(mask: np.ndarray, size: int) -> Image.Image:
    """Black bear on transparent for overlay compare."""
    rgba = np.zeros((mask.shape[0], mask.shape[1], 4), dtype=np.uint8)
    rgba[mask > 127] = (20, 20, 18, 255)
    img = Image.fromarray(rgba, "RGBA")
    return img.resize((size, size), Image.Resampling.LANCZOS)


def main() -> int:
    img = Image.open(SRC).convert("RGB")
    arr = np.array(img)
    mask = build_bear_mask(arr)
    mask = largest_component(mask)
    mask = fill_holes(mask)
    mask = crop_to_content(mask, padding=14)
    mask_to_pbm(mask, TMP_PBM)

    subprocess.run(
        [
            "potrace",
            str(TMP_PBM),
            "-s",
            "-o",
            str(OUT_SVG),
            "--turdsize",
            "4",
            "--alphamax",
            "0.8",
            "--opttolerance",
            "0.25",
            "--longcurve",
        ],
        check=True,
    )

    svg = OUT_SVG.read_text()
    svg = simplify_svg(svg)
    if 'aria-hidden' not in svg:
        svg = svg.replace("<svg ", '<svg aria-hidden="true" ', 1)
    OUT_SVG.write_text(svg)

    compare_h = 520
    orig_crop = silhouette_from_mask(mask, compare_h)
    vec_png = ROOT / "scripts" / ".logo-mark-render.png"
    subprocess.run(
        [
            "convert",
            "-background",
            "none",
            str(OUT_SVG),
            "-resize",
            f"{compare_h}x{compare_h}",
            str(vec_png),
        ],
        check=True,
    )
    vec = Image.open(vec_png).convert("RGBA")
    bg = (243, 243, 239, 255)
    sheet = Image.new("RGBA", (compare_h * 2 + 80, compare_h + 100), bg)
    sheet.paste(orig_crop, (30, 70), orig_crop)
    sheet.paste(vec, (compare_h + 50, 70), vec)
    sheet.save(COMPARE)
    ARTIFACT_COMPARE.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(ARTIFACT_COMPARE)
    print(f"Wrote {OUT_SVG}")
    print(f"Wrote {COMPARE}")
    print(f"Wrote {ARTIFACT_COMPARE}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
