import { Chess } from "chess.js";
import type { DiagramLink, LessonBlock, LessonDocument, MoveAnnotation, MoveReference, SourceSpan, VariationMove, VariationNode } from "./lesson-model";

const SOURCE_HASH = "81A467F058A1AB088F6548A81304450A1FEC00EEC9FC0CFE830E826B5CD22587";
const P51 = "chapter4-p51-full";
const spanId = (page: number, column: "left" | "right") => `chapter4-p${page}-${column}`;

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
  new Chess(fen);
  return { id, label, parentLineId: null, parentPly: 0, startFen: fen, startLabel: label, moves: [] };
}

const OPEN = ["d4", "Nf6", "c4", "e6", "g3", "d5", "Nf3", "dxc4", "Bg2", "Bb4+", "Bd2"];
const A = [...OPEN, "Bxd2+", "Qxd2"];
const B = [...OPEN, "c5", "Bxb4", "cxb4", "Ne5", "O-O"];
const B_A3 = [...B, "a3", "Nc6"];
const B_MAIN = [...B_A3, "Bxc6", "bxc6", "axb4"];
const D = [...OPEN, "a5", "Qc2"];
const D2 = [...D, "Bxd2+", "Qxd2", "c6", "a4"];
const D22 = [...D2, "b5", "axb5", "cxb5", "Qg5", "O-O", "Qxb5", "Ba6", "Qa4", "Qb6", "O-O", "Qxb2", "Nbd2", "Bb5", "Nxc4", "Bxa4", "Nxb2", "Bb5", "Ne5", "Ra7"];

