import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MarkdownChapterView } from "../app/components/MarkdownRenderer";
import { normalizeSan, resolveChessMove } from "../app/lib/chess-notation";
import { extractFenBlocks, extractPages } from "../app/lib/markdown-chapter";
import { MarkdownMoveResolver } from "../app/lib/markdown-moves";

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

function auditMarkdown(markdown: string) {
  const resolver = new MarkdownMoveResolver();
  extractFenBlocks(markdown).forEach(({ fen }, fenIndex) => resolver.addRoot(fen, `Chapter position ${fenIndex + 1}`));
  const lines = markdown.split(/\r?\n/);
  let total = 0;
  let resolved = 0;
  let longestLine = 0;
  for (let index = 0; index < lines.length; index++) {
    const hidden = /^<!--\s*FEN:\s*([^>]+?)\s*-->$/.exec(lines[index].trim());
    if (hidden) {
      resolver.setAnchor(hidden[1].trim());
      continue;
    }
    if (lines[index].trim().startsWith("**FEN:**")) {
      const visible = /^`([^`]+)`$/.exec(lines[index + 1]?.trim() ?? "");
      if (visible) resolver.setAnchor(visible[1].trim());
      continue;
    }
    if (/^`[^`]+`$/.test(lines[index].trim())) continue;
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

test("every published Markdown chapter contains navigable move lines", async () => {
  for (let chapter = 1; chapter <= 11; chapter++) {
    const markdown = await readFile(new URL(`../app/content/chapters/chapter-${chapter}-catalan.md`, import.meta.url), "utf8");
    const audit = auditMarkdown(markdown);
    assert.ok(audit.total >= 25, `Chapter ${chapter} should contain substantial chess notation`);
    assert.ok(audit.resolved >= 20, `Chapter ${chapter} should expose navigable moves, received ${audit.resolved}`);
    assert.ok(audit.longestLine >= 3, `Chapter ${chapter} should have a multi-ply navigable line`);
  }
});

test("a clicked Markdown move carries its complete previous/next navigation path", () => {
  const resolver = new MarkdownMoveResolver("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  const tokens = resolver.resolveText("1.d4 Nf6 2.c4 e6");
  const last = tokens.at(-1)?.navigation;
  assert.ok(last);
  assert.equal(last.index, 4);
  assert.deepEqual(last.steps.slice(1).map((step) => step.label), ["1.d4", "Nf6", "2.c4", "e6"]);
});

test("numbered sibling variations can return to an older exact branch root", () => {
  const resolver = new MarkdownMoveResolver();
  resolver.resolveText("1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.Nf3 Be7");
  const alternative = resolver.resolveText("2.Nf3").at(-1)?.navigation;
  assert.ok(alternative, "the move-two sibling should resolve beyond the former three-position history limit");
  assert.equal(alternative.steps.at(-1)?.label, "2.Nf3");
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
  assert.deepEqual(novelty.navigation.steps.slice(-3).map((step) => step.label), ["7...c6", "8.Bf4!?", "8...b6N"]);

  const mainLineEnd = tokens.find((token) => token.display === "11.Rad1");
  assert.ok(mainLineEnd?.navigation, "the main line should remain navigable after both alternatives");
  assert.deepEqual(mainLineEnd.navigation.steps.slice(-8).map((step) => step.label), [
    "7...c6", "8.Bf4!?", "8...b6N", "9.Nbd2", "c5", "10.dxc5", "bxc5", "11.Rad1",
  ]);
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

test("Chapters 1-8 expose every PDF diagram as a visible FEN board", async () => {
  const expectedDiagramCounts = [47, 25, 44, 33, 32, 43, 73, 37];

  for (let chapter = 1; chapter <= 8; chapter++) {
    const markdown = await readFile(new URL(`../app/content/chapters/chapter-${chapter}-catalan.md`, import.meta.url), "utf8");
    const visibleDiagrams = markdown.match(/^\*\*FEN:\*\*/gm) ?? [];
    assert.equal(visibleDiagrams.length, expectedDiagramCounts[chapter - 1], `Chapter ${chapter} PDF diagram count`);
  }
});
