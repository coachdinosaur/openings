import { Chess } from "chess.js";
import type { DiagramLink, LessonBlock, LessonDocument, MoveAnnotation, MoveReference, SourceSpan, VariationMove, VariationNode } from "./lesson-model";
import { sourceMoveRefs, sourceTranscript } from "./chapter-source-transcripts";

const SOURCE_HASH = "3291A82991240986378A38F10926B8C60EA4E40DD2E10FCD256718B2A8059D7E";
type MoveSpec = string | readonly [san: string, sourceToken: string];

function annotationFor(san: string, sourceToken: string): MoveAnnotation | undefined {
  const suffix = sourceToken.startsWith(san) ? sourceToken.slice(san.length) : sourceToken.replace(san, "");
  const punctuation = suffix.match(/[!?]+/)?.[0];
  const novelty = suffix.includes("N") ? "N" : undefined;
  const evaluation = suffix.match(/\+\-|±|∞|=/)?.[0];
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
    id: "chapter6-p73-full",
    status: "source-verified",
    pageIndex: 0,
    printedPage: 73,
    column: "full",
    order: 1,
    crop: "/source/chapter6/pages/printed-73.png",
    bbox: {
      x0: 0,
      top: 0,
      x1: 474.96,
      bottom: 676.08
    }
  },
  {
    id: "chapter6-p74-left",
    status: "source-verified",
    pageIndex: 1,
    printedPage: 74,
    column: "left",
    order: 2,
    crop: "/source/chapter6/pages/printed-74.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter6-p74-right",
    status: "source-verified",
    pageIndex: 1,
    printedPage: 74,
    column: "right",
    order: 3,
    crop: "/source/chapter6/pages/printed-74.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter6-p75-left",
    status: "source-verified",
    pageIndex: 2,
    printedPage: 75,
    column: "left",
    order: 4,
    crop: "/source/chapter6/pages/printed-75.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter6-p75-right",
    status: "source-verified",
    pageIndex: 2,
    printedPage: 75,
    column: "right",
    order: 5,
    crop: "/source/chapter6/pages/printed-75.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter6-p76-left",
    status: "source-verified",
    pageIndex: 3,
    printedPage: 76,
    column: "left",
    order: 6,
    crop: "/source/chapter6/pages/printed-76.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter6-p76-right",
    status: "source-verified",
    pageIndex: 3,
    printedPage: 76,
    column: "right",
    order: 7,
    crop: "/source/chapter6/pages/printed-76.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter6-p77-left",
    status: "source-verified",
    pageIndex: 4,
    printedPage: 77,
    column: "left",
    order: 8,
    crop: "/source/chapter6/pages/printed-77.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter6-p77-right",
    status: "source-verified",
    pageIndex: 4,
    printedPage: 77,
    column: "right",
    order: 9,
    crop: "/source/chapter6/pages/printed-77.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter6-p78-left",
    status: "source-verified",
    pageIndex: 5,
    printedPage: 78,
    column: "left",
    order: 10,
    crop: "/source/chapter6/pages/printed-78.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter6-p78-right",
    status: "source-verified",
    pageIndex: 5,
    printedPage: 78,
    column: "right",
    order: 11,
    crop: "/source/chapter6/pages/printed-78.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter6-p79-left",
    status: "source-verified",
    pageIndex: 6,
    printedPage: 79,
    column: "left",
    order: 12,
    crop: "/source/chapter6/pages/printed-79.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter6-p79-right",
    status: "source-verified",
    pageIndex: 6,
    printedPage: 79,
    column: "right",
    order: 13,
    crop: "/source/chapter6/pages/printed-79.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter6-p80-left",
    status: "source-verified",
    pageIndex: 7,
    printedPage: 80,
    column: "left",
    order: 14,
    crop: "/source/chapter6/pages/printed-80.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter6-p80-right",
    status: "source-verified",
    pageIndex: 7,
    printedPage: 80,
    column: "right",
    order: 15,
    crop: "/source/chapter6/pages/printed-80.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter6-p81-left",
    status: "source-verified",
    pageIndex: 8,
    printedPage: 81,
    column: "left",
    order: 16,
    crop: "/source/chapter6/pages/printed-81.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter6-p81-right",
    status: "source-verified",
    pageIndex: 8,
    printedPage: 81,
    column: "right",
    order: 17,
    crop: "/source/chapter6/pages/printed-81.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter6-p82-left",
    status: "source-verified",
    pageIndex: 9,
    printedPage: 82,
    column: "left",
    order: 18,
    crop: "/source/chapter6/pages/printed-82.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter6-p82-right",
    status: "source-verified",
    pageIndex: 9,
    printedPage: 82,
    column: "right",
    order: 19,
    crop: "/source/chapter6/pages/printed-82.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter6-p83-left",
    status: "source-verified",
    pageIndex: 10,
    printedPage: 83,
    column: "left",
    order: 20,
    crop: "/source/chapter6/pages/printed-83.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter6-p83-right",
    status: "source-verified",
    pageIndex: 10,
    printedPage: 83,
    column: "right",
    order: 21,
    crop: "/source/chapter6/pages/printed-83.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter6-p84-left",
    status: "source-verified",
    pageIndex: 11,
    printedPage: 84,
    column: "left",
    order: 22,
    crop: "/source/chapter6/pages/printed-84.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter6-p84-right",
    status: "source-verified",
    pageIndex: 11,
    printedPage: 84,
    column: "right",
    order: 23,
    crop: "/source/chapter6/pages/printed-84.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter6-p85-left",
    status: "source-verified",
    pageIndex: 12,
    printedPage: 85,
    column: "left",
    order: 24,
    crop: "/source/chapter6/pages/printed-85.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter6-p85-right",
    status: "source-verified",
    pageIndex: 12,
    printedPage: 85,
    column: "right",
    order: 25,
    crop: "/source/chapter6/pages/printed-85.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
  {
    id: "chapter6-p86-left",
    status: "source-verified",
    pageIndex: 13,
    printedPage: 86,
    column: "left",
    order: 26,
    crop: "/source/chapter6/pages/printed-86.png",
    bbox: {
      x0: 35,
      top: 50,
      x1: 237,
      bottom: 640
    }
  },
  {
    id: "chapter6-p86-right",
    status: "source-verified",
    pageIndex: 13,
    printedPage: 86,
    column: "right",
    order: 27,
    crop: "/source/chapter6/pages/printed-86.png",
    bbox: {
      x0: 237,
      top: 50,
      x1: 440,
      bottom: 640
    }
  },
];

const INITIAL_FEN = new Chess().fen();
const CH6_ROOT = ["d4", "Nf6", "c4", "e6", "g3", "d5", "Nf3", "dxc4", "Bg2", "c5"] as const;

function sourceLine(id: string, label: string, continuation: MoveSpec[], sourceSpanId: string): VariationNode {
  return line(id, label, INITIAL_FEN, [...CH6_ROOT, ...continuation], sourceSpanId);
}

