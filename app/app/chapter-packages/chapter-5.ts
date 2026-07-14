import { CHAPTER5_ANNOTATED_MOVE_IDS, CHAPTER5_LESSON, CHAPTER5_SECTIONS } from "../chapter5-lesson";
import manifest from "../chapter-manifests/chapter-5.json";
import { defineChapterPackage } from "../chapter-package";

export const CHAPTER_CONFIG = defineChapterPackage(manifest, {
  lesson: CHAPTER5_LESSON,
  annotatedMoveIds: CHAPTER5_ANNOTATED_MOVE_IDS,
  sections: CHAPTER5_SECTIONS,
});
