import { notFound } from "next/navigation";
import { CHAPTER_SUMMARIES, isChapterId } from "../../chapter-catalog.generated";
import { loadChapterByNumber } from "../../lib/chapter-markdown-loader";

export default async function ChapterPage({ params }: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = await params;
  if (!isChapterId(chapterId)) notFound();
  const [{ default: CatalanApp }, chapter] = await Promise.all([import("../../CatalanApp"), Promise.resolve(loadChapterByNumber(Number(chapterId)))]);
  if (!chapter) notFound();
  return <CatalanApp chapter={chapter} chapters={CHAPTER_SUMMARIES} />;
}
