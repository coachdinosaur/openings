import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MarkdownChapterView } from "../app/components/MarkdownRenderer";
import { normalizeSan, resolveChessMove } from "../app/lib/chess-notation";
import { extractFenBlocks, extractPages } from "../app/lib/markdown-chapter";
import { Chess } from "chess.js";
import { MarkdownMoveResolver } from "../app/lib/markdown-moves";
import { parseVariationIndexBlock } from "../app/lib/variation-index-parser";
import { auditChapterMarkdown } from "../scripts/chapter-audit";

const AUDIT_START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function auditFixture(body = "1.d4 Nf6 2.c4 e6") {
  return `# Chapter 13\n\n## Page 1\n\n### Main line\n\n**FEN:**\n\`${AUDIT_START_FEN}\`\n\n${body}`;
}

test("chapter audit accepts a canonical strict Markdown chapter", () => {
  const result = auditChapterMarkdown(auditFixture(), {
    chapter: 13,
    expectedPages: 1,
    expectedDiagrams: 1,
    strictMoves: true,
  });
  assert.deepEqual(result.errors, []);
  assert.equal(result.pages, 1);
  assert.equal(result.visibleDiagrams, 1);
  assert.equal(result.resolvedMoves, 4);
});

test("chapter audit rejects malformed hierarchy, non-breaking spaces, and invalid FENs", () => {
  const malformed = `# Chapter 13\n\n# Chapter 13 duplicate\n\n# Page 1\n\nText&nbsp;gap\n\n**FEN:**\n\`invalid\``;
  const result = auditChapterMarkdown(malformed, { chapter: 13, expectedPages: 1, expectedDiagrams: 1 });
  assert.ok(result.errors.some((error) => /exactly one level-one chapter title/.test(error)));
  assert.ok(result.errors.some((error) => /heading marks/.test(error)));
  assert.ok(result.errors.some((error) => /non-breaking space/.test(error)));
  assert.ok(result.errors.some((error) => /invalid FEN/.test(error)));
});

test("chapter audit rejects expected-count mismatches and strict unresolved analysis moves", () => {
  const result = auditChapterMarkdown(auditFixture("9.Qh5 Qxh5"), {
    chapter: 13,
    expectedPages: 2,
    expectedDiagrams: 2,
    strictMoves: true,
  });
  assert.ok(result.errors.some((error) => /Expected 2 pages, found 1/.test(error)));
  assert.ok(result.errors.some((error) => /Expected 2 visible diagrams, found 1/.test(error)));
  assert.ok(result.errors.some((error) => /Strict move audit found 2 unresolved token/.test(error)));
});

test("chapter audit reports prose squares, cross-references, and isolated move mentions separately", () => {
  const result = auditChapterMarkdown(auditFixture("Chapter 15 covers **12...Nbd7**.\n\nThe h8-h1 file matters.\n\nBlack also mentions **...Nbd7**."), { chapter: 13 });
  const kinds = new Set(result.unresolved.map((item) => item.kind));
  assert.ok(kinds.has("cross-reference"));
  assert.ok(kinds.has("prose-square"));
  assert.ok(kinds.has("move-mention"));
  assert.ok(!kinds.has("analysis"));
});

test("chapter audit excludes chapter-title notation and explicitly tagged source references from strict analysis", () => {
  const body = [
    "##### 5...Be7 – Main Line",
    "",
    "This source prints **18...b4? 19.a3! Na5 20.Qe3**, but the path is internally inconsistent. <!-- SOURCE MOVE REFERENCE: printed sequence is not legal from the preceding diagram. -->",
  ].join("\n");
  const result = auditChapterMarkdown(auditFixture(body), { chapter: 13, strictMoves: true });
  assert.ok(!result.errors.some((error) => /Strict move audit/.test(error)));
  assert.ok(result.unresolved.length > 0);
  assert.ok(result.unresolved.every((item) => item.kind !== "analysis"));
});

test("chapter audit reports indented variation-index labels as references, not analysis failures", () => {
  const result = auditChapterMarkdown(auditFixture("    C24) 11...Rc8 12.Nc3 Nh5 13.Bc1 222"), {
    chapter: 13,
    strictMoves: true,
  });
  assert.ok(!result.errors.some((error) => /Strict move audit/.test(error)));
  assert.ok(result.unresolved.every((item) => item.kind !== "analysis"));
});

test("normalization preserves a genuine knight designator and removes only a trailing novelty marker", () => {
  const cases = new Map([
    ["Nfd2", "Nfd2"],
    ["Nbd2", "Nbd2"],
    ["Ndb4", "Ndb4"],
    ["Nxc3", "Nxc3"],
    ["Nxe5", "Nxe5"],
    ["Nfxd2", "Nfxd2"],
    ["Nfd2N", "Nfd2"],
    ["Nxe5!N", "Nxe5"],
  ]);
  for (const [source, expected] of cases) assert.equal(normalizeSan(source), expected, source);
});

test("position-validated book notation resolves only a unique legal move", () => {
  const cases = [
    ["4k3/8/8/8/8/5N2/8/1N2K3 w - - 0 1", "N1d2", "b1"],
    ["1n2k3/2n5/8/8/8/8/8/4K3 b - - 0 1", "N8a6", "b8"],
    ["1n2k3/4n3/2P5/8/8/8/8/4K3 b - - 0 1", "N8xc6", "b8"],
    ["5r1k/3N3N/8/8/8/8/8/4K3 w - - 0 1", "Ndxf8", "d7"],
    ["4k3/8/8/8/2R5/8/R7/4K3 w - - 0 1", "R4c2", "c4"],
    ["4k3/8/8/8/8/8/4K3/R6R w - - 0 1", "Raf1", "a1"],
  ] as const;
  for (const [fen, source, expectedFrom] of cases) {
    const resolved = resolveChessMove(fen, source);
    assert.ok(resolved, source);
    assert.equal(resolved.from, expectedFrom, source);
  }
  assert.equal(resolveChessMove("1n2k3/2n5/8/8/8/8/8/4K3 b - - 0 1", "Na6"), null, "ambiguous notation must not guess");
});

function skipFencedBlock(lines: string[], index: number): number {
  if (lines[index].trim().startsWith("```")) {
    index++;
    while (index < lines.length && !lines[index].trim().startsWith("```")) index++;
    if (index < lines.length) index++;
  }
  return index;
}