const lines: VariationNode[] = [
  line("ch4-opening", "Chapter 4 starting line", [], OPEN, spanId(52, "left")),
  line("ch4-a", "A) 6...Bxd2+", OPEN, ["Bxd2+", "Qxd2", "O-O", ["Na3", "Na3!"], "Qe7", "Nxc4"], spanId(52, "left")),
  line("ch4-a-b5", "A) the 7...b5 sideline", A, ["b5", ["a4", "a4!N"], "c6", "axb5", "cxb5", "Nc3", "b4", "Nb5", "O-O", "Qxb4"], spanId(52, "left")),
  line("ch4-a-c5", "A) long-term pressure", A, ["O-O", ["Na3", "Na3!"], "c5", "dxc5", "Na6", ["c6", "c6!?"], "bxc6", "Nxc4", "Rb8", "O-O", "Qxd2", "Nfxd2", "c5", ["Nb3", "Nb3N"], "Bd7", "Rfc1"], spanId(52, "right")),
  line("ch4-a-rd8", "A) the accurate rook setup", A, ["O-O", "Na3", "Qe7", "O-O", "c5", "dxc5", "Rd8", "Qc3", "Qxc5", "Qxc4", "Qxc4", "Nxc4", "Nc6", ["Rfd1", "Rfd1N"], "Rd7", "Rac1"], spanId(53, "left")),
  line("ch4-b-nxc4", "B) the older 9.Nxc4 line", B, ["Nxc4", "Nc6", "e3", "e5", "d5", "b5"], spanId(53, "left")),
  line("ch4-b-a3", "B) 9.a3!?", B, [["a3", "a3!?"], "Nc6"], spanId(53, "left")),
  line("ch4-b-nd5", "B) the 9...Nd5 branch", [...B, "a3"], ["Nd5", "Nxc4", "Qc7", "Ne5", "Nc6", "Nxc6", "bxc6", "O-O", "Qb6", ["Qd2", "Qd2N"], "Rd8", "Rd1", "Rb8", "axb4", "Nxb4", "Na3", "Ba6", "Nc2", "Nd5", "Rdc1"], spanId(53, "right")),
  line("ch4-b-main", "B) Gelfand's 10.Bxc6", B_A3, [["Bxc6", "Bxc6N"], "bxc6", "axb4", "Qb6", "O-O", "Qxb4", "Qd2"], spanId(53, "right")),
  line("ch4-b-bb7", "B) the 11...Bb7 game", B_MAIN, ["Bb7", "O-O", "a5", "bxa5", "Rxa5", "Rxa5", "Qxa5", ["Qd2", "Qd2!"], "Qa7", "Nxc4", "Rd8", "Rd1", "c5", "Qa5", "Qxa5", "Nxa5", "Ba8", "Nb3", "cxd4", "Rxd4", "Rb8", "Nc5", "g5", "Nc3"], spanId(54, "left")),
  line("ch4-b-improvement", "B) the 16.Nxc4 improvement", B_MAIN, ["Qb6", "O-O", "Qxb4", "Qd2", "Bb7", "Rc1", "Rfd8", ["Nxc4", "Nxc4N"], "Rac8", "Na5"], spanId(54, "right")),
  sourcePosition("ch4-b-source-position", "B) source position before 16.Nxc4N", "r4rk1/pb3ppp/4pn2/4N3/1ppP4/6P1/1P2PP1P/RNR3K1 w - - 0 16"),
  line("ch4-c", "C) 6...Be7", OPEN, ["Be7", "Qc2", "Bd7", "Ne5", "Nc6", "Nxc6", "Bxc6", "e3", "O-O", "Qxc4"], spanId(55, "left")),
  line("ch4-c-attack", "C) the king-safety plan", [...OPEN, "Be7", "Qc2", "Bd7", "Ne5", "Nc6", "Nxc6", "Bxc6", "e3", "O-O", "Qxc4"], ["Bd5", "Qe2", "c6", ["Be4", "Be4N"], "Qc7", "Qf3", "Rfe8", "h4", "h5", "O-O"], spanId(55, "right")),
  sourcePosition("ch4-c-source-position", "C) source position before 17.O-O-O", "r1q1k2r/pppbbp1p/4p1p1/4P3/6Q1/2B3P1/PP2PPBP/R3K2R w KQkq - 0 17"),
  line("ch4-d-intro", "D) 6...a5 7.Qc2", [], D, spanId(56, "left")),
  line("ch4-d-minor", "D) the minor 7...b5", D, ["b5", "a4", "bxa4", "Ne5", "Ra6", "Qxa4+", "Bd7", "Nxd7", "Qxd7", "O-O", "O-O", "Qxd7", "Nfxd7", ["Rc1", "Rc1N"], "c5", "Rxc4", "cxd4", "Bxb4", "axb4", "Rxa6", "Nxa6", "Rxd4", "Ndc5", "Nd2"], spanId(56, "left")),
  line("ch4-d1", "D1) 7...Nc6", D, ["Nc6", "Qxc4", "Qd5", "Qd3", "Qe4", "Qxe4", "Nxe4", "e3", "Bd7", "O-O", "O-O", "Rc1", ["Rfc8", "Rfc8?"], ["Bxb4", "Bxb4!N"], "axb4", "Ne5", "Nxe5", "dxe5"], spanId(57, "left")),
  line("ch4-d1-qf5", "D1) the 9...Qf5 endgame", D, ["Nc6", "Qxc4", "Qd5", "Qd3", "Qf5", "Qxf5", "exf5", "O-O", "Be6", "Rc1", "Bd5", "e3", "Ne4", "Be1", "O-O", "Nfd2", "Rfe8", "Nc3", "Nxc3", "bxc3", "Bxg2", "cxb4", "Bd5", "b5", "Nb4", "a3", "Nd3", "Rc3", "Nxe1", "Rxe1", "c6", "Rb1"], spanId(56, "right")),
  line("ch4-d1-oo", "D1) the dubious 9...O-O", D, ["Nc6", "Qxc4", "Qd5", "Qd3", ["O-O", "O-O?!"], "Nc3", "Qh5", ["h3", "h3!"], "Rd8", "a3", "Bxc3", "bxc3", "Qg6", "Qxg6", "hxg6", "Bg5", "Rd7", ["Ne5", "Ne5!N"], "Nxe5", "dxe5", "Nd5", "c4", "Nb6", "Rc1"], spanId(56, "right")),
  line("ch4-d2", "D2) 7...Bxd2+ and 9.a4", D, ["Bxd2+", "Qxd2", "c6", "a4"], spanId(58, "left")),
  line("ch4-d2-na3", "D2) the 8...Nc6 sideline", [...D, "Bxd2+", "Qxd2"], ["Nc6", ["Na3", "Na3!N"], "Ne4", "Qc2", "Nd6", "Nxc4", "Nb4", "Qb3", "Nd5", "O-O", "O-O", "Rfe1", "a4", "Qc2", "Nxc4", "Qxc4"], spanId(57, "right")),
  line("ch4-d21-qb6", "D21) the 10...Qb6 alternative", D2, ["Ne4", "Qf4", "Qb6", ["O-O", "O-O!?N"], "Qxb2", "Ne5", "O-O", "Na3", "Nc3", "Qe3", "Nd7", "Nexc4", "Qb4", "Qd3", "Nd5", "e4", "Qc3", "Qd1", "Nb4", "e5", "Qd3", "Qg4"], spanId(58, "right")),
  line("ch4-d21", "D21) 9...Ne4", D2, ["Ne4", "Qf4", "Nd6", "Na3", "Na6", "Ne5", "O-O", "O-O", "Nb4", ["Rfd1", "Rfd1!N"], "f6", "Nexc4", "Nxc4", "Nxc4", "b6", "Rd2", "Ba6", "b3", "Ra7", "e4", "Rd7", "Rad1"], spanId(58, "right")),
  line("ch4-d22", "D22) the forcing 9...b5 line", D2, ["b5", "axb5", "cxb5", "Qg5", "O-O", "Qxb5", "Ba6", "Qa4", ["Qb6", "Qb6!"], "O-O", "Qxb2", "Nbd2", "Bb5", "Nxc4", "Bxa4", "Nxb2", ["Bb5", "Bb5!"], "Ne5", "Ra7"], spanId(59, "right")),
  line("ch4-d22-positional", "D22) the 18.Nd2 regrouping", D22.slice(0, -2), [["Nd2", "Nd2!?"], "Ra7", "Rfe1", "Rc8", ["e3", "e3N"], "Nbd7", "Reb1", "Rc2", "Ne4", "Bc6", "Nxf6+", "gxf6", "Bxc6", "Rxc6", "Na4", "f5", "Ra2"], spanId(60, "right")),
  line("ch4-d22-ra6", "D22) the inferior 18...Ra6", [...D22.slice(0, -1), "Ra6"], ["Nbd3", "Nbd7", "Rfb1", "Nxe5", ["Nc5", "Nc5!"], "Nc6", ["Bxc6", "Bxc6!N"], "Rxc6", "Rxb5", "Re8", ["f4", "f4!"]], spanId(61, "left")),
  line("ch4-d22-a4", "D22) the 22...a4 alternative", D22, ["Nbd3", "Nfd7", "Rfb1", "Nxe5", "Rxb5", "Nxd3", "exd3", "a4"], spanId(61, "right")),
  line("ch4-d22-main", "D22) the main 18...Ra7 line", D22, ["Nbd3", "Nfd7", "Rfb1", "Nxe5", "Rxb5", "Nxd3", "exd3", "Rd8", ["d5", "d5!N"], "a4", ["dxe6", "dxe6N"], "fxe6", ["Ra3", "Ra3!"], "Nd7", "Rb4", "Nf6"], spanId(61, "right")),
];

