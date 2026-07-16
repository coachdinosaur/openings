import { Chess } from "chess.js";
import type { DiagramLink, LessonBlock, LessonDocument, MoveAnnotation, MoveReference, SourceSpan, VariationMove, VariationNode } from "./lesson-model";
import { sourceMoveRefs } from "./chapter-source-transcripts";

const SOURCE_HASH = "2CE209B77AB517583F50BE6C470548C44BA4C6D831C86828C39D9E905542BF3B";
type MoveSpec = string | readonly [san: string, sourceToken: string];

function annotationFor(san: string, sourceToken: string): MoveAnnotation | undefined {
  const suffix = sourceToken.startsWith(san) ? sourceToken.slice(san.length) : sourceToken.replace(san, "");
  const punctuation = suffix.match(/[!?]+/)?.[0];
  const novelty = suffix.includes("N") ? "N" : undefined;
  const evaluation = suffix.match(/\+\-|Â±|âˆž|=/)?.[0];
  return punctuation || novelty || evaluation ? { punctuation, novelty, evaluation } : undefined;
}

function line(id: string, label: string, startFen: string, specs: MoveSpec[], sourceSpanId: string): VariationNode {
  const chess = new Chess(startFen);
  const moves: VariationMove[] = specs.map((spec, index) => {
    const [san, sourceToken] = typeof spec === "string" ? [spec, spec] : spec;
    try { chess.move(san); }
    catch { throw new Error(`${id}: invalid canonical move ${san} at source ply ${index + 1} from ${chess.fen()}`); }
    const annotation = annotationFor(san, sourceToken);
    return { id: `${id}-${String(index + 1).padStart(2, "0")}`, san, sourceToken, sourceSpanId, ...(annotation ? { annotation } : {}) };
  });
  return { id, label, parentLineId: null, parentPly: 0, startFen, startLabel: `Position before ${label}`, moves };
}

const sourceSpans: SourceSpan[] = [
  {
    id: "chapter9-p126-full",
    status: "source-verified",
    pageIndex: 0,
    printedPage: 126,
    column: "full",
    order: 1,
    crop: "/source/chapter9/pages/printed-126.png",
    bbox: { x0: 0, top: 0, x1: 474.96, bottom: 676.08 }
  },
  {
    id: "chapter9-p127-left",
    status: "source-verified",
    pageIndex: 1,
    printedPage: 127,
    column: "left",
    order: 2,
    crop: "/source/chapter9/pages/printed-127.png",
    bbox: { x0: 35, top: 50, x1: 237, bottom: 640 }
  },
  {
    id: "chapter9-p127-right",
    status: "source-verified",
    pageIndex: 1,
    printedPage: 127,
    column: "right",
    order: 3,
    crop: "/source/chapter9/pages/printed-127.png",
    bbox: { x0: 237, top: 50, x1: 440, bottom: 640 }
  },
  {
    id: "chapter9-p128-left",
    status: "source-verified",
    pageIndex: 2,
    printedPage: 128,
    column: "left",
    order: 4,
    crop: "/source/chapter9/pages/printed-128.png",
    bbox: { x0: 35, top: 50, x1: 237, bottom: 640 }
  },
  {
    id: "chapter9-p128-right",
    status: "source-verified",
    pageIndex: 2,
    printedPage: 128,
    column: "right",
    order: 5,
    crop: "/source/chapter9/pages/printed-128.png",
    bbox: { x0: 237, top: 50, x1: 440, bottom: 640 }
  },
  {
    id: "chapter9-p129-left",
    status: "source-verified",
    pageIndex: 3,
    printedPage: 129,
    column: "left",
    order: 6,
    crop: "/source/chapter9/pages/printed-129.png",
    bbox: { x0: 35, top: 50, x1: 237, bottom: 640 }
  },
  {
    id: "chapter9-p129-right",
    status: "source-verified",
    pageIndex: 3,
    printedPage: 129,
    column: "right",
    order: 7,
    crop: "/source/chapter9/pages/printed-129.png",
    bbox: { x0: 237, top: 50, x1: 440, bottom: 640 }
  },
  {
    id: "chapter9-p130-left",
    status: "source-verified",
    pageIndex: 4,
    printedPage: 130,
    column: "left",
    order: 8,
    crop: "/source/chapter9/pages/printed-130.png",
    bbox: { x0: 35, top: 50, x1: 237, bottom: 640 }
  },
  {
    id: "chapter9-p130-right",
    status: "source-verified",
    pageIndex: 4,
    printedPage: 130,
    column: "right",
    order: 9,
    crop: "/source/chapter9/pages/printed-130.png",
    bbox: { x0: 237, top: 50, x1: 440, bottom: 640 }
  },
  {
    id: "chapter9-p131-left",
    status: "source-verified",
    pageIndex: 5,
    printedPage: 131,
    column: "left",
    order: 10,
    crop: "/source/chapter9/pages/printed-131.png",
    bbox: { x0: 35, top: 50, x1: 237, bottom: 640 }
  },
  {
    id: "chapter9-p131-right",
    status: "source-verified",
    pageIndex: 5,
    printedPage: 131,
    column: "right",
    order: 11,
    crop: "/source/chapter9/pages/printed-131.png",
    bbox: { x0: 237, top: 50, x1: 440, bottom: 640 }
  },
  {
    id: "chapter9-p132-left",
    status: "source-verified",
    pageIndex: 6,
    printedPage: 132,
    column: "left",
    order: 12,
    crop: "/source/chapter9/pages/printed-132.png",
    bbox: { x0: 35, top: 50, x1: 237, bottom: 640 }
  },
  {
    id: "chapter9-p132-right",
    status: "source-verified",
    pageIndex: 6,
    printedPage: 132,
    column: "right",
    order: 13,
    crop: "/source/chapter9/pages/printed-132.png",
    bbox: { x0: 237, top: 50, x1: 440, bottom: 640 }
  },
  {
    id: "chapter9-p133-left",
    status: "source-verified",
    pageIndex: 7,
    printedPage: 133,
    column: "left",
    order: 14,
    crop: "/source/chapter9/pages/printed-133.png",
    bbox: { x0: 35, top: 50, x1: 237, bottom: 640 }
  },
  {
    id: "chapter9-p133-right",
    status: "source-verified",
    pageIndex: 7,
    printedPage: 133,
    column: "right",
    order: 15,
    crop: "/source/chapter9/pages/printed-133.png",
    bbox: { x0: 237, top: 50, x1: 440, bottom: 640 }
  },
];

