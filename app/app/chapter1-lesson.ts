import { Chess } from "chess.js";
import { B2_LESSON } from "./b2-lesson";
import { C_ANNOTATED_MOVE_IDS, C_BLOCKS, C_DIAGRAMS, C_LINES, C_SOURCE_SPANS } from "./chapter1-c-interactive";
import type { LessonBlock, LessonDocument, MoveReference, SourceSpan, VariationMove, VariationNode } from "./lesson-model";

const P8L = "chapter1-p08-left";
const P8R = "chapter1-p08-right";
const P9L = "chapter1-p09-left";
const P9R = "chapter1-p09-right";
const P10L = "chapter1-p10-left";
const P10R = "chapter1-p10-right";
const P11L = "chapter1-p11-left";
const P11R = "chapter1-p11-right";
const P12L = "chapter1-p12-left";
const P12R = "chapter1-p12-right";
const P13L = "chapter1-p13-left-b1";

const OPEN = ["d4", "Nf6", "c4", "e6", "g3", "d5", "Nf3"];
const A = [...OPEN, "g6", "Bg2", "Bg7", "O-O", "O-O", "Qc2"];
const B = [...OPEN, "c6", "Bg2", "Nbd7", "O-O", "Bd6", "Nfd2"];
const B_AFTER_8NC3 = [...B, "O-O", "Nc3"];

function fenAfter(moves: string[]): string {
  const chess = new Chess();
  for (const san of moves) chess.move(san);
  return chess.fen();
}

function moves(id: string, sans: string[], span: string, sourceTokens = sans): VariationMove[] {
  return sans.map((san, index) => ({ id: `${id}-${String(index + 1).padStart(2, "0")}`, san, sourceToken: sourceTokens[index] ?? san, sourceSpanId: span }));
}

function root(id: string, label: string, span: string, setup: string[], sans: string[], sourceTokens?: string[]): VariationNode {
  const startFen = fenAfter(setup);
  const verifier = new Chess(startFen);
  for (const san of sans) {
    try { verifier.move(san); }
    catch { throw new Error(`${id}: invalid canonical move ${san}`); }
  }
  return { id, label, parentLineId: null, parentPly: 0, startFen, startLabel: setup.length ? `Position before ${label}` : "Initial position", moves: moves(id, sans, span, sourceTokens) };
}

const line = (id: string, label: string, span: string, setup: string[], sans: string[], sourceTokens?: string[]) => root(id, label, span, setup, sans, sourceTokens);
const refs = (lineId: string, displays: string[]): MoveReference[] => displays.map((source, moveIndex) => ({ source, lineId, moveIndex }));
const selectedRefs = (lineId: string, pairs: Array<[string, number]>): MoveReference[] => pairs.map(([source, moveIndex]) => ({ source, lineId, moveIndex }));

