import { notFound } from "next/navigation";
import CatalanApp from "../../CatalanApp";
import { isChapterId } from "../../chapter-config";

export default async function ChapterPage({ params }: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = await params;
  if (!isChapterId(chapterId)) notFound();
  return <CatalanApp chapterId={chapterId} />;
}