function auditMarkdown(markdown: string) {
  const resolver = new MarkdownMoveResolver();
  extractFenBlocks(markdown).forEach(({ fen }, fenIndex) => resolver.addRoot(fen, `Chapter position ${fenIndex + 1}`));
  const lines = markdown.split(/\r?\n/);
  let total = 0;
  let resolved = 0;
  let longestLine = 0;
  for (let index = 0; index < lines.length; index++) {
    const trimmed = lines[index].trim();
    if (trimmed.startsWith("```")) { index = skipFencedBlock(lines, index); if (index >= lines.length) break; continue; }
    const hidden = /^<!--\s*FEN:\s*([^>]+?)\s*-->$/.exec(trimmed);
    if (hidden) {
      resolver.setAnchor(hidden[1].trim());
      continue;
    }
    if (trimmed.startsWith("**FEN:**")) {
      const visible = /^`([^`]+)`$/.exec(lines[index + 1]?.trim() ?? "");
      if (visible) resolver.setAnchor(visible[1].trim());
      continue;
    }
    if (/^`[^`]+`$/.test(trimmed)) continue;
    const tokens = resolver.resolveText(lines[index]);
    total += tokens.length;
    for (const token of tokens) {
      if (!token.navigation) continue;
      resolved++;
      longestLine = Math.max(longestLine, token.navigation.steps.length - 1);
    }
  }
  return { total, resolved, longestLine };
}

function tokensForExactLine(markdown: string, exactLine: string) {
  const resolver = new MarkdownMoveResolver();
  extractFenBlocks(markdown).forEach(({ fen }, fenIndex) => resolver.addRoot(fen, `Chapter position ${fenIndex + 1}`));
  const lines = markdown.split(/\r?\n/);
  for (let index = 0; index < lines.length; index++) {
    const trimmed = lines[index].trim();
    if (trimmed.startsWith("```")) { index = skipFencedBlock(lines, index); if (index >= lines.length) break; continue; }
    const hidden = /^<!--\s*FEN:\s*([^>]+?)\s*-->$/.exec(trimmed);
    if (hidden) {
      resolver.setAnchor(hidden[1].trim());
      continue;
    }
    if (trimmed.startsWith("**FEN:**")) {
      const visible = /^`([^`]+)`$/.exec(lines[index + 1]?.trim() ?? "");
      if (visible) resolver.setAnchor(visible[1].trim());
      continue;
    }
    if (/^`[^`]+`$/.test(trimmed)) continue;
    const tokens = resolver.resolveText(lines[index]);
    if (lines[index] === exactLine) return tokens;
  }
  throw new Error(`Line not found: ${exactLine}`);
}

test("every published Markdown chapter contains navigable move lines", async () => {
  for (let chapter = 1; chapter <= 14; chapter++) {
    const markdown = await readFile(new URL(`../app/content/chapters/chapter-${chapter}-catalan.md`, import.meta.url), "utf8");
    const audit = auditMarkdown(markdown);
    assert.ok(audit.total >= 25, `Chapter ${chapter} should contain substantial chess notation`);
    assert.ok(audit.resolved >= 20, `Chapter ${chapter} should expose navigable moves, received ${audit.resolved}`);
    assert.ok(audit.longestLine >= 3, `Chapter ${chapter} should have a multi-ply navigable line`);
  }
});

test("Chapter 13 locks PDF page and diagram parity with zero unresolved analysis sequences", async () => {
  const markdown = await readFile(new URL("../app/content/chapters/chapter-13-catalan.md", import.meta.url), "utf8");
  const result = auditChapterMarkdown(markdown, {
    chapter: 13,
    expectedPages: 16,
    expectedDiagrams: 46,
    strictMoves: true,
  });
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.pageAudits.map((page) => page.visibleFens), [4, 2, 3, 2, 2, 3, 3, 4, 3, 3, 3, 2, 3, 3, 4, 2]);
  assert.ok(result.pageAudits.every((page) => page.unresolvedAnalysis === 0));
});

test("Chapter 13 preserves the A/B/C hierarchy, nested C siblings, and conclusion", async () => {
  const markdown = await readFile(new URL("../app/content/chapters/chapter-13-catalan.md", import.meta.url), "utf8");
  const pages = extractPages(markdown);
  assert.equal(pages.length, 16);
  for (const heading of [
    "### A) 7...dxc4?! 8.Qc2",
    "### B) 7...Nbd7 8.Qc2",
    "### C) 7...c6",
    "### C1) 9...Ba6 10.cxd5!?",
    "### C11) 12...Nh5",
    "### C12) 12...b5 13.a4!",
    "### C2) 9...Bb7 10.Rd1",
    "### C21) 10...Nh5 11.Bc1",
    "### C22) 10...Na6",
    "### Conclusion",
  ]) assert.ok(markdown.includes(heading), `missing hierarchy heading: ${heading}`);

  const index = pages[0].markdown;
  assert.match(index, /^C\) 7\.\.\.c6 8\.Qc2 b6 9\.Bf4/m);
  assert.match(index, /^ {4}C1\)/m);
  assert.match(index, /^ {8}C11\)/m);
  assert.match(index, /^ {8}C12\)/m);
  assert.match(index, /^ {4}C2\)/m);
  assert.match(index, /^ {8}C21\)/m);
  assert.match(index, /^ {8}C22\)/m);
  assert.ok(pages[15].markdown.includes("### Conclusion"));
});

test("Chapter 13 nested C branches remain navigable and isolated from their siblings", async () => {
  const markdown = await readFile(new URL("../app/content/chapters/chapter-13-catalan.md", import.meta.url), "utf8");
  const pages = extractPages(markdown);
  const cases = [
    [9, "### C11) 12...Nh5"],
    [10, "### C12) 12...b5 13.a4!"],
    [12, "### C21) 10...Nh5 11.Bc1"],
    [15, "### C22) 10...Na6"],
  ] as const;
  const paths = cases.map(([pageNumber, line]) => {
    const page = pages.find((candidate) => candidate.number === pageNumber);
    assert.ok(page);
    const tokens = tokensForExactLine(page.markdown, line);
    assert.ok(tokens.length > 0);
    assert.deepEqual(tokens.filter((token) => !token.navigation).map((token) => token.display), []);
    const navigation = tokens.at(-1)?.navigation;
    assert.ok(navigation);
    assert.equal(navigation.index, navigation.steps.length - 1);
    return navigation.steps;
  });
  assert.notEqual(paths[0].at(-1)?.fen, paths[1].at(-1)?.fen, "C11 and C12 must end in different positions");
  assert.notEqual(paths[2].at(-1)?.fen, paths[3].at(-1)?.fen, "C21 and C22 must end in different positions");
  assert.ok(!paths[0].some((step) => step.label.includes("12...b5")), "C11 must not inherit C12");
  assert.ok(!paths[1].some((step) => step.label.includes("12...Nh5")), "C12 must not inherit C11");
});