const prefixLines: VariationNode[] = [
  line("chapter-start", "Catalan starting position", P8L, [], OPEN, ["d4", "Nf6", "c4", "e6", "g3", "d5", "Nf3"]),
  line("a-main", "A) 4...g6", P8L, OPEN, ["g6", "Bg2", "Bg7", "O-O", "O-O", "Qc2"]),
  line("a-5-b3", "5.b3!?", P8L, [...OPEN, "g6"], ["b3", "dxc4", "bxc4", "c5"]),
  line("a-7-b6", "7...b6", P8L, A, ["b6", "cxd5", "exd5", "Bf4", "Na6", "Nc3", "c5", "Rfd1", "Bb7", "Be5"]),
  line("a-7-b6-alt", "7...b6 – 11.dxc5", P8L, A, ["b6", "cxd5", "exd5", "Bf4", "Na6", "Nc3", "c5", "Rfd1", "dxc5", "bxc5"]),
  line("a-7-b6-rad1", "7...b6 – 11.Rad1", P8L, A, ["b6", "cxd5", "exd5", "Bf4", "Na6", "Nc3", "c5", "Rad1"]),
  line("a-7-c6", "7...c6", P8R, A, ["c6", "Bf4", "b6", "Nbd2", "c5", "dxc5", "bxc5", "Rad1", "Nbd7", "e4", "Bb7", "Rfe1", "dxe4", "Ng5"]),
  line("a-8-nbd2", "8.Nbd2", P8R, [...A, "c6"], ["Nbd2", "Nbd7", "e4", "dxe4", "Nxe4", "Nxe4", "Qxe4", "Re8"]),
  line("a-8-nh5", "8...Nh5?!", P8R, [...A, "c6", "Bf4"], ["Nh5", "Bg5", "Bf6", "Bxf6", "Nxf6", "Nbd2"]),
  line("a-9-bb7", "9...Bb7", P8R, [...A, "c6", "Bf4", "b6", "Nbd2"], ["Bb7", "e4", "dxe4", "Nxe4", "Nxe4", "Qxe4", "Nd7", "Rad1"]),
  line("a1-main", "A1) 7...Nc6", P9L, A, ["Nc6", "Rd1", "Ne4", "Nc3", "Nxc3", "Qxc3", "Ne7", "Bf4", "f6", "Qc2", "b6", "Rac1", "Bb7", "cxd5", "Nxd5", "Ne1", "Rc8", "Nd3", "Qe7", "Qc4"]),
  line("a1-ne7", "8...Ne7", P9L, [...A, "Nc6", "Rd1"], ["Ne7", "Nc3", "b6", "Ne5", "Bb7", "cxd5", "exd5", "b4", "c6", "a4"]),
  line("a1-10-e4", "10.e4", P9L, [...A, "Nc6", "Rd1", "Ne7", "Nc3", "b6"], ["e4", "dxe4", "Nxe4", "Nxe4", "Qxe4", "Bb7"]),
  line("a1-11-nfxd5", "11...Nfxd5", P9L, [...A, "Nc6", "Rd1", "Ne7", "Nc3", "b6", "Ne5", "Bb7", "cxd5"], ["Nfxd5", "e4", "Nxc3", "bxc3"]),
  line("a2-main", "A2) 7...Na6", P10L, A, ["Na6", "Rd1", "b6", "cxd5", "exd5", "Nc3", "Bb7", "Bf4", "c5", "Be5"]),
  line("a2-c5", "8...c5N", P10L, [...A, "Na6", "Rd1"], ["c5", "dxc5", "Qa5", "Nc3", "Qxc5", "cxd5", "Nxd5", "Qb3", "Nxc3", "bxc3", "Qxc3", "Qxc3", "Bxc3", "Rb1", "Bg7", "Ba3", "Re8", "Ng5"]),
  line("a2-10-dxc4", "10...dxc4", P10L, [...A, "Na6", "Rd1", "c5", "dxc5", "Qa5", "Nc3"], ["dxc4", "Bf4", "Nd5", "Bd6", "Rd8", "Nd2"]),
  line("a2-12-qb4", "12...Qb4", P10L, [...A, "Na6", "Rd1", "c5", "dxc5", "Qa5", "Nc3", "Qxc5", "cxd5", "Nxd5", "Qb3"], ["Qb4", "Bd2", "Qxb3", "axb3"]),
  line("a2-9-nxd5", "9...Nxd5?", P10L, [...A, "Na6", "Rd1", "b6", "cxd5"], ["Nxd5", "e4", "Ndb4", "Qe2"], ["Nxd5?", "e4", "Nb4", "Qe2±"]),
  line("a3-main", "A3) 7...Nbd7", P10R, A, ["Nbd7", "Bf4", "b6", "Nc3", "Bb7", "cxd5", "Nxd5", "Nxd5", "Bxd5", "e4", "Bb7", "Rad1"]),
  line("a3-b6", "8...b6", P10R, [...A, "Nbd7", "Bf4"], ["b6", "cxd5", "Nxd5", "Bg5", "Qe8", "e4", "Nb4", "Qxc7", "Ba6"]),
  line("a3-re8", "9...Re8", P11L, [...A, "Nbd7", "Bf4", "c6", "Nbd2"], ["Re8", "Rfd1", "Nh5", "Bd6", "f5", "e3"]),
  line("a3-qe7", "9...Qe7", P11L, [...A, "Nbd7", "Bf4", "c6", "Nbd2"], ["Qe7", "e4", "h6", "c5"]),
  line("b-main", "B) 4...c6", P11R, OPEN, ["c6", "Bg2", "Nbd7", "O-O", "Bd6", "Nfd2"]),
  line("b-structure", "B structure", P12L, B, ["O-O", "Nc3"]),
  line("b-7-oo", "7...e5", P11R, B, ["e5", "cxd5", "cxd5", "dxe5", "Nxe5", "Nc3", "Be6", "Nb3", "Bb4", "Bf4", "Nc6", "Rc1", "O-O", "Qd3"]),
  line("b-7-e5", "7...e5", P11R, B, ["e5", "cxd5", "cxd5"]),
  line("b-8-nxd5", "8...Nxd5N", P11R, [...B, "O-O", "cxd5"], ["Nxd5", "Nc4", "Bc7", "Nc3", "Nxc3", "bxc3"]),
  line("b-easy", "Easy development", P12L, B_AFTER_8NC3, ["Bc7", "e4", "dxe4", "Ndxe4", "h6", "Nxf6+", "Nxf6", "Be3", "e5", "d5", "cxd5", "Nxd5", "Nxd5", "Bxd5", "Qe7", "Qf3"]),
  line("b-9-dxc4", "9...dxc4", P12L, [...B_AFTER_8NC3, "Bc7", "e4"], ["dxc4", "Nxc4", "e5", "d5", "Nb6", "Ne3", "Qe7", "b3"]),
  line("b1-main", "B1) 8...Re8", P12R, B_AFTER_8NC3, ["Re8", "e4", "dxe4", "Ndxe4", "Nxe4", "Nxe4", "Be7", "Bf4", "Nf6", "Nc3", "Bd6", "Be5", "Qc7", "f4", "Rd8", "Qf3", "Ne8", "Rad1", "f6", "c5", "Bxe5", "fxe5", "f5", "Ne4"]),
  line("b1-e5", "9...e5?!", P12R, [...B_AFTER_8NC3, "Re8", "e4"], ["e5", "exd5", "cxd5", "Nxd5", "exd4", "Nf3", "Nxd5", "cxd5"]),
  line("b1-10-exd4", "10...exd4", P12R, [...B_AFTER_8NC3, "Re8", "e4", "e5", "exd5"], ["exd4", "Nce4", "Nxe4", "Nxe4", "Be5", "Ng5"]),
  line("b1-17-c5", "17.c5N", P13L, [...B_AFTER_8NC3, "Re8", "e4", "dxe4", "Ndxe4", "Nxe4", "Nxe4", "Be7", "Bf4", "Nf6", "Nc3", "Bd6", "Be5", "Qc7", "f4", "Rd8", "Qf3", "Ne8"], ["c5", "Bxe5", "dxe5"]),
  line("b2-entry", "B2) 8...Bb4", "chapter1-p13-left-b2", B_AFTER_8NC3, ["Bb4"]),
];

