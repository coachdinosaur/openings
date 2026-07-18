import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("publishes all Markdown chapters through one learner route", async () => {
  const responses = await Promise.all([render("/"), render("/chapters/1"), render("/chapters/9"), render("/chapters/11"), render("/chapters/12"), render("/chapters/13"), render("/chapters/14")]);
  assert.ok(responses.every((response) => response.status === 200));
  assert.match(await responses[1].text(), /aria-label="Chapter page 7, 1 of 17"/, "chapters should open on their first source page in the lightweight reader");
  assert.match(await responses[4].text(), /aria-label="Chapter page 1, 1 of 11"/, "Chapter 12 should open on its variation index");
  assert.match(await responses[5].text(), /aria-label="Chapter page 1, 1 of 16"/, "Chapter 13 should open on its variation index");
  assert.match(await responses[6].text(), /aria-label="Chapter page 1, 1 of 32"/, "Chapter 14 should open on its variation index");
  assert.equal((await render("/chapters/15")).status, 404);
  assert.equal((await render("/chapters/1/review")).status, 404);
  assert.equal((await render("/chapters/1/import")).status, 404);
});

test("the application is Markdown-first and has no runtime PDF conversion surface", async () => {
  const [app, renderer, catalog, packageJson] = await Promise.all([
    readFile(new URL("app/CatalanApp.tsx", root), "utf8"),
    readFile(new URL("app/components/MarkdownRenderer.tsx", root), "utf8"),
    readFile(new URL("app/chapter-catalog.generated.ts", root), "utf8"),
    readFile(new URL("package.json", root), "utf8"),
  ]);
  assert.match(app, /MarkdownChapterView/);
  assert.match(app, /PageControls/);
  assert.match(app, /import\("\.\/stockfish-client"\)/, "Stockfish stays lazy-loaded");
  assert.match(renderer, /MarkdownMoveResolver/);
  assert.match(renderer, /Show on main board/);
  assert.match(catalog, /Generated from app\/content\/chapters/);
  assert.doesNotMatch(`${app}\n${packageJson}`, /pdfjs-dist|extractLessonRegions|ImportView|ReviewView|uploaded_pdf/);
});

test("all fourteen Markdown source files and core chess assets are packaged", async () => {
  const chapterFiles = (await readdir(new URL("app/content/chapters/", root))).filter((name) => /^chapter-\d+-catalan\.md$/.test(name));
  assert.equal(chapterFiles.length, 14);
  await Promise.all([
    access(new URL("public/assets/pieces/mpchess/wK.svg", root)),
    access(new URL("public/assets/pieces/mpchess/bQ.svg", root)),
    access(new URL("public/stockfish/stockfish-18-lite-single.js", root)),
    access(new URL("app/chapters/[chapterId]/page.tsx", root)),
  ]);
});

test("the shared client chunk does not bundle every chapter body", async () => {
  const assets = new URL("dist/client/assets/", root);
  const chunkName = (await readdir(assets)).find((name) => /^CatalanApp-.*\.js$/.test(name));
  assert.ok(chunkName, "the shared CatalanApp client chunk should exist");
  const source = await readFile(new URL(chunkName, assets), "utf8");
  assert.doesNotMatch(source, /Nothing could be more natural than Black/);
  assert.ok(source.length < 100_000, `expected a compact shared reader chunk, received ${source.length} bytes`);
});
