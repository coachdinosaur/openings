import { CHAPTER2_ANNOTATED_MOVE_IDS, CHAPTER2_LESSON, CHAPTER2_SECTIONS } from "../chapter2-lesson";
import manifest from "../chapter-manifests/chapter-2.json";
import { defineChapterPackage } from "../chapter-package";

export const CHAPTER_CONFIG = defineChapterPackage(manifest, {
  lesson: CHAPTER2_LESSON,
  annotatedMoveIds: CHAPTER2_ANNOTATED_MOVE_IDS,
  sections: CHAPTER2_SECTIONS,
});
