import { Chess } from "chess.js";
import type { DiagramLink, LessonBlock, LessonDocument, MoveAnnotation, MoveReference, SourceSpan, VariationMove, VariationNode } from "./lesson-model";
import { sourceMoveRefs, sourceTranscript } from "./chapter-source-transcripts";

const SOURCE_HASH = "E48B324A5B0661A229EA9E5259F285F2743076D1B3AC4A9015E02DED4E70393D";
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
    id: "chapter8-p112-full",
    status: "source-verified",
    pageIndex: 0,
    printedPage: 112,
    column: "full",
    order: 1,
    crop: "/source/chapter8/pages/printed-112.png",
    bbox: {
      x0: 0,
      top: 0,
      x1: 474.96,
      bottom: 676.08
    }
  },
  {
    id: "chapter8-p113-left",
    status: "source-verified",
    pageIndex: 1,
    printedPage: 113,
    column: "left",
    order: 2,
    crop: "/source/chapter8/pages/printed-113.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter8-p113-right",
    status: "source-verified",
    pageIndex: 1,
    printedPage: 113,
    column: "right",
    order: 3,
    crop: "/source/chapter8/pages/printed-113.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter8-p114-left",
    status: "source-verified",
    pageIndex: 2,
    printedPage: 114,
    column: "left",
    order: 4,
    crop: "/source/chapter8/pages/printed-114.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter8-p114-right",
    status: "source-verified",
    pageIndex: 2,
    printedPage: 114,
    column: "right",
    order: 5,
    crop: "/source/chapter8/pages/printed-114.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter8-p115-left",
    status: "source-verified",
    pageIndex: 3,
    printedPage: 115,
    column: "left",
    order: 6,
    crop: "/source/chapter8/pages/printed-115.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter8-p115-right",
    status: "source-verified",
    pageIndex: 3,
    printedPage: 115,
    column: "right",
    order: 7,
    crop: "/source/chapter8/pages/printed-115.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter8-p116-left",
    status: "source-verified",
    pageIndex: 4,
    printedPage: 116,
    column: "left",
    order: 8,
    crop: "/source/chapter8/pages/printed-116.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter8-p116-right",
    status: "source-verified",
    pageIndex: 4,
    printedPage: 116,
    column: "right",
    order: 9,
    crop: "/source/chapter8/pages/printed-116.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter8-p117-left",
    status: "source-verified",
    pageIndex: 5,
    printedPage: 117,
    column: "left",
    order: 10,
    crop: "/source/chapter8/pages/printed-117.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter8-p117-right",
    status: "source-verified",
    pageIndex: 5,
    printedPage: 117,
    column: "right",
    order: 11,
    crop: "/source/chapter8/pages/printed-117.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter8-p118-left",
    status: "source-verified",
    pageIndex: 6,
    printedPage: 118,
    column: "left",
    order: 12,
    crop: "/source/chapter8/pages/printed-118.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter8-p118-right",
    status: "source-verified",
    pageIndex: 6,
    printedPage: 118,
    column: "right",
    order: 13,
    crop: "/source/chapter8/pages/printed-118.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter8-p119-left",
    status: "source-verified",
    pageIndex: 7,
    printedPage: 119,
    column: "left",
    order: 14,
    crop: "/source/chapter8/pages/printed-119.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter8-p119-right",
    status: "source-verified",
    pageIndex: 7,
    printedPage: 119,
    column: "right",
    order: 15,
    crop: "/source/chapter8/pages/printed-119.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter8-p120-left",
    status: "source-verified",
    pageIndex: 8,
    printedPage: 120,
    column: "left",
    order: 16,
    crop: "/source/chapter8/pages/printed-120.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter8-p120-right",
    status: "source-verified",
    pageIndex: 8,
    printedPage: 120,
    column: "right",
    order: 17,
    crop: "/source/chapter8/pages/printed-120.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter8-p121-left",
    status: "source-verified",
    pageIndex: 9,
    printedPage: 121,
    column: "left",
    order: 18,
    crop: "/source/chapter8/pages/printed-121.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter8-p121-right",
    status: "source-verified",
    pageIndex: 9,
    printedPage: 121,
    column: "right",
    order: 19,
    crop: "/source/chapter8/pages/printed-121.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter8-p122-left",
    status: "source-verified",
    pageIndex: 10,
    printedPage: 122,
    column: "left",
    order: 20,
    crop: "/source/chapter8/pages/printed-122.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter8-p122-right",
    status: "source-verified",
    pageIndex: 10,
    printedPage: 122,
    column: "right",
    order: 21,
    crop: "/source/chapter8/pages/printed-122.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter8-p123-left",
    status: "source-verified",
    pageIndex: 11,
    printedPage: 123,
    column: "left",
    order: 22,
    crop: "/source/chapter8/pages/printed-123.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter8-p123-right",
    status: "source-verified",
    pageIndex: 11,
    printedPage: 123,
    column: "right",
    order: 23,
    crop: "/source/chapter8/pages/printed-123.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter8-p124-left",
    status: "source-verified",
    pageIndex: 12,
    printedPage: 124,
    column: "left",
    order: 24,
    crop: "/source/chapter8/pages/printed-124.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter8-p124-right",
    status: "source-verified",
    pageIndex: 12,
    printedPage: 124,
    column: "right",
    order: 25,
    crop: "/source/chapter8/pages/printed-124.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter8-p125-left",
    status: "source-verified",
    pageIndex: 13,
    printedPage: 125,
    column: "left",
    order: 26,
    crop: "/source/chapter8/pages/printed-125.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter8-p125-right",
    status: "source-verified",
    pageIndex: 13,
    printedPage: 125,
    column: "right",
    order: 27,
    crop: "/source/chapter8/pages/printed-125.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
];