const lines: VariationNode[] = [
  sourceLine("ch6-opening", "Position after 5...c5", [], "chapter6-p73-full"),
  sourceLine("ch6-castle", "Position after 6.O-O", ["O-O"], "chapter6-p74-left"),
  sourceLine("ch6-a-na6", "A) 7...Na6 before 8.Nb5!N", ["O-O", "cxd4", "Nxd4", "Na6"], "chapter6-p74-right"),
  sourceLine("ch6-a-na6-main", "A) 7...Na6 and 10.N1c3!", ["O-O", "cxd4", "Nxd4", "Na6", ["Nb5", "Nb5!N"], "Qxd1", "Rxd1", "Nd5"], "chapter6-p74-right"),
  sourceLine("ch6-a-na6-nc7", "A) 8...Nc7 and 10.N5a3!?", ["O-O", "cxd4", "Nxd4", "Na6", ["Nb5", "Nb5!N"], "Nc7", "Qxd8+", "Kxd8", ["N5a3", "N5a3!?"]], "chapter6-p74-right"),
  sourceLine("ch6-a-na6-bd7", "A) 8...Bd7 and the damaged queenside", ["O-O", "cxd4", "Nxd4", "Na6", ["Nb5", "Nb5!N"], "Bd7", "Nd6+", "Bxd6", "Qxd6", "Bb5", "Qxd8+", "Rxd8", "Na3", "Bc6", "Bxc6+", "bxc6", ["Nxc4", "Nxc4±"]], "chapter6-p74-right"),
  sourceLine("ch6-a-na6-complete", "A) 9.Rxd1 Nd5 10.N1c3!", ["O-O", "cxd4", "Nxd4", "Na6", ["Nb5", "Nb5!N"], "Qxd1", "Rxd1", "Nd5", ["N1c3", "N1c3!"], "Bd7", "Nxd5", "Bxb5", "Nc3", "Bc6", "Bxc6+", "bxc6", "Rd4", "Nb4", "Rxc4"], "chapter6-p74-right"),
  sourceLine("ch6-a-nd5", "A) 7...Nd5 before 12.Nxd5", ["O-O", "cxd4", "Nxd4", ["Nd5", "Nd5?!"], "Qa4+", "Nd7", "Qxc4", "N7b6", "Qb3", "Bd7", "Nc3", "Bc5"], "chapter6-p75-left"),
  sourceLine("ch6-a1-start", "A1) Position after 7...Qb6", ["O-O", "cxd4", "Nxd4", "Qb6"], "chapter6-p75-left"),
  sourceLine("ch6-a1-qb3", "A1) The key 10.Qb3!", ["O-O", "cxd4", "Nxd4", "Qb6", "Qa4+", "Bd7", "Qxc4", "Na6", ["Qb3", "Qb3!"]], "chapter6-p75-right"),
  sourceLine("ch6-a1-castled", "A1) Position before 14.e3!", ["O-O", "cxd4", "Nxd4", "Qb6", "Qa4+", "Bd7", "Qxc4", "Na6", "Qb3", "Nb4", "a3", "Bc5", "axb4", "Bxd4", "Na3", "O-O"], "chapter6-p76-left"),
  sourceLine("ch6-a1-before-rfc1", "A1) Position before 17.Rfc1N±", ["O-O", "cxd4", "Nxd4", "Qb6", "Qa4+", "Bd7", "Qxc4", "Na6", "Qb3", "Nb4", "a3", "Bc5", "axb4", "Bxd4", "Na3", "O-O", ["e3", "e3!"], "Bc5", "Bd2", "Be7", "Nc4", "Qc7"], "chapter6-p76-left"),
  sourceLine("ch6-a1-rfc1", "A1) 17.Rfc1N±", ["O-O", "cxd4", "Nxd4", "Qb6", "Qa4+", "Bd7", "Qxc4", "Na6", "Qb3", "Nb4", "a3", "Bc5", "axb4", "Bxd4", "Na3", "O-O", ["e3", "e3!"], "Bc5", "Bd2", "Be7", "Nc4", "Qc7", ["Rfc1", "Rfc1N±"]], "chapter6-p76-left"),
  sourceLine("ch6-a2-start", "A2) Position after 7...Bc5", ["O-O", "cxd4", "Nxd4", "Bc5"], "chapter6-p76-right"),
  sourceLine("ch6-a2-a6", "A2) The ...Nbd7 setup before 11.Rd1!", ["O-O", "cxd4", "Nxd4", "Bc5", ["Qa4+", "Qa4+!"], "Nbd7", "Qxc4", "O-O", "Nc3", "a6"], "chapter6-p76-right"),
  sourceLine("ch6-a2-sacrifice", "A2) Position before 13.Ncxb5!N", ["O-O", "cxd4", "Nxd4", "Bc5", "Qa4+", "Nbd7", "Qxc4", "O-O", "Nc3", "a6", ["Rd1", "Rd1!"], "Qc7", "b4", "b5"], "chapter6-p77-left"),
  sourceLine("ch6-a2-qd7", "A2) Position after 8...Qd7", ["O-O", "cxd4", "Nxd4", "Bc5", ["Qa4+", "Qa4+!"], "Qd7"], "chapter6-p77-left"),
  sourceLine("ch6-a2-qe7", "A2) Position before 11.b4!", ["O-O", "cxd4", "Nxd4", "Bc5", "Qa4+", "Qd7", ["Nb5", "Nb5!"], "O-O", "Qxc4", "Qe7"], "chapter6-p77-right"),
  sourceLine("ch6-a2-before-a5", "A2) Position before 13.a5", ["O-O", "cxd4", "Nxd4", "Bc5", "Qa4+", "Qd7", "Nb5", "O-O", "Qxc4", "Qe7", ["b4", "b4!"], "Bb6", "a4", "Bd7"], "chapter6-p78-left"),
  sourceLine("ch6-a3-start", "A3) Position after 7...a6", ["O-O", "cxd4", "Nxd4", "a6"], "chapter6-p78-left"),
  sourceLine("ch6-a3-nbd7", "A3) The ...Nbd7 line before 10.Nf3!N", ["O-O", "cxd4", "Nxd4", "a6", ["Nc3", "Nc3!N"], "Nbd7", "Qa4", "e5"], "chapter6-p78-right"),
  sourceLine("ch6-a3-be3", "A3) Position after 10.Be3!", ["O-O", "cxd4", "Nxd4", "a6", ["Nc3", "Nc3!N"], "Bc5", "Qa4+", "Qd7", ["Be3", "Be3!"]], "chapter6-p79-left"),
  sourceLine("ch6-a3-e5", "A3) Position after 8...e5!N", ["O-O", "cxd4", "Nxd4", "a6", ["Nc3", "Nc3!N"], ["e5", "e5!N"]], "chapter6-p79-left"),
  sourceLine("ch6-a3-endgame", "A3) Position before 13.Bxf6", ["O-O", "cxd4", "Nxd4", "a6", "Nc3", "e5", ["Nc2", "Nc2!"], "Qxd1", "Rxd1", "Nc6", "Bg5", "Be6", "Ne3", "Bc5"], "chapter6-p79-right"),
  sourceLine("ch6-b-start", "B) Position after 7.Qa4", ["O-O", "Nc6", "Qa4"], "chapter6-p80-left"),
  sourceLine("ch6-b-nbd7", "B) Model position before 10...a6", ["O-O", "Nc6", "Qa4", "Nd7", "dxc5", "Bxc5", "Qxc4", "O-O", "Nc3"], "chapter6-p80-left"),
  sourceLine("ch6-b-qb6", "B) Position after 12.Rd1", ["O-O", "Nc6", "Qa4", "Qb6", ["Na3", "Na3!"], "cxd4", "Nxc4", "Qb4", "Qxb4", "Bxb4", "a3", "Be7", "Rd1"], "chapter6-p80-right"),
  sourceLine("ch6-b-qa5", "B) The 7...Qa5 line before 11.Qc3!", ["O-O", "Nc6", "Qa4", "Qa5", "Qxc4", "cxd4", "Nxd4", "Nxd4", "Qxd4", "Bc5"], "chapter6-p81-left"),
  sourceLine("ch6-b-cxd4", "B) Position after 7...cxd4", ["O-O", "Nc6", "Qa4", "cxd4"], "chapter6-p81-left"),
  sourceLine("ch6-b-exchange-sac", "B) Exchange-sacrifice position before 12.Be3!", ["O-O", "Nc6", "Qa4", "cxd4", "Nxd4", "Qxd4", "Bxc6+", ["bxc6", "bxc6?!"], "Qxc6+", "Qd7", "Qxa8", "Bc5"], "chapter6-p81-right"),
  sourceLine("ch6-b-exchange-defence", "B) Engine-backed defence before 15.Rad1N", ["O-O", "Nc6", "Qa4", "cxd4", "Nxd4", "Qxd4", "Bxc6+", "bxc6", "Qxc6+", "Qd7", "Qxa8", "Bc5", ["Be3", "Be3!"], "Bxe3", "fxe3", "O-O", "Nc3", "Qc7"], "chapter6-p82-left"),
  sourceLine("ch6-b1-start", "B1) Position after 12.Rxd4", ["O-O", "Nc6", "Qa4", "cxd4", "Nxd4", "Qxd4", "Bxc6+", "Bd7", ["Rd1", "Rd1!"], "Bxc6", "Qxc6+", "bxc6", "Rxd4"], "chapter6-p82-left"),
  sourceLine("ch6-b1-endgame", "B1) Risk-free endgame before 16.Nb3", ["O-O", "Nc6", "Qa4", "cxd4", "Nxd4", "Qxd4", "Bxc6+", "Bd7", "Rd1", "Bxc6", "Qxc6+", "bxc6", "Rxd4", "c5", "Rxc4", "Be7", "Bf4", "O-O", "Nd2", "Nd7"], "chapter6-p82-right"),
  sourceLine("ch6-b2-start", "B2) Position after 11...Bxc6", ["O-O", "Nc6", "Qa4", "cxd4", "Nxd4", "Qxd4", "Bxc6+", "Bd7", ["Rd1", "Rd1!"], "Qxd1+", "Qxd1", "Bxc6"], "chapter6-p83-left"),
  sourceLine("ch6-b2-h5", "B2) The 12...h5?! line before 16.Ne5!", ["O-O", "Nc6", "Qa4", "cxd4", "Nxd4", "Qxd4", "Bxc6+", "Bd7", "Rd1", "Qxd1+", "Qxd1", "Bxc6", "Nd2", ["h5", "h5?!"], "Nxc4", "h4", ["Bf4", "Bf4!"], "hxg3", "Bxg3", "Ne4"], "chapter6-p83-left"),
  sourceLine("ch6-b21-start", "B21) Position after 13.bxc3", ["O-O", "Nc6", "Qa4", "cxd4", "Nxd4", "Qxd4", "Bxc6+", "Bd7", "Rd1", "Qxd1+", "Qxd1", "Bxc6", "Nd2", ["c3", "c3?!"], "bxc3"], "chapter6-p83-right"),
  sourceLine("ch6-b21-bc5", "B21) Position before the bishop exchange", ["O-O", "Nc6", "Qa4", "cxd4", "Nxd4", "Qxd4", "Bxc6+", "Bd7", "Rd1", "Qxd1+", "Qxd1", "Bxc6", "Nd2", "c3", "bxc3", "Rd8", "Qb3", "Bc5"], "chapter6-p84-left"),
  sourceLine("ch6-b22-start", "B22) Position after 12...b5", ["O-O", "Nc6", "Qa4", "cxd4", "Nxd4", "Qxd4", "Bxc6+", "Bd7", "Rd1", "Qxd1+", "Qxd1", "Bxc6", "Nd2", "b5"], "chapter6-p84-left"),
  sourceLine("ch6-b22-rxa6", "B22) Position before 16.Rxa6!", ["O-O", "Nc6", "Qa4", "cxd4", "Nxd4", "Qxd4", "Bxc6+", "Bd7", "Rd1", "Qxd1+", "Qxd1", "Bxc6", "Nd2", "b5", "a4", ["a6", "a6?"], "axb5", "Bxb5", "Qc2", "Rc8"], "chapter6-p84-right"),
  sourceLine("ch6-b22-castled", "B22) Main endgame before 16.Na3!?", ["O-O", "Nc6", "Qa4", "cxd4", "Nxd4", "Qxd4", "Bxc6+", "Bd7", "Rd1", "Qxd1+", "Qxd1", "Bxc6", "Nd2", "b5", "a4", "Be7", "axb5", "Bxb5", "Nxc4", "O-O"], "chapter6-p84-right"),
  sourceLine("ch6-b22-f3", "B22) Position before 18.f3!", ["O-O", "Nc6", "Qa4", "cxd4", "Nxd4", "Qxd4", "Bxc6+", "Bd7", "Rd1", "Qxd1+", "Qxd1", "Bxc6", "Nd2", "b5", "a4", "Be7", "axb5", "Bxb5", "Nxc4", "O-O", ["Na3", "Na3!?"], "Rfd8", "Qe1", "Bc6"], "chapter6-p85-left"),
  sourceLine("ch6-b22-after-f3", "B22) The improved setup after 18.f3!", ["O-O", "Nc6", "Qa4", "cxd4", "Nxd4", "Qxd4", "Bxc6+", "Bd7", "Rd1", "Qxd1+", "Qxd1", "Bxc6", "Nd2", "b5", "a4", "Be7", "axb5", "Bxb5", "Nxc4", "O-O", "Na3", "Rfd8", "Qe1", "Bc6", ["f3", "f3!"]], "chapter6-p85-right"),
  sourceLine("ch6-b22-rab8", "B22) Position before 20.Nc2!", ["O-O", "Nc6", "Qa4", "cxd4", "Nxd4", "Qxd4", "Bxc6+", "Bd7", "Rd1", "Qxd1+", "Qxd1", "Bxc6", "Nd2", "b5", "a4", "Be7", "axb5", "Bxb5", "Nxc4", "O-O", "Na3", "Rfd8", "Qe1", "Bc6", "f3", "Rab8", "Kg2", "h6"], "chapter6-p86-left"),
  sourceLine("ch6-b22-nd5", "B22) Main position after 18...Nd5", ["O-O", "Nc6", "Qa4", "cxd4", "Nxd4", "Qxd4", "Bxc6+", "Bd7", "Rd1", "Qxd1+", "Qxd1", "Bxc6", "Nd2", "b5", "a4", "Be7", "axb5", "Bxb5", "Nxc4", "O-O", "Na3", "Rfd8", "Qe1", "Bc6", "f3", "Nd5"], "chapter6-p86-left"),
];

