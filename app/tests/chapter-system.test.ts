import assert from "node:assert/strict";
import test from "node:test";
import { canonicalize } from "../app/canonical";
import { CHAPTER_CONFIG as CHAPTER_2 } from "../app/chapter-packages/chapter-2";
import { parseChapterManifest } from "../app/chapter-package";
import type { ChapterConfig } from "../app/chapter-definition";
import { validateChapterConfig } from "../app/chapter-validation";

function copy(): ChapterConfig {
  return structuredClone(CHAPTER_2);
}

test("canonical hashes are stable across server-to-client serialization", () => {
  const serverValue = { id: "chapter", optional: undefined, nested: { value: 1, omitted: undefined } };
  const clientValue = JSON.parse(JSON.stringify(serverValue));
  assert.equal(canonicalize(serverValue), canonicalize(clientValue));
});

test("rejects an annotated move that is absent from the lesson", () => {
  const config = copy();
  config.annotatedMoveIds.push("missing-move");
  assert.ok(validateChapterConfig(config).includes("annotated move missing-move does not exist"));
});

test("rejects diagram positions that disagree with their move paths", () => {
  const config = copy();
  config.lesson.diagrams[0].fen = config.lesson.basePosition.fen;
  assert.ok(validateChapterConfig(config).some((error) => /diagram .* FEN does not match/.test(error)));
});

test("requires import regions to cover source spans in reading order", () => {
  const config = copy();
  config.importDefinition.regions.reverse();
  assert.ok(validateChapterConfig(config).includes("import regions must cover source spans in reading order"));
});

test("rejects manifest filenames that disagree with chapter identity", () => {
  const manifest = structuredClone(CHAPTER_2.manifest);
  manifest.source.filename = "Chapter20_Catalan.pdf";
  assert.throws(() => parseChapterManifest(manifest), /source filename must match id/);
});
