import { Chess } from "chess.js";
import type { DiagramLink, LessonBlock, LessonDocument, MoveAnnotation, MoveReference, SourceSpan, VariationMove, VariationNode } from "./lesson-model";
import { sourceMoveRefs, sourceTranscript } from "./chapter-source-transcripts";

const SOURCE_HASH = "DEF9B184BD5A9C1E65D4CD30FEACCA19AFA3629B3CE636DA60B3B715DE5435F8";
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
    id: "chapter7-p87-full",
    status: "source-verified",
    pageIndex: 0,
    printedPage: 87,
    column: "full",
    order: 1,
    crop: "/source/chapter7/pages/printed-87.png",
    bbox: {
      x0: 0,
      top: 0,
      x1: 474.96,
      bottom: 676.08
    }
  },
  {
    id: "chapter7-p88-left",
    status: "source-verified",
    pageIndex: 1,
    printedPage: 88,
    column: "left",
    order: 2,
    crop: "/source/chapter7/pages/printed-88.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter7-p88-right",
    status: "source-verified",
    pageIndex: 1,
    printedPage: 88,
    column: "right",
    order: 3,
    crop: "/source/chapter7/pages/printed-88.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter7-p89-left",
    status: "source-verified",
    pageIndex: 2,
    printedPage: 89,
    column: "left",
    order: 4,
    crop: "/source/chapter7/pages/printed-89.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter7-p89-right",
    status: "source-verified",
    pageIndex: 2,
    printedPage: 89,
    column: "right",
    order: 5,
    crop: "/source/chapter7/pages/printed-89.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter7-p90-left",
    status: "source-verified",
    pageIndex: 3,
    printedPage: 90,
    column: "left",
    order: 6,
    crop: "/source/chapter7/pages/printed-90.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter7-p90-right",
    status: "source-verified",
    pageIndex: 3,
    printedPage: 90,
    column: "right",
    order: 7,
    crop: "/source/chapter7/pages/printed-90.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter7-p91-left",
    status: "source-verified",
    pageIndex: 4,
    printedPage: 91,
    column: "left",
    order: 8,
    crop: "/source/chapter7/pages/printed-91.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter7-p91-right",
    status: "source-verified",
    pageIndex: 4,
    printedPage: 91,
    column: "right",
    order: 9,
    crop: "/source/chapter7/pages/printed-91.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter7-p92-left",
    status: "source-verified",
    pageIndex: 5,
    printedPage: 92,
    column: "left",
    order: 10,
    crop: "/source/chapter7/pages/printed-92.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter7-p92-right",
    status: "source-verified",
    pageIndex: 5,
    printedPage: 92,
    column: "right",
    order: 11,
    crop: "/source/chapter7/pages/printed-92.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter7-p93-left",
    status: "source-verified",
    pageIndex: 6,
    printedPage: 93,
    column: "left",
    order: 12,
    crop: "/source/chapter7/pages/printed-93.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter7-p93-right",
    status: "source-verified",
    pageIndex: 6,
    printedPage: 93,
    column: "right",
    order: 13,
    crop: "/source/chapter7/pages/printed-93.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter7-p94-left",
    status: "source-verified",
    pageIndex: 7,
    printedPage: 94,
    column: "left",
    order: 14,
    crop: "/source/chapter7/pages/printed-94.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter7-p94-right",
    status: "source-verified",
    pageIndex: 7,
    printedPage: 94,
    column: "right",
    order: 15,
    crop: "/source/chapter7/pages/printed-94.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter7-p95-left",
    status: "source-verified",
    pageIndex: 8,
    printedPage: 95,
    column: "left",
    order: 16,
    crop: "/source/chapter7/pages/printed-95.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter7-p95-right",
    status: "source-verified",
    pageIndex: 8,
    printedPage: 95,
    column: "right",
    order: 17,
    crop: "/source/chapter7/pages/printed-95.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter7-p96-left",
    status: "source-verified",
    pageIndex: 9,
    printedPage: 96,
    column: "left",
    order: 18,
    crop: "/source/chapter7/pages/printed-96.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter7-p96-right",
    status: "source-verified",
    pageIndex: 9,
    printedPage: 96,
    column: "right",
    order: 19,
    crop: "/source/chapter7/pages/printed-96.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter7-p97-left",
    status: "source-verified",
    pageIndex: 10,
    printedPage: 97,
    column: "left",
    order: 20,
    crop: "/source/chapter7/pages/printed-97.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter7-p97-right",
    status: "source-verified",
    pageIndex: 10,
    printedPage: 97,
    column: "right",
    order: 21,
    crop: "/source/chapter7/pages/printed-97.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter7-p98-left",
    status: "source-verified",
    pageIndex: 11,
    printedPage: 98,
    column: "left",
    order: 22,
    crop: "/source/chapter7/pages/printed-98.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter7-p98-right",
    status: "source-verified",
    pageIndex: 11,
    printedPage: 98,
    column: "right",
    order: 23,
    crop: "/source/chapter7/pages/printed-98.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter7-p99-left",
    status: "source-verified",
    pageIndex: 12,
    printedPage: 99,
    column: "left",
    order: 24,
    crop: "/source/chapter7/pages/printed-99.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter7-p99-right",
    status: "source-verified",
    pageIndex: 12,
    printedPage: 99,
    column: "right",
    order: 25,
    crop: "/source/chapter7/pages/printed-99.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter7-p100-left",
    status: "source-verified",
    pageIndex: 13,
    printedPage: 100,
    column: "left",
    order: 26,
    crop: "/source/chapter7/pages/printed-100.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter7-p100-right",
    status: "source-verified",
    pageIndex: 13,
    printedPage: 100,
    column: "right",
    order: 27,
    crop: "/source/chapter7/pages/printed-100.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter7-p101-left",
    status: "source-verified",
    pageIndex: 14,
    printedPage: 101,
    column: "left",
    order: 28,
    crop: "/source/chapter7/pages/printed-101.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter7-p101-right",
    status: "source-verified",
    pageIndex: 14,
    printedPage: 101,
    column: "right",
    order: 29,
    crop: "/source/chapter7/pages/printed-101.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter7-p102-left",
    status: "source-verified",
    pageIndex: 15,
    printedPage: 102,
    column: "left",
    order: 30,
    crop: "/source/chapter7/pages/printed-102.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter7-p102-right",
    status: "source-verified",
    pageIndex: 15,
    printedPage: 102,
    column: "right",
    order: 31,
    crop: "/source/chapter7/pages/printed-102.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter7-p103-left",
    status: "source-verified",
    pageIndex: 16,
    printedPage: 103,
    column: "left",
    order: 32,
    crop: "/source/chapter7/pages/printed-103.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter7-p103-right",
    status: "source-verified",
    pageIndex: 16,
    printedPage: 103,
    column: "right",
    order: 33,
    crop: "/source/chapter7/pages/printed-103.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter7-p104-left",
    status: "source-verified",
    pageIndex: 17,
    printedPage: 104,
    column: "left",
    order: 34,
    crop: "/source/chapter7/pages/printed-104.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter7-p104-right",
    status: "source-verified",
    pageIndex: 17,
    printedPage: 104,
    column: "right",
    order: 35,
    crop: "/source/chapter7/pages/printed-104.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter7-p105-left",
    status: "source-verified",
    pageIndex: 18,
    printedPage: 105,
    column: "left",
    order: 36,
    crop: "/source/chapter7/pages/printed-105.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter7-p105-right",
    status: "source-verified",
    pageIndex: 18,
    printedPage: 105,
    column: "right",
    order: 37,
    crop: "/source/chapter7/pages/printed-105.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter7-p106-left",
    status: "source-verified",
    pageIndex: 19,
    printedPage: 106,
    column: "left",
    order: 38,
    crop: "/source/chapter7/pages/printed-106.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter7-p106-right",
    status: "source-verified",
    pageIndex: 19,
    printedPage: 106,
    column: "right",
    order: 39,
    crop: "/source/chapter7/pages/printed-106.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter7-p107-left",
    status: "source-verified",
    pageIndex: 20,
    printedPage: 107,
    column: "left",
    order: 40,
    crop: "/source/chapter7/pages/printed-107.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter7-p107-right",
    status: "source-verified",
    pageIndex: 20,
    printedPage: 107,
    column: "right",
    order: 41,
    crop: "/source/chapter7/pages/printed-107.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter7-p108-left",
    status: "source-verified",
    pageIndex: 21,
    printedPage: 108,
    column: "left",
    order: 42,
    crop: "/source/chapter7/pages/printed-108.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter7-p108-right",
    status: "source-verified",
    pageIndex: 21,
    printedPage: 108,
    column: "right",
    order: 43,
    crop: "/source/chapter7/pages/printed-108.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter7-p109-left",
    status: "source-verified",
    pageIndex: 22,
    printedPage: 109,
    column: "left",
    order: 44,
    crop: "/source/chapter7/pages/printed-109.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter7-p109-right",
    status: "source-verified",
    pageIndex: 22,
    printedPage: 109,
    column: "right",
    order: 45,
    crop: "/source/chapter7/pages/printed-109.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter7-p110-left",
    status: "source-verified",
    pageIndex: 23,
    printedPage: 110,
    column: "left",
    order: 46,
    crop: "/source/chapter7/pages/printed-110.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter7-p110-right",
    status: "source-verified",
    pageIndex: 23,
    printedPage: 110,
    column: "right",
    order: 47,
    crop: "/source/chapter7/pages/printed-110.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter7-p111-left",
    status: "source-verified",
    pageIndex: 24,
    printedPage: 111,
    column: "left",
    order: 48,
    crop: "/source/chapter7/pages/printed-111.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter7-p111-right",
    status: "source-verified",
    pageIndex: 24,
    printedPage: 111,
    column: "right",
    order: 49,
    crop: "/source/chapter7/pages/printed-111.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
];