const byId = (id: string) => {
  const found = lines.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`Missing Chapter 6 line ${id}`);
  return found;
};

function moveRefsInText(text: string, preferredLineId: string, sourceSpanId: string): MoveReference[] {
  return sourceMoveRefs(text, lines, preferredLineId, sourceSpanId);
}

type RegionCopy = { id: string; title: string; text: string; lineId: string };
const regionCopy: RegionCopy[] = [
  {
    id: "chapter6-p73-full",
    title: "5...c5 — Variation Index",
    text: [
      "1.d4 Nf6 2.c4 e6 3.g3 d5 4.Nf3 dxc4 5.Bg2 c5 6.O-O",
      "A) 6...cxd4 7.Nxd4 - page 74. A1) 7...Qb6 - page 75. A2) 7...Bc5 - page 76. A3) 7...a6!? - page 78.",
      "B) 6...Nc6 7.Qa4 cxd4 8.Nxd4 Qxd4 9.Bxc6+ Bd7 10.Rd1 - page 80. B1) 10...Bxc6 - page 82. B2) 10...Qxd1+ 11.Qxd1 Bxc6 12.Nd2 - page 83. B21) 12...c3?! - page 83. B22) 12...b5 - page 84.",
      "Featured ideas: A2) after 8...Qd7, 13.Ncxb5!N; A3) after 7...a6!?, 8.Nc3!N; B21) after 14...Bc5, 15.Nc4N."
    ].join("\n\n"),
    lineId: "ch6-opening"
  },
  {
    id: "chapter6-p74-left",
    title: "5...c5 and 6.O-O",
    text: [
      "1.d4 Nf6 2.c4 e6 3.g3 d5 4.Nf3 dxc4 5.Bg2 c5",
      "This remains a popular variation, and it has recently been used successfully by some top grandmasters, including Vishy Anand.",
      "6.O-O",
      "In the Catalan it is quite common for White to build a lead in development while Black is mainly making pawn moves. Black will often then revert to catching up on development while White regains the sacrificed pawn.",
      "Sometimes Black tries to solve his opening problems by removing the tension in the centre with A) 6...cxd4, but the more popular B) 6...Nc6 is probably a sounder approach.",
      "6...Nbd7 transposes to variation A of Chapter 5.",
      "A) 6...cxd4 7.Nxd4",
      "7.Qa4+ is playable, but I see no reason to change the recommendation from GM 1. The three most important replies are A1) 7...Qb6, A2) 7...Bc5 and A3) 7...a6!?",
      "7...Na6",
      "This move was awarded an exclamation mark in Chess Informant 48, but it looks strange"
    ].join("\n\n"),
    lineId: "ch6-castle"
  },
  {
    id: "chapter6-p74-right",
    title: "7...Na6 and the 8.Nb5!N novelty",
    text: [
      "It looks strange to me, as Black is doing nothing against White's pressure along the h1-a8 diagonal. I found no new games since GM 1, so the following idea remains a novelty:",
      "8.Nb5!N Qxd1",
      "8...Nc7 9.Qxd8+ Kxd8 10.N5a3!? and White will be clearly better after regaining the pawn on c4.",
      "8...Bd7 9.Nd6+ Bxd6 10.Qxd6 Bb5 11.Qxd8+ Rxd8 12.Na3 Bc6 13.Bxc6+ bxc6 14.Nxc4± White has a pleasant edge, thanks to Black's damaged pawn structure on the queenside.",
      "9.Rxd1 Nd5",
      "10.N1c3! Bd7 11.Nxd5 Bxb5 12.Nc3 Bc6 13.Bxc6+ bxc6 14.Rd4 Nb4 15.Rxc4 White has an obvious advantage.",
      "7...Nd5?!",
      "This move has been employed at a high level, but it cannot be recommended."
    ].join("\n\n"),
    lineId: "ch6-a-na6-complete"
  },
  {
    id: "chapter6-p75-left",
    title: "7...Nd5?! and A1) 7...Qb6",
    text: [
      "8.Qa4+ Nd7 9.Qxc4 N7b6 10.Qb3 Bd7",
      "After 10...Bc5 Kramnik gives 11.Qb5+ Nd7 12.Nb3 with White's advantage.",
      "11.Nc3",
      "11.e4!?N might be a worthy alternative.",
      "11...Bc5",
      "11...Nxc3 12.Qxc3 Rc8 13.Qd3 leaves Black under pressure along the h1-a8 diagonal.",
      "12.Nxd5 Nxd5",
      "12...exd5 gives White a pleasant edge after 13.Be3 or 13.Qe3+ Qe7 14.b3.",
      "Now White found a nice tactical resource: 13.Nf5! O-O",
      "In the event of 13...exf5 14.Qxd5± Black loses the b7-pawn.",
      "14.Nxg7!± White won a pawn in Kramnik - Naiditsch, Turin (ol) 2006, as 14...Kxg7 would be met by 15.Bxd5 followed by 16.Qc3+ and 17.Qxc5.",
      "A1) 7...Qb6"
    ].join("\n\n"),
    lineId: "ch6-a-nd5"
  },
  {
    id: "chapter6-p75-right",
    title: "A1) The key 10.Qb3!",
    text: [
      "This move has some tricky ideas, but White has a clear route to an advantage.",
      "8.Qa4+ Bd7 9.Qxc4 Na6",
      "The key move, intending to exploit the slight vulnerability of the white pieces in the centre by means of ...Rc8 and perhaps ...Nc5.",
      "9...e5 10.Nb3 Bc6 is hardly an improvement. In Romanishin - Podlesnik, Ljubljana 1997, White should have played 11.Bg5 Be7 12.Nc3 Bxg2 13.Kxg2 Qc6+ 14.Qxc6+ Nxc6 15.Rfd1± when Black faces an unpleasant endgame.",
      "10.Qb3!",
      "This strong move enables White to solve his problems tactically while at the same time grabbing the initiative.",
      "10...Nb4",
      "10...Nc5 11.Qxb6 axb6 12.Nc3 leaves Black with an unpleasant endgame in view of his weaknesses on the queenside.",
      "11.a3 Bc5",
      "Other moves also fail to bring Black much relief: 11...Nbd5 12.Qxb6 axb6 13.e4± gives White a pleasant advantage."
    ].join("\n\n"),
    lineId: "ch6-a1-qb3"
  },
  {
    id: "chapter6-p76-left",
    title: "A1) 17.Rfc1N± with strong pressure",
    text: [
      "11...Qxd4 12.Be3 Qd6 13.axb4 Bc6 14.Bc5 Qb8 15.Bxf8 Rxf8 16.Bxc6+ bxc6 17.Rc1± gave White a big advantage in Swinkels - Van der Wiel, Groningen 2009.",
      "12.axb4 Bxd4 13.Na3 O-O",
      "14.e3!",
      "14.Nc4 was not so convincing in Razuvaev - Murey, London 1983.",
      "14...Bc5 15.Bd2 Be7 16.Nc4 Qc7",
      "Now in Atakisi - Hofstetter, email 2005, instead of putting the knight on a5 immediately, White should have first played:",
      "17.Rfc1N±",
      "With strong pressure."
    ].join("\n\n"),
    lineId: "ch6-a1-rfc1"
  },
  {
    id: "chapter6-p76-right",
    title: "A2) 7...Bc5 and 8.Qa4+!",
    text: [
      "A2) 7...Bc5",
      "This move looks natural, but White has a forcing route to an advantage.",
      "8.Qa4+! Qd7",
      "The alternative is: 8...Nbd7",
      "This is not covered in GM 1, but Aronian has used it twice against Gelfand, albeit at fast time controls.",
      "9.Qxc4 O-O 10.Nc3 a6",
      "10...Bb6?! 11.Nf3 Qc7 occurred in Schmidt - G. Szabo, Bucharest 2010, and now the simple 12.Qxc7N Bxc7 13.Rd1 a6 14.b3± leaves Black with an unpleasant defensive task.",
      "11.Rd1!",
      "After 11.Nb3 Ba7 12.Rd1 h6 Black eventually prevailed in Gelfand - Aronian,"
    ].join("\n\n"),
    lineId: "ch6-a2-a6"
  },
  {
    id: "chapter6-p77-left",
    title: "A2) Thematic knight sacrifice",
    text: [
      "Zurich (blitz) 2014, although White is still slightly better at this point.",
      "11...Qc7",
      "11...b5 12.Qd3 Ra7 13.Be3! is an important detail, when Black faces serious tactical problems. 13.Nc6 Qb6 14.Nxa7 Bxf2+ 15.Kh1 Qxa7 is less clear.",
      "12.b4 b5",
      "This occurred in Junge - F. Mueller, Germany 1995, and here White missed a strong idea:",
      "13.Ncxb5!N axb5 14.Qc2",
      "Black is in trouble, for instance: 14...Ra4 15.bxc5 Rc4 16.Qb1 Qxc5 17.Be3 Qh5 18.Bf3 Ng4 19.Bxg4 Qxg4 20.f3 Qh3 21.Nxb5± White emerges with an extra pawn.",
      "9.Nb5!",
      "The key move."
    ].join("\n\n"),
    lineId: "ch6-a2-sacrifice"
  },
  {
    id: "chapter6-p77-right",
    title: "A2) 9.Nb5! and 11.b4!",
    text: [
      "9...O-O",
      "9...a6? 10.Nc7+ was embarrassing for Black in Kiss - Gutdeutsch, Koszeg 1996.",
      "10.Qxc4 Qe7",
      "Clearly worse is 10...Bb6?! 11.N1c3 a6 12.Na3 Nc6. Now in Sandipan - Tari, Gibraltar 2014, the simple 13.Bg5N would have led to a clear advantage for White, for instance: 13...Na5 14.Qh4 Qd4 15.e4 h6 16.Be3 Qd8 17.Rfd1 Nd7 18.Qxd8 Bxd8 19.f4±.",
      "11.b4!",
      "The natural 11.N1c3?! gives Black an opportunity to solve his problems by means of 11...a6 12.Nd4 b5 13.Qd3 Bb7 with equal play.",
      "In GM 1 I recommended 11.N5c3 in order to prevent the above plan. However, to my great surprise I discovered 11...Nbd7!N 12.Qh4 Rb8, when I do not see how White can prevent ...b6 and ...Bb7.",
      "11...Bb6 12.a4",
      "White is playing with great energy and aggression.",
      "12...Bd7",
      "In the event of 12...a6 13.N5c3 Nc6 14.Ba3 Ne5 15.Qb3± White retains a lot of pressure."
    ].join("\n\n"),
    lineId: "ch6-a2-qe7"
  },
  {
    id: "chapter6-p78-left",
    title: "A2 conclusion and A3) 7...a6!?",
    text: [
      "13.a5 a6",
      "13...Bxf2+? was a surprising move for an elite player, and after 14.Kxf2 Rc8 15.Qd3 White was a healthy piece up in Gelfand - Aronian, Zurich (rapid) 2014.",
      "14.N5c3 Ba7 15.Bxb7 Bb5 16.Nxb5 Qxb7 17.Nxa7 Rxa7 18.Be3 Ra8 19.Rc1± White had a solid extra pawn in Postny - I. Sokolov, Sibenik 2012.",
      "A3) 7...a6!?",
      "This move remains relatively unexplored, but it is one of the more interesting options available to Black."
    ].join("\n\n"),
    lineId: "ch6-a3-start"
  },
  {
    id: "chapter6-p78-right",
    title: "A3) 8.Nc3!N and Black's critical 8...e5!N",
    text: [
      "8.Nc3!N",
      "This novelty from GM 1 remains untested, although it does briefly transpose to a game from 2009.",
      "8.Qa4+ Qd7! 9.Qxc4 b5 10.Qb3 Bb7 enables Black to neutralize the pressure along the h1-a8 diagonal and obtain a normal game. 11.Rd1N (11.Bxb7 Qxb7 12.a4 b4 13.Nd2 occurred in Scheeren - Van der Wiel, Hilversum 1984, and now the simple 13...Nbd7N 14.Nxc4 Nc5 would have been equal.) 11...Bxg2 12.Kxg2 Bc5 13.Qf3 Ra7 Black has good chances for equality.",
      "8...e5!N",
      "This seems like the only critical test. Other moves are clearly worse:",
      "The aforementioned game continued 8...Nbd7 9.Qa4 e5, and here White should have played:",
      "10.Nf3!N",
      "10.Nf5 Rb8 11.Rd1 b5 12.Qc2 occurred in Czaja - Wyczawska, Rewal 2009, and now 12...Qc7!N would have been unclear.",
      "10...Qc7 11.Bg5 White easily seizes the initiative, for instance: 11...Rb8 12.Bxf6 gxf6 13.Nd5 Qc6 14.Qa5!±.",
      "8...Be7N 9.Qa4+ Qd7. Also after 9...Nbd7 10.Qxc4 Nb6 11.Qd3 Black fails to solve his opening problems.",
      "10.Ndb5! Threatening a check on c7. Once again White should avoid"
    ].join("\n\n"),
    lineId: "ch6-a3-nbd7"
  },
  {
    id: "chapter6-p79-left",
    title: "A3) Regaining the pawn under favourable circumstances",
    text: [
      "10.Qxc4 b5 followed by ...Bb7.",
      "10...O-O 11.Rd1 Nd5 12.Bf4 White maintains a clear advantage, for example: 12...Nxc3 13.Nxc3 Qxa4 14.Nxa4 Nd7 15.Rac1±.",
      "8...Bc5N 9.Qa4+ Qd7 10.Be3!",
      "White regains the pawn under favourable circumstances.",
      "10.Ndb5 is less convincing here due to 10...O-O 11.Qxc4 Qe7 12.Nd4 b5! followed by ...Bb7.",
      "10...Qxa4 11.Nxa4 Ba7 12.Rfc1 O-O",
      "12...e5 13.Rxc4 O-O 14.Nc2± leaves White with strong pressure along the h1-a8 diagonal.",
      "13.Rxc4 Nd5 14.Bxd5",
      "14.Nf5!? also looks interesting.",
      "14...exd5 15.Rc7±"
    ].join("\n\n"),
    lineId: "ch6-a3-be3"
  },
  {
    id: "chapter6-p79-right",
    title: "A3) The queenless 9.Nc2! line",
    text: [
      "9.Nc2!",
      "9.Nf3 Qxd1 10.Rxd1 Nc6 11.Be3 Bf5 is less convincing.",
      "9...Qxd1 10.Rxd1 Nc6 11.Bg5 Be6 12.Ne3",
      "White's chances are slightly preferable in this endgame. Here are a few illustrative lines:",
      "12...Bc5",
      "12...Be7 13.Bxf6 gxf6 14.Ncd5±.",
      "13.Bxf6",
      "13.Rac1 is a serious alternative. 13...Bxe3 14.Bxe3 Rd8. After 14...O-O 15.Na4! White will regain the pawn in a favourable situation. This way Black holds on to his extra pawn, but after 15.Bc5 Rxd1+ 16.Rxd1 Nd7 17.Ba3 Kd8 18.Ne4± White has nice compensation.",
      "13...gxf6 14.Ned5 O-O-O",
      "14...Bxd5?! would be premature in view of 15.Rxd5 Bd4 16.e3 Bxc3 17.bxc3 Ke7 18.Rb1 Rab8 19.Rc5 and Black is under unpleasant pressure.",
      "15.Nxf6± White's position is more flexible and the knight on f6 rather restricts Black's forces."
    ].join("\n\n"),
    lineId: "ch6-a3-endgame"
  },
  {
    id: "chapter6-p80-left",
    title: "B) 6...Nc6 7.Qa4",
    text: [
      "B) 6...Nc6 7.Qa4",
      "7...cxd4",
      "Some other moves have been tried, but I do not regard any of them as serious options for Black, so I have just given a few examples of model play by White with brief accompanying notes.",
      "7...Nd7 8.dxc5 Bxc5 9.Qxc4 O-O 10.Nc3",
      "Such positions without c- and d-pawns, in which the black bishop remains stuck on c8, almost always favour White in the Catalan. One example continued:"
    ].join("\n\n"),
    lineId: "ch6-b-start"
  },
  {
    id: "chapter6-p80-right",
    title: "Model play against 7...Qb6 and 7...Qa5",
    text: [
      "10...a6 11.Rd1 Qb6 12.Ne4 Be7 13.b3 Nf6 14.Bb2 Nxe4 15.Qxe4± White had strong pressure in Bischoff - Sonntag, Germany 1987.",
      "7...Qb6 8.Na3!",
      "White immediately uses the placement of the black queen to win a tempo.",
      "8...cxd4 9.Nxc4 Qb4",
      "Otherwise the previous queen move would be absolutely senseless.",
      "10.Qxb4 Bxb4 11.a3 Be7 12.Rd1",
      "White will regain the pawn with a typical Catalan edge in the ensuing endgame.",
      "12...Nd5",
      "Trying somehow to neutralize White's pressure along the h1-a8 diagonal.",
      "13.Nxd4 Nxd4 14.Rxd4 Bd7 15.e4",
      "15.Ne3 Bf6 16.Rd3 was equally strong.",
      "15...Bc5",
      "The lesser evil was 15...Nb6 16.Nd6+ Bxd6 17.Rxd6 Rc8 18.b3, although White's bishop pair gives him a pleasant edge.",
      "16.Rd2 Nb6 17.Na5± Nesis - Galdanov, USSR 1975.",
      "A final alternative is: 7...Qa5 8.Qxc4 cxd4",
      "8...b5 9.Qc2 Nb4 has occurred in six games, but no one found the strongest reply: 10.Qd2!N. After 10.Qd1 Bb7 Black is all right. The main point can be seen in"
    ].join("\n\n"),
    lineId: "ch6-b-qb6"
  },
  {
    id: "chapter6-p81-left",
    title: "7...Qa5 and the transition to 8.Nxd4",
    text: [
      "the following line: 10...Bb7 11.dxc5 Bxc5 12.Qg5! Bf8 13.Bd2 h6 14.Qh4± Black is behind in development and his knight is in an awkward pin.",
      "9.Nxd4 Nxd4 10.Qxd4 Bc5",
      "This seems like the best attempt to justify Black's 7th move.",
      "11.Qc3! Bb4",
      "11...Qxc3 12.Nxc3 gives White a typical endgame initiative.",
      "12.Qb3 O-O 13.a3 Be7",
      "Now in Machelett - Poschke, Berlin 1993, White could have secured an advantage with: 14.Nc3N",
      "Black is under heavy pressure on the queenside.",
      "8.Nxd4 Qxd4"
    ].join("\n\n"),
    lineId: "ch6-b-qa5"
  },
  {
    id: "chapter6-p81-right",
    title: "9.Bxc6+ Bd7 and the exchange-sacrifice warning",
    text: [
      "Black should obviously avoid 8...Bd7?! 9.Nxc6 Qb6. After 9...bxc6 10.Rd1 Nd5 11.Qxc4 Be7, which occurred in the recent game Schlosser - Sochacki, Pardubice 2013, 12.e4N Nb6 13.Qc2 O-O 14.Bf4± would have given White an indisputable positional advantage. 10.Nd2 Bxc6 11.Bxc6+ Qxc6 12.Qxc6+ bxc6 13.Nxc4± gives White a pleasant endgame advantage, Rise - T. Olafsson, corr. 1995.",
      "9.Bxc6+ Bd7",
      "9...bxc6?! 10.Qxc6+ Qd7 11.Qxa8 Bc5",
      "I noticed this exchange sacrifice mentioned in one of the Dvoretsky books, where he evaluated it as an interesting idea. Indeed it looks so, but once you arm yourself with an engine things suddenly become shaky for Black!",
      "12.Be3! Bxe3 13.fxe3 O-O 14.Nc3 Qc7",
      "14...Ba6 15.Qf3 Bb7 16.e4 Qc7 was no better in Eslon - Gonzales, Coria del Rio 1995, in view of 17.Rad1N Qb6+ 18.Qf2, with an exact transposition to the main line below, with one less move played.",
      "14...Bb7 15.Qxa7 Qc6 16.Rf3 e5 17.Qa5 Qe6 18.Rd1! Bxf3 19.exf3± saw White return the exchange to secure his kingside while remaining a healthy pawn up in Ladanyi - D. Berczes, Budapest 2001.",
      "The text move occurred in Diaz Hollemaert - Aguiar, Blumenau 2013. Here White should have played:"
    ].join("\n\n"),
    lineId: "ch6-b-exchange-sac"
  },
  {
    id: "chapter6-p82-left",
    title: "15.Rad1N and 10.Rd1!",
    text: [
      "15.Rad1N",
      "With the following point: 15...Qb6 16.Qf3 Be7 17.Qf4 Qc6 18.e4 Qb6+ 19.Kf2 Qxb2 20.Qd4, with a clear advantage.",
      "10.Rd1",
      "This is the only way for White to fight for the advantage. We will analyse B1) 10...Bxc6 and B2) 10...Qxd1+.",
      "B1) 10...Bxc6 11.Qxc6+ bxc6 12.Rxd4",
      "This position has occurred in a lot of games, but it is obvious that Black is fighting for the draw, while White can press for a long time without taking any risks. Many moves have been tested, but the general ideas are the same, so I will just mention a few instructive lines."
    ].join("\n\n"),
    lineId: "ch6-b1-start"
  },
  {
    id: "chapter6-p82-right",
    title: "B1) The risk-free endgame pull",
    text: [
      "12...c5",
      "12...Be7 13.Rxc4 Kd7 14.Nd2 Nd5 occurred in Kessler - Farago, Triesen 2013, and now 15.e4N Nb6 16.Rc2 c5 17.Nf3 Rhc8 18.Be3± would have been pretty unpleasant for Black.",
      "12...Nd5 13.Rxc4 Kd7 14.e4 Nb6 15.Rc2 f5 was played in the recent game Krush - Zatonskih, Saint Louis 2014. Here the simple 16.Be3N fxe4 17.Nc3 would have brought White a clear positional advantage.",
      "13.Rxc4 Be7",
      "This is one of the more popular continuations, and has been played by Mamedyarov, but I like White's play in the following encounter.",
      "14.Bf4 O-O 15.Nd2 Nd7",
      "15...Nd5 16.Ne4 also leads to White's pleasant advantage.",
      "16.Nb3 a5 17.Rd1 Nb6",
      "This position occurred in Vladimirov - Ghaem Maghami, Kelamabakkam 2000, and here the most accurate continuation would have been:",
      "18.Rcc1N Rfc8 19.Nd2±",
      "Intending to put the knight on c4. Black is still a long way from a draw."
    ].join("\n\n"),
    lineId: "ch6-b1-endgame"
  },
  {
    id: "chapter6-p83-left",
    title: "B2) 10...Qxd1+ 11.Qxd1 Bxc6",
    text: [
      "B2) 10...Qxd1+ 11.Qxd1 Bxc6",
      "For the moment Black has full material equality for the queen, but the c4-pawn is rather weak.",
      "12.Nd2",
      "Now we will consider the somewhat dubious B21) 12...c3?! and the more reliable B22) 12...b5.",
      "12...h5?! 13.Nxc4 h4 14.Bf4! is clearly in White's favour: 14...hxg3. After 14...Rd8 15.Qb3 hxg3 16.Bxg3 Ne4 17.Ne5 Nxg3, which occurred in Vanheste - Blauert, Groningen 1989, 18.fxg3N Bc5+ 19.e3± leaves White ready to eliminate the light-squared bishop, after which the c6-pawn will become a target. 15.Bxg3 Ne4"
    ].join("\n\n"),
    lineId: "ch6-b2-h5"
  },
  {
    id: "chapter6-p83-right",
    title: "B21) 12...c3?!",
    text: [
      "16.Ne5! Nxg3 17.Nxc6! Nxe2+ 18.Qxe2 bxc6 19.Qa6 Bd6 20.Qxc6+ Ke7 21.Qb7+ Kf6 22.Qf3+ Ke7 23.Qb7+ Kf6 24.Qf3+ Ke7 25.h3. In Fahnenschmidt - Herbrechtsmeier, Germany 1986, White reached what I believe to be a technically winning position, in view of his potential to create a passed pawn on the queenside.",
      "B21) 12...c3?! 13.bxc3",
      "It looks tempting to damage White's structure, but now White does not have to spend time going after the c-pawn, and can instead activate his pieces and force favourable exchanges.",
      "13...Rd8",
      "13...O-O-O?! 14.Qb3 Bc5 15.Nf3 Ne4?! was too ambitious in Hjartarson - Hardarson, Neskaupsstadur 1984. At this point, the surprising 16.Ne5!N Bxf2+ 17.Kf1 would already have been winning for White.",
      "13...Be7?! 14.Qb3 Rd8. After 14...O-O 15.Ba3 White is also excellent. 15.Nf3 O-O 16.Ne5 was clearly better for White in V. Mikhalevski - Onischuk, Gibraltar 2011.",
      "13...Bc5 14.Nb3 Rd8 15.Qe1 Be7 was a bit more solid for Black in Nikolaidis - Bojkov, Istanbul 2001, but it gives White an"
    ].join("\n\n"),
    lineId: "ch6-b21-start"
  },
  {
    id: "chapter6-p84-left",
    title: "B21) Exchanging the dark-squared bishops",
    text: [
      "opportunity to exchange the dark-squared bishops: 16.Nd4! Bd5 17.a4 O-O 18.Ba3 Bxa3 19.Rxa3± White has a better version of the main variation B22 which will be analysed shortly.",
      "14.Qb3 Bc5",
      "Now in Wood - Micklethwaite, corr. 1993, White missed a simple yet strong idea:",
      "15.Nc4N Ne4",
      "15...Ng4? 16.Ba3! Bxf2+ 17.Kf1 is winning for White.",
      "16.Be3 Bxe3 17.Nxe3±",
      "The trade of dark-squared bishops obviously favours White.",
      "B22) 12...b5"
    ].join("\n\n"),
    lineId: "ch6-b21-bc5"
  },
  {
    id: "chapter6-p84-right",
    title: "B22) 12...b5 and the queenside target",
    text: [
      "13.a4 Be7",
      "It is impossible for Black to keep all of his queenside pawns, and he should not waste his time trying: 13...a6? 14.axb5 Bxb5. Even worse is 14...axb5? 15.Rxa8+ Bxa8 16.Nxc4!+- when the b-pawn will soon be lost as well. 15.Qc2 Rc8",
      "16.Rxa6! Without this finesse Black would be okay.",
      "16...Bxa6 17.Qa4+ Nd7 18.Qxa6 Rd8 19.Nxc4 Be7 20.Na5! Nb8 21.Qb5+ Kf8 22.Bf4+- Kochyev - Kilpi, Jyvaskyla 1996.",
      "14.axb5 Bxb5 15.Nxc4 O-O",
      "This position was tested several times in the mid-1980s but, even though White was having a hard time proving a clear advantage, it then disappeared for a couple of decades before making a comeback in more recent years. When the Dutch grandmaster Erwin L'Ami played it against me in the Bundesliga in 2008, I was forced to improvise."
    ].join("\n\n"),
    lineId: "ch6-b22-castled"
  },
  {
    id: "chapter6-p85-left",
    title: "B22) 16.Na3!? and 18.f3!",
    text: [
      "16.Na3!?",
      "This is what I came up with at the board, and home analysis has given me no reason to deviate from it.",
      "A well-known theoretical line is 16.b3 Rfd8 17.Qc2 Rdc8! 18.Ba3 Bxa3 19.Rxa3 Rc7 20.Ra5 Bxc4 21.bxc4 h6 and I do not see any real winning chances for White, as Black will soon trade his a-pawn for White's c-pawn.",
      "16...Rfd8 17.Qe1 Bc6",
      "17...Be8 occurred in Figura - Stern, Berlin 2009, but 18.Nc4N seems promising, for instance 18...Nd5 19.Bd2 Bb5 20.Ne5± and White continues to improve his position.",
      "18.f3!",
      "My game continued: 18.Bd2 Rab8 19.Bf4 Rxb2 20.Qc1 Rb3! Stronger than 20...Bxa3 21.Qxc6 Bf8 22.Rxa7 Rxe2 23.Bg5 when White has some initiative. 21.Qxc6 Rxa3 22.Rb1 Nd5 23.Be5 Ra2. After losing the last of the queenside pawns, White's winning chances were diminished in Avrukh - L'Ami, Germany 2008.",
      "The text move is my suggested improvement from GM 1, which has since been employed in one game, although the move order was slightly different. White's plan is to improve"
    ].join("\n\n"),
    lineId: "ch6-b22-f3"
  },
  {
    id: "chapter6-p85-right",
    title: "Opposite-coloured bishops favour White",
    text: [
      "his position on the kingside with moves like Kg2 and e2-e4, while avoiding unnecessary exchanges - especially of the last remaining queenside pawns. A useful point to keep in mind is that situations with opposite-coloured bishops will tend to favour White, as he will be able to attack the dark squares on the kingside. Black's position is pretty solid, but he is unable to do much other than sit and defend.",
      "18...Bc5+N 19.Kg2 Nd5 20.Bd2 threatens Rc1, and after 20...Bd4 21.e4 Nb6 22.Bc3 White keeps a nice edge.",
      "18...Rab8N",
      "I mainly focused on this move in GM 1.",
      "19.Kg2 h6",
      "19...Nd5 transposes to the main line.",
      "19...Rb7 20.Nc4 Bd5 21.Ne5 Rc8 22.e4 Rc2+ 23.Kh3. The king is surprisingly safe here! 23...Bb3 24.Be3 Rxb2 25.Bxa7!±.",
      "19...Rb3 20.Nc4 Bb5 21.Na5 Bb4 22.Qf1 Bxa5 23.Rxa5 a6 24.Ra3!± As mentioned earlier, the presence of opposite-coloured bishops gives White attacking chances."
    ].join("\n\n"),
    lineId: "ch6-b22-after-f3"
  },
  {
    id: "chapter6-p86-left",
    title: "The improved 20.Nc2!",
    text: [
      "Here I found an improvement over my analysis in GM 1.",
      "20.Nc2!",
      "Previously I gave: 20.Nc4 Bd5 21.Ne5. After 21.Ne3 Bb4 22.Qf1 Bc5 23.Nxd5 Nxd5 24.Kh3 Ne3=, Black is fine. 21...Bd6 22.Nd3 e5!? Trying to create counterplay. 23.e4. After 23.Rxa7?! e4 24.fxe4 Bxe4+ 25.Kf1 Ng4, White's king is too exposed. 23...Bc4 24.Nf2. Now instead of 24...a6, Black can play 24...Bb4! 25.Qe3 a5 when it is hard for White to improve his position.",
      "20...Rb7 21.e4±",
      "White will continue to improve his pieces, while retaining the all-important queenside pawn."
    ].join("\n\n"),
    lineId: "ch6-b22-rab8"
  },
  {
    id: "chapter6-p86-right",
    title: "Main line after 19.Kg2 Rab8 and conclusion",
    text: [
      "19.Kg2 Rab8 20.Nc4",
      "This is a suitable moment to jump with the knight.",
      "20...Bb5 21.b3 a6 22.Ba3 Bxc4",
      "My previous analysis concluded 22...Bf6 23.Rc1±.",
      "23.Bxe7 Nxe7N",
      "23...Re8? was an inexplicable mistake, and after 24.bxc4 Nxe7 25.Rxa6 White was obviously winning in Giemsa - Jahnz, Berlin 2009.",
      "24.bxc4 Rdc8 25.Qc3 Rc6 26.Rd1 Ng6 27.Rd4±",
      "This position can be compared with the drawish 16.b3 line as given in the notes above. The big differences here are that Black's knight is misplaced and White has real chances to create threats on the kingside.",
      "Conclusion",
      "5...c5 6.O-O remains an important branch of the Catalan. After 6...cxd4 7.Nxd4 White has good chances for an advantage based on his thematic pressure on the long diagonal, although it helps to be aware of a few important nuances in certain lines.",
      "The main line is 6...Nc6 7.Qa4, when this chapter dealt with the forcing option of 7...cxd4 8.Nxd4 Qxd4 9.Bxc6+ Bd7 10.Rd1, when Black must decide what type of position to defend. 10...Bxc6 leads to a slight, risk-free endgame advantage for White, while 10...Qxd1+ 11.Qxd1 Bxc6 12.Nd2 leads to an interesting situation with queen against pieces. With the ideas presented here, White has good chances to put his opponent under long-term pressure."
    ].join("\n\n"),
    lineId: "ch6-b22-rab8"
  }
];

