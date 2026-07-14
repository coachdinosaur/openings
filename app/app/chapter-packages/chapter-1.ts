import { B2_LESSON } from "../b2-lesson";
import { CHAPTER1_ANNOTATED_MOVE_IDS, CHAPTER1_LESSON } from "../chapter1-lesson";
import type { ChapterConfig, ChapterSection } from "../chapter-definition";

const sections: ChapterSection[] = [
  { id: "a", label: "A) 4...g6", blockId: "a-heading" },
  { id: "b", label: "B) 4...c6", blockId: "b-heading" },
  { id: "c", label: "C) 4...c5", blockId: "c-heading" },
  { id: "conclusion", label: "Conclusion", blockId: "conclusion-heading" },
];

export const CHAPTER_CONFIG: ChapterConfig = {
  id: "1",
  validationProfile: "legacy",
  label: "Chapter 1",
  shortLabel: "Chapter 1 lesson",
  printedRange: "printed pp.8-23",
  lesson: CHAPTER1_LESSON,
  annotatedMoveIds: CHAPTER1_ANNOTATED_MOVE_IDS,
  sections,
  defaultPosition: { lineId: "chapter-start", ply: 7 },
  reviewKey: "catalan-b2-review-v2",
  importDefinition: {
    filename: "Chapter1_Catalan.pdf",
    sourceHash: B2_LESSON.source.sha256,
    scopeLabel: "B2 three-region check",
    regions: [
      { id: "chapter1-p13-left-b2", anchors: ["B2)", "This seems like the only move", "9.e4"] },
      { id: "chapter1-p13-right-b2", anchors: ["The only serious alternative", "This new move", "Another interesting continuation"] },
      { id: "chapter1-p14-left-b2", anchors: ["seems less convincing", "leaves White strongly centralized"] },
    ],
  },
};
