import { Chess } from "chess.js";
import type { DiagramLink, LessonBlock, LessonDocument, MoveAnnotation, MoveReference, SourceSpan, VariationMove, VariationNode } from "./lesson-model";

const SOURCE_HASH = "8191475E0B1E5E3B65B1B39EFDA4DB03C87072A8A199B38254FE18E1DD8098C1";
const P24 = "chapter2-p24-full";
const spanId = (page: number, column: "left" | "right") => `chapter2-p${page}-${column}`;

type MoveSpec = string | readonly [san: string, sourceToken: string];

function annotationFor(san: string, sourceToken: string): MoveAnnotation | undefined {
  const suffix = sourceToken.startsWith(san) ? sourceToken.slice(san.length) : sourceToken.replace(san, "");
  const punctuation = suffix.match(/[!?]+/)?.[0];
  const novelty = suffix.includes("N") ? "N" : undefined;
  const evaluation = suffix.match(/\+\-|±|∞|=/)?.[0];
  return punctuation || novelty || evaluation ? { punctuation, novelty, evaluation } : undefined;
}

function fenAfter(moves: string[]): string {
  const chess = new Chess();
  moves.forEach((move) => chess.move(move));
  return chess.fen();
}

function line(id: string, label: string, setup: string[], specs: MoveSpec[], sourceSpanId: string): VariationNode {
  const startFen = fenAfter(setup);
  const chess = new Chess(startFen);
  const moves: VariationMove[] = specs.map((spec, index) => {
    const [san, sourceToken] = typeof spec === "string" ? [spec, spec] : spec;
    try { chess.move(san); }
    catch { throw new Error(`${id}: invalid canonical move ${san} at source ply ${index + 1}`); }
    const annotation = annotationFor(san, sourceToken);
    return { id: `${id}-${String(index + 1).padStart(2, "0")}`, san, sourceToken, sourceSpanId, ...(annotation ? { annotation } : {}) };
  });
  return { id, label, parentLineId: null, parentPly: 0, startFen, startLabel: `Position before ${label}`, moves };
}

const OPEN_5BD7 = ["d4", "Nf6", "c4", "e6", "g3", "d5", "Nf3", "dxc4", "Bg2", "Bd7"];
const OPEN_8OO = [...OPEN_5BD7, "Ne5", "Bc6", "Nxc6", "Nxc6", "O-O"];
const C_BASE = [...OPEN_8OO, "Qd7", "e3"];

