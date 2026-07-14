import { notFound } from "next/navigation";
import { CHAPTER_SUMMARIES, isChapterId, loadChapter } from "../../../chapter-catalog.generated";

export default async function ChapterImportPage({ params }: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = await params;
  if (!isChapterId(chapterId)) notFound();
  const [{ default: CatalanApp }, config] = await Promise.all([import("../../../CatalanApp"), loadChapter(chapterId)]);
  return <CatalanApp config={config} chapters={CHAPTER_SUMMARIES} initialView="import" />;
}
