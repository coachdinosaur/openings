import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import { B2_LESSON } from "./b2-lesson";
import type { ImportRegionSpec } from "./chapter-definition";
import type { LessonDocument } from "./lesson-model";
import { extractDeclaredRegions, type ExtractedRegion } from "./pdf-regions";

GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();

export type { ExtractedRegion } from "./pdf-regions";

const REQUIRED_ANCHORS: Record<string, string[]> = {
  "chapter1-p13-left-b2": ["B2)", "This seems like the only move", "9.e4"],
  "chapter1-p13-right-b2": ["The only serious alternative", "This new move", "Another interesting continuation"],
  "chapter1-p14-left-b2": ["seems less convincing", "leaves White strongly centralized"],
};

export async function extractB2Regions(data: ArrayBuffer): Promise<ExtractedRegion[]> {
  return extractLessonRegions(data, B2_LESSON, Object.entries(REQUIRED_ANCHORS).map(([id, anchors]) => ({ id, anchors })));
}

export async function extractLessonRegions(data: ArrayBuffer, lesson: LessonDocument, regions: ImportRegionSpec[]): Promise<ExtractedRegion[]> {
  const pdf = await getDocument({ data: new Uint8Array(data) }).promise;
  const extracted = await extractDeclaredRegions(pdf, lesson, regions);
  pdf.cleanup();
  return extracted;
}