const lines: VariationNode[] = [
  line("ch2-opening", "Chapter 2 starting line", [], OPEN_8OO, spanId(25, "left")),
  line("ch2-early-nc6", "The dubious 6...Nc6", [...OPEN_5BD7, "Ne5"], ["Nc6", "Nxc4", "Bb4+", "Nc3", "Nd5", "Qd3", "Qf6", "e3", "Qg6", "Be4", "Qh5", ["O-O", "O-ON"], "O-O", "a3", "Be7", "Bg2"], spanId(25, "left")),
  line("ch2-early-nd5", "The quieter 7...Nd5", [...OPEN_5BD7, "Ne5", "Nc6", "Nxc4"], ["Nd5", "O-O", "Nb6", ["b3", "b3N"], "Be7", "Nc3", "O-O", "Bb2"], spanId(25, "left")),
  line("ch2-razuvaev", "Razuvaev's 9.O-O!?", [...OPEN_5BD7, "Ne5", "Nc6", "Nxc4", "Bb4+", "Nc3", "Nd5"], [["O-O", "O-O!?"], "Nxc3", "bxc3", "Bxc3", "Rb1"], spanId(25, "left")),
  line("ch2-razuvaev-worse", "The inferior 9...Bxc3", [...OPEN_5BD7, "Ne5", "Nc6", "Nxc4", "Bb4+", "Nc3", "Nd5", "O-O"], ["Bxc3", "bxc3", "Nxc3", "Qd3", "Nxd4", ["Re1", "Re1!"], "Ndxe2+", "Rxe2", "Nxe2+", "Qxe2", "O-O", "Ba3", "Re8", "Rd1", "Qc8", "Na5", "c6", ["Nc4", "Nc4!+-"]], spanId(25, "right")),
  line("ch2-early-a3", "The unnecessary 10.a3?!", [...OPEN_5BD7, "Ne5", "Nc6", "Nxc4", "Bb4+", "Nc3", "Nd5", "Qd3", "Qf6"], [["a3", "a3?!"], "Nxd4", "axb4", "Nxb4", "Qb1", "Nbc2+", "Kf1", "Nxa1", "Qxa1", ["Nb3", "Nb3∞"]], spanId(25, "right")),
  line("ch2-early-e4", "The additional 11.e4 option", [...OPEN_5BD7, "Ne5", "Nc6", "Nxc4", "Bb4+", "Nc3", "Nd5", "Qd3", "Qf6", "e3", "Qg6"], ["e4"], spanId(25, "right")),
  line("ch2-nxd4", "8...Nxd4?!", OPEN_8OO, [["Nxd4", "Nxd4?!"], "Bxb7", "Rb8", "Bg2", "Qd7", "e3", "Nf5", "Qc2", "Qb5", "Nd2", "Nd6", "b3", ["cxb3", "cxb3?"], ["Bc6+", "Bc6+N"], "Kd8", "axb3"], spanId(25, "right")),
  line("ch2-nxd4-c5", "The 10...Bc5 sideline", [...OPEN_8OO, "Nxd4", "Bxb7", "Rb8", "Bg2"], ["Bc5", "Nd2", "c3", "bxc3", "Nb5", "Qc2"], spanId(26, "left")),
  line("ch2-nxd4-lesser", "The lesser evil 14...Be7", [...OPEN_8OO, "Nxd4", "Bxb7", "Rb8", "Bg2", "Qd7", "e3", "Nf5", "Qc2", "Qb5", "Nd2", "Nd6", "b3"], ["Be7", "bxc4", "Qa6", "c5", "Nf5", "Nb3", "O-O", "Rd1"], spanId(26, "left")),

  line("ch2-a-main", "A) 8...Be7 main line", OPEN_8OO, ["Be7", "Qa4", "O-O", "e3", "e5", ["Rd1", "Rd1!"], "exd4", "Bxc6", "bxc6", "Rxd4", "Qe8", "Rxc4", "c5", "Qxe8", "Rfxe8", "Kf1", "Red8", "Ke2", "Nd7", "Rc2", "Ne5", "Na3", "Rab8", "Bd2"], spanId(26, "left")),
  line("ch2-a-e3", "The unclear 9.e3", [...OPEN_8OO, "Be7"], ["e3", ["e5", "e5!"], "Bxc6+", "bxc6", "dxe5", "Qxd1", "Rxd1", "Ng4", "f4", "Bc5"], spanId(26, "right")),
  line("ch2-a-qd7", "Black's quiet 9...Qd7", [...OPEN_8OO, "Be7", "Qa4"], ["Qd7", "Rd1", "O-O", "Nc3", "Rfd8", "Qxc4"], spanId(26, "right")),
  line("ch2-a-long-castle", "Refuting 10...O-O-O", [...OPEN_8OO, "Be7", "Qa4", "Qd7", "Rd1"], ["O-O-O", "Nc3", "Nd5", "Qxc4", "Nb6", ["Qb5", "Qb5!"], "Nxd4", "Qa5", "Kb8", "e3", "Ne2+", "Kf1", "Nd5", "Nxd5", "Nxc1", "Raxc1", "exd5", "Rxd5", "Bd6", "Rb5", "b6", "Qa6", "Qc8", "Rxb6+"], spanId(26, "right")),
  line("ch2-a-nb4", "The 10...Nb4 option", [...OPEN_8OO, "Be7", "Qa4", "Qd7", "Rd1"], ["Nb4", "Qxd7+", "Nxd7", "Na3"], spanId(26, "right")),
  line("ch2-a-qc8", "The 11...Qc8 branch", [...OPEN_8OO, "Be7", "Qa4", "O-O", "e3", "e5", "Rd1"], ["Qc8", "Qxc4", "exd4", "exd4", "Bd6", "Nc3"], spanId(27, "left")),
  line("ch2-a-qxc4", "The solid 12.Qxc4", [...OPEN_8OO, "Be7", "Qa4", "O-O", "e3", "e5", "Rd1", "exd4"], ["Qxc4", ["Nd7", "Nd7!"], "exd4", "Nb6", "Kf1", ["Nb4", "Nb4!"], "Nc3", "c6", "a3", "N4d5", "Qd3", "Re8", "Bd2", "Qd7"], spanId(27, "left")),
  line("ch2-a-e5-nb4", "The 10...Nb4 alternative", [...OPEN_8OO, "Be7", "Qa4", "O-O", "e3"], ["Nb4", "a3", "Nbd5", "Qxc4"], spanId(27, "left")),
  line("ch2-a-e5-a6", "The 10...a6 alternative", [...OPEN_8OO, "Be7", "Qa4", "O-O", "e3"], ["a6", "Qxc4"], spanId(27, "left")),
  line("ch2-a-rd1-dxe5", "The 11.dxe5 alternative", [...OPEN_8OO, "Be7", "Qa4", "O-O", "e3", "e5"], ["dxe5", "Nxe5", "Bxb7", "Rb8", "Bg2", "Qd7"], spanId(27, "left")),
  line("ch2-a-rd1-bxc6", "The 11.Bxc6 alternative", [...OPEN_8OO, "Be7", "Qa4", "O-O", "e3", "e5"], ["Bxc6", "bxc6", "dxe5", "Ng4"], spanId(27, "left")),
  line("ch2-a-nd7", "The 13...Nd7 alternative", [...OPEN_8OO, "Be7", "Qa4", "O-O", "e3", "e5", "Rd1", "exd4", "Bxc6", "bxc6", "Rxd4"], ["Nd7", "Qxc6", "Ne5", "Qe4", "Bd6", "Nd2", "Re8", "Qg2"], spanId(27, "right")),
  line("ch2-a-bd6", "The 13...Bd6 alternative", [...OPEN_8OO, "Be7", "Qa4", "O-O", "e3", "e5", "Rd1", "exd4", "Bxc6", "bxc6", "Rxd4"], ["Bd6", "Qxc6", "Qe7", "Nd2"], spanId(27, "right")),

  line("ch2-b-main", "B) 8...Nd5!? main line", OPEN_8OO, [["Nd5", "Nd5!?"], "Qa4", "Qd6", "Qxc4", "Qb4", ["Qxb4", "Qxb4N"], "Ndxb4", "Nc3", "Nxd4", "Bxb7", "Rb8", "Be4", "f5", ["Be3", "Be3!"], "Nxe2+", "Nxe2", "fxe4", "Nc3", "Nd5", ["Bd4", "Bd4!"], "Nf6", "Rfe1", "Rb4", ["Re3", "Re3!"]], spanId(27, "right")),
  line("ch2-b-qd7", "The 9...Qd7 alternative", [...OPEN_8OO, "Nd5", "Qa4"], ["Qd7", "Qxc4", "Nb6", "Qd3", "O-O-O", ["Qf3", "Qf3!"],], spanId(28, "left")),
  line("ch2-b-nb6", "The 9...Nb6 alternative", [...OPEN_8OO, "Nd5", "Qa4"], ["Nb6", "Bxc6+", "bxc6", "Qxc6+", "Qd7", "Qxd7+", "Kxd7", "e4"], spanId(28, "left")),
  line("ch2-b-nb6-queen", "Keeping the queens on", [...OPEN_8OO, "Nd5", "Qa4", "Nb6", "Bxc6+", "bxc6", "Qxc6+", "Qd7"], ["Qf3", "Be7", "Nc3", "O-O", "Rd1+"], spanId(28, "left")),
  line("ch2-b-nc2", "The 12...Nc2 sideline", [...OPEN_8OO, "Nd5", "Qa4", "Qd6", "Qxc4", "Qb4", "Qxb4", "Ndxb4", "Nc3"], ["Nc2", ["d5", "d5!"], "exd5", "Rb1", "O-O-O", "Bxd5"], spanId(28, "right")),
  line("ch2-b-fxe4", "The inferior 15...fxe4?!", [...OPEN_8OO, "Nd5", "Qa4", "Qd6", "Qxc4", "Qb4", "Qxb4", "Ndxb4", "Nc3", "Nxd4", "Bxb7", "Rb8", "Be4", "f5", "Be3"], [["fxe4", "fxe4?!"], "Bxd4", "Nc6", "Be3", "Rxb2", "Rab1"], spanId(28, "right")),
  line("ch2-b-bc5", "The 15...Bc5 alternative", [...OPEN_8OO, "Nd5", "Qa4", "Qd6", "Qxc4", "Qb4", "Qxb4", "Ndxb4", "Nc3", "Nxd4", "Bxb7", "Rb8", "Be4", "f5", "Be3"], ["Bc5", ["Bb1", "Bb1!"], "O-O", "Rd1", "Rfd8", "Kg2", "Nbc6", "Bd3"], spanId(28, "right")),

  line("ch2-c-main", "C) 8...Qd7", OPEN_8OO, ["Qd7", "e3"], spanId(29, "left")),
  line("ch2-c-old-theory", "The old 9.Nc3 theory", [...OPEN_8OO, "Qd7"], ["Nc3", ["Nxd4", "Nxd4!"], "Bxb7", "Rb8", "Bg2", "Be7", "e3", ["Nb5", "Nb5!"]], spanId(29, "left")),
  line("ch2-c-e5", "The 9...e5 line", C_BASE, ["e5", "dxe5", "Nxe5", "Bxb7", "Rb8", "Bg2", "Qxd1", "Rxd1", "Bd6", ["f4", "f4N"], "Nd3"], spanId(29, "right")),
  line("ch2-c-e5-bc5", "Black's 12...Bc5", [...C_BASE, "e5", "dxe5", "Nxe5", "Bxb7", "Rb8", "Bg2"], ["Bc5", ["b3", "b3!?"], "O-O", "Bb2", "Rfd8", "Qxd7", "Nfxd7", "Nd2", "cxb3", "axb3", "Nd3", "Bc3"], spanId(29, "right")),
  line("ch2-c-e5-ned7", "The 14...Ned7 branch", [...C_BASE, "e5", "dxe5", "Nxe5", "Bxb7", "Rb8", "Bg2", "Qxd1", "Rxd1", "Bd6", "f4"], ["Ned7", ["Bf3", "Bf3!"], "Nc5", "Nd2"], spanId(29, "right")),
  line("ch2-c-nd5", "Meeting 9...Nd5", C_BASE, ["Nd5", ["Nd2", "Nd2!"], "h5", "Nxc4", "h4", "e4", "Nb6", ["Nxb6", "Nxb6N"], "axb6", "Be3", "O-O-O", "Qa4", "Kb8", "Rfd1", "hxg3", "hxg3", "Be7", "Rac1", "Bf6", "d5", "Ne5", "Qb3"], spanId(29, "right")),
  line("ch2-c-na5", "The correspondence 10...Na5", [...C_BASE, "Nd5", "Nd2"], ["Na5", "Qe2", "Qb5", "Nf3", "c6", "e4", "Nf6", "Rd1", "c3", "Qc2", "cxb2", "Bxb2", ["Qc4", "Qc4"], ["Qb1", "Qb1!"]], spanId(29, "right")),

  line("ch2-c1-main", "C1) 9...Rb8", C_BASE, ["Rb8", "Qe2", "b5", "b3", "cxb3", "axb3", "Rb6", "Rd1", "a6", "Nc3", "Be7", ["d5", "d5N"], "exd5", "Nxd5", "Nfxd5", "Bxd5"], spanId(30, "left")),
  line("ch2-c1-na5", "The mistaken 11...Na5?!", [...C_BASE, "Rb8", "Qe2", "b5", "b3"], [["Na5", "Na5?!"], "Bd2", "b4", "bxc4"], spanId(30, "left")),
  line("ch2-c1-bb4", "The active 12...Bb4", [...C_BASE, "Rb8", "Qe2", "b5", "b3", "cxb3", "axb3"], ["Bb4", "Ra6", "Nd5", "Bb2", "Rb6", "Rxb6", "axb6", "Qxb5", "Na5", "Qd3", "O-O", "e4", "Nf6", "Rd1"], spanId(30, "left")),
  line("ch2-c1-bb4-castle", "The 13...Bb4 and 14...O-O line", [...C_BASE, "Rb8", "Qe2", "b5", "b3", "cxb3", "axb3", "Rb6", "Rd1"], ["Bb4", "Bb2", "O-O", ["d5", "d5!"], "exd5", "Bxf6", "gxf6", "Bxd5", "Qe6", ["Qc2", "Qc2N"], "Ne5", "Rxa7"], spanId(30, "right")),
  line("ch2-c1-finish-line", "The source continuation after 17.Bxd5", [...C_BASE, "Rb8", "Qe2", "b5", "b3", "cxb3", "axb3", "Rb6", "Rd1", "a6", "Nc3", "Be7", "d5", "exd5", "Nxd5", "Nfxd5", "Bxd5"], ["Bf6", ["Bf3", "Bf3?!"], "Qe6", "Bg4", "Qe7", "Bd7+", "Kf8", "Ba3", "b4", "Bb2", "Bxb2", "Qxb2"], spanId(31, "left")),

  line("ch2-c2-main", "C2) 9...O-O-O main line", C_BASE, ["O-O-O", "Qa4", "Nd5", "Qxc4", "h5", "Bd2", "h4", "Rfc1", "hxg3", "hxg3", "f5", ["b4", "b4!"], "Bd6", "b5", "Nce7", "Nc3", "Kb8", "a4", "Rh5", "a5", "Rdh8", ["a6", "a6!N"], "b6", "e4", "Nxc3", "Rxc3", "fxe4", "Re3", "Rxb5", "Rxe4"], spanId(31, "left")),
  line("ch2-c2-h5", "The early 10...h5", [...C_BASE, "O-O-O", "Qa4"], ["h5", "Nd2", "Nd5", "Nxc4", "h4", "Bd2", "Kb8", "Rfc1", "f5", ["b4", "b4!"], "Bd6", "b5", "Nce7", ["Qb3", "Qb3N"], "Ng8", "a4", "Ngf6", "a5", "hxg3", "hxg3", "g5", "b6", "cxb6", ["Nxb6", "Nxb6!"]], spanId(31, "right")),
  line("ch2-c2-h5-unclear", "The 11.Bxc6 queen trade", [...C_BASE, "O-O-O", "Qa4", "h5"], ["Bxc6", "Qxc6", "Qxc6", "bxc6", "Nd2", "h4", "Nxc4", "Bd6", "Kg2", "Rh5", "Bd2", "Rdh8"], spanId(31, "right")),
  line("ch2-c2-premature", "The premature 13.b4", [...C_BASE, "O-O-O", "Qa4", "Nd5", "Qxc4", "h5", "Bd2", "h4"], ["b4", ["Ncxb4", "Ncxb4!"], "Bxb4", "Bxb4", "e4", ["Nf4", "Nf4!"], "gxf4", "Qxd4", "Qxd4", "Rxd4"], spanId(32, "left")),
  line("ch2-c2-premature-bxd5", "The 15.Bxd5? branch", [...C_BASE, "O-O-O", "Qa4", "Nd5", "Qxc4", "h5", "Bd2", "h4", "b4", "Ncxb4", "Bxb4", "Bxb4"], [["Bxd5", "Bxd5?"], "Qxd5", "Qxb4", "hxg3"], spanId(32, "left")),
  line("ch2-c2-critical", "The critical 15...Ncxb4", [...C_BASE, "O-O-O", "Qa4", "Nd5", "Qxc4", "h5", "Bd2", "h4", "Rfc1", "hxg3", "hxg3", "f5", "b4"], ["Ncxb4", "a3", "Nc6", "Nc3", "Kb8", "Qb3", "Nb6", "Ne2", "e5", ["Rxc6", "Rxc6!"], "bxc6", "a4", "e4", "a5", "Rh6", "axb6", "cxb6", ["f3", "f3!"], "exf3", "Bxf3", "g5", "Bg2"], spanId(32, "right")),
  line("ch2-c2-bxb4", "Declining the queenside sacrifice", [...C_BASE, "O-O-O", "Qa4", "Nd5", "Qxc4", "h5", "Bd2", "h4", "Rfc1", "hxg3", "hxg3", "f5", "b4"], ["Bxb4", "Bxb4", "Ncxb4", "Nd2"], spanId(32, "right")),
  line("ch2-c2-nxc3", "Black's 17...Nxc3 resource", [...C_BASE, "O-O-O", "Qa4", "Nd5", "Qxc4", "h5", "Bd2", "h4", "Rfc1", "hxg3", "hxg3", "f5", "b4", "Bd6", "b5", "Nce7", "Nc3"], ["Nxc3", "Rxc3", "Nd5", "Rb3", "g5", ["e4", "e4!"], "fxe4", "Re1", "Rh5", "Bxe4", "Rdh8", "Qe2"], spanId(33, "left")),
];

