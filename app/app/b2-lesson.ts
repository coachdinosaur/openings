import type { LessonDocument, MoveReference, VariationMove } from "./lesson-model";

const P13L = "chapter1-p13-left-b2";
const P13R = "chapter1-p13-right-b2";
const P14L = "chapter1-p14-left-b2";

const move = (id: string, san: string, sourceToken: string, sourceSpanId: string, annotation?: VariationMove["annotation"]): VariationMove => ({ id, san, sourceToken, sourceSpanId, ...(annotation ? { annotation } : {}) });
const ref = (source: string, lineId: string, moveIndex: number): MoveReference => ({ source, lineId, moveIndex });

export const B2_LESSON: LessonDocument = {
  schemaVersion: 2,
  lessonId: "catalan.chapter1.b2",
  status: "proposed",
  title: "B2) 8...Bb4",
  subtitle: "Accuracy in the Main Line Catalan",
  source: {
    documentId: "catalan.chapter1",
    filename: "Chapter1_Catalan.pdf",
    sha256: "3F6E9E6C1DCDAE42D0AC67417924B5D118B30F1536706B847D488D1908681E8A",
  },
  basePosition: {
    status: "deterministically derived",
    after: "8...Bb4",
    fen: "r1bq1rk1/pp1n1ppp/2p1pn2/3p4/1bPP4/2N3P1/PP1NPPBP/R1BQ1RK1 w - - 8 9",
    moves: ["d4", "Nf6", "c4", "e6", "g3", "d5", "Nf3", "c6", "Bg2", "Nbd7", "O-O", "Bd6", "Nfd2", "O-O", "Nc3", "Bb4"],
  },
  sourceSpans: [
    { id: P13L, status: "source-verified", pageIndex: 6, printedPage: 13, column: "left", order: 1, crop: "/source/crops/b2-heading-and-first-move.png", bbox: { x0: 35, top: 367.6, x1: 235, bottom: 640 } },
    { id: P13R, status: "source-verified", pageIndex: 6, printedPage: 13, column: "right", order: 2, crop: "/source/crops/b2-right-column.png", bbox: { x0: 235, top: 60, x1: 440, bottom: 640 } },
    { id: P14L, status: "source-verified", pageIndex: 7, printedPage: 14, column: "left", order: 3, crop: "/source/crops/b2-page14-left.png", bbox: { x0: 35, top: 50, x1: 235, bottom: 394.5 } },
  ],
  lines: [
    {
      id: "b2-main", label: "Main recommendation", parentLineId: null, parentPly: 0,
      moves: [
        move("b2-main-09w-e4", "e4", "e4", P13L), move("b2-main-09b-e5", "e5", "e5", P13R),
        move("b2-main-10w-dxe5", "dxe5", "dxe5", P13R), move("b2-main-10b-d4", "d4", "d4!?N", P13R, { punctuation: "!?", novelty: "N" }),
        move("b2-main-11w-nd5", "Nd5", "♘d5", P13R), move("b2-main-11b-nxd5", "Nxd5", "♞xd5", P14L),
        move("b2-main-12w-exd5", "exd5", "exd5", P14L), move("b2-main-12b-nxe5", "Nxe5", "♞xe5", P14L),
        move("b2-main-13w-ne4", "Ne4", "♘e4", P14L), move("b2-main-13b-cxd5", "cxd5", "cxd5", P14L),
        move("b2-main-14w-cxd5", "cxd5", "cxd5", P14L), move("b2-main-14b-qb6", "Qb6", "♛b6", P14L),
        move("b2-main-15w-a3", "a3", "a3", P14L), move("b2-main-15b-be7", "Be7", "♝e7", P14L),
        move("b2-main-16w-bf4", "Bf4", "♗f4", P14L), move("b2-main-16b-f6", "f6", "f6", P14L),
        move("b2-main-17w-b4", "b4", "b4±", P14L, { evaluation: "±" }),
      ],
    },
    { id: "b2-09-qb3", label: "9.Qb3", parentLineId: null, parentPly: 0, moves: [move("b2-qb3-09w-qb3", "Qb3", "♕b3", P13L), move("b2-qb3-09b-a5", "a5", "a5", P13L), move("b2-qb3-10w-e4", "e4", "e4N", P13L, { novelty: "N" }), move("b2-qb3-10b-e5", "e5", "e5!", P13L, { punctuation: "!" })] },
    { id: "b2-09-bxc3", label: "9...Bxc3", parentLineId: "b2-main", parentPly: 1, moves: [move("b2-bxc3-09b", "Bxc3", "♝xc3", P13R), move("b2-bxc3-10w", "bxc3", "bxc3", P13R), move("b2-bxc3-10b", "dxe4", "dxe4", P13R), move("b2-bxc3-11w", "Nxe4", "♘xe4", P13R), move("b2-bxc3-11b", "Nxe4", "♞xe4", P13R), move("b2-bxc3-12w", "Bxe4", "♗xe4", P13R), move("b2-bxc3-12b", "e5", "e5", P13R), move("b2-bxc3-13w", "Bc2", "♗c2N", P13R, { novelty: "N" }), move("b2-bxc3-13b", "Re8", "♜e8", P13R), move("b2-bxc3-14w", "Re1", "♖e1", P13R), move("b2-bxc3-14b", "exd4", "exd4", P13R), move("b2-bxc3-15w", "Rxe8+", "♖xe8†", P13R), move("b2-bxc3-15b", "Qxe8", "♛xe8", P13R), move("b2-bxc3-16w", "cxd4", "cxd4", P13R), move("b2-bxc3-16b", "Nf6", "♞f6", P13R), move("b2-bxc3-17w", "Bg5", "♗g5", P13R)] },
    { id: "b2-10-nxe5", label: "10...Nxe5", parentLineId: "b2-main", parentPly: 3, moves: [move("b2-nxe5-10b", "Nxe5", "♞xe5", P13R), move("b2-nxe5-11w", "cxd5", "cxd5", P13R), move("b2-nxe5-11b", "Bxc3", "♝xc3", P13R), move("b2-nxe5-12w", "bxc3", "bxc3", P13R), move("b2-nxe5-12b", "cxd5", "cxd5", P13R), move("b2-nxe5-13w", "exd5", "exd5", P13R), move("b2-nxe5-13b", "Nxd5", "♞xd5", P13R), move("b2-nxe5-14w", "Nb3", "♘b3!N", P13R, { punctuation: "!", novelty: "N" }), move("b2-nxe5-14b", "Be6", "♝e6", P13R), move("b2-nxe5-15w", "Re1", "♖e1", P13R), move("b2-nxe5-15b", "Qf6", "♛f6", P13R), move("b2-nxe5-16w", "Qe2", "♕e2!", P13R, { punctuation: "!" }), move("b2-nxe5-16b", "Nc6", "♞c6", P13R), move("b2-nxe5-17w", "Bb2", "♗b2", P13R)] },
    { id: "b2-14-nxc3", label: "14...Nxc3", parentLineId: "b2-10-nxe5", parentPly: 8, moves: [move("b2-nxc3-14b", "Nxc3", "♞xc3??", P13R, { punctuation: "??" }), move("b2-nxc3-15w", "Qe1", "♕e1!", P13R, { punctuation: "!" })] },
    { id: "b2-11-exf6", label: "11.exf6", parentLineId: "b2-main", parentPly: 4, moves: [move("b2-exf6-11w", "exf6", "exf6", P13R), move("b2-exf6-11b", "dxc3", "dxc3", P13R), move("b2-exf6-12w", "fxg7", "fxg7", P13R), move("b2-exf6-12b", "cxd2", "cxd2", P13R), move("b2-exf6-13w", "gxf8=Q+", "gxf8=♕†", P13R), move("b2-exf6-13b", "Nxf8", "♞xf8!", P13R, { punctuation: "!" }), move("b2-exf6-14w", "a3", "a3", P13R), move("b2-exf6-14b", "Ba5", "♝a5", P13R), move("b2-exf6-15w", "b4", "b4", P13R), move("b2-exf6-15b", "dxc1=Q", "dxc1=♛", P13R), move("b2-exf6-16w", "Qxc1", "♕xc1", P13R), move("b2-exf6-16b", "Bc7", "♝c7", P13R), move("b2-exf6-17w", "Qe3", "♕e3", P13R)] },
    { id: "b2-12-cxd5", label: "12.cxd5", parentLineId: "b2-main", parentPly: 6, moves: [move("b2-cxd5-12w", "cxd5", "cxd5", P14L), move("b2-cxd5-12b", "Nxe5", "♞xe5", P14L), move("b2-cxd5-13w", "Nb3", "♘b3", P14L), move("b2-cxd5-13b", "d3", "d3", P14L)] },
    { id: "b2-12b-cxd5", label: "12...cxd5", parentLineId: "b2-main", parentPly: 7, moves: [move("b2-12bcxd5-12b", "cxd5", "cxd5", P14L), move("b2-12bcxd5-13w", "Nf3", "♘f3", P14L), move("b2-12bcxd5-13b", "dxc4", "dxc4", P14L), move("b2-12bcxd5-14w", "Qxd4", "♕xd4", P14L), move("b2-12bcxd5-14b", "Nb6", "♞b6", P14L), move("b2-12bcxd5-15w", "Be3", "♗e3±", P14L, { evaluation: "±" })] },
  ],
  diagrams: [
    { id: "B2-D01", associationStatus: "source-verified", positionStatus: "deterministically derived", boardIdentityStatus: "unresolved", sourceSpanId: P13L, crop: "/source/crops/B2-D01.png", role: "Starting position after 8...Bb4", lineId: null, moveIndex: null, fen: "r1bq1rk1/pp1n1ppp/2p1pn2/3p4/1bPP4/2N3P1/PP1NPPBP/R1BQ1RK1 w - - 8 9" },
    { id: "B2-D02", associationStatus: "source-verified", positionStatus: "deterministically derived", boardIdentityStatus: "unresolved", sourceSpanId: P13R, crop: "/source/crops/B2-D02.png", role: "Position after 13...Nxd5", lineId: "b2-10-nxe5", moveIndex: 6, fen: "r1bq1rk1/pp3ppp/8/3nn3/8/2P3P1/P2N1PBP/R1BQ1RK1 w - - 0 14" },
    { id: "B2-D03", associationStatus: "source-verified", positionStatus: "deterministically derived", boardIdentityStatus: "unresolved", sourceSpanId: P14L, crop: "/source/crops/B2-D03.png", role: "Position after 14.cxd5", lineId: "b2-main", moveIndex: 10, fen: "r1bq1rk1/pp3ppp/8/3Pn3/1b1pN3/6P1/PP3PBP/R1BQ1RK1 b - - 0 14" },
  ],
  blocks: [
    { id: "b2-heading", type: "heading", status: "source-verified", sourceSpanId: P13L, text: "B2) 8...Bb4" },
    { id: "b2-diagram-01", type: "diagram", status: "source-verified", sourceSpanId: P13L, diagramId: "B2-D01" },
    { id: "b2-p13l-assessment", type: "prose", status: "source-verified", sourceSpanId: P13L, text: "This seems like the only move that demands any real accuracy from White." },
    { id: "b2-p13l-09-e4", type: "move-sequence", status: "source-verified", sourceSpanId: P13L, text: "9.e4", moveRefs: [ref("9.e4", "b2-main", 0)] },
    { id: "b2-p13l-qb3", type: "variation", status: "source-verified", sourceSpanId: P13L, title: "Less clear: 9.Qb3", lineId: "b2-09-qb3", text: "9.Qb3 a5 is less clear in view of 10.e4N e5!, but the text move is simple and strong.", moveRefs: [ref("9.Qb3", "b2-09-qb3", 0), ref("a5", "b2-09-qb3", 1), ref("10.e4N", "b2-09-qb3", 2), ref("e5!", "b2-09-qb3", 3)] },
    { id: "b2-p13r-09-e5", type: "move-sequence", status: "source-verified", sourceSpanId: P13R, text: "9...e5", moveRefs: [ref("9...e5", "b2-main", 1)] },
    { id: "b2-p13r-bxc3", type: "variation", status: "source-verified", sourceSpanId: P13R, title: "The serious alternative: 9...Bxc3", lineId: "b2-09-bxc3", text: "The only serious alternative that I would like to mention is 9...Bxc3 10.bxc3 dxe4 11.Nxe4 Nxe4 12.Bxe4 e5 as occurred in Olszewski – Hadzimanolis, Peristeri 2010. Here I propose 13.Bc2N, for instance 13...Re8 14.Re1 exd4 15.Rxe8+ Qxe8 16.cxd4 Nf6 17.Bg5 when White’s bishop pair gives him excellent chances.", moveRefs: [ref("9...Bxc3", "b2-09-bxc3", 0), ref("10.bxc3", "b2-09-bxc3", 1), ref("dxe4", "b2-09-bxc3", 2), ref("11.Nxe4", "b2-09-bxc3", 3), ref("Nxe4", "b2-09-bxc3", 4), ref("12.Bxe4", "b2-09-bxc3", 5), ref("e5", "b2-09-bxc3", 6), ref("13.Bc2N", "b2-09-bxc3", 7), ref("13...Re8", "b2-09-bxc3", 8), ref("14.Re1", "b2-09-bxc3", 9), ref("exd4", "b2-09-bxc3", 10), ref("15.Rxe8+", "b2-09-bxc3", 11), ref("Qxe8", "b2-09-bxc3", 12), ref("16.cxd4", "b2-09-bxc3", 13), ref("Nf6", "b2-09-bxc3", 14), ref("17.Bg5", "b2-09-bxc3", 15)] },
    { id: "b2-p13r-10-d4", type: "move-sequence", status: "source-verified", sourceSpanId: P13R, text: "10.dxe5 d4!?N", moveRefs: [ref("10.dxe5", "b2-main", 2), ref("d4!?N", "b2-main", 3)] },
    { id: "b2-p13r-new-move", type: "prose", status: "source-verified", sourceSpanId: P13R, text: "This new move seems like an interesting try for Black." },
    { id: "b2-p13r-nxe5", type: "variation", status: "source-verified", sourceSpanId: P13R, title: "Immediate recapture: 10...Nxe5", lineId: "b2-10-nxe5", diagramId: "B2-D02", text: "10...Nxe5 11.cxd5 Bxc3 12.bxc3 cxd5 13.exd5 Nxd5 was played in Filippov – Tunik, Novgorod 1995, when White failed to choose the best knight move: 14.Nb3!N Be6 (Obviously the c3-pawn is untouchable: 14...Nxc3?? 15.Qe1! and Black loses one of his knights) 15.Re1 Qf6 16.Qe2! Nc6 17.Bb2 White’s bishop pair should be a telling factor in the long run.", moveRefs: [ref("10...Nxe5", "b2-10-nxe5", 0), ref("11.cxd5", "b2-10-nxe5", 1), ref("Bxc3", "b2-10-nxe5", 2), ref("12.bxc3", "b2-10-nxe5", 3), ref("cxd5", "b2-10-nxe5", 4), ref("13.exd5", "b2-10-nxe5", 5), ref("Nxd5", "b2-10-nxe5", 6), ref("14.Nb3!N", "b2-10-nxe5", 7), ref("Be6", "b2-10-nxe5", 8), ref("14...Nxc3??", "b2-14-nxc3", 0), ref("15.Qe1!", "b2-14-nxc3", 1), ref("15.Re1", "b2-10-nxe5", 9), ref("Qf6", "b2-10-nxe5", 10), ref("16.Qe2!", "b2-10-nxe5", 11), ref("Nc6", "b2-10-nxe5", 12), ref("17.Bb2", "b2-10-nxe5", 13)] },
    { id: "b2-p13r-11-nd5", type: "move-sequence", status: "source-verified", sourceSpanId: P13R, text: "11.Nd5", moveRefs: [ref("11.Nd5", "b2-main", 4)] },
    { id: "b2-p13r-exf6", type: "variation", status: "source-verified", sourceSpanId: P13R, title: "Promotion race: 11.exf6", lineId: "b2-11-exf6", text: "Another interesting continuation is: 11.exf6 dxc3 12.fxg7 cxd2 13.gxf8=Q+ Nxf8! Otherwise Black is just lost. 14.a3 Ba5 15.b4 dxc1=Q 16.Qxc1 Bc7 17.Qe3 The position is extremely complex, but it seems to me that White has the better prospects, as he is slightly ahead on material and has an easy plan of advancing with f2-f4 and e4-e5.", moveRefs: [ref("11.exf6", "b2-11-exf6", 0), ref("dxc3", "b2-11-exf6", 1), ref("12.fxg7", "b2-11-exf6", 2), ref("cxd2", "b2-11-exf6", 3), ref("13.gxf8=Q+", "b2-11-exf6", 4), ref("Nxf8!", "b2-11-exf6", 5), ref("14.a3", "b2-11-exf6", 6), ref("Ba5", "b2-11-exf6", 7), ref("15.b4", "b2-11-exf6", 8), ref("dxc1=Q", "b2-11-exf6", 9), ref("16.Qxc1", "b2-11-exf6", 10), ref("Bc7", "b2-11-exf6", 11), ref("17.Qe3", "b2-11-exf6", 12)] },
    { id: "b2-p14l-11-nxd5", type: "move-sequence", status: "source-verified", sourceSpanId: P14L, text: "11...Nxd5 12.exd5", moveRefs: [ref("11...Nxd5", "b2-main", 5), ref("12.exd5", "b2-main", 6)] },
    { id: "b2-p14l-12-cxd5", type: "variation", status: "source-verified", sourceSpanId: P14L, title: "Less convincing: 12.cxd5", lineId: "b2-12-cxd5", text: "12.cxd5 Nxe5 13.Nb3 d3 seems less convincing.", moveRefs: [ref("12.cxd5", "b2-12-cxd5", 0), ref("Nxe5", "b2-12-cxd5", 1), ref("13.Nb3", "b2-12-cxd5", 2), ref("d3", "b2-12-cxd5", 3)] },
    { id: "b2-p14l-12-nxe5", type: "move-sequence", status: "source-verified", sourceSpanId: P14L, text: "12...Nxe5", moveRefs: [ref("12...Nxe5", "b2-main", 7)] },
    { id: "b2-p14l-12b-cxd5", type: "variation", status: "source-verified", sourceSpanId: P14L, title: "Centralized: 12...cxd5", lineId: "b2-12b-cxd5", text: "12...cxd5 13.Nf3 dxc4 14.Qxd4 Nb6 15.Be3± leaves White strongly centralized.", moveRefs: [ref("12...cxd5", "b2-12b-cxd5", 0), ref("13.Nf3", "b2-12b-cxd5", 1), ref("dxc4", "b2-12b-cxd5", 2), ref("14.Qxd4", "b2-12b-cxd5", 3), ref("Nb6", "b2-12b-cxd5", 4), ref("15.Be3±", "b2-12b-cxd5", 5)] },
    { id: "b2-p14l-13-ne4", type: "move-sequence", status: "source-verified", sourceSpanId: P14L, text: "13.Ne4 cxd5 14.cxd5", moveRefs: [ref("13.Ne4", "b2-main", 8), ref("cxd5", "b2-main", 9), ref("14.cxd5", "b2-main", 10)] },
    { id: "b2-diagram-03", type: "diagram", status: "source-verified", sourceSpanId: P14L, diagramId: "B2-D03" },
    { id: "b2-p14l-finish", type: "move-sequence", status: "source-verified", sourceSpanId: P14L, text: "14...Qb6 15.a3 Be7 16.Bf4 f6 17.b4±", moveRefs: [ref("14...Qb6", "b2-main", 11), ref("15.a3", "b2-main", 12), ref("Be7", "b2-main", 13), ref("16.Bf4", "b2-main", 14), ref("f6", "b2-main", 15), ref("17.b4±", "b2-main", 16)] },
    { id: "b2-p14l-final-assessment", type: "assessment", status: "source-verified", sourceSpanId: P14L, text: "White’s chances are definitely preferable." },
  ],
};

export const B2_ANNOTATED_MOVE_IDS = ["b2-main-10b-d4", "b2-nxe5-14w", "b2-exf6-13w", "b2-main-17w-b4"];