const INITIAL_FEN = new Chess().fen();
const CH7_ROOT = ["d4", "Nf6", "c4", "e6", "g3", "d5", "Nf3", "dxc4", "Bg2", "c5", "O-O", "Nc6", "Qa4", "Bd7"] as const;

function sourceLine(id: string, label: string, continuation: MoveSpec[], sourceSpanId: string): VariationNode {
  return line(id, label, INITIAL_FEN, [...CH7_ROOT, ...continuation], sourceSpanId);
}

const lines: VariationNode[] = [
  sourceLine("ch7-opening", "Position after 7...Bd7", [], "chapter7-p87-full"),
  sourceLine("ch7-a-rxc5", "A) Position after 12...O-O", ["Qxc4", "Rc8", "dxc5", "Na5", "Qh4", "Rxc5", "Nc3", "Be7", "Qd4", "O-O"], "chapter7-p88-right"),
  sourceLine("ch7-a-qa5", "A) Position after 9...Qa5", ["Qxc4", "Rc8", "dxc5", "Qa5"], "chapter7-p88-right"),
  sourceLine("ch7-a-ending", "A) Queenless position after 12...Be7", ["Qxc4", "Rc8", "dxc5", "Qa5", "Nfd2", "Qxc5", "Nc3", "Qxc4", "Nxc4", "Be7"], "chapter7-p89-left"),
  sourceLine("ch7-b-start", "B) Position after 8...Qb6", ["Qxc4", "Qb6"], "chapter7-p89-left"),
  sourceLine("ch7-b1-nd5", "B1) Position before 15.Nxd5!N", ["Qxc4", "Qb6", "dxc5", "Bxc5", "Nc3", "Be7", "Be3", "Qa5", "a3", "O-O", "b4", "Qh5", "h3", "Nd5"], "chapter7-p89-right"),
  sourceLine("ch7-b11-start", "B11) Position after 10...Na5", ["Qxc4", "Qb6", "dxc5", "Bxc5", "Nc3", "Na5"], "chapter7-p90-left"),
  sourceLine("ch7-b11-bc6", "B11) Position before 15.a3", ["Qxc4", "Qb6", "dxc5", "Bxc5", "Nc3", "Na5", "Qh4", "Bc6", "Na4", "Bxa4", "Qxa4+", "Nc6", "Ne5", "Nd5"], "chapter7-p90-left"),
  sourceLine("ch7-b11-be7", "B11) Position after 13...Nxc6", ["Qxc4", "Qb6", "dxc5", "Bxc5", "Nc3", "Na5", "Qh4", "Be7", "Ne5", "Bc6", "Nxc6", "Nxc6"], "chapter7-p90-right"),
  sourceLine("ch7-b11-castled", "B11) Position after 11...O-O", ["Qxc4", "Qb6", "dxc5", "Bxc5", "Nc3", "Na5", "Qh4", "O-O"], "chapter7-p90-right"),
  sourceLine("ch7-b11-qb4", "B11) Position before 13.Qg5!", ["Qxc4", "Qb6", "dxc5", "Bxc5", "Nc3", "Na5", "Qh4", "O-O", "Bh6", "Qb4"], "chapter7-p91-left"),
  sourceLine("ch7-b12-start", "B12) Position after 10...Qb4", ["Qxc4", "Qb6", "dxc5", "Bxc5", "Nc3", "Qb4"], "chapter7-p91-left"),
  sourceLine("ch7-b12-bb6", "B12) Position before 14.Be3!N", ["Qxc4", "Qb6", "dxc5", "Bxc5", "Nc3", "Qb4", ["Qd3", "Qd3!"], "O-O", "a3", "Qg4", "b4", "Bb6"], "chapter7-p91-right"),
  sourceLine("ch7-b12-nd5", "B12) Position before 18.Nxd5", ["Qxc4", "Qb6", "dxc5", "Bxc5", "Nc3", "Qb4", "Qd3", "O-O", "a3", "Qg4", "b4", "Bb6", ["Be3", "Be3!N"], "Qf5", ["Qd2", "Qd2!"], "Bxe3", "Qxe3", "Rfd8", "h3", "Nd5"], "chapter7-p92-left"),
  sourceLine("ch7-b2-start", "B2) Position after 9...Qxc5", ["Qxc4", "Qb6", "dxc5", "Qxc5"], "chapter7-p92-left"),
  sourceLine("ch7-b2-nd5", "B2) Position before 15.Nb5", ["Qxc4", "Qb6", "dxc5", "Qxc5", "Na3", "Nd5", ["Rd1", "Rd1N"], "Be7", "e4", "Nb6", "Qe2", "Rd8", "Be3", "Qa5"], "chapter7-p92-right"),
  sourceLine("ch7-b21-start", "B21) Position after 10...Be7", ["Qxc4", "Qb6", "dxc5", "Qxc5", "Na3", "Be7"], "chapter7-p92-right"),
  sourceLine("ch7-b21-rfd8", "B21) Position before 14.Bc7!", ["Qxc4", "Qb6", "dxc5", "Qxc5", "Na3", "Be7", "Qxc5", "Bxc5", "Nc4", "O-O", ["Bf4", "Bf4!?N"], "Rfd8"], "chapter7-p93-left"),
  sourceLine("ch7-b22-start", "B22) Position after 10...Rc8", ["Qxc4", "Qb6", "dxc5", "Qxc5", "Na3", "Rc8"], "chapter7-p93-right"),
  sourceLine("ch7-b22-qb4", "B22) Position after 12...Qb4", ["Qxc4", "Qb6", "dxc5", "Qxc5", "Na3", "Rc8", "Rd1", "Nd5", "Qb3", "Qb4"], "chapter7-p93-right"),
  sourceLine("ch7-b22-before-rhd8", "B22) Position before 14...Rhd8N", ["Qxc4", "Qb6", "dxc5", "Qxc5", "Na3", "Rc8", "Rd1", "Be7", "Qxc5", "Bxc5", "Nc4", "Ke7", "Nfe5"], "chapter7-p94-left"),
  sourceLine("ch7-b22-rhd8", "B22) Endgame after 18.Be3", ["Qxc4", "Qb6", "dxc5", "Qxc5", "Na3", "Rc8", "Rd1", "Be7", "Qxc5", "Bxc5", "Nc4", "Ke7", "Nfe5", ["Rhd8", "Rhd8N"], ["Bxc6", "Bxc6!"], "Bxc6", "Rxd8", "Rxd8", "Nxc6+", "bxc6", "Be3"], "chapter7-p94-left"),
  sourceLine("ch7-c-start", "C) Position after 8...b5", ["Qxc4", "b5"], "chapter7-p94-left"),
  sourceLine("ch7-c1-qb6", "C1) Position after 12...Qb6", ["Qxc4", "b5", "Qd3", "c4", "Qc2", "Be7", "e4", "O-O", "Qe2", "Qb6"], "chapter7-p94-right"),
  sourceLine("ch7-c1-start", "C1) Position after 10...Rc8", ["Qxc4", "b5", "Qd3", "c4", "Qc2", "Rc8"], "chapter7-p95-left"),
  sourceLine("ch7-c1-b3", "C1) Position after 15.b3!", ["Qxc4", "b5", "Qd3", "c4", "Qc2", "Rc8", "e4", "Nb4", "Qe2", "Nd3", ["Bg5", "Bg5N"], "h6", "Bxf6", "Qxf6", ["b3", "b3!"]], "chapter7-p95-left"),
  sourceLine("ch7-c1-nb4", "C1) Position before 13.Qd1", ["Qxc4", "b5", "Qd3", "c4", "Qc2", "Rc8", "e4", "Qb6", ["a4", "a4!?N"], "Nb4"], "chapter7-p95-right"),
  sourceLine("ch7-c1-be7", "C1) Position after 11...Be7", ["Qxc4", "b5", "Qd3", "c4", "Qc2", "Rc8", "e4", "Be7"], "chapter7-p96-left"),
  sourceLine("ch7-c1-qc7", "C1) Position after 15.Bf4", ["Qxc4", "b5", "Qd3", "c4", "Qc2", "Rc8", "e4", "Be7", "Qe2", "O-O", "Rd1", "Re8", ["Ne5", "Ne5!"], "Qc7", "Bf4"], "chapter7-p96-left"),
  sourceLine("ch7-c2-start", "C2) Position after 9...Rc8", ["Qxc4", "b5", "Qd3", "Rc8"], "chapter7-p96-right"),
  sourceLine("ch7-c2-a6", "C2) Position before 13.Bg5!N", ["Qxc4", "b5", "Qd3", "Rc8", "dxc5", ["Nb4", "Nb4?!"], ["Qb3", "Qb3!"], "Bxc5", "Nc3", "a6"], "chapter7-p97-left"),
  sourceLine("ch7-c2-main", "C2) Position after 11.Nc3", ["Qxc4", "b5", "Qd3", "Rc8", "dxc5", "Bxc5", "Nc3"], "chapter7-p97-left"),
  sourceLine("ch7-c2-a6-endgame", "C2) Queenless position before 16.Ne5N", ["Qxc4", "b5", "Qd3", "Rc8", "dxc5", "Bxc5", "Nc3", ["a6", "a6?!"], "Bg5", "Nb4", "Qd2", "Bc6", "Qxd8+", "Rxd8", "a3", "Nbd5"], "chapter7-p97-right"),
  sourceLine("ch7-c21-start", "C21) Position after 11...O-O", ["Qxc4", "b5", "Qd3", "Rc8", "dxc5", "Bxc5", "Nc3", "O-O"], "chapter7-p97-right"),
  sourceLine("ch7-c21-f5", "C21) Position before 19.Rxd5!", ["Qxc4", "b5", "Qd3", "Rc8", "dxc5", "Bxc5", "Nc3", "O-O", "Bg5", "Nb4", "Bxf6", "gxf6", ["Qd2", "Qd2!"], "Bc6", "Qh6", "Qe7", "a3", "Nd5", "Ne4", "Bb6", "Rad1", "f5"], "chapter7-p98-left"),
  sourceLine("ch7-c21-re8", "C21) Position after 15...Re8", ["Qxc4", "b5", "Qd3", "Rc8", "dxc5", "Bxc5", "Nc3", "O-O", "Bg5", "Nb4", "Bxf6", "gxf6", ["Qd2", "Qd2!"], "Bc6", "Qh6", "Re8"], "chapter7-p98-right"),
  sourceLine("ch7-c21-rc8", "C21) Position before 23.Rfd1!", ["Qxc4", "b5", "Qd3", "Rc8", "dxc5", "Bxc5", "Nc3", "O-O", "Bg5", "Nb4", "Bxf6", "gxf6", "Qd2", "Bc6", "Qh6", "Re8", "Rad1", "Bf8", "Qh5", "Qe7", "a3", "Nc2", ["Nxb5", "Nxb5N"], "Bxb5", "Qxb5", "Rb8", "Qa4", "Rxb2", "Rd2", "Rc8"], "chapter7-p99-left"),
  sourceLine("ch7-c22-start", "C22) Position after 11...Nb4", ["Qxc4", "b5", "Qd3", "Rc8", "dxc5", "Bxc5", "Nc3", "Nb4"], "chapter7-p99-left"),
  sourceLine("ch7-c22-na6", "C22) Queenless position after 14...Na6", ["Qxc4", "b5", "Qd3", "Rc8", "dxc5", "Bxc5", "Nc3", "Nb4", ["Qd2", "Qd2!"], "Bc6", "a3", ["Qxd2", "Qxd2N"], "Bxd2", "Na6"], "chapter7-p99-right"),
  sourceLine("ch7-c22-rxd8", "C22) Position before 15.Bf4N", ["Qxc4", "b5", "Qd3", "Rc8", "dxc5", "Bxc5", "Nc3", "Nb4", ["Qd2", "Qd2!"], "O-O", "Ne5", "Be8", "Qxd8", "Rxd8"], "chapter7-p100-left"),
  sourceLine("ch7-c23-start", "C23) Position after 12.Nb5", ["Qxc4", "b5", "Qd3", "Rc8", "dxc5", "Bxc5", "Nc3", "b4", "Nb5"], "chapter7-p100-left"),
  sourceLine("ch7-c23-rc7", "C23) Position before 15.Ng5!", ["Qxc4", "b5", "Qd3", "Rc8", "dxc5", "Bxc5", "Nc3", "b4", "Nb5", "O-O", ["Nd6", "Nd6!"], "Rc7", "Bf4", "Ne7"], "chapter7-p100-right"),
  sourceLine("ch7-c23-nd4", "C23) Position before 14.Bf4", ["Qxc4", "b5", "Qd3", "Rc8", "dxc5", "Bxc5", "Nc3", "b4", "Nb5", "O-O", ["Nd6", "Nd6!"], "Nd4"], "chapter7-p101-left"),
  sourceLine("ch7-c23-bb6", "C23) Position after 17...Bb6", ["Qxc4", "b5", "Qd3", "Rc8", "dxc5", "Bxc5", "Nc3", "b4", "Nb5", "O-O", "Nd6", "Nd4", "Bf4", "Nd5", ["Ng5", "Ng5!"], "g6", "Nge4", "Nxf4", "gxf4", "Bb6"], "chapter7-p101-right"),
  sourceLine("ch7-d1-start", "D1) Position after 10...Qb6", ["Qxc4", "cxd4", "Nxd4", "Rc8", "Nc3", "Qb6"], "chapter7-p102-left"),
  sourceLine("ch7-d1-na5", "D1) Position before 12.Qh4!N", ["Qxc4", "cxd4", "Nxd4", "Rc8", "Nc3", "Qb6", ["Nb3", "Nb3!?"], "Na5"], "chapter7-p102-right"),
  sourceLine("ch7-d1-rfc1", "D1) Position before 17...e5", ["Qxc4", "cxd4", "Nxd4", "Rc8", "Nc3", "Qb6", "Nb3", "Na5", ["Qh4", "Qh4!N"], "Nxb3", "axb3", "Be7", ["b4", "b4!"], "a6", "Be3", "Qc7", "Qd4", "O-O", "Rfc1"], "chapter7-p103-left"),
  sourceLine("ch7-d2-start", "D2) Position after 10...Be7", ["Qxc4", "cxd4", "Nxd4", "Rc8", "Nc3", "Be7"], "chapter7-p103-left"),
  sourceLine("ch7-d2-qa5", "D2) Position before 13.Qb5!", ["Qxc4", "cxd4", "Nxd4", "Rc8", "Nc3", "Be7", "Rd1", "Qa5", ["Be3", "Be3!?N"], "O-O"], "chapter7-p103-right"),
  sourceLine("ch7-d2-qa6", "D2) Position before 16.Rd4!N", ["Qxc4", "cxd4", "Nxd4", "Rc8", "Nc3", "Be7", "Rd1", "Qb6", "Nxc6", "Bxc6", "Be3", "Qa5", "Bxc6+", "Rxc6", "Qb3", "Qa6"], "chapter7-p104-left"),
  sourceLine("ch7-d2-na5", "D2) Position after 11...Na5", ["Qxc4", "cxd4", "Nxd4", "Rc8", "Nc3", "Be7", "Rd1", "Na5"], "chapter7-p104-right"),
  sourceLine("ch7-d2-a6", "D2) Queenless position before 17.Nd4N", ["Qxc4", "cxd4", "Nxd4", "Rc8", "Nc3", "Be7", "Rd1", "Na5", "Qd3", "O-O", "Ndb5", "Qb6", "Be3", "Bxb5", "Qxb5", "Qxb5", "Nxb5", "a6"], "chapter7-p104-right"),
  sourceLine("ch7-d2-na7", "D2) Position after 18.b3!", ["Qxc4", "cxd4", "Nxd4", "Rc8", "Nc3", "Be7", "Rd1", "Na5", "Qd3", "O-O", "Ndb5", "Qb6", "Be3", "Bxb5", "Qxb5", "Qxb5", "Nxb5", "a6", ["Na7", "Na7!?N"], "Rc2", ["b3", "b3!"]], "chapter7-p105-left"),
  sourceLine("ch7-d2-nc4", "D2) Active bishops before 21...Nb2", ["Qxc4", "cxd4", "Nxd4", "Rc8", "Nc3", "Be7", "Rd1", "Na5", "Qd3", "O-O", "Ndb5", "Qb6", "Be3", "Bxb5", "Qxb5", "Qxb5", "Nxb5", "a6", ["Nd4", "Nd4N"], "Nc4", ["Bf4", "Bf4!"], "Rcd8", "Bxb7", "Nxb2", "Rd2", "Nc4", "Rd3"], "chapter7-p105-right"),
  sourceLine("ch7-d3-start", "D3) Position after 12.Qh4", ["Qxc4", "cxd4", "Nxd4", "Rc8", "Nc3", "Nxd4", "Qxd4", "Bc5", "Qh4"], "chapter7-p105-right"),
  sourceLine("ch7-d3-qb6", "D3) Position after 13.Bh6!", ["Qxc4", "cxd4", "Nxd4", "Rc8", "Nc3", "Nxd4", "Qxd4", "Bc5", "Qh4", ["Qb6", "Qb6?"], ["Bh6", "Bh6!"]], "chapter7-p106-left"),
  sourceLine("ch7-d31-start", "D31) Position after 13.Rd1", ["Qxc4", "cxd4", "Nxd4", "Rc8", "Nc3", "Nxd4", "Qxd4", "Bc5", "Qh4", "Bc6", "Rd1"], "chapter7-p106-left"),
  sourceLine("ch7-d31-bh6", "D31) Position before 16.Rac1!N", ["Qxc4", "cxd4", "Nxd4", "Rc8", "Nc3", "Nxd4", "Qxd4", "Bc5", "Qh4", "Bc6", "Rd1", "Qb6", "Bxc6+", "Qxc6", "Bh6", "O-O"], "chapter7-p106-right"),
  sourceLine("ch7-d31-qg6", "D31) Position before 17.Qf3!N", ["Qxc4", "cxd4", "Nxd4", "Rc8", "Nc3", "Nxd4", "Qxd4", "Bc5", "Qh4", "Bc6", "Rd1", "Nd7", "Bxc6", "Rxc6", "Qg4", "Qf6", "Ne4", "Qg6"], "chapter7-p106-right"),
  sourceLine("ch7-d31-qa5", "D31) Position before 14.Bxc6+", ["Qxc4", "cxd4", "Nxd4", "Rc8", "Nc3", "Nxd4", "Qxd4", "Bc5", "Qh4", "Bc6", "Rd1", "Qa5"], "chapter7-p107-left"),
  sourceLine("ch7-d31-endgame", "D31) Dangerous endgame after 20.Rac1", ["Qxc4", "cxd4", "Nxd4", "Rc8", "Nc3", "Nxd4", "Qxd4", "Bc5", "Qh4", "Bc6", "Rd1", "Qa5", "Bxc6+", "Rxc6", ["Bg5", "Bg5!"], "Be7", "Ne4", "Qe5", "Nxf6+", "Bxf6", "Bxf6", "Qxf6", "Qxf6", "gxf6", "Rac1"], "chapter7-p107-right"),
  sourceLine("ch7-d32-start", "D32) Position after 12...O-O", ["Qxc4", "cxd4", "Nxd4", "Rc8", "Nc3", "Nxd4", "Qxd4", "Bc5", "Qh4", "O-O"], "chapter7-p107-right"),
  sourceLine("ch7-d32-rb8", "D32) Position after 13...Rb8", ["Qxc4", "cxd4", "Nxd4", "Rc8", "Nc3", "Nxd4", "Qxd4", "Bc5", "Qh4", "O-O", "Bxb7", "Rb8"], "chapter7-p108-left"),
  sourceLine("ch7-d32-rb4", "D32) Position after 15.Qg5", ["Qxc4", "cxd4", "Nxd4", "Rc8", "Nc3", "Nxd4", "Qxd4", "Bc5", "Qh4", "O-O", "Bxb7", "Rb8", "Bf3", "Rb4", "Qg5"], "chapter7-p108-right"),
  sourceLine("ch7-d32-old-line", "D32) Earlier line after 21...Nf6", ["Qxc4", "cxd4", "Nxd4", "Rc8", "Nc3", "Nxd4", "Qxd4", "Bc5", "Qh4", "O-O", "Bxb7", "Rb8", "Bf3", "Rb4", "Qg5", "Bd4", "Qd2", "Qc7", "Rd1", "Rfb8", "Qd3", "Qc5", "e3", "Be5", "Ne4", "Nxe4", "Qxd7", "Nf6"], "chapter7-p109-left"),
  sourceLine("ch7-d32-nd1", "D32) Recommended position after 17.Nd1!", ["Qxc4", "cxd4", "Nxd4", "Rc8", "Nc3", "Nxd4", "Qxd4", "Bc5", "Qh4", "O-O", "Bxb7", "Rb8", "Bf3", "Rb4", "Qg5", "Bd4", "Qd2", "Qc7", ["Nd1", "Nd1!"]], "chapter7-p109-left"),
  sourceLine("ch7-d32-ra4", "D32) Position after 20.Qc2!", ["Qxc4", "cxd4", "Nxd4", "Rc8", "Nc3", "Nxd4", "Qxd4", "Bc5", "Qh4", "O-O", "Bxb7", "Rb8", "Bf3", "Rb4", "Qg5", "Bd4", "Qd2", "Qc7", "Nd1", "Rfb8", "a3", "Ra4", "Ne3", "e5", ["Qc2", "Qc2!"]], "chapter7-p109-right"),
  sourceLine("ch7-d32-rxb2", "D32) Position after 23.Rxb2", ["Qxc4", "cxd4", "Nxd4", "Rc8", "Nc3", "Nxd4", "Qxd4", "Bc5", "Qh4", "O-O", "Bxb7", "Rb8", "Bf3", "Rb4", "Qg5", "Bd4", "Qd2", "Qc7", "Nd1", "Rfb8", "a3", "Ra4", "Ne3", "e5", "Qc2", "Qxc2", "Nxc2", "Bxb2", "Rb1", "e4", "Rxb2"], "chapter7-p109-right"),
  sourceLine("ch7-d32-rc4", "D32) Position after 18...Rc4", ["Qxc4", "cxd4", "Nxd4", "Rc8", "Nc3", "Nxd4", "Qxd4", "Bc5", "Qh4", "O-O", "Bxb7", "Rb8", "Bf3", "Rb4", "Qg5", "Bd4", "Qd2", "Qc7", "Nd1", "Rfb8", "a3", "Rc4"], "chapter7-p110-left"),
  sourceLine("ch7-d32-e5", "D32) Position before 21.b3!N", ["Qxc4", "cxd4", "Nxd4", "Rc8", "Nc3", "Nxd4", "Qxd4", "Bc5", "Qh4", "O-O", "Bxb7", "Rb8", "Bf3", "Rb4", "Qg5", "Bd4", "Qd2", "Qc7", "Nd1", "Rfb8", "a3", "Rc4", "Ne3", "Ra4", "Rb1", "e5"], "chapter7-p110-left"),
  sourceLine("ch7-d32-bxe3", "D32) Position after 20.Qxe3", ["Qxc4", "cxd4", "Nxd4", "Rc8", "Nc3", "Nxd4", "Qxd4", "Bc5", "Qh4", "O-O", "Bxb7", "Rb8", "Bf3", "Rb4", "Qg5", "Bd4", "Qd2", "Qc7", "Nd1", "Rfb8", "a3", "Rc4", "Ne3", "Bxe3", "Qxe3"], "chapter7-p110-right"),
  sourceLine("ch7-d32-re8", "D32) Position after 22...Re8!?", ["Qxc4", "cxd4", "Nxd4", "Rc8", "Nc3", "Nxd4", "Qxd4", "Bc5", "Qh4", "O-O", "Bxb7", "Rb8", "Bf3", "Rb4", "Qg5", "Bd4", "Qd2", "Qc7", "Nd1", "Rfb8", "a3", "Rc4", "Ne3", "Bxe3", "Qxe3", "e5", "b4", "Rc3", "Qd2", ["Re8", "Re8!?"]], "chapter7-p111-left"),
  sourceLine("ch7-d32-qxe2", "D32) Position before 28.Be3", ["Qxc4", "cxd4", "Nxd4", "Rc8", "Nc3", "Nxd4", "Qxd4", "Bc5", "Qh4", "O-O", "Bxb7", "Rb8", "Bf3", "Rb4", "Qg5", "Bd4", "Qd2", "Qc7", "Nd1", "Rfb8", "a3", "Rc4", "Ne3", "Bxe3", "Qxe3", "e5", "b4", "Rc3", "Qd2", "Re8", ["Bg2", "Bg2N"], "Bb5", "Qd1", "Rd8", "Bd2", "Qc4", "Rc1", "Rxc1", "Qxc1", "Qxe2"], "chapter7-p111-left"),
];