const byId = (id: string) => {
  const found = lines.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`Missing Chapter 2 line ${id}`);
  return found;
};

const refs = (lineId: string, sources?: string[]): MoveReference[] => {
  const sourceLine = byId(lineId);
  return (sources ?? sourceLine.moves.map((move) => move.sourceToken)).map((source, moveIndex) => ({ source, lineId, moveIndex }));
};

const selected = (lineId: string, pairs: Array<readonly [source: string, moveIndex: number]>): MoveReference[] => pairs.map(([source, moveIndex]) => ({ source, lineId, moveIndex }));

const sourceSpans: SourceSpan[] = [
  { id: P24, status: "source-verified", pageIndex: 0, printedPage: 24, column: "full", order: 1, crop: "/source/chapter2/pages/printed-24.png", bbox: { x0: 0, top: 0, x1: 474.96, bottom: 676.08 } },
  ...Array.from({ length: 9 }, (_, index) => (["left", "right"] as const).map((column, offset) => ({
    id: spanId(25 + index, column), status: "source-verified" as const, pageIndex: index + 1, printedPage: 25 + index, column, order: 2 + index * 2 + offset,
    crop: `/source/chapter2/pages/printed-${String(25 + index).padStart(2, "0")}.png`,
    bbox: { x0: column === "left" ? 35 : 237, top: 50, x1: column === "left" ? 237 : 440, bottom: 640 },
  }))).flat(),
];

const prose = (id: string, sourceSpanId: string, text: string, moveRefs?: MoveReference[]): LessonBlock => ({ id, type: "prose", status: "source-verified", sourceSpanId, text, ...(moveRefs ? { moveRefs } : {}) });
const heading = (id: string, sourceSpanId: string, text: string, moveRefs?: MoveReference[]): LessonBlock => ({ id, type: "heading", status: "source-verified", sourceSpanId, text, ...(moveRefs ? { moveRefs } : {}) });
const sequence = (id: string, sourceSpanId: string, text: string, moveRefs: MoveReference[]): LessonBlock => ({ id, type: "move-sequence", status: "source-verified", sourceSpanId, text, moveRefs });
const variation = (id: string, sourceSpanId: string, title: string, text: string, lineId: string, moveRefs: MoveReference[], diagramId?: string): LessonBlock => ({ id, type: "variation", status: "source-verified", sourceSpanId, title, text, lineId, moveRefs, ...(diagramId ? { diagramId } : {}) });
const diagramBlock = (id: string, sourceSpanId: string, diagramId: string): LessonBlock => ({ id, type: "diagram", status: "source-verified", sourceSpanId, diagramId });

