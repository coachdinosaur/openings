import { CHAPTER4_ANNOTATED_MOVE_IDS, CHAPTER4_LESSON, CHAPTER4_SECTIONS } from "../chapter4-lesson";
import manifest from "../chapter-manifests/chapter-4.json";
import { defineChapterPackage } from "../chapter-package";

export const CHAPTER_CONFIG = defineChapterPackage(manifest, {
  lesson: CHAPTER4_LESSON,
  annotatedMoveIds: CHAPTER4_ANNOTATED_MOVE_IDS,
  sections: CHAPTER4_SECTIONS,
});
