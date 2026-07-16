"""Split a verified combined chapter PDF into immutable per-chapter source inputs."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from pypdf import PdfReader, PdfWriter


def parse_ranges(value: str, page_count: int) -> list[dict[str, int]]:
    try:
        ranges = json.loads(value)
    except json.JSONDecodeError as error:
        raise SystemExit(f"Invalid --ranges JSON: {error}") from error
    if not isinstance(ranges, list) or not ranges:
        raise SystemExit("--ranges must be a non-empty JSON array")

    expected_page = 1
    parsed: list[dict[str, int]] = []
    for entry in ranges:
        if not isinstance(entry, dict):
            raise SystemExit("Each source range must be an object")
        chapter = entry.get("chapter")
        page_start = entry.get("pageStart")
        page_end = entry.get("pageEnd")
        if not all(isinstance(value, int) for value in (chapter, page_start, page_end)):
            raise SystemExit("Source ranges need integer chapter, pageStart, and pageEnd fields")
        if chapter < 1 or page_start != expected_page or page_end < page_start or page_end > page_count:
            raise SystemExit(f"Invalid contiguous source range for Chapter {chapter}")
        parsed.append({"chapter": chapter, "pageStart": page_start, "pageEnd": page_end})
        expected_page = page_end + 1

    if expected_page != page_count + 1:
        raise SystemExit(f"Source ranges end at page {expected_page - 1}, expected {page_count}")
    return parsed


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--ranges", required=True)
    args = parser.parse_args()

    reader = PdfReader(args.input)
    ranges = parse_ranges(args.ranges, len(reader.pages))
    args.output_dir.mkdir(parents=True, exist_ok=True)

    for entry in ranges:
        target = args.output_dir / f"Chapter{entry['chapter']}_Catalan.pdf"
        writer = PdfWriter()
        for page_index in range(entry["pageStart"] - 1, entry["pageEnd"]):
            writer.add_page(reader.pages[page_index])
        with target.open("wb") as output:
            writer.write(output)


if __name__ == "__main__":
    main()
