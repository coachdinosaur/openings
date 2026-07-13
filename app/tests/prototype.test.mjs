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

async function loadBoardAnalysis() {
  const source = await readFile(new URL("app/board-analysis.ts", root), "utf8");
  let output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  output = output.replace(/from ["']chess\.js["']/, `from ${JSON.stringify(import.meta.resolve("chess.js"))}`);
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
  assert.match(html, /Stockfish principal variation/);
  assert.match(html, /Engine evaluation unavailable/);
  assert.match(html, /Analyze current position with Stockfish/);
  assert.match(html, />Analyze</);
  assert.match(html, /Editor mode/);
  assert.doesNotMatch(html, />Source review</);
  assert.doesNotMatch(html, />Re-import</);
});

test("retains the current-position PV after Stop and clears it on navigation", async () => {
  const app = await readFile(new URL("app/CatalanApp.tsx", root), "utf8");
  assert.match(app, /const showPv = visibleAnalysis !== null;/);
  assert.match(app, /const setActivePosition = useCallback\([\s\S]*?setEngineAnalysis\(null\);\s*setAnalysisMoves\(\[\]\);\s*setActive\(value\);/);
  assert.match(app, /setAnalysisRequested\(true\);\s*setEngineAnalysis\(null\);\s*setEngineError\(null\);\s*requestAnalysis/);
  assert.match(app, /analysisRequestedRef\.current = false;\s*analysisRequestTokenRef\.current \+= 1;\s*setAnalysisRequested\(false\);\s*void client\.stop\(\)/);
});

test("supports legal interactive analysis moves, special moves, and promotion", async () => {
  const { legalTargets, playAnalysisMove } = await loadBoardAnalysis();
  const startFen = new Chess().fen();
  const pawnTargets = legalTargets(startFen, "e2");
  assert.deepEqual(pawnTargets.map((target) => target.to).sort(), ["e3", "e4"]);
  assert.equal(playAnalysisMove(startFen, { from: "e2", to: "e5" }), null);
  const e4 = playAnalysisMove(startFen, { from: "e2", to: "e4" });
  assert.equal(e4.san, "e4");
  assert.equal(e4.label, "1.e4");
  assert.equal(new Chess(e4.fen).turn(), "b");

  const castleFen = "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1";
  assert.ok(legalTargets(castleFen, "e1").some((target) => target.to === "g1"));
  assert.equal(playAnalysisMove(castleFen, { from: "e1", to: "g1" }).san, "O-O");

  const enPassantFen = "4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1";
  assert.ok(legalTargets(enPassantFen, "e5").some((target) => target.to === "d6" && target.capture));

  const promotionFen = "8/P7/8/8/8/8/7p/4K2k w - - 0 1";
  assert.equal(legalTargets(promotionFen, "a7").filter((target) => target.to === "a8").length, 4);
  const promoted = playAnalysisMove(promotionFen, { from: "a7", to: "a8", promotion: "n" });
  assert.equal(new Chess(promoted.fen).get("a8").type, "n");
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

test("makes Section C a complete board-linked reading stream with all 25 diagrams", async () => {
  const [interactive, lesson, htmlResponse] = await Promise.all([
    readFile(new URL("app/chapter1-c-interactive.ts", root), "utf8"),
    readFile(new URL("app/chapter1-lesson.ts", root), "utf8"),
    render(),
  ]);
  const html = await htmlResponse.text();
  assert.match(lesson, /C_BLOCKS/);
  assert.match(lesson, /C_DIAGRAMS/);
  assert.match(interactive, /const diagramSpecs: DiagramSpec\[\] = \[/);
  assert.equal((interactive.match(/id: "C-D\d+"/g) ?? []).length, 25);
  assert.match(interactive, /positionStatus: "deterministically derived"/);
  assert.match(interactive, /boardIdentityStatus: "unresolved"/);
  assert.match(interactive, /export const C_UNRESOLVED_TOKENS/);
  const inlineMoves = html.match(/class="inline-move/g) ?? [];
  assert.ok(inlineMoves.length >= 500, `expected the complete C text to expose hundreds of move links, found ${inlineMoves.length}`);
  for (let index = 1; index <= 25; index += 1) assert.match(html, new RegExp(`C-D${String(index).padStart(2, "0")}`));
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
  await Promise.all(Array.from({ length: 25 }, (_, index) => access(new URL(`public/source/crops/c/C-D${String(index + 1).padStart(2, "0")}.png`, root))));
  const [app, client, css, launcher, vinextPatch] = await Promise.all([readFile(new URL("app/CatalanApp.tsx", root), "utf8"), readFile(new URL("app/stockfish-client.ts", root), "utf8"), readFile(new URL("app/globals.css", root), "utf8"), readFile(new URL("../start-local.ps1", root), "utf8"), readFile(new URL("scripts/patch-vinext-static.mjs", root), "utf8")]);
  assert.match(css, /\.board\s*\{[^}]*grid-template-columns:\s*repeat\(8,\s*1fr\)[^}]*grid-template-rows:\s*repeat\(8,\s*1fr\)/s);
  assert.match(css, /\.board-analysis-row\s*\{[^}]*display:\s*flex[^}]*align-items:\s*stretch/s);
  assert.match(css, /\.evaluation-rail\s*\{/);
  assert.match(css, /\.analysis-pv\s*\{[^}]*height:\s*38px/s);
  assert.match(css, /\.square\.selected\s*\{/);
  assert.match(css, /\.analysis-branch-controls\s*\{/);
  assert.match(app, /aria-pressed=\{analysisRequested\}/);
  assert.match(app, /onMove=\{applyAnalysisMove\}/);
  assert.match(app, /setAnalysisMoves\(\(current\) => current\.slice\(0, -1\)\)/);
  assert.match(app, /event\.analysis\.searchId === expectedSearchIdRef\.current/);
  assert.match(client, /setoption name MultiPV value 1/);
  assert.match(client, /go infinite/);
  assert.match(client, /const ENGINE_FILE = "stockfish\/stockfish-18-lite-single\.js"/);
  assert.match(vinextPatch, /"\.wasm": "application\/wasm"/);
  assert.match(vinextPatch, /split\(path\.sep\)\.join\("\/"\)/);
  assert.match(app, /catalan-b2-review-v2/);
  assert.match(app, /catalan-b2-review-v1/);
  assert.match(app, /legacyTextReview/);
  assert.match(app, /catalan-editor-mode-v1/);
  assert.doesNotMatch(`${app}\n${client}\n${launcher}`, /chess_pieces|Documents[\\/]dev|coachdinosaur/i);
});

test("packages the verified Stockfish runtime unchanged in public and production output", async () => {
  const expected = [
    ["stockfish-18-lite-single.js", 20670, "2278005057F381491F1C9BB3E44C9F5920B3A00BEF9759E33CC6582769A1F1FE"],
    ["stockfish-18-lite-single.wasm", 7295411, "A8FBC05EC6920B56D7485826DCB02C5FFD2826BCBF751CF973046F237A9096F1"],
    ["Copying.txt", 35821, "0B383D5A63DA644F628D99C33976EA6487ED89AAA59F0B3257992DEAC1171E6B"],
  ];
  for (const location of ["public/stockfish", "dist/client/stockfish"]) {
    for (const [file, bytes, sha256] of expected) {
      const content = await readFile(new URL(`${location}/${file}`, root));
      assert.equal(content.byteLength, bytes, `${location}/${file} byte size`);
      assert.equal(crypto.createHash("sha256").update(content).digest("hex").toUpperCase(), sha256, `${location}/${file} SHA-256`);
    }
  }
  const provenance = await readFile(new URL("public/stockfish/SOURCE.txt", root), "utf8");
  assert.match(provenance, /v18\.0\.0/);
  assert.match(provenance, /31a9875/);
  assert.match(provenance, /cb3d4ee/);
  assert.doesNotMatch(provenance, /[A-Z]:\\|Users[\\/]|Documents[\\/]dev/i);
});
