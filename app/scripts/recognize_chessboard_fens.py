"""Recognize source-board FENs using verified crops from earlier chapters."""

from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from pathlib import Path

import numpy as np
from PIL import Image

from extract_chessboard_crops import detect_boards


PIECES = "PNBRQKpnbrqk"


def square_feature(pixels: np.ndarray) -> np.ndarray:
    """Combine a small tone map with HOG edges to suppress board hatching."""
    tone = pixels.reshape(12, 2, 12, 2).mean(axis=(1, 3)).reshape(-1)
    gx = np.zeros_like(pixels)
    gy = np.zeros_like(pixels)
    gx[:, 1:-1] = pixels[:, 2:] - pixels[:, :-2]
    gy[1:-1, :] = pixels[2:, :] - pixels[:-2, :]
    magnitude = np.sqrt(gx * gx + gy * gy)
    angle = np.mod(np.arctan2(gy, gx), np.pi)
    bins = np.minimum((angle * 8 / np.pi).astype(int), 7)
    histogram = []
    for row in range(4):
        for column in range(4):
            region_bins = bins[row * 6 : (row + 1) * 6, column * 6 : (column + 1) * 6]
            region_magnitude = magnitude[row * 6 : (row + 1) * 6, column * 6 : (column + 1) * 6]
            histogram.extend(float(region_magnitude[region_bins == value].sum()) for value in range(8))
    edge = np.asarray(histogram, dtype=np.float32)
    edge /= np.linalg.norm(edge) + 1e-6
    return np.concatenate((tone, edge))


def fen_labels(fen: str) -> list[str]:
    labels: list[str] = []
    for rank in fen.split()[0].split("/"):
        for token in rank:
            if token.isdigit():
                labels.extend("." for _ in range(int(token)))
            else:
                labels.append(token)
    if len(labels) != 64:
        raise ValueError(f"Invalid FEN: {fen}")
    return labels


def board_squares(path: Path, size: int = 24) -> list[np.ndarray]:
    image = Image.open(path).convert("L")
    boards = detect_boards(image)
    if not boards:
        raise ValueError(f"No board detected in {path}")
    x0, y0, x1, y1 = max(boards, key=lambda box: (box[2] - box[0]) * (box[3] - box[1]))
    # Drop the outer rule and normalize every square to a fixed feature grid.
    x0, y0, x1, y1 = x0 + 1, y0 + 1, x1 - 1, y1 - 1
    width, height = x1 - x0, y1 - y0
    squares = []
    for rank in range(8):
        for file in range(8):
            left = round(x0 + file * width / 8)
            right = round(x0 + (file + 1) * width / 8)
            top = round(y0 + rank * height / 8)
            bottom = round(y0 + (rank + 1) * height / 8)
            square = image.crop((left, top, right, bottom)).resize((size, size), Image.Resampling.BILINEAR)
            squares.append(square_feature(np.asarray(square, dtype=np.float32) / 255.0))
    return squares


def chapter_number(crop: str) -> int:
    match = re.search(r"chapter(\d+)", crop)
    if not match:
        raise ValueError(f"Crop has no chapter number: {crop}")
    return int(match.group(1))


def build_templates(samples: list[tuple[np.ndarray, str, int]]) -> dict[int, tuple[np.ndarray, np.ndarray]]:
    grouped: dict[tuple[int, str], list[np.ndarray]] = defaultdict(list)
    for feature, label, parity in samples:
        grouped[(parity, label)].append(feature)
    templates: dict[int, tuple[np.ndarray, np.ndarray]] = {}
    for parity in (0, 1):
        features = []
        labels = []
        for label in "." + PIECES:
            values = grouped[(parity, label)]
            if not values:
                continue
            features.append(np.mean(values, axis=0))
            labels.append(label)
        templates[parity] = (np.stack(features).reshape(len(features), -1), np.asarray(labels))
    return templates


