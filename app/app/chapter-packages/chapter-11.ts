import { CHAPTER11_ANNOTATED_MOVE_IDS, CHAPTER11_LESSON, CHAPTER11_SECTIONS } from "../chapter11-lesson";
import manifest from "../chapter-manifests/chapter-11.json";
import { defineChapterPackage } from "../chapter-package";

export const CHAPTER_CONFIG = defineChapterPackage(manifest, {
  lesson: CHAPTER11_LESSON,
  annotatedMoveIds: CHAPTER11_ANNOTATED_MOVE_IDS,
  sections: CHAPTER11_SECTIONS,
});