const byId = (id: string) => {
  const found = lines.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`Missing Chapter 4 line ${id}`);
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
  { id: P51, status: "source-verified", pageIndex: 0, printedPage: 51, column: "full", order: 1, crop: "/source/chapter4/pages/printed-51.png", bbox: { x0: 0, top: 0, x1: 474.96, bottom: 676.08 } },
  ...Array.from({ length: 11 }, (_, index) => (["left", "right"] as const).map((column, offset) => ({
    id: spanId(52 + index, column), status: "source-verified" as const, pageIndex: index + 1, printedPage: 52 + index, column, order: 2 + index * 2 + offset,
    crop: `/source/chapter4/pages/printed-${52 + index}.png`, bbox: { x0: column === "left" ? 35 : 237, top: 50, x1: column === "left" ? 237 : 440, bottom: 640 },
  }))).flat(),
];

type RegionCopy = { id: string; title: string; text: string; lineId: string };
const regionCopy: RegionCopy[] = [
  { id: P51, title: "Chapter 4 · 5...Bb4+ variation index", text: "Variation Index: 1.d4 Nf6 2.c4 e6 3.g3 d5 4.Nf3 dxc4 5.Bg2 Bb4+ 6.Bd2. A) 6...Bxd2+; B) 6...c5; C) 6...Be7; D) 6...a5 7.Qc2; D1) 7...Nc6; D2) 7...Bxd2+ 8.Qxd2 c6 9.a4; D21) 9...Ne4; D22) 9...b5. The three index improvements are 14.Bxb4!N, 14.Rfd1!N and 23.d5!N.", lineId: "ch4-opening" },
  { id: spanId(52, "left"), title: "The purpose of 5...Bb4+ and A) 6...Bxd2+", text: "Black checks before trying to hold the c4-pawn. After 6.Bd2, White must know A) 6...Bxd2+, B) 6...c5, C) 6...Be7 and D) 6...a5. In A, 7.Qxd2 restores the pawn cleanly. The sideline 7...b5 is met by 8.a4!N, when Black's queenside remains a long-term target.", lineId: "ch4-a-b5" },
  { id: spanId(52, "right"), title: "A) Pressure survives the queen trade", text: "The main setup 7...O-O 8.Na3! keeps the Catalan pressure. Against 8...c5, White can use dxc5 and the original 10.c6!?. After bxc6, Nxc4 and the queen trade, 14.Nb3N followed by Rfc1 leaves Black defending a weak queenside structure.", lineId: "ch4-a-c5" },
  { id: spanId(53, "left"), title: "A) The accurate rook setup and B) 6...c5", text: "The alternative 9.O-O c5 10.dxc5 Rd8 also favours White after the accurate rook placement. B) 6...c5 7.Bxb4 cxb4 8.Ne5 O-O reaches sharper play. The older 9.Nxc4 permits e5 and b5, so the chapter changes course with 9.a3!?.", lineId: "ch4-a-rd8" },
  { id: spanId(53, "right"), title: "B) 9.a3!? and the central alternatives", text: "After 9.a3!?, the capture on a3 gives White the kind of stable pull a Catalan player wants. Against 9...Nd5, the sequence Nxc4, Ne5 and Nxc6 leaves Black with weak queenside pawns. The key recommendation against 9...Nc6 is 10.Bxc6N, Gelfand's model-game idea.", lineId: "ch4-b-main" },
  { id: spanId(54, "left"), title: "B) Clarifying the extra pawn", text: "After 10.Bxc6 bxc6 11.axb4, 11...Bb7 leads to a forcing liquidation. The key 15.Qd2! clarifies White's edge; Nxc4, the rook exchange and Nb3 let White coordinate against Black's weak pawns. The resulting ending is a durable Catalan plus.", lineId: "ch4-b-bb7" },
  { id: spanId(54, "right"), title: "B) Two improvements and C) 6...Be7", text: "When Black chooses the more active queen setup, White's rook reaches c1 and 16.Nxc4N preserves a stable advantage. Against the alternative ...Nd5, 16.Nxc4N and 18.Ra5! are equally unpleasant. C) 6...Be7 is less challenging, but its king-safety details still matter.", lineId: "ch4-b-improvement" },
  { id: spanId(55, "left"), title: "C) Develop with tempo", text: "After 6...Be7 7.Qc2, White benefits from an extra tempo compared with familiar Catalan structures. The plan Ne5, Nc3 and pressure on c4 makes natural Black development awkward. A queen trade does not solve Black's problem because White retains the bishop pair and easier play.", lineId: "ch4-c" },
  { id: spanId(55, "right"), title: "C) Black cannot make the king safe", text: "The natural setup with ...c6 is answered by 14.Be4N, Qf3 and h4-h5. Castling kingside permits a direct attack, while queenside castling is also exposed after b4. White can castle long and keep the initiative without taking strategic risks.", lineId: "ch4-c-attack" },
  { id: spanId(56, "left"), title: "D) 6...a5 7.Qc2 and D1) 7...Nc6", text: "The chapter's second major update is 7.Qc2. The minor 7...b5 allows a4 and a favourable liquidation, capped by 14.Rc1N. D1) 7...Nc6 8.Qxc4 Qd5 9.Qd3 reaches an old main line where accurate simplification yields White a pleasant edge.", lineId: "ch4-d-minor" },
  { id: spanId(56, "right"), title: "D1) Two queen choices", text: "Against 9...Qf5, White accepts the queen exchange and uses Rc1, e3 and Nc3 to keep positional pressure. The dubious 9...O-O?! is met by Nc3 and h3!, and after the queens come off the source improvement 16.Ne5!N leaves White clearly better.", lineId: "ch4-d1-oo" },
  { id: spanId(57, "left"), title: "D1) Punishing 13...Rfc8? and D2", text: "After 10.Qxe4 Nxe4 11.e3 Bd7 12.O-O O-O 13.Rc1, the natural 13...Rfc8? is a tactical error. The source improvement 14.Bxb4!N axb4 15.Ne5 Nxe5 16.dxe5 wins at least a pawn. D2 begins with 7...Bxd2+ 8.Qxd2.", lineId: "ch4-d1" },
  { id: spanId(57, "right"), title: "D2) Alternatives before 9.a4", text: "After 8.Qxd2, 8...Nc6 gives White the immediate 9.Na3!N. The plan Qc2, Nxc4 and Rfe1 creates obvious pressure. Against the bishop-development alternative, White again uses Ne5, Na3 and a timely Nxc4 to exploit the Catalan diagonal.", lineId: "ch4-d2-na3" },
  { id: spanId(58, "left"), title: "D21) 9...Ne4", text: "The thematic 9.a4 plans Na3-c4 and creates the split between D21) 9...Ne4 and D22) 9...b5. After 10.Qf4 Nd6, the active 10...Qb6 alternative is met by the new proposal 11.O-O!?N, refusing to give Black easy equality.", lineId: "ch4-d21-qb6" },
  { id: spanId(58, "right"), title: "D21) Rerouting before the pawn recovery", text: "In the main branch, 11.Na3 Na6 12.Ne5 O-O 13.O-O Nb4 is met by 14.Rfd1!N. Provoking ...f6 weakens e6; Nexc4, Nxc4 and Nxc4 then recover the pawn. Rd2 and Rad1 leave White with more space and lasting pressure.", lineId: "ch4-d21" },
  { id: spanId(59, "left"), title: "D21 conclusion and D22) 9...b5", text: "The D21 ending remains solid for Black, but White's space advantage is beyond doubt. D22) 9...b5 is the critical test. After 10.axb5 cxb5 11.Qg5, White immediately targets b5 and g7, making full use of the queen recapture on d2.", lineId: "ch4-d22" },
  { id: spanId(59, "right"), title: "D22) Active defence with 13...Qb6!", text: "The pawn sacrifice 12.Qxg7N is dangerous when Black delays castling. In the main line 12.Qxb5 Ba6 13.Qa4, only 13...Qb6! is active enough. White castles, while the alternative Qxa5 liquidation is harmless and should end peacefully.", lineId: "ch4-d22" },
  { id: spanId(60, "left"), title: "D22) The forcing endgame", text: "After 14.O-O Qxb2 15.Nbd2 Bb5 16.Nxc4 Bxa4 17.Nxb2 Bb5!, the queens disappear and a double-edged ending begins. White's Catalan bishop coordinates the pieces and targets a5, while Black depends on active piece play. The principal choice is 18.Ne5.", lineId: "ch4-d22" },
  { id: spanId(60, "right"), title: "D22) Blocking the a-pawn", text: "The alternative 18.Nd2!? Ra7 19.Rfe1 Rc8 allows the source improvement 20.e3N. Rook doubling and Ne4 force Black into passive defence. White keeps a slight pull because the a5-pawn has been fixed and cannot create counterplay.", lineId: "ch4-d22-positional" },
  { id: spanId(61, "left"), title: "D22) Why 18...Ra6?! is inferior", text: "The rook lift 18...Ra6?! is exposed after 19.Nbd3 Nbd7 20.Rfb1. Following Nxe5, 21.Nc5! and 21...Nc6, the precise 22.Bxc6!N Rxc6 23.Rxb5 Re8 24.f4! denies Black the freeing ...e5 break.", lineId: "ch4-d22-ra6" },
  { id: spanId(61, "right"), title: "D22) The winning-chances novelty", text: "The main 18...Ra7 19.Nbd3 Nfd7 20.Rfb1 leads to Nxe5, Rxb5 and Nxd3. After 22.exd3 Rd8, the source novelty 23.d5!N is the only move that preserves real winning chances. White wins a pawn after the central exchanges.", lineId: "ch4-d22-main" },
  { id: spanId(62, "left"), title: "D22) Converting the structural edge", text: "After 23.d5 a4, 24.dxe6N fxe6 25.Ra3! keeps both rooks active. The continuation Nd7, Rb4 and Nf6 culminates in Rf3, when White combines pressure on the queenside with flexible kingside play.", lineId: "ch4-d22-main" },
  { id: spanId(62, "right"), title: "Conclusion", text: "Chapter 4 makes two significant changes. Against 6...c5, 9.a3!? and the Gelfand idea 10.Bxc6 give White a model Catalan pull. Against 6...a5, the new recommendation 7.Qc2 creates practical pressure in both D1 and D2. Black's system is solid, but these move orders preserve every chance to steer the game in White's favour.", lineId: "ch4-d22-main" },
];

