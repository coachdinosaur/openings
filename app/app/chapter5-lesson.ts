import { Chess } from "chess.js";
import type { DiagramLink, LessonBlock, LessonDocument, MoveAnnotation, MoveReference, SourceSpan, VariationMove, VariationNode } from "./lesson-model";

const SOURCE_HASH = "65E6648ABF3E70594FD462107DA0A6A967DE18916FACC0284A15F3D1919B1F5F";
const P63 = "chapter5-p63-full";
const spanId = (page: number, column: "left" | "right") => `chapter5-p${page}-${column}`;

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
    catch { throw new Error(`${id}: invalid canonical move ${san} at source ply ${index + 1} from ${chess.fen()}`); }
    const annotation = annotationFor(san, sourceToken);
    return { id: `${id}-${String(index + 1).padStart(2, "0")}`, san, sourceToken, sourceSpanId, ...(annotation ? { annotation } : {}) };
  });
  return { id, label, parentLineId: null, parentPly: 0, startFen, startLabel: `Position before ${label}`, moves };
}

function sourcePosition(id: string, label: string, fen: string): VariationNode {
  const position = new Chess(fen).fen();
  return { id, label, parentLineId: null, parentPly: 0, startFen: position, startLabel: label, moves: [] };
}

const BASE = ["d4", "Nf6", "c4", "e6", "g3", "d5", "Nf3", "dxc4", "Bg2", "Nbd7"];
const OPEN = [...BASE, "O-O"];
const A_AFTER_CAPTURE = [...OPEN, "c5", "Na3", "cxd4", "Nxc4"];
const A_AFTER_NB6 = [...A_AFTER_CAPTURE, "Bc5", "Nxd4", "Nb6"];
const B_A5 = [...OPEN, "c6", "a4", "a5"];
const B_B5 = [...B_A5, "Qc2", "b5", "Ne5", "Nxe5", "dxe5", "Nd5", "axb5", "cxb5", "Nc3", "Bb4"];
const C = [...OPEN, "a6", "a4", "Rb8"];
const D = [...OPEN, "Rb8", "a4", "b6"];
const E = [...OPEN, "Be7", "Nbd2"];
const F = [...OPEN, "Nb6", "Nbd2", "c5", "Nxc4", "Nxc4", "Qa4+", "Bd7", "Qxc4"];