const INITIAL_FEN = new Chess().fen();
const CH9_BASE = ["d4", "Nf6", "c4", "e6", "g3", "d5", "Nf3", "dxc4", "Bg2", "b5"] as const;
const CH9_ROOT = [...CH9_BASE, "a4", "c6", "axb5", "cxb5", "Ne5", "Nd5", "O-O", "Bb7", "b3", "cxb3", "Qxb3", "a6"] as const;

function sourceLine(id: string, label: string, continuation: MoveSpec[], sourceSpanId: string): VariationNode {
  return line(id, label, INITIAL_FEN, [...CH9_BASE, ...continuation], sourceSpanId);
}

function rootLine(id: string, label: string, continuation: MoveSpec[], sourceSpanId: string): VariationNode {
  return sourceLine(id, label, [...CH9_ROOT.slice(CH9_BASE.length), ...continuation], sourceSpanId);
}

const lines: VariationNode[] = [
  sourceLine("ch9-opening", "Position after 5...b5", [], "chapter9-p126-full"),
  sourceLine("ch9-start", "Position after 6.a4", ["a4"], "chapter9-p127-left"),

  rootLine("ch9-main", "Position after 12.e4", ["e4"], "chapter9-p128-right"),
  rootLine("ch9-nc7", "Note) 12...Nc7 13.Qf3!N", ["e4", ["Nc7", "Nc7"], ["Qf3", "Qf3!N"]], "chapter9-p128-right"),

  rootLine("ch9-a", "A) 12...Nf6 13.d5", ["e4", "Nf6", "d5"], "chapter9-p129-left"),
  rootLine("ch9-a-qb6", "A) note 13...Qb6 14.Nc4", ["e4", "Nf6", "d5", ["Qb6", "Qb6"], "Nc4"], "chapter9-p129-left"),
  rootLine("ch9-a1", "A1) 13...Bd6 14.dxe6N", ["e4", "Nf6", "d5", "Bd6", ["dxe6", "dxe6N"]], "chapter9-p129-right"),
  rootLine("ch9-a1-nxe5", "A1) after 16...e5 17.Nxe5!!", ["e4", "Nf6", "d5", "Bd6", "dxe6", "fxe6", "Rd1", "Qe7", "Nd3", "e5", ["Nxe5", "Nxe5!!"]], "chapter9-p130-left"),
  rootLine("ch9-a2", "A2) 13...exd5 14.exd5!", ["e4", "Nf6", "d5", "exd5", ["exd5", "exd5!"]], "chapter9-p130-left"),
  rootLine("ch9-a2-qe7", "A2) after 15.Qe3 Qe7", ["e4", "Nf6", "d5", "exd5", "exd5", "Bxd5", "Qe3", "Qe7"], "chapter9-p130-right"),
  rootLine("ch9-a2-b4", "A2) after 16...b4", ["e4", "Nf6", "d5", "exd5", "exd5", "Bxd5", "Qe3", "Qe7", "Ba3", ["b4", "b4"], "Bxb4", "Qe6"], "chapter9-p130-right"),

  rootLine("ch9-b", "B) 12...Nb4N 13.d5", ["e4", ["Nb4", "Nb4N"], "d5"], "chapter9-p131-left"),

  rootLine("ch9-b-bd6", "B) 14...Bd6 15.Bf4 0-0 16.Nc3", ["e4", "Nb4", "d5", "exd5", "exd5", "Bd6", "Bf4", "O-O", "Nc3"], "chapter9-p132-left"),
  rootLine("ch9-b-a5", "B) 16...a5", ["e4", "Nb4", "d5", "exd5", "exd5", "Bd6", "Bf4", "O-O", "Nc3", "a5"], "chapter9-p132-right"),

  rootLine("ch9-b-qb6", "B) 16...Qb6 17.Rfd1 a5 18.Be3 Bc5", ["e4", "Nb4", "d5", "exd5", "exd5", "Bd6", "Bf4", "O-O", "Nc3", "Qb6", "Rfd1", "a5", "Be3", "Bc5"], "chapter9-p133-left"),
  rootLine("ch9-b-final", "B) 20...a4 21.Qb1 a3 22.Ng4!", ["e4", "Nb4", "d5", "exd5", "exd5", "Bd6", "Bf4", "O-O", "Nc3", "Qb6", "Rfd1", "a5", "Be3", "Bc5", "Bxc5", "Qxc5", "Rac1", "a4", "Qb1", "a3", ["Ng4", "Ng4!"]], "chapter9-p133-right"),
];
const byId = (id: string) => {
  const found = lines.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`Missing Chapter 9 line ${id}`);
  return found;
};

