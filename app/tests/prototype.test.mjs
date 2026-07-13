import assert from "node:assert/strict";
import crypto from "node:crypto";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
import { Chess } from "chess.js";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const root = new URL("../", import.meta.url);

async function loadLesson() {
  const source = await readFile(new URL("app/b2-lesson.ts", root), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);
}

function canonicalize(value) {
  const excluded = new Set(["timestamp", "generatedId", "absolutePath", "importRunId", "machineName", "userName", "temporaryPath"]);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).filter(([key]) => !excluded.has(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonicalize(item)}`).join(",")}}`;
  return JSON.stringify(value);
}

function linePrefix(lesson, line) {
  if (!line.parentLineId) return [];
  const parent = lesson.lines.find((candidate) => candidate.id === line.parentLineId);
  return [...linePrefix(lesson, parent), ...parent.moves.slice(0, line.parentPly)];
}

function linePath(lesson, line) {
  return [...linePrefix(lesson, line), ...line.moves];
}

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("server renders the complete Chapter 1 learner view with editor tools hidden", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Complete Chapter 1/);
  assert.match(html, /This is our starting position for the Catalan/);
  assert.match(html, /A\) 4\.\.\.g6/);
  assert.match(html, /B1\) 8\.\.\.Re8/);
  assert.match(html, /C\) 4\.\.\.c5/);
  assert.match(html, /C22\)/);
  assert.match(html, /6\.\.\.cxd4/);
  assert.match(html, /7\.Nxd4/);
  assert.match(html, /Conclusion/);
  assert.match(html, /This seems like the only move that demands any real accuracy from White/);
  assert.match(html, /White(?:’|&#x2019;)s chances are definitely preferable/);
  assert.match(html, /Editor mode/);
  assert.doesNotMatch(html, />Source review</);
  assert.doesNotMatch(html, />Re-import</);
});

