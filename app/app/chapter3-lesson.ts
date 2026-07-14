import { Chess } from "chess.js";
import type { DiagramLink, LessonBlock, LessonDocument, MoveAnnotation, MoveReference, SourceSpan, VariationMove, VariationNode } from "./lesson-model";

const SOURCE_HASH = "35AD12F7AD89E7474BF434DBC34AB217E297BA20C8BB48BF2F25B45EF5F32E7A";
const P34 = "chapter3-p34-full";
const spanId = (page: number, column: "left" | "right") => `chapter3-p${page}-${column}`;

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

const OPEN = ["d4", "Nf6", "c4", "e6", "g3", "d5", "Nf3", "dxc4", "Bg2", "c6"];
const SIX = [...OPEN, "Ne5"];
const A = [...SIX, "b5", "Nxc6", "Qb6", "Na5"];
const A2 = [...A, "Nd5", "Bd2"];
const A22 = [...A2, "Nc6", "Nxc6", "Qxc6", "e4"];
const B = [...SIX, "Bb4+", "Bd2"];
const B1 = [...B, "Be7", "e3"];
const B2 = [...B, "Qxd4", "Bxb4", "Qxe5", "Na3", "b5"];
const B2_MAIN = [...B2, "Bd6", "Qxb2", "O-O", "Nd5", "e4", "Nc3", "Qh5"];

