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

function tokensForExactLine(markdown: string, exactLine: string) {
  const resolver = new MarkdownMoveResolver();
  extractFenBlocks(markdown).forEach(({ fen }, fenIndex) => resolver.addRoot(fen, `Chapter position ${fenIndex + 1}`));
  const lines = markdown.split(/\r?\n/);
  for (let index = 0; index < lines.length; index++) {
    const trimmed = lines[index].trim();
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
  for (let chapter = 1; chapter <= 12; chapter++) {
    const markdown = await readFile(new URL(`../app/content/chapters/chapter-${chapter}-catalan.md`, import.meta.url), "utf8");
    const audit = auditMarkdown(markdown);
    assert.ok(audit.total >= 25, `Chapter ${chapter} should contain substantial chess notation`);
    assert.ok(audit.resolved >= 20, `Chapter ${chapter} should expose navigable moves, received ${audit.resolved}`);
    assert.ok(audit.longestLine >= 3, `Chapter ${chapter} should have a multi-ply navigable line`);
  }
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

test("Chapter 1's variation index moves forward from the clicked 4.Nf3", async () => {
  const markdown = await readFile(new URL("../app/content/chapters/chapter-1-catalan.md", import.meta.url), "utf8");
  const variationIndex = markdown.split(/\r?\n/).find((line) => line.startsWith("Variation Index:"));
  assert.ok(variationIndex);

  const clicked = new MarkdownMoveResolver().resolveText(variationIndex).find((token) => token.display === "4.Nf3")?.navigation;
  assert.ok(clicked);
  assert.equal(clicked.steps[clicked.index]?.label, "4.Nf3");
  assert.equal(clicked.steps[clicked.index + 1]?.label, "4...g6");
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
    [1, 47], [2, 25], [3, 44], [4, 33], [5, 32], [6, 43], [7, 73], [8, 37], [12, 34],
  ]);

  for (const [chapter, expectedCount] of expectedDiagramCounts) {
    const markdown = await readFile(new URL(`../app/content/chapters/chapter-${chapter}-catalan.md`, import.meta.url), "utf8");
    const visibleDiagrams = markdown.match(/^\*\*FEN:\*\*/gm) ?? [];
    assert.equal(visibleDiagrams.length, expectedCount, `Chapter ${chapter} PDF diagram count`);
  }
});