const lines: VariationNode[] = [
  line("ch5-opening", "Chapter 5 starting line", [], OPEN, P63),
  line("ch5-a", "A) 6...c5 main recommendation", A_AFTER_CAPTURE, ["Bc5", "Nxd4", "Nb6", ["Be3", "Be3!N"], "O-O", "Nb5", "Bxe3", "Nxe3"], spanId(64, "right")),
  line("ch5-a-capture", "A) immediate central clarification", OPEN, ["c5", "Na3", "cxd4", "Nxc4"], spanId(64, "left")),
  line("ch5-a-be7", "A) the quieter 8...Be7", A_AFTER_CAPTURE, ["Be7", "Nxd4", "O-O", ["Nb5", "Nb5!"], "Nc5", "Nbd6+"], spanId(64, "right")),
  line("ch5-a-nb6", "A) the 8...Nb6 alternative", A_AFTER_CAPTURE, ["Nb6", ["Nce5", "Nce5!"], "Be7", "Nxd4", "O-O", ["Nb5", "Nb5!"]], spanId(64, "right")),
  line("ch5-a-queen-trade", "A) pleasant queen-trade ending", A_AFTER_CAPTURE, ["Bc5", "Nxd4", "O-O", "Nb3", "Be7", "Bf4", "Nb6", "Qxd8", "Bxd8", ["Rfc1", "Rfc1N"], "Nfd5", "Bd6", "Re8", "Nca5"], spanId(64, "right")),
  line("ch5-a-tactic", "A) Black's tactical resource", A_AFTER_NB6, ["Nxb6", "Bxb6", "Nb5", "Bxf2+", "Kxf2", "Qb6+", "Nd4", "e5"], spanId(64, "right")),
  line("ch5-b", "B) 6...c6 and 7...a5", OPEN, ["c6", "a4", "a5"], spanId(65, "left")),
  line("ch5-b-bd6", "B) passive bishop development", [...OPEN, "c6", "a4"], [["Bd6", "Bd6?!"], "Nbd2", "O-O", "Nxc4", "Bc7", ["a5", "a5!"], "Rb8", ["Qc2", "Qc2N"]], spanId(65, "left")),
  line("ch5-b-be7", "B) accurate development and space", [...OPEN, "c6", "a4"], ["Be7", "Nbd2", "O-O", ["a5", "a5!"], "b5", "axb6", "Nxb6", "Ne5", "Qc7", "Ndxc4", "Nxc4", "Nxc4", "Nd5", "Bd2"], spanId(65, "left")),
  line("ch5-b-b5", "B) trying to hold the c4-pawn", B_A5, ["Qc2", "b5", ["Ne5", "Ne5!"], "Nxe5", "dxe5", "Nd5", "axb5", "cxb5", "Nc3", "Bb4"], spanId(65, "left")),
  line("ch5-b-nb4", "B) 12...Nb4?!", B_B5.slice(0, -1), [["Nb4", "Nb4?!"], "Qd2", "Qxd2", "Bxd2", "Rb8", "Rxa5", "Bd7", "Rfa1", "Be7", "Ra7"], spanId(65, "right")),
  line("ch5-b-qd7", "B) 12...Qd7", B_B5.slice(0, -1), ["Qd7", "Rd1", "Bb7", "e4", "Nb4", "Rxd7", "Nxc2", "Rxb7", "Nxa1", "Nxb5"], spanId(65, "right")),
  line("ch5-b-bc5", "B) tactical punishment of 12...Bc5", B_B5.slice(0, -1), ["Bc5", "Nxb5", "Ba6", ["Bg5", "Bg5!"], "f6", "exf6", "gxf6", "Bxd5", "exd5", ["Bxf6", "Bxf6!"], "Qxf6", "Nc7+", "Kd7", "Nxa8", "Rxa8", "Rxa5"], spanId(65, "right")),
  line("ch5-b-main", "B) central break and rook activity", B_B5, ["Rd1", "Bxc3", "bxc3", "f5", ["e4", "e4!N"], "fxe4", "Bxe4", "Bb7", "Ba3"], spanId(65, "right")),
  line("ch5-b-qxc4", "B) recovering the c4-pawn", [...B_A5, "Qc2", "Nb6"], ["Nbd2", "Be7", "Nxc4", "Nxc4", "Qxc4"], spanId(65, "right")),
  line("ch5-b-bd2", "B) position before 14.Bd2N", [...B_A5, "Qc2", "Nb6", "Nbd2", "Be7", "Nxc4", "Nxc4", "Qxc4"], ["O-O", "Ne5", "Nd5", "Rd1", "Bd7", ["Bd2", "Bd2N"], "Be8", "Nd3"], spanId(66, "left")),
  line("ch5-b-nfd5", "B) the 9...Nfd5 structure", [...B_A5, "Qc2", "Nb6"], ["Nbd2", "Nfd5", "Nxc4", "Nb4", "Qb3", "Nxc4", "Qxc4", "Be7", "Rd1", "O-O", "Ne5", "Bd6", ["Bd2", "Bd2N"]], spanId(66, "left")),
  line("ch5-c", "C) 6...a6 and 7...Rb8", OPEN, ["a6", "a4", "Rb8"], spanId(66, "right")),
  line("ch5-c-main", "C) queenside expansion", C, ["a5", "b5", "axb6", "cxb6", "Bf4", "Rb7", "Nfd2", "Nd5", "Nxc4", "N7f6"], spanId(67, "left")),
  line("ch5-c-bb4", "C) the 8...Bb4 branch", C, ["a5", "Bb4", "Qc2", "O-O", "Qxc4", "Bd6", "Qc2", "b5", "axb6", "cxb6", "e4"], spanId(66, "right")),
  line("ch5-c-bd6", "C) bishop development before castling", C, ["a5", "b5", "axb6", "cxb6", "Qc2", "Bd6", "Qxc4", "O-O", "Qc2"], spanId(66, "right")),
  line("ch5-c-ra8", "C) accurate knight route", C, ["a5", "b5", "axb6", "cxb6", "Bf4", "Ra8", "Ne5", "Nd5", "Nxc4"], spanId(67, "left")),
  line("ch5-c-rb4", "C) the Rahman-Boshku position", C, ["a5", "b5", "axb6", "Nxb6", "Nbd2", "Bb7", "Nxc4", "Bb4", ["b3", "b3N"], "Bd5"], spanId(67, "left")),
  line("ch5-c-rxa6", "C) Tukmakov-Rodriguez Vargas", C, ["a5", "b5", "axb6", "cxb6", "Bf4", "Rb7", "Rxa6", "Nd5", ["Nbd2", "Nd2!?N"]], spanId(67, "right")),
  sourcePosition("ch5-c-source-position", "C) source position before b3N", "3qkb1r/1bpn1ppp/p3pn2/8/1rNP4/5NP1/1P2PPBP/R1BQ1RK1 w k - 0 1"),
  sourcePosition("ch5-c-ra8-source-position", "C) source position before the knight-route improvement", "r1bqkb1r/5ppp/pp2pn2/3n4/2NP1B2/6P1/1P2PPBP/RN1Q1RK1 w kq - 0 1"),
  line("ch5-d", "D) 6...Rb8 and 7...b6", OPEN, ["Rb8", "a4", "b6"], spanId(67, "right")),
  line("ch5-d-ba6", "D) why the b1-knight goes to d2", D, [["Nfd2", "Nfd2!"], "Ba6", ["Nc3", "Nc3!"], "Be7", "Nb5", "Nd5", ["e4", "e4N"], "Nb4", "Nxc4", "O-O", "Bf4"], spanId(68, "left")),
  line("ch5-d-main", "D) main recommendation", D, [["Nfd2", "Nfd2!"], "Bb7", "Bxb7", "Rxb7", "Nxc4", "Be7", "Nc3", "Nd5", "e4", "Nxc3", "bxc3", "Nf6", ["Qf3", "Qf3N"], "O-O", "Rd1"], spanId(68, "left")),
  line("ch5-d-e5", "D) the 8...e5 alternative", D, [["Nfd2", "Nfd2!"], "e5", "Nxc4", "exd4", "Qxd4", "Bc5", "Qd3", "O-O", "Nc3", "Bb7", "Bxb7", "Rxb7", "Qf3", "Qa8", "Bf4"], spanId(68, "left")),
  line("ch5-e", "E) 6...Be7", OPEN, ["Be7", "Nbd2"], spanId(68, "right")),
  line("ch5-e-pawn", "E) Black holds the extra pawn", E, ["b5", "a4", "c6", "axb5", "cxb5", "Ne5", "Nxe5", "dxe5", "Nd5"], spanId(69, "left")),
  line("ch5-e-sacrifice", "E) exchange sacrifice on a6", E, ["b5", "a4", "c6", "axb5", "cxb5", "Ne5", "Nxe5", "Bxa8", "Qxd4", "Nf3", "Nxf3+", "Bxf3", "Qb6", ["b3", "b3!"], "Bd7", "bxc4", "bxc4", "Be3", "Bc5", ["Ra6", "Ra6!!"]], spanId(69, "left")),
  line("ch5-f", "F) 6...Nb6 main continuation", OPEN, ["Nb6", "Nbd2", "c5", "Nxc4", "Nxc4", "Qa4+", "Bd7", "Qxc4"], spanId(69, "right")),
  line("ch5-f-bd7", "F) aggressive reaction to 7...Bd7", [...OPEN, "Nb6", "Nbd2"], ["Bd7", ["a4", "a4!"], "Bc6", "a5", "Nbd7", "Nxc4", "Be7", "Qb3", "O-O", "Rd1", "Qc8", "Bf4", "Bd5", ["Nfe5", "Nfe5N"], "Bxg2", "Kxg2", "Nd5", "Bd2", "c5", "Rac1"], spanId(69, "right")),
  line("ch5-f1", "F1) 10...Qb6", F, ["Qb6", ["Be3", "Be3!"], "Nd5", "Ne5", "Nxe3"], spanId(70, "right")),
  line("ch5-f1-cxd4", "F1) central liquidation", F, ["Qb6", ["Be3", "Be3!"], "Rc8", "Ne5", "cxd4", ["Bxd4", "Bxd4!"], "Bc5", "Nxd7", "Nxd7", ["b4", "b4!"], "Qxb4", "Qxb4", "Bxb4", "Bxb7", "Rc7", "Rfc1"], spanId(70, "left")),
  line("ch5-f1-nc4", "F1) the 15.Nc4 novelty", F, ["Qb6", "Be3", "Nd5", "Ne5", "Nxe3", "fxe3", "Bb5", "Qb3", "f6", ["Nc4", "Nc4N"], "Bxc4", "Qxc4", "Be7", "Bh3", "f5", "dxc5", "Bxc5", "Bxf5", "Bxe3+", "Kg2"], spanId(70, "right")),
  line("ch5-f2", "F2) 10...Rc8", F, ["Rc8", "Ne5", "b5"], spanId(71, "left")),
  line("ch5-f2-main", "F2) c4 structure", F, ["Rc8", "Ne5", "b5", "Qd3", "c4", "Qc2", "Nd5", "a4", "a6"], spanId(71, "right")),
  line("ch5-f2-attack", "F2) kingside initiative", F, ["Rc8", "Ne5", "b5", "Qd3", "c4", "Qc2", "Qc7"], spanId(71, "left")),
  line("ch5-f3", "F3) 10...b5", F, ["b5", ["Qc3", "Qc3!"]], spanId(71, "right")),
  line("ch5-f3-main", "F3) the 13.e4 novelty", F, ["b5", ["Qc3", "Qc3!"], "Nd5", "Qd2", "c4", ["e4", "e4N"], "Bb4", "Qe2", "Nb6", "d5", "O-O", "dxe6", "fxe6", "Bf4"], spanId(72, "right")),
];