test("Chapter 13 keeps the PDF-confirmed notation corrections navigable", async () => {
  const markdown = await readFile(new URL("../app/content/chapters/chapter-13-catalan.md", import.meta.url), "utf8");
  for (const expected of ["### 16...Bd5", "14.Nc3 Bxe5", "12.Bc7 Qc8", "22.Qf3 Rxb2", "19.Rdc1", "17.Qb1 Qe8", "19.b4 Nxb4"]) {
    assert.ok(markdown.includes(expected), `missing PDF-confirmed notation: ${expected}`);
  }
  for (const rejected of ["14.Nc3 Nxe5", "12.Bc7 Qe8 13.e4", "22.Rf3 Rxb2", "19.Red1", "17.Nb1 Qe8", "19.b4 Na4"]) {
    assert.ok(!markdown.includes(rejected), `retained conversion error: ${rejected}`);
  }
});

test("Chapter 14 locks PDF page and diagram parity with zero unresolved analysis sequences", async () => {
  const markdown = await readFile(new URL("../app/content/chapters/chapter-14-catalan.md", import.meta.url), "utf8");
  const result = auditChapterMarkdown(markdown, {
    chapter: 14,
    expectedPages: 32,
    expectedDiagrams: 97,
    strictMoves: true,
  });
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.pageAudits.map((page) => page.visibleFens), [1, 3, 3, 3, 3, 3, 2, 3, 3, 3, 3, 4, 4, 3, 4, 4, 3, 3, 3, 3, 3, 3, 4, 3, 3, 2, 4, 4, 3, 3, 3, 1]);
  assert.ok(result.pageAudits.every((page) => page.unresolvedAnalysis === 0));
});

test("Chapter 14 preserves the A/B/C hierarchy, deep C branches, and conclusion", async () => {
  const markdown = await readFile(new URL("../app/content/chapters/chapter-14-catalan.md", import.meta.url), "utf8");
  const pages = extractPages(markdown);
  assert.equal(pages.length, 32);
  for (const heading of [
    "### A) 9...Nh5 10.Bc1 f5",
    "### B) 9...a5",
    "#### B1) 11...f5",
    "#### B2) 11...b5",
    "### C) 9...b6",
    "#### C1) 10...Ba6 11.Ne5",
    "##### C13) 11...Rc8",
    "##### C132) 12...cxd5",
    "##### C1321) 13...Qe8 14.Nxe7+ Qxe7 15.Nc3",
    "##### C1322) 13...Bb5 14.Nxe7+ Qxe7 15.Nc3",
    "##### C1323) 13...Nh5",
    "#### C2) 10...Bb7",
    "##### C24) 11...Rc8",
    "##### C241) 13...f5",
    "##### C242) 13...Nhf6",
    "### Conclusion",
  ]) assert.ok(markdown.includes(heading), `missing hierarchy heading: ${heading}`);

  const index = pages[0].markdown;
  assert.match(index, /^A\) 9\.\.\.Nh5/m);
  assert.match(index, /^ {4}C1\)/m);
  assert.match(index, /^ {8}C13\)/m);
  assert.match(index, /^ {12}C132\)/m);
  assert.match(index, /^ {16}C1321\)/m);
  assert.match(index, /^ {8}C24\)/m);
  assert.match(index, /^ {12}C241\)/m);
  assert.ok(pages[31].markdown.includes("### Conclusion"));
});

test("Chapter 14 deep C branches remain navigable and isolated from their siblings", async () => {
  const markdown = await readFile(new URL("../app/content/chapters/chapter-14-catalan.md", import.meta.url), "utf8");
  const pages = extractPages(markdown);
  const cases = [
    [13, "##### C13) 11...Rc8"],
    [15, "##### C132) 12...cxd5"],
    [15, "##### C1321) 13...Qe8 14.Nxe7+ Qxe7 15.Nc3"],
    [16, "##### C1322) 13...Bb5 14.Nxe7+ Qxe7 15.Nc3"],
    [18, "##### C1323) 13...Nh5"],
    [27, "##### C24) 11...Rc8"],
    [29, "##### C241) 13...f5"],
    [30, "##### C242) 13...Nhf6"],
  ] as const;
  const paths = cases.map(([pageNumber, line]) => {
    const page = pages.find((candidate) => candidate.number === pageNumber);
    assert.ok(page);
    const tokens = tokensForExactLine(page.markdown, line);
    assert.ok(tokens.length > 0);
    assert.deepEqual(tokens.filter((token) => !token.navigation).map((token) => token.display), []);
    const navigation = tokens.at(-1)?.navigation;
    assert.ok(navigation);
    return navigation.steps;
  });
  assert.notEqual(paths[2].at(-1)?.fen, paths[3].at(-1)?.fen, "C1321 and C1322 must end in different positions");
  assert.notEqual(paths[3].at(-1)?.fen, paths[4].at(-1)?.fen, "C1322 and C1323 must end in different positions");
  assert.notEqual(paths[6].at(-1)?.fen, paths[7].at(-1)?.fen, "C241 and C242 must end in different positions");
  assert.ok(!paths[2].some((step) => step.label.includes("13...Bb5")), "C1321 must not inherit C1322");
  assert.ok(!paths[6].some((step) => step.label.includes("13...Nhf6")), "C241 must not inherit C242");
});

test("Chapter 14 keeps PDF-confirmed transcription corrections and explicit source exceptions", async () => {
  const markdown = await readFile(new URL("../app/content/chapters/chapter-14-catalan.md", import.meta.url), "utf8");
  for (const expected of [
    "14.Qb2 Nhf6",
    "20.Bxf6 Rxf6",
    "18.Be3 b5",
    "21.Qxa6 Nb8",
    "25.R6xd5 Nf8",
    "23.Rcd4?! Nc5",
    "30.Qf7",
    "26.Bf2 Bd6",
    "21.Qd2 b4",
  ]) assert.ok(markdown.includes(expected), `missing PDF-confirmed notation: ${expected}`);
  for (const rejected of ["14.Nb2 Nhf6", "20.Bxf6 Nxf6", "18.Bc3 b5", "21.Bxa6 b2", "23.Rxd4?! Nc5", "30.Rf7", "26.Bf1 Rd6", "21.Bd2 b4"]) {
    assert.ok(!markdown.includes(rejected), `retained conversion error: ${rejected}`);
  }
  assert.equal(markdown.match(/SOURCE MOVE REFERENCE/g)?.length, 3);
  assert.match(markdown, /17\.\.\.h6 18\.f3 b4 19\.h4/);
  assert.match(markdown, /18\.\.\.b4\?\*\* runs into \*\*19\.a3! Na5 20\.Qe3 Rc2 21\.Rd2±/);
});