function moveRefsInText(text: string, preferredLineId: string, sourceSpanId: string): MoveReference[] {
  return sourceMoveRefs(text, lines, preferredLineId, sourceSpanId);
}

type RegionCopy = { id: string; title: string; text: string; lineId: string };
const regionCopy: RegionCopy[] = [
  {
    id: "chapter9-p126-full",
    title: "Chapter 9 - Variation Index",
    text: "1.d4 Nf6 2.c4 e6 3.g3 d5 4.Nf3 dxc4 5.Bg2 b5 6.a4 c6 7.axb5 cxb5 8.Ne5 Nd5 9.O-O Bb7 10.b3 cxb3 11.Qxb3 a6 12.e4. A) 12...Nf6 13.d5 -- 129, A1) 13...Bd6 -- 129, A2) 13...exd5 -- 130, B) 12...Nb4N -- 131.",
    lineId: "ch9-main"
  },
  {
    id: "chapter9-p127-left",
    title: "5...b5 - Main introduction",
    text: "After 5...b5 Black defends the extra pawn. 6.a4 is best. 6...c6 is forced to avoid Bb4+. 7.axb5 is correct, followed by 8.Ne5 Nd5 9.O-O Bb7 10.b3! White activates the queen before striking in the centre.",
    lineId: "ch9-start"
  },
  {
    id: "chapter9-p127-right",
    title: "Sidelines after 9.O-O",
    text: "Black's alternatives: 9...Be7 10.Nc3 f6 11.e4 gives White a decisive initiative. 9...f6 runs into 10.e4 Ne7 11.Qh5+ g6 12.Nxg6. After 9...Bb7 10.b3! Black must choose between 10...cxb3 and 10...b4.",
    lineId: "ch9-main"
  },
  {
    id: "chapter9-p128-left",
    title: "10...cxb3 11.Qxb3 a6",
    text: "11...Nc6 12.Nxc6 Bxc6 13.e4 leads to dangerous play for Black. 11...b4 12.Nc3! leaves Black behind in development. 12.e4 Nc7 13.Qf3!N is even more convincing than the old 13.d5 line.",
    lineId: "ch9-main"
  },
  {
    id: "chapter9-p128-right",
    title: "12.e4 with A) 12...Nf6 and B) 12...Nb4N",
    text: "At 12.e4 the main continuations are A) 12...Nf6 13.d5 and B) 12...Nb4N. The position after 12...Nc7 13.Qf3!N is also promising for White.",
    lineId: "ch9-main"
  },
  {
    id: "chapter9-p129-left",
    title: "A) 12...Nf6 13.d5",
    text: "13...Nbd7N meets a refutation: 14.Nxf7!. 13...Qb6 14.Nc4 with Na5 ideas. 13...Bd6 is A1 and 13...exd5 is A2. 15.Na5 leads to the position after 17...Qe7 where 18.Bg5N! is strong.",
    lineId: "ch9-a"
  },
  {
    id: "chapter9-p129-right",
    title: "A1) 13...Bd6 14.dxe6N",
    text: "14.dxe6N is even stronger than 14.Nxf7. After 14...fxe6 15.Rd1 Qe7 16.Nd3 e5, the brilliant 17.Nxe5!! decides the game. 17...Bxe4 18.Bxe4 Nxe4 19.Re1 Qxe5 20.Nc3.",
    lineId: "ch9-a1"
  },
  {
    id: "chapter9-p130-left",
    title: "A1 continuation and A2) 13...exd5",
    text: "The A1 line features the 17.Nxe5!! sacrifice. A2) 13...exd5 14.exd5! Bxd5 15.Qe3 Qe7 16.Ba3 b4 17.Bxb4. White's sequence is natural and keeps a clear advantage.",
    lineId: "ch9-a1-nxe5"
  },
  {
    id: "chapter9-p130-right",
    title: "A2) conclusion and B) 12...Nb4N",
    text: "After 17.Bxb4 Qe6 18.Bxf8 Kxf8 19.Bxd5 Nxd5 20.Qc5+ Ne7 21.Re1 Nbc6 22.Nc3 Nxe5 23.Rxe5 Rc8 24.Na5+- Black cannot hold. B) 12...Nb4N 13.d5 is the critical test.",
    lineId: "ch9-a2-qe7"
  },
  {
    id: "chapter9-p131-left",
    title: "B) 12...Nb4N 13.d5",
    text: "13...exd5 14.exd5 Bxd5 15.Re1+ Kf7 16.Rd1 Bxb3 17.Rxd8 Ra7 18.Rb8 Nc2 19.Ra5! is the key line. Black regains the piece but White is clearly better. 14.exd5 Bd6 15.Bf4 0-0 16.Nc3 is the alternative.",
    lineId: "ch9-b"
  },
  {
    id: "chapter9-p131-right",
    title: "B) 13...exd5 main line",
    text: "The forced sequence leads to 19.Ra5!, the only square for the rook. After 20...Rd7 21.Nd2 Nd4 22.Nxb3 Nxb3 23.Rxa6 Rd1+ 24.Bf1 Rxc1 25.Ra7+ Kg6 26.Kg2± White retains an advantage.",
    lineId: "ch9-b"
  },
  {
    id: "chapter9-p132-left",
    title: "B) 14.exd5 Bd6 15.Bf4 0-0 16.Nc3",
    text: "The alternative 14...Bxd5 15.Qe3 Qe7 16.Bxd5 Nxd5 17.Qe4 Qe6 18.Rd1 Nc7 19.Ra2! Be7 20.Rc2 0-0 21.Rxc7 Bd6 22.Qxa8 Bxc7 23.Nf3±. After 15.Bf4 0-0 16.Nc3 Black still faces difficulties.",
    lineId: "ch9-b-bd6"
  },
  {
    id: "chapter9-p132-right",
    title: "B) 16...a5 and alternatives",
    text: "16...a5 17...Bxe5 18.Bxe5 a5 19.Bd4 Qa6 20.Rfe1 Nd7 21.Re7 Rad8 22.Rde1 gives White full compensation. 16...Re8 17.Nc6! and 16...Qb6 17.Rad1 are also promising for White.",
    lineId: "ch9-b-a5"
  },
  {
    id: "chapter9-p133-left",
    title: "B) 17.Rfd1 Qb6 18.Be3",
    text: "18.Be3 Bc5 19.Bxc5 Qxc5 20.Rac1 gives White full compensation for the pawn. Black must be careful to hold the position. 20...a4 21.Qb1 a3 leads to the critical line with 22.Ng4!",
    lineId: "ch9-b-qb6"
  },
  {
    id: "chapter9-p133-right",
    title: "Conclusion",
    text: "After 5...b5 6.a4 c6 7.axb5 cxb5 8.Ne5 Nd5 I recommend 9.O-O. This move has not been played often, giving scope for fresh ideas. 9...Bb7 10.b3! is important. 12...Nb4N seems like the critical test, but White stands well. There are wonderful attacking themes in this chapter.",
    lineId: "ch9-b-final"
  },
];

