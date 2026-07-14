import { CHAPTER1_ANNOTATED_MOVE_IDS, CHAPTER1_LESSON } from "../chapter1-lesson";
import manifest from "../chapter-manifests/chapter-1.json";
import { defineChapterPackage } from "../chapter-package";
import type { ChapterSection } from "../chapter-definition";

const sections: ChapterSection[] = [
  { id: "a", label: "A) 4...g6", blockId: "a-heading" },
  { id: "b", label: "B) 4...c6", blockId: "b-heading" },
  { id: "c", label: "C) 4...c5", blockId: "c-heading" },
  { id: "conclusion", label: "Conclusion", blockId: "conclusion-heading" },
];

export const CHAPTER_CONFIG = defineChapterPackage(manifest, {
  lesson: CHAPTER1_LESSON,
  annotatedMoveIds: CHAPTER1_ANNOTATED_MOVE_IDS,
  sections,
});