const INITIAL_FEN = new Chess().fen();
const CH8_BASE = ["d4", "Nf6", "c4", "e6", "g3", "d5", "Nf3", "dxc4", "Bg2", "a6", "O-O", "b5"] as const;
const CH8_B_SETUP = ["Ne5", "Nd5", "a4", "Bb7", "e4", "Nf6", "axb5", "axb5", "Rxa8", "Bxa8", "Nc3"] as const;
const CH8_B_ROOT = [...CH8_B_SETUP, "c6", "d5"] as const;

function sourceLine(id: string, label: string, continuation: MoveSpec[], sourceSpanId: string): VariationNode {
  return line(id, label, INITIAL_FEN, [...CH8_BASE, ...continuation], sourceSpanId);
}

function bLine(id: string, label: string, continuation: MoveSpec[], sourceSpanId: string): VariationNode {
  return sourceLine(id, label, [...CH8_B_ROOT, ...continuation], sourceSpanId);
}

const lines: VariationNode[] = [
  sourceLine("ch8-opening", "Position after 6...b5", [], "chapter8-p112-full"),
  sourceLine("ch8-root", "Position after 7.Ne5", ["Ne5"], "chapter8-p113-left"),
  sourceLine("ch8-a-ra7", "A note) Position after 7...Ra7?!", ["Ne5", ["Ra7", "Ra7?!"]], "chapter8-p113-left"),
  sourceLine("ch8-a-b3", "A) Position after 8.b3", ["Ne5", "c6", "b3"], "chapter8-p113-right"),
  sourceLine("ch8-a-e5", "A) Position before 14.e5!", ["Ne5", "c6", "b3", "cxb3", "Nxc6", "Qb6", ["Na5", "Na5!"], "Ra7", "Nxb3", "Rd7", "e4", "Bb7", "Re1", "Be7"], "chapter8-p114-left"),
  sourceLine("ch8-a-qxd8", "A) Position before 19.Qxd8+", ["Ne5", "c6", "b3", "cxb3", "Nxc6", "Qb6", "Na5", "Ra7", "Nxb3", "Rd7", "e4", "Bb7", "Re1", "Be7", ["e5", "e5!"], "Nd5", "Qg4", "Kf8", "Bg5", "h5", "Qh4", "Bxg5", "Qxg5", "Qd8"], "chapter8-p114-right"),
  sourceLine("ch8-b-bb7", "B) Position after 8...Bb7", ["Ne5", "Nd5", "a4", "Bb7"], "chapter8-p114-right"),
  sourceLine("ch8-b-b4", "B) Position after 12...b4?!", [...CH8_B_SETUP, ["b4", "b4?!"]], "chapter8-p115-left"),
  sourceLine("ch8-b-main", "B) Main branching position after 13.d5", [...CH8_B_ROOT], "chapter8-p115-right"),

  bLine("ch8-b1-bxd5", "B1) Position before 15.Bxd5!", ["cxd5", "exd5", "Bxd5"], "chapter8-p116-left"),
  bLine("ch8-b1-bc5", "B1) Position before 21.Bc5+", ["cxd5", "exd5", "Bxd5", ["Bxd5", "Bxd5!"], "exd5", ["Ng4", "Ng4!"], "Be7", "Nxf6+", "Bxf6", "Re1+", "Kf8", "Nxd5", "Nc6", "Be3", "h5"], "chapter8-p117-left"),
  bLine("ch8-b1-nh6", "B1) Position before 18.Nh6!", ["cxd5", "exd5", "Bxd5", "Bxd5", "exd5", "Ng4", "Ne4", "Nxd5", "f5"], "chapter8-p117-left"),
  bLine("ch8-b1-rf3", "B1) Position before 22.Rf3!", ["cxd5", "exd5", "Bxd5", "Bxd5", "exd5", "Ng4", "Ne4", "Nxd5", "f5", ["Nh6", "Nh6!"], "Qd7", "Re1", "Bc5", "Be3", "Bxe3", "Rxe3", "Kf8"], "chapter8-p117-right"),

  bLine("ch8-b2-bf4", "B2) Position after 14.Bf4", ["Bd6", "Bf4"], "chapter8-p117-right"),
  bLine("ch8-b2-qc7", "B2) Position before 15.Nxf7!", ["Bd6", "Bf4", "Qc7"], "chapter8-p118-left"),
  bLine("ch8-b2-bd6", "B2) Position after 17.Bd6", ["Bd6", "Bf4", "cxd5", "Nxb5", "Bxe5", "Bxe5", "O-O", "Bd6"], "chapter8-p118-left"),
  bLine("ch8-b2-exd5", "B2) Position after 15...exd5N", ["Bd6", "Bf4", "Bxe5", "Bxe5", ["exd5", "exd5N"]], "chapter8-p119-left"),
  bLine("ch8-b2-bc7", "B2) Position after 18.Bc7!", ["Bd6", "Bf4", "Bxe5", "Bxe5", "exd5", "exd5", "cxd5", "Qa1", "Nc6", ["Bc7", "Bc7!"]], "chapter8-p119-left"),

  bLine("ch8-b3-start", "B3) Position after 14...cxd5", ["exd5", "exd5", "cxd5"], "chapter8-p119-right"),
  bLine("ch8-b3-qe8", "B3) Position after 17...Qe8!", ["exd5", "exd5", "cxd5", "Nxb5", ["Bc5", "Bc5!"], "Qa4", "O-O", "Qxa8", ["Qe8", "Qe8!"]], "chapter8-p120-left"),
  bLine("ch8-b3-bxb7", "B3) Position after 21.Bxb7", ["exd5", "exd5", "cxd5", "Nxb5", "Bc5", "Qa4", "O-O", "Qxa8", "Qe8", ["Qb7", "Qb7!?N"], "Qxe5", "Bf4", "Qe7", "Bxd5", "Qxb7", "Bxb7"], "chapter8-p120-right"),

  bLine("ch8-b4-na6", "B4) Position after 15...Na6", ["Be7", "dxe6", "fxe6", "Qe2", "Na6"], "chapter8-p120-right"),
  bLine("ch8-b4-main", "B4) Position after 16.Bh3", ["Be7", "dxe6", "fxe6", "Qe2", "O-O", "Bh3"], "chapter8-p121-left"),
  bLine("ch8-b41-rd1", "B41) Position after 18...Bb7", ["Be7", "dxe6", "fxe6", "Qe2", "O-O", "Bh3", "Kh8", "Bxe6", "Qe8", "Rd1", "Bb7"], "chapter8-p121-right"),
  bLine("ch8-b41-c5", "B41) Position after 24...c5!", ["Be7", "dxe6", "fxe6", "Qe2", "O-O", "Bh3", "Kh8", "Bxe6", "Qe8", "Rd1", "Bb7", "Bf4", "Na6", "Nd7", "Nxd7", "Bxd7", "Qf7", "e5", ["Qg6", "Qg6N"], "Be3", "Nb4", "Ra1", ["c5", "c5!"]], "chapter8-p122-left"),
  bLine("ch8-b41-qb7", "B41) Position after 22...Qb7", ["Be7", "dxe6", "fxe6", "Qe2", "O-O", "Bh3", "Kh8", "Bxe6", "Qe8", "Rd1", "Bb7", ["Be3", "Be3N"], "Bc8", "Bxc8", "Qxc8", "f4", "Na6", ["Ra1", "Ra1!?"] ,"Qb7"], "chapter8-p122-right"),
  bLine("ch8-b41-nh6", "B41) Position before 28.e6", ["Be7", "dxe6", "fxe6", "Qe2", "O-O", "Bh3", "Kh8", "Bxe6", "Qe8", "Rd1", "Bb7", "Be3", "Bc8", "Bxc8", "Qxc8", "f4", "Na6", "Ra1", "Qb7", ["Nf3", "Nf3!"], "Ra8", "e5", "Ng4", "Bd4", "Nb4", "Rxa8+", "Qxa8", "Ng5", "Nh6"], "chapter8-p122-right"),

  bLine("ch8-b42-nf3", "B42) Position after 17.Nf3", ["Be7", "dxe6", "fxe6", "Qe2", "O-O", "Bh3", "Qc8", "Nf3"], "chapter8-p123-left"),
  bLine("ch8-b42-ne8", "B42) Position before 18.Bg5N", ["Be7", "dxe6", "fxe6", "Qe2", "O-O", "Bh3", "Qc8", "Nf3", "Ne8"], "chapter8-p123-left"),
  bLine("ch8-b42-rd1", "B42) Position before 20.Rd1!?", ["Be7", "dxe6", "fxe6", "Qe2", "O-O", "Bh3", "Qc8", "Nf3", "Na6", "Ng5", "Nc7", "Bf4", "Nfe8"], "chapter8-p123-right"),
  bLine("ch8-b42-h6", "B42) Position before 21.Nf3", ["Be7", "dxe6", "fxe6", "Qe2", "O-O", "Bh3", "Qc8", "Nf3", "Na6", "Ng5", "Nc7", "Bf4", "Nfe8", ["Rd1", "Rd1!?"], "h6"], "chapter8-p124-left"),
  bLine("ch8-b42-bb7", "B42) Position after 20...Bb7", ["Be7", "dxe6", "fxe6", "Qe2", "O-O", "Bh3", "Qc8", "Nf3", "Na6", "Ng5", "Nc7", "Bf4", "Nfe8", "Rd1", "Bb7"], "chapter8-p124-left"),
  bLine("ch8-b42-bc5", "B42) Position after 25.Qe2", ["Be7", "dxe6", "fxe6", "Qe2", "O-O", "Bh3", "Qc8", "Nf3", "Na6", "Ng5", "Nc7", "Bf4", "Nfe8", "Rd1", "Bb7", ["Qe3", "Qe3N"], "h6", "Nf3", "Na6", "Ne5", "Nec7", "Ng6", "Bc5", ["Qe2", "Qe2!"]], "chapter8-p124-right"),
  bLine("ch8-b42-rxd6", "B42) Position after 27.Rxd6", ["Be7", "dxe6", "fxe6", "Qe2", "O-O", "Bh3", "Qc8", "Nf3", "Na6", "Ng5", "Nc7", "Bf4", "Nfe8", "Rd1", "Bb7", "Qe3", "h6", "Nf3", "Na6", "Ne5", "Nec7", "Ng6", "Bc5", ["Qe2", "Qe2!"], "Rd8", ["Bd6", "Bd6!"], "Bxd6", "Rxd6"], "chapter8-p125-left"),
];
const byId = (id: string) => {
  const found = lines.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`Missing Chapter 8 line ${id}`);
  return found;
};

