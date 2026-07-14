"""Detect and crop printed chessboards from prepared chapter page renders."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image


def dark_runs(row: np.ndarray, minimum: int = 145) -> list[tuple[int, int]]:
    padded = np.pad(row.astype(np.int8), (1, 1))
    changes = np.diff(padded)
    starts = np.flatnonzero(changes == 1)
    ends = np.flatnonzero(changes == -1)
    return [(int(start), int(end - 1)) for start, end in zip(starts, ends) if end - start >= minimum]


def detect_boards(image: Image.Image) -> list[tuple[int, int, int, int]]:
    # The small overview board on index pages uses an anti-aliased grey border;
    # 180 catches it while square geometry filters out text rules.
    dark = np.asarray(image.convert("L")) < 180
    horizontal: list[tuple[int, int, int]] = []
    for y, row in enumerate(dark):
        horizontal.extend((y, x0, x1) for x0, x1 in dark_runs(row))

    candidates: list[tuple[int, int, int, int]] = []
    for top, x0, x1 in horizontal:
        width = x1 - x0 + 1
        if width > 340:
            continue
        for bottom, bx0, bx1 in horizontal:
            if bottom <= top:
                continue
            height = bottom - top + 1
            if abs(height - width) > 5 or abs(bx0 - x0) > 4 or abs(bx1 - x1) > 4:
                continue
            candidates.append((x0, top, x1 + 1, bottom + 1))

    deduped: list[tuple[int, int, int, int]] = []
    for candidate in sorted(candidates, key=lambda box: (box[1], box[0])):
        if any(max(abs(candidate[index] - existing[index]) for index in range(4)) <= 4 for existing in deduped):
            continue
        deduped.append(candidate)
    return deduped


def crop_box(board: tuple[int, int, int, int], width: int, height: int) -> tuple[int, int, int, int]:
    x0, y0, x1, y1 = board
    return (max(0, x0 - 36), max(0, y0 - 9), min(width, x1 + 9), min(height, y1 + 38))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--prefix", required=True)
    parser.add_argument("--expected", required=True, type=int)
    args = parser.parse_args()

    pages = sorted(args.input.glob("printed-*.png"))
    if not pages:
        raise SystemExit("No printed page PNGs found.")
    args.output.mkdir(parents=True, exist_ok=True)
    manifest: list[dict[str, object]] = []
    next_id = 1

    for page_index, page_path in enumerate(pages):
        image = Image.open(page_path)
        boards = detect_boards(image)
        if page_index == 0:
            boards.sort(key=lambda box: (0 if box[1] < image.height / 2 else 1, box[0]))
        else:
            boards.sort(key=lambda box: (0 if (box[0] + box[2]) / 2 < image.width / 2 else 1, box[1]))
        for board in boards:
            diagram_id = f"{args.prefix}-D{next_id:02d}"
            crop = crop_box(board, image.width, image.height)
            output_path = args.output / f"{diagram_id}.png"
            image.crop(crop).save(output_path, optimize=True)
            manifest.append({"id": diagram_id, "page": page_path.stem, "boardBBox": board, "cropBBox": crop})
            next_id += 1

    if len(manifest) != args.expected:
        raise SystemExit(f"Expected {args.expected} boards, detected {len(manifest)}. Nothing was accepted as complete.")
    (args.output / "diagram-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Extracted {len(manifest)} board crops to {args.output}")


if __name__ == "__main__":
    main()