const diagramSpecs: { id: string; sourceSpanId: string; role: string; lineId: string }[] = [
  { id: "CH9-D01", sourceSpanId: "chapter9-p126-full", role: "Chapter starting position after 5...b5", lineId: "ch9-opening" },
  { id: "CH9-D02", sourceSpanId: "chapter9-p126-full", role: "Index preview: note to move 12", lineId: "ch9-nc7" },
  { id: "CH9-D03", sourceSpanId: "chapter9-p126-full", role: "Index preview: A) note to move 13", lineId: "ch9-a" },
  { id: "CH9-D04", sourceSpanId: "chapter9-p126-full", role: "Index preview: A1) after 16...e5", lineId: "ch9-a1-nxe5" },
  { id: "CH9-D05", sourceSpanId: "chapter9-p127-left", role: "Position after 5...b5", lineId: "ch9-opening" },
  { id: "CH9-D06", sourceSpanId: "chapter9-p127-left", role: "Position after 8.Ne5 Nd5", lineId: "ch9-start" },
  { id: "CH9-D07", sourceSpanId: "chapter9-p128-left", role: "Position after 11...b4", lineId: "ch9-main" },
  { id: "CH9-D08", sourceSpanId: "chapter9-p128-right", role: "Position after 12.e4", lineId: "ch9-main" },
  { id: "CH9-D09", sourceSpanId: "chapter9-p128-right", role: "Position after 12...Nc7", lineId: "ch9-nc7" },
  { id: "CH9-D10", sourceSpanId: "chapter9-p129-left", role: "A) 12...Nf6 13.d5", lineId: "ch9-a" },
  { id: "CH9-D11", sourceSpanId: "chapter9-p129-left", role: "A) after 17...Qe7", lineId: "ch9-a" },
  { id: "CH9-D12", sourceSpanId: "chapter9-p129-right", role: "A1) 13...Bd6", lineId: "ch9-a1" },
  { id: "CH9-D13", sourceSpanId: "chapter9-p130-left", role: "A1) after 16...e5", lineId: "ch9-a1-nxe5" },
  { id: "CH9-D14", sourceSpanId: "chapter9-p130-left", role: "A2) 13...exd5 14.exd5!", lineId: "ch9-a2" },
  { id: "CH9-D15", sourceSpanId: "chapter9-p130-right", role: "A2) after 16...b4", lineId: "ch9-a2-b4" },
  { id: "CH9-D16", sourceSpanId: "chapter9-p131-left", role: "A2) after 19...Nxd5", lineId: "ch9-a2-qe7" },
  { id: "CH9-D17", sourceSpanId: "chapter9-p131-left", role: "B) 12...Nb4N", lineId: "ch9-b" },
  { id: "CH9-D18", sourceSpanId: "chapter9-p131-right", role: "B) after 19...Nc2", lineId: "ch9-b" },
  { id: "CH9-D19", sourceSpanId: "chapter9-p132-left", role: "B) after 18...Nc7", lineId: "ch9-b-bd6" },
  { id: "CH9-D20", sourceSpanId: "chapter9-p132-left", role: "B) 16.Nc3 position", lineId: "ch9-b-bd6" },
  { id: "CH9-D21", sourceSpanId: "chapter9-p133-left", role: "B) after 17...Qb6", lineId: "ch9-b-qb6" },
  { id: "CH9-D22", sourceSpanId: "chapter9-p133-right", role: "B) after 20...a3", lineId: "ch9-b-final" },
];
export const CHAPTER9_DIAGRAMS: DiagramLink[] = diagramSpecs.map((spec) => {
  const sourceLine = byId(spec.lineId);
  const moveIndex = sourceLine.moves.length - 1;
  const chess = new Chess(sourceLine.startFen);
  sourceLine.moves.slice(0, moveIndex + 1).forEach((move) => chess.move(move.san));
  return { id: spec.id, associationStatus: "source-verified", positionStatus: "deterministically derived", boardIdentityStatus: "source-verified", sourceSpanId: spec.sourceSpanId, crop: `/source/chapter9/crops/${spec.id}.png`, role: spec.role, lineId: spec.lineId, moveIndex, fen: chess.fen() };
});

