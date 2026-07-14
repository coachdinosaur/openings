import { CHAPTER_CONFIGS } from "./chapter-registry.generated";
import type { ChapterConfig } from "./chapter-definition";
import { assertChapterCatalog } from "./chapter-validation";

export type { ChapterConfig, ChapterSection, ImportRegionSpec } from "./chapter-definition";

export type ChapterId = keyof typeof CHAPTER_CONFIGS;

export const CHAPTERS: ChapterConfig[] = Object.values(CHAPTER_CONFIGS).sort(
  (left, right) => Number(left.id) - Number(right.id),
);

assertChapterCatalog(CHAPTERS);

export function isChapterId(id: string): id is ChapterId {
  return Object.prototype.hasOwnProperty.call(CHAPTER_CONFIGS, id);
}

export function chapterConfig(id: ChapterId): ChapterConfig {
  return CHAPTER_CONFIGS[id];
}
