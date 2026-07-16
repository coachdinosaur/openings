import assert from "node:assert/strict";
import test from "node:test";
import { parseChapter, extractPages, extractFenBlocks } from "../app/lib/markdown-chapter";

test("parseChapter extracts title from top-level heading", () => {
  const chapter = parseChapter("chapter-10-catalan.md", "# Chapter 10 — Test\n\n## Page 1\n\nContent");
  assert.equal(chapter.title, "Chapter 10 — Test");
  assert.equal(chapter.chapterNumber, 10);
  assert.equal(chapter.id, "chapter-10-catalan");
});

test("parseChapter extracts default title when no heading", () => {
  const chapter = parseChapter("chapter-5-test.md", "## Page 1\n\nContent");
  assert.equal(chapter.title, "Chapter 5");
  assert.equal(chapter.chapterNumber, 5);
});

test("extractPages finds ## Page N headings", () => {
  const content = "## Page 1\n\nContent 1\n\n## Page 2\n\nContent 2\n\n## Page 3\n\nContent 3";
  const pages = extractPages(content);
  assert.equal(pages.length, 3);
  assert.equal(pages[0].number, 1);
  assert.equal(pages[1].number, 2);
  assert.equal(pages[2].number, 3);
});

test("extractPages returns single page when no page headings", () => {
  const content = "# Chapter\n\nSome content without page breaks.";
  const pages = extractPages(content);
  assert.equal(pages.length, 1);
  assert.equal(pages[0].number, 1);
});

test("extractPages preserves markdown content inside pages", () => {
  const content = "## Page 1\n\n**Bold text** and *italic*";
  const pages = extractPages(content);
  assert.ok(pages[0].markdown.includes("**Bold text**"));
  assert.ok(pages[0].markdown.includes("*italic*"));
});

test("extractPages rejects duplicate page numbers", () => {
  const content = "## Page 1\n\nContent\n\n## Page 1\n\nMore content";
  assert.throws(() => extractPages(content), /Duplicate page heading/);
});

test("extractPages rejects non-sequential page order", () => {
  const content = "## Page 2\n\nContent\n\n## Page 1\n\nMore content";
  assert.throws(() => extractPages(content), /not in ascending order/);
});

test("extractPages handles Windows line endings", () => {
  const content = "## Page 1\r\n\r\nContent\r\n\r\n## Page 2\r\n\r\nMore content";
  const pages = extractPages(content);
  assert.equal(pages.length, 2);
});

test("extractPages does not treat deeper headings as page boundaries", () => {
  const content = "## Page 1\n\n### Not a page\n\nContent\n\n#### Also not a page\n\nMore content";
  const pages = extractPages(content);
  assert.equal(pages.length, 1);
});

test("Chapter 10 fixture produces exactly 11 pages", () => {
  const content = `# Chapter 10 — Catalan 4...dxc4: 5...a6 and 6...Nc6
## Page 1
Content
## Page 2
Content
## Page 3
Content
## Page 4
Content
## Page 5
Content
## Page 6
Content
## Page 7
Content
## Page 8
Content
## Page 9
Content
## Page 10
Content
## Page 11
Content`;
  const pages = extractPages(content);
  assert.equal(pages.length, 11);
});

test("extractFenBlocks detects FEN blocks", () => {
  const markdown = "**FEN:**\n`rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1`";
  const blocks = extractFenBlocks(markdown);
  assert.equal(blocks.length, 1);
  assert.ok(blocks[0].fen.includes("rnbqkbnr"));
});

test("extractFenBlocks supports multiple FEN blocks per page", () => {
  const markdown = "**FEN:**\n`rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1`\n\nText\n\n**FEN:**\n`4k3/8/8/8/8/8/8/4K3 w - - 0 1`";
  const blocks = extractFenBlocks(markdown);
  assert.equal(blocks.length, 2);
});

test("extractFenBlocks ignores inline code not associated with FEN label", () => {
  const markdown = "Some `inline code` and **FEN:**\n`rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1`";
  const blocks = extractFenBlocks(markdown);
  assert.equal(blocks.length, 1);
});

test("extractFenBlocks returns empty for no FEN", () => {
  const markdown = "Just some text without FEN";
  const blocks = extractFenBlocks(markdown);
  assert.equal(blocks.length, 0);
});

test("extractChapterNumber from various filename patterns", () => {
  const ch1 = parseChapter("chapter-10-catalan.md", "# Chapter 10");
  assert.equal(ch1.chapterNumber, 10);

  const ch2 = parseChapter("Chapter_9_Catalan.md", "# Chapter 9");
  assert.equal(ch2.chapterNumber, 9);
});