type DiagramSpec = { id: string; sourceSpanId: string; role: string; lineId: string; moveIndex: number };
const diagramSpecs: DiagramSpec[] = [
  { id: "CH4-D01", sourceSpanId: P51, role: "Opening position after 5...Bb4+", lineId: "ch4-opening", moveIndex: 9 },
  { id: "CH4-D02", sourceSpanId: P51, role: "D1 after 13...Rfc8?", lineId: "ch4-d1", moveIndex: 12 },
  { id: "CH4-D03", sourceSpanId: P51, role: "D21 after 13...Nb4", lineId: "ch4-d21", moveIndex: 8 },
  { id: "CH4-D04", sourceSpanId: P51, role: "D22 before 23.d5!N", lineId: "ch4-d22-a4", moveIndex: 7 },
  { id: "CH4-D05", sourceSpanId: spanId(52, "left"), role: "A) position after 7.Qxd2", lineId: "ch4-a", moveIndex: 1 },
  { id: "CH4-D06", sourceSpanId: spanId(52, "left"), role: "A) position after 8.Na3!", lineId: "ch4-a", moveIndex: 3 },
  { id: "CH4-D07", sourceSpanId: spanId(52, "right"), role: "A) long-term queenside pressure", lineId: "ch4-a-c5", moveIndex: 12 },
  { id: "CH4-D08", sourceSpanId: spanId(53, "left"), role: "A) position after 10...Rd8", lineId: "ch4-a-rd8", moveIndex: 6 },
  { id: "CH4-D09", sourceSpanId: spanId(53, "left"), role: "B) position after 9.a3!?", lineId: "ch4-b-a3", moveIndex: 0 },
  { id: "CH4-D10", sourceSpanId: spanId(53, "right"), role: "B) the 9...Nd5 structure", lineId: "ch4-b-nd5", moveIndex: 8 },
  { id: "CH4-D11", sourceSpanId: spanId(54, "left"), role: "B) position after 14...Qxa5", lineId: "ch4-b-bb7", moveIndex: 6 },
  { id: "CH4-D12", sourceSpanId: spanId(54, "left"), role: "B) position after 11...Qb6", lineId: "ch4-b-main", moveIndex: 3 },
  { id: "CH4-D13", sourceSpanId: spanId(54, "right"), role: "B) before 16.Nxc4N", lineId: "ch4-b-source-position", moveIndex: -1 },
  { id: "CH4-D14", sourceSpanId: spanId(54, "right"), role: "C) position after 6...Be7", lineId: "ch4-c", moveIndex: 0 },
  { id: "CH4-D15", sourceSpanId: spanId(55, "left"), role: "C) position after 8...Nc6", lineId: "ch4-c", moveIndex: 4 },
  { id: "CH4-D16", sourceSpanId: spanId(55, "right"), role: "C) before 17.O-O-O", lineId: "ch4-c-source-position", moveIndex: -1 },
  { id: "CH4-D17", sourceSpanId: spanId(56, "left"), role: "D) position after 7.Qc2", lineId: "ch4-d-intro", moveIndex: 12 },
  { id: "CH4-D18", sourceSpanId: spanId(56, "right"), role: "D1) positional queen trade", lineId: "ch4-d1-qf5", moveIndex: 16 },
  { id: "CH4-D19", sourceSpanId: spanId(56, "right"), role: "D1) before 16.Ne5!N", lineId: "ch4-d1-oo", moveIndex: 16 },
  { id: "CH4-D20", sourceSpanId: spanId(57, "left"), role: "D1) before 14.Bxb4!N", lineId: "ch4-d1", moveIndex: 12 },
  { id: "CH4-D21", sourceSpanId: spanId(57, "right"), role: "D2) before 9.Na3!N", lineId: "ch4-d2-na3", moveIndex: 0 },
  { id: "CH4-D22", sourceSpanId: spanId(58, "left"), role: "D2) position after 9.a4", lineId: "ch4-d2", moveIndex: 3 },
  { id: "CH4-D23", sourceSpanId: spanId(58, "left"), role: "D21) the 10...Qb6 alternative", lineId: "ch4-d21-qb6", moveIndex: 2 },
  { id: "CH4-D24", sourceSpanId: spanId(58, "right"), role: "D21 after 13...Nb4", lineId: "ch4-d21", moveIndex: 8 },
  { id: "CH4-D25", sourceSpanId: spanId(59, "left"), role: "D22) position after 9...b5", lineId: "ch4-d22", moveIndex: 0 },
  { id: "CH4-D26", sourceSpanId: spanId(59, "left"), role: "D22) position after 11.Qg5", lineId: "ch4-d22", moveIndex: 3 },
  { id: "CH4-D27", sourceSpanId: spanId(59, "right"), role: "D22) active defence after 13...Qb6!", lineId: "ch4-d22", moveIndex: 8 },
  { id: "CH4-D28", sourceSpanId: spanId(60, "left"), role: "D22) forcing endgame after 17...Bb5!", lineId: "ch4-d22", moveIndex: 16 },
  { id: "CH4-D29", sourceSpanId: spanId(60, "right"), role: "D22) before 20.e3N", lineId: "ch4-d22-positional", moveIndex: 3 },
  { id: "CH4-D30", sourceSpanId: spanId(61, "left"), role: "D22) position after 19...Nfd7", lineId: "ch4-d22-main", moveIndex: 1 },
  { id: "CH4-D31", sourceSpanId: spanId(61, "left"), role: "D22) before 23.d5!N", lineId: "ch4-d22-a4", moveIndex: 7 },
  { id: "CH4-D32", sourceSpanId: spanId(61, "right"), role: "D22) before 24.dxe6N", lineId: "ch4-d22-main", moveIndex: 9 },
  { id: "CH4-D33", sourceSpanId: spanId(62, "left"), role: "D22) before 27.Rf3", lineId: "ch4-d22-main", moveIndex: 15 },
];