const byId = (id: string) => {
  const found = lines.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`Missing Chapter 5 line ${id}`);
  return found;
};

function moveRefsInText(text: string, preferredLineId: string, sourceSpanId: string): MoveReference[] {
  type Candidate = MoveReference & { priority: number };
  const candidates: Candidate[] = lines.flatMap((candidateLine) => candidateLine.moves.flatMap((move, moveIndex) => {
    const priority = candidateLine.id === preferredLineId ? 0 : move.sourceSpanId === sourceSpanId ? 1 : 2;
    return [...new Set([move.sourceToken, move.san])].map((source) => ({ source, lineId: candidateLine.id, moveIndex, priority }));
  })).filter((candidate) => candidate.source.length >= 2);
  const references: MoveReference[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    const matches = candidates.map((candidate) => ({ candidate, at: text.indexOf(candidate.source, cursor) }))
      .filter(({ candidate, at }) => {
        if (at < 0) return false;
        const before = text[at - 1];
        const after = text[at + candidate.source.length];
        return (!before || !/[A-Za-z]/.test(before)) && (!after || !/[A-Za-z]/.test(after));
      });
    if (!matches.length) break;
    const earliest = Math.min(...matches.map((match) => match.at));
    const selected = matches.filter((match) => match.at === earliest).sort((left, right) => right.candidate.source.length - left.candidate.source.length || left.candidate.priority - right.candidate.priority)[0].candidate;
    references.push({ source: selected.source, lineId: selected.lineId, moveIndex: selected.moveIndex });
    cursor = earliest + selected.source.length;
  }
  return references;
}