const byId = (id: string) => {
  const found = lines.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`Missing Chapter 7 line ${id}`);
  return found;
};

function moveRefsInText(text: string, preferredLineId: string, sourceSpanId: string): MoveReference[] {
  return sourceMoveRefs(text, lines, preferredLineId, sourceSpanId);
}

type RegionCopy = { id: string; title: string; text: string; lineId: string };
const regionCopy: RegionCopy[] = [
  {
    id: "chapter7-p87-full",
    title: "Chapter 7 - 7...Bd7 variation index",
    text: "The index covers 5...c5 6.O-O Nc6 7.Qa4 Bd7 8.Qxc4. Black's four replies are A) 8...Rc8, B) 8...Qb6, C) 8...b5 and D) 8...cxd4, with the main theoretical weight falling on D3) 10...Nxd4 11.Qxd4 Bc5 12.Qh4.",
    lineId: "ch7-opening"
  },
  {
    id: "chapter7-p88-left",
    title: "A) 8...Rc8",
    text: "The natural rook move fails to equalize because White can take on c5 and force Black to compromise. The source updates older GM1 analysis, replacing harmless queen development with more challenging knight and queen coordination.",
    lineId: "ch7-a-rxc5"
  },
  {
    id: "chapter7-p88-right",
    title: "A) the 13.Qd3!? and 10.Nfd2!? ideas",
    text: "The A branch contains two important improvements. First, 13.Qd3!?N exploits the loose rook and bishop coordination; then 10.Nfd2!?N challenges the older Bg5 recommendation and keeps Black's queen exposed.",
    lineId: "ch7-a-rxc5"
  },
  {
    id: "chapter7-p89-left",
    title: "B) 8...Qb6",
    text: "After 8...Qb6 9.dxc5, Black must choose between B1) 9...Bxc5 and B2) 9...Qxc5. In both cases White aims to make Black's recapture awkward and keep the bishop pair or a long-term initiative.",
    lineId: "ch7-b-start"
  },
  {
    id: "chapter7-p89-right",
    title: "B1) 9...Bxc5 10.Nc3",
    text: "The first B1 split is between 10...Na5 and 10...Qb4. Natural development and queen checks leave Black short of equality, especially once White uses h3 and keeps the queen active.",
    lineId: "ch7-b1-nd5"
  },
  {
    id: "chapter7-p90-left",
    title: "B11) 10...Na5",
    text: "10...Na5 has been popular, but 11.Qh4! scores well for White. The note to ...Bc6 shows how a premature ...Rc8 can even lose tactically after Bxd5 and Qg4.",
    lineId: "ch7-b11-bc6"
  },
  {
    id: "chapter7-p90-right",
    title: "B11) bishop pair pressure",
    text: "After 11...Be7 12.Ne5 Bc6 13.Nxc6 Nxc6, White's Qa4, Rb1 and Be3 setup produces a clear plus. The Catalan bishop remains powerful enough even without preserving both bishops.",
    lineId: "ch7-b11-be7"
  },
  {
    id: "chapter7-p91-left",
    title: "B11) queen vulnerability themes",
    text: "The notes around ...Qb4 and ...Ne8 show a repeated theme: White avoids unnecessary queen exchanges, targets b7 and c5, and often emerges with a healthy extra pawn.",
    lineId: "ch7-b11-qb4"
  },
  {
    id: "chapter7-p91-right",
    title: "B12) 10...Qb4",
    text: "In B12, 11.Qd3! keeps queens on and makes the black queen vulnerable on b4. White uses a3, b4 and Qd2 to avoid the exchange and maintain pressure on the queenside.",
    lineId: "ch7-b12-bb6"
  },
  {
    id: "chapter7-p92-left",
    title: "B12 conclusion and B2) 9...Qxc5",
    text: "The B12 line concludes with White improving through Rd1 and Nd4. The chapter then turns to B2) 9...Qxc5, described as the more reliable recapture and a favourite of strong players.",
    lineId: "ch7-b2-start"
  },
  {
    id: "chapter7-p92-right",
    title: "B2) 10.Na3",
    text: "After 9...Qxc5 10.Na3, most games continue with B21) 10...Be7 or B22) 10...Rc8. The notes to ...Nd5 and ...Na5 show that White can still generate an initiative with Rd1N, e4 and natural central play.",
    lineId: "ch7-b2-nd5"
  },
  {
    id: "chapter7-p93-left",
    title: "B21) 10...Be7",
    text: "When Black wastes time with ...Be7, White can exchange queens and then press with Nc4. The source's 13.Bf4!?N poses concrete problems and leaves Black struggling against the bishop pair.",
    lineId: "ch7-b21-rfd8"
  },
  {
    id: "chapter7-p93-right",
    title: "B22) 10...Rc8",
    text: "In B22, White's queen moves to h4 or c5 force Black to solve development problems. The Garnica-Benyounes example shows how one careless queen retreat can leave White decisively better.",
    lineId: "ch7-b22-qb4"
  },
  {
    id: "chapter7-p94-left",
    title: "B22) structural endgame edge",
    text: "After Qxc5, Bxc5 and Nc4, the new 14...Rhd8N still leaves White with Bxc6!, Rxd8 and Nxc6. The superior pawn structure gives White a long-term endgame pull.",
    lineId: "ch7-b22-rhd8"
  },
  {
    id: "chapter7-p94-right",
    title: "C) 8...b5 and C1) 9...c4",
    text: "The active 8...b5 is popular and strategically double-edged. After 9.Qd3 c4 10.Qc2 Rc8, White prefers central control with e4 and later a4 ideas rather than rushing to win the pawn.",
    lineId: "ch7-c1-qb6"
  },
  {
    id: "chapter7-p95-left",
    title: "C1) e4 central break",
    text: "The chapter updates the old Bg5 recommendation with 11.e4. Black's ...Nb4 and ...Qb6 setups are met by Bg5N or a4!?N, giving White central space and several pawn breaks.",
    lineId: "ch7-c1-b3"
  },
  {
    id: "chapter7-p95-right",
    title: "C1) 12.a4!?N",
    text: "The 12.a4!?N novelty opens the a-file under favourable conditions. Even when Black hangs on with ...Nb4, ...bxa4 and ...Nd3, White's rook activity and central control leave him pressing.",
    lineId: "ch7-c1-nb4"
  },
  {
    id: "chapter7-p96-left",
    title: "C1) 14.Ne5!",
    text: "The 14.Ne5! idea becomes possible because of the earlier move order. White follows with Bf4 and, after Black's unfortunate ...Bd6, wins the strategic battle with Nxd7, e5 and d5.",
    lineId: "ch7-c1-qc7"
  },
  {
    id: "chapter7-p96-right",
    title: "C2) 9...Rc8",
    text: "When Black maintains tension with 9...Rc8, White first eliminates c5 and then plays Nc3. The notes show that ...Nb4?! lets White use Qb3 and Ne5N to win material or force a clear plus.",
    lineId: "ch7-c2-start"
  },
  {
    id: "chapter7-p97-left",
    title: "C2) 13.Bg5!N and the split",
    text: "After 10.dxc5 Bxc5, 13.Bg5!N remains a strong GM1 recommendation. The chapter then reaches the main split after 11.Nc3: C21) 11...O-O, C22) 11...Nb4 and C23) 11...b4.",
    lineId: "ch7-c2-a6"
  },
  {
    id: "chapter7-p97-right",
    title: "C21) 11...O-O",
    text: "The natural 11...O-O lets White use Bg5, Bxf6 and Qd2! to transfer the queen toward h6. Even queenless variations leave White with the makings of a strong initiative.",
    lineId: "ch7-c21-start"
  },
  {
    id: "chapter7-p98-left",
    title: "C21) Queen lift via h6",
    text: "White exploits Black's piece disharmony with Qd2-h6 and a3. The notes stress move-order accuracy: Rad1 too early let Black survive, while a3 and Ne4 keep the pressure.",
    lineId: "ch7-c21-f5"
  },
  {
    id: "chapter7-p98-right",
    title: "C21) rook sacrifices and endgames",
    text: "The forcing C21 line includes Rxd5!, Nxf6+ and queen trades. White can reach a favourable bishop-pair endgame or maintain pressure with Rd4N against weak b-pawns.",
    lineId: "ch7-c21-re8"
  },
  {
    id: "chapter7-p99-left",
    title: "C22) 11...Nb4",
    text: "C22 challenges White's setup immediately, but 12.Qd2! preserves the pressure. Lines with ...Bc6 and ...O-O show that Black often has to accept a misplaced queenside knight or tolerate a lasting initiative.",
    lineId: "ch7-c22-start"
  },
  {
    id: "chapter7-p99-right",
    title: "C22) Knight misplaced at a6",
    text: "After 12...O-O or 12...Bc6, White uses Bxd2, b4 and Rac1 to show that the knight on a6 is misplaced. The bishop pair and central space keep Black under pressure.",
    lineId: "ch7-c22-na6"
  },
  {
    id: "chapter7-p100-left",
    title: "C22 conclusion and C23) 11...b4",
    text: "The C22 ending is improved by 15.Bf4N, a more reserved bishop development than the older Bg5. C23) 11...b4 is met by 12.Nb5, the principled knight move.",
    lineId: "ch7-c23-start"
  },
  {
    id: "chapter7-p100-right",
    title: "C23) 13.Nd6!",
    text: "Against 12...O-O, White's 13.Nd6! creates serious complications. Black's attempts to simplify or give up the dark-squared bishop still leave White with the more active pieces.",
    lineId: "ch7-c23-rc7"
  },
  {
    id: "chapter7-p101-left",
    title: "C23) tactical domination",
    text: "The C23 analysis uses Ng5, Nde4 and Bf4 to dominate Black's queenside. Even materially balanced endings favour White because Black's knight and pawns remain badly placed.",
    lineId: "ch7-c23-nd4"
  },
  {
    id: "chapter7-p101-right",
    title: "C23) why Black still suffers",
    text: "After the forced sequence with ...g6 and ...Bf6, White ends a pawn up with minimal compensation. The source notes that correspondence games drew, but the defensive task is unappealing.",
    lineId: "ch7-c23-bb6"
  },
  {
    id: "chapter7-p102-left",
    title: "D) 8...cxd4 9.Nxd4",
    text: "D is Black's solid attempt to avoid weakening the queenside. After 9...Rc8 10.Nc3, the chapter splits into D1) 10...Qb6, D2) 10...Be7 and D3) 10...Nxd4.",
    lineId: "ch7-d1-start"
  },
  {
    id: "chapter7-p102-right",
    title: "D1) 10...Qb6 and 12.Qh4!N",
    text: "D1 improves on the older Nxc6 line with 11.Nb3!? and then 12.Qh4!N. The queen move keeps pressure and reaches favourable versions of the later pawn-sacrifice structures.",
    lineId: "ch7-d1-na5"
  },
  {
    id: "chapter7-p103-left",
    title: "D1) pressure with 14.b4!",
    text: "After 12...Nxb3 13.axb3 Be7, White's 14.b4! fixes Black's queenside. The continuation through Be3, Qd4 and Rfc1 leaves Black still fighting for equality.",
    lineId: "ch7-d1-rfc1"
  },
  {
    id: "chapter7-p103-right",
    title: "D2) 10...Be7",
    text: "D2 is solid but not equal. White uses Rd1 and, against ...Qa5, the new Be3!?N to exploit the exposed queen and force Black into damaged pawn structures.",
    lineId: "ch7-d2-qa5"
  },
  {
    id: "chapter7-p104-left",
    title: "D2) weak b-pawns and active rooks",
    text: "In D2, Black's ...Qb6 and ...Rxc6 lines lead to weak b-pawns. White's Rd4!N and Ra4 plan create a difficult endgame for Black.",
    lineId: "ch7-d2-qa6"
  },
  {
    id: "chapter7-p104-right",
    title: "D2) energetic 12.Qd3",
    text: "White must prevent Black from developing freely after 12.Qd3 O-O. Exchanging queens on b5 gives White better chances to exploit the bishop pair than the tempting knight capture.",
    lineId: "ch7-d2-a6"
  },
  {
    id: "chapter7-p105-left",
    title: "D2) Alternative ideas at move 17",
    text: "The main D2 endgame is improved with 17.Rd4N, while the computer-like 17.Na7!? also promises pressure. The source shows how active rooks and bishops create winning chances.",
    lineId: "ch7-d2-na7"
  },
  {
    id: "chapter7-p105-right",
    title: "D3) 10...Nxd4",
    text: "The D2 line ends with a small edge against the isolated pawn. D3) 10...Nxd4 11.Qxd4 Bc5 12.Qh4 is the main line by far, driving White's queen to an active square.",
    lineId: "ch7-d3-start"
  },
  {
    id: "chapter7-p106-left",
    title: "D3) the Qh4 and Bh6 motif",
    text: "After 12.Qh4, Black's ...Qb6? allows the thematic 13.Bh6!. The tactical point is that Black's king is stuck in the centre while White's queen attacks h6 and f6.",
    lineId: "ch7-d3-qb6"
  },
  {
    id: "chapter7-p106-right",
    title: "D31) 12...Bc6",
    text: "D31 begins with 12...Bc6 13.Rd1. The familiar Bxc6 and Bh6 resource appears again, and 16.Rac1!N is stronger than the old bishop capture because it keeps the initiative.",
    lineId: "ch7-d31-bh6"
  },
  {
    id: "chapter7-p107-left",
    title: "D31) keep queens and attack",
    text: "Against ...Nd7, White keeps queens with Qg4 and improves with Qf3!N. The alternative Bxc6 and Bg5! shows how White can also force a dangerous endgame with Black tied down.",
    lineId: "ch7-d31-qg6"
  },
  {
    id: "chapter7-p107-right",
    title: "D31) dangerous rook endgame",
    text: "After 19...gxf6 20.Rac1, the endgame looks innocent but is hard for Black. White can exchange rooks, march the king and continue pressing weak pawns.",
    lineId: "ch7-d31-endgame"
  },
  {
    id: "chapter7-p108-left",
    title: "D32) 12...O-O and 13.Bxb7",
    text: "The most critical line starts with 12...O-O. White accepts the pawn with 13.Bxb7 and then uses 14.Bf3, controlling g4 and forcing Black to prove compensation.",
    lineId: "ch7-d32-rb8"
  },
  {
    id: "chapter7-p108-right",
    title: "D32) 17.Rd1!",
    text: "The Kramnik-tested 17.Rd1! is now preferred over Qd3. It keeps White from getting tangled and asks Black to show enough activity for the pawn.",
    lineId: "ch7-d32-rb4"
  },
  {
    id: "chapter7-p109-left",
    title: "D32) solving queenside problems",
    text: "After ...Rfb8 or ...Qb6, White's Rb1N and b3 ideas help untangle the queenside while keeping the extra pawn. The source corrects earlier GM1 optimism about weaker queen moves.",
    lineId: "ch7-d32-nd1"
  },
  {
    id: "chapter7-p109-right",
    title: "D32) alternatives after 18...Ra4",
    text: "The important ...Ra4 resource is met by 20.Qc2!. White has new ideas with Bc6!N or Rb1!N, both designed to stop Black from generating enough activity.",
    lineId: "ch7-d32-ra4"
  },
  {
    id: "chapter7-p110-left",
    title: "D32) solid extra pawn",
    text: "After the forcing exchanges, White can reach positions with a solid extra pawn and several pieces on the board. Opposite-coloured bishops give Black drawing chances, but White's winning chances are real.",
    lineId: "ch7-d32-e5"
  },
  {
    id: "chapter7-p110-right",
    title: "D32) 21.b3!N and 23.Bg2N",
    text: "The Kramnik-Naiditsch position is improved with 21.b3!N, while later 23.Bg2N gives back the pawn to activate the dark-squared bishop. The aim is activity rather than material greed.",
    lineId: "ch7-d32-bxe3"
  },
  {
    id: "chapter7-p111-left",
    title: "D32) bishop pair ending",
    text: "The illustrative line with Bg2, Qd1 and Be3 leaves White with the bishop pair and chances to create a queenside passer. Black survives only with very accurate defence.",
    lineId: "ch7-d32-qxe2"
  },
  {
    id: "chapter7-p111-right",
    title: "Conclusion to 7...Bd7",
    text: "Chapter 7 concludes that 7...Bd7 remains a major battleground. 8...Rc8 and 8...Qb6 misplace Black's pieces, 8...b5 accepts strategic risk, and the critical 8...cxd4 line still leaves White pressing after 12...O-O.",
    lineId: "ch7-d32-qxe2"
  }
];