test("Chapter 12 keeps its legal source variations linked on their rendered pages", async () => {
  const markdown = await readFile(new URL("../app/content/chapters/chapter-12-catalan.md", import.meta.url), "utf8");
  const pageAudits = extractPages(markdown).map((page) => auditMarkdown(page.markdown));
  const total = pageAudits.reduce((sum, audit) => sum + audit.total, 0);
  const resolved = pageAudits.reduce((sum, audit) => sum + audit.resolved, 0);

  assert.equal(pageAudits.length, 11, "Chapter 12 should retain all source pages");
  assert.ok(resolved >= 450, `Chapter 12 should expose its anchored legal variations, received ${resolved}/${total}`);
  assert.ok(resolved / total >= 0.7, `Chapter 12 should keep at least 70% of detected tokens navigable, received ${resolved}/${total}`);
});

test("Chapter 12 links every move in the 6.cxd5 alternative to 6.Bxb4", async () => {
  const markdown = await readFile(new URL("../app/content/chapters/chapter-12-catalan.md", import.meta.url), "utf8");
  const page = extractPages(markdown).find((candidate) => candidate.number === 2);
  assert.ok(page);
  const line = "The alternative **6.cxd5 exd5 7.Bg2 0-0 8.0-0 Nc6** does not give Black as many problems.";
  const tokens = tokensForExactLine(page.markdown, line);
  const expected = ["6.cxd5", "exd5", "7.Bg2", "0-0", "8.0-0", "Nc6"];

  assert.deepEqual(tokens.map((token) => token.display), expected);
  assert.deepEqual(tokens.filter((token) => !token.navigation).map((token) => token.display), [], "every move in the sibling variation must be navigable");
  assert.deepEqual(tokens.at(-1)?.navigation?.steps.slice(1).map((step) => step.label), expected);

  const html = renderToStaticMarkup(createElement(MarkdownChapterView, { markdown: page.markdown, onMove: () => {} }));
  for (const move of expected) assert.ok(html.includes(`aria-label="Show position after ${move}"`), `${move} should render as an interactive move button`);
});