type DiagramSpec = { id: string; sourceSpanId: string; role: string; lineId: string };
const diagramSpecs: DiagramSpec[] = [
  { id: "CH6-D01", sourceSpanId: "chapter6-p73-full", role: "Index position after 5...c5", lineId: "ch6-opening" },
  { id: "CH6-D02", sourceSpanId: "chapter6-p73-full", role: "A2 index: position before 13.Ncxb5!N", lineId: "ch6-a2-sacrifice" },
  { id: "CH6-D03", sourceSpanId: "chapter6-p73-full", role: "A3 index: position after 7...a6", lineId: "ch6-a3-start" },
  { id: "CH6-D04", sourceSpanId: "chapter6-p73-full", role: "B21 index: position before the bishop exchange", lineId: "ch6-b21-bc5" },
  { id: "CH6-D05", sourceSpanId: "chapter6-p74-left", role: "Chapter starting position after 5...c5", lineId: "ch6-opening" },
  { id: "CH6-D06", sourceSpanId: "chapter6-p74-right", role: "Position before the novelty 8.Nb5!N", lineId: "ch6-a-na6" },
  { id: "CH6-D07", sourceSpanId: "chapter6-p74-right", role: "Position before 10.N1c3!", lineId: "ch6-a-na6-main" },
  { id: "CH6-D08", sourceSpanId: "chapter6-p75-left", role: "The 7...Nd5?! line before 12.Nxd5", lineId: "ch6-a-nd5" },
  { id: "CH6-D09", sourceSpanId: "chapter6-p75-left", role: "A1 starting position after 7...Qb6", lineId: "ch6-a1-start" },
  { id: "CH6-D10", sourceSpanId: "chapter6-p75-right", role: "A1 position after the key 10.Qb3!", lineId: "ch6-a1-qb3" },
  { id: "CH6-D11", sourceSpanId: "chapter6-p76-left", role: "A1 position before 14.e3!", lineId: "ch6-a1-castled" },
  { id: "CH6-D12", sourceSpanId: "chapter6-p76-left", role: "A1 position before 17.Rfc1N±", lineId: "ch6-a1-before-rfc1" },
  { id: "CH6-D13", sourceSpanId: "chapter6-p76-right", role: "A2 starting position after 7...Bc5", lineId: "ch6-a2-start" },
  { id: "CH6-D14", sourceSpanId: "chapter6-p76-right", role: "A2 position before 11.Rd1!", lineId: "ch6-a2-a6" },
  { id: "CH6-D15", sourceSpanId: "chapter6-p77-left", role: "A2 position before 13.Ncxb5!N", lineId: "ch6-a2-sacrifice" },
  { id: "CH6-D16", sourceSpanId: "chapter6-p77-left", role: "A2 position after 8...Qd7", lineId: "ch6-a2-qd7" },
  { id: "CH6-D17", sourceSpanId: "chapter6-p77-right", role: "A2 position before the energetic 11.b4!", lineId: "ch6-a2-qe7" },
  { id: "CH6-D18", sourceSpanId: "chapter6-p78-left", role: "A2 position before 13.a5", lineId: "ch6-a2-before-a5" },
  { id: "CH6-D19", sourceSpanId: "chapter6-p78-left", role: "A3 starting position after 7...a6", lineId: "ch6-a3-start" },
  { id: "CH6-D20", sourceSpanId: "chapter6-p78-right", role: "A3 ...Nbd7 line before 10.Nf3!N", lineId: "ch6-a3-nbd7" },
  { id: "CH6-D21", sourceSpanId: "chapter6-p79-left", role: "A3 position after 10.Be3!", lineId: "ch6-a3-be3" },
  { id: "CH6-D22", sourceSpanId: "chapter6-p79-left", role: "A3 critical position after 8...e5!N", lineId: "ch6-a3-e5" },
  { id: "CH6-D23", sourceSpanId: "chapter6-p79-right", role: "A3 endgame before 13.Bxf6", lineId: "ch6-a3-endgame" },
  { id: "CH6-D24", sourceSpanId: "chapter6-p80-left", role: "B starting position after 7.Qa4", lineId: "ch6-b-start" },
  { id: "CH6-D25", sourceSpanId: "chapter6-p80-left", role: "B model position before 10...a6", lineId: "ch6-b-nbd7" },
  { id: "CH6-D26", sourceSpanId: "chapter6-p80-right", role: "B position after 12.Rd1", lineId: "ch6-b-qb6" },
  { id: "CH6-D27", sourceSpanId: "chapter6-p81-left", role: "The 7...Qa5 line before 11.Qc3!", lineId: "ch6-b-qa5" },
  { id: "CH6-D28", sourceSpanId: "chapter6-p81-left", role: "B forcing line after 7...cxd4", lineId: "ch6-b-cxd4" },
  { id: "CH6-D29", sourceSpanId: "chapter6-p81-right", role: "Exchange-sacrifice position before 12.Be3!", lineId: "ch6-b-exchange-sac" },
  { id: "CH6-D30", sourceSpanId: "chapter6-p82-left", role: "Engine-backed defence before 15.Rad1N", lineId: "ch6-b-exchange-defence" },
  { id: "CH6-D31", sourceSpanId: "chapter6-p82-left", role: "B1 position after 12.Rxd4", lineId: "ch6-b1-start" },
  { id: "CH6-D32", sourceSpanId: "chapter6-p82-right", role: "B1 risk-free endgame before 16.Nb3", lineId: "ch6-b1-endgame" },
  { id: "CH6-D33", sourceSpanId: "chapter6-p83-left", role: "B2 position after 11...Bxc6", lineId: "ch6-b2-start" },
  { id: "CH6-D34", sourceSpanId: "chapter6-p83-left", role: "B2 flank line before 16.Ne5!", lineId: "ch6-b2-h5" },
  { id: "CH6-D35", sourceSpanId: "chapter6-p83-right", role: "B21 position after 13.bxc3", lineId: "ch6-b21-start" },
  { id: "CH6-D36", sourceSpanId: "chapter6-p84-left", role: "B21 position before the favourable bishop exchange", lineId: "ch6-b21-bc5" },
  { id: "CH6-D37", sourceSpanId: "chapter6-p84-left", role: "B22 starting position after 12...b5", lineId: "ch6-b22-start" },
  { id: "CH6-D38", sourceSpanId: "chapter6-p84-right", role: "B22 tactical position before 16.Rxa6!", lineId: "ch6-b22-rxa6" },
  { id: "CH6-D39", sourceSpanId: "chapter6-p84-right", role: "B22 main endgame before 16.Na3!?", lineId: "ch6-b22-castled" },
  { id: "CH6-D40", sourceSpanId: "chapter6-p85-left", role: "B22 position before the improvement 18.f3!", lineId: "ch6-b22-f3" },
  { id: "CH6-D41", sourceSpanId: "chapter6-p85-right", role: "B22 improved setup after 18.f3!", lineId: "ch6-b22-after-f3" },
  { id: "CH6-D42", sourceSpanId: "chapter6-p86-left", role: "B22 position before 20.Nc2!", lineId: "ch6-b22-rab8" },
  { id: "CH6-D43", sourceSpanId: "chapter6-p86-left", role: "B22 main position after 18...Nd5", lineId: "ch6-b22-nd5" },
];