const blocks: LessonBlock[] = [
  heading("ch2-index-heading", P24, "Chapter 2 - Catalan · 4...dxc4 and 5...Bd7", selected("ch2-opening", [["4...dxc4", 7], ["5...Bd7", 9]])),
  prose("ch2-index", P24, "Variation Index: 1.d4 Nf6 2.c4 e6 3.g3 d5 4.Nf3 dxc4 5.Bg2 Bd7 6.Ne5 Bc6 7.Nxc6 Nxc6 8.O-O. A) 8...Be7, B) 8...Nd5!?, C) 8...Qd7 9.e3, C1) 9...Rb8 and C2) 9...O-O-O.", [
    ...selected("ch2-opening", [["1.d4", 0], ["Nf6", 1], ["2.c4", 2], ["e6", 3], ["3.g3", 4], ["d5", 5], ["4.Nf3", 6], ["dxc4", 7], ["5.Bg2", 8], ["Bd7", 9], ["6.Ne5", 10], ["Bc6", 11], ["7.Nxc6", 12], ["Nxc6", 13], ["8.O-O", 14]]),
    ...selected("ch2-a-main", [["8...Be7", 0]]), ...selected("ch2-b-main", [["8...Nd5!?", 0]]), ...selected("ch2-c-main", [["8...Qd7", 0], ["9.e3", 1]]),
    ...selected("ch2-c1-main", [["9...Rb8", 0]]), ...selected("ch2-c2-main", [["9...O-O-O", 0]]),
  ]),
  diagramBlock("ch2-d01-block", P24, "CH2-D01"), diagramBlock("ch2-d02-block", P24, "CH2-D02"), diagramBlock("ch2-d03-block", P24, "CH2-D03"), diagramBlock("ch2-d04-block", P24, "CH2-D04"),

  sequence("ch2-opening-sequence", spanId(25, "left"), "1.d4 Nf6 2.c4 e6 3.g3 d5 4.Nf3 dxc4 5.Bg2 Bd7", selected("ch2-opening", [["1.d4", 0], ["Nf6", 1], ["2.c4", 2], ["e6", 3], ["3.g3", 4], ["d5", 5], ["4.Nf3", 6], ["dxc4", 7], ["5.Bg2", 8], ["Bd7", 9]])),
  diagramBlock("ch2-d05-block", spanId(25, "left"), "CH2-D05"),
  prose("ch2-intro", spanId(25, "left"), "I am quite surprised that this move remains fashionable. I assume that Black is excited at the prospect of queenside castling in the Catalan - and this is probably the only line where he can realize his dream!"),
  sequence("ch2-sixth", spanId(25, "left"), "6.Ne5", selected("ch2-opening", [["6.Ne5", 10]])),
  prose("ch2-sixth-note", spanId(25, "left"), "Definitely the most challenging move."),
  sequence("ch2-sixth-bc6", spanId(25, "left"), "6...Bc6", selected("ch2-opening", [["6...Bc6", 11]])),
  prose("ch2-sixth-bc6-note", spanId(25, "left"), "The most popular continuation and a logical follow-up to Black's previous move."),
  variation("ch2-early-nc6-block", spanId(25, "left"), "Putting the other piece on c6 looks rather dubious", "6...Nc6 7.Nxc4", "ch2-early-nc6", selected("ch2-early-nc6", [["6...Nc6", 0], ["7.Nxc4", 1]])),
  prose("ch2-early-nc6-note", spanId(25, "left"), "Black's light-squared bishop remains passive on d7."),
  sequence("ch2-early-bb4", spanId(25, "left"), "7...Bb4+", selected("ch2-early-nc6", [["7...Bb4+", 2]])),
  variation("ch2-early-nd5-block", spanId(25, "left"), "Another line: 7...Nd5", "7...Nd5 8.O-O Nb6 occurred in Babik - Husson, Stockerau 1991. The simple 9.b3N Be7 10.Nc3 O-O 11.Bb2 leads to a clear advantage for White.", "ch2-early-nd5", refs("ch2-early-nd5")),
  sequence("ch2-early-main-qd3", spanId(25, "left"), "8.Nc3 Nd5 9.Qd3", selected("ch2-early-nc6", [["8.Nc3", 3], ["Nd5", 4], ["9.Qd3", 5]])),
  prose("ch2-razuvaev-intro", spanId(25, "left"), "Razuvaev's recommendation from Chess Informant 57 also looks very attractive:"),
  sequence("ch2-razuvaev-start", spanId(25, "left"), "9.O-O!? Nxc3", selected("ch2-razuvaev", [["9.O-O!?", 0], ["Nxc3", 1]])),
  prose("ch2-razuvaev-worse-intro", spanId(25, "left"), "Much worse is 9...Bxc3:" , selected("ch2-razuvaev-worse", [["9...Bxc3", 0]])),

  variation("ch2-razuvaev-worse-block", spanId(25, "right"), "Much worse for Black", "9...Bxc3 10.bxc3 Nxc3 11.Qd3. White dominates with his bishop pair, while Black cannot even grab the d4-pawn: 11...Nxd4 12.Re1! Ndxe2+ 13.Rxe2 Nxe2+ 14.Qxe2 O-O 15.Ba3 Re8 16.Rd1 Qc8 17.Na5 c6 18.Nc4!+-.", "ch2-razuvaev-worse", refs("ch2-razuvaev-worse")),
  sequence("ch2-razuvaev-finish", spanId(25, "right"), "10.bxc3 Bxc3 11.Rb1∞", selected("ch2-razuvaev", [["10.bxc3", 2], ["Bxc3", 3], ["11.Rb1∞", 4]])),
  sequence("ch2-early-qf6", spanId(25, "right"), "9...Qf6 10.e3", selected("ch2-early-nc6", [["9...Qf6", 6], ["10.e3", 7]])),
  prose("ch2-early-a3-intro", spanId(25, "right"), "There is no point for White to enter the complications arising after:"),
  variation("ch2-early-a3-block", spanId(25, "right"), "Avoiding unnecessary complications", "10.a3?! Nxd4 11.axb4 Nxb4 12.Qb1 Nbc2+ 13.Kf1 Nxa1 14.Qxa1 Nb3∞ gives mutual chances, so White should keep control instead.", "ch2-early-a3", refs("ch2-early-a3")),
  sequence("ch2-early-qg6", spanId(25, "right"), "10...Qg6 11.Be4", selected("ch2-early-nc6", [["10...Qg6", 8], ["11.Be4", 9]])),
  prose("ch2-early-e4-note", spanId(25, "right"), "11.e4 is another strong possibility.", selected("ch2-early-e4", [["11.e4", 0]])),
  sequence("ch2-early-qh5", spanId(25, "right"), "11...Qh5", selected("ch2-early-nc6", [["11...Qh5", 10]])),
  prose("ch2-early-game-note", spanId(25, "right"), "This was Razuvaev - Klovans, Bern 1993, and here the easiest continuation is:"),
  sequence("ch2-early-finish", spanId(25, "right"), "12.O-ON O-O 13.a3 Be7 14.Bg2", selected("ch2-early-nc6", [["12.O-ON", 11], ["O-O", 12], ["13.a3", 13], ["Be7", 14], ["14.Bg2", 15]])),
  prose("ch2-early-assessment", spanId(25, "right"), "With a pleasant edge for White."),
  sequence("ch2-main-eight", spanId(25, "right"), "7.Nxc6 Nxc6 8.O-O", selected("ch2-opening", [["7.Nxc6", 12], ["Nxc6", 13], ["8.O-O", 14]])),
  diagramBlock("ch2-d06-block", spanId(25, "right"), "CH2-D06"),
  prose("ch2-branching-point", spanId(25, "right"), "We have reached the first branching point. In this position Black has experimented with A) 8...Be7 and B) 8...Nd5!?, but the main line continues to be C) 8...Qd7.", [
    ...selected("ch2-a-main", [["8...Be7", 0]]), ...selected("ch2-b-main", [["8...Nd5!?", 0]]), ...selected("ch2-c-main", [["8...Qd7", 0]]),
  ]),
  sequence("ch2-nxd4-start", spanId(25, "right"), "8...Nxd4?!", selected("ch2-nxd4", [["8...Nxd4?!", 0]])),
  prose("ch2-nxd4-history", spanId(25, "right"), "This has only occurred twice in practice, as Black quickly understood that his position was rather dubious after:"),
  sequence("ch2-nxd4-page25", spanId(25, "right"), "9.Bxb7 Rb8 10.Bg2", selected("ch2-nxd4", [["9.Bxb7", 1], ["Rb8", 2], ["10.Bg2", 3]])),

  diagramBlock("ch2-d07-block", spanId(26, "left"), "CH2-D07"),
  sequence("ch2-nxd4-page26", spanId(26, "left"), "10...Qd7 11.e3 Nf5 12.Qc2 Qb5 13.Nd2 Nd6 14.b3 cxb3? 15.Bc6+N Kd8 16.axb3", selected("ch2-nxd4", [["10...Qd7", 4], ["11.e3", 5], ["Nf5", 6], ["12.Qc2", 7], ["Qb5", 8], ["13.Nd2", 9], ["Nd6", 10], ["14.b3", 11], ["cxb3?", 12], ["15.Bc6+N", 13], ["Kd8", 14], ["16.axb3", 15]])),
  prose("ch2-nxd4-page26-note", spanId(26, "left"), "White has a long-term advantage thanks to his bishop pair and better pawn structure."),
  variation("ch2-nxd4-c5-block", spanId(26, "left"), "Black's active try", "10...Bc5 11.Nd2 c3 12.bxc3 Nb5 13.Qc2 still leaves White with a long-term advantage thanks to the bishop pair and healthier pawn structure.", "ch2-nxd4-c5", refs("ch2-nxd4-c5")),
  variation("ch2-nxd4-lesser-block", spanId(26, "left"), "The lesser evil", "After 14...Be7 15.bxc4 Qa6 16.c5 Nf5 17.Nb3 O-O 18.Rd1, White is clearly better, but this was preferable to the game continuation.", "ch2-nxd4-lesser", refs("ch2-nxd4-lesser")),
  heading("ch2-a-heading", spanId(26, "left"), "A) 8...Be7", selected("ch2-a-main", [["8...Be7", 0]])),
  diagramBlock("ch2-d08-block", spanId(26, "left"), "CH2-D08"),

  prose("ch2-a-intro", spanId(26, "right"), "Once again White has a tough choice. Finally I decided to go with the following move:"),
  sequence("ch2-a-qa4", spanId(26, "right"), "9.Qa4", selected("ch2-a-main", [["9.Qa4", 1]])),
  variation("ch2-a-e3-block", spanId(26, "right"), "Why not 9.e3?", "9.e3 seemed unclear after 9...e5! 10.Bxc6+ bxc6 11.dxe5 Qxd1 12.Rxd1 Ng4 13.f4 Bc5, with sharp play as in Kallai - Anka, Balatonbereny 1995.", "ch2-a-e3", refs("ch2-a-e3")),
  variation("ch2-a-qd7-block", spanId(26, "right"), "The quiet queen retreat", "9...Qd7 10.Rd1 O-O 11.Nc3 Rfd8 12.Qxc4 gives White an obvious advantage.", "ch2-a-qd7", refs("ch2-a-qd7")),
  variation("ch2-a-long-castle-block", spanId(26, "right"), "Black's attempt to complicate", "10...O-O-O 11.Nc3 Nd5 12.Qxc4 Nb6 13.Qb5! refutes the central pawn grab: 13...Nxd4 14.Qa5 Kb8 15.e3 Ne2+ 16.Kf1 Nd5 17.Nxd5 Nxc1 18.Raxc1 exd5 19.Rxd5 Bd6 20.Rb5 b6 21.Qa6 Qc8 22.Rxb6+, with mate following.", "ch2-a-long-castle", refs("ch2-a-long-castle")),
  variation("ch2-a-nb4-block", spanId(26, "right"), "The other queen exchange", "10...Nb4 11.Qxd7+ Nxd7 12.Na3 allows White to regain the pawn with an advantage.", "ch2-a-nb4", refs("ch2-a-nb4")),
  sequence("ch2-a-main-start", spanId(26, "right"), "9...O-O 10.e3", selected("ch2-a-main", [["9...O-O", 2], ["10.e3", 3]])),
  diagramBlock("ch2-d09-block", spanId(26, "right"), "CH2-D09"),

  sequence("ch2-a-e5", spanId(27, "left"), "10...e5", selected("ch2-a-main", [["10...e5", 4]])),
  prose("ch2-a-e5-note", spanId(27, "left"), "This is the move suggested for Black in GM 1. White is obviously better after 10...Nb4 11.a3 Nbd5 12.Qxc4, or 10...a6 11.Qxc4.", [
    ...selected("ch2-a-e5-nb4", [["10...Nb4", 0], ["11.a3", 1], ["Nbd5", 2], ["12.Qxc4", 3]]), ...selected("ch2-a-e5-a6", [["10...a6", 0], ["11.Qxc4", 1]]),
  ]),
  sequence("ch2-a-rd1", spanId(27, "left"), "11.Rd1!", selected("ch2-a-main", [["11.Rd1!", 5]])),
  prose("ch2-a-rd1-note", spanId(27, "left"), "Other options are worse: 11.dxe5 Nxe5 12.Bxb7 Rb8 13.Bg2 Qd7 gives Black counterplay, while 11.Bxc6 bxc6 12.dxe5 Ng4 leads to mutual chances.", [
    ...selected("ch2-a-rd1-dxe5", [["11.dxe5", 0], ["Nxe5", 1], ["12.Bxb7", 2], ["Rb8", 3], ["13.Bg2", 4], ["Qd7", 5]]), ...selected("ch2-a-rd1-bxc6", [["11.Bxc6", 0], ["bxc6", 1], ["12.dxe5", 2], ["Ng4", 3]]),
  ]),
  variation("ch2-a-qc8-block", spanId(27, "left"), "Black keeps the centre", "11...Qc8 12.Qxc4 exd4 13.exd4 Bd6 14.Nc3 leaves White better thanks to the strong light-squared bishop.", "ch2-a-qc8", refs("ch2-a-qc8")),
  variation("ch2-a-qxc4-block", spanId(27, "left"), "A solid alternative", "12.Qxc4 Nd7! 13.exd4 Nb6 14.Kf1 Nb4! 15.Nc3 c6 16.a3 N4d5 17.Qd3 Re8 18.Bd2 Qd7 brings Black close to equality.", "ch2-a-qxc4", refs("ch2-a-qxc4")),
  sequence("ch2-a-main-middle", spanId(27, "left"), "11...exd4 12.Bxc6 bxc6 13.Rxd4 Qe8 14.Rxc4 c5 15.Qxe8 Rfxe8 16.Kf1", selected("ch2-a-main", [["11...exd4", 6], ["12.Bxc6", 7], ["bxc6", 8], ["13.Rxd4", 9], ["Qe8", 10], ["14.Rxc4", 11], ["c5", 12], ["15.Qxe8", 13], ["Rfxe8", 14], ["16.Kf1", 15]])),
  diagramBlock("ch2-d10-block", spanId(27, "left"), "CH2-D10"),

  variation("ch2-a-nd7-block", spanId(27, "right"), "The 13...Nd7 alternative", "13...Nd7 14.Qxc6 Ne5 15.Qe4 Bd6 16.Nd2 Re8 17.Qg2 also leaves White with the better prospects.", "ch2-a-nd7", refs("ch2-a-nd7")),
  variation("ch2-a-bd6-block", spanId(27, "right"), "The 13...Bd6 alternative", "13...Bd6 14.Qxc6 Qe7 15.Nd2 wins a pawn without giving Black compensation.", "ch2-a-bd6", refs("ch2-a-bd6")),
  sequence("ch2-a-endgame", spanId(27, "right"), "16...Red8 17.Ke2 Nd7 18.Rc2 Ne5 19.Na3 Rab8 20.Bd2", selected("ch2-a-main", [["16...Red8", 16], ["17.Ke2", 17], ["Nd7", 18], ["18.Rc2", 19], ["Ne5", 20], ["19.Na3", 21], ["Rab8", 22], ["20.Bd2", 23]])),
  prose("ch2-a-endgame-note", spanId(27, "right"), "This endgame is quite unpleasant for Black. White has the more comfortable structure and Black is going to suffer for the rest of the game."),
  diagramBlock("ch2-d11-block", spanId(27, "right"), "CH2-D11"),
  heading("ch2-b-heading", spanId(27, "right"), "B) 8...Nd5!?", selected("ch2-b-main", [["8...Nd5!?", 0]])),
  prose("ch2-b-intro", spanId(27, "right"), "A playable alternative that has occurred several times in tournament practice."),

  diagramBlock("ch2-d12-block", spanId(28, "left"), "CH2-D12"),
  sequence("ch2-b-qa4", spanId(28, "left"), "9.Qa4", selected("ch2-b-main", [["9.Qa4", 1]])),
  prose("ch2-b-qa4-note", spanId(28, "left"), "I still like this move, despite the fact that White lost both games in which it was played."),
  variation("ch2-b-qd7-block", spanId(28, "left"), "The 9...Qd7 alternative", "9...Qd7 10.Qxc4 Nb6 11.Qd3 O-O-O 12.Qf3! gives White a stable edge, as the Catalan bishop should secure an advantage.", "ch2-b-qd7", refs("ch2-b-qd7")),
  variation("ch2-b-nb6-block", spanId(28, "left"), "The 9...Nb6 alternative", "9...Nb6 10.Bxc6+ bxc6 11.Qxc6+ Qd7 12.Qxd7+ Kxd7 13.e4 gives White the preferable endgame thanks to the healthier pawn structure.", "ch2-b-nb6", refs("ch2-b-nb6")),
  variation("ch2-b-nb6-queen-block", spanId(28, "left"), "Keeping the queens", "12.Qf3 Be7 13.Nc3 O-O 14.Rd1+ also leaves White slightly better because of Black's damaged queenside pawns.", "ch2-b-nb6-queen", refs("ch2-b-nb6-queen")),
  sequence("ch2-b-main-start", spanId(28, "left"), "9...Qd6 10.Qxc4 Qb4 11.Qxb4N Ndxb4 12.Nc3 Nxd4", selected("ch2-b-main", [["9...Qd6", 2], ["10.Qxc4", 3], ["Qb4", 4], ["11.Qxb4N", 5], ["Ndxb4", 6], ["12.Nc3", 7], ["Nxd4", 8]])),

  variation("ch2-b-nc2-block", spanId(28, "right"), "The 12...Nc2 branch", "12...Nc2 13.d5! exd5 14.Rb1 O-O-O 15.Bxd5 leaves White better thanks to the bishop pair.", "ch2-b-nc2", refs("ch2-b-nc2")),
  sequence("ch2-b-main-f5", spanId(28, "right"), "13.Bxb7 Rb8 14.Be4 f5 15.Be3!", selected("ch2-b-main", [["13.Bxb7", 9], ["Rb8", 10], ["14.Be4", 11], ["f5", 12], ["15.Be3!", 13]])),
  prose("ch2-b-choice", spanId(28, "right"), "Only in this way can White fight for the advantage. Black now has a choice."),
  variation("ch2-b-fxe4-block", spanId(28, "right"), "The inferior 15...fxe4?!", "15...fxe4?! 16.Bxd4 Nc6 17.Be3 Rxb2 18.Rab1 lets White regain the e4-pawn and retain an obvious endgame advantage.", "ch2-b-fxe4", refs("ch2-b-fxe4")),
  variation("ch2-b-bc5-block", spanId(28, "right"), "The active 15...Bc5", "15...Bc5 16.Bb1! O-O 17.Rd1 Rfd8 18.Kg2 Nbc6 19.Bd3 keeps the bishop pair and the better chances.", "ch2-b-bc5", refs("ch2-b-bc5")),
  diagramBlock("ch2-d13-block", spanId(28, "right"), "CH2-D13"),

  sequence("ch2-b-finish", spanId(29, "left"), "15...Nxe2+ 16.Nxe2 fxe4 17.Nc3 Nd5 18.Bd4! Nf6 19.Rfe1 Rb4 20.Re3!", selected("ch2-b-main", [["15...Nxe2+", 14], ["16.Nxe2", 15], ["fxe4", 16], ["17.Nc3", 17], ["Nd5", 18], ["18.Bd4!", 19], ["Nf6", 20], ["19.Rfe1", 21], ["Rb4", 22], ["20.Re3!", 23]])),
  prose("ch2-b-assessment", spanId(29, "left"), "Black can equalize after the wrong bishop exchange, but the text continuation leaves White with the better prospects."),
  diagramBlock("ch2-d14-block", spanId(29, "left"), "CH2-D14"),
  heading("ch2-c-heading", spanId(29, "left"), "C) 8...Qd7", selected("ch2-c-main", [["8...Qd7", 0]])),
  prose("ch2-c-intro", spanId(29, "left"), "This is Black's main continuation."),
  sequence("ch2-c-e3", spanId(29, "left"), "9.e3", selected("ch2-c-main", [["9.e3", 1]])),
  variation("ch2-c-old-theory-block", spanId(29, "left"), "The old 9.Nc3 theory", "According to the old theory Black equalizes after 9.Nc3 Nxd4! 10.Bxb7 Rb8 11.Bg2 Be7 12.e3 Nb5!, as in Yusupov - Karpov, Belfort 1988.", "ch2-c-old-theory", refs("ch2-c-old-theory")),

  variation("ch2-c-e5-block", spanId(29, "right"), "The 9...e5 line", "9...e5 10.dxe5 Nxe5 11.Bxb7 Rb8 12.Bg2 Qxd1 13.Rxd1 Bd6 14.f4N Nd3 improves on Cvitan - Vaganian, Neum 2000 and gives White the initiative.", "ch2-c-e5", refs("ch2-c-e5")),
  variation("ch2-c-e5-bc5-block", spanId(29, "right"), "Black's 12...Bc5", "12...Bc5 13.b3!? O-O 14.Bb2 Rfd8 15.Qxd7 Nfxd7 16.Nd2 cxb3 17.axb3 Nd3 18.Bc3 leaves White clearly better.", "ch2-c-e5-bc5", refs("ch2-c-e5-bc5")),
  variation("ch2-c-e5-ned7-block", spanId(29, "right"), "The 14...Ned7 branch", "14...Ned7 15.Bf3! Nc5 16.Nd2 wins a pawn after White prepares e3-e4.", "ch2-c-e5-ned7", refs("ch2-c-e5-ned7")),
  heading("ch2-c-nd5-heading", spanId(29, "right"), "9...Nd5", selected("ch2-c-nd5", [["9...Nd5", 0]])),
  prose("ch2-c-nd5-intro", spanId(29, "right"), "This is met strongly by 10.Nd2!", selected("ch2-c-nd5", [["10.Nd2!", 1]])),
  variation("ch2-c-na5-block", spanId(29, "right"), "The correspondence 10...Na5", "10...Na5 11.Qe2 Qb5 12.Nf3 c6 13.e4 Nf6 14.Rd1 c3 15.Qc2 cxb2 16.Bxb2 Qc4 17.Qb1! gives White more than enough compensation for the pawn.", "ch2-c-na5", refs("ch2-c-na5")),
  diagramBlock("ch2-d15-block", spanId(29, "right"), "CH2-D15"),

  variation("ch2-c-nd5-block", spanId(30, "left"), "White's long-term bind", "9...Nd5 10.Nd2! h5 11.Nxc4 h4 12.e4 Nb6 13.Nxb6N axb6 14.Be3 O-O-O 15.Qa4 Kb8 16.Rfd1 hxg3 17.hxg3. Black has no kingside play, while White's positional advantage will tell: 17...Be7 18.Rac1 Bf6 19.d5 Ne5 20.Qb3±.", "ch2-c-nd5", refs("ch2-c-nd5")),
  heading("ch2-c1-heading", spanId(30, "left"), "C1) 9...Rb8 10.Qe2 b5 11.b3", selected("ch2-c1-main", [["9...Rb8", 0], ["10.Qe2", 1], ["b5", 2], ["11.b3", 3]])),
  diagramBlock("ch2-d16-block", spanId(30, "left"), "CH2-D16"),
  variation("ch2-c1-na5-block", spanId(30, "left"), "Not 11...Na5?!", "11...Na5?! 12.Bd2 b4 13.bxc4 gives White an advantage, as in Nesis - Engel, correspondence 1988.", "ch2-c1-na5", refs("ch2-c1-na5")),
  sequence("ch2-c1-main-start", spanId(30, "left"), "11...cxb3 12.axb3 Rb6", selected("ch2-c1-main", [["11...cxb3", 4], ["12.axb3", 5], ["Rb6", 6]])),
  prose("ch2-c1-rb6", spanId(30, "left"), "This is by far Black's most popular option."),
  variation("ch2-c1-bb4-block", spanId(30, "left"), "The active 12...Bb4", "12...Bb4 13.Ra6 Nd5 14.Bb2 Rb6 15.Rxb6 axb6 16.Qxb5 Na5 17.Qd3 O-O 18.e4 Nf6 19.Rd1 leaves White with a pleasant Catalan edge, the bishop pair and a strong centre.", "ch2-c1-bb4", refs("ch2-c1-bb4")),
  diagramBlock("ch2-d17-block", spanId(30, "left"), "CH2-D17"),

  diagramBlock("ch2-d18-block", spanId(30, "right"), "CH2-D18"),
  sequence("ch2-c1-main-continue", spanId(30, "right"), "13.Rd1 a6 14.Nc3 Be7", selected("ch2-c1-main", [["13.Rd1", 7], ["a6", 8], ["14.Nc3", 9], ["Be7", 10]])),
  prose("ch2-c1-novelty", spanId(30, "right"), "This position occurred in two games, but in both cases White refrained from the tempting central novelty."),
  variation("ch2-c1-bb4-castle-block", spanId(30, "right"), "A strong central break", "13...Bb4 14.Bb2 O-O allows White the strong 15.d5! exd5 16.Bxf6 gxf6 17.Bxd5 Qe6 18.Qc2N, threatening Rh5. After 18...Ne5 19.Rxa7, White's advantage is indisputable because of Black's damaged kingside.", "ch2-c1-bb4-castle", refs("ch2-c1-bb4-castle")),

  diagramBlock("ch2-d19-block", spanId(31, "left"), "CH2-D19"),
  sequence("ch2-c1-exchanges", spanId(31, "left"), "15.d5N exd5 16.Nxd5 Nfxd5 17.Bxd5 Bf6", [
    ...selected("ch2-c1-main", [["15.d5N", 11], ["exd5", 12], ["16.Nxd5", 13], ["Nfxd5", 14], ["17.Bxd5", 15]]), ...selected("ch2-c1-finish-line", [["Bf6", 0]]),
  ]),
  prose("ch2-c1-discovered-attack", spanId(31, "left"), "I assume that White missed the following discovered attack while calculating on move 15:"),
  sequence("ch2-c1-finish", spanId(31, "left"), "18.Bf3?! Qe6 19.Bg4 Qe7 20.Bd7+ Kf8 21.Ba3 b4 22.Bb2 Bxb2 23.Qxb2", selected("ch2-c1-finish-line", [["18.Bf3?!", 1], ["Qe6", 2], ["19.Bg4", 3], ["Qe7", 4], ["20.Bd7+", 5], ["Kf8", 6], ["21.Ba3", 7], ["b4", 8], ["22.Bb2", 9], ["Bxb2", 10], ["23.Qxb2", 11]])),
  prose("ch2-c1-finish-note", spanId(31, "left"), "With a pleasant advantage for White."),
  diagramBlock("ch2-d20-block", spanId(31, "left"), "CH2-D20"),
  heading("ch2-c2-heading", spanId(31, "left"), "C2) 9...O-O-O", selected("ch2-c2-main", [["9...O-O-O", 0]])),

  prose("ch2-c2-intro", spanId(31, "right"), "Currently the most fashionable continuation at grandmaster level."),
  sequence("ch2-c2-qa4", spanId(31, "right"), "10.Qa4 Nd5", selected("ch2-c2-main", [["10.Qa4", 1], ["Nd5", 2]])),
  variation("ch2-c2-h5-unclear-block", spanId(31, "right"), "The early bishop exchange", "After 10...h5 11.Bxc6 Qxc6 12.Qxc6 bxc6 13.Nd2 h4 14.Nxc4 Bd6 15.Kg2 Rh5 16.Bd2 Rdh8, the position is surprisingly unclear.", "ch2-c2-h5-unclear", [
    ...selected("ch2-c2-h5", [["10...h5", 0]]), ...refs("ch2-c2-h5-unclear"),
  ]),
  variation("ch2-c2-h5-block", spanId(31, "right"), "White's additional option against 10...h5", "10...h5 11.Nd2 Nd5 12.Nxc4 h4 13.Bd2 Kb8 14.Rfc1 f5 15.b4! Bd6 16.b5 Nce7 17.Qb3N prepares the a-pawn advance.", "ch2-c2-h5", selected("ch2-c2-h5", [["10...h5", 0], ["11.Nd2", 1], ["Nd5", 2], ["12.Nxc4", 3], ["h4", 4], ["13.Bd2", 5], ["Kb8", 6], ["14.Rfc1", 7], ["f5", 8], ["15.b4!", 9], ["Bd6", 10], ["16.b5", 11], ["Nce7", 12], ["17.Qb3N", 13]])),
  diagramBlock("ch2-d21-block", spanId(31, "right"), "CH2-D21"),

  variation("ch2-c2-h5-finish", spanId(32, "left"), "The a-pawn joins the attack", "17...Ng8 18.a4 Ngf6 19.a5 hxg3 20.hxg3 g5 21.b6 cxb6 22.Nxb6! wins the attacking race.", "ch2-c2-h5", selected("ch2-c2-h5", [["17...Ng8", 14], ["18.a4", 15], ["Ngf6", 16], ["19.a5", 17], ["hxg3", 18], ["20.hxg3", 19], ["g5", 20], ["21.b6", 21], ["cxb6", 22], ["22.Nxb6!", 23]])),
  sequence("ch2-c2-main-setup", spanId(32, "left"), "11.Qxc4 h5 12.Bd2 h4 13.Rfc1", selected("ch2-c2-main", [["11.Qxc4", 3], ["h5", 4], ["12.Bd2", 5], ["h4", 6], ["13.Rfc1", 7]])),
  prose("ch2-c2-main-note", spanId(32, "left"), "The last preparatory move before the real action begins."),
  variation("ch2-c2-premature-block", spanId(32, "left"), "Why 13.b4 is premature", "13.b4 Ncxb4! 14.Bxb4 Bxb4 15.e4 Nf4! 16.gxf4 Qxd4 17.Qxd4 Rxd4 gives Black enough activity, while 15.Bxd5? Qxd5 16.Qxb4 hxg3 lets the attack decide.", "ch2-c2-premature", [
    ...selected("ch2-c2-premature", [["13.b4", 0], ["Ncxb4!", 1], ["14.Bxb4", 2], ["Bxb4", 3], ["15.e4", 4], ["Nf4!", 5], ["16.gxf4", 6], ["Qxd4", 7], ["17.Qxd4", 8], ["Rxd4", 9]]),
    ...selected("ch2-c2-premature-bxd5", [["15.Bxd5?", 0], ["Qxd5", 1], ["16.Qxb4", 2], ["hxg3", 3]]),
  ]),
  diagramBlock("ch2-d22-block", spanId(32, "left"), "CH2-D22"),
  sequence("ch2-c2-main-break", spanId(32, "left"), "13...hxg3 14.hxg3 f5 15.b4!", selected("ch2-c2-main", [["13...hxg3", 8], ["14.hxg3", 9], ["f5", 10], ["15.b4!", 11]])),
  prose("ch2-c2-b4-note", spanId(32, "left"), "White has to start active play on the queenside to maximize the power of the light-squared bishop."),
  variation("ch2-c2-bxb4-block", spanId(32, "right"), "Accepting the sacrifice", "15...Bxb4 16.Bxb4 Ncxb4 17.Nd2 is extremely difficult for Black to defend. White retains the Catalan bishop, a knight heading for c5 and open files for the rooks.", "ch2-c2-bxb4", refs("ch2-c2-bxb4")),
  variation("ch2-c2-critical-block", spanId(32, "right"), "The critical 15...Ncxb4", "15...Ncxb4 16.a3 Nc6 17.Nc3 Kb8 18.Qb3 Nb6 19.Ne2 e5 20.Rxc6! bxc6 21.a4 e4 22.a5 Rh6 23.axb6 cxb6 24.f3! exf3 25.Bxf3 g5 26.Bg2±. White's light-squared bishop should prove the advantage.", "ch2-c2-critical", refs("ch2-c2-critical")),
  diagramBlock("ch2-d23-block", spanId(32, "right"), "CH2-D23"),
  sequence("ch2-c2-game", spanId(32, "right"), "15...Bd6 16.b5 Nce7 17.Nc3 Kb8", selected("ch2-c2-main", [["15...Bd6", 12], ["16.b5", 13], ["Nce7", 14], ["17.Nc3", 15], ["Kb8", 16]])),
  diagramBlock("ch2-d24-block", spanId(32, "right"), "CH2-D24"),
  prose("ch2-c2-too-slow", spanId(32, "right"), "This is too slow. Black had to consider the immediate knight exchange."),

  variation("ch2-c2-nxc3-block", spanId(33, "left"), "Black's 17...Nxc3 resource", "17...Nxc3 18.Rxc3 Nd5 19.Rb3 g5 gives Black more activity, although White can switch to a positional strategy with 20.e4! fxe4 21.Re1 Rh5 22.Bxe4 Rdh8 23.Qe2 and retain a serious advantage.", "ch2-c2-nxc3", refs("ch2-c2-nxc3")),
  sequence("ch2-c2-final", spanId(33, "left"), "18.a4 Rh5 19.a5 Rdh8 20.a6!N b6 21.e4 Nxc3 22.Rxc3 fxe4 23.Re3 Rxb5 24.Rxe4", selected("ch2-c2-main", [["18.a4", 17], ["Rh5", 18], ["19.a5", 19], ["Rdh8", 20], ["20.a6!N", 21], ["b6", 22], ["21.e4", 23], ["Nxc3", 24], ["22.Rxc3", 25], ["fxe4", 26], ["23.Re3", 27], ["Rxb5", 28], ["24.Rxe4", 29]])),
  prose("ch2-c2-final-note", spanId(33, "left"), "Despite Black's extra pawn, the position is difficult. White will simply increase the pressure along the h1-a8 diagonal."),
  diagramBlock("ch2-d25-block", spanId(33, "left"), "CH2-D25"),

  heading("ch2-conclusion-heading", spanId(33, "right"), "Conclusion"),
  variation("ch2-conclusion", spanId(33, "right"), "Conclusion", "The first part of the chapter shares many similarities with GM 1, with some general improvements added along the way. The overall assessment remains favourable for White. After 5...Bd7 6.Ne5 Bc6 7.Nxc6 Nxc6 8.O-O Qd7 9.e3, the most critical test is 9...O-O-O, which has recently been employed with increasing frequency at the top level. Black aims to launch a quick kingside attack before the unsafe position of his own king is exploited. White must remain alert, but the analysis shows how to maintain an initiative in all cases.", "ch2-c2-main", [...selected("ch2-opening", [["5...Bd7", 9], ["6.Ne5", 10], ["Bc6", 11], ["7.Nxc6", 12], ["Nxc6", 13], ["8.O-O", 14]]), ...selected("ch2-c-main", [["Qd7", 0], ["9.e3", 1]]), ...selected("ch2-c2-main", [["9...O-O-O", 0]])]),
];

