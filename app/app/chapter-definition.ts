import type { LessonDocument } from "./lesson-model";

export type ImportRegionSpec = { id: string; anchors: string[] };
export type ChapterSection = { id: string; label: string; blockId: string };

export type ChapterManifestV1 = {
  schemaVersion: 1;
  id: number;
  compatibility?: "chapter1-legacy";
  source: {
    filename: string;
    sha256: string;
    pdfPageCount: number;
    printedStart: number;
    printedEnd: number;
  };
  lesson: {
    /** Required for new packages so extracted evidence cannot be published as a learner lesson. */
    publicationProfile?: "authored";
    expectedCanonicalHash?: string;
    defaultPosition: { lineId: string; ply: number };
  };
  review: { storageKey: string; schemaVersion: number };
  verification: { regions: ImportRegionSpec[] };
  evidence: {
    pageCount: number;
    diagramCount: number;
    strictDirectory: boolean;
    inventorySha256: string;
  };
};

export type ChapterSummary = {
  id: string;
  label: string;
  shortLabel: string;
  printedRange: string;
};

export type AuthoredChapterContent = {
  lesson: LessonDocument;
  annotatedMoveIds: string[];
  sections: ChapterSection[];
};

export type ChapterConfig = {
  manifest: ChapterManifestV1;
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