export const CHAPTER6_DIAGRAMS: DiagramLink[] = diagramSpecs.map((spec) => {
  const sourceLine = byId(spec.lineId);
  const moveIndex = sourceLine.moves.length - 1;
  const chess = new Chess(sourceLine.startFen);
  sourceLine.moves.slice(0, moveIndex + 1).forEach((move) => chess.move(move.san));
  return { id: spec.id, associationStatus: "source-verified", positionStatus: "deterministically derived", boardIdentityStatus: "source-verified", sourceSpanId: spec.sourceSpanId, crop: `/source/chapter6/crops/${spec.id}.png`, role: spec.role, lineId: spec.lineId, moveIndex, fen: chess.fen() };
});

const diagramIdsBySpan = new Map<string, string[]>();
for (const diagram of CHAPTER6_DIAGRAMS) diagramIdsBySpan.set(diagram.sourceSpanId, [...(diagramIdsBySpan.get(diagram.sourceSpanId) ?? []), diagram.id]);

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
    { id: `ch6-heading-${regionNumber}`, type: "heading", status: "source-verified", sourceSpanId: region.id, text: region.title, moveRefs: moveRefsInText(region.title, region.lineId, region.id) },
    {
      id: `ch6-line-${regionNumber}`,
      type: "variation",
      status: "source-verified",
      sourceSpanId: region.id,
      title: region.title,
      text: sourceText,
      lineId: region.lineId,
      moveRefs: moveRefsInText(sourceText, region.lineId, region.id),
    },
  ];
  for (const diagramId of diagramIdsBySpan.get(region.id) ?? []) regionBlocks.push({ id: `${diagramId.toLowerCase()}-block`, type: "diagram", status: "source-verified", sourceSpanId: region.id, diagramId });
  return regionBlocks;
});