const lines: VariationNode[] = [
  line("ch3-opening", "Chapter 3 starting line", [], [...OPEN, "Ne5"], spanId(35, "left")),
  line("ch3-minor-nbd7", "The minor 6...Nbd7", SIX, ["Nbd7", "Nxc4", "Nb6", "Ne5", "c5", "Be3", "Nbd5", "dxc5", "Qa5+", "Bd2", "Qxc5", ["Na3", "Na3!"]], spanId(35, "left")),
  line("ch3-minor-be7", "The minor 6...Be7", SIX, ["Be7", "O-O", "O-O", "Nc3", "Nbd7", "Nxc4", "Nb6", "Ne5", "Nfd7", "Nf3", "Nd5", "Bd2", "b6", "e4", "Nxc3", "Bxc3", "Bb7", "Qe2", "a5", "Rfd1"], spanId(35, "right")),
  line("ch3-a", "A) 6...b5 and 8.Na5", SIX, ["b5", "Nxc6", "Qb6", ["Na5", "Na5!"]], spanId(35, "right")),
  line("ch3-a1", "A1) 8...Qxa5+", A, [["Qxa5+", "Qxa5+N"], "Bd2", "c3", "bxc3", "Nd5", "c4", "b4", "cxd5", "exd5", ["Na3", "Na3!"], "Nc6", "Nc2", "Qb5", "a4", "bxa3", "O-O", "Be6", "Re1", "Be7", "Nxa3", "Bxa3", "Rxa3", "O-O", "Qa1", "a5", "e3"], spanId(36, "left")),
  line("ch3-a2-b4", "A2) the 9...b4 sideline", A2, ["b4", "Nxc4", "Qxd4", "Qc2", "Nd7", "Be3", "Qg4", "Nbd2", "Be7", ["Bxa7", "Bxa7!"]], spanId(38, "left")),
  line("ch3-a2-nd7", "A2) the 9...Nd7 line", A2, ["Nd7", "Nc3", "N7f6", "a4", "b4", "Nxc4", "bxc3", "Nxb6", "cxd2+", "Qxd2", "axb6", "O-O", "Ba6", "Rfc1", "Rd8", ["a5", "a5!N"]], spanId(38, "right")),
  line("ch3-a2-na6", "A2) the 9...Na6 line", A2, ["Na6", ["Nc3", "Nc3N"], "Nab4", "Nxd5", "Nxd5", "a4", "Bd7", "axb5", "Bxb5", "O-O", "Be7", "Qe1", "O-O", "e4", "Nf6", "Bc3"], spanId(39, "right")),
  line("ch3-a21", "A21) 9...a6", A2, ["a6", "Nc3", "Nxc3", "Bxc3", "Ra7", ["O-O", "O-ON"], "Rc7", "a3", "Be7", "Qd2", "O-O", "Rfc1", "Bd7", "b3", "cxb3", "Nxb3", "Rfc8", "Ba5", "Rxc1+", "Rxc1", "Rxc1+", "Qxc1", "Qa7", "Bb4"], spanId(40, "left")),
  line("ch3-a22", "A22) 9...Nc6", A2, ["Nc6", "Nxc6", "Qxc6", "e4"], spanId(41, "left")),
  line("ch3-a221", "A221) 11...Nb4", A22, ["Nb4", "O-O", "Bb7", "a4", ["a6", "a6N"], "axb5", "axb5", "d5", "Qb6", "Rxa8+", "Bxa8", "dxe6", "Qxe6", "Nc3", "Bc5", ["Nd5", "Nd5!?"], "Na6", ["b4", "b4!"], "cxb3", "Qxb3", "Bc6", "Rfc1", "O-O", ["Be3", "Be3!"]], spanId(41, "right")),
  line("ch3-a221-bb6", "A221) the 20...Bb6 sideline", [...A22, "Nb4", "O-O", "Bb7", "a4", "a6", "axb5", "axb5", "d5", "Qb6", "Rxa8+", "Bxa8", "dxe6", "Qxe6", "Nc3", "Bc5", "Nd5", "Na6", "b4"], ["Bb6", "Bc3", "O-O", ["Bh3", "Bh3!"]], spanId(42, "left")),
  line("ch3-a222", "A222) 11...Nf6", A22, ["Nf6", "O-O", "Bb7", ["d5", "d5!"], ["Qd7", "Qd7N"], "Bg5", "Be7", ["Bxf6", "Bxf6!"], "gxf6", "Nc3"], spanId(43, "left")),
  line("ch3-a222-qa6", "A222) the ambitious 13...Qa6", [...A22, "Nf6", "O-O", "Bb7", "d5"], ["Qa6", "Bc3", "exd5", "exd5", "O-O-O", ["Bxf6", "Bxf6N"], "Qxf6", "Nc3", "a6", ["Rc1", "Rc1!"]], spanId(43, "left")),
  line("ch3-b", "B) 6...Bb4+", SIX, ["Bb4+", ["Bd2", "Bd2!"]], spanId(44, "left")),
  line("ch3-b1", "B1) 7...Be7", B, ["Be7", "e3"], spanId(44, "right")),
  line("ch3-b11", "B11) 8...O-O", B1, ["O-O", "Nxc4", "c5", "dxc5", "Bxc5", "b4", "Be7", "Qb3", "Qc7", "Nba3", "Bd7", ["b5", "b5!N"], "a6", "b6", "Qc8", "Na5", "Nc6", "N3c4"], spanId(45, "left")),
  line("ch3-b11-b5", "B11) Black's premature 9...b5", [...B1, "O-O", "Nxc4"], [["b5", "b5?!"], ["Ba5", "Ba5!"], "Qe8", "Ne5", "Ba6", ["a3", "a3!N"]], spanId(45, "left")),
  line("ch3-b12", "B12) 8...b5", B1, ["b5", "a4", "b4", "O-O", "Ba6", ["Qc2", "Qc2N"], "c3", "bxc3", "Bxf1", "Kxf1", "bxc3", ["Nxc6", "Nxc6!"], "Nxc6", "Bxc6+", "Nd7", "Bxa8", "Qxa8", "Qxc3", "Qh1+", "Ke2", "O-O", "Qc7", "Rd8", "Be1", "Qxh2", "Nc3"], spanId(45, "right")),
  line("ch3-b2", "B2) 7...Qxd4", B, ["Qxd4", "Bxb4", "Qxe5", "Na3", "b5", ["Bd6", "Bd6!"], "Qxb2", "O-O", "Nd5", "e4", "Nc3", ["Qh5", "Qh5!"]], spanId(46, "right")),
  line("ch3-b21", "B21) 13...Nd7", B2_MAIN, ["Nd7", "e5", "Bb7", "Qg5", "f6", "exf6", "O-O-O", "fxg7", "Rhg8", ["Rae1", "Rae1!"], "Rxg7", "Qe3", "c5", "Bxb7+", "Kxb7", "Qf3+", "Ka6"], spanId(48, "left")),
  line("ch3-b21-nd5", "B21) the 18...Nd5 line", [...B2_MAIN, "Nd7", "e5", "Bb7", "Qg5", "f6", "exf6", "O-O-O", "fxg7", "Rhg8", "Rae1"], ["Nd5", ["Bxd5", "Bxd5!"], ["Rxg7", "Rxg7N"], ["Nxb5", "Nxb5!!"], "Qxb5", "Qxg7"], spanId(48, "left")),
  line("ch3-b21-a6", "B21) the 18...a6 line", [...B2_MAIN, "Nd7", "e5", "Bb7", "Qg5", "f6", "exf6", "O-O-O", "fxg7", "Rhg8", "Rae1"], ["a6", ["Qe3", "Qe3!!"], "Nd5", "Qa7", "c3", "Bxd5", "cxd5", "Rb1", "Qe2", "Rfc1"], spanId(48, "right")),
  line("ch3-b21-mate", "B21) the 26.Qa8 attack", [...B2_MAIN, "Nd7", "e5", "Bb7", "Qg5", "f6", "exf6", "O-O-O", "fxg7", "Rhg8", "Rae1", "Rxg7", "Qe3", "c5", "Bxb7+", "Kxb7", "Qf3+", "Kb6", "Rxe6", "Rg6", "Rfe1", "Ne5", "Be7+", "Rxe6", "Bxd8+"], ["Ka6", ["Qa8", "Qa8!!"], "Nf3+", ["Kh1", "Kh1!"], "Rxe1+", "Kg2", "Rg1+", "Kh3"], spanId(49, "left")),
  line("ch3-b22", "B22) 13...h6", B2_MAIN, [["h6", "h6!?"], "e5", "Bb7", ["Rfb1", "Rfb1!"], "Nxb1", "Raxb1", "Qa2", ["Rxb5", "Rxb5!"], "cxb5", "Bxb7", "a6", "Bxa8", "Qa1+", "Kg2", "Qd4", ["Nc2", "Nc2N"], "Qb6", "Qg4", "g6", "Nd4"], spanId(49, "right")),
];

