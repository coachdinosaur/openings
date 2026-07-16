export interface MarkdownChapter {
  id: string;
  slug: string;
  chapterNumber: number;
  order: number;
  title: string;
  pages: MarkdownPage[];
}

export interface MarkdownPage {
  id: string;
  number: number;
  markdown: string;
}

const PAGE_HEADING = /^## Page (\d+)\s*$/gm;

export function parseChapter(filename: string, content: string): MarkdownChapter {
  const chapterNumber = extractChapterNumber(filename);
  const title = extractTitle(content, filename);
  const slug = filename.replace(/\.md$/i, "").toLowerCase().replace(/\s+/g, "-");
  const id = slug;
  const pages = extractPages(content);
  return { id, slug, chapterNumber, order: chapterNumber, title, pages };
}

function extractChapterNumber(filename: string): number {
  const match = /chapter[_\s-]?(\d+)/i.exec(filename);
  if (match) return parseInt(match[1], 10);
  const altMatch = /(\d+)/.exec(filename);
  if (altMatch) return parseInt(altMatch[1], 10);
  return 0;
}

export function extractTitle(content: string, fallbackFilename = "untitled.md"): string {
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("# ") && !trimmed.startsWith("## ")) {
      return trimmed.replace(/^#\s+/, "");
    }
  }
  return `Chapter ${extractChapterNumber(fallbackFilename)}`;
}

export function extractPages(content: string): MarkdownPage[] {
  const pageHeadings: { number: number; index: number }[] = [];
  let match: RegExpExecArray | null;
  while ((match = PAGE_HEADING.exec(content)) !== null) {
    const number = parseInt(match[1], 10);
    const index = match.index;
    pageHeadings.push({ number, index });
  }

  if (pageHeadings.length === 0) {
    return [{ id: "page-1", number: 1, markdown: content.trim() }];
  }

  const seenNumbers = new Set<number>();
  for (const page of pageHeadings) {
    if (seenNumbers.has(page.number)) {
      throw new Error(`Duplicate page heading: ## Page ${page.number}`);
    }
    seenNumbers.add(page.number);
  }

  pageHeadings.sort((a, b) => a.index - b.index);
  const numbers = pageHeadings.map((p) => p.number);
  const sorted = [...numbers].sort((a, b) => a - b);
  for (let i = 0; i < numbers.length; i++) {
    if (numbers[i] !== sorted[i]) {
      throw new Error(`Page headings are not in ascending order: Page ${sorted[i]} found before Page ${numbers[i]}`);
    }
  }

  const pages: MarkdownPage[] = [];
  for (let i = 0; i < pageHeadings.length; i++) {
    const start = pageHeadings[i].index;
    const end = i + 1 < pageHeadings.length ? pageHeadings[i + 1].index : content.length;
    const pageContent = content.slice(start, end).trim();
    pages.push({
      id: `page-${pageHeadings[i].number}`,
      number: pageHeadings[i].number,
      markdown: pageContent,
    });
  }

  return pages;
}

export function extractFenBlocks(markdown: string): { fen: string; index: number }[] {
  const blocks: { fen: string; index: number }[] = [];
  const regex = /\*\*FEN:\*\*\s*\n\s*`([^`]+)`/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(markdown)) !== null) {
    const fen = match[1].trim();
    if (fen.split(" ").length >= 4) {
      blocks.push({ fen, index: match.index });
    }
  }
  return blocks;
}