export const CHAPTER6_LESSON: LessonDocument = {
  schemaVersion: 2,
  lessonId: "catalan.chapter6.complete",
  status: "source-verified",
  title: "Chapter 6 - Complete",
  subtitle: "The Catalan: 5...c5 with 6...cxd4 and the forcing 6...Nc6 line",
  source: { documentId: "catalan.chapter6", filename: "Chapter6_Catalan.pdf", sha256: SOURCE_HASH },
  basePosition: { status: "deterministically derived", after: "Initial position", fen: new Chess().fen(), moves: [] },
  sourceSpans,
  lines,
  diagrams: CHAPTER6_DIAGRAMS,
  blocks,
};

export const CHAPTER6_ANNOTATED_MOVE_IDS = CHAPTER6_LESSON.lines.flatMap((item) => item.moves).filter((move) => move.annotation).map((move) => move.id);
export const CHAPTER6_SECTIONS = [
  {
    id: "overview",
    label: "Overview",
    blockId: "ch6-heading-01"
  },
  {
    id: "a",
    label: "A) 6...cxd4",
    blockId: "ch6-heading-02"
  },
  {
    id: "a1",
    label: "A1) 7...Qb6",
    blockId: "ch6-heading-04"
  },
  {
    id: "a2",
    label: "A2) 7...Bc5",
    blockId: "ch6-heading-07"
  },
  {
    id: "a3",
    label: "A3) 7...a6",
    blockId: "ch6-heading-11"
  },
  {
    id: "b",
    label: "B) 6...Nc6",
    blockId: "ch6-heading-16"
  },
  {
    id: "b1",
    label: "B1) 10...Bxc6",
    blockId: "ch6-heading-20"
  },
  {
    id: "b2",
    label: "B2) 10...Qxd1+",
    blockId: "ch6-heading-22"
  },
  {
    id: "conclusion",
    label: "Conclusion",
    blockId: "ch6-heading-27"
  }
];
