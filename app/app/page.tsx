import { CHAPTER_SUMMARIES } from "./chapter-catalog.generated";
import { loadChapterByNumber } from "./lib/chapter-markdown-loader";

export default async function Home() {
  const [{ default: CatalanApp }, chapter] = await Promise.all([
    import("./CatalanApp"),
    Promise.resolve(loadChapterByNumber(1)),
  ]);
  if (!chapter) throw new Error("Chapter 1 Markdown is missing.");
  return <CatalanApp chapter={chapter} chapters={CHAPTER_SUMMARIES} />;
}
