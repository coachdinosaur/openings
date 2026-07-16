import { CHAPTER9_ANNOTATED_MOVE_IDS, CHAPTER9_LESSON, CHAPTER9_SECTIONS } from "../chapter9-lesson";
import manifest from "../chapter-manifests/chapter-9.json";
import { defineChapterPackage } from "../chapter-package";

export const CHAPTER_CONFIG = defineChapterPackage(manifest, {
  lesson: CHAPTER9_LESSON,
  annotatedMoveIds: CHAPTER9_ANNOTATED_MOVE_IDS,
  sections: CHAPTER9_SECTIONS,
});