type DiagramSpec = { id: string; sourceSpanId: string; role: string; lineId: string; moveIndex: number };
const diagramSpecs: DiagramSpec[] = [
  { id: "CH2-D01", sourceSpanId: P24, role: "Opening position after 5...Bd7", lineId: "ch2-opening", moveIndex: 9 },
  { id: "CH2-D02", sourceSpanId: P24, role: "C note after 14.f4N", lineId: "ch2-c-e5", moveIndex: 9 },
  { id: "CH2-D03", sourceSpanId: P24, role: "C1 after 15.d5N", lineId: "ch2-c1-main", moveIndex: 11 },
  { id: "CH2-D04", sourceSpanId: P24, role: "C2 after 20.a6!N", lineId: "ch2-c2-main", moveIndex: 21 },
  { id: "CH2-D05", sourceSpanId: spanId(25, "left"), role: "Opening position after 5...Bd7", lineId: "ch2-opening", moveIndex: 9 },
  { id: "CH2-D06", sourceSpanId: spanId(25, "right"), role: "Main position after 8.O-O", lineId: "ch2-opening", moveIndex: 14 },
  { id: "CH2-D07", sourceSpanId: spanId(26, "left"), role: "Position after 10.Bg2 in 8...Nxd4?!", lineId: "ch2-nxd4", moveIndex: 3 },
  { id: "CH2-D08", sourceSpanId: spanId(26, "left"), role: "A) position after 8...Be7", lineId: "ch2-a-main", moveIndex: 0 },
  { id: "CH2-D09", sourceSpanId: spanId(26, "right"), role: "A) position after 10.e3", lineId: "ch2-a-main", moveIndex: 3 },
  { id: "CH2-D10", sourceSpanId: spanId(27, "left"), role: "A) position after 10...e5", lineId: "ch2-a-main", moveIndex: 4 },
  { id: "CH2-D11", sourceSpanId: spanId(27, "right"), role: "A) rook endgame after 16.Kf1", lineId: "ch2-a-main", moveIndex: 15 },
  { id: "CH2-D12", sourceSpanId: spanId(28, "left"), role: "B) position after 8...Nd5!?", lineId: "ch2-b-main", moveIndex: 0 },
  { id: "CH2-D13", sourceSpanId: spanId(28, "right"), role: "B) position after 14...f5", lineId: "ch2-b-main", moveIndex: 12 },
  { id: "CH2-D14", sourceSpanId: spanId(29, "left"), role: "B) position after 18...Nf6", lineId: "ch2-b-main", moveIndex: 20 },
  { id: "CH2-D15", sourceSpanId: spanId(29, "right"), role: "C) position after 9.e3", lineId: "ch2-c-main", moveIndex: 1 },
  { id: "CH2-D16", sourceSpanId: spanId(30, "left"), role: "C1) position after 11.b3", lineId: "ch2-c1-main", moveIndex: 3 },
  { id: "CH2-D17", sourceSpanId: spanId(30, "left"), role: "C1) active 12...Bb4 line", lineId: "ch2-c1-bb4", moveIndex: 6 },
  { id: "CH2-D18", sourceSpanId: spanId(30, "right"), role: "C1) position after 12...Rb6", lineId: "ch2-c1-main", moveIndex: 6 },
  { id: "CH2-D19", sourceSpanId: spanId(31, "left"), role: "C1) position after 14...Be7", lineId: "ch2-c1-main", moveIndex: 10 },
  { id: "CH2-D20", sourceSpanId: spanId(31, "left"), role: "C2) position after 9...O-O-O", lineId: "ch2-c2-main", moveIndex: 0 },
  { id: "CH2-D21", sourceSpanId: spanId(31, "right"), role: "C2) attack after 16...Nce7", lineId: "ch2-c2-h5", moveIndex: 12 },
  { id: "CH2-D22", sourceSpanId: spanId(32, "left"), role: "C2) main position after 13.Rfc1", lineId: "ch2-c2-main", moveIndex: 7 },
  { id: "CH2-D23", sourceSpanId: spanId(32, "right"), role: "C2) critical line after 19.Ne2", lineId: "ch2-c2-critical", moveIndex: 7 },
  { id: "CH2-D24", sourceSpanId: spanId(32, "right"), role: "C2) main position after 17...Kb8", lineId: "ch2-c2-main", moveIndex: 16 },
  { id: "CH2-D25", sourceSpanId: spanId(33, "left"), role: "C2) position after 19...Rdh8", lineId: "ch2-c2-main", moveIndex: 20 },
];