const byId = (id: string) => {
  const found = lines.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`Missing Chapter 3 line ${id}`);
  return found;
};

function moveRefsInText(text: string, preferredLineId: string, sourceSpanId: string): MoveReference[] {
  type Candidate = MoveReference & { priority: number };
  const candidates: Candidate[] = lines.flatMap((candidateLine) => candidateLine.moves.flatMap((move, moveIndex) => {
    const priority = candidateLine.id === preferredLineId ? 0 : move.sourceSpanId === sourceSpanId ? 1 : 2;
    return [...new Set([move.sourceToken, move.san])].map((source) => ({ source, lineId: candidateLine.id, moveIndex, priority }));
  })).filter((candidate) => candidate.source.length >= 2);
  const references: MoveReference[] = [];
  const used = new Set<string>();
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
    const choices = matches.filter((match) => match.at === earliest).sort((left, right) => {
      const unusedLeft = used.has(`${left.candidate.lineId}:${left.candidate.moveIndex}`) ? 1 : 0;
      const unusedRight = used.has(`${right.candidate.lineId}:${right.candidate.moveIndex}`) ? 1 : 0;
      return right.candidate.source.length - left.candidate.source.length || left.candidate.priority - right.candidate.priority || unusedLeft - unusedRight;
    });
    const selected = choices[0].candidate;
    references.push({ source: selected.source, lineId: selected.lineId, moveIndex: selected.moveIndex });
    used.add(`${selected.lineId}:${selected.moveIndex}`);
    cursor = earliest + selected.source.length;
  }
  return references;
}

const sourceSpans: SourceSpan[] = [
  { id: P34, status: "source-verified", pageIndex: 0, printedPage: 34, column: "full", order: 1, crop: "/source/chapter3/pages/printed-34.png", bbox: { x0: 0, top: 0, x1: 474.96, bottom: 676.08 } },
  ...Array.from({ length: 16 }, (_, index) => (["left", "right"] as const).map((column, offset) => ({
    id: spanId(35 + index, column), status: "source-verified" as const, pageIndex: index + 1, printedPage: 35 + index, column, order: 2 + index * 2 + offset,
    crop: `/source/chapter3/pages/printed-${35 + index}.png`, bbox: { x0: column === "left" ? 35 : 237, top: 50, x1: column === "left" ? 237 : 440, bottom: 640 },
  }))).flat(),
];

