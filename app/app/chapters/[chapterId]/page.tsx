import { notFound } from "next/navigation";
import CatalanApp from "../../CatalanApp";
import { loadChapterById, getChapterSummaries } from "../../lib/chapter-markdown-loader";

export default async function ChapterPage({ params }: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = await params;
  const chapter = loadChapterById(chapterId);
  if (!chapter) notFound();
  const summaries = getChapterSummaries();
  return <CatalanApp chapter={chapter} chapters={summaries} chapterId={chapterId} />;
}