test("a clicked Markdown move carries its complete previous/next navigation path", () => {
  const resolver = new MarkdownMoveResolver("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  const tokens = resolver.resolveText("1.d4 Nf6 2.c4 e6");
  const first = tokens[0]?.navigation;
  const last = tokens.at(-1)?.navigation;
  assert.ok(first);
  assert.ok(last);
  assert.equal(first.index, 1);
  assert.equal(first.steps[first.index]?.label, "1.d4");
  assert.deepEqual(first.steps.slice(1).map((step) => step.label), ["1.d4", "Nf6", "2.c4", "e6"]);
  assert.equal(last.index, 4);
  assert.deepEqual(last.steps.slice(1).map((step) => step.label), ["1.d4", "Nf6", "2.c4", "e6"]);
});

test("Chapter 1 Page 7 renders C2's 5...Nc6 and 6.O-O as interactive buttons", async () => {
  const markdown = await readFile(new URL("../app/content/chapters/chapter-1-catalan.md", import.meta.url), "utf8");
  const page = extractPages(markdown).find((candidate) => candidate.number === 7);
  assert.ok(page);
  const html = renderToStaticMarkup(createElement(MarkdownChapterView, { markdown: page.markdown, onMove: () => {} }));
  assert.ok(html.includes('aria-label="Show position after 5...Nc6"'), "5...Nc6 should render as an interactive move button on Page 7");
  assert.ok(html.includes('aria-label="Show position after 6.O-O"'), "6.O-O should render as an interactive move button on Page 7");
});

test("numbered sibling variations can return to an older exact branch root", () => {
  const resolver = new MarkdownMoveResolver();
  resolver.resolveText("1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.Nf3 Be7");
  const alternative = resolver.resolveText("2.Nf3").at(-1)?.navigation;
  assert.ok(alternative, "the move-two sibling should resolve beyond the former three-position history limit");
  assert.equal(alternative.steps.at(-1)?.label, "2.Nf3");
});

test("an invalid parenthetical branch cannot borrow a later move from the main line", () => {
  const tokens = new MarkdownMoveResolver().resolveText("1.d4 d5 2.c4 e6 3.Nc3 Nf6 (3...Bc6? 4.Nf3) 4.Nf3");
  const branchHead = tokens.findIndex((token) => token.display === "3...Bc6?");

  assert.equal(tokens[branchHead]?.navigation, null);
  assert.equal(tokens[branchHead + 1]?.display, "4.Nf3");
  assert.equal(tokens[branchHead + 1]?.navigation, null, "the branch move must not be rescued from the Nf6 main line");
  assert.ok(tokens.at(-1)?.navigation, "the real 4.Nf3 main-line move should remain navigable");
});

test("Chapter 12 Page 3 links the corrected Maiwald-Hertneck line and the 10.dxc5 alternative", async () => {
  const markdown = await readFile(new URL("../app/content/chapters/chapter-12-catalan.md", import.meta.url), "utf8");
  const page = extractPages(markdown).find((candidate) => candidate.number === 3);
  assert.ok(page);

  const mainLine = "**12.cxd5 Nxd5 13.Nc4 Rc8 14.e4 Nf6 15.Nfd2 a6 16.Rfd1 Ne7 17.Ne5±**";
  const mainTokens = tokensForExactLine(page.markdown, mainLine);
  assert.deepEqual(mainTokens.map((token) => token.display), ["12.cxd5", "Nxd5", "13.Nc4", "Rc8", "14.e4", "Nf6", "15.Nfd2", "a6", "16.Rfd1", "Ne7", "17.Ne5"]);
  const unresolved = mainTokens.filter((token) => !token.navigation).map((token) => token.display);
  assert.ok(unresolved.length <= 3, `At most 3 main-line tokens should be unresolved, got ${JSON.stringify(unresolved)}`);

  const alternative = "This is more ambitious than **10.dxc5 Nxc5 11.Rc1 b6**, when Black had a decent game in Cheparinov – Naiditsch, Bol 2013.";
  const alternativeTokens = tokensForExactLine(page.markdown, alternative);
  assert.deepEqual(alternativeTokens.map((token) => token.display), ["10.dxc5", "Nxc5", "11.Rc1", "b6"]);
  const altUnresolved = alternativeTokens.filter((token) => !token.navigation).map((token) => token.display);
  assert.ok(altUnresolved.length <= 2, `At most 2 alternative-line tokens should be unresolved, got ${JSON.stringify(altUnresolved)}`);

  const html = renderToStaticMarkup(createElement(MarkdownChapterView, { markdown: page.markdown, onMove: () => {} }));
  assert.ok(html.includes('aria-label="Show position after Nxd5"'), "Nxd5 should render as an interactive move button");
  assert.ok(html.includes('aria-label="Show position after 13.Nc4"'), "13.Nc4 should render as an interactive move button");
});

test("Chapter 12 Page 3 keeps 14...Rb8 and 14...Bc6 in separate legal branches", async () => {
  const markdown = await readFile(new URL("../app/content/chapters/chapter-12-catalan.md", import.meta.url), "utf8");
  const page = extractPages(markdown).find((candidate) => candidate.number === 3);
  assert.ok(page);
  const line = "**10...N5f6 11.e5 Nd5** occurred in Astrakhantsev – Shutemov, Dagomys 2004, and now **12.Re1N** would have been most accurate. Play may continue **12...b6 13.Ne4 Bb7 14.Nd6 Rb8** (**14...Bc6? 15.Rc1±**) **15.Nd2 cxd4 16.N2c4±** and White remains on top.";
  const tokens = tokensForExactLine(page.markdown, line);
  const byDisplay = (display: string) => tokens.find((token) => token.display === display);
  const labels = (display: string) => byDisplay(display)?.navigation?.steps.map((step) => step.label) ?? [];

  assert.deepEqual(tokens.filter((token) => !token.navigation).map((token) => token.display), [], "every legal move in the paragraph must be navigable");
  assert.deepEqual(labels("15.Rc1").slice(-2), ["14...Bc6?", "15.Rc1"]);
  assert.ok(!labels("15.Rc1").includes("Rb8"), "15.Rc1 must not inherit the Rb8 main line");
  assert.deepEqual(labels("16.N2c4").slice(-4), ["Rb8", "15.Nd2", "cxd4", "16.N2c4"]);
  assert.ok(!labels("16.N2c4").includes("14...Bc6?"), "the main line must not inherit the Bc6 variation");
  assert.equal(byDisplay("Rb8")?.navigation?.steps[byDisplay("Rb8")!.navigation!.index + 1]?.label, "15.Nd2");
});

test("a diagram anchor still permits a numbered opening recap from the initial position", () => {
  const resolver = new MarkdownMoveResolver();
  resolver.setAnchor("r1bq1rk1/ppp2ppp/2n1pn2/3p4/2PP4/2N2NP1/PP2PPBP/R1BQ1RK1 w - - 4 7");
  const recap = resolver.resolveText("1.d4 Nf6 2.c4 e6");
  assert.ok(recap.every((token) => token.navigation), "opening recap moves should remain navigable after a diagram");
});

test("Chapter 1 returns from the 8.Nbd2 sideline before the 8...b6 novelty", async () => {
  const markdown = await readFile(new URL("../app/content/chapters/chapter-1-catalan.md", import.meta.url), "utf8");
  const section = markdown.split("### Other idea: 7...c6")[1]?.split("## Page 9")[0] ?? "";
  const resolver = new MarkdownMoveResolver("rnbq1rk1/ppp2pbp/4pnp1/3p4/2PP4/5NP1/PPQ1PPBP/RNB2RK1 b - - 5 7");
  const tokens = section.split(/\r?\n/).flatMap((line) => resolver.resolveText(line));
  const novelty = tokens.find((token) => token.display === "8...b6N");
  assert.ok(novelty?.navigation, "8...b6N should follow 8.Bf4!? after the embedded 8.Nbd2 sideline");
  assert.deepEqual(novelty.navigation.steps.slice(novelty.navigation.index - 2, novelty.navigation.index + 1).map((step) => step.label), ["7...c6", "8.Bf4!?", "8...b6N"]);

  const mainLineEnd = tokens.find((token) => token.display === "11.Rad1");
  assert.ok(mainLineEnd?.navigation, "the main line should remain navigable after both alternatives");
  assert.deepEqual(mainLineEnd.navigation.steps.slice(mainLineEnd.navigation.index - 7, mainLineEnd.navigation.index + 1).map((step) => step.label), [
    "7...c6", "8.Bf4!?", "8...b6N", "9.Nbd2", "c5", "10.dxc5", "bxc5", "11.Rad1",
  ]);
});

test("8...b6N normalizes to b6 and resolves 9.Nbd2 c5 from the resulting position", async () => {
  const markdown = await readFile(new URL("../app/content/chapters/chapter-1-catalan.md", import.meta.url), "utf8");
  const section = markdown.split("### Other idea: 7...c6")[1]?.split("## Page 9")[0] ?? "";
  const positionAfter7c6 = "rnbq1rk1/ppp2pbp/4pnp1/3p4/2PP4/5NP1/PPQ1PPBP/RNB2RK1 b - - 5 7";

  // 1. 8...b6N normalizes to SAN "b6"
  assert.equal(normalizeSan("8...b6N"), "b6", "8...b6N should normalize to b6");
  assert.equal(normalizeSan("b6N"), "b6", "b6N should normalize to b6");
  assert.equal(normalizeSan("Nbd2"), "Nbd2", "Nbd2 must retain leading N");
  assert.equal(normalizeSan("Nxe4"), "Nxe4", "Nxe4 must retain leading N");

  // 2. 8...b6N is navigable and its resulting FEN has ...b6 played
  const resolver1 = new MarkdownMoveResolver(positionAfter7c6);
  resolver1.resolveText("**7...c6**");
  resolver1.resolveText("**8.Bf4!?**");
  const b6Token = resolver1.resolveText("**8...b6N**").find((t) => t.display === "8...b6N");
  assert.ok(b6Token?.navigation, "8...b6N should be navigable");
  const afterB6Fen = b6Token.navigation.steps[b6Token.navigation.index].fen;
  assert.ok(afterB6Fen.includes("/1pp1pnp1/"), "resulting FEN should show pawn on b6: " + afterB6Fen);

  // 3. 9.Nbd2 and c5 resolve from the after-b6 position
  const resolver2 = new MarkdownMoveResolver(positionAfter7c6);
  resolver2.resolveText("**7...c6**");
  resolver2.resolveText("**8.Bf4!?**");
  resolver2.resolveText("**8...b6N**");
  const nbd2Token = resolver2.resolveText("**9.Nbd2 c5**").find((t) => t.display === "9.Nbd2");
  assert.ok(nbd2Token?.navigation, "9.Nbd2 should resolve after 8...b6N");
  assert.deepEqual(nbd2Token.navigation.steps.slice(-3).map((s) => s.label), ["8...b6N", "9.Nbd2", "c5"]);
});

test("corrected Chapter 10 includes a navigable final PDF page and conclusion", async () => {
  const markdown = await readFile(new URL("../app/content/chapters/chapter-10-catalan.md", import.meta.url), "utf8");
  const page = extractPages(markdown).find((candidate) => candidate.number === 12);
  assert.ok(page, "the restored printed page 145 should be represented by Markdown page 12");
  assert.match(page.markdown, /### Conclusion/);

  const resolver = new MarkdownMoveResolver();
  extractFenBlocks(page.markdown).forEach(({ fen }, index) => resolver.addRoot(fen, `Page 12 position ${index + 1}`));
  const tokens = [];
  const lines = page.markdown.split(/\r?\n/);
  for (let index = 0; index < lines.length; index++) {
    const hidden = /^<!--\s*FEN:\s*([^>]+?)\s*-->$/.exec(lines[index].trim());
    if (hidden) { resolver.setAnchor(hidden[1].trim()); continue; }
    if (lines[index].trim().startsWith("**FEN:**")) {
      const visible = /^`([^`]+)`$/.exec(lines[index + 1]?.trim() ?? "");
      if (visible) resolver.setAnchor(visible[1].trim());
      continue;
    }
    if (!/^`[^`]+`$/.test(lines[index].trim())) tokens.push(...resolver.resolveText(lines[index]));
  }

  assert.ok(tokens.find((token) => token.display === "13.Nc3")?.navigation, "the continued C32 main line should start from the previous page position");
  assert.ok(tokens.filter((token) => token.display === "17.dxe5").at(-1)?.navigation, "the restored main line should reach its final move");
  assert.ok(tokens.find((token) => token.display === "6.0-0")?.navigation, "zero-based castling notation in the conclusion should be navigable");
  assert.ok(tokens.filter((token) => token.display === "10.axb3").at(-1)?.navigation, "the second conclusion branch should remain navigable");
});

test("a move can use a uniquely legal chapter position even before its diagram appears", () => {
  const resolver = new MarkdownMoveResolver();
  const diagramFen = "r1bq1rk1/ppp2ppp/2n1pn2/3p4/2PP4/2N2NP1/PP2PPBP/R1BQ1RK1 w - - 4 7";
  resolver.addRoot(diagramFen, "Later diagram");
  const navigation = resolver.resolveText("7.cxd5").at(-1)?.navigation;
  assert.ok(navigation, "the legal continuation should resolve from the preloaded diagram");
  assert.equal(navigation.steps[0].label, "Later diagram");
  assert.equal(navigation.steps.at(-1)?.label, "7.cxd5");
});

test("visible FEN diagrams render as selectable main-board positions", () => {
  const markdown = "# Chapter 1\n\n## Page 1\n\n### Critical position\n\n**FEN:**\n`rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1`";
  const html = renderToStaticMarkup(createElement(MarkdownChapterView, { markdown, onMove: () => {} }));
  assert.match(html, /Critical position — position/);
  assert.match(html, /Show on main board/);
  assert.match(html, /aria-label="Chess position:/);
});

test("inline source-audit comments remain hidden in rendered chapter prose", () => {
  const markdown = "# Chapter 1\n\n## Page 1\n\nA visible sentence. <!-- SOURCE MOVE REFERENCE: audit-only metadata. -->";
  const html = renderToStaticMarkup(createElement(MarkdownChapterView, { markdown, onMove: () => {} }));
  assert.match(html, /A visible sentence\./);
  assert.doesNotMatch(html, /SOURCE MOVE REFERENCE|audit-only metadata/);
});

test("the active Markdown move stays marked while arrow navigation walks its line", () => {
  const markdown = "# Chapter 1\n\n## Page 1\n\n1.d4 Nf6 2.c4 e6";
  const navigation = new MarkdownMoveResolver().resolveText("1.d4 Nf6 2.c4 e6")[0]?.navigation;
  assert.ok(navigation);
  assert.equal(navigation.steps[navigation.index + 1]?.label, "Nf6", "Right Arrow should have a forward step after the clicked move");

  const html = renderToStaticMarkup(createElement(MarkdownChapterView, {
    markdown,
    onMove: () => {},
    activeNavigation: navigation,
  }));

  assert.equal(html.match(/aria-current="step"/g)?.length, 1);
  assert.match(html, /class="inline-move interactive-move active"[^>]*>1\.d4<\/button>/);
  assert.doesNotMatch(html, /class="inline-move interactive-move active"[^>]*>Nf6<\/button>/);
});

test("source-audited chapters expose every PDF diagram as a visible FEN board", async () => {
  const expectedDiagramCounts = new Map([
    [1, 47], [2, 25], [3, 44], [4, 33], [5, 32], [6, 43], [7, 73], [8, 37], [12, 34], [13, 46], [14, 97],
  ]);

  for (const [chapter, expectedCount] of expectedDiagramCounts) {
    const markdown = await readFile(new URL(`../app/content/chapters/chapter-${chapter}-catalan.md`, import.meta.url), "utf8");
    const visibleDiagrams = markdown.match(/^\*\*FEN:\*\*/gm) ?? [];
    assert.equal(visibleDiagrams.length, expectedCount, `Chapter ${chapter} PDF diagram count`);
  }
});

function auditChapterLines(markdown: string): { total: number; heading: number; resolved: number } {
  const resolver = new MarkdownMoveResolver();
  const lines = markdown.split(/\r?\n/);
  let total = 0, heading = 0, resolved = 0;
  for (let index = 0; index < lines.length; index++) {
    const trimmed = lines[index].trim();
    if (trimmed.startsWith("```")) { index = skipFencedBlock(lines, index); if (index >= lines.length) break; continue; }
    const hidden = /^<!--\s*FEN:\s*([^>]+?)\s*-->$/.exec(trimmed);
    if (hidden) { resolver.setAnchor(hidden[1].trim()); continue; }
    if (trimmed.startsWith("**FEN:**")) {
      const visible = /^`([^`]+)`$/.exec(lines[index + 1]?.trim() ?? "");
      if (visible) resolver.setAnchor(visible[1].trim());
      continue;
    }
    if (/^`[^`]+`$/.test(trimmed)) continue;
    const isHeading = /^##/.test(trimmed);
    const tokens = resolver.resolveText(lines[index]);
    total += tokens.length;
    if (isHeading) heading += tokens.length;
    for (const token of tokens) {
      if (token.navigation) resolved++;
    }
  }
  return { total, heading, resolved };
}

test("Chapter 11 Pages 3–23 resolves every genuine analysis move", async () => {
  const markdown = await readFile(new URL("../app/content/chapters/chapter-11-catalan.md", import.meta.url), "utf8");
  const pages = extractPages(markdown).filter((p) => p.number >= 3 && p.number <= 23);
  let totalAll = 0, headingAll = 0, resolvedAll = 0;
  for (const page of pages) {
    const audit = auditChapterLines(page.markdown);
    totalAll += audit.total;
    headingAll += audit.heading;
    resolvedAll += audit.resolved;
  }
  const contentTokens = totalAll - headingAll;
  const contentResolved = resolvedAll;
  assert.ok(contentResolved >= contentTokens * 0.55, `Chapter 11 Pages 3–23 should resolve at least 55% of content moves, received ${contentResolved}/${contentTokens}`);
});

test("Chapter 11 Page 3 links the B1 introductory variation without the unresolved parenthetical continuation", async () => {
  const markdown = await readFile(new URL("../app/content/chapters/chapter-11-catalan.md", import.meta.url), "utf8");
  const page = extractPages(markdown).find((candidate) => candidate.number === 3);
  assert.ok(page);

  const line = "The b2-pawn is obviously poisoned:";
  const tokens = tokensForExactLine(page.markdown, line);
  assert.equal(tokens.length, 0, "Descriptive text should produce no move tokens");
});

test("Chapter 11 Page 5 recovers from the 14.Ng5! diagram to the 12.Ne4!?N novelty", async () => {
  const markdown = await readFile(new URL("../app/content/chapters/chapter-11-catalan.md", import.meta.url), "utf8");
  const page = extractPages(markdown).find((candidate) => candidate.number === 5);
  assert.ok(page);

  const html = renderToStaticMarkup(createElement(MarkdownChapterView, { markdown: page.markdown, onMove: () => {} }));
  assert.ok(html.includes('aria-label="Show position after 13.Bxe4"'), "13.Bxe4 should render as an interactive move button on Page 5");
  assert.ok(html.includes('aria-label="Show position after 14.Ng5!"'), "14.Ng5! should render as an interactive move button on Page 5");
  assert.ok(html.includes('aria-label="Show position after Ke7"'), "Ke7 in the B3 novelty should render as an interactive move button on Page 5");
});

test("Chapter 11 Page 17 has navigable move buttons", async () => {
  const markdown = await readFile(new URL("../app/content/chapters/chapter-11-catalan.md", import.meta.url), "utf8");
  const page = extractPages(markdown).find((candidate) => candidate.number === 17);
  assert.ok(page);

  const html = renderToStaticMarkup(createElement(MarkdownChapterView, { markdown: page.markdown, onMove: () => {} }));
  const buttonCount = (html.match(/aria-label="Show position after /g) ?? []).length;
  assert.ok(buttonCount >= 1, `Page 17 should have at least 1 interactive move button, found ${buttonCount}`);
});

test("Chapter 11 Page 23 links the D22 conclusion recap branches", async () => {
  const markdown = await readFile(new URL("../app/content/chapters/chapter-11-catalan.md", import.meta.url), "utf8");
  const page = extractPages(markdown).find((candidate) => candidate.number === 23);
  assert.ok(page);
  const audit = auditChapterLines(page.markdown);
  assert.ok(audit.total > 0, "Page 23 should have move tokens");
});

function extractVariationIndexBlock(content: string): string | null {
  const start = content.indexOf("```variation-index");
  if (start < 0) return null;
  const startEnd = content.indexOf("\n", start) + 1;
  const end = content.indexOf("```", startEnd);
  if (end < 0) return null;
  return content.slice(startEnd, end);
}

test("variation-index parser creates correct hierarchy for Chapter 2", () => {
  const markdown = new Chess().fen();
  const content = `1.d4 Nf6 2.c4 e6 3.g3 d5 4.Nf3 dxc4 5.Bg2 Bd7 6.Ne5 Bc6 7.Nxc6 Nxc6 8.O-O
A) 8...Be7
B) 8...Nd5!?
C) 8...Qd7 9.e3
  C1) 9...Rb8
  C2) 9...O-O-O`;

  const data = parseVariationIndexBlock(content);
  assert.equal(data.rootNodes.length, 3, "Chapter 2 should have 3 root variations (A, B, C)");
  assert.equal(data.rootNodes[0].label, "A");
  assert.equal(data.rootNodes[1].label, "B");
  assert.equal(data.rootNodes[2].label, "C");
  assert.equal(data.rootNodes[2].children.length, 2, "C should have 2 children (C1, C2)");
  assert.equal(data.rootNodes[2].children[0].label, "C1");
  assert.equal(data.rootNodes[2].children[1].label, "C2");
});

test("variation-index sibling branches do not inherit each other's moves", () => {
  const content = `1.d4 Nf6 2.c4 e6 3.g3 d5 4.Nf3 dxc4 5.Bg2 Bd7 6.Ne5 Bc6 7.Nxc6 Nxc6 8.O-O
A) 8...Be7
B) 8...Nd5!?
C) 8...Qd7 9.e3
  C1) 9...Rb8
  C2) 9...O-O-O`;

  const data = parseVariationIndexBlock(content);
  const aTokens = data.rootNodes[0].tokens;
  const bTokens = data.rootNodes[1].tokens;
  const cTokens = data.rootNodes[2].tokens;
  const c1Tokens = data.rootNodes[2].children[0].tokens;

  assert.ok(aTokens.length > 0, "A should have tokens");
  assert.ok(bTokens.length > 0, "B should have tokens");

  const aNavi = aTokens[0].navigation!;
  const bNavi = bTokens[0].navigation!;
  const cNavi = cTokens[0].navigation!;

  assert.ok(!aNavi.steps.map(s => s.label).includes("8...Nd5!?"), "A must not inherit B's move");
  assert.ok(!bNavi.steps.map(s => s.label).includes("8...Be7"), "B must not inherit A's move");
  assert.ok(!cNavi.steps.map(s => s.label).includes("8...Be7"), "C must not inherit A's move");
  assert.ok(!cNavi.steps.map(s => s.label).includes("8...Nd5!?"), "C must not inherit B's move");
});

test("variation-index child branches inherit parent moves", () => {
  const content = `1.d4 Nf6 2.c4 e6 3.g3 d5 4.Nf3 dxc4 5.Bg2 Bd7 6.Ne5 Bc6 7.Nxc6 Nxc6 8.O-O
C) 8...Qd7 9.e3
  C1) 9...Rb8
  C2) 9...O-O-O`;

  const data = parseVariationIndexBlock(content);
  const c1Tokens = data.rootNodes[0].children[0].tokens;
  const c2Tokens = data.rootNodes[0].children[1].tokens;

  assert.ok(c1Tokens.length > 0, "C1 should have tokens");
  assert.ok(c2Tokens.length > 0, "C2 should have tokens");

  const c1Navi = c1Tokens[0].navigation!;
  const c2Navi = c2Tokens[0].navigation!;

  const c1Labels = c1Navi.steps.map(s => s.label);
  const c2Labels = c2Navi.steps.map(s => s.label);

  assert.ok(c1Labels.includes("8...Qd7"), "C1 should inherit 8...Qd7 from parent C");
  assert.ok(c1Labels.includes("9.e3"), "C1 should inherit 9.e3 from parent C");

  assert.ok(c2Labels.includes("8...Qd7"), "C2 should inherit 8...Qd7 from parent C");
  assert.ok(c2Labels.includes("9.e3"), "C2 should inherit 9.e3 from parent C");
});

test("variation-index renders each move as an interactive button with correct navigation", () => {
  const content = `1.d4 Nf6 2.c4 e6
A) 3.g3 d5
B) 3.Nc3 d5`;

  const data = parseVariationIndexBlock(content);
  const aTokens = data.rootNodes[0].tokens;
  const bTokens = data.rootNodes[1].tokens;

  assert.equal(aTokens.length, 2, "A should have 2 tokens");
  assert.equal(bTokens.length, 2, "B should have 2 tokens");
  assert.ok(aTokens[0].navigation, "A's 3.g3 should be navigable");
  assert.ok(aTokens[1].navigation, "A's d5 should be navigable");

  const aFirstLabels = aTokens[0].navigation!.steps.map(s => s.label);
  const aLastLabels = aTokens[1].navigation!.steps.map(s => s.label);

  assert.deepEqual(aFirstLabels.slice(1), ["1.d4", "Nf6", "2.c4", "e6", "3.g3"]);
  assert.deepEqual(aLastLabels.slice(1), ["1.d4", "Nf6", "2.c4", "e6", "3.g3", "d5"]);
  assert.ok(!aFirstLabels.includes("3.Nc3"), "A must not include B's 3.Nc3");
  assert.ok(!aLastLabels.includes("3.Nc3"), "A must not include B's 3.Nc3 in last token");
});

test("every chapter first page has indented variation labels with proper hierarchy", async () => {
  const chapterErrors: string[] = [];
  for (let ch = 1; ch <= 13; ch++) {
    const markdown = await readFile(new URL(`../app/content/chapters/chapter-${ch}-catalan.md`, import.meta.url), "utf8");
    const page = extractPages(markdown)[0];
    if (!page) { chapterErrors.push(`Chapter ${ch} has no pages`); continue; }
    const lines = page.markdown.split(/\r?\n/);
    const viParagraphs: string[][] = [];
    let current: string[] | null = null;
    for (const line of lines) {
      const trimmed = line.trim();
      if (/^[A-Z]\d*\)/.test(trimmed)) {
        if (!current) current = [];
        current.push(line);
      } else if (current) {
        viParagraphs.push(current);
        current = null;
      }
    }
    if (current) viParagraphs.push(current);
    if (viParagraphs.length === 0) {
      chapterErrors.push(`Chapter ${ch} has no variation label paragraphs`);
      continue;
    }
    const totalLabels = viParagraphs.reduce((sum, p) => sum + p.length, 0);
    if (totalLabels < 2) {
      chapterErrors.push(`Chapter ${ch} has only ${totalLabels} variation label(s), expected at least 2`);
    }
  }
  assert.equal(chapterErrors.length, 0, chapterErrors.join("; "));
});

test("variation-index shared line resolves from initial position", () => {
  const content = `1.d4 Nf6 2.c4 e6
A) 3.g3`;

  const data = parseVariationIndexBlock(content);
  const aToken = data.rootNodes[0].tokens[0];
  assert.ok(aToken.navigation, "variation move should be navigable");
  const steps = aToken.navigation!.steps;
  assert.equal(steps[0].label, "Initial position");
  assert.equal(steps[1].label, "1.d4");
  assert.equal(steps[2].label, "Nf6");
  assert.equal(steps[3].label, "2.c4");
  assert.equal(steps[4].label, "e6");
  assert.equal(steps[5].label, "3.g3");
});

test("Chapter 2 variation-index block renders VariationIndexTree with correct aria-labels", async () => {
  const markdown = await readFile(new URL("../app/content/chapters/chapter-2-catalan.md", import.meta.url), "utf8");
  const page = extractPages(markdown).find((candidate) => candidate.number === 24);
  assert.ok(page, "Chapter 2 should have page 24");
  const html = renderToStaticMarkup(createElement(MarkdownChapterView, { markdown: page.markdown, onMove: () => {} }));
  assert.ok(html.includes('aria-label="Show position after 8...Be7"'));
  assert.ok(html.includes('aria-label="Show position after 8...Nd5!?"'));
  assert.ok(html.includes('aria-label="Show position after 8...Qd7"'));
  assert.ok(html.includes('aria-label="Show position after 9...Rb8"'));
  assert.ok(html.includes('aria-label="Show position after 9...O-O-O"'));
});