const diagramIdsBySpan = new Map<string, string[]>();
for (const diagram of CHAPTER9_DIAGRAMS) diagramIdsBySpan.set(diagram.sourceSpanId, [...(diagramIdsBySpan.get(diagram.sourceSpanId) ?? []), diagram.id]);

function interactiveLine(lineId: string): { text: string; moveRefs: MoveReference[] } {
  const sourceLine = byId(lineId);
  const tokens: string[] = [];
  const moveRefs: MoveReference[] = [];
  sourceLine.moves.forEach((move, moveIndex) => {
    const source = moveIndex % 2 === 0 ? `${Math.floor(moveIndex / 2) + 1}.${move.sourceToken}` : move.sourceToken;
    tokens.push(source);
    moveRefs.push({ source, lineId, moveIndex });
  });
  return { text: tokens.join(" "), moveRefs };
}

const blocks: LessonBlock[] = regionCopy.flatMap((region, index) => {
  const regionNumber = String(index + 1).padStart(2, "0");
  const interactive = interactiveLine(region.lineId);
  const sourceText = interactive.text;
  const regionBlocks: LessonBlock[] = [
    { id: `ch9-heading-${regionNumber}`, type: "heading", status: "source-verified", sourceSpanId: region.id, text: region.title, moveRefs: moveRefsInText(region.title, region.lineId, region.id) },
    { id: `ch9-line-${regionNumber}`, type: "variation", status: "source-verified", sourceSpanId: region.id, title: region.title, text: sourceText, lineId: region.lineId, moveRefs: moveRefsInText(sourceText, region.lineId, region.id) },
  ];
  for (const diagramId of diagramIdsBySpan.get(region.id) ?? []) regionBlocks.push({ id: `${diagramId.toLowerCase()}-block`, type: "diagram", status: "source-verified", sourceSpanId: region.id, diagramId });
  return regionBlocks;
});

