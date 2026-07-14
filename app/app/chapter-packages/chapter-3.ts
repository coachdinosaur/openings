import { CHAPTER3_ANNOTATED_MOVE_IDS, CHAPTER3_LESSON, CHAPTER3_SECTIONS } from "../chapter3-lesson";
import manifest from "../chapter-manifests/chapter-3.json";
import { defineChapterPackage } from "../chapter-package";

export const CHAPTER_CONFIG = defineChapterPackage(manifest, {
  lesson: CHAPTER3_LESSON,
  annotatedMoveIds: CHAPTER3_ANNOTATED_MOVE_IDS,
  sections: CHAPTER3_SECTIONS,
});
