import assert from "node:assert/strict";
import test from "node:test";
import { assertSequentialBatch, assertSourceBundlePageRanges, assertStagedSequence, authoringBundleSource, chapterIdFromPdf, chapterPackageSource, directPublishEntries, directStartEntries, draftManifest, parseBatchDefinition, parseSourceBundleDefinition } from "../scripts/chapter-system.mjs";

test("authoring bundle keeps one compact reading-order copy of each region", () => {
  const source = {
    chapterId: 6,
    filename: "Chapter6_Catalan.pdf",
    sha256: "A".repeat(64),
    pageCount: 2,
    printedStart: 73,
    printedEnd: 74,
  };
  const regions = [
    { id: "chapter6-p73-full", printedPage: 73, column: "full", text: "First source region with enough stable words for anchors." },
    { id: "chapter6-p74-left", printedPage: 74, column: "left", text: "Second source region remains in reading order for authoring." },
  ];
  const output = authoringBundleSource(source, regions, [{ id: "CH6-D01", page: "printed-73" }]);
  assert.ok(output.indexOf(regions[0].text) < output.indexOf(regions[1].text));
  assert.equal(output.split(regions[0].text).length - 1, 1);
  assert.match(output, /Expected and detected: 1/);
  assert.match(output, /Suggested anchors/);
});

test("draft generation derives repeated publication metadata", () => {
  const source = { chapterId: 6, filename: "Chapter6_Catalan.pdf", sha256: "B".repeat(64), pageCount: 2, printedStart: 73, printedEnd: 74 };
  const regions = [{ id: "chapter6-p73-full", text: "Stable opening anchor and stable closing anchor" }];
  const manifest = draftManifest(source, regions, 3);
  assert.equal(manifest.source.pdfPageCount, 2);
  assert.equal(manifest.evidence.diagramCount, 3);
  assert.equal(manifest.review.storageKey, "catalan-chapter-6-review-v1");
  assert.deepEqual(manifest.verification.regions.map(({ id }) => id), ["chapter6-p73-full"]);
});

test("package generation follows the shared package convention", () => {
  const output = chapterPackageSource(6);
  assert.match(output, /CHAPTER6_LESSON/);
  assert.match(output, /chapter-manifests\/chapter-6\.json/);
  assert.doesNotMatch(output, /route|navigation/);
});

test("batch definitions preserve sequential chapter metadata", () => {
  const entries = parseBatchDefinition({ chapters: [
    { chapter: 6, printedStart: 73, expectedCrops: 30, defaultLine: "ch6-opening", defaultPly: 10 },
    { chapter: 7, printedStart: 85, expectedCrops: 28, defaultLine: "ch7-opening", defaultPly: 10 },
  ] });
  assertSequentialBatch(entries, 6);
  assert.deepEqual(entries.map(({ chapter }) => chapter), [6, 7]);
  assert.throws(() => assertSequentialBatch([entries[1], entries[0]], 6), /must be contiguous/);
});

test("staged chapter PDFs cannot skip the next unpublished chapter", () => {
  assert.doesNotThrow(() => assertStagedSequence([6, 7, 8], 6));
  assert.throws(() => assertStagedSequence([6, 8], 6), /expected Chapter 7/);
  assert.throws(() => assertStagedSequence([7], 6), /expected Chapter 6/);
});

test("combined PDFs require complete, contiguous source-page provenance", () => {
  const entries = parseSourceBundleDefinition({ chapters: [
    { chapter: 6, pageStart: 1, pageEnd: 14, printedStart: 73, expectedCrops: 43 },
    { chapter: 7, pageStart: 15, pageEnd: 39, printedStart: 87, expectedCrops: 73 },
    { chapter: 8, pageStart: 40, pageEnd: 53, printedStart: 112, expectedCrops: 37 },
  ] });
  assertSequentialBatch(entries, 6);
  assertSourceBundlePageRanges(entries, 53);
  assert.throws(() => assertSourceBundlePageRanges([{ ...entries[0], pageEnd: 13 }, ...entries.slice(1)], 53), /contiguous/);
});

test("one or many direct PDFs use the same ordered input model", () => {
  const single = directStartEntries(["../Chapter6_Catalan.pdf"], ["73"], ["30"]);
  const multiple = directStartEntries(
    ["../Chapter6_Catalan.pdf", "../Chapter7_Catalan.pdf"],
    ["73", "85"],
    ["30", "28"],
  );
  assert.equal(single[0].chapter, 6);
  assert.deepEqual(multiple.map(({ chapter }) => chapter), [6, 7]);
  assert.equal(chapterIdFromPdf("../Chapter12_Catalan.pdf"), 12);
  assert.throws(() => directStartEntries(["../Chapter6_Catalan.pdf"], [], []), /once for every --pdf/);
  assert.deepEqual(
    directPublishEntries([6, 7], ["ch6-opening", "ch7-opening"], ["10", "8"]).map(({ defaultPly }) => defaultPly),
    [10, 8],
  );
});