export const CHAPTER4_DIAGRAMS: DiagramLink[] = diagramSpecs.map((spec) => {
  const sourceLine = byId(spec.lineId);
  const chess = new Chess(sourceLine.startFen);
  sourceLine.moves.slice(0, spec.moveIndex + 1).forEach((move) => chess.move(move.san));
  return { id: spec.id, associationStatus: "source-verified", positionStatus: "deterministically derived", boardIdentityStatus: "source-verified", sourceSpanId: spec.sourceSpanId, crop: `/source/chapter4/crops/${spec.id}.png`, role: spec.role, lineId: spec.lineId, moveIndex: spec.moveIndex, fen: chess.fen() };
});

const diagramIdsBySpan = new Map<string, string[]>();
for (const diagram of CHAPTER4_DIAGRAMS) diagramIdsBySpan.set(diagram.sourceSpanId, [...(diagramIdsBySpan.get(diagram.sourceSpanId) ?? []), diagram.id]);

const blocks: LessonBlock[] = regionCopy.flatMap((region, index) => {
  const regionBlocks: LessonBlock[] = [
    { id: `ch4-heading-${String(index + 1).padStart(2, "0")}`, type: "heading", status: "source-verified", sourceSpanId: region.id, text: region.title, moveRefs: moveRefsInText(region.title, region.lineId, region.id) },
    { id: `ch4-region-${String(index + 1).padStart(2, "0")}`, type: "variation", status: "source-verified", sourceSpanId: region.id, title: region.title, text: region.text, lineId: region.lineId, moveRefs: moveRefsInText(region.text, region.lineId, region.id) },
  ];
  for (const diagramId of diagramIdsBySpan.get(region.id) ?? []) regionBlocks.push({ id: `${diagramId.toLowerCase()}-block`, type: "diagram", status: "source-verified", sourceSpanId: region.id, diagramId });
  return regionBlocks;
});