const sourceSpans: SourceSpan[] = [
  { id: P63, status: "source-verified", pageIndex: 0, printedPage: 63, column: "full", order: 1, crop: "/source/chapter5/pages/printed-63.png", bbox: { x0: 0, top: 0, x1: 474.96, bottom: 676.08 } },
  ...Array.from({ length: 9 }, (_, index) => (["left", "right"] as const).map((column, offset) => ({
    id: spanId(64 + index, column), status: "source-verified" as const, pageIndex: index + 1, printedPage: 64 + index, column, order: 2 + index * 2 + offset,
    crop: `/source/chapter5/pages/printed-${64 + index}.png`, bbox: { x0: column === "left" ? 35 : 237, top: 50, x1: column === "left" ? 237 : 440, bottom: 640 },
  }))).flat(),
];

type RegionCopy = { id: string; title: string; text: string; lineId: string };
const regionCopy: RegionCopy[] = [
  { id: P63, title: "Chapter 5 · 5...Nbd7 variation index", text: "The chapter covers A) 6...c5, B) 6...c6, C) 6...a6, D) 6...Rb8, E) 6...Be7 and the main continuation F) 6...Nb6. The index highlights the new ideas 10.Be3!N, 15.e4!N and 12.Nd2!?N, then divides F into F1) 10...Qb6, F2) 10...Rc8 and F3) 10...b5.", lineId: "ch5-opening" },
  { id: spanId(64, "left"), title: "The purpose of 5...Nbd7 and A) 6...c5", text: "The developing 5...Nbd7 is too passive to equalize, but it offers Black six distinct structures. After 6.O-O c5 7.Na3 cxd4 8.Nxc4, the d7-knight is misplaced and White regains the pawn with comfortable pressure.", lineId: "ch5-a-capture" },
  { id: spanId(64, "right"), title: "A) The 10.Be3!N improvement", text: "Black's quieter eighth moves leave White clearly better. The queen-trade line with Rfc1N and Nca5 retains a pleasant edge. In the main branch, 9.Nxd4 Nb6 10.Be3!N avoids Black's Bxf2+ tactical resource and leaves White with lasting pressure after castling.", lineId: "ch5-a" },
  { id: spanId(65, "left"), title: "B) 6...c6 and the ambitious a-pawn", text: "Against 6...c6, 7.a4 prevents Black from stabilizing the extra pawn. The passive 7...Bd6?! allows a5! and Qc2N, while 7...Be7 is met by Nbd2, a5 and active central play. After 7...a5, White examines both 8.Qc2 and 8.Nbd2.", lineId: "ch5-b" },
  { id: spanId(65, "right"), title: "B) Refuting the pawn grab", text: "After 8.Qc2 b5 9.Ne5!, the sequence through Nc3 and Bb4 gives Black no relief. The Nb4?! and Qd7 branches concede a clear edge, while 12...Bc5 loses to Nxb5, Bg5! and Bxf6!. The main improvement is the central break 15.e4!N.", lineId: "ch5-b-main" },
  { id: spanId(66, "left"), title: "B) Central control before C", text: "The 9...Nfd5 structure is answered by Nxc4, Qb3 and the new Nfe5N. Bd2N followed by Nd3 keeps a small but durable advantage. The related Maksimovic-Laketic position confirms that White's pieces coordinate naturally against Black's queenside.", lineId: "ch5-b-nfd5" },
  { id: spanId(66, "right"), title: "C) 6...a6 7.a4 Rb8", text: "Black's rook move supports ...b5, but White fixes the queenside with a5. The direct 7...c5 transposes to A. After 8.a5 b5, en passant on b6 and pressure on c4 leave White with the same Catalan pull; the 8...Bb4 branch is also harmless.", lineId: "ch5-c" },
  { id: spanId(67, "left"), title: "C) The correct knight route", text: "After a5, b5, axb6 and cxb6, White chooses the right knight for d2. The Ra8 setup is met by Nfd2 and Nxc4, while the Rahman-Boshku game permits the source improvement b3N. Black's queenside remains difficult to coordinate.", lineId: "ch5-c-ra8" },
  { id: spanId(67, "right"), title: "C) Active rook play and D", text: "Tukmakov-Rodriguez Vargas reached a position where Rxa6 and the improvement Bd2N give White a clear advantage. Black's alternatives can even lead to a winning attack. D) 6...Rb8 7.a4 b6 is the next attempt to support the c4-pawn.", lineId: "ch5-c-rxa6" },
  { id: spanId(68, "left"), title: "D) 8.Nfd2!", text: "White must place the f3-knight on d2. Against 8...Ba6, Nc3!, Nb5 and the new e4N produce a substantial advantage. The main 8...Bb7 line continues Bxb7, Nxc4, Nc3 and e4; after 13...Nf6 the fresh Qf3N preserves a pleasant edge.", lineId: "ch5-d-main" },
  { id: spanId(68, "right"), title: "E) 6...Be7", text: "The immediate bishop development has occurred surprisingly often. White chooses 7.Nbd2 and tests Black's attempt to keep the c4-pawn. The tactical sequence beginning with ...b5 and ...c6 shows why Black must be careful on the long diagonal.", lineId: "ch5-e" },
  { id: spanId(69, "left"), title: "E) The exchange sacrifice", text: "White's b3N improvement creates serious queenside threats. In the principal tactical line, the bishop reaches a8 and Black's queen captures on d4. The striking Ra6!! exchange sacrifice changes the course of the game and leaves Black unable to solve the king problem.", lineId: "ch5-e-sacrifice" },
  { id: spanId(69, "right"), title: "F) 6...Nb6", text: "The logical 6...Nb6 is Black's main continuation. White meets 7...Bd7 aggressively with a4!, and the later Nfe5N keeps definite pressure. The main route is 7.Nbd2 c5 8.Nxc4 Nxc4 9.Qa4+ Bd7 10.Qxc4.", lineId: "ch5-f" },
  { id: spanId(70, "left"), title: "F1) 10...Qb6", text: "After 10...Qb6 11.Be3! Nd5, White can meet the central capture with 13.Bxd4!. The forcing liquidation through Nxd7 and b4! leaves White with the bishop pair and a clearly better ending.", lineId: "ch5-f1-cxd4" },
  { id: spanId(70, "right"), title: "F1) The 15.Nc4N novelty", text: "The alternative 12.Ne5 Nxe3 leads to doubled pawns but lasting initiative. After Qb3 and ...f6, 15.Nc4N is stronger than the previously tested bishop check. The opposite-coloured bishops do not neutralize White's pressure.", lineId: "ch5-f1-nc4" },
  { id: spanId(71, "left"), title: "F2) 10...Rc8", text: "Against 10...Rc8, 11.Ne5 b5 is Black's most resilient setup. The direct cxd4 line loses a pawn, while Qd3 and c4 lead to a fixed structure. White can also damage the kingside with Bxf6, gxf6 and the central break d5!.", lineId: "ch5-f2-attack" },
  { id: spanId(71, "right"), title: "F2 and F3 critical choices", text: "After 12.Qd3 c4, White keeps the more pleasant game with Qc2. The critical improvement against ...Nd5 is Nb4N, followed by d5 and axb5. F3) 10...b5 is met by the uncommon 11.Qc3!, protecting the d-pawn and preparing Ne5.", lineId: "ch5-f3" },
  { id: spanId(72, "left"), title: "F3) Fixing the queenside", text: "Black's 12...c4 creates a temporary space gain, but it gives White a clear target. The source rejects the premature Ne5 game continuation and introduces 13.e4N, after which Black must develop the bishop and hurry to castle.", lineId: "ch5-f3-main" },
  { id: spanId(72, "right"), title: "Conclusion", text: "After 13.e4N Bb4 14.Qe2 Nb6 15.d5 O-O 16.dxe6 fxe6 17.Bf4, White's position is more promising. The chapter concludes that Black remains worse in this system; variation F deserves careful study, but the recommended main line gives White excellent prospects.", lineId: "ch5-f3-main" },
];