const spans: SourceSpan[] = [
  { id: P8L, status: "source-verified", pageIndex: 1, printedPage: 8, column: "left", order: 1, crop: "/source/pages/printed-08.png", bbox: { x0: 35, top: 55, x1: 237, bottom: 640 } },
  { id: P8R, status: "source-verified", pageIndex: 1, printedPage: 8, column: "right", order: 2, crop: "/source/pages/printed-08.png", bbox: { x0: 237, top: 55, x1: 440, bottom: 640 } },
  { id: P9L, status: "source-verified", pageIndex: 2, printedPage: 9, column: "left", order: 3, crop: "/source/pages/printed-09.png", bbox: { x0: 35, top: 55, x1: 237, bottom: 640 } },
  { id: P9R, status: "source-verified", pageIndex: 2, printedPage: 9, column: "right", order: 4, crop: "/source/pages/printed-09.png", bbox: { x0: 237, top: 55, x1: 440, bottom: 640 } },
  { id: P10L, status: "source-verified", pageIndex: 3, printedPage: 10, column: "left", order: 5, crop: "/source/pages/printed-10.png", bbox: { x0: 35, top: 55, x1: 237, bottom: 640 } },
  { id: P10R, status: "source-verified", pageIndex: 3, printedPage: 10, column: "right", order: 6, crop: "/source/pages/printed-10.png", bbox: { x0: 237, top: 55, x1: 440, bottom: 640 } },
  { id: P11L, status: "source-verified", pageIndex: 4, printedPage: 11, column: "left", order: 7, crop: "/source/pages/printed-11.png", bbox: { x0: 35, top: 55, x1: 237, bottom: 640 } },
  { id: P11R, status: "source-verified", pageIndex: 4, printedPage: 11, column: "right", order: 8, crop: "/source/pages/printed-11.png", bbox: { x0: 237, top: 55, x1: 440, bottom: 640 } },
  { id: P12L, status: "source-verified", pageIndex: 5, printedPage: 12, column: "left", order: 9, crop: "/source/pages/printed-12.png", bbox: { x0: 35, top: 55, x1: 237, bottom: 640 } },
  { id: P12R, status: "source-verified", pageIndex: 5, printedPage: 12, column: "right", order: 10, crop: "/source/pages/printed-12.png", bbox: { x0: 237, top: 55, x1: 440, bottom: 640 } },
  { id: P13L, status: "source-verified", pageIndex: 6, printedPage: 13, column: "left", order: 11, crop: "/source/pages/printed-13.png", bbox: { x0: 35, top: 55, x1: 237, bottom: 355 } },
  ...B2_LESSON.sourceSpans.map((span, index) => ({ ...span, order: 12 + index })),
];

