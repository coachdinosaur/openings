import { notFound } from "next/navigation";
import { isChapterId } from "../../../chapter-routing.generated";

export default async function ChapterReviewPage({ params }: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = await params;
  if (!isChapterId(chapterId)) notFound();
  const { default: CatalanApp } = await import("../../../CatalanApp");
  return <CatalanApp chapterId={chapterId} initialView="review" />;
}
