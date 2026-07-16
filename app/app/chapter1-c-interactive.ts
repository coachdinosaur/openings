import { Chess } from "chess.js";
import { C_BLOCKS as LEGACY_C_BLOCKS, C_SOURCE_SPANS as LEGACY_C_SOURCE_SPANS } from "./chapter1-c-section";
import type { DiagramLink, LessonBlock, MoveAnnotation, MoveReference, SourceSpan, VariationMove, VariationNode } from "./lesson-model";

const OPEN = ["d4", "Nf6", "c4", "e6", "g3", "d5", "Nf3"];
const C_AFTER = [...OPEN, "c5"];
const C1_AFTER_ENTRY = [...C_AFTER, "Bg2", "Be7"];
const C1_AFTER_MAIN = [...C1_AFTER_ENTRY, "O-O", "O-O", "dxc5", "Bxc5"];
const C2_START = [...C_AFTER, "Bg2", "Nc6", "O-O"];
const C21_START = [...C2_START, "Be7", "dxc5", "Bxc5"];
const C22_START = [...C2_START, "cxd4", "Nxd4"];

type ParsedToken = {
  source: string;
  san: string;
  moveNumber: number | null;
  turn: "w" | "b" | null;
  annotation?: MoveAnnotation;
};

type Snapshot = { fen: string; fullmove: number; turn: "w" | "b" };
type BuiltLine = { line: VariationNode; refs: MoveReference[] };

function fenAfter(sequence: string[]): string {
  const chess = new Chess();
  for (const san of sequence) chess.move(san);
  return chess.fen();
}

