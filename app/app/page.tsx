import CatalanApp from "./CatalanApp";
import { loadAllChapters, getChapterSummaries } from "./lib/chapter-markdown-loader";

export default async function Home() {
  const chapters = loadAllChapters();
  const summaries = getChapterSummaries();
  const firstChapter = chapters[0];
  if (!firstChapter) {
    return <div className="page-loader"><p>No chapters found.</p></div>;
  }
  return <CatalanApp chapter={firstChapter} chapters={summaries} chapterId={firstChapter.id} />;
}
