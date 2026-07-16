import { CHAPTER7_ANNOTATED_MOVE_IDS, CHAPTER7_LESSON, CHAPTER7_SECTIONS } from "../chapter7-lesson";
import manifest from "../chapter-manifests/chapter-7.json";
import { defineChapterPackage } from "../chapter-package";

export const CHAPTER_CONFIG = defineChapterPackage(manifest, {
  lesson: CHAPTER7_LESSON,
  annotatedMoveIds: CHAPTER7_ANNOTATED_MOVE_IDS,
  sections: CHAPTER7_SECTIONS,
});