type DiagramSpec = { id: string; sourceSpanId: string; role: string; lineId: string; moveIndex: number };
const diagramSpecs: DiagramSpec[] = [
  { id: "CH5-D01", sourceSpanId: P63, role: "Opening position after 5...Nbd7", lineId: "ch5-opening", moveIndex: 9 },
  { id: "CH5-D02", sourceSpanId: P63, role: "A) position after 9...Nb6", lineId: "ch5-a", moveIndex: 2 },
  { id: "CH5-D03", sourceSpanId: P63, role: "B) position before 15.e4!N", lineId: "ch5-b-main", moveIndex: 2 },
  { id: "CH5-D04", sourceSpanId: P63, role: "C) position after 11...Nd5", lineId: "ch5-c-rxa6", moveIndex: 7 },
  { id: "CH5-D05", sourceSpanId: spanId(64, "left"), role: "Position after 6.O-O", lineId: "ch5-opening", moveIndex: 10 },
  { id: "CH5-D06", sourceSpanId: spanId(64, "left"), role: "A) after 7...cxd4", lineId: "ch5-a-capture", moveIndex: 2 },
  { id: "CH5-D07", sourceSpanId: spanId(64, "right"), role: "A) before 10.Be3!N", lineId: "ch5-a", moveIndex: 2 },
  { id: "CH5-D08", sourceSpanId: spanId(65, "left"), role: "B) position after 7...a5", lineId: "ch5-b", moveIndex: 2 },
  { id: "CH5-D09", sourceSpanId: spanId(65, "right"), role: "B) central break before 15.e4!N", lineId: "ch5-b-main", moveIndex: 2 },
  { id: "CH5-D10", sourceSpanId: spanId(65, "right"), role: "B) active piece placement", lineId: "ch5-b-qxc4", moveIndex: 4 },
  { id: "CH5-D11", sourceSpanId: spanId(66, "left"), role: "B) before 14.Bd2N", lineId: "ch5-b-bd2", moveIndex: 4 },
  { id: "CH5-D12", sourceSpanId: spanId(66, "left"), role: "B) Maksimovic-Laketic improvement", lineId: "ch5-b-nfd5", moveIndex: 11 },
  { id: "CH5-D13", sourceSpanId: spanId(66, "right"), role: "C) position after 7...Rb8", lineId: "ch5-c", moveIndex: 2 },
  { id: "CH5-D14", sourceSpanId: spanId(66, "right"), role: "C) bishop development before castling", lineId: "ch5-c-bd6", moveIndex: 8 },
  { id: "CH5-D15", sourceSpanId: spanId(67, "left"), role: "C) before b3N", lineId: "ch5-c-source-position", moveIndex: -1 },
  { id: "CH5-D16", sourceSpanId: spanId(67, "left"), role: "C) accurate knight route", lineId: "ch5-c-ra8-source-position", moveIndex: -1 },
  { id: "CH5-D17", sourceSpanId: spanId(67, "right"), role: "C) rook activity on a6", lineId: "ch5-c-rxa6", moveIndex: 7 },
  { id: "CH5-D18", sourceSpanId: spanId(67, "right"), role: "D) position after 7...b6", lineId: "ch5-d", moveIndex: 2 },
  { id: "CH5-D19", sourceSpanId: spanId(68, "left"), role: "D) before e4N", lineId: "ch5-d-ba6", moveIndex: 5 },
  { id: "CH5-D20", sourceSpanId: spanId(68, "left"), role: "D) before Qf3N", lineId: "ch5-d-main", moveIndex: 11 },
  { id: "CH5-D21", sourceSpanId: spanId(68, "right"), role: "E) position after 7.Nbd2", lineId: "ch5-e", moveIndex: 1 },
  { id: "CH5-D22", sourceSpanId: spanId(69, "left"), role: "E) before Ra6!!", lineId: "ch5-e-sacrifice", moveIndex: 18 },
  { id: "CH5-D23", sourceSpanId: spanId(69, "right"), role: "F) active 7...Bd7 structure", lineId: "ch5-f-bd7", moveIndex: 12 },
  { id: "CH5-D24", sourceSpanId: spanId(70, "left"), role: "F) position after 10.Qxc4", lineId: "ch5-f", moveIndex: 7 },
  { id: "CH5-D25", sourceSpanId: spanId(70, "left"), role: "F1) before 13.Bxd4!", lineId: "ch5-f1-cxd4", moveIndex: 4 },
  { id: "CH5-D26", sourceSpanId: spanId(70, "right"), role: "F1) after 11...Nd5", lineId: "ch5-f1", moveIndex: 2 },
  { id: "CH5-D27", sourceSpanId: spanId(70, "right"), role: "F1) before 15.Nc4N", lineId: "ch5-f1-nc4", moveIndex: 8 },
  { id: "CH5-D28", sourceSpanId: spanId(71, "left"), role: "F2) position after 11...b5", lineId: "ch5-f2", moveIndex: 2 },
  { id: "CH5-D29", sourceSpanId: spanId(71, "right"), role: "F2) before Nb4N", lineId: "ch5-f2-main", moveIndex: 8 },
  { id: "CH5-D30", sourceSpanId: spanId(72, "left"), role: "F3) position after 11.Qc3!", lineId: "ch5-f3", moveIndex: 1 },
  { id: "CH5-D31", sourceSpanId: spanId(72, "left"), role: "F3) before 13.e4N", lineId: "ch5-f3-main", moveIndex: 4 },
  { id: "CH5-D32", sourceSpanId: spanId(72, "right"), role: "F3) position before 17.Bf4", lineId: "ch5-f3-main", moveIndex: 12 },
];

