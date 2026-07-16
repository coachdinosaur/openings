import type {
  AuthoredChapterContent,
  ChapterConfig,
  ChapterManifestV1,
  ChapterSummary,
} from "./chapter-definition";

const SHA256 = /^[A-F0-9]{64}$/;

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Invalid chapter manifest: ${message}`);
}

export function parseChapterManifest(value: unknown): ChapterManifestV1 {
  invariant(value !== null && typeof value === "object", "expected an object");
  const manifest = value as ChapterManifestV1;
  invariant(manifest.schemaVersion === 1, "unsupported schemaVersion");
  invariant(Number.isInteger(manifest.id) && manifest.id > 0, "id must be a positive integer");
  invariant(manifest.source?.filename === `Chapter${manifest.id}_Catalan.pdf`, "source filename must match id");
  invariant(SHA256.test(manifest.source?.sha256 ?? ""), "source sha256 must be uppercase hexadecimal");
  invariant(Number.isInteger(manifest.source?.pdfPageCount) && manifest.source.pdfPageCount > 0, "pdfPageCount must be positive");
  invariant(Number.isInteger(manifest.source?.printedStart) && manifest.source.printedStart > 0, "printedStart must be positive");
  invariant(Number.isInteger(manifest.source?.printedEnd) && manifest.source.printedEnd >= manifest.source.printedStart, "printedEnd must not precede printedStart");
  invariant(Boolean(manifest.lesson?.defaultPosition?.lineId), "default position line is required");
  invariant(Number.isInteger(manifest.lesson?.defaultPosition?.ply) && manifest.lesson.defaultPosition.ply >= 0, "default position ply must be non-negative");
  if (manifest.id >= 6) invariant(manifest.lesson?.publicationProfile === "authored", "newer chapters require the authored publication profile");
  invariant(manifest.compatibility === "chapter1-legacy" || SHA256.test(manifest.lesson?.expectedCanonicalHash ?? ""), "canonical lesson hash is required");
  invariant(Boolean(manifest.review?.storageKey), "review storage key is required");
  invariant(Number.isInteger(manifest.review?.schemaVersion) && manifest.review.schemaVersion > 0, "review schemaVersion must be positive");
  invariant(Array.isArray(manifest.verification?.regions), "verification regions are required");
  invariant(Number.isInteger(manifest.evidence?.pageCount) && manifest.evidence.pageCount > 0, "evidence pageCount must be positive");
  invariant(Number.isInteger(manifest.evidence?.diagramCount) && manifest.evidence.diagramCount >= 0, "evidence diagramCount must be non-negative");
  invariant(typeof manifest.evidence?.strictDirectory === "boolean", "strictDirectory must be boolean");
  invariant(SHA256.test(manifest.evidence?.inventorySha256 ?? ""), "evidence inventorySha256 must be uppercase hexadecimal");
  return manifest;
}

export function chapterSummary(manifestValue: unknown): ChapterSummary {
  const manifest = parseChapterManifest(manifestValue);
  return {
    id: String(manifest.id),
    label: `Chapter ${manifest.id}`,
    shortLabel: `Chapter ${manifest.id} lesson`,
    printedRange: `printed pp.${manifest.source.printedStart}-${manifest.source.printedEnd}`,
  };
}

export function defineChapterPackage(manifestValue: unknown, authored: AuthoredChapterContent): ChapterConfig {
  const manifest = parseChapterManifest(manifestValue);
  const summary = chapterSummary(manifest);
  return {
    manifest,
    ...summary,
    ...(manifest.compatibility === "chapter1-legacy" ? { validationProfile: "legacy" as const } : {}),
    lesson: authored.lesson,
    annotatedMoveIds: authored.annotatedMoveIds,
    sections: authored.sections,
    defaultPosition: manifest.lesson.defaultPosition,
    reviewKey: manifest.review.storageKey,
    importDefinition: {
      filename: manifest.source.filename,
      sourceHash: manifest.source.sha256,
      expectedCanonicalHash: manifest.lesson.expectedCanonicalHash,
      scopeLabel: `${manifest.verification.regions.length} ordered source-region check`,
      regions: manifest.verification.regions,
    },
  };
}