const prefixBlocks: LessonBlock[] = [
  { id: "ch1-start", type: "move-sequence", status: "source-verified", sourceSpanId: P8L, text: "1.d4 Nf6 2.c4 e6 3.g3 d5 4.Nf3", moveRefs: refs("chapter-start", ["1.d4", "Nf6", "2.c4", "e6", "3.g3", "d5", "4.Nf3"]) },
  { id: "ch1-intro", type: "prose", status: "source-verified", sourceSpanId: P8L, text: "This is our starting position for the Catalan, which is the primary topic of this book. In this chapter we will analyse three options that I neglected to mention in GM 1: A) 4...g6, B) 4...c6 and C) 4...c5." },
  { id: "a-heading", type: "heading", status: "source-verified", sourceSpanId: P8L, text: "A) 4...g6", moveRefs: selectedRefs("a-main", [["4...g6", 0]]) },
  { id: "a-intro", type: "prose", status: "source-verified", sourceSpanId: P8L, text: "This looks like an odd choice, but it has been played quite a lot in recent years, including by some strong grandmasters." },
  { id: "a-5-bg2", type: "move-sequence", status: "source-verified", sourceSpanId: P8L, text: "5.Bg2", moveRefs: selectedRefs("a-main", [["5.Bg2", 1]]) },
  { id: "a-b3", type: "variation", status: "source-verified", sourceSpanId: P8L, title: "Initially: 5.b3!?", lineId: "a-5-b3", text: "Initially I was drawn to 5.b3!? with the idea to develop the bishop to a3, but I soon realized that 5...dxc4!N 6.bxc4 c5 offers Black interesting play.", moveRefs: refs("a-5-b3", ["5.b3!?", "5...dxc4!N", "6.bxc4", "c5"]) },
  { id: "a-main-sequence", type: "move-sequence", status: "source-verified", sourceSpanId: P8L, text: "5...Bg7 6.O-O O-O 7.Qc2", moveRefs: selectedRefs("a-main", [["5...Bg7", 2], ["6.O-O", 3], ["O-O", 4], ["7.Qc2", 5]]) },
  { id: "a-options", type: "prose", status: "source-verified", sourceSpanId: P8L, text: "From this position Black can arrange his pieces in all kinds of ways, but I have focused on the three knight developments: A1) 7...Nc6, A2) 7...Na6 and A3) 7...Nbd7. A couple of other ideas include:" },
  { id: "a-b6", type: "variation", status: "source-verified", sourceSpanId: P8L, title: "Other idea: 7...b6", lineId: "a-7-b6", text: "7...b6 8.cxd5 exd5 9.Bf4 Na6 10.Nc3 c5 leads to an interesting version of a Queen’s Indian, with the bishop on g7 instead of e7. 11.Rfd1N (The premature 11.dxc5?! occurred in Unapkoshvili - Kobeshavidze, Batumi 2010, when 11...bxc5N would have been fine for Black; 11.Rad1!?N could also be considered) 11...Bb7 12.Be5± The same position is reached at the end of variation A2 below.", moveRefs: refs("a-7-b6", ["7...b6", "8.cxd5", "exd5", "9.Bf4", "Na6", "10.Nc3", "c5", "11.Rfd1N", "11...Bb7", "12.Be5±"]).concat(refs("a-7-b6-alt", ["11.dxc5?!", "11...bxc5N"])).concat(refs("a-7-b6-rad1", ["11.Rad1!?N"])) },
  { id: "a-c6", type: "variation", status: "source-verified", sourceSpanId: P8R, title: "Other idea: 7...c6", lineId: "a-7-c6", text: "7...c6 This position has occurred many times in practice, but I was surprised to see that hardly anyone has played: 8.Bf4!? The more popular 8.Nbd2 Nbd7 9.e4 dxe4 10.Nxe4 Nxe4 11.Qxe4 has achieved terrific results for White, but after 11...Re8∞ the situation seems rather double-edged to me. 8...b6N This is the most logical reply, and a definite improvement over 8...Nh5?!, when 9.Bg5 Bf6 10.Bxf6 Nxf6 11.Nbd2 obviously favoured White in Boege - Azzi, corr. 2014. 9.Nbd2 c5 9...Bb7 10.e4 dxe4 11.Nxe4 Nxe4 12.Qxe4 Nd7 13.Rad1± gives White a pleasant space advantage. 10.dxc5 bxc5 11.Rad1 White has a promising position, for instance: 11...Nbd7 12.e4 Bb7 13.Rfe1! dxe4 (13...d4 14.Bd6 would be annoying for Black) 14.Ng5 White is in good shape, as he will recapture the pawn while keeping a better structure.", moveRefs: refs("a-7-c6", ["7...c6", "8.Bf4!?", "8...b6N", "9.Nbd2", "c5", "10.dxc5", "bxc5", "11.Rad1", "11...Nbd7", "12.e4", "Bb7", "13.Rfe1!", "dxe4", "14.Ng5"]) },

  { id: "a1-heading", type: "heading", status: "source-verified", sourceSpanId: P9L, text: "A1) 7...Nc6 8.Rd1", moveRefs: selectedRefs("a1-main", [["7...Nc6", 0], ["8.Rd1", 1]]) },
  { id: "a1-main", type: "variation", status: "source-verified", sourceSpanId: P9L, title: "Main line: 8...Ne4", lineId: "a1-main", text: "8...Ne4 Black intends to exchange a pair of knights. 9.Nc3 Nxc3 10.Qxc3 Ne7 I was surprised to see that the Bosnian grandmaster Bojan Kurajica has defended this position against three opponents, all of whom chose different moves. My personal preference is: 11.Bf4 f6 Now I would like to propose an improvement over Tukmakov - Kurajica, Cetinje 1991. 12.Qc2N b6 (12...c6 13.e4 obviously looks great for White.) 13.Rac1 Bb7 14.cxd5 Nxd5 15.Ne1 Rc8 16.Nd3 Qe7 17.Qc4 White enjoys a stable edge.", moveRefs: selectedRefs("a1-main", [["8...Ne4", 2], ["9.Nc3", 3], ["Nxc3", 4], ["10.Qxc3", 5], ["Ne7", 6], ["11.Bf4", 7], ["f6", 8], ["12.Qc2N", 9], ["b6", 10], ["13.Rac1", 11], ["Bb7", 12], ["14.cxd5", 13], ["Nxd5", 14], ["15.Ne1", 15], ["Rc8", 16], ["16.Nd3", 17], ["Qe7", 18], ["17.Qc4", 19]]) },
  { id: "a1-ne7", type: "variation", status: "source-verified", sourceSpanId: P9L, title: "Another idea: 8...Ne7", lineId: "a1-ne7", text: "Another idea is: 8...Ne7 9.Nc3 b6 10.Ne5 (10.e4 dxe4 11.Nxe4 Nxe4 12.Qxe4 Bb8∞ followed by ...Bb7 is not so clear) 10...Bb7 11.cxd5 exd5N This looks natural. (The only game went 11...Nfxd5, Kekki - Merriman, London 1989, and now the obvious 12.e4 Nxc3 13.bxc3± would have given White the better game) 12.b4 c6 13.a4± White has the more comfortable side of a complex game.", moveRefs: refs("a1-ne7", ["8...Ne7", "9.Nc3", "b6", "10.Ne5", "10...Bb7", "11.cxd5", "exd5N", "12.b4", "c6", "13.a4±"]) },
  { id: "a2-heading", type: "heading", status: "source-verified", sourceSpanId: P9R, text: "A2) 7...Na6 8.Rd1", moveRefs: selectedRefs("a2-main", [["7...Na6", 0], ["8.Rd1", 1]]) },
  { id: "a2-note", type: "prose", status: "source-verified", sourceSpanId: P9R, text: "8.a3 has been played more frequently, but it is hardly necessary, as ...Nb4 is not a threat just now." },
  { id: "a2-grunfeld", type: "variation", status: "source-verified", sourceSpanId: P10L, title: "Grünfeld-like approach", lineId: "a2-c5", text: "8...b6 White is ready for the Grünfeld-like approach: 8...c5N 9.dxc5 Qa5 10.Nc3! Qxc5. Or 10...dxc4 11.Bf4 Nd5 12.Bd6 Rd8 13.Nd2! with the better game for White. 11.cxd5 Nxd5 (11...exd5? 12.Be3± is unpleasant for Black) 12.Qb3 Nxc3. 12...Qb4 13.Bd2 Qxb3 14.axb3± White retains annoying pressure. 13.bxc3 Qxc3 14.Qxc3 Bxc3 15.Rb1 Bg7 16.Ba3 Re8 17.Ng5 Black is doomed to a passive defence and White can play for two results.", moveRefs: selectedRefs("a2-c5", [["8...c5N", 0], ["9.dxc5", 1], ["Qa5", 2], ["10.Nc3!", 3], ["Qxc5", 4], ["11.cxd5", 5], ["Nxd5", 6], ["12.Qb3", 7], ["Nxc3", 8], ["13.bxc3", 9], ["Qxc3", 10], ["14.Qxc3", 11], ["Bxc3", 12], ["15.Rb1", 13], ["Bg7", 14], ["16.Ba3", 15], ["Re8", 16], ["17.Ng5", 17]]) },
  { id: "a2-main", type: "variation", status: "source-verified", sourceSpanId: P10L, title: "Main recommendation: 9.cxd5N", lineId: "a2-main", text: "9.cxd5N This natural novelty improves over 9.a3 c5 10.Nc3 Bb7∞ as in Recuero Guerra - Narciso Dublan, Don Benito 2012, when the position resembles the main line below, but a2-a3 is a redundant move. 9...exd5 White would be happy to see 9...Nxd5? 10.e4 Nb4 11.Qe2±. 10.Nc3 Bb7 11.Bf4 c5 12.Be5± The position is complex, but I like White’s chances against the potentially hanging pawns, and the bishop on e5 does a good job of neutralizing its counterpart on g7.", moveRefs: selectedRefs("a2-main", [["9.cxd5N", 3], ["9...exd5", 4], ["10.Nc3", 5], ["Bb7", 6], ["11.Bf4", 7], ["c5", 8], ["12.Be5±", 9]]) },

  { id: "a3-heading", type: "heading", status: "source-verified", sourceSpanId: P10R, text: "A3) 7...Nbd7", moveRefs: selectedRefs("a3-main", [["7...Nbd7", 0]]) },
  { id: "a3-main", type: "variation", status: "source-verified", sourceSpanId: P10R, title: "A3 plans after 8.Bf4", lineId: "a3-main", text: "8.Bf4 c6 I also considered: 8...b6 9.Nc3N. The tempting 9.cxd5 led to success for White in Ortega Hermida - Perez Castellano, Gran Canaria 2009, but things would not have been so clear after 9...Nxd5N, intending 10.Bg5 Qe8! (10...f6? 11.Qc6! wins material) 11.e4 Nb4 12.Qxc7 Ba6 with a lot of counterplay. 9...Bb7 10.cxd5! This is a more favourable moment to release the tension. 10...Nxd5 (10...exd5? is bad in view of 11.Nb5±) 11.Nxd5 Bxd5 12.e4 Bb7 13.Rad1 White is obviously better.", moveRefs: selectedRefs("a3-main", [["8.Bf4", 1], ["8...b6", 2], ["9.Nc3N", 3], ["9...Bb7", 4], ["10.cxd5!", 5], ["10...Nxd5", 6], ["11.Nxd5", 7], ["Bxd5", 8], ["12.e4", 9], ["Bb7", 10], ["13.Rad1", 11]]) },
  { id: "a3-re8", type: "variation", status: "source-verified", sourceSpanId: P11L, title: "Alternative: 9...Re8", lineId: "a3-re8", text: "9.Nbd2 Re8. 9...Qe7 10.e4 h6 11.c5± was great for White in Hübner - Schmittdiel, Germany 1993. 10.Rfd1 Nh5 11.Bd6 f5 12.e3± In Srebrnic - S. Nikolic, Ptuj 2009, White had a pleasant position against the Stonewall formation, with an easy plan of attacking on the queenside.", moveRefs: refs("a3-re8", ["9...Re8", "10.Rfd1", "Nh5", "11.Bd6", "f5", "12.e3±"]) },

  { id: "b-heading", type: "heading", status: "source-verified", sourceSpanId: P11L, text: "B) 4...c6", moveRefs: selectedRefs("b-main", [["4...c6", 0]]) },
  { id: "b-intro", type: "prose", status: "source-verified", sourceSpanId: P11L, text: "I neglected to mention this option in GM 1, although I did rectify the oversight by publishing an update on the Quality Chess website. The text move might quickly transpose to a line examined elsewhere in the book, but it may also prepare a Closed Catalan set-up with the bishop on d6 instead of e7." },
  { id: "b-main", type: "variation", status: "source-verified", sourceSpanId: P11R, title: "Development to 7.Nfd2!", lineId: "b-main", text: "5.Bg2 Nbd7. 5...dxc4 leads straight to Chapter 3. 6.O-O Bd6. 6...dxc4 transposes to variation B of Chapter 5, while 6...Be7 7.Qc2 O-O takes us to variation B2 of Chapter 15. 7.Nfd2! A small refinement. In the aforementioned update I recommended 7.Nc3 O-O 8.Nd2!, but if White opts for that move order he should reckon with the possibility of 7...dxc4.", moveRefs: refs("b-main", ["4...c6", "5.Bg2", "Nbd7", "6.O-O", "Bd6", "7.Nfd2!"]) },
  { id: "b-7-oo", type: "variation", status: "source-verified", sourceSpanId: P11R, title: "The critical try: 7...e5", lineId: "b-7-oo", text: "7...O-O The only real way for Black to question White’s last move is: 7...e5 This looks slightly premature, even though it was played by Radjabov. 8.cxd5 cxd5 (8...Nxd5N 9.Nc4 Bc7 10.Nc3 Nxc3 11.bxc3 looks great for White.) 9.dxe5 Nxe5 10.Nc3 Be6 We have been following Grischuk - Radjabov, Moscow 2012, and here White should have played: 11.Nb3!N 11...Bb4 (11...O-O?! 12.Bg5 wins a pawn.) 12.Bf4 Nc6 13.Rc1 O-O 14.Qd3 White has a nice positional edge.", moveRefs: refs("b-7-oo", ["7...e5", "8.cxd5", "cxd5", "9.dxe5", "Nxe5", "10.Nc3", "Be6", "11.Nb3!N", "11...Bb4", "12.Bf4", "Nc6", "13.Rc1", "O-O", "14.Qd3"]) },
  { id: "b-8-nc3", type: "move-sequence", status: "source-verified", sourceSpanId: P12L, text: "8.Nc3", moveRefs: selectedRefs("b-structure", [["8.Nc3", 1]]) },
  { id: "b-options", type: "prose", status: "source-verified", sourceSpanId: P12L, text: "Many moves have been tried here, but in most cases White simply plays e2-e4 with an easy game. We will look at the most popular B1) 8...Re8 followed by the slightly more challenging B2) 8...Bb4." },
  { id: "b-easy", type: "variation", status: "source-verified", sourceSpanId: P12L, title: "An easy advantage: 8...Bc7", lineId: "b-easy", text: "Here is a brief example of a line where White gets an easy advantage: 8...Bc7 9.e4 dxe4. 9...dxc4 10.Nxc4 e5 11.d5 Nb6 12.Ne3! The knight is perfectly placed here. 12...Qe7 13.b3 White had a pleasant advantage in Evans - Zielinski, email 2010. 10.Ndxe4 White is clearly better. One model example continued: 10...h6 11.Nxf6+ (11.f4!? has also been played, and is a worthy alternative.) 11...Nxf6 12.Be3 e5 13.d5! cxd5 14.Nxd5 Nxd5 15.Bxd5 Qe7 16.Qf3± Despite the simplifications, White’s advantage was obvious in Koziak - Nalbantoglu, Izmir 2013.", moveRefs: refs("b-easy", ["8...Bc7", "9.e4", "dxe4", "10.Ndxe4", "10...h6", "11.Nxf6+", "11...Nxf6", "12.Be3", "e5", "13.d5!", "cxd5", "14.Nxd5", "Nxd5", "15.Bxd5", "Qe7", "16.Qf3±"]) },
  { id: "b1-heading", type: "heading", status: "source-verified", sourceSpanId: P12R, text: "B1) 8...Re8 9.e4", moveRefs: selectedRefs("b1-main", [["8...Re8", 0], ["9.e4", 1]]) },
  { id: "b1-main", type: "variation", status: "source-verified", sourceSpanId: P12R, title: "Main line: 9...dxe4", lineId: "b1-main", text: "9...dxe4 Black is not ready to strike in the centre with 9...e5?! in view of 10.exd5 cxd5 (or 10...exd4 11.Nce4 Nxe4 12.Nxe4 Be5 13.Ng5! with a strong initiative) 11.Nxd5 exd4 12.Nf3 Nxd5 13.cxd5± when the d4-pawn is falling, Sundararajan - Prakash, Calcutta 2008. 10.Ndxe4 Nxe4 11.Nxe4 Be7 12.Bf4 Nf6 13.Nc3! By avoiding the unnecessary exchange, White obtains a dream advantage, and the c8-bishop will remain passive for a long time. 13...Bd6 14.Be5! This is an important detail, which is worth remembering in similar positions. White is much better, and I will mention a recent example.", moveRefs: selectedRefs("b1-main", [["9...dxe4", 2], ["10.Ndxe4", 3], ["Nxe4", 4], ["11.Nxe4", 5], ["Be7", 6], ["12.Bf4", 7], ["Nf6", 8], ["13.Nc3!", 9], ["13...Bd6", 10], ["14.Be5!", 11]]) },
  { id: "b1-finish", type: "variation", status: "source-verified", sourceSpanId: P13L, title: "The positional trap", lineId: "b1-main", text: "14...Qc7 15.f4 Rd8 16.Qf3 Ne8 17.Rad1. 17.c5N Bxe5 18.dxe5 also gives White a big advantage. The text move sets a positional trap, into which Black now falls. 17...f6? 18.c5! Bxe5 19.fxe5 f5 20.Ne4! With the knight coming to d6 next, White had a crushing advantage in Jakovenko - Rydstrom, Gibraltar 2015.", moveRefs: selectedRefs("b1-main", [["14...Qc7", 12], ["15.f4", 13], ["Rd8", 14], ["16.Qf3", 15], ["Ne8", 16], ["17.Rad1", 17], ["17...f6?", 18], ["18.c5!", 19], ["Bxe5", 20], ["19.fxe5", 21], ["f5", 22], ["20.Ne4!", 23]]) },
];

