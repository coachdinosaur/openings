"""Detect and crop printed chessboards from prepared chapter page renders."""

from __future__ import annotations

import argparse
import json
import math
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
    # Two vertically aligned boards can create a false square between the
    # first board's bottom border and the next board's top border.
    return [
        candidate
        for candidate in deduped
        if not (
            any(abs(candidate[1] - other[3]) <= 2 for other in deduped if other is not candidate)
            and any(abs(candidate[3] - other[1]) <= 2 for other in deduped if other is not candidate)
        )
    ]


def crop_box(board: tuple[int, int, int, int], width: int, height: int) -> tuple[int, int, int, int]:
    x0, y0, x1, y1 = board
    return (max(0, x0 - 36), max(0, y0 - 9), min(width, x1 + 9), min(height, y1 + 38))


def write_contact_sheet(crops: list[tuple[str, Image.Image]], output: Path) -> None:
    """Write one review image so every detected board can be audited in one view."""
    if not crops:
        Image.new("RGB", (500, 100), "white").save(output, optimize=True)
        return
    columns = min(4, len(crops))
    cell_width = 250
    label_height = 28
    scaled = []
    for diagram_id, crop in crops:
        ratio = min(1.0, (cell_width - 20) / crop.width)
        scaled.append((diagram_id, crop.resize((round(crop.width * ratio), round(crop.height * ratio)))))
    row_heights = []
    for row in range(math.ceil(len(scaled) / columns)):
        row_items = scaled[row * columns : (row + 1) * columns]
        row_heights.append(max(image.height for _, image in row_items) + label_height + 16)
    sheet = Image.new("RGB", (columns * cell_width, sum(row_heights)), "white")
    y = 0
    for row, row_height in enumerate(row_heights):
        for column, (diagram_id, image) in enumerate(scaled[row * columns : (row + 1) * columns]):
            x = column * cell_width + (cell_width - image.width) // 2
            sheet.paste(image.convert("RGB"), (x, y + label_height))
            # Pillow's default font is sufficient for stable crop identifiers.
            from PIL import ImageDraw
            ImageDraw.Draw(sheet).text((column * cell_width + 8, y + 6), diagram_id, fill="black")
        y += row_height
    sheet.save(output, optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--prefix", required=True)
    parser.add_argument("--expected", required=True, type=int)
    args = parser.parse_args()

    pages = sorted(args.input.glob("printed-*.png"), key=lambda page: int(page.stem.removeprefix("printed-")))
    if not pages:
        raise SystemExit("No printed page PNGs found.")
    args.output.mkdir(parents=True, exist_ok=True)
    manifest: list[dict[str, object]] = []
    contact_sheet_crops: list[tuple[str, Image.Image]] = []
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
            cropped = image.crop(crop)
            cropped.save(output_path, optimize=True)
            contact_sheet_crops.append((diagram_id, cropped.copy()))
            manifest.append({"id": diagram_id, "page": page_path.stem, "boardBBox": board, "cropBBox": crop})
            next_id += 1

    if len(manifest) != args.expected:
        raise SystemExit(f"Expected {args.expected} boards, detected {len(manifest)}. Nothing was accepted as complete.")
    (args.output / "diagram-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    write_contact_sheet(contact_sheet_crops, args.output / "contact-sheet.png")
    print(f"Extracted {len(manifest)} board crops to {args.output}")


if __name__ == "__main__":
    main()
