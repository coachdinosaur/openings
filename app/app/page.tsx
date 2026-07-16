import { CHAPTER_IDS, CHAPTER_SUMMARIES, loadChapter } from "./chapter-catalog.generated";

export default async function Home() {
  const [{ default: CatalanApp }, config] = await Promise.all([
    import("./CatalanApp"),
    loadChapter(CHAPTER_IDS[0]),
  ]);
  return <CatalanApp config={config} chapters={CHAPTER_SUMMARIES} />;
}