export const CHAPTER4_LESSON: LessonDocument = {
  schemaVersion: 2,
  lessonId: "catalan.chapter4.complete",
  status: "source-verified",
  title: "Chapter 4 - Complete",
  subtitle: "The Catalan: 5...Bb4+ with 6...c5, 6...Be7 and 6...a5",
  source: { documentId: "catalan.chapter4", filename: "Chapter4_Catalan.pdf", sha256: SOURCE_HASH },
  basePosition: { status: "deterministically derived", after: "Initial position", fen: new Chess().fen(), moves: [] },
  sourceSpans,
  lines,
  diagrams: CHAPTER4_DIAGRAMS,
  blocks,
};

export const CHAPTER4_ANNOTATED_MOVE_IDS = CHAPTER4_LESSON.lines.flatMap((item) => item.moves).filter((move) => move.annotation).map((move) => move.id);
export const CHAPTER4_SECTIONS = [
  { id: "overview", label: "Overview", blockId: "ch4-heading-02" },
  { id: "a", label: "A) 6...Bxd2+", blockId: "ch4-heading-02" },
  { id: "b", label: "B) 6...c5", blockId: "ch4-heading-04" },
  { id: "c", label: "C) 6...Be7", blockId: "ch4-heading-07" },
  { id: "d", label: "D) 6...a5", blockId: "ch4-heading-10" },
  { id: "d1", label: "D1) 7...Nc6", blockId: "ch4-heading-10" },
  { id: "d2", label: "D2) 7...Bxd2+", blockId: "ch4-heading-12" },
  { id: "d21", label: "D21) 9...Ne4", blockId: "ch4-heading-14" },
  { id: "d22", label: "D22) 9...b5", blockId: "ch4-heading-16" },
  { id: "conclusion", label: "Conclusion", blockId: "ch4-heading-23" },
];
