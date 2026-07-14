import { CHAPTER_CONFIGS } from "./chapter-registry.generated";
import type { ChapterConfig } from "./chapter-definition";
import { assertChapterCatalog } from "./chapter-validation";
import type { ChapterId } from "./chapter-routing.generated";

export type { ChapterConfig, ChapterSection, ImportRegionSpec } from "./chapter-definition";
export type { ChapterId } from "./chapter-routing.generated";
export { isChapterId } from "./chapter-routing.generated";

export const CHAPTERS: ChapterConfig[] = Object.values(CHAPTER_CONFIGS).sort(
  (left, right) => Number(left.id) - Number(right.id),
);

// Publishing gates validate every package before deployment. Re-running the
// complete chess legality audit while a production worker starts can exceed
// the host's startup CPU budget, so keep the fail-fast assertion for local
// development and tests only.
if (process.env.NODE_ENV !== "production") {
  assertChapterCatalog(CHAPTERS);
}

export function chapterConfig(id: ChapterId): ChapterConfig {
  return CHAPTER_CONFIGS[id];
}
