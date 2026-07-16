import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function decodeHtmlEntities(text: string): string {
  return text.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function stripBold(text: string): string {
  return text.replace(/\*\*/g, "");
}

function isFenMarker(line: string): boolean {
  const t = line.trim();
  return /^\*{1,2}FEN:\*{1,2}\s*$/.test(t) || t === "FEN:" || t === "FEN";
}

function isHeading(line: string): boolean {
  return /^#{1,5}\s/.test(line.trim());
}

function getHeadingText(line: string): string {
  return line.trim().replace(/^#+\s+/, "").trim();
}

function isPageMarker(line: string): boolean {
  const t = getHeadingText(line);
  return t.startsWith("Page ") && /^\d+$/.test(t.replace("Page ", ""));
}

function isHR(line: string): boolean {
  return line.trim() === "---";
}

function isFenCodeBlock(line: string): string | null {
  const m = line.trim().match(/^`([^`]+)`\s*$/);
  if (!m) return null;
  const parts = m[1].split(/\s+/);
  if (parts.length >= 6 && /\d/.test(m[1])) return m[1];
  return null;
}

type ParseBlock = { type: "heading" | "prose" | "diagram"; text: string; fen?: string; label?: string };

function parseBlocks(content: string): ParseBlock[] {
  const lines = content.split(/\r?\n/).map(l => decodeHtmlEntities(l));
  const result: ParseBlock[] = [];
  const proseLines: string[] = [];

  function flushProse() {
    while (proseLines.length > 0 && proseLines[proseLines.length - 1].trim() === "") proseLines.pop();
    while (proseLines.length > 0 && proseLines[0].trim() === "") proseLines.shift();
    if (proseLines.length > 0) {
      const text = proseLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
      if (text) result.push({ type: "prose" as const, text });
      proseLines.length = 0;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (isPageMarker(raw)) continue;
    if (trimmed.startsWith("#") && !trimmed.startsWith("##") && isHeading(raw)) continue;

    if (isHR(trimmed)) { flushProse(); continue; }

    if (isHeading(raw) && !isPageMarker(raw)) {
      flushProse();
      result.push({ type: "heading" as const, text: getHeadingText(raw) });
      continue;
    }

    const fen = isFenCodeBlock(raw);
    if (fen) {
      const preamble: string[] = [];
      for (let j = proseLines.length - 1; j >= 0; j--) {
        const p = proseLines[j].trim();
        if (p.length === 0 && preamble.length === 0) continue;
        if (isFenMarker(p)) continue;
        preamble.unshift(stripBold(p));
      }
      const label = preamble.join(" ").replace(/^#+\s+/g, "").trim() || "Position";
      proseLines.length = 0;
      flushProse();
      result.push({ type: "diagram" as const, text: "", fen, label });
      continue;
    }

    proseLines.push(raw);
  }

  flushProse();
  return result;
}

function generateLesson(chapterNum: number, content: string, sourceHash: string): string {
  const blocks: string[] = [];
  const diagrams: string[] = [];
  const lines: string[] = [];
  const blockList = parseBlocks(content);
  let blockIdx = 0;
  let diagIdx = 0;
  const totalPages = (content.match(/^## Page \d+/gm) || []).length;
  const sourceSpans: string[] = [];

  for (let p = 1; p <= totalPages; p++) {
    sourceSpans.push(`  { id: ${JSON.stringify(`ch${chapterNum}-p${p}`)}, status: "proposed" as const, pageIndex: ${p - 1}, printedPage: ${p}, column: "full" as const, order: ${p}, crop: "", bbox: { x0: 0, top: 0, x1: 400, bottom: 600 } }`);
  }
  if (sourceSpans.length === 0) {
    sourceSpans.push(`  { id: ${JSON.stringify(`ch${chapterNum}-p1`)}, status: "proposed" as const, pageIndex: 0, printedPage: 1, column: "full" as const, order: 1, crop: "", bbox: { x0: 0, top: 0, x1: 400, bottom: 600 } }`);
  }

  let lastSpanId = sourceSpans.length > 0 ? `ch${chapterNum}-p1` : `ch${chapterNum}-p1`;

  for (const block of blockList) {
    if (block.type === "heading") {
      if (/^Page \d+/.test(block.text)) {
        const pm = block.text.match(/^Page (\d+)/);
        if (pm) lastSpanId = `ch${chapterNum}-p${pm[1]}`;
      }
      blocks.push(`  { id: ${JSON.stringify(`b${String(blockIdx++).padStart(3, "0")}`)}, type: "heading" as const, status: "proposed" as const, sourceSpanId: ${JSON.stringify(lastSpanId)}, text: ${JSON.stringify(block.text)} }`);
      continue;
    }

    if (block.type === "prose") {
      blocks.push(`  { id: ${JSON.stringify(`b${String(blockIdx++).padStart(3, "0")}`)}, type: "prose" as const, status: "proposed" as const, sourceSpanId: ${JSON.stringify(lastSpanId)}, text: ${JSON.stringify(stripBold(block.text))} }`);
      continue;
    }

    if (block.type === "diagram") {
      const fenId = `ch${chapterNum}-fen-${diagIdx + 1}`;
      const diagLabel = block.label || "Position";

      lines.push(`  sourcePosition(${JSON.stringify(fenId)}, ${JSON.stringify(diagLabel)}, ${JSON.stringify(block.fen)})`);

      const diagramId = `CH${chapterNum}-D${++diagIdx}`;
      diagrams.push(`  { id: ${JSON.stringify(diagramId)}, associationStatus: "proposed" as const, positionStatus: "proposed" as const, boardIdentityStatus: "proposed" as const, sourceSpanId: ${JSON.stringify(lastSpanId)}, crop: "", role: ${JSON.stringify(diagLabel)}, lineId: ${JSON.stringify(fenId)}, moveIndex: -1, fen: ${JSON.stringify(block.fen)} }`);

      blocks.push(`  { id: ${JSON.stringify(`b${String(blockIdx++).padStart(3, "0")}`)}, type: "diagram" as const, status: "proposed" as const, sourceSpanId: ${JSON.stringify(lastSpanId)}, diagramId: ${JSON.stringify(diagramId)} }`);
    }
  }

  const lessonId = `catalan.chapter${chapterNum}`;

  const SOURCE_HASH = JSON.stringify(sourceHash);

  return `import { Chess } from "chess.js";
import type { DiagramLink, LessonBlock, LessonDocument, SourceSpan, VariationNode } from "./lesson-model";

function sourcePosition(id: string, label: string, fen: string): VariationNode {
  new Chess(fen);
  return { id, label, parentLineId: null, parentPly: 0, startFen: fen, startLabel: label, moves: [] };
}

const sourceSpans: SourceSpan[] = [
${sourceSpans.join(",\n")}
];

const lines: VariationNode[] = [
${lines.join(",\n")}
];

const diagrams: DiagramLink[] = [
${diagrams.join(",\n")}
];

const blocks: LessonBlock[] = [
${blocks.join(",\n")}
];

const SOURCE_HASH = ${SOURCE_HASH};

export const CHAPTER${chapterNum}_LESSON: LessonDocument = {
  schemaVersion: 2,
  lessonId: ${JSON.stringify(lessonId)},
  status: "proposed",
  title: ${JSON.stringify(`Chapter ${chapterNum}`)},
  subtitle: "",
  source: { documentId: ${JSON.stringify(lessonId)}, filename: ${JSON.stringify(`Chapter${chapterNum}_Catalan.pdf`)}, sha256: SOURCE_HASH },
  basePosition: { status: "proposed", after: "Initial position", fen: new Chess().fen(), moves: [] },
  sourceSpans,
  lines,
  diagrams,
  blocks,
};

export const CHAPTER${chapterNum}_ANNOTATED_MOVE_IDS: string[] = [];

export const CHAPTER${chapterNum}_SECTIONS: { id: string; label: string; blockId: string }[] = [
  { id: "overview", label: "Overview", blockId: "b000" },
];
`;
}

function generateManifest(chapterNum: number): string {
  const hashes: Record<number, string> = {
    10: "4F1EFB947D24278E2B616ED1C0C496CD402F62AC7D395871DAC970E309BDFDD9",
    11: "25F8A3ED3414121CEE80142543372EB72D62B4E114BE5F350DAB0FDAAE2AF0B7",
  };
  const hash = hashes[chapterNum] || "0000000000000000000000000000000000000000000000000000000000000000";
  const pdfPageCount = chapterNum === 10 ? 12 : chapterNum === 11 ? 23 : 0;

  return JSON.stringify({
    schemaVersion: 1,
    id: chapterNum,
    compatibility: "chapter1-legacy",
    source: {
      filename: `Chapter${chapterNum}_Catalan.pdf`,
      sha256: hash,
      pdfPageCount,
      printedStart: 1,
      printedEnd: pdfPageCount,
    },
    lesson: {
      expectedCanonicalHash: "0000000000000000000000000000000000000000000000000000000000000000",
      defaultPosition: { lineId: `ch${chapterNum}-fen-1`, ply: 0 },
    },
    review: { storageKey: `catalan-b2-review-chapter-${chapterNum}`, schemaVersion: 3 },
    verification: { regions: [] },
    evidence: {
      pageCount: pdfPageCount,
      diagramCount: 0,
      strictDirectory: false,
      inventorySha256: "0000000000000000000000000000000000000000000000000000000000000000",
    },
  }, null, 2);
}

function generatePackage(chapterNum: number): string {
  return `import { CHAPTER${chapterNum}_ANNOTATED_MOVE_IDS, CHAPTER${chapterNum}_LESSON, CHAPTER${chapterNum}_SECTIONS } from "../chapter${chapterNum}-lesson";
import manifest from "../chapter-manifests/chapter-${chapterNum}.json";
import { defineChapterPackage } from "../chapter-package";

export const CHAPTER_CONFIG = defineChapterPackage(manifest, {
  lesson: CHAPTER${chapterNum}_LESSON,
  annotatedMoveIds: CHAPTER${chapterNum}_ANNOTATED_MOVE_IDS,
  sections: CHAPTER${chapterNum}_SECTIONS,
});
`;
}

const chapterNum = parseInt(process.argv[2] || "0");
const markdownPath = process.argv[3] || "";

if (!chapterNum || !markdownPath) {
  console.error("Usage: tsx scripts/convert-markdown-chapter.ts <chapterNum> <markdown-path>");
  process.exit(1);
}

const appDir = process.cwd();
const content = readFileSync(markdownPath, "utf8");
const blocks = parseBlocks(content);
const headingCount = blocks.filter(b => b.type === "heading").length;
const diagramCount = blocks.filter(b => b.type === "diagram").length;
const proseCount = blocks.filter(b => b.type === "prose").length;
const totalPages = (content.match(/^## Page \d+/gm) || []).length;
  const fenInCode = [...content.matchAll(/^`([^`]+)`\s*$/gm)].filter(m => m[1].split(/\s+/).length >= 6 && /\d/.test(m[1])).length;
  
  const hashes: Record<number, string> = {
    10: "4F1EFB947D24278E2B616ED1C0C496CD402F62AC7D395871DAC970E309BDFDD9",
    11: "25F8A3ED3414121CEE80142543372EB72D62B4E114BE5F350DAB0FDAAE2AF0B7",
  };
  const sourceHash = hashes[chapterNum] || "0000000000000000000000000000000000000000000000000000000000000000";

console.log(`Chapter ${chapterNum}: ${totalPages} pages, ${fenInCode} FEN code blocks, parsed into ${headingCount} headings + ${proseCount} prose + ${diagramCount} diagrams`);

const lessonOutput = generateLesson(chapterNum, content, sourceHash);
const manifestOutput = generateManifest(chapterNum);
const packageOutput = generatePackage(chapterNum);

writeFileSync(join(appDir, "app", `chapter${chapterNum}-lesson.ts`), lessonOutput, "utf8");
writeFileSync(join(appDir, "app", `chapter-manifests`, `chapter-${chapterNum}.json`), manifestOutput, "utf8");
writeFileSync(join(appDir, "app", `chapter-packages`, `chapter-${chapterNum}.ts`), packageOutput, "utf8");

console.log(`Generated: chapter${chapterNum}-lesson.ts, chapter-manifests/chapter-${chapterNum}.json, chapter-packages/chapter-${chapterNum}.ts`);