type DiagramSpec = { id: string; sourceSpanId: string; role: string; lineId: string };
const diagramSpecs: DiagramSpec[] = [
  { id: "CH7-D01", sourceSpanId: "chapter7-p87-full", role: "Chapter starting position after 7...Bd7", lineId: "ch7-opening" },
  { id: "CH7-D02", sourceSpanId: "chapter7-p88-left", role: "A) Starting position after 7...Bd7", lineId: "ch7-opening" },
  { id: "CH7-D03", sourceSpanId: "chapter7-p88-right", role: "A) Position after 12...O-O", lineId: "ch7-a-rxc5" },
  { id: "CH7-D04", sourceSpanId: "chapter7-p88-right", role: "A) Position after 9...Qa5", lineId: "ch7-a-qa5" },
  { id: "CH7-D05", sourceSpanId: "chapter7-p89-left", role: "A) Queenless position after 12...Be7", lineId: "ch7-a-ending" },
  { id: "CH7-D06", sourceSpanId: "chapter7-p89-left", role: "B) Position after 8...Qb6", lineId: "ch7-b-start" },
  { id: "CH7-D07", sourceSpanId: "chapter7-p89-right", role: "B1) Position before 15.Nxd5!N", lineId: "ch7-b1-nd5" },
  { id: "CH7-D08", sourceSpanId: "chapter7-p90-left", role: "B11) Position after 10...Na5", lineId: "ch7-b11-start" },
  { id: "CH7-D09", sourceSpanId: "chapter7-p90-left", role: "B11) Position before 15.a3", lineId: "ch7-b11-bc6" },
  { id: "CH7-D10", sourceSpanId: "chapter7-p90-right", role: "B11) Position after 13...Nxc6", lineId: "ch7-b11-be7" },
  { id: "CH7-D11", sourceSpanId: "chapter7-p90-right", role: "B11) Position after 11...O-O", lineId: "ch7-b11-castled" },
  { id: "CH7-D12", sourceSpanId: "chapter7-p91-left", role: "B11) Position before 13.Qg5!", lineId: "ch7-b11-qb4" },
  { id: "CH7-D13", sourceSpanId: "chapter7-p91-left", role: "B12) Position after 10...Qb4", lineId: "ch7-b12-start" },
  { id: "CH7-D14", sourceSpanId: "chapter7-p91-right", role: "B12) Position before 14.Be3!N", lineId: "ch7-b12-bb6" },
  { id: "CH7-D15", sourceSpanId: "chapter7-p92-left", role: "B12) Position before 18.Nxd5", lineId: "ch7-b12-nd5" },
  { id: "CH7-D16", sourceSpanId: "chapter7-p92-left", role: "B2) Position after 9...Qxc5", lineId: "ch7-b2-start" },
  { id: "CH7-D17", sourceSpanId: "chapter7-p92-right", role: "B2) Position before 15.Nb5", lineId: "ch7-b2-nd5" },
  { id: "CH7-D18", sourceSpanId: "chapter7-p92-right", role: "B21) Position after 10...Be7", lineId: "ch7-b21-start" },
  { id: "CH7-D19", sourceSpanId: "chapter7-p93-left", role: "B21) Position before 14.Bc7!", lineId: "ch7-b21-rfd8" },
  { id: "CH7-D20", sourceSpanId: "chapter7-p93-right", role: "B22) Position after 10...Rc8", lineId: "ch7-b22-start" },
  { id: "CH7-D21", sourceSpanId: "chapter7-p93-right", role: "B22) Position after 12...Qb4", lineId: "ch7-b22-qb4" },
  { id: "CH7-D22", sourceSpanId: "chapter7-p94-left", role: "B22) Position before 14...Rhd8N", lineId: "ch7-b22-before-rhd8" },
  { id: "CH7-D23", sourceSpanId: "chapter7-p94-left", role: "C) Position after 8...b5", lineId: "ch7-c-start" },
  { id: "CH7-D24", sourceSpanId: "chapter7-p94-right", role: "C1) Position after 12...Qb6", lineId: "ch7-c1-qb6" },
  { id: "CH7-D25", sourceSpanId: "chapter7-p95-left", role: "C1) Position after 10...Rc8", lineId: "ch7-c1-start" },
  { id: "CH7-D26", sourceSpanId: "chapter7-p95-left", role: "C1) Position after 15.b3!", lineId: "ch7-c1-b3" },
  { id: "CH7-D27", sourceSpanId: "chapter7-p95-right", role: "C1) Position before 13.Qd1", lineId: "ch7-c1-nb4" },
  { id: "CH7-D28", sourceSpanId: "chapter7-p96-left", role: "C1) Position after 11...Be7", lineId: "ch7-c1-be7" },
  { id: "CH7-D29", sourceSpanId: "chapter7-p96-left", role: "C1) Position after 15.Bf4", lineId: "ch7-c1-qc7" },
  { id: "CH7-D30", sourceSpanId: "chapter7-p96-right", role: "C2) Position after 9...Rc8", lineId: "ch7-c2-start" },
  { id: "CH7-D31", sourceSpanId: "chapter7-p97-left", role: "C2) Position before 13.Bg5!N", lineId: "ch7-c2-a6" },
  { id: "CH7-D32", sourceSpanId: "chapter7-p97-left", role: "C2) Position after 11.Nc3", lineId: "ch7-c2-main" },
  { id: "CH7-D33", sourceSpanId: "chapter7-p97-right", role: "C2) Queenless position before 16.Ne5N", lineId: "ch7-c2-a6-endgame" },
  { id: "CH7-D34", sourceSpanId: "chapter7-p97-right", role: "C21) Position after 11...O-O", lineId: "ch7-c21-start" },
  { id: "CH7-D35", sourceSpanId: "chapter7-p98-left", role: "C21) Position before 19.Rxd5!", lineId: "ch7-c21-f5" },
  { id: "CH7-D36", sourceSpanId: "chapter7-p98-right", role: "C21) Position after 15...Re8", lineId: "ch7-c21-re8" },
  { id: "CH7-D37", sourceSpanId: "chapter7-p99-left", role: "C21) Position before 23.Rfd1!", lineId: "ch7-c21-rc8" },
  { id: "CH7-D38", sourceSpanId: "chapter7-p99-left", role: "C22) Position after 11...Nb4", lineId: "ch7-c22-start" },
  { id: "CH7-D39", sourceSpanId: "chapter7-p99-right", role: "C22) Queenless position after 14...Na6", lineId: "ch7-c22-na6" },
  { id: "CH7-D40", sourceSpanId: "chapter7-p100-left", role: "C22) Position before 15.Bf4N", lineId: "ch7-c22-rxd8" },
  { id: "CH7-D41", sourceSpanId: "chapter7-p100-left", role: "C23) Position after 12.Nb5", lineId: "ch7-c23-start" },
  { id: "CH7-D42", sourceSpanId: "chapter7-p100-right", role: "C23) Position before 15.Ng5!", lineId: "ch7-c23-rc7" },
  { id: "CH7-D43", sourceSpanId: "chapter7-p101-left", role: "C23) Position before 14.Bf4", lineId: "ch7-c23-nd4" },
  { id: "CH7-D44", sourceSpanId: "chapter7-p101-right", role: "C23) Position after 17...Bb6", lineId: "ch7-c23-bb6" },
  { id: "CH7-D45", sourceSpanId: "chapter7-p102-left", role: "D1) Position after 10...Qb6", lineId: "ch7-d1-start" },
  { id: "CH7-D46", sourceSpanId: "chapter7-p102-right", role: "D1) Position before 12.Qh4!N", lineId: "ch7-d1-na5" },
  { id: "CH7-D47", sourceSpanId: "chapter7-p103-left", role: "D1) Position before 17...e5", lineId: "ch7-d1-rfc1" },
  { id: "CH7-D48", sourceSpanId: "chapter7-p103-left", role: "D2) Position after 10...Be7", lineId: "ch7-d2-start" },
  { id: "CH7-D49", sourceSpanId: "chapter7-p103-right", role: "D2) Position before 13.Qb5!", lineId: "ch7-d2-qa5" },
  { id: "CH7-D50", sourceSpanId: "chapter7-p104-left", role: "D2) Position before 16.Rd4!N", lineId: "ch7-d2-qa6" },
  { id: "CH7-D51", sourceSpanId: "chapter7-p104-right", role: "D2) Position after 11...Na5", lineId: "ch7-d2-na5" },
  { id: "CH7-D52", sourceSpanId: "chapter7-p104-right", role: "D2) Queenless position before 17.Nd4N", lineId: "ch7-d2-a6" },
  { id: "CH7-D53", sourceSpanId: "chapter7-p105-left", role: "D2) Position after 18.b3!", lineId: "ch7-d2-na7" },
  { id: "CH7-D54", sourceSpanId: "chapter7-p105-right", role: "D2) Active bishops before 21...Nb2", lineId: "ch7-d2-nc4" },
  { id: "CH7-D55", sourceSpanId: "chapter7-p105-right", role: "D3) Position after 12.Qh4", lineId: "ch7-d3-start" },
  { id: "CH7-D56", sourceSpanId: "chapter7-p106-left", role: "D3) Position after 13.Bh6!", lineId: "ch7-d3-qb6" },
  { id: "CH7-D57", sourceSpanId: "chapter7-p106-left", role: "D31) Position after 13.Rd1", lineId: "ch7-d31-start" },
  { id: "CH7-D58", sourceSpanId: "chapter7-p106-right", role: "D31) Position before 16.Rac1!N", lineId: "ch7-d31-bh6" },
  { id: "CH7-D59", sourceSpanId: "chapter7-p106-right", role: "D31) Position before 17.Qf3!N", lineId: "ch7-d31-qg6" },
  { id: "CH7-D60", sourceSpanId: "chapter7-p107-left", role: "D31) Position before 14.Bxc6+", lineId: "ch7-d31-qa5" },
  { id: "CH7-D61", sourceSpanId: "chapter7-p107-right", role: "D31) Dangerous endgame after 20.Rac1", lineId: "ch7-d31-endgame" },
  { id: "CH7-D62", sourceSpanId: "chapter7-p107-right", role: "D32) Position after 12...O-O", lineId: "ch7-d32-start" },
  { id: "CH7-D63", sourceSpanId: "chapter7-p108-left", role: "D32) Position after 13...Rb8", lineId: "ch7-d32-rb8" },
  { id: "CH7-D64", sourceSpanId: "chapter7-p108-right", role: "D32) Position after 15.Qg5", lineId: "ch7-d32-rb4" },
  { id: "CH7-D65", sourceSpanId: "chapter7-p109-left", role: "D32) Earlier line after 21...Nf6", lineId: "ch7-d32-old-line" },
  { id: "CH7-D66", sourceSpanId: "chapter7-p109-left", role: "D32) Recommended position after 17.Nd1!", lineId: "ch7-d32-nd1" },
  { id: "CH7-D67", sourceSpanId: "chapter7-p109-right", role: "D32) Position after 20.Qc2!", lineId: "ch7-d32-ra4" },
  { id: "CH7-D68", sourceSpanId: "chapter7-p109-right", role: "D32) Position after 23.Rxb2", lineId: "ch7-d32-rxb2" },
  { id: "CH7-D69", sourceSpanId: "chapter7-p110-left", role: "D32) Position after 18...Rc4", lineId: "ch7-d32-rc4" },
  { id: "CH7-D70", sourceSpanId: "chapter7-p110-left", role: "D32) Position before 21.b3!N", lineId: "ch7-d32-e5" },
  { id: "CH7-D71", sourceSpanId: "chapter7-p110-right", role: "D32) Position after 20.Qxe3", lineId: "ch7-d32-bxe3" },
  { id: "CH7-D72", sourceSpanId: "chapter7-p111-left", role: "D32) Position after 22...Re8!?", lineId: "ch7-d32-re8" },
  { id: "CH7-D73", sourceSpanId: "chapter7-p111-left", role: "D32) Position before 28.Be3", lineId: "ch7-d32-qxe2" },
];
export const CHAPTER7_DIAGRAMS: DiagramLink[] = diagramSpecs.map((spec) => {
  const sourceLine = byId(spec.lineId);
  const moveIndex = sourceLine.moves.length - 1;
  const chess = new Chess(sourceLine.startFen);
  sourceLine.moves.slice(0, moveIndex + 1).forEach((move) => chess.move(move.san));
  return { id: spec.id, associationStatus: "source-verified", positionStatus: "deterministically derived", boardIdentityStatus: "source-verified", sourceSpanId: spec.sourceSpanId, crop: `/source/chapter7/crops/${spec.id}.png`, role: spec.role, lineId: spec.lineId, moveIndex, fen: chess.fen() };
});