type RegionCopy = { id: string; title: string; text: string; lineId: string };
const regionCopy: RegionCopy[] = [
  { id: P34, title: "Chapter 3 · 5...c6 variation index", text: "Variation Index: 1.d4 Nf6 2.c4 e6 3.g3 d5 4.Nf3 dxc4 5.Bg2 c6 6.Ne5. A) 6...b5 7.Nxc6 Qb6 8.Na5!; A1) 8...Qxa5+N; A2) 8...Nd5 9.Bd2; A21) 9...a6; A22) 9...Nc6 10.Nxc6 Qxc6 11.e4; A221) 11...Nb4; A222) 11...Nf6. B) 6...Bb4+ 7.Bd2!; B1) 7...Be7 8.e3; B11) 8...O-O; B12) 8...b5; B2) 7...Qxd4 8.Bxb4 Qxe5 9.Na3 b5 10.Bd6! Qxb2 11.O-O Nd5 12.e4 Nc3 13.Qh5!; B21) 13...Nd7; B22) 13...h6!?", lineId: "ch3-opening" },
  { id: spanId(35, "left"), title: "The principled 6.Ne5", text: "After 5...c6, 6.Ne5 is the most principled continuation: White aims to regain the pawn while maintaining typical Catalan pressure. The minor 6...Nbd7 is met by Nxc4, Ne5 and a timely dxc5; the source improvement 12.Na3! leaves White with a pleasant position.", lineId: "ch3-minor-nbd7" },
  { id: spanId(35, "right"), title: "Minor alternatives and A) 6...b5", text: "Against 6...Be7, White avoids the knight exchange and keeps a clear spatial edge. The chapter's main branch begins with 6...b5 7.Nxc6 Qb6 8.Na5!, Korchnoi's surprising rim-knight idea, supported by pressure on the h1-a8 diagonal.", lineId: "ch3-a" },
  { id: spanId(36, "left"), title: "A1) 8...Qxa5+N", text: "Capturing the knight leads to forced play. After 9.Bd2 c3 10.bxc3, White's central pawns and Catalan bishop give strong compensation; the immediate bishop check is tactically inadequate for Black.", lineId: "ch3-a1" },
  { id: spanId(36, "right"), title: "The unexpected 13.Na3!", text: "After 10...Nd5 11.c4 b4 12.cxd5 exd5, 13.Na3! begins a subtle rerouting. The quieter 13.Bf4 also favours White, but the text aims directly at Black's queenside weaknesses.", lineId: "ch3-a1" },
  { id: spanId(37, "left"), title: "Forcing an inferior structure", text: "The continuation ...Nc6, Nc2 and ...Qb5 leads to 15.a4!, forcing Black to accept an inferior pawn structure. Alternatives permit a central e4 break or material losses.", lineId: "ch3-a1" },
  { id: spanId(37, "right"), title: "Keeping the initiative", text: "After 15...bxa3, 16.O-O! waits for the f8-bishop to move before recapturing. The rook lift and 20.Qa1 leave White with the bishop pair and enduring pressure against a5 and d5.", lineId: "ch3-a1" },
  { id: spanId(38, "left"), title: "A2) 8...Nd5 9.Bd2", text: "The queen grab 9...Qxd4?! is risky, while 9...b4 10.Nxc4 Qxd4 11.Qc2 gives White a dangerous initiative. Black's development problems culminate in the tactical 14.Bxa7!.", lineId: "ch3-a2-b4" },
  { id: spanId(38, "right"), title: "The tactical bishop capture", text: "After ...Nd7, Be3 and ...Qg4, the bishop can take on a7 because ...Qxa7 permits Nd6+. The source then turns to 9...Nd7 10.Nc3 N7f6 11.a4!, exploiting Black's inability to stabilize the queenside.", lineId: "ch3-a2-nd7" },
  { id: spanId(39, "left"), title: "17.a5!N", text: "The 9...Nd7 branch simplifies into a position where White seizes the initiative before Black completes development. In Slugin-Kharlov, 17.a5!N was the winning improvement, fixing the queenside and preparing tactical rook play.", lineId: "ch3-a2-nd7" },
  { id: spanId(39, "right"), title: "The 9...Na6 improvement", text: "Against 9...Na6, 10.Nc3N improves on 10.a4. White meets ...Nab4 with Nxd5 and a4, then uses Qe1 to cover b4 and preserves a pleasant positional edge.", lineId: "ch3-a2-na6" },
  { id: spanId(40, "left"), title: "A21) 9...a6", text: "The promoted main line 9...a6 prepares to move the a8-rook off the Catalan diagonal. After 10.Nc3, capturing on c3 gives White active development and the bishop pair.", lineId: "ch3-a21" },
  { id: spanId(40, "right"), title: "The rook transfer", text: "After 10...Nxc3 11.Bxc3 Ra7, White prevents ...b4 with Rc1 and a3. The central d5 alternative also favours White, while the main plan builds pressure with Qd2 and Rfc1.", lineId: "ch3-a21" },
  { id: spanId(41, "left"), title: "The Catalan bishop stars", text: "The illustrative continuation ...Bd7, b3, cxb3 and Nxb3 reaches a clean positional advantage. 18.Ba5 forces rook exchanges, after which 21.Bb4 highlights the strength of the Catalan bishop.", lineId: "ch3-a21" },
  { id: spanId(41, "right"), title: "A221) 11...Nb4", text: "After A22) 9...Nc6 10.Nxc6 Qxc6 11.e4, 11...Nb4 aims for d3 but loses time. The critical 12.O-O Bb7 13.a4 a6N 14.axb5 axb5 leads to a forceful central break.", lineId: "ch3-a221" },
  { id: spanId(42, "left"), title: "19.Nd5!? and 20.b4!", text: "White can enter d5 before striking with 20.b4!, a welcome tactical resource. The capture 20...cxb3 gives White a healthy extra pawn after Nxb3, while bishop retreats permit a direct attack.", lineId: "ch3-a221" },
  { id: spanId(42, "right"), title: "The point behind White's play", text: "The ...Bb6 sideline allows Bc3, castling and Bh3 with a winning attack. In the main line, Qxb3, Bc6 and Rc1 meet 22...O-O with 23.Be3!, consolidating the extra pawn.", lineId: "ch3-a221-bb6" },
  { id: spanId(43, "left"), title: "A222) 11...Nf6", text: "After 12.O-O Bb7 13.d5!, 13...Qd7N is the most solid response. The ambitious 13...Qa6 permits Bc3 and a favourable central exchange; the source's 16.Bxf6N improvement starts the queenside collapse.", lineId: "ch3-a222" },
  { id: spanId(43, "right"), title: "14.Bg5 and 15.Bxf6!", text: "14.Bg5 Be7 15.Bxf6! is a tactical positional decision. Recapturing with the bishop fails to e5 and Qh5, while 15...gxf6 16.Nc3 leaves White clearly better.", lineId: "ch3-a222" },
  { id: spanId(44, "left"), title: "B) 6...Bb4+ 7.Bd2!", text: "White sacrifices a second pawn for a dangerous initiative. The alternatives 7...Na6 and 7...Bxd2+ are unconvincing, so the chapter divides into B1) 7...Be7 and B2) 7...Qxd4.", lineId: "ch3-b" },
  { id: spanId(44, "right"), title: "B1) 7...Be7 8.e3", text: "The move 8.e3 is the best way to defend d4. The bishop retreat 8.Bc3 is vulnerable, and Black obtains normal play with ...a5 or the exchange-sacrifice idea ...b5.", lineId: "ch3-b1" },
  { id: spanId(45, "left"), title: "B11) 8...O-O and 9...c5", text: "After 9.Nxc4, Black's natural 9...c5 challenges the centre. The premature 9...b5?! is met by 10.Ba5! Qe8 11.Ne5 Ba6 12.a3!N, preparing b2-b4 with a clear positional edge.", lineId: "ch3-b11-b5" },
  { id: spanId(45, "right"), title: "14.b5!N and B12) 8...b5", text: "In the main B11 line, 12...Qc7 13.Nba3 Bd7 14.b5!N prevents ...Bc6 and preserves pressure along h1-a8. The source then turns to the recent trend 8...b5.", lineId: "ch3-b11" },
  { id: spanId(46, "left"), title: "B12's exchange sacrifice", text: "After 9.a4 b4 10.O-O Ba6, 11.Qc2N prepares to regain c4 with the other knight. Black's 11...c3 12.bxc3 Bxf1 13.Kxf1 gives White enduring Catalan compensation.", lineId: "ch3-b12" },
  { id: spanId(46, "right"), title: "14.Nxc6! and B2", text: "The main B12 continuation 13...bxc3 14.Nxc6! leads to balanced material and the more active white game. B2 begins 7...Qxd4 8.Bxb4 Qxe5 9.Na3 b5, Black's only serious continuation.", lineId: "ch3-b2" },
  { id: spanId(47, "left"), title: "10.Bd6!", text: "Tkachiev's 10.Bd6! poses Black serious problems. The queen alternatives ...Qf5 and ...Qh5 are inadequate; 10...Qxb2 is practically forced.", lineId: "ch3-b2" },
  { id: spanId(47, "right"), title: "Blocking the Catalan diagonal", text: "After 11.O-O, Black must block h1-a8 with 11...Nd5. The continuation 12.e4 Nc3 is also forced, because 12...Ne7 cannot answer both Nxb5 and Bxe7.", lineId: "ch3-b2" },
  { id: spanId(48, "left"), title: "B21) 13...Nd7", text: "The line 14.e5 Bb7 15.Qg5 f6 16.exf6 O-O-O 17.fxg7 Rhg8 has been refuted by 18.Rae1!. After 18...Nd5, 19.Bxd5! Rxg7N 20.Nxb5!! breaks through.", lineId: "ch3-b21-nd5" },
  { id: spanId(48, "right"), title: "19.Qe3!!", text: "The source's 18...a6 alternative is met by 19.Qe3!!, when the queen penetrates to a7. The main 19.Qe3 c5 is Black's most stubborn try, but White retains a decisive initiative.", lineId: "ch3-b21-a6" },
  { id: spanId(49, "left"), title: "The 26.Qa8!! attack", text: "After Bxb7+, Qf3 and Black's queen retreat, White's attack contains the spectacular 24.Be7+!, 25.Bxd8+ and 26.Qa8!!. The king walk ends in unavoidable mate.", lineId: "ch3-b21-mate" },
  { id: spanId(49, "right"), title: "B22) 13...h6!?", text: "Black's latest correspondence try is 13...h6!?. White responds 14.e5 Bh7 15.Rfb1!, an exchange sacrifice whose tactical point appears after ...Nxb1 and ...Qa2.", lineId: "ch3-b22" },
  { id: spanId(50, "left"), title: "17.Rxb5!", text: "The exchange sacrifice 17.Rxb5! forces 17...cxb5 18.Bxb7. Both 18...a6 and 18...c3 leave White winning; after 19.Bxa8 Qa1+ 20.Kg2 Qd4 21.Nc2N, the knight joins decisively.", lineId: "ch3-b22" },
  { id: spanId(50, "right"), title: "Conclusion", text: "White is doing well in every variation. Against 6...b5, the updated 9...a6 analysis repeatedly makes the Catalan bishop the star. Against 6...Bb4+ and 7...Qxd4, Tkachiev's 10.Bd6! remains strongest, and the new 13...h6!? correspondence try is answered by a powerful exchange sacrifice on move 15.", lineId: "ch3-b22" },
];

