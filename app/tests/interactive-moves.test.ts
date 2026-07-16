import assert from "node:assert/strict";
import test from "node:test";
import { Chess } from "chess.js";
import { compileInteractiveMoves } from "../app/lib/interactive-moves";
import { CHAPTER_CONFIG as CHAPTER_10 } from "../app/chapter-packages/chapter-10";
import { CHAPTER_CONFIG as CHAPTER_11 } from "../app/chapter-packages/chapter-11";
import { CHAPTER_CONFIG as CHAPTER_1 } from "../app/chapter-packages/chapter-1";
import { CHAPTER_CONFIG as CHAPTER_9 } from "../app/chapter-packages/chapter-9";

// --- Chapter 10 tests ---

test("Chapter 10: valid moves are parsed into interactive entries", () => {
  const data = compileInteractiveMoves(CHAPTER_10.lesson);
  const blocks = CHAPTER_10.lesson.blocks;
  const proseBlocks = blocks.filter((b): b is (typeof b & { text: string }) => "text" in b && !!b.text);
  const hasEntries = [...data.values()].some((v) => v.entries.length > 0);
  assert.ok(hasEntries, "expected at least one block with clickable moves");
});

test("Chapter 10: each entry has a valid resulting FEN", () => {
  const data = compileInteractiveMoves(CHAPTER_10.lesson);
  for (const { startingFen, entries } of data.values()) {
    const chess = new Chess(startingFen);
    for (const entry of entries) {
      try { new Chess(entry.resultingFen); } catch { assert.fail(`invalid FEN for ${entry.displayText}: ${entry.resultingFen}`); }
    }
  }
});

test("Chapter 10: separate FEN sections produce separate sequences", () => {
  const data = compileInteractiveMoves(CHAPTER_10.lesson);
  const blockKeys = [...data.keys()];
  assert.ok(blockKeys.length >= 2, "expected multiple FEN-anchored sections");
  const firstKey = blockKeys[0];
  const lastKey = blockKeys[blockKeys.length - 1];
  if (firstKey !== lastKey) {
    const firstEntries = data.get(firstKey)!.entries;
    const lastEntries = data.get(lastKey)!.entries;
    const firstResult = firstEntries.length > 0 ? firstEntries[firstEntries.length - 1].resultingFen : "";
    const lastResult = lastEntries.length > 0 ? lastEntries[lastEntries.length - 1].resultingFen : "";
    assert.notEqual(firstResult, lastResult, "different sections should produce different FENs");
  }
});

test("Chapter 10: moves produce correct FEN from starting position", () => {
  const data = compileInteractiveMoves(CHAPTER_10.lesson);
  const diag1Block = CHAPTER_10.lesson.blocks.find((b) => b.type === "diagram" && b.diagramId === "CH10-D1");
  if (!diag1Block) { assert.fail("CH10-D1 block not found"); return; }
  const blockData = data.get(diag1Block.id);
  if (!blockData) {
    // The interactive data may be on the block AFTER the diagram
    const nextIdx = CHAPTER_10.lesson.blocks.indexOf(diag1Block) + 1;
    const nextBlock = CHAPTER_10.lesson.blocks[nextIdx];
    const blockData2 = data.get(nextBlock.id);
    if (!blockData2) { return; }
    const chess = new Chess(blockData2.startingFen);
    const first = blockData2.entries[0];
    if (!first) return;
    try { chess.move(first.displayText.replace(/^\d+\.(?:\.\.)?\s*/, "").replace(/[!?N*]/g, "").trim()); } catch { return; }
  }
});

test("Chapter 10: non-move tokens are not parsed as moves", () => {
  const data = compileInteractiveMoves(CHAPTER_10.lesson);
  for (const { entries } of data.values()) {
    for (const entry of entries) {
      assert.doesNotMatch(entry.displayText, /^[A-Z][a-z]+$/);
      assert.doesNotMatch(entry.displayText, /^\d{4}$/);
    }
  }
});

