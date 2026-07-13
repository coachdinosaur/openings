import { B2_LESSON } from "./b2-lesson";
import { CHAPTER1_ANNOTATED_MOVE_IDS, CHAPTER1_LESSON } from "./chapter1-lesson";
import { CHAPTER2_ANNOTATED_MOVE_IDS, CHAPTER2_LESSON, CHAPTER2_SECTIONS } from "./chapter2-lesson";
import { EXPECTED_CHAPTER2_LESSON_HASH } from "./canonical";
import type { LessonDocument } from "./lesson-model";

export type ImportRegionSpec = { id: string; anchors: string[] };
export type ChapterSection = { id: string; label: string; blockId: string };
export type ChapterConfig = {
  id: "1" | "2";
  label: string;
  shortLabel: string;
  printedRange: string;
  lesson: LessonDocument;
  annotatedMoveIds: string[];
  sections: ChapterSection[];
  defaultPosition: { lineId: string; ply: number };
  reviewKey: string;
  importDefinition: { filename: string; sourceHash: string; expectedCanonicalHash?: string; regions: ImportRegionSpec[]; scopeLabel: string };
};

const CHAPTER1_SECTIONS: ChapterSection[] = [
  { id: "a", label: "A) 4...g6", blockId: "a-heading" },
  { id: "b", label: "B) 4...c6", blockId: "b-heading" },
  { id: "c", label: "C) 4...c5", blockId: "c-heading" },
  { id: "conclusion", label: "Conclusion", blockId: "conclusion-heading" },
];

export const CHAPTER_CONFIGS: Record<"1" | "2", ChapterConfig> = {
  "1": {
    id: "1", label: "Chapter 1", shortLabel: "Chapter 1 lesson", printedRange: "printed pp.8-23", lesson: CHAPTER1_LESSON,
    annotatedMoveIds: CHAPTER1_ANNOTATED_MOVE_IDS, sections: CHAPTER1_SECTIONS, defaultPosition: { lineId: "chapter-start", ply: 7 }, reviewKey: "catalan-b2-review-v2",
    importDefinition: { filename: "Chapter1_Catalan.pdf", sourceHash: B2_LESSON.source.sha256, scopeLabel: "B2 three-region check", regions: [
      { id: "chapter1-p13-left-b2", anchors: ["B2)", "This seems like the only move", "9.e4"] },
      { id: "chapter1-p13-right-b2", anchors: ["The only serious alternative", "This new move", "Another interesting continuation"] },
      { id: "chapter1-p14-left-b2", anchors: ["seems less convincing", "leaves White strongly centralized"] },
    ] },
  },
  "2": {
    id: "2", label: "Chapter 2", shortLabel: "Chapter 2 lesson", printedRange: "printed pp.24-33", lesson: CHAPTER2_LESSON,
    annotatedMoveIds: CHAPTER2_ANNOTATED_MOVE_IDS, sections: CHAPTER2_SECTIONS, defaultPosition: { lineId: "ch2-opening", ply: 15 }, reviewKey: "catalan-chapter2-review-v2",
    importDefinition: { filename: "Chapter2_Catalan.pdf", sourceHash: CHAPTER2_LESSON.source.sha256, expectedCanonicalHash: EXPECTED_CHAPTER2_LESSON_HASH, scopeLabel: "19 ordered source-region check", regions: [
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
    ] },
  },
};

export function chapterConfig(id: string): ChapterConfig {
  return CHAPTER_CONFIGS[id === "2" ? "2" : "1"];
}