type DiagramSpec = { id: string; sourceSpanId: string; role: string; lineId: string; moveIndex: number };
const diagramSpecs: DiagramSpec[] = [
  { id: "CH3-D01", sourceSpanId: P34, role: "Opening position after 5...c6", lineId: "ch3-opening", moveIndex: 9 },
  { id: "CH3-D02", sourceSpanId: P34, role: "A2 note before 17.a5!N", lineId: "ch3-a2-nd7", moveIndex: 14 },
  { id: "CH3-D03", sourceSpanId: P34, role: "B11 note before 12.a3!N", lineId: "ch3-b11-b5", moveIndex: 4 },
  { id: "CH3-D04", sourceSpanId: P34, role: "B21 note before 26.Qa8!!", lineId: "ch3-b21-mate", moveIndex: 0 },
  { id: "CH3-D05", sourceSpanId: spanId(35, "left"), role: "Position after 6.Ne5", lineId: "ch3-opening", moveIndex: 10 },
  { id: "CH3-D06", sourceSpanId: spanId(35, "right"), role: "A) position after 8.Na5", lineId: "ch3-a", moveIndex: 3 },
  { id: "CH3-D07", sourceSpanId: spanId(36, "left"), role: "A1 after 9...c3", lineId: "ch3-a1", moveIndex: 2 },
  { id: "CH3-D08", sourceSpanId: spanId(36, "right"), role: "A1 before 13.Na3!", lineId: "ch3-a1", moveIndex: 8 },
  { id: "CH3-D09", sourceSpanId: spanId(37, "left"), role: "A1 before 15.a4!", lineId: "ch3-a1", moveIndex: 12 },
  { id: "CH3-D10", sourceSpanId: spanId(37, "right"), role: "A1 after 21.e3", lineId: "ch3-a1", moveIndex: 25 },
  { id: "CH3-D11", sourceSpanId: spanId(38, "left"), role: "A2 position after 9.Bd2", lineId: "ch3-a2-b4", moveIndex: -1 },
  { id: "CH3-D12", sourceSpanId: spanId(38, "right"), role: "A2 before 14.Bxa7!", lineId: "ch3-a2-b4", moveIndex: 8 },
  { id: "CH3-D13", sourceSpanId: spanId(38, "right"), role: "A2 position after 11.a4", lineId: "ch3-a2-nd7", moveIndex: 3 },
  { id: "CH3-D14", sourceSpanId: spanId(39, "left"), role: "A2 before 17.a5!N", lineId: "ch3-a2-nd7", moveIndex: 14 },
  { id: "CH3-D15", sourceSpanId: spanId(39, "right"), role: "A2 after 9...Na6", lineId: "ch3-a2-na6", moveIndex: 0 },
  { id: "CH3-D16", sourceSpanId: spanId(40, "left"), role: "A2 after 10.Nc3N", lineId: "ch3-a2-na6", moveIndex: 1 },
  { id: "CH3-D17", sourceSpanId: spanId(40, "left"), role: "A21 after 10...Nxc3", lineId: "ch3-a21", moveIndex: 2 },
  { id: "CH3-D18", sourceSpanId: spanId(40, "right"), role: "A21 after 11...Ra7", lineId: "ch3-a21", moveIndex: 4 },
  { id: "CH3-D19", sourceSpanId: spanId(41, "left"), role: "A21 before 18.Ba5", lineId: "ch3-a21", moveIndex: 16 },
  { id: "CH3-D20", sourceSpanId: spanId(41, "left"), role: "A22 after 11.e4", lineId: "ch3-a22", moveIndex: 3 },
  { id: "CH3-D21", sourceSpanId: spanId(41, "right"), role: "A221 before 15.d5", lineId: "ch3-a221", moveIndex: 6 },
  { id: "CH3-D22", sourceSpanId: spanId(42, "left"), role: "A221 before 20.b4!", lineId: "ch3-a221", moveIndex: 16 },
  { id: "CH3-D23", sourceSpanId: spanId(42, "right"), role: "A221 before 22.Bh3!", lineId: "ch3-a221-bb6", moveIndex: 2 },
  { id: "CH3-D24", sourceSpanId: spanId(42, "right"), role: "A221 before 23.Be3!", lineId: "ch3-a221", moveIndex: 23 },
  { id: "CH3-D25", sourceSpanId: spanId(43, "left"), role: "A222 after 13...Qd7N", lineId: "ch3-a222", moveIndex: 4 },
  { id: "CH3-D26", sourceSpanId: spanId(43, "left"), role: "A222 before 16.Bxf6N", lineId: "ch3-a222-qa6", moveIndex: 4 },
  { id: "CH3-D27", sourceSpanId: spanId(43, "right"), role: "A222 before 15.Bxf6!", lineId: "ch3-a222", moveIndex: 6 },
  { id: "CH3-D28", sourceSpanId: spanId(44, "left"), role: "B) position after 7.Bd2!", lineId: "ch3-b", moveIndex: 1 },
  { id: "CH3-D29", sourceSpanId: spanId(44, "right"), role: "B1 position after 8.e3", lineId: "ch3-b1", moveIndex: 1 },
  { id: "CH3-D30", sourceSpanId: spanId(45, "left"), role: "B11 before 12.a3!N", lineId: "ch3-b11-b5", moveIndex: 4 },
  { id: "CH3-D31", sourceSpanId: spanId(45, "right"), role: "B11 before 14.b5!N", lineId: "ch3-b11", moveIndex: 10 },
  { id: "CH3-D32", sourceSpanId: spanId(45, "right"), role: "B12 position after 8...b5", lineId: "ch3-b12", moveIndex: 0 },
  { id: "CH3-D33", sourceSpanId: spanId(46, "left"), role: "B12 before 11.Qc2N", lineId: "ch3-b12", moveIndex: 4 },
  { id: "CH3-D34", sourceSpanId: spanId(46, "right"), role: "B12 before 14.Nxc6!", lineId: "ch3-b12", moveIndex: 10 },
  { id: "CH3-D35", sourceSpanId: spanId(47, "left"), role: "B2 before 10.Bd6!", lineId: "ch3-b2", moveIndex: 4 },
  { id: "CH3-D36", sourceSpanId: spanId(47, "right"), role: "B2 before 13.Qh5!", lineId: "ch3-b2", moveIndex: 10 },
  { id: "CH3-D37", sourceSpanId: spanId(48, "left"), role: "B21 before 18.Rae1!", lineId: "ch3-b21", moveIndex: 8 },
  { id: "CH3-D38", sourceSpanId: spanId(48, "left"), role: "B21 before 20.Nxb5!!", lineId: "ch3-b21-nd5", moveIndex: 2 },
  { id: "CH3-D39", sourceSpanId: spanId(48, "right"), role: "B21 before 19.Qe3!!", lineId: "ch3-b21-a6", moveIndex: 0 },
  { id: "CH3-D40", sourceSpanId: spanId(49, "left"), role: "B21 before 26.Qa8!!", lineId: "ch3-b21-mate", moveIndex: 0 },
  { id: "CH3-D41", sourceSpanId: spanId(49, "left"), role: "B21 continuation after 21...Ka6", lineId: "ch3-b21", moveIndex: 16 },
  { id: "CH3-D42", sourceSpanId: spanId(49, "right"), role: "B22 position after 13...h6!?", lineId: "ch3-b22", moveIndex: 0 },
  { id: "CH3-D43", sourceSpanId: spanId(50, "left"), role: "B22 before 17.Rxb5!", lineId: "ch3-b22", moveIndex: 6 },
  { id: "CH3-D44", sourceSpanId: spanId(50, "left"), role: "B22 before 19.Bxa8", lineId: "ch3-b22", moveIndex: 10 },
];

