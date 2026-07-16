import { CHAPTER6_ANNOTATED_MOVE_IDS, CHAPTER6_LESSON, CHAPTER6_SECTIONS } from "../chapter6-lesson";
import manifest from "../chapter-manifests/chapter-6.json";
import { defineChapterPackage } from "../chapter-package";

export const CHAPTER_CONFIG = defineChapterPackage(manifest, {
  lesson: CHAPTER6_LESSON,
  annotatedMoveIds: CHAPTER6_ANNOTATED_MOVE_IDS,
  sections: CHAPTER6_SECTIONS,
});