const BASE_FEN = fenAfter(OPEN);
const MOVE_RE = /(?<![A-Za-z0-9-])((?:\d+\.(?:\.){0,2})?(?:O-O-O|O-O|0-0-0|0-0|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#?!N±∞]*))(?=$|[^A-Za-z0-9-])/g;

function parseToken(source: string): ParsedToken | null {
  const number = source.match(/^(\d+)(\.{1,3})/);
  const moveNumber = number ? Number(number[1]) : null;
  const turn = number ? (number[2].length >= 2 ? "b" : "w") : null;
  let san = source.replace(/^\d+\.{1,3}/, "").replace(/^0-0-0/, "O-O-O").replace(/^0-0/, "O-O");
  const suffix = san.match(/[+#?!N±∞]+$/)?.[0] ?? "";
  if (suffix) san = san.slice(0, -suffix.length);
  const novelty = suffix.includes("N") ? "N" : undefined;
  const punctuation = suffix.match(/[!?]+/)?.[0];
  const evaluation = suffix.match(/[±∞]/)?.[0];
  if (!san || (/^[a-h][18]$/.test(san)) || (!/^O-O(?:-O)?$/.test(san) && !/^[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?$/.test(san))) return null;
  return { source, san, moveNumber, turn, annotation: punctuation || novelty || evaluation ? { punctuation, novelty, evaluation } : undefined };
}

function tokenize(text: string): ParsedToken[] {
  return [...text.matchAll(MOVE_RE)].map((match) => parseToken(match[1])).filter((token): token is ParsedToken => token !== null);
}

function snapshot(fen: string): Snapshot {
  const fields = fen.split(" ");
  return { fen, turn: fields[1] as "w" | "b", fullmove: Number(fields[5]) };
}

function snapshotMatches(item: Snapshot, token: ParsedToken): boolean {
  return (token.moveNumber === null || item.fullmove === token.moveNumber) && (token.turn === null || item.turn === token.turn);
}

function legalMove(fen: string, san: string): string | null {
  try {
    const chess = new Chess(fen);
    chess.move(san);
    return chess.fen();
  } catch {
    return null;
  }
}

function blockStartMoves(id: string): string[] {
  if (id === "c-heading") return OPEN;
  if (id === "c-intro-left" || id === "c-intro-right") return C_AFTER;
  if (id === "c1-heading") return [...C_AFTER, "Bg2"];
  if (id === "c1-start") return C1_AFTER_ENTRY;
  if (id.startsWith("c1-")) return C1_AFTER_MAIN;
  if (id === "c2-heading") return [...C_AFTER, "Bg2"];
  if (id === "c2-intro") return C2_START;
  if (id === "c21-heading") return C2_START;
  if (id.startsWith("c21-")) return C21_START;
  if (id === "c22-heading") return C2_START;
  if (id.startsWith("c22-")) return C22_START;
  return OPEN;
}

const headingLineIds: Record<string, string> = {
  "c-heading": "c-entry",
  "c1-heading": "c1-entry",
  "c2-heading": "c2-entry",
  "c21-heading": "c21-entry",
  "c22-heading": "c22-entry",
};

function makeLine(id: string, label: string, startFen: string, moves: VariationMove[]): VariationNode {
  const chess = new Chess(startFen);
  for (const move of moves) chess.move(move.san);
  return { id, label, parentLineId: null, parentPly: 0, startFen, startLabel: `Position before ${label}`, moves };
}

function buildBlock(block: Extract<LessonBlock, { type: "heading" | "prose" | "assessment" | "variation" }>, allSnapshots: Snapshot[]): BuiltLine[] {
  const startFen = fenAfter(blockStartMoves(block.id));
  const tokens = tokenize(block.text);
  const built: BuiltLine[] = [];
  const localSnapshots: Snapshot[] = [snapshot(startFen)];
  let currentFen = startFen;
  let currentStartFen = startFen;
  let currentId = headingLineIds[block.id] ?? `c-${block.id}-line-1`;
  let currentMoves: VariationMove[] = [];
  let currentRefs: MoveReference[] = [];
  let lineNumber = 1;

  const flush = () => {
    if (!currentMoves.length) return;
    const line = makeLine(currentId, `${block.id} source line ${lineNumber}`, currentStartFen, currentMoves);
    built.push({ line, refs: currentRefs });
    lineNumber += 1;
    currentMoves = [];
    currentRefs = [];
  };

  for (const token of tokens) {
    const current = snapshot(currentFen);
    let selected: Snapshot | null = null;
    if (snapshotMatches(current, token)) {
      selected = current;
      if (!legalMove(current.fen, token.san)) selected = null;
    }
    if (!selected) {
      const candidates = [...localSnapshots, ...allSnapshots].reverse();
      selected = candidates.find((candidate) => snapshotMatches(candidate, token) && legalMove(candidate.fen, token.san) !== null) ?? null;
    }
    // Source paragraphs often omit a move number when they continue a
    // sideline, or begin a new branch in the same paragraph. If the strict
    // move-number/turn match cannot identify a snapshot, retain the source
    // token and attach it to the newest legal snapshot instead of dropping it
    // from the learner's clickable narrative. The resulting line is still
    // validated move-by-move with chess.js; the source text remains unchanged.
    if (!selected) {
      const candidates = [snapshot(currentFen), ...localSnapshots, ...allSnapshots].reverse();
      selected = candidates.find((candidate) => legalMove(candidate.fen, token.san) !== null) ?? null;
    }
    if (!selected) {
      unresolvedTokens.push({ blockId: block.id, source: token.source });
      const fallback = currentMoves.length
        ? { lineId: currentId, moveIndex: currentMoves.length - 1 }
        : built.at(-1)
          ? { lineId: built.at(-1)!.line.id, moveIndex: built.at(-1)!.line.moves.length - 1 }
          : null;
      if (fallback) currentRefs.push({ source: token.source, ...fallback, unresolved: true });
      continue;
    }
    if (selected.fen !== currentFen) {
      flush();
      currentStartFen = selected.fen;
      currentId = headingLineIds[block.id] && lineNumber === 1 ? headingLineIds[block.id] : `c-${block.id}-line-${lineNumber}`;
      currentFen = selected.fen;
    }
    const nextFen = legalMove(currentFen, token.san);
    if (!nextFen) continue;
    const moveIndex = currentMoves.length;
    const move: VariationMove = {
      id: `${currentId}-${String(moveIndex + 1).padStart(2, "0")}`,
      san: token.san,
      sourceToken: token.source,
      annotation: token.annotation,
      sourceSpanId: block.sourceSpanId,
    };
    currentMoves.push(move);
    currentRefs.push({ source: token.source, lineId: currentId, moveIndex });
    currentFen = nextFen;
    const next = snapshot(nextFen);
    localSnapshots.push(next);
    allSnapshots.push(next);
  }
  flush();
  return built;
}

const allSnapshots: Snapshot[] = [snapshot(BASE_FEN)];
const parsedBlocks: LessonBlock[] = [];
const parsedLines: VariationNode[] = [];
const refsByBlock = new Map<string, MoveReference[]>();
const builtByBlock = new Map<string, BuiltLine[]>();
const unresolvedTokens: Array<{ blockId: string; source: string }> = [];

for (const block of LEGACY_C_BLOCKS) {
  if (!("text" in block) || block.type === "move-sequence") {
    parsedBlocks.push(block);
    continue;
  }
  const built = buildBlock(block, allSnapshots);
  builtByBlock.set(block.id, built);
  parsedLines.push(...built.map((item) => item.line));
  const refs = built.flatMap((item) => item.refs);
  refsByBlock.set(block.id, refs);
  parsedBlocks.push({ ...block, moveRefs: refs });
}

function fenAt(line: VariationNode, moveIndex: number): string {
  const chess = new Chess(line.startFen ?? BASE_FEN);
  line.moves.slice(0, moveIndex + 1).forEach((move) => chess.move(move.san));
  return chess.fen();
}

type DiagramSpec = { id: string; blockId: string; token?: string; occurrence?: number; sourceSpanId: string; crop: string; role: string };

const diagramSpecs: DiagramSpec[] = [
  { id: "C-D01", blockId: "c-heading", token: "4...c5", sourceSpanId: "chapter1-p14-left-c", crop: "/source/crops/c/C-D01.png", role: "Starting position after 4...c5" },
  { id: "C-D02", blockId: "c1-start", token: "Bxc5", sourceSpanId: "chapter1-p14-right-c", crop: "/source/crops/c/C-D02.png", role: "C1 position after 7...Bxc5" },
  { id: "C-D03", blockId: "c1-p15-left", token: "12.Nc3", sourceSpanId: "chapter1-p15-left-c", crop: "/source/crops/c/C-D03.png", role: "C1 position after 12.Nc3" },
  { id: "C-D04", blockId: "c1-p15-right", token: "a5", occurrence: 3, sourceSpanId: "chapter1-p15-right-c", crop: "/source/crops/c/C-D04.png", role: "C1 position after 15...a5" },
  { id: "C-D05", blockId: "c1-p16-left", token: "Nc6", sourceSpanId: "chapter1-p16-left-c", crop: "/source/crops/c/C-D05.png", role: "C1 position after 10...Nc6" },
  { id: "C-D06", blockId: "c1-p16-right", token: "15.Bc1", sourceSpanId: "chapter1-p16-right-c", crop: "/source/crops/c/C-D06.png", role: "C1 position after 15.Bc1" },
  { id: "C-D07", blockId: "c1-p17-left", token: "16.Qd3", sourceSpanId: "chapter1-p17-left-c", crop: "/source/crops/c/C-D07.png", role: "C1 position after 16.Qd3" },
  { id: "C-D08", blockId: "c1-p17-left", token: "18.Qa1", sourceSpanId: "chapter1-p17-left-c", crop: "/source/crops/c/C-D08.png", role: "C1 position after 18.Qa1" },
  { id: "C-D09", blockId: "c1-p17-right", token: "19.Bc5", sourceSpanId: "chapter1-p17-right-c", crop: "/source/crops/c/C-D09.png", role: "C1 position after the bishop exchange idea" },
  { id: "C-D10", blockId: "c2-heading", token: "6.O-O", sourceSpanId: "chapter1-p18-left-c", crop: "/source/crops/c/C-D10.png", role: "C2 position after 6.O-O" },
  { id: "C-D11", blockId: "c21-heading", token: "Bxc5", sourceSpanId: "chapter1-p18-left-c", crop: "/source/crops/c/C-D11.png", role: "C21 position after 7...Bxc5" },
  { id: "C-D12", blockId: "c21-p18-right", token: "11.Nc3", sourceSpanId: "chapter1-p18-right-c", crop: "/source/crops/c/C-D12.png", role: "C21 position after 11.Nc3" },
  { id: "C-D13", blockId: "c21-p19-left", token: "9.b4", sourceSpanId: "chapter1-p19-left-c", crop: "/source/crops/c/C-D13.png", role: "C21 position after 9.b4" },
  { id: "C-D14", blockId: "c21-p19-right", token: "12.Rc1", sourceSpanId: "chapter1-p19-right-c", crop: "/source/crops/c/C-D14.png", role: "C21 position after 12.Rc1" },
  { id: "C-D15", blockId: "c21-p20-left", token: "12...e5", sourceSpanId: "chapter1-p20-left-c", crop: "/source/crops/c/C-D15.png", role: "C21 position after 12...e5" },
  { id: "C-D16", blockId: "c21-p20-right", token: "13.cxd5", sourceSpanId: "chapter1-p20-right-c", crop: "/source/crops/c/C-D16.png", role: "C21 position after 13.cxd5" },
  { id: "C-D17", blockId: "c21-p20-right", token: "14...Na5", sourceSpanId: "chapter1-p20-right-c", crop: "/source/crops/c/C-D17.png", role: "C21 position after 14...Na5" },
  { id: "C-D18", blockId: "c21-p20-right", token: "15...f6?", sourceSpanId: "chapter1-p20-right-c", crop: "/source/crops/c/C-D18.png", role: "C21 continuation after 15...f6?" },
  { id: "C-D19", blockId: "c22-heading", token: "7.Nxd4", sourceSpanId: "chapter1-p21-left-c", crop: "/source/crops/c/C-D19.png", role: "C22 position after 7.Nxd4" },
  { id: "C-D20", blockId: "c22-p21-left", token: "7...Bc5", sourceSpanId: "chapter1-p21-left-c", crop: "/source/crops/c/C-D20.png", role: "C22 position after 7...Bc5" },
  { id: "C-D21", blockId: "c22-p21-right", token: "8...Be7", sourceSpanId: "chapter1-p21-right-c", crop: "/source/crops/c/C-D21.png", role: "C22 position after 8...Be7" },
  { id: "C-D22", blockId: "c22-p22-left", token: "Bc7", sourceSpanId: "chapter1-p22-left-c", crop: "/source/crops/c/C-D22.png", role: "C22 position after 13...Bc7" },
  { id: "C-D23", blockId: "c22-p22-left", token: "9.cxd5", sourceSpanId: "chapter1-p22-left-c", crop: "/source/crops/c/C-D23.png", role: "C22 alternative after 9.cxd5" },
  { id: "C-D24", blockId: "c22-p22-right", token: "Nxc3", occurrence: 2, sourceSpanId: "chapter1-p22-right-c", crop: "/source/crops/c/C-D24.png", role: "C22 position after 11...Nxc3" },
  { id: "C-D25", blockId: "c22-p23-left", token: "12.Bxc3", sourceSpanId: "chapter1-p23-left-c", crop: "/source/crops/c/C-D25.png", role: "C22 position after 12.Bxc3" },
];

function findDiagramAnchor(spec: DiagramSpec): { lineId: string | null; moveIndex: number | null; fen: string } {
  const refs = refsByBlock.get(spec.blockId) ?? [];
  const matchingRefs = spec.token ? refs.filter((item) => item.source.includes(spec.token!)) : [];
  const ref = (spec.occurrence ? matchingRefs[spec.occurrence - 1] : matchingRefs[0]) ?? refs.at(-1);
  if (!ref) return { lineId: null, moveIndex: null, fen: BASE_FEN };
  const line = parsedLines.find((item) => item.id === ref.lineId);
  return line ? { lineId: line.id, moveIndex: ref.moveIndex, fen: fenAt(line, ref.moveIndex) } : { lineId: null, moveIndex: null, fen: BASE_FEN };
}

export const C_DIAGRAMS: DiagramLink[] = diagramSpecs.map((spec) => {
  const anchor = findDiagramAnchor(spec);
  return {
    id: spec.id,
    associationStatus: "source-verified",
    positionStatus: "deterministically derived",
    boardIdentityStatus: "unresolved",
    sourceSpanId: spec.sourceSpanId,
    crop: spec.crop,
    role: spec.role,
    lineId: anchor.lineId,
    moveIndex: anchor.moveIndex,
    fen: anchor.fen,
  };
});

const diagramBlocksBySource = new Map<string, LessonBlock[]>();
for (const spec of diagramSpecs) {
  const diagram = C_DIAGRAMS.find((item) => item.id === spec.id)!;
  const blocks = diagramBlocksBySource.get(spec.blockId) ?? [];
  blocks.push({ id: `${spec.id}-block`, type: "diagram", status: "source-verified", sourceSpanId: spec.sourceSpanId, diagramId: diagram.id });
  diagramBlocksBySource.set(spec.blockId, blocks);
}

export const C_BLOCKS: LessonBlock[] = parsedBlocks.flatMap((block) => [block, ...(diagramBlocksBySource.get(block.id) ?? [])]);
export const C_LINES: VariationNode[] = parsedLines;
export const C_SOURCE_SPANS: SourceSpan[] = LEGACY_C_SOURCE_SPANS.map((span) => span.id === "chapter1-p14-left-c" ? { ...span, bbox: { ...span.bbox, top: 395 } } : span);
export const C_ANNOTATED_MOVE_IDS = C_LINES.flatMap((line) => line.moves).filter((move) => move.annotation).map((move) => move.id);
export const C_UNRESOLVED_TOKENS = unresolvedTokens;