const diagramIdsBySpan = new Map<string, string[]>();
for (const diagram of CHAPTER7_DIAGRAMS) diagramIdsBySpan.set(diagram.sourceSpanId, [...(diagramIdsBySpan.get(diagram.sourceSpanId) ?? []), diagram.id]);

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
    { id: `ch7-heading-${regionNumber}`, type: "heading", status: "source-verified", sourceSpanId: region.id, text: region.title, moveRefs: moveRefsInText(region.title, region.lineId, region.id) },
    { id: `ch7-line-${regionNumber}`, type: "variation", status: "source-verified", sourceSpanId: region.id, title: region.title, text: sourceText, lineId: region.lineId, moveRefs: moveRefsInText(sourceText, region.lineId, region.id) },
  ];
  for (const diagramId of diagramIdsBySpan.get(region.id) ?? []) regionBlocks.push({ id: `${diagramId.toLowerCase()}-block`, type: "diagram", status: "source-verified", sourceSpanId: region.id, diagramId });
  return regionBlocks;
});

export const CHAPTER7_LESSON: LessonDocument = {
  schemaVersion: 2,
  lessonId: "catalan.chapter7.complete",
  status: "source-verified",
  title: "Chapter 7 - Complete",
  subtitle: "The Catalan: 5...c5, 6...Nc6 and 7...Bd7",
  source: { documentId: "catalan.chapter7", filename: "Chapter7_Catalan.pdf", sha256: SOURCE_HASH },
  basePosition: { status: "deterministically derived", after: "Initial position", fen: new Chess().fen(), moves: [] },
  sourceSpans,
  lines,
  diagrams: CHAPTER7_DIAGRAMS,
  blocks,
};

