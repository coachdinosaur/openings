import type { ImportRegionSpec } from "./chapter-definition";
import type { LessonDocument } from "./lesson-model";

type PdfDocument = {
  getPage(pageNumber: number): Promise<{
    getViewport(options: { scale: number }): { height: number };
    getTextContent(): Promise<{ items: unknown[] }>;
  }>;
};

export type ExtractedRegion = { id: string; itemCount: number; text: string };

export async function extractDeclaredRegions(pdf: PdfDocument, lesson: LessonDocument, regions: ImportRegionSpec[]): Promise<ExtractedRegion[]> {
  const extracted: ExtractedRegion[] = [];
  for (const region of regions) {
    const span = lesson.sourceSpans.find((item) => item.id === region.id);
    if (!span) throw new Error(`Import region ${region.id} is not declared in the lesson source spans.`);
    const page = await pdf.getPage(span.pageIndex + 1);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const items = content.items
      .filter((item): item is { str: string; transform: number[] } => Boolean(item && typeof item === "object" && "str" in item && "transform" in item))
      .map((item) => ({ str: item.str, x: item.transform[4], top: viewport.height - item.transform[5] }))
      .filter((item) => item.x >= span.bbox.x0 - 8 && item.x <= span.bbox.x1 + 8 && item.top >= span.bbox.top - 18 && item.top <= span.bbox.bottom + 18)
      .sort((left, right) => Math.abs(left.top - right.top) < 2 ? left.x - right.x : left.top - right.top);
    const text = items.map((item) => item.str).join(" ").replace(/\s+/g, " ").trim();
    const missing = region.anchors.filter((anchor) => !text.includes(anchor));
    if (missing.length) throw new Error(`Region ${span.id} is missing expected source anchors: ${missing.join(", ")}`);
    extracted.push({ id: span.id, itemCount: items.length, text });
  }
  return extracted;
}
