import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import { B2_LESSON } from "./b2-lesson";

GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();

export type ExtractedRegion = { id: string; itemCount: number; text: string };

const REQUIRED_ANCHORS: Record<string, string[]> = {
  "chapter1-p13-left-b2": ["B2)", "This seems like the only move", "9.e4"],
  "chapter1-p13-right-b2": ["The only serious alternative", "This new move", "Another interesting continuation"],
  "chapter1-p14-left-b2": ["seems less convincing", "leaves White strongly centralized"],
};

export async function extractB2Regions(data: ArrayBuffer): Promise<ExtractedRegion[]> {
  const pdf = await getDocument({ data: new Uint8Array(data) }).promise;
  const extracted: ExtractedRegion[] = [];
  for (const span of [...B2_LESSON.sourceSpans].sort((left, right) => left.order - right.order)) {
    const page = await pdf.getPage(span.pageIndex + 1);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const items = content.items
      .filter((item): item is typeof item & { str: string; transform: number[] } => "str" in item && "transform" in item)
      .map((item) => ({ str: item.str, x: item.transform[4], top: viewport.height - item.transform[5] }))
      .filter((item) => item.x >= span.bbox.x0 - 8 && item.x <= span.bbox.x1 + 8 && item.top >= span.bbox.top - 18 && item.top <= span.bbox.bottom + 18)
      .sort((left, right) => Math.abs(left.top - right.top) < 2 ? left.x - right.x : left.top - right.top);
    const text = items.map((item) => item.str).join(" ").replace(/\s+/g, " ").trim();
    const missing = REQUIRED_ANCHORS[span.id].filter((anchor) => !text.includes(anchor));
    if (missing.length) throw new Error(`Region ${span.id} is missing expected source anchors: ${missing.join(", ")}`);
    extracted.push({ id: span.id, itemCount: items.length, text });
  }
  pdf.cleanup();
  return extracted;
}