// A diagram that shows the setup position before a line's first move uses the
// final move from the shared A-prefix line instead, keeping every FEN derived.
diagramSpecs.find((item) => item.id === "CH3-D11")!.lineId = "ch3-a";
diagramSpecs.find((item) => item.id === "CH3-D11")!.moveIndex = 3;

export const CHAPTER3_DIAGRAMS: DiagramLink[] = diagramSpecs.map((spec) => {
  const sourceLine = byId(spec.lineId);
  const chess = new Chess(sourceLine.startFen);
  sourceLine.moves.slice(0, spec.moveIndex + 1).forEach((move) => chess.move(move.san));
  return { id: spec.id, associationStatus: "source-verified", positionStatus: "deterministically derived", boardIdentityStatus: "source-verified", sourceSpanId: spec.sourceSpanId, crop: `/source/chapter3/crops/${spec.id}.png`, role: spec.role, lineId: spec.lineId, moveIndex: spec.moveIndex, fen: chess.fen() };
});

const diagramIdsBySpan = new Map<string, string[]>();
for (const diagram of CHAPTER3_DIAGRAMS) diagramIdsBySpan.set(diagram.sourceSpanId, [...(diagramIdsBySpan.get(diagram.sourceSpanId) ?? []), diagram.id]);

const blocks: LessonBlock[] = regionCopy.flatMap((region, index) => {
  const regionBlocks: LessonBlock[] = [
    { id: `ch3-heading-${String(index + 1).padStart(2, "0")}`, type: "heading", status: "source-verified", sourceSpanId: region.id, text: region.title, moveRefs: moveRefsInText(region.title, region.lineId, region.id) },
    { id: `ch3-region-${String(index + 1).padStart(2, "0")}`, type: "variation", status: "source-verified", sourceSpanId: region.id, title: region.title, text: region.text, lineId: region.lineId, moveRefs: moveRefsInText(region.text, region.lineId, region.id) },
  ];
  for (const diagramId of diagramIdsBySpan.get(region.id) ?? []) regionBlocks.push({ id: `${diagramId.toLowerCase()}-block`, type: "diagram", status: "source-verified", sourceSpanId: region.id, diagramId });
  return regionBlocks;
});