const b2Lines = B2_LESSON.lines.map((item) => item.parentLineId ? item : { ...item, startFen: B2_LESSON.basePosition.fen, startLabel: "After 8...Bb4" });
const b2Blocks = B2_LESSON.blocks.map((block) => block.id === "b2-heading" ? { ...block, moveRefs: selectedRefs("b2-entry", [["8...Bb4", 0]]) } : block);

export const CHAPTER1_LESSON: LessonDocument = {
  ...B2_LESSON,
  lessonId: "catalan.chapter1.complete",
  title: "Chapter 1 - Complete",
  subtitle: "The Catalan: 4...g6, 4...c6, and 4...c5",
  basePosition: { status: "deterministically derived", after: "Initial position", fen: new Chess().fen(), moves: [] },
  sourceSpans: [...spans, ...C_SOURCE_SPANS],
  lines: [...prefixLines, ...b2Lines, ...C_LINES],
  blocks: [...prefixBlocks, ...b2Blocks, ...C_BLOCKS],
  diagrams: [...B2_LESSON.diagrams, ...C_DIAGRAMS],
};

export const CHAPTER1_ANNOTATED_MOVE_IDS = [...B2_LESSON.lines.flatMap((item) => item.moves).filter((move) => move.annotation).map((move) => move.id), ...C_ANNOTATED_MOVE_IDS];