test("packages every printed Chapter 1 page 8 through 23 in verified source order", async () => {
  const source = await readFile(new URL("app/chapter1-lesson.ts", root), "utf8");
  const cSource = await readFile(new URL("app/chapter1-c-section.ts", root), "utf8");
  for (const passage of [
    "This is our starting position for the Catalan",
    "A) 4...g6",
    "A1) 7...Nc6 8.Rd1",
    "A2) 7...Na6 8.Rd1",
    "A3) 7...Nbd7",
    "B) 4...c6",
    "B1) 8...Re8 9.e4",
  ]) assert.match(source, new RegExp(passage.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  for (const passage of ["C) 4...c5", "C1) 5...Be7", "C2) 5...Nc6 6.O-O", "C21) 6...Be7 7.dxc5 Bxc5", "C22) 6...cxd4 7.Nxd4", "Conclusion"]) assert.match(cSource, new RegExp(passage.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  await Promise.all(Array.from({ length: 16 }, (_, index) => index + 8).map((page) => access(new URL(`public/source/pages/printed-${String(page).padStart(2, "0")}.png`, root))));
  assert.match(source, /blocks: \[\.\.\.prefixBlocks, \.\.\.b2Blocks, \.\.\.C_BLOCKS\]/);
  for (const heading of ["a-heading", "a1-heading", "a2-heading", "a3-heading", "b-heading", "b1-heading", "b2-heading"]) {
    assert.match(source, new RegExp(`${heading}[\\s\\S]{0,220}moveRefs`), `${heading} should link its moves`);
  }
  for (const heading of ["c-heading", "c1-heading", "c2-heading", "c21-heading", "c22-heading"]) assert.match(cSource, new RegExp(`${heading}[\\s\\S]{0,260}moveRefs`));
});

test("preserves the verified two-column reading order and complete B2 boundary", async () => {
  const { B2_LESSON } = await loadLesson();
  assert.deepEqual(B2_LESSON.sourceSpans.map((span) => [span.printedPage, span.column, span.order]), [[13, "left", 1], [13, "right", 2], [14, "left", 3]]);
  assert.equal(B2_LESSON.blocks.length, 20);
  const text = B2_LESSON.blocks.filter((block) => "text" in block).map((block) => block.text).join("\n");
  for (const expected of ["Olszewski – Hadzimanolis, Peristeri 2010", "Filippov – Tunik, Novgorod 1995", "Another interesting continuation is", "leaves White strongly centralized", "White’s chances are definitely preferable"] ) assert.match(text, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(text, /C\) 4\.\.\.c5|popular move order|C1\) 5/);
});

test("validates every source variation and linked diagram position", async () => {
  const { B2_LESSON } = await loadLesson();
  for (const line of B2_LESSON.lines) {
    const board = new Chess(B2_LESSON.basePosition.fen);
    for (const move of linePath(B2_LESSON, line)) assert.doesNotThrow(() => board.move(move.san), `${line.id}: ${move.san}`);
  }
  for (const diagram of B2_LESSON.diagrams) {
    if (!diagram.lineId) { assert.equal(diagram.fen, B2_LESSON.basePosition.fen); continue; }
    const line = B2_LESSON.lines.find((candidate) => candidate.id === diagram.lineId);
    const prefix = linePrefix(B2_LESSON, line);
    const board = new Chess(B2_LESSON.basePosition.fen);
    for (const move of [...prefix, ...line.moves.slice(0, diagram.moveIndex + 1)]) board.move(move.san);
    assert.equal(board.fen(), diagram.fen, diagram.id);
  }
});

test("separates canonical SAN from source annotations and promotions", async () => {
  const { B2_LESSON } = await loadLesson();
  const moves = new Map(B2_LESSON.lines.flatMap((line) => line.moves).map((move) => [move.id, move]));
  assert.deepEqual({ san: moves.get("b2-main-10b-d4").san, source: moves.get("b2-main-10b-d4").sourceToken, annotation: moves.get("b2-main-10b-d4").annotation }, { san: "d4", source: "d4!?N", annotation: { punctuation: "!?", novelty: "N" } });
  assert.equal(moves.get("b2-nxe5-14w").san, "Nb3");
  assert.equal(moves.get("b2-nxe5-14w").sourceToken, "♘b3!N");
  assert.equal(moves.get("b2-exf6-13w").san, "gxf8=Q+");
  assert.equal(moves.get("b2-main-17w-b4").annotation.evaluation, "±");
});

test("matches the fixed canonical lesson snapshot and source PDF", async () => {
  const { B2_LESSON } = await loadLesson();
  const canonicalSource = await readFile(new URL("app/canonical.ts", root), "utf8");
  const expected = canonicalSource.match(/EXPECTED_B2_LESSON_HASH = "([A-F0-9]{64})"/)?.[1];
  const actual = crypto.createHash("sha256").update(canonicalize(B2_LESSON)).digest("hex").toUpperCase();
  assert.equal(actual, expected);
  const pdf = await readFile(new URL("../Chapter1_Catalan.pdf", root));
  assert.equal(crypto.createHash("sha256").update(pdf).digest("hex").toUpperCase(), B2_LESSON.source.sha256);
});

test("re-extracts the three verified PDF regions with their source anchors", async () => {
  const { B2_LESSON } = await loadLesson();
  const bytes = await readFile(new URL("../Chapter1_Catalan.pdf", root));
  const pdf = await getDocument({ data: new Uint8Array(bytes) }).promise;
  const anchors = {
    "chapter1-p13-left-b2": ["B2)", "This seems like the only move", "9.e4"],
    "chapter1-p13-right-b2": ["The only serious alternative", "This new move", "Another interesting continuation"],
    "chapter1-p14-left-b2": ["seems less convincing", "leaves White strongly centralized"],
  };
  const extracted = [];
  for (const span of B2_LESSON.sourceSpans) {
    const page = await pdf.getPage(span.pageIndex + 1);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const text = content.items.filter((item) => "str" in item && "transform" in item).map((item) => ({ str: item.str, x: item.transform[4], top: viewport.height - item.transform[5] })).filter((item) => item.x >= span.bbox.x0 - 8 && item.x <= span.bbox.x1 + 8 && item.top >= span.bbox.top - 18 && item.top <= span.bbox.bottom + 18).sort((left, right) => Math.abs(left.top - right.top) < 2 ? left.x - right.x : left.top - right.top).map((item) => item.str).join(" ").replace(/\s+/g, " ");
    for (const anchor of anchors[span.id]) assert.match(text, new RegExp(anchor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${span.id}: ${anchor}`);
    extracted.push(span.id);
  }
  assert.deepEqual(extracted, ["chapter1-p13-left-b2", "chapter1-p13-right-b2", "chapter1-p14-left-b2"]);
  pdf.cleanup();
});

test("packages evidence, enforces 64 equal squares, and preserves local review migration", async () => {
  const pieces = ["bB", "bK", "bN", "bP", "bQ", "bR", "wB", "wK", "wN", "wP", "wQ", "wR"];
  await Promise.all(pieces.map((piece) => access(new URL(`public/assets/pieces/mpchess/${piece}.svg`, root))));
  await Promise.all(["B2-D01.png", "B2-D02.png", "B2-D03.png", "b2-heading-and-first-move.png", "b2-right-column.png", "b2-page14-left.png"].map((file) => access(new URL(`public/source/crops/${file}`, root))));
  const [app, css, launcher] = await Promise.all([readFile(new URL("app/CatalanApp.tsx", root), "utf8"), readFile(new URL("app/globals.css", root), "utf8"), readFile(new URL("../start-local.ps1", root), "utf8")]);
  assert.match(css, /\.board\s*\{[^}]*grid-template-columns:\s*repeat\(8,\s*1fr\)[^}]*grid-template-rows:\s*repeat\(8,\s*1fr\)/s);
  assert.match(app, /catalan-b2-review-v2/);
  assert.match(app, /catalan-b2-review-v1/);
  assert.match(app, /legacyTextReview/);
  assert.match(app, /catalan-editor-mode-v1/);
  assert.doesNotMatch(`${app}\n${launcher}`, /chess_pieces|Documents[\\/]dev|coachdinosaur/i);
});