export const CHAPTER9_LESSON: LessonDocument = {
  schemaVersion: 2,
  lessonId: "catalan.chapter9.complete",
  status: "source-verified",
  title: "Chapter 9 - Complete",
  subtitle: "The Catalan: 4...dxc4 5...b5",
  source: { documentId: "catalan.chapter9", filename: "Chapter9_Catalan.pdf", sha256: SOURCE_HASH },
  basePosition: { status: "deterministically derived", after: "Initial position", fen: new Chess().fen(), moves: [] },
  sourceSpans,
  lines,
  diagrams: CHAPTER9_DIAGRAMS,
  blocks,
};

export const CHAPTER9_ANNOTATED_MOVE_IDS = CHAPTER9_LESSON.lines.flatMap((item) => item.moves).filter((move) => move.annotation).map((move) => move.id);
export const CHAPTER9_SECTIONS = [
  { id: "overview", label: "Overview", blockId: "ch9-heading-01" },
  { id: "opening", label: "6.a4 introduction", blockId: "ch9-heading-02" },
  { id: "sides", label: "Sidelines after 9.O-O", blockId: "ch9-heading-03" },
  { id: "cxb3", label: "10...cxb3 11.Qxb3 a6", blockId: "ch9-heading-04" },
  { id: "e4", label: "12.e4", blockId: "ch9-heading-05" },
  { id: "a", label: "A) 12...Nf6 13.d5", blockId: "ch9-heading-06" },
  { id: "a1", label: "A1) 13...Bd6 14.dxe6N", blockId: "ch9-heading-07" },
  { id: "a1-nxe5", label: "A1) 17.Nxe5!!", blockId: "ch9-heading-08" },
  { id: "a2", label: "A2) 13...exd5", blockId: "ch9-heading-09" },
  { id: "a2-conclusion", label: "A2) conclusion", blockId: "ch9-heading-10" },
  { id: "b", label: "B) 12...Nb4N 13.d5", blockId: "ch9-heading-11" },
  { id: "b-main", label: "B) 13...exd5 main line", blockId: "ch9-heading-12" },
  { id: "b-bf4", label: "B) 14.exd5 Bd6 15.Bf4", blockId: "ch9-heading-13" },
  { id: "b-a5", label: "B) 16...a5", blockId: "ch9-heading-14" },
  { id: "b-qb6", label: "B) 17.Rfd1 Qb6", blockId: "ch9-heading-15" },
  { id: "conclusion", label: "Conclusion", blockId: "ch9-heading-15" },
];
