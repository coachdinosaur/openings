import crypto from "node:crypto";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Chess } from "chess.js";
import { canonicalize } from "../app/canonical";
import type { LessonDocument, VariationMove, VariationNode } from "../app/lesson-model";

const lessonPath = process.argv[2];
if (!lessonPath) throw new Error("Usage: tsx scripts/validate-chapter-lesson.ts app/chapterN-lesson.ts");
const lessonModule = await import(pathToFileURL(path.resolve(lessonPath)).href) as Record<string, unknown>;
const lesson = Object.entries(lessonModule).find(([name]) => /_LESSON$/.test(name))?.[1] as LessonDocument | undefined;
if (!lesson) throw new Error(`No *_LESSON export found in ${lessonPath}`);

const lines = new Map(lesson.lines.map((line) => [line.id, line]));
function prefixMoves(line: VariationNode, stack = new Set<string>()): VariationMove[] {
  if (!line.parentLineId) return [];
  if (stack.has(line.id)) throw new Error(`line ${line.id} has a parent cycle`);
  const parent = lines.get(line.parentLineId);
  if (!parent) throw new Error(`line ${line.id} references missing parent ${line.parentLineId}`);
  return [...prefixMoves(parent, new Set(stack).add(line.id)), ...parent.moves.slice(0, line.parentPly)];
}

for (const line of lesson.lines) {
  const chess = new Chess(line.startFen ?? lesson.basePosition.fen);
  const moves = line.startFen ? line.moves : [...prefixMoves(line), ...line.moves];
  for (const [index, move] of moves.entries()) {
    try { chess.move(move.san); }
    catch (error) { throw new Error(`${line.id} ply ${index + 1} (${move.sourceToken} -> ${move.san}): ${error instanceof Error ? error.message : "illegal move"}`); }
  }
}

const linkedBlocks = lesson.blocks.filter((block) => "moveRefs" in block && block.moveRefs?.length).length;
const linkedMoves = lesson.blocks.reduce((total, block) => total + ("moveRefs" in block ? block.moveRefs?.length ?? 0 : 0), 0);
const unlinkedNotationBlocks = lesson.blocks.filter((block) => "text" in block && /(?:^|\s)\d+\.(?:\.\.)?\s*(?:O-O-O|O-O|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8])/.test(block.text) && (!("moveRefs" in block) || !block.moveRefs?.length));
if (unlinkedNotationBlocks.length) throw new Error(`Notation blocks without move links: ${unlinkedNotationBlocks.map((block) => block.id).join(", ")}`);

const chapterId = Number(/Chapter(\d+)_Catalan\.pdf$/.exec(lesson.source.filename)?.[1]);
if (chapterId >= 6) {
  const displayedMove = /(?:\d+\.(?:\.\.)?\s*)?(?:O-O-O|O-O|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?|[a-h]x[a-h][1-8]|[a-h][1-8])[+#]?[!?N=]*/g;
  const incompleteLinks = lesson.blocks.filter((block) => {
    if (!("text" in block)) return false;
    const displayed = [...block.text.matchAll(displayedMove)].map((match) => match[0].trim());
    const references = "moveRefs" in block ? block.moveRefs ?? [] : [];
    return displayed.length !== references.length || displayed.some((token, index) => references[index]?.source !== token);
  });
  if (incompleteLinks.length) throw new Error(`Every displayed source move must have a matching source-order link: ${incompleteLinks.map((block) => block.id).join(", ")}`);
  const authoredSpans = new Set(lesson.blocks.filter((block) => block.type === "variation").map((block) => block.sourceSpanId));
  const missingAuthoredSpans = lesson.sourceSpans.filter((span) => !authoredSpans.has(span.id)).map((span) => span.id);
  if (missingAuthoredSpans.length) throw new Error(`Authored variation blocks are required for every source region: ${missingAuthoredSpans.join(", ")}`);
  const generatedBlocks = lesson.blocks.filter((block) => block.type === "variation" && (/^source position\b|^chapter \d+ analysis - printed page/i.test(block.title) || /this region contains the source analysis|linked source image preserves the complete notation/i.test(block.text)));
  if (generatedBlocks.length) throw new Error(`Generated placeholder variation blocks are not publishable: ${generatedBlocks.map((block) => block.id).join(", ")}`);
  const sourceOnlyDiagrams = lesson.diagrams.filter((diagram) => diagram.positionStatus !== "deterministically derived" || !diagram.lineId || diagram.moveIndex === null || diagram.moveIndex < 0 || /^source position\b/i.test(diagram.role));
  if (sourceOnlyDiagrams.length) throw new Error(`Every diagram must use an authored legal line and role: ${sourceOnlyDiagrams.map((diagram) => diagram.id).join(", ")}`);
}

const canonicalHash = crypto.createHash("sha256").update(canonicalize(lesson)).digest("hex").toUpperCase();
console.log(`Validated ${lessonPath}`);
console.log(`Move links ${linkedMoves} across ${linkedBlocks} blocks`);
console.log(`Canonical SHA-256 ${canonicalHash}`);