export const CHAPTER7_ANNOTATED_MOVE_IDS = CHAPTER7_LESSON.lines.flatMap((item) => item.moves).filter((move) => move.annotation).map((move) => move.id);
export const CHAPTER7_SECTIONS = [
  {
    id: "overview",
    label: "Overview",
    blockId: "ch7-heading-01"
  },
  {
    id: "a",
    label: "A) 8...Rc8",
    blockId: "ch7-heading-02"
  },
  {
    id: "b",
    label: "B) 8...Qb6",
    blockId: "ch7-heading-04"
  },
  {
    id: "b1",
    label: "B1) 9...Bxc5",
    blockId: "ch7-heading-05"
  },
  {
    id: "b2",
    label: "B2) 9...Qxc5",
    blockId: "ch7-heading-11"
  },
  {
    id: "c",
    label: "C) 8...b5",
    blockId: "ch7-heading-15"
  },
  {
    id: "c2",
    label: "C2) 9...Rc8",
    blockId: "ch7-heading-18"
  },
  {
    id: "d",
    label: "D) 8...cxd4",
    blockId: "ch7-heading-31"
  },
  {
    id: "d3",
    label: "D3) 10...Nxd4",
    blockId: "ch7-heading-39"
  },
  {
    id: "conclusion",
    label: "Conclusion",
    blockId: "ch7-heading-49"
  }
];