export const CHAPTER5_DIAGRAMS: DiagramLink[] = diagramSpecs.map((spec) => {
  const sourceLine = byId(spec.lineId);
  const chess = new Chess(sourceLine.startFen);
  sourceLine.moves.slice(0, spec.moveIndex + 1).forEach((move) => chess.move(move.san));
  return { id: spec.id, associationStatus: "source-verified", positionStatus: spec.moveIndex === -1 ? "source-verified" : "deterministically derived", boardIdentityStatus: "source-verified", sourceSpanId: spec.sourceSpanId, crop: `/source/chapter5/crops/${spec.id}.png`, role: spec.role, lineId: spec.lineId, moveIndex: spec.moveIndex, fen: chess.fen() };
});

const diagramIdsBySpan = new Map<string, string[]>();
for (const diagram of CHAPTER5_DIAGRAMS) diagramIdsBySpan.set(diagram.sourceSpanId, [...(diagramIdsBySpan.get(diagram.sourceSpanId) ?? []), diagram.id]);

const blocks: LessonBlock[] = regionCopy.flatMap((region, index) => {
  const regionBlocks: LessonBlock[] = [
    { id: `ch5-heading-${String(index + 1).padStart(2, "0")}`, type: "heading", status: "source-verified", sourceSpanId: region.id, text: region.title, moveRefs: moveRefsInText(region.title, region.lineId, region.id) },
    { id: `ch5-region-${String(index + 1).padStart(2, "0")}`, type: "variation", status: "source-verified", sourceSpanId: region.id, title: region.title, text: region.text, lineId: region.lineId, moveRefs: moveRefsInText(region.text, region.lineId, region.id) },
  ];
  for (const diagramId of diagramIdsBySpan.get(region.id) ?? []) regionBlocks.push({ id: `${diagramId.toLowerCase()}-block`, type: "diagram", status: "source-verified", sourceSpanId: region.id, diagramId });
  return regionBlocks;
});

