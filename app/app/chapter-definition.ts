import type { LessonDocument } from "./lesson-model";

export type ImportRegionSpec = { id: string; anchors: string[] };
export type ChapterSection = { id: string; label: string; blockId: string };

export type ChapterConfig = {
  id: string;
  /** Chapter 1 only: retain compatibility with its pre-contract composite lesson model. */
  validationProfile?: "legacy";
  label: string;
  shortLabel: string;
  printedRange: string;
  lesson: LessonDocument;
  annotatedMoveIds: string[];
  sections: ChapterSection[];
  defaultPosition: { lineId: string; ply: number };
  reviewKey: string;
  importDefinition: {
    filename: string;
    sourceHash: string;
    expectedCanonicalHash?: string;
    regions: ImportRegionSpec[];
    scopeLabel: string;
  };
};
