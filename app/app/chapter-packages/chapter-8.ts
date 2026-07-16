import { CHAPTER8_ANNOTATED_MOVE_IDS, CHAPTER8_LESSON, CHAPTER8_SECTIONS } from "../chapter8-lesson";
import manifest from "../chapter-manifests/chapter-8.json";
import { defineChapterPackage } from "../chapter-package";

export const CHAPTER_CONFIG = defineChapterPackage(manifest, {
  lesson: CHAPTER8_LESSON,
  annotatedMoveIds: CHAPTER8_ANNOTATED_MOVE_IDS,
  sections: CHAPTER8_SECTIONS,
});
