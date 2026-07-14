import { CHAPTER2_ANNOTATED_MOVE_IDS, CHAPTER2_LESSON, CHAPTER2_SECTIONS } from "../chapter2-lesson";
import { EXPECTED_CHAPTER2_LESSON_HASH } from "../canonical";
import type { ChapterConfig } from "../chapter-definition";

export const CHAPTER_CONFIG: ChapterConfig = {
  id: "2",
  label: "Chapter 2",
  shortLabel: "Chapter 2 lesson",
  printedRange: "printed pp.24-33",
  lesson: CHAPTER2_LESSON,
  annotatedMoveIds: CHAPTER2_ANNOTATED_MOVE_IDS,
  sections: CHAPTER2_SECTIONS,
  defaultPosition: { lineId: "ch2-opening", ply: 15 },
  reviewKey: "catalan-chapter-2-review-v3",
  importDefinition: {
    filename: "Chapter2_Catalan.pdf",
    sourceHash: CHAPTER2_LESSON.source.sha256,
    expectedCanonicalHash: EXPECTED_CHAPTER2_LESSON_HASH,
    scopeLabel: "19 ordered source-region check",
    regions: [
      { id: "chapter2-p24-full", anchors: ["Variation Index", "A)", "B)", "C)"] },
      { id: "chapter2-p25-left", anchors: ["I am quite surprised", "most challenging move"] },
      { id: "chapter2-p25-right", anchors: ["There is no point for White", "mutual chances"] },
      { id: "chapter2-p26-left", anchors: ["White has a long-term advantage", "lesser evil"] },
      { id: "chapter2-p26-right", anchors: ["Once again White has a tough choice", "Mate in two follows"] },
      { id: "chapter2-p27-left", anchors: ["move which I suggested", "White is better"] },
      { id: "chapter2-p27-right", anchors: ["endgame is quite unpleasant", "playable alternative"] },
      { id: "chapter2-p28-left", anchors: ["I still like this move", "better pawn structure"] },
      { id: "chapter2-p28-right", anchors: ["Only in this way", "White is better"] },
      { id: "chapter2-p29-left", anchors: ["White has the better prospects", "Black's main continuation"] },
      { id: "chapter2-p29-right", anchors: ["more than enough compensation", "following improvement"] },
      { id: "chapter2-p30-left", anchors: ["logical sequence of moves", "most popular option"] },
      { id: "chapter2-p30-right", anchors: ["pleasant Catalan edge", "damaged structure"] },
      { id: "chapter2-p31-left", anchors: ["occurred in two games", "pleasant advantage for White"] },
      { id: "chapter2-p31-right", anchors: ["most fashionable continuation", "thematic idea"] },
      { id: "chapter2-p32-left", anchors: ["pushing the a-pawn", "last preparatory move"] },
      { id: "chapter2-p32-right", anchors: ["difficult for Black to defend", "too slow"] },
      { id: "chapter2-p33-left", anchors: ["attacking ideas", "Despite his extra pawn"] },
      { id: "chapter2-p33-right", anchors: ["Conclusion", "overall assessment"] },
    ],
  },
};