export const CHAPTER2_DIAGRAMS: DiagramLink[] = diagramSpecs.map((spec) => {
  const sourceLine = byId(spec.lineId);
  const chess = new Chess(sourceLine.startFen);
  sourceLine.moves.slice(0, spec.moveIndex + 1).forEach((move) => chess.move(move.san));
  return { id: spec.id, associationStatus: "source-verified", positionStatus: "deterministically derived", boardIdentityStatus: "source-verified", sourceSpanId: spec.sourceSpanId, crop: `/source/chapter2/crops/${spec.id}.png`, role: spec.role, lineId: spec.lineId, moveIndex: spec.moveIndex, fen: chess.fen() };
});

export const CHAPTER2_LESSON: LessonDocument = {
  schemaVersion: 2,
  lessonId: "catalan.chapter2.complete",
  status: "source-verified",
  title: "Chapter 2 - Complete",
  subtitle: "The Catalan: 5...Bd7 and 8...Be7, 8...Nd5, and 8...Qd7",
  source: { documentId: "catalan.chapter2", filename: "Chapter2_Catalan.pdf", sha256: SOURCE_HASH },
  basePosition: { status: "deterministically derived", after: "Initial position", fen: new Chess().fen(), moves: [] },
  sourceSpans,
  lines,
  diagrams: CHAPTER2_DIAGRAMS,
  blocks,
};

export const CHAPTER2_ANNOTATED_MOVE_IDS = CHAPTER2_LESSON.lines.flatMap((item) => item.moves).filter((move) => move.annotation).map((move) => move.id);
export const CHAPTER2_SECTIONS = [
  { id: "overview", label: "Overview", blockId: "ch2-intro" },
  { id: "a", label: "A) 8...Be7", blockId: "ch2-a-heading" },
  { id: "b", label: "B) 8...Nd5!?", blockId: "ch2-b-heading" },
  { id: "c", label: "C) 8...Qd7", blockId: "ch2-c-heading" },
  { id: "c1", label: "C1) 9...Rb8", blockId: "ch2-c1-heading" },
  { id: "c2", label: "C2) 9...O-O-O", blockId: "ch2-c2-heading" },
  { id: "conclusion", label: "Conclusion", blockId: "ch2-conclusion-heading" },
];