export const CHAPTER3_LESSON: LessonDocument = {
  schemaVersion: 2,
  lessonId: "catalan.chapter3.complete",
  status: "source-verified",
  title: "Chapter 3 - Complete",
  subtitle: "The Catalan: 5...c6 with 6...b5 and 6...Bb4+",
  source: { documentId: "catalan.chapter3", filename: "Chapter3_Catalan.pdf", sha256: SOURCE_HASH },
  basePosition: { status: "deterministically derived", after: "Initial position", fen: new Chess().fen(), moves: [] },
  sourceSpans,
  lines,
  diagrams: CHAPTER3_DIAGRAMS,
  blocks,
};

export const CHAPTER3_ANNOTATED_MOVE_IDS = CHAPTER3_LESSON.lines.flatMap((item) => item.moves).filter((move) => move.annotation).map((move) => move.id);
export const CHAPTER3_SECTIONS = [
  { id: "overview", label: "Overview", blockId: "ch3-heading-02" },
  { id: "a", label: "A) 6...b5", blockId: "ch3-heading-03" },
  { id: "a1", label: "A1) 8...Qxa5+", blockId: "ch3-heading-04" },
  { id: "a2", label: "A2) 8...Nd5", blockId: "ch3-heading-08" },
  { id: "a21", label: "A21) 9...a6", blockId: "ch3-heading-12" },
  { id: "a22", label: "A22) 9...Nc6", blockId: "ch3-heading-15" },
  { id: "b", label: "B) 6...Bb4+", blockId: "ch3-heading-20" },
  { id: "b1", label: "B1) 7...Be7", blockId: "ch3-heading-21" },
  { id: "b2", label: "B2) 7...Qxd4", blockId: "ch3-heading-25" },
  { id: "conclusion", label: "Conclusion", blockId: "ch3-heading-33" },
];