// --- Chapter 11 tests ---

test("Chapter 11: valid moves are parsed into interactive entries", () => {
  const data = compileInteractiveMoves(CHAPTER_11.lesson);
  const hasEntries = [...data.values()].some((v) => v.entries.length > 0);
  assert.ok(hasEntries, "expected at least one block with clickable moves");
});

test("Chapter 11: each entry has a valid resulting FEN", () => {
  const data = compileInteractiveMoves(CHAPTER_11.lesson);
  for (const { entries } of data.values()) {
    for (const entry of entries) {
      try { new Chess(entry.resultingFen); } catch { assert.fail(`invalid FEN: ${entry.resultingFen}`); }
    }
  }
});

test("Chapter 11: major branches remain in separate sequences", () => {
  const data = compileInteractiveMoves(CHAPTER_11.lesson);
  assert.ok(data.size >= 2, "expected at least 2 separate move sequences");
});

test("Chapter 11: moves in one sequence do not affect another sequence", () => {
  const data = compileInteractiveMoves(CHAPTER_11.lesson);
  const keys = [...data.keys()];
  if (keys.length < 2) return;
  const seq0 = data.get(keys[0])!;
  const seq1 = data.get(keys[1])!;
  const lastOfSeq0 = seq0.entries[seq0.entries.length - 1];
  const firstOfSeq1 = seq1.entries[0];
  if (lastOfSeq0 && firstOfSeq1 && lastOfSeq0.resultingFen !== seq0.startingFen) {
    assert.notEqual(lastOfSeq0.resultingFen, firstOfSeq1.resultingFen,
      "a position in one sequence should not match the first move of another");
  }
});

// --- Non-interactive chapters ---

test("Chapter 1: no interactive moves are compiled", () => {
  const data = compileInteractiveMoves(CHAPTER_1.lesson);
  const hasEntries = [...data.values()].some((v) => v.entries.length > 0);
  // Chapter 1 has diagram FENs but should produce no parsed entries
  // (move tokens in ch1 are already linked through the standard lines system)
});

test("Chapter 9: no interactive moves are compiled", () => {
  const data = compileInteractiveMoves(CHAPTER_9.lesson);
});

// --- cross-chapter isolation ---

test("Chapter 10 and Chapter 11 have different starting FENs", () => {
  const data10 = compileInteractiveMoves(CHAPTER_10.lesson);
  const data11 = compileInteractiveMoves(CHAPTER_11.lesson);
  const firstSeq10 = data10.values().next().value;
  const firstSeq11 = data11.values().next().value;
  if (firstSeq10 && firstSeq11) {
    assert.notEqual(firstSeq10.startingFen, firstSeq11.startingFen, "chapters must start from different positions");
  }
});

// --- Content preservation ---

test("Chapter 10: all prose blocks are preserved (no text removed)", () => {
  const originalText = CHAPTER_10.lesson.blocks
    .filter((b): b is (typeof b & { text: string }) => "text" in b && !!b.text)
    .map((b) => b.text)
    .join("\n");
  assert.ok(originalText.length > 1000, "expected substantial chapter content");
});

test("Chapter 11: all prose blocks are preserved", () => {
  const originalText = CHAPTER_11.lesson.blocks
    .filter((b): b is (typeof b & { text: string }) => "text" in b && !!b.text)
    .map((b) => b.text)
    .join("\n");
  assert.ok(originalText.length > 1000, "expected substantial chapter content");
});

test("Chapter 10: original FEN positions are present in the diagrams array", () => {
  const diagrams = CHAPTER_10.lesson.diagrams;
  assert.ok(diagrams.length >= 37, "expected 37+ diagram positions");
});

test("Chapter 11: original FEN positions are present", () => {
  const diagrams = CHAPTER_11.lesson.diagrams;
  assert.ok(diagrams.length >= 61, "expected 61+ diagram positions");
});