function moveRefsInText(text: string, preferredLineId: string, sourceSpanId: string): MoveReference[] {
  return sourceMoveRefs(text, lines, preferredLineId, sourceSpanId);
}

type RegionCopy = { id: string; title: string; text: string; lineId: string };
const regionCopy: RegionCopy[] = [
  {
    id: "chapter8-p112-full",
    title: "Chapter 8 - 5...a6 and 6...b5 index",
    text: "The index starts from 1.d4 Nf6 2.c4 e6 3.g3 d5 4.Nf3 dxc4 5.Bg2 a6 6.O-O b5 7.Ne5. The chapter splits into A) 7...c6 and B) 7...Nd5, with the main branch reaching 8.a4 Bb7 9.e4 Nf6 10.axb5 axb5 11.Rxa8 Bxa8 12.Nc3 c6 13.d5.",
    lineId: "ch8-b-main"
  },
  {
    id: "chapter8-p113-left",
    title: "The direct pawn hold",
    text: "After 5...a6 6.O-O b5, Black tries to keep the extra pawn in the most direct way. The inferior 7...Ra7?! is shown to be too slow because White immediately breaks the queenside with a4.",
    lineId: "ch8-a-ra7"
  },
  {
    id: "chapter8-p113-right",
    title: "A) 7...c6 and 8.b3",
    text: "White breaks up Black's structure with 8.a4 against ...Ra7, then the chapter turns to A) 7...c6. The recommended 8.b3 lets White attack the pawn chain while keeping enough pressure to regain c4 favourably.",
    lineId: "ch8-a-b3"
  },
  {
    id: "chapter8-p114-left",
    title: "A) central pressure after 12.e4",
    text: "The A line shows how ...Bb7 and passive king moves leave Black behind. White's d5 thrust, Re1 and Bg5 ideas expose the king and make the c4-pawn difficult to justify.",
    lineId: "ch8-a-e5"
  },
  {
    id: "chapter8-p114-right",
    title: "B) 7...Nd5 is the main reply",
    text: "After the A endgame, the chapter identifies 7...Nd5 as Black's most popular answer. White chooses 8.a4, and the note to 8...c6 explains the transposition to the next chapter after b3 and e4.",
    lineId: "ch8-b-bb7"
  },
  {
    id: "chapter8-p115-left",
    title: "B) 8.a4 and 9.e4",
    text: "The source rejects 9.b3 because Black has the positional piece sacrifice ...c3 and ...b4. The main line uses 9.e4 Nf6, and the note to 9...Nb4?! highlights the tactical queen lift to h5.",
    lineId: "ch8-b-b4"
  },
  {
    id: "chapter8-p115-right",
    title: "The branching point after 13.d5",
    text: "After 10.axb5 axb5 11.Rxa8 Bxa8 12.Nc3 c6, 13.d5 is the critical central thrust. Black can choose B1) 13...cxd5, B2) 13...Bd6, B3) 13...exd5 or B4) 13...Be7.",
    lineId: "ch8-b-main"
  },
  {
    id: "chapter8-p116-left",
    title: "B1) 13...cxd5 and 15.Bxd5!",
    text: "Against 13...cxd5, White avoids the unclear knight capture and plays 15.Bxd5!. The notes show that ...Nxd5 loses control of h5 and allows the standard Wh5 and Nxg6 tactical motif.",
    lineId: "ch8-b1-bxd5"
  },
  {
    id: "chapter8-p116-right",
    title: "B1) Thematic knight sacrifice",
    text: "The forcing B1 line features 17.Nxg6!, Qe5 and checks on c8. White's lead in development and rook access to the e-file leave Black in serious trouble even after the most tenacious queen defence.",
    lineId: "ch8-b1-bc5"
  },
  {
    id: "chapter8-p117-left",
    title: "B1) the final attacking motif",
    text: "The B1 analysis continues with Ng4, b4 and Nh6 ideas. The point is that White's queen and minor pieces enter with tempo while Black's king and dark-squared bishop remain vulnerable.",
    lineId: "ch8-b1-nh6"
  },
  {
    id: "chapter8-p117-right",
    title: "B2) 13...Bd6",
    text: "B2) 13...Bd6 looks natural but gives White a clear target. The source's continuation uses the exposed bishop to seize the initiative and force Black into a tactically unpleasant defence.",
    lineId: "ch8-b2-bf4"
  },
  {
    id: "chapter8-p118-left",
    title: "B2) tactical refutations",
    text: "Against B2, moves like ...g5 or ...Qc7 do not solve Black's problem. White's Nxf7 sacrifice and later Qa1 idea show how the e-pawn and long diagonal combine to break through.",
    lineId: "ch8-b2-qc7"
  },
  {
    id: "chapter8-p118-right",
    title: "B2) why simplification still favours White",
    text: "The B2 notes show that even when Black tries to liquidate with captures on d5, White's passed pawn and active queen-side route keep the attack alive. The source transitions toward the B3 structure.",
    lineId: "ch8-b2-bd6"
  },
  {
    id: "chapter8-p119-left",
    title: "B2/B3 transition with 18.Bc7!",
    text: "By transposition the Ulibin game reaches a position where 18.Bc7! is the elegant tactical blow. It is the move that lets White develop the decisive initiative.",
    lineId: "ch8-b2-bc7"
  },
  {
    id: "chapter8-p119-right",
    title: "B3) 13...exd5 and 15.Nxb5",
    text: "B3) 13...exd5 14.exd5 cxd5 leads to 15.Nxb5 Bc5!, Black's only playable alternative to the main ...Be7 line. The chapter introduces 18.Qb7!?N as White's improvement.",
    lineId: "ch8-b3-start"
  },
  {
    id: "chapter8-p120-left",
    title: "B3) 18.Qb7!?N",
    text: "The new 18.Qb7!?N avoids earlier queen trades and keeps Black from swapping the queenside pawns. White's bishop pair and pressure on c4 mean Black must suffer in a long endgame.",
    lineId: "ch8-b3-bxb7"
  },
  {
    id: "chapter8-p120-right",
    title: "B4) 13...Be7",
    text: "B4) 13...Be7 is the main continuation. After 14.dxe6 fxe6 15.Qe2 O-O, White keeps chances against the e6-pawn, while the note to ...Na6 shows that Rd1! can be used energetically.",
    lineId: "ch8-b4-na6"
  },
  {
    id: "chapter8-p121-left",
    title: "B4) energetic reaction to ...Na6",
    text: "The recommended Rd1! and later g4 ideas show that White can punish passive defence of e6. Black's pieces are pushed into awkward squares and White often regains the pawn with a positional plus.",
    lineId: "ch8-b4-main"
  },
  {
    id: "chapter8-p121-right",
    title: "B41) 16...Kh8",
    text: "Instead of protecting e6, Black may allow Bxe6+ with 16...Kh8. The chapter accepts the challenge: after Bxe6, Rd1 and Be3, White's passed e-pawn becomes a serious asset.",
    lineId: "ch8-b41-rd1"
  },
  {
    id: "chapter8-p122-left",
    title: "B41) improving on the old Bf4 line",
    text: "The older Bf4 analysis is revised because Black's ...Qg6 and ...Nb4 resources hold. The new Be3 path keeps the e-pawn dangerous, though one line forces White to accept equality.",
    lineId: "ch8-b41-c5"
  },
  {
    id: "chapter8-p122-right",
    title: "B41) 23.Nf3!",
    text: "White's quiet 23.Nf3! prepares e5 and keeps the a-file pressure alive. The continuation with Bd4, e5 and Ng5 gives White a healthy initiative despite Black's active queen and knight.",
    lineId: "ch8-b41-nh6"
  },
  {
    id: "chapter8-p123-left",
    title: "B42) 16...Qc8 and 17.Nf3",
    text: "The main B42 line begins with 17.Nf3, threatening Ng5 and keeping e5 ideas in reserve. Black's ...Na6 is designed to defend e6, but it leaves the rest of the queenside coordination fragile.",
    lineId: "ch8-b42-nf3"
  },
  {
    id: "chapter8-p123-right",
    title: "B42) the 18.Bg5N resource",
    text: "Against ...Ne8, 18.Bg5N is the new positional resource, exchanging off Black's dark-squared bishop. In the main ...Nc7 line, White maintains a clear initiative with Bf4, Ng5 and queen activity.",
    lineId: "ch8-b42-ne8"
  },
  {
    id: "chapter8-p124-left",
    title: "B42) testing GM1 recommendations",
    text: "The chapter rechecks the older Qg4 recommendation and notes that Black can fight after ...Nf6. The more restrained plan keeps queens and dark-square pressure in White's favour.",
    lineId: "ch8-b42-bb7"
  },
  {
    id: "chapter8-p124-right",
    title: "B42) 21.Qe3N",
    text: "The quiet 21.Qe3N controls the g1-a7 diagonal and prepares Be5. After ...h6 and ...Na6, White reroutes with Ne5, Ng6 and Qe2, keeping stronger attacking chances than the older queen sortie.",
    lineId: "ch8-b42-bc5"
  },
  {
    id: "chapter8-p125-left",
    title: "B42) trading the dark-squared bishops",
    text: "The sequence Bd6!, Bxd6 and Rxd6 removes Black's most important defender. White's initiative on the kingside and control over dark squares become extremely powerful.",
    lineId: "ch8-b42-rxd6"
  },
  {
    id: "chapter8-p125-right",
    title: "Conclusion: 5...a6 and 6...b5",
    text: "The chapter concludes that 5...a6 and 6...b5 is risky for Black. White obtains rich play for the pawn, many GM1 novelties have passed practical tests, and the added improvements leave White in excellent shape.",
    lineId: "ch8-b42-rxd6"
  }
];