export const CHAPTER5_LESSON: LessonDocument = {
  schemaVersion: 2,
  lessonId: "catalan.chapter5.complete",
  status: "source-verified",
  title: "Chapter 5 - Complete",
  subtitle: "The Catalan: 5...Nbd7 with 6...c5, 6...c6 and 6...Nb6",
  source: { documentId: "catalan.chapter5", filename: "Chapter5_Catalan.pdf", sha256: SOURCE_HASH },
  basePosition: { status: "deterministically derived", after: "Initial position", fen: new Chess().fen(), moves: [] },
  sourceSpans,
  lines,
  diagrams: CHAPTER5_DIAGRAMS,
  blocks,
};

export const CHAPTER5_ANNOTATED_MOVE_IDS = CHAPTER5_LESSON.lines.flatMap((item) => item.moves).filter((move) => move.annotation).map((move) => move.id);
export const CHAPTER5_SECTIONS = [
  { id: "overview", label: "Overview", blockId: "ch5-heading-01" },
  { id: "a", label: "A) 6...c5", blockId: "ch5-heading-02" },
  { id: "b", label: "B) 6...c6", blockId: "ch5-heading-04" },
  { id: "c", label: "C) 6...a6", blockId: "ch5-heading-07" },
  { id: "d", label: "D) 6...Rb8", blockId: "ch5-heading-09" },
  { id: "e", label: "E) 6...Be7", blockId: "ch5-heading-11" },
  { id: "f", label: "F) 6...Nb6", blockId: "ch5-heading-13" },
  { id: "f1", label: "F1) 10...Qb6", blockId: "ch5-heading-14" },
  { id: "f2", label: "F2) 10...Rc8", blockId: "ch5-heading-16" },
  { id: "f3", label: "F3) 10...b5", blockId: "ch5-heading-17" },
  { id: "conclusion", label: "Conclusion", blockId: "ch5-heading-19" },
];
