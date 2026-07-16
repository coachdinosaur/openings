import { CHAPTER10_ANNOTATED_MOVE_IDS, CHAPTER10_LESSON, CHAPTER10_SECTIONS } from "../chapter10-lesson";
import manifest from "../chapter-manifests/chapter-10.json";
import { defineChapterPackage } from "../chapter-package";

export const CHAPTER_CONFIG = defineChapterPackage(manifest, {
  lesson: CHAPTER10_LESSON,
  annotatedMoveIds: CHAPTER10_ANNOTATED_MOVE_IDS,
  sections: CHAPTER10_SECTIONS,
});