type DiagramSpec = { id: string; sourceSpanId: string; role: string; lineId: string };
const diagramSpecs: DiagramSpec[] = [
  { id: "CH8-D01", sourceSpanId: "chapter8-p112-full", role: "Chapter starting position after 6...b5", lineId: "ch8-opening" },
  { id: "CH8-D02", sourceSpanId: "chapter8-p112-full", role: "Index preview: B3 position after 17...Qe8!", lineId: "ch8-b3-qe8" },
  { id: "CH8-D03", sourceSpanId: "chapter8-p112-full", role: "Index preview: B42 note before 18.Bg5N", lineId: "ch8-b42-ne8" },
  { id: "CH8-D04", sourceSpanId: "chapter8-p112-full", role: "Index preview: B42 position after 20...Bb7", lineId: "ch8-b42-bb7" },
  { id: "CH8-D05", sourceSpanId: "chapter8-p113-left", role: "First branching position after 7.Ne5", lineId: "ch8-root" },
  { id: "CH8-D06", sourceSpanId: "chapter8-p113-left", role: "Position after the inferior 7...Ra7?!", lineId: "ch8-a-ra7" },
  { id: "CH8-D07", sourceSpanId: "chapter8-p113-right", role: "A) Position after 8.b3", lineId: "ch8-a-b3" },
  { id: "CH8-D08", sourceSpanId: "chapter8-p114-left", role: "A) Position before 14.e5!", lineId: "ch8-a-e5" },
  { id: "CH8-D09", sourceSpanId: "chapter8-p114-right", role: "A) Position before 19.Qxd8+", lineId: "ch8-a-qxd8" },
  { id: "CH8-D10", sourceSpanId: "chapter8-p114-right", role: "B) Position after 8...Bb7", lineId: "ch8-b-bb7" },
  { id: "CH8-D11", sourceSpanId: "chapter8-p115-left", role: "B) Position after 12...b4?!", lineId: "ch8-b-b4" },
  { id: "CH8-D12", sourceSpanId: "chapter8-p115-right", role: "B) Main branching position after 13.d5", lineId: "ch8-b-main" },
  { id: "CH8-D13", sourceSpanId: "chapter8-p116-left", role: "B1) Position before 15.Bxd5!", lineId: "ch8-b1-bxd5" },
  { id: "CH8-D14", sourceSpanId: "chapter8-p117-left", role: "B1) Position before 21.Bc5+", lineId: "ch8-b1-bc5" },
  { id: "CH8-D15", sourceSpanId: "chapter8-p117-left", role: "B1) Position before 18.Nh6!", lineId: "ch8-b1-nh6" },
  { id: "CH8-D16", sourceSpanId: "chapter8-p117-right", role: "B1) Position before 22.Rf3!", lineId: "ch8-b1-rf3" },
  { id: "CH8-D17", sourceSpanId: "chapter8-p117-right", role: "B2) Position after 14.Bf4", lineId: "ch8-b2-bf4" },
  { id: "CH8-D18", sourceSpanId: "chapter8-p118-left", role: "B2) Position before 15.Nxf7!", lineId: "ch8-b2-qc7" },
  { id: "CH8-D19", sourceSpanId: "chapter8-p118-left", role: "B2) Position after 17.Bd6", lineId: "ch8-b2-bd6" },
  { id: "CH8-D20", sourceSpanId: "chapter8-p119-left", role: "B2) Position after 15...exd5N", lineId: "ch8-b2-exd5" },
  { id: "CH8-D21", sourceSpanId: "chapter8-p119-left", role: "B2) Position after 18.Bc7!", lineId: "ch8-b2-bc7" },
  { id: "CH8-D22", sourceSpanId: "chapter8-p119-right", role: "B3) Position after 14...cxd5", lineId: "ch8-b3-start" },
  { id: "CH8-D23", sourceSpanId: "chapter8-p120-left", role: "B3) Position after 17...Qe8!", lineId: "ch8-b3-qe8" },
  { id: "CH8-D24", sourceSpanId: "chapter8-p120-right", role: "B3) Position after 21.Bxb7", lineId: "ch8-b3-bxb7" },
  { id: "CH8-D25", sourceSpanId: "chapter8-p120-right", role: "B4) Position after 15...Na6", lineId: "ch8-b4-na6" },
  { id: "CH8-D26", sourceSpanId: "chapter8-p121-left", role: "B4) Position after 16.Bh3", lineId: "ch8-b4-main" },
  { id: "CH8-D27", sourceSpanId: "chapter8-p121-right", role: "B41) Position after 18...Bb7", lineId: "ch8-b41-rd1" },
  { id: "CH8-D28", sourceSpanId: "chapter8-p122-left", role: "B41) Position after 24...c5!", lineId: "ch8-b41-c5" },
  { id: "CH8-D29", sourceSpanId: "chapter8-p122-right", role: "B41) Position after 22...Qb7", lineId: "ch8-b41-qb7" },
  { id: "CH8-D30", sourceSpanId: "chapter8-p122-right", role: "B41) Position before 28.e6", lineId: "ch8-b41-nh6" },
  { id: "CH8-D31", sourceSpanId: "chapter8-p123-left", role: "B42) Position after 17.Nf3", lineId: "ch8-b42-nf3" },
  { id: "CH8-D32", sourceSpanId: "chapter8-p123-left", role: "B42) Position before 18.Bg5N", lineId: "ch8-b42-ne8" },
  { id: "CH8-D33", sourceSpanId: "chapter8-p123-right", role: "B42) Position before 20.Rd1!?", lineId: "ch8-b42-rd1" },
  { id: "CH8-D34", sourceSpanId: "chapter8-p124-left", role: "B42) Position before 21.Nf3", lineId: "ch8-b42-h6" },
  { id: "CH8-D35", sourceSpanId: "chapter8-p124-left", role: "B42) Position after 20...Bb7", lineId: "ch8-b42-bb7" },
  { id: "CH8-D36", sourceSpanId: "chapter8-p124-right", role: "B42) Position after 25.Qe2", lineId: "ch8-b42-bc5" },
  { id: "CH8-D37", sourceSpanId: "chapter8-p125-left", role: "B42) Position after 27.Rxd6", lineId: "ch8-b42-rxd6" },
];
export const CHAPTER8_DIAGRAMS: DiagramLink[] = diagramSpecs.map((spec) => {
  const sourceLine = byId(spec.lineId);
  const moveIndex = sourceLine.moves.length - 1;
  const chess = new Chess(sourceLine.startFen);
  sourceLine.moves.slice(0, moveIndex + 1).forEach((move) => chess.move(move.san));
  return { id: spec.id, associationStatus: "source-verified", positionStatus: "deterministically derived", boardIdentityStatus: "source-verified", sourceSpanId: spec.sourceSpanId, crop: `/source/chapter8/crops/${spec.id}.png`, role: spec.role, lineId: spec.lineId, moveIndex, fen: chess.fen() };
});