def classify_many(features: list[np.ndarray], parities: list[int], templates: dict[int, tuple[np.ndarray, np.ndarray]]) -> tuple[list[str], list[float]]:
    predictions = [""] * len(features)
    margins = [0.0] * len(features)
    for parity in (0, 1):
        indices = [index for index, value in enumerate(parities) if value == parity]
        if not indices:
            continue
        matrix = np.stack([features[index] for index in indices]).reshape(len(indices), -1)
        reference, reference_labels = templates[parity]
        distances = (
            np.sum(matrix * matrix, axis=1, keepdims=True)
            + np.sum(reference * reference, axis=1)[None, :]
            - 2 * matrix @ reference.T
        ) / matrix.shape[1]
        class_labels = sorted(set(reference_labels))
        class_scores = np.stack([np.min(distances[:, reference_labels == label], axis=1) for label in class_labels], axis=1)
        order = np.argsort(class_scores, axis=1)
        for row, output_index in enumerate(indices):
            predictions[output_index] = class_labels[order[row, 0]]
            margins[output_index] = float(class_scores[row, order[row, 1]] - class_scores[row, order[row, 0]])
    return predictions, margins


def labels_to_fen(labels: list[str]) -> str:
    ranks = []
    for start in range(0, 64, 8):
        rank = ""
        empty = 0
        for label in labels[start : start + 8]:
            if label == ".":
                empty += 1
            else:
                if empty:
                    rank += str(empty)
                    empty = 0
                rank += label
        if empty:
            rank += str(empty)
        ranks.append(rank)
    return "/".join(ranks) + " w - - 0 1"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--training", required=True, type=Path)
    parser.add_argument("--repo", required=True, type=Path)
    parser.add_argument("--predict", action="append", default=[], type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()

    records = json.loads(args.training.read_text(encoding="utf-8-sig"))
    by_chapter: dict[int, list[tuple[np.ndarray, str, int]]] = defaultdict(list)
    all_samples: list[tuple[np.ndarray, str, int]] = []
    for record in records:
        crop_path = args.repo / "app" / "public" / record["crop"].lstrip("/")
        labels = fen_labels(record["fen"])
        chapter = chapter_number(record["crop"])
        for index, (feature, label) in enumerate(zip(board_squares(crop_path), labels)):
            sample = (feature, label, (index // 8 + index % 8) % 2)
            by_chapter[chapter].append(sample)
            all_samples.append(sample)

    for holdout in sorted(by_chapter):
        training = [sample for chapter, samples in by_chapter.items() if chapter != holdout for sample in samples]
        templates = build_templates(training)
        holdout_samples = by_chapter[holdout]
        predicted, _ = classify_many([sample[0] for sample in holdout_samples], [sample[2] for sample in holdout_samples], templates)
        correct = sum(prediction == sample[1] for prediction, sample in zip(predicted, holdout_samples))
        total = len(by_chapter[holdout])
        mistakes = defaultdict(int)
        for prediction, sample in zip(predicted, holdout_samples):
            if prediction != sample[1]:
                mistakes[(sample[1], prediction)] += 1
        detail = ", ".join(f"{actual}->{predicted}: {count}" for (actual, predicted), count in sorted(mistakes.items()))
        print(f"Chapter {holdout} holdout accuracy: {correct}/{total} ({correct / total:.2%}){f' [{detail}]' if detail else ''}")

    templates = build_templates(all_samples)
    print(f"Prediction templates: Chapters {min(by_chapter)}-{max(by_chapter)}")
    output = []
    for directory in args.predict:
        for crop_path in sorted(directory.glob("CH*-D*.png"), key=lambda item: int(re.search(r"D(\d+)", item.stem).group(1))):
            features = board_squares(crop_path)
            parities = [(index // 8 + index % 8) % 2 for index in range(64)]
            labels, margins = classify_many(features, parities, templates)
            output.append({"id": crop_path.stem, "fen": labels_to_fen(labels), "minimumMargin": min(margins), "meanMargin": sum(margins) / len(margins)})
    args.output.write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")
    print(f"Recognized {len(output)} source boards.")


if __name__ == "__main__":
    main()