const diagramIdsBySpan = new Map<string, string[]>();
for (const diagram of CHAPTER8_DIAGRAMS) diagramIdsBySpan.set(diagram.sourceSpanId, [...(diagramIdsBySpan.get(diagram.sourceSpanId) ?? []), diagram.id]);

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
    { id: `ch8-heading-${regionNumber}`, type: "heading", status: "source-verified", sourceSpanId: region.id, text: region.title, moveRefs: moveRefsInText(region.title, region.lineId, region.id) },
    { id: `ch8-line-${regionNumber}`, type: "variation", status: "source-verified", sourceSpanId: region.id, title: region.title, text: sourceText, lineId: region.lineId, moveRefs: moveRefsInText(sourceText, region.lineId, region.id) },
  ];
  for (const diagramId of diagramIdsBySpan.get(region.id) ?? []) regionBlocks.push({ id: `${diagramId.toLowerCase()}-block`, type: "diagram", status: "source-verified", sourceSpanId: region.id, diagramId });
  return regionBlocks;
});

export const CHAPTER8_LESSON: LessonDocument = {
  schemaVersion: 2,
  lessonId: "catalan.chapter8.complete",
  status: "source-verified",
  title: "Chapter 8 - Complete",
  subtitle: "The Catalan: 5...a6 and 6...b5",
  source: { documentId: "catalan.chapter8", filename: "Chapter8_Catalan.pdf", sha256: SOURCE_HASH },
  basePosition: { status: "deterministically derived", after: "Initial position", fen: new Chess().fen(), moves: [] },
  sourceSpans,
  lines,
  diagrams: CHAPTER8_DIAGRAMS,
  blocks,
};

export const CHAPTER8_ANNOTATED_MOVE_IDS = CHAPTER8_LESSON.lines.flatMap((item) => item.moves).filter((move) => move.annotation).map((move) => move.id);
export const CHAPTER8_SECTIONS = [
  {
    id: "overview",
    label: "Overview",
    blockId: "ch8-heading-01"
  },
  {
    id: "a",
    label: "A) 7...c6",
    blockId: "ch8-heading-02"
  },
  {
    id: "b",
    label: "B) 7...Nd5",
    blockId: "ch8-heading-04"
  },
  {
    id: "b1",
    label: "B1) 13...cxd5",
    blockId: "ch8-heading-08"
  },
  {
    id: "b3",
    label: "B3) 13...exd5",
    blockId: "ch8-heading-16"
  },
  {
    id: "b4",
    label: "B4) 13...Be7",
    blockId: "ch8-heading-18"
  },
  {
    id: "b41",
    label: "B41) 16...Kh8",
    blockId: "ch8-heading-20"
  },
  {
    id: "b42",
    label: "B42) 16...Qc8",
    blockId: "ch8-heading-24"
  },
  {
    id: "conclusion",
    label: "Conclusion",
    blockId: "ch8-heading-27"
  }
];
