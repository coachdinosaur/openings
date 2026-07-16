import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { access, copyFile, mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(appRoot, "..");
const packagesDirectory = path.join(appRoot, "app", "chapter-packages");
const manifestsDirectory = path.join(appRoot, "app", "chapter-manifests");
const sourceBundlesDirectory = path.join(appRoot, "app", "chapter-source-bundles");
const catalogPath = path.join(appRoot, "app", "chapter-catalog.generated.ts");
const verifierPath = path.join(appRoot, "scripts", "verify-chapter-packages.ts");
const lessonValidatorPath = path.join(appRoot, "scripts", "validate-chapter-lesson.ts");
const importVerifierPath = path.join(appRoot, "scripts", "verify-chapter-import.ts");
const cropExtractorPath = path.join(appRoot, "scripts", "extract_chessboard_crops.py");
const bundleSplitterPath = path.join(appRoot, "scripts", "split_chapter_bundle.py");
const tsxCli = path.join(appRoot, "node_modules", "tsx", "dist", "cli.mjs");
const AUTO_HASH = "A".repeat(64);

function fail(message) {
  throw new Error(message);
}

function requireSupportedNode() {
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 22 || (major === 22 && minor < 13)) fail(`Node 22.13.0 or newer is required; current runtime is ${process.versions.node}.`);
}

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function writeAtomic(target, content) {
  const temporaryPath = `${target}.${process.pid}.tmp`;
  await writeFile(temporaryPath, content, "utf8");
  await rename(temporaryPath, target);
}

async function chapterPackages() {
  const files = (await readdir(packagesDirectory))
    .map((name) => ({ name, match: /^chapter-(\d+)\.ts$/.exec(name) }))
    .filter((item) => item.match)
    .map((item) => ({ id: Number(item.match[1]), name: item.name }))
    .sort((left, right) => left.id - right.id);
  if (!files.length) fail("No chapter packages were found.");
  files.forEach((item, index) => {
    if (item.id !== index + 1) fail(`Chapter packages must be contiguous from 1; found chapter ${item.id} at position ${index + 1}.`);
  });
  return Promise.all(files.map(async (item) => {
    const manifestPath = path.join(manifestsDirectory, `chapter-${item.id}.json`);
    const manifest = JSON.parse(await readFile(manifestPath, "utf8").catch(() => fail(`${item.name} has no chapter-${item.id}.json manifest.`)));
    if (manifest.schemaVersion !== 1) fail(`chapter-${item.id}.json uses an unsupported schema version.`);
    if (manifest.id !== item.id) fail(`chapter-${item.id}.json does not match its package id.`);
    return { ...item, manifest };
  }));
}

async function publishedCatalogIds() {
  const source = await readFile(catalogPath, "utf8").catch(() => "");
  const declaration = /export const CHAPTER_IDS = \[([^\]]*)\]/.exec(source)?.[1] ?? "";
  return [...declaration.matchAll(/"(\d+)"/g)].map((match) => Number(match[1]));
}

async function sourceBundleManifests() {
  if (!(await exists(sourceBundlesDirectory))) return [];
  const files = (await readdir(sourceBundlesDirectory)).filter((name) => name.endsWith(".json")).sort();
  return Promise.all(files.map(async (name) => ({ name, manifest: JSON.parse(await readFile(path.join(sourceBundlesDirectory, name), "utf8")) })));
}

async function verifySourceBundles() {
  const registeredChapters = new Map();
  for (const { name, manifest } of await sourceBundleManifests()) {
    if (manifest.schemaVersion !== 1 || !manifest.filename || !Array.isArray(manifest.chapters) || !manifest.chapters.length) fail(`Invalid source bundle manifest ${name}.`);
    const bundleBytes = await readFile(path.join(repoRoot, manifest.filename)).catch(() => fail(`Missing source bundle ${manifest.filename}.`));
    const bundleHash = crypto.createHash("sha256").update(bundleBytes).digest("hex").toUpperCase();
    if (bundleHash !== manifest.sha256) fail(`Source bundle ${manifest.filename} hash does not match its manifest.`);
    const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const bundlePdf = await getDocument({ data: new Uint8Array(bundleBytes) }).promise;
    if (bundlePdf.numPages !== manifest.pdfPageCount) fail(`Source bundle ${manifest.filename} has ${bundlePdf.numPages} pages, expected ${manifest.pdfPageCount}.`);
    await bundlePdf.cleanup();
    let nextPage = 1;
    for (const [index, chapter] of manifest.chapters.entries()) {
      if (chapter.id !== manifest.chapters[0].id + index) fail(`${name} chapter ids must be contiguous.`);
      if (registeredChapters.has(chapter.id)) fail(`${name} duplicates source provenance for Chapter ${chapter.id} already registered by ${registeredChapters.get(chapter.id)}.`);
      registeredChapters.set(chapter.id, name);
      if (chapter.pageStart !== nextPage || chapter.pageEnd < chapter.pageStart) fail(`${name} page ranges must be contiguous from page 1.`);
      if (chapter.filename !== `Chapter${chapter.id}_Catalan.pdf`) fail(`${name} has an invalid derived filename for Chapter ${chapter.id}.`);
      const derivedBytes = await readFile(path.join(repoRoot, chapter.filename)).catch(() => fail(`Missing derived source ${chapter.filename}.`));
      const derivedHash = crypto.createHash("sha256").update(derivedBytes).digest("hex").toUpperCase();
      if (derivedHash !== chapter.sha256) fail(`Derived source ${chapter.filename} hash does not match ${name}.`);
      const derivedPdf = await getDocument({ data: new Uint8Array(derivedBytes) }).promise;
      const expectedPages = chapter.pageEnd - chapter.pageStart + 1;
      if (derivedPdf.numPages !== expectedPages) fail(`Derived source ${chapter.filename} has ${derivedPdf.numPages} pages, expected ${expectedPages}.`);
      await derivedPdf.cleanup();
      nextPage = chapter.pageEnd + 1;
    }
    if (nextPage !== manifest.pdfPageCount + 1) fail(`${name} does not account for every source-bundle page.`);
    console.log(`Source bundle ${manifest.filename} verified for Chapters ${manifest.chapters[0].id}-${manifest.chapters.at(-1).id}.`);
  }
}

function catalogSource(packages) {
  const ids = packages.map(({ id }) => `"${id}"`).join(", ");
  const summaries = packages.map(({ id, manifest }) => `  { id: "${id}", label: "Chapter ${id}", shortLabel: "Chapter ${id} lesson", printedRange: "printed pp.${manifest.source.printedStart}-${manifest.source.printedEnd}" },`).join("\n");
  const loaders = packages.map(({ id }) => `  "${id}": () => import("./chapter-packages/chapter-${id}").then((module) => module.CHAPTER_CONFIG),`).join("\n");
  return `/* This file is generated by \`npm run chapters:sync\`. Do not edit it by hand. */\nimport type { ChapterConfig, ChapterSummary } from "./chapter-definition";\n\nexport const CHAPTER_IDS = [${ids}] as const;\nexport type ChapterId = (typeof CHAPTER_IDS)[number];\n\nexport const CHAPTER_SUMMARIES = [\n${summaries}\n] as const satisfies readonly ChapterSummary[];\n\nexport function isChapterId(id: string): id is ChapterId {\n  return (CHAPTER_IDS as readonly string[]).includes(id);\n}\n\nconst CHAPTER_LOADERS: Record<ChapterId, () => Promise<ChapterConfig>> = {\n${loaders}\n};\n\nexport function loadChapter(id: ChapterId): Promise<ChapterConfig> {\n  return CHAPTER_LOADERS[id]();\n}\n`;
}

async function stagedPdfIds({ ignoreFilenames = [] } = {}) {
  const bundleFilenames = new Set((await sourceBundleManifests()).map(({ manifest }) => manifest.filename));
  const ignored = new Set(ignoreFilenames);
  return (await readdir(repoRoot))
    .filter((name) => !bundleFilenames.has(name) && !ignored.has(name))
    .map((name) => /^Chapter(\d+)_Catalan\.pdf$/.exec(name))
    .filter(Boolean)
    .map((match) => Number(match[1]))
    .sort((left, right) => left - right);
}

async function syncRegistry({ checkOnly = false } = {}) {
  const packages = await chapterPackages();
  const expected = catalogSource(packages);
  const current = await readFile(catalogPath, "utf8").catch(() => "");
  if (current !== expected) {
    if (checkOnly) fail("The generated chapter catalog is stale. Run `npm run chapters:sync`.");
    const temporaryPath = `${catalogPath}.${process.pid}.tmp`;
    await writeFile(temporaryPath, expected, "utf8");
    await rename(temporaryPath, catalogPath);
    console.log(`Updated ${path.relative(appRoot, catalogPath)} for ${packages.length} chapters.`);
  } else if (!checkOnly) {
    console.log(`Chapter catalog is already current (${packages.length} chapters).`);
  }
  return packages;
}

function verifyPackages(chapterId) {
  const arguments_ = [tsxCli, verifierPath];
  if (chapterId) arguments_.push("--chapter", String(chapterId));
  if (process.argv.includes("--json")) arguments_.push("--json");
  const verification = spawnSync(process.execPath, arguments_, { cwd: appRoot, encoding: "utf8" });
  if (verification.stdout) process.stdout.write(verification.stdout);
  if (verification.stderr) process.stderr.write(verification.stderr);
  if (verification.status !== 0) fail(`Chapter verification failed${chapterId ? ` for Chapter ${chapterId}` : ""}.`);
}

function runQuiet(command, arguments_, label, options = {}) {
  const result = spawnSync(command, arguments_, { cwd: appRoot, encoding: "utf8", ...options });
  if (result.status !== 0) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    fail(`${label} failed.`);
  }
  console.log(`${label} passed.`);
}

async function checkSystem({ ignoreStagedFilenames = [] } = {}) {
  const packages = await syncRegistry({ checkOnly: true });
  await verifySourceBundles();
  const reviewKeys = new Set();
  for (const { id, manifest } of packages) {
    if (reviewKeys.has(manifest.review.storageKey)) fail(`Chapter ${id} reuses review key ${manifest.review.storageKey}.`);
    reviewKeys.add(manifest.review.storageKey);
  }
  verifyPackages();

  for (const relative of [
    path.join("app", "chapters", "[chapterId]", "page.tsx"),
    path.join("app", "chapters", "[chapterId]", "review", "page.tsx"),
    path.join("app", "chapters", "[chapterId]", "import", "page.tsx"),
  ]) {
    if (!(await exists(path.join(appRoot, relative)))) fail(`Shared route ${relative} is missing.`);
  }

  const staged = (await stagedPdfIds({ ignoreFilenames: ignoreStagedFilenames })).filter((id) => !packages.some((item) => item.id === id));
  const expectedNext = packages.at(-1).id + 1;
  assertStagedSequence(staged, expectedNext);
  console.log(`Chapter system OK: ${packages.length} published; ${staged.length ? `staged ${staged.map((id) => `Chapter ${id}`).join(", ")}` : `next expected Chapter ${expectedNext}`}.`);
}

async function statusSystem() {
  const packages = await chapterPackages();
  const staged = (await stagedPdfIds()).filter((id) => !packages.some((item) => item.id === id));
  const expectedNext = packages.at(-1).id + 1;
  let stagingWarning = "";
  try { assertStagedSequence(staged, expectedNext); }
  catch (error) { stagingWarning = ` Invalid staging: ${error instanceof Error ? error.message : "unknown error"}`; }
  console.log(`Chapter status: ${packages.length} published (${packages.map(({ id }) => id).join(", ")}); ${staged.length ? `staged ${staged.map((id) => `Chapter ${id}`).join(", ")}` : `next expected Chapter ${expectedNext}`}.${stagingWarning}`);
}

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function options(name) {
  return process.argv.flatMap((argument, index) => argument === name && process.argv[index + 1] ? [process.argv[index + 1]] : []);
}

export function chapterIdFromPdf(pdfOption) {
  const match = /^Chapter(\d+)_Catalan\.pdf$/.exec(path.basename(pdfOption));
  if (!match) fail(`Invalid chapter PDF ${pdfOption}; expected ChapterN_Catalan.pdf.`);
  return Number(match[1]);
}

export function directStartEntries(pdfOptions, printedStarts, expectedCropCounts) {
  if (printedStarts.length !== pdfOptions.length || expectedCropCounts.length !== pdfOptions.length) {
    fail("Repeat --printed-start and --expected-crops once for every --pdf.");
  }
  return pdfOptions.map((pdfOption, index) => {
    const printedStart = Number(printedStarts[index]);
    const expectedCrops = Number(expectedCropCounts[index]);
    if (!Number.isInteger(printedStart) || printedStart < 1) fail(`${pdfOption} needs a positive printed-start.`);
    if (!Number.isInteger(expectedCrops) || expectedCrops < 0) fail(`${pdfOption} needs a non-negative expected-crops.`);
    return { chapter: chapterIdFromPdf(pdfOption), pdfOption, printedStart, expectedCrops };
  });
}

export function directPublishEntries(chapterIds, defaultLines, defaultPlies) {
  if (defaultLines.length && defaultLines.length !== chapterIds.length) fail("Repeat --default-line once for every PDF or chapter.");
  if (defaultPlies.length && defaultPlies.length !== chapterIds.length) fail("Repeat --default-ply once for every PDF or chapter.");
  return chapterIds.map((chapter, index) => ({
    chapter: Number(chapter),
    defaultLine: defaultLines[index],
    defaultPly: defaultPlies[index] === undefined ? undefined : Number(defaultPlies[index]),
  }));
}

export function parseBatchDefinition(value) {
  const chapters = Array.isArray(value) ? value : value?.chapters;
  if (!Array.isArray(chapters) || !chapters.length) fail("A chapter batch must contain a non-empty chapters array.");
  return chapters.map((entry, index) => {
    const chapter = Number(entry?.chapter);
    const printedStart = Number(entry?.printedStart);
    const expectedCrops = Number(entry?.expectedCrops);
    const defaultPly = entry?.defaultPly === undefined ? undefined : Number(entry.defaultPly);
    if (!Number.isInteger(chapter) || chapter < 2) fail(`Batch entry ${index + 1} has an invalid chapter number.`);
    if (!Number.isInteger(printedStart) || printedStart < 1) fail(`Chapter ${chapter} needs a positive printedStart.`);
    if (!Number.isInteger(expectedCrops) || expectedCrops < 0) fail(`Chapter ${chapter} needs a non-negative expectedCrops.`);
    if (entry?.defaultLine !== undefined && (typeof entry.defaultLine !== "string" || !entry.defaultLine)) fail(`Chapter ${chapter} has an invalid defaultLine.`);
    if (defaultPly !== undefined && (!Number.isInteger(defaultPly) || defaultPly < 0)) fail(`Chapter ${chapter} has an invalid defaultPly.`);
    return { chapter, printedStart, expectedCrops, defaultLine: entry?.defaultLine, defaultPly };
  });
}

export function parseSourceBundleDefinition(value) {
  const rawChapters = Array.isArray(value) ? value : value?.chapters;
  const entries = parseBatchDefinition(value);
  return entries.map((entry, index) => {
    const raw = rawChapters[index];
    const pageStart = Number(raw?.pageStart);
    const pageEnd = Number(raw?.pageEnd);
    if (!Number.isInteger(pageStart) || pageStart < 1) fail(`Chapter ${entry.chapter} needs a positive source pageStart.`);
    if (!Number.isInteger(pageEnd) || pageEnd < pageStart) fail(`Chapter ${entry.chapter} needs a source pageEnd at or after pageStart.`);
    return { ...entry, pageStart, pageEnd };
  });
}

export function assertSequentialBatch(entries, expectedFirstChapter) {
  entries.forEach((entry, index) => {
    const expected = expectedFirstChapter + index;
    if (entry.chapter !== expected) fail(`Chapter batches must be contiguous from Chapter ${expectedFirstChapter}; expected Chapter ${expected}, found Chapter ${entry.chapter}.`);
  });
}

export function assertStagedSequence(stagedChapterIds, expectedFirstChapter) {
  if (!stagedChapterIds.length) return;
  assertSequentialBatch(stagedChapterIds.map((chapter) => ({ chapter })), expectedFirstChapter);
}

export function assertSourceBundlePageRanges(entries, pdfPageCount) {
  if (!Number.isInteger(pdfPageCount) || pdfPageCount < 1) fail("A source bundle needs a positive PDF page count.");
  let expectedPage = 1;
  for (const entry of entries) {
    if (entry.pageStart !== expectedPage || entry.pageEnd < entry.pageStart || entry.pageEnd > pdfPageCount) {
      fail(`Source bundle pages must be contiguous from page 1; expected ${expectedPage}-${pdfPageCount}, found ${entry.pageStart}-${entry.pageEnd} for Chapter ${entry.chapter}.`);
    }
    expectedPage = entry.pageEnd + 1;
  }
  if (expectedPage !== pdfPageCount + 1) fail(`Source bundle does not account for every page; ends at ${expectedPage - 1}, expected ${pdfPageCount}.`);
}

async function readBatchValue() {
  const batchOption = option("--batch");
  if (!batchOption) return undefined;
  const batchPath = path.resolve(process.cwd(), batchOption);
  const value = JSON.parse(await readFile(batchPath, "utf8").catch(() => fail(`Could not read batch definition ${batchOption}.`)));
  return { batchOption, value };
}

async function readBatchDefinition() {
  const batch = await readBatchValue();
  return batch ? parseBatchDefinition(batch.value) : undefined;
}

async function readSourceBundleDefinition() {
  const batch = await readBatchValue();
  if (!batch) fail("Pass --batch <file> with pageStart and pageEnd for every chapter in the source bundle.");
  return parseSourceBundleDefinition(batch.value);
}

async function inspectPdf(pdfOption) {
  if (!pdfOption) fail("Pass a PDF with `--pdf <path>`.");
  const pdfPath = path.resolve(process.cwd(), pdfOption);
  const chapterId = chapterIdFromPdf(pdfPath);
  const bytes = await readFile(pdfPath);
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const pdf = await getDocument({ data: new Uint8Array(bytes) }).promise;
  const firstPage = await pdf.getPage(1);
  const firstContent = await firstPage.getTextContent();
  const preview = firstContent.items.filter((item) => "str" in item).map((item) => item.str).join(" ").replace(/\s+/g, " ").trim().slice(0, 240);
  const result = {
    chapterId,
    filename: path.basename(pdfPath),
    bytes: bytes.byteLength,
    pageCount: pdf.numPages,
    sha256: crypto.createHash("sha256").update(bytes).digest("hex").toUpperCase(),
    firstPagePreview: preview,
  };
  await pdf.cleanup();
  return { pdfPath, bytes, result };
}

async function inspectSourceBundle(pdfPath) {
  const bytes = await readFile(pdfPath).catch(() => fail(`Could not read source bundle ${path.basename(pdfPath)}.`));
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const pdf = await getDocument({ data: new Uint8Array(bytes) }).promise;
  const result = {
    filename: path.basename(pdfPath),
    sha256: crypto.createHash("sha256").update(bytes).digest("hex").toUpperCase(),
    pdfPageCount: pdf.numPages,
  };
  await pdf.cleanup();
  return result;
}

function pythonWithPypdf() {
  const bundledPython = process.platform === "win32" && process.env.USERPROFILE
    ? path.join(process.env.USERPROFILE, ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "python", "python.exe")
    : undefined;
  const candidates = [...new Set([process.env.CHAPTERS_PYTHON, process.env.PYTHON, bundledPython, "python"].filter(Boolean))];
  for (const candidate of candidates) {
    const probe = spawnSync(candidate, ["-c", "import pypdf"], { encoding: "utf8" });
    if (probe.status === 0) return candidate;
  }
  fail("Source bundle splitting requires Python with pypdf. Set CHAPTERS_PYTHON to a suitable interpreter.");
}

async function bundleChapterSources() {
  const pdfOption = option("--pdf");
  if (!pdfOption) fail("Pass a combined source PDF with --pdf <path>.");
  const entries = await readSourceBundleDefinition();
  const sourcePath = path.resolve(process.cwd(), pdfOption);
  const sourceName = path.basename(sourcePath);
  if (path.dirname(sourcePath).toLowerCase() !== repoRoot.toLowerCase()) fail(`${sourceName} must be staged at the repository root.`);
  if (!/\.pdf$/i.test(sourceName) || entries.length < 2) fail("A source bundle must be a root PDF that contains at least two chapters.");

  await checkSystem({ ignoreStagedFilenames: [sourceName] });
  const publishedIds = await publishedCatalogIds();
  assertSequentialBatch(entries, publishedIds.at(-1) + 1);
  const source = await inspectSourceBundle(sourcePath);
  assertSourceBundlePageRanges(entries, source.pdfPageCount);

  const matchingBundle = (await sourceBundleManifests()).find(({ manifest }) => manifest.filename === source.filename
    && Array.isArray(manifest.chapters)
    && manifest.chapters.length === entries.length
    && entries.every((entry, index) => manifest.chapters[index]?.id === entry.chapter && manifest.chapters[index].pageStart === entry.pageStart && manifest.chapters[index].pageEnd === entry.pageEnd));
  const bundleManifestPath = matchingBundle
    ? path.join(sourceBundlesDirectory, matchingBundle.name)
    : path.join(sourceBundlesDirectory, `chapter-${entries[0].chapter}-${entries.at(-1).chapter}.json`);
  if (await exists(bundleManifestPath)) {
    const existing = JSON.parse(await readFile(bundleManifestPath, "utf8"));
    const sameDefinition = existing.schemaVersion === 1
      && existing.filename === source.filename
      && existing.sha256 === source.sha256
      && existing.pdfPageCount === source.pdfPageCount
      && Array.isArray(existing.chapters)
      && existing.chapters.length === entries.length
      && entries.every((entry, index) => {
        const chapter = existing.chapters[index];
        return chapter?.id === entry.chapter && chapter.pageStart === entry.pageStart && chapter.pageEnd === entry.pageEnd && chapter.filename === `Chapter${entry.chapter}_Catalan.pdf`;
      });
    if (!sameDefinition) fail(`${path.relative(repoRoot, bundleManifestPath)} already describes a different source bundle; refuse to replace verified provenance.`);
    await verifySourceBundles();
    console.log(`Source bundle ${sourceName} is already registered for Chapters ${entries[0].chapter}-${entries.at(-1).chapter}.`);
    return;
  }

  const temporaryDirectory = path.join(repoRoot, "tmp", "pdfs", `source-bundle-${entries[0].chapter}-${entries.at(-1).chapter}-${process.pid}`);
  const safeTemporaryRoot = path.join(repoRoot, "tmp", "pdfs") + path.sep;
  if (!temporaryDirectory.startsWith(safeTemporaryRoot)) fail("Refusing to write source bundle output outside tmp/pdfs.");
  const createdFiles = [];
  let createdManifest = false;
  try {
    await mkdir(temporaryDirectory, { recursive: true });
    const split = spawnSync(pythonWithPypdf(), [
      bundleSplitterPath,
      "--input", sourcePath,
      "--output-dir", temporaryDirectory,
      "--ranges", JSON.stringify(entries.map(({ chapter, pageStart, pageEnd }) => ({ chapter, pageStart, pageEnd }))),
    ], { cwd: appRoot, encoding: "utf8" });
    if (split.status !== 0) {
      if (split.stdout) process.stdout.write(split.stdout);
      if (split.stderr) process.stderr.write(split.stderr);
      fail("Source bundle split failed.");
    }

    const chapters = [];
    for (const entry of entries) {
      const temporaryPdf = path.join(temporaryDirectory, `Chapter${entry.chapter}_Catalan.pdf`);
      const { result } = await inspectPdf(temporaryPdf);
      const expectedPages = entry.pageEnd - entry.pageStart + 1;
      if (result.chapterId !== entry.chapter || result.pageCount !== expectedPages) fail(`Split Chapter ${entry.chapter} has the wrong identity or page count.`);
      const target = path.join(repoRoot, result.filename);
      if (await exists(target)) {
        const existingHash = crypto.createHash("sha256").update(await readFile(target)).digest("hex").toUpperCase();
        if (existingHash !== result.sha256) fail(`${result.filename} already exists with different bytes; refuse to overwrite staged source evidence.`);
      } else {
        await copyFile(temporaryPdf, target);
        createdFiles.push(target);
      }
      chapters.push({ id: entry.chapter, pageStart: entry.pageStart, pageEnd: entry.pageEnd, filename: result.filename, sha256: result.sha256 });
    }

    await mkdir(sourceBundlesDirectory, { recursive: true });
    await writeAtomic(bundleManifestPath, `${JSON.stringify({ schemaVersion: 1, ...source, chapters }, null, 2)}\n`);
    createdManifest = true;
    await verifySourceBundles();
    console.log(`Split and registered ${sourceName} as Chapters ${entries[0].chapter}-${entries.at(-1).chapter}. Run chapters:start with the same batch next.`);
  } catch (error) {
    if (createdManifest) await rm(bundleManifestPath, { force: true });
    for (const target of createdFiles.reverse()) await rm(target, { force: true });
    throw error;
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

async function prepareChapter({ pdfOption = option("--pdf"), printedStartOption = option("--printed-start"), force = process.argv.includes("--force"), expectedId: expectedIdOverride } = {}) {
  const { pdfPath, bytes, result } = await inspectPdf(pdfOption);
  const printedStart = Number(printedStartOption);
  if (!Number.isInteger(printedStart) || printedStart < 1) fail("Pass the first printed page number with `--printed-start <number>`.");
  const packages = expectedIdOverride === undefined ? await chapterPackages() : undefined;
  const expectedId = expectedIdOverride ?? packages.at(-1).id + 1;
  if (result.chapterId !== expectedId) fail(`The next publishable PDF is Chapter${expectedId}_Catalan.pdf, not Chapter ${result.chapterId}.`);

  const output = path.join(repoRoot, "tmp", "pdfs", `chapter-${result.chapterId}`);
  if (await exists(output)) {
    const prepared = await readFile(path.join(output, "source-manifest.json"), "utf8").then(JSON.parse).catch(() => undefined);
    const pageFilesPresent = prepared && (await Promise.all(prepared.pages.map(({ printedPage }) => exists(path.join(output, `printed-${String(printedPage).padStart(2, "0")}.png`))))).every(Boolean);
    if (prepared?.sha256 === result.sha256 && prepared.printedStart === printedStart && prepared.pageCount === result.pageCount && pageFilesPresent && !force) {
      console.log(`Reused prepared Chapter ${result.chapterId} evidence (${result.pageCount} pages).`);
      return { output, manifest: prepared, reused: true };
    }
    if (!force) fail(`${path.relative(repoRoot, output)} contains different or incomplete evidence. Rerun with --force to replace it.`);
    const safeRoot = path.join(repoRoot, "tmp", "pdfs") + path.sep;
    if (!output.startsWith(safeRoot)) fail("Refusing to replace evidence outside tmp/pdfs.");
    await rm(output, { recursive: true, force: true });
  }
  await mkdir(output, { recursive: true });
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const pdf = await getDocument({ data: new Uint8Array(bytes) }).promise;
  const pages = [];
  for (let index = 1; index <= pdf.numPages; index += 1) {
    const page = await pdf.getPage(index);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const text = content.items.filter((item) => "str" in item).map((item) => item.str).join(" ").replace(/\s+/g, " ").trim();
    const printedPage = printedStart + index - 1;
    const textFile = `printed-${String(printedPage).padStart(2, "0")}.txt`;
    await writeFile(path.join(output, textFile), `${text}\n`, "utf8");
    const positioned = content.items
      .filter((item) => "str" in item && "transform" in item)
      .map((item) => ({ str: item.str, x: item.transform[4], top: viewport.height - item.transform[5] }));
    const regionText = (x0, x1) => positioned
      .filter((item) => item.x >= x0 && item.x < x1 && item.top >= 32 && item.top <= 650)
      .sort((left, right) => Math.abs(left.top - right.top) < 2 ? left.x - right.x : left.top - right.top)
      .map((item) => item.str)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (index === 1) {
      const fullTextFile = `printed-${String(printedPage).padStart(2, "0")}-full.txt`;
      await writeFile(path.join(output, fullTextFile), `${regionText(0, viewport.width)}\n`, "utf8");
      pages.push({ pageIndex: index - 1, printedPage, textFile, regions: [{ column: "full", textFile: fullTextFile }] });
    } else {
      const leftTextFile = `printed-${String(printedPage).padStart(2, "0")}-left.txt`;
      const rightTextFile = `printed-${String(printedPage).padStart(2, "0")}-right.txt`;
      await writeFile(path.join(output, leftTextFile), `${regionText(35, 237)}\n`, "utf8");
      await writeFile(path.join(output, rightTextFile), `${regionText(237, 440)}\n`, "utf8");
      pages.push({ pageIndex: index - 1, printedPage, textFile, regions: [{ column: "left", textFile: leftTextFile }, { column: "right", textFile: rightTextFile }] });
    }
  }
  await pdf.cleanup();
  const manifest = { ...result, printedStart, printedEnd: printedStart + result.pageCount - 1, sourcePath: path.relative(repoRoot, pdfPath), pages };
  await writeFile(path.join(output, "source-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  const pathDirectories = (process.env.PATH ?? "").split(path.delimiter);
  const windowsCandidates = process.platform === "win32" ? [
    process.env.PDFTOPPM_PATH,
    ...pathDirectories.map((directory) => path.join(directory, "pdftoppm.exe")),
    process.env.USERPROFILE && path.join(process.env.USERPROFILE, ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "native", "poppler", "Library", "bin", "pdftoppm.exe"),
    ...pathDirectories.map((directory) => path.join(directory, "pdftoppm.cmd")),
  ].filter(Boolean) : [process.env.PDFTOPPM_PATH, "pdftoppm"].filter(Boolean);
  const renderer = windowsCandidates.find((candidate) => process.platform !== "win32" || existsSync(candidate));
  if (!renderer) fail("PDF rendering failed: pdftoppm was not found. Install Poppler or set PDFTOPPM_PATH.");
  const render = spawnSync(renderer, ["-png", "-r", "144", pdfPath, path.join(output, "rendered")], { encoding: "utf8", shell: renderer.toLowerCase().endsWith(".cmd") });
  if (render.status !== 0) fail(`PDF rendering failed: ${(render.stderr || render.stdout || "pdftoppm unavailable").trim()}`);
  const renderedPages = (await readdir(output))
    .map((name) => ({ name, match: /^rendered-(\d+)\.png$/.exec(name) }))
    .filter((item) => item.match)
    .sort((left, right) => Number(left.match[1]) - Number(right.match[1]));
  if (renderedPages.length !== result.pageCount) fail(`Expected ${result.pageCount} rendered pages, found ${renderedPages.length}.`);
  for (const [index, rendered] of renderedPages.entries()) {
    const printedPage = printedStart + index;
    await rename(path.join(output, rendered.name), path.join(output, `printed-${String(printedPage).padStart(2, "0")}.png`));
  }
  console.log(`Prepared Chapter ${result.chapterId} evidence in ${path.relative(repoRoot, output)} (${result.pageCount} pages, printed ${manifest.printedStart}-${manifest.printedEnd}).`);
  return { output, manifest, reused: false };
}

function selectAnchor(text, fromEnd = false) {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (!words.length) return "";
  const isStableWord = (word) => /^[A-Za-z][A-Za-z'-]*[A-Za-z]$/.test(word) && word.length >= 2;
  for (const width of [5, 4, 3, 2]) {
    const starts = Array.from({ length: Math.max(0, words.length - width + 1) }, (_, index) => index);
    if (fromEnd) starts.reverse();
    const start = starts.find((index) => words.slice(index, index + width).every(isStableWord));
    if (start !== undefined) return words.slice(start, start + width).join(" ");
  }
  const width = Math.min(4, words.length);
  const start = fromEnd ? Math.max(0, words.length - width) : 0;
  return words.slice(start, start + width).join(" ");
}

export function authoringBundleSource(source, regions, diagrams) {
  const lines = [
    `# Chapter ${source.chapterId} authoring bundle`,
    "",
    `Source: ${source.filename} | SHA-256: ${source.sha256} | PDF pages: ${source.pageCount} | printed pp.${source.printedStart}-${source.printedEnd}`,
    "",
    "Read only the ordered regions below; the duplicate whole-page extraction files are intentionally omitted.",
    "",
    "## Source regions",
    "",
  ];
  for (const region of regions) {
    lines.push(`### ${region.id} — printed p.${region.printedPage} ${region.column}`, "", region.text, "", `Suggested anchors: ${JSON.stringify([selectAnchor(region.text), selectAnchor(region.text, true)])}`, "");
  }
  lines.push("## Diagram audit", "", `Expected and detected: ${diagrams.length}`, "", ...diagrams.map((diagram) => `- ${diagram.id}: ${diagram.page}`), "", "Open the adjacent crop contact sheet once, then reconcile every ID with the lesson.", "");
  return `${lines.join("\n")}\n`;
}

export function draftManifest(source, regions, diagramCount) {
  return {
    schemaVersion: 1,
    id: source.chapterId,
    source: {
      filename: source.filename,
      sha256: source.sha256,
      pdfPageCount: source.pageCount,
      printedStart: source.printedStart,
      printedEnd: source.printedEnd,
    },
    lesson: { publicationProfile: "authored", expectedCanonicalHash: AUTO_HASH, defaultPosition: { lineId: "SET_DURING_PUBLISH", ply: 0 } },
    review: { storageKey: `catalan-chapter-${source.chapterId}-review-v1`, schemaVersion: 3 },
    verification: {
      regions: regions.map((region) => ({
        id: region.id,
        anchors: [selectAnchor(region.text), selectAnchor(region.text, true)].filter(Boolean),
      })),
    },
    evidence: { pageCount: source.pageCount, diagramCount, strictDirectory: true, inventorySha256: AUTO_HASH },
  };
}

export function chapterPackageSource(chapterId) {
  return `import { CHAPTER${chapterId}_ANNOTATED_MOVE_IDS, CHAPTER${chapterId}_LESSON, CHAPTER${chapterId}_SECTIONS } from "../chapter${chapterId}-lesson";\nimport manifest from "../chapter-manifests/chapter-${chapterId}.json";\nimport { defineChapterPackage } from "../chapter-package";\n\nexport const CHAPTER_CONFIG = defineChapterPackage(manifest, {\n  lesson: CHAPTER${chapterId}_LESSON,\n  annotatedMoveIds: CHAPTER${chapterId}_ANNOTATED_MOVE_IDS,\n  sections: CHAPTER${chapterId}_SECTIONS,\n});\n`;
}

async function startChapterWorkspace({ chapter, pdfOption, printedStart, expectedCrops }, force) {
  const prepared = await prepareChapter({ pdfOption, printedStartOption: printedStart, force, expectedId: chapter });
  const cropOutput = path.join(repoRoot, "tmp", "pdfs", `chapter-${prepared.manifest.chapterId}-crops`);
  let diagrams = await readFile(path.join(cropOutput, "diagram-manifest.json"), "utf8").then(JSON.parse).catch(() => undefined);
  const reusableCrops = diagrams?.length === expectedCrops
    && await exists(path.join(cropOutput, "contact-sheet.png"))
    && (await Promise.all(diagrams.map(({ id }) => exists(path.join(cropOutput, `${id}.png`))))).every(Boolean);
  if (!reusableCrops || force) {
    if (await exists(cropOutput)) {
      const safeRoot = path.join(repoRoot, "tmp", "pdfs") + path.sep;
      if (!cropOutput.startsWith(safeRoot)) fail("Refusing to replace crops outside tmp/pdfs.");
      await rm(cropOutput, { recursive: true, force: true });
    }
    runQuiet("python", [cropExtractorPath, "--input", prepared.output, "--output", cropOutput, "--prefix", `CH${prepared.manifest.chapterId}`, "--expected", String(expectedCrops)], "Diagram extraction");
    diagrams = JSON.parse(await readFile(path.join(cropOutput, "diagram-manifest.json"), "utf8"));
  } else {
    console.log(`Reused ${expectedCrops} audited diagram crops.`);
  }
  const regions = [];
  for (const page of prepared.manifest.pages) {
    for (const region of page.regions) {
      const id = `chapter${prepared.manifest.chapterId}-p${page.printedPage}-${region.column}`;
      const text = (await readFile(path.join(prepared.output, region.textFile), "utf8")).trim();
      regions.push({ id, printedPage: page.printedPage, column: region.column, text });
    }
  }
  const bundlePath = path.join(prepared.output, "authoring-context.md");
  await writeFile(bundlePath, authoringBundleSource(prepared.manifest, regions, diagrams), "utf8");
  const draftManifestPath = path.join(prepared.output, "chapter-manifest.draft.json");
  await writeFile(draftManifestPath, `${JSON.stringify(draftManifest(prepared.manifest, regions, diagrams.length), null, 2)}\n`, "utf8");
  console.log(`Authoring input ready: ${path.relative(repoRoot, bundlePath)}, one crop contact sheet, and a generated manifest draft.`);
}

async function startChapter() {
  const batch = await readBatchDefinition();
  const publishedIds = await publishedCatalogIds();
  const expectedId = publishedIds.at(-1) + 1;
  const pdfOptions = options("--pdf");
  if (batch && pdfOptions.length) fail("Use either --batch or one or more --pdf arguments, not both.");
  const entries = batch ?? (pdfOptions.length
    ? directStartEntries(pdfOptions, options("--printed-start"), options("--expected-crops"))
    : [{
      chapter: expectedId,
      pdfOption: path.join(repoRoot, `Chapter${expectedId}_Catalan.pdf`),
      printedStart: Number(option("--printed-start")),
      expectedCrops: Number(option("--expected-crops")),
    }]);
  assertSequentialBatch(entries, expectedId);
  for (const entry of entries) {
    entry.pdfOption ??= path.join(repoRoot, `Chapter${entry.chapter}_Catalan.pdf`);
    if (!Number.isInteger(entry.printedStart) || entry.printedStart < 1) fail(`Chapter ${entry.chapter} needs a positive printedStart.`);
    if (!Number.isInteger(entry.expectedCrops) || entry.expectedCrops < 0) fail(`Chapter ${entry.chapter} needs a non-negative expectedCrops.`);
    const resolvedPdf = path.resolve(process.cwd(), entry.pdfOption);
    if (path.dirname(resolvedPdf).toLowerCase() !== repoRoot.toLowerCase()) fail(`${path.basename(resolvedPdf)} must be staged at the repository root.`);
    if (!(await exists(resolvedPdf))) fail(`No staged Chapter${entry.chapter}_Catalan.pdf was found.`);
  }
  await checkSystem();
  const force = process.argv.includes("--force");
  for (const entry of entries) await startChapterWorkspace(entry, force);
  if (entries.length > 1) console.log(`Prepared ${entries.length} chapter workspaces (${entries.map(({ chapter }) => chapter).join(", ")}) with one baseline check.`);
}

async function promoteEvidence(chapterId) {
  const publicRoot = path.join(appRoot, "public", "source", `chapter${chapterId}`);
  const pageTarget = path.join(publicRoot, "pages");
  const cropTarget = path.join(publicRoot, "crops");
  if (await exists(pageTarget) && await exists(cropTarget)) return [];
  const preparedDirectory = path.join(repoRoot, "tmp", "pdfs", `chapter-${chapterId}`);
  const cropDirectory = path.join(repoRoot, "tmp", "pdfs", `chapter-${chapterId}-crops`);
  const source = JSON.parse(await readFile(path.join(preparedDirectory, "source-manifest.json"), "utf8"));
  const diagrams = JSON.parse(await readFile(path.join(cropDirectory, "diagram-manifest.json"), "utf8"));
  const created = [];
  try {
    if (!(await exists(pageTarget))) {
      await mkdir(pageTarget, { recursive: true });
      created.push(pageTarget);
      for (const page of source.pages) {
        const filename = `printed-${String(page.printedPage).padStart(2, "0")}.png`;
        await copyFile(path.join(preparedDirectory, filename), path.join(pageTarget, filename));
      }
    }
    if (!(await exists(cropTarget))) {
      await mkdir(cropTarget, { recursive: true });
      created.push(cropTarget);
      for (const diagram of diagrams) await copyFile(path.join(cropDirectory, `${diagram.id}.png`), path.join(cropTarget, `${diagram.id}.png`));
    }
  } catch (error) {
    for (const target of created.reverse()) await rm(target, { recursive: true, force: true });
    throw error;
  }
  return created;
}

async function freezeGeneratedHashes(chapterId, manifestPath) {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  if (manifest.lesson.expectedCanonicalHash !== AUTO_HASH && manifest.evidence.inventorySha256 !== AUTO_HASH) return false;
  const result = spawnSync(process.execPath, [tsxCli, verifierPath, "--chapter", String(chapterId), "--json"], { cwd: appRoot, encoding: "utf8" });
  let report;
  try { report = JSON.parse(result.stdout).reports?.[0]; }
  catch {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    fail("Could not derive generated chapter hashes.");
  }
  if (!report) fail("The verifier did not report the generated chapter.");
  if (manifest.lesson.expectedCanonicalHash === AUTO_HASH) manifest.lesson.expectedCanonicalHash = report.canonicalHash;
  if (manifest.evidence.inventorySha256 === AUTO_HASH) manifest.evidence.inventorySha256 = report.evidenceInventoryHash;
  await writeAtomic(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return true;
}

async function rollbackPublication(state) {
  for (const target of state.createdFiles.reverse()) await rm(target, { force: true });
  for (const target of state.createdEvidence.reverse()) await rm(target, { recursive: true, force: true });
  if (state.previousManifest !== undefined && await exists(state.manifestPath)) await writeAtomic(state.manifestPath, state.previousManifest);
}

async function preflightPublication(entry) {
  const chapterId = entry.chapter;
  const lessonPath = path.join(appRoot, "app", `chapter${chapterId}-lesson.ts`);
  const manifestPath = path.join(manifestsDirectory, `chapter-${chapterId}.json`);
  const packagePath = path.join(packagesDirectory, `chapter-${chapterId}.ts`);
  const pdfPath = path.join(repoRoot, `Chapter${chapterId}_Catalan.pdf`);
  for (const required of [lessonPath, pdfPath]) if (!(await exists(required))) fail(`Missing ${path.relative(repoRoot, required)}.`);
  const state = {
    chapterId,
    manifestPath,
    previousManifest: await readFile(manifestPath, "utf8").catch(() => undefined),
    createdFiles: [],
    createdEvidence: [],
  };
  try {
    if (!(await exists(manifestPath))) {
      const draftPath = path.join(repoRoot, "tmp", "pdfs", `chapter-${chapterId}`, "chapter-manifest.draft.json");
      const manifest = JSON.parse(await readFile(draftPath, "utf8").catch(() => fail(`Missing ${path.relative(repoRoot, draftPath)}; run chapters:start first.`)));
      const defaultLine = entry.defaultLine;
      const defaultPly = entry.defaultPly;
      if (!defaultLine || !Number.isInteger(defaultPly) || defaultPly < 0) fail("Pass --default-line <line-id> and --default-ply <number> for the lesson's initial board.");
      manifest.lesson.defaultPosition = { lineId: defaultLine, ply: defaultPly };
      await writeAtomic(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
      state.createdFiles.push(manifestPath);
    }
    if (!(await exists(packagePath))) {
      await writeAtomic(packagePath, chapterPackageSource(chapterId));
      state.createdFiles.push(packagePath);
    }
    state.createdEvidence = await promoteEvidence(chapterId);
    runQuiet(process.execPath, [tsxCli, lessonValidatorPath, lessonPath], `Chapter ${chapterId} lesson validation`);
    await freezeGeneratedHashes(chapterId, manifestPath);
    verifyPackages(chapterId);
    runQuiet(process.execPath, [tsxCli, importVerifierPath, lessonPath, packagePath, pdfPath], `Chapter ${chapterId} exact-PDF verification`);
    return state;
  } catch (error) {
    await rollbackPublication(state);
    throw error;
  }
}

async function publishChapter() {
  const batch = await readBatchDefinition();
  const pdfOptions = options("--pdf");
  const chapterOptions = options("--chapter");
  if (batch && (pdfOptions.length || chapterOptions.length)) fail("Use either --batch or direct PDF/chapter arguments, not both.");
  if (!batch && !pdfOptions.length && !chapterOptions.length) fail("Pass one or more --pdf arguments, --chapter arguments, or --batch <file>.");
  if (pdfOptions.length && chapterOptions.length) fail("Use PDFs or chapter numbers in one publication command, not both.");
  for (const pdfOption of pdfOptions) {
    const resolvedPdf = path.resolve(process.cwd(), pdfOption);
    if (path.dirname(resolvedPdf).toLowerCase() !== repoRoot.toLowerCase()) fail(`${path.basename(resolvedPdf)} must be staged at the repository root.`);
  }
  const directChapterIds = pdfOptions.length ? pdfOptions.map(chapterIdFromPdf) : chapterOptions.map(Number);
  const entries = batch ?? directPublishEntries(directChapterIds, options("--default-line"), options("--default-ply"));
  for (const entry of entries) if (!Number.isInteger(entry.chapter) || entry.chapter < 2) fail(`Invalid chapter number ${entry.chapter}.`);
  await checkSystem();
  const publishedIds = await publishedCatalogIds();
  assertSequentialBatch(entries, publishedIds.at(-1) + 1);
  const previousCatalog = await readFile(catalogPath, "utf8").catch(() => "");
  const states = [];
  try {
    for (const entry of entries) states.push(await preflightPublication(entry));
    await syncRegistry();
    const npmCli = process.env.npm_execpath;
    if (!npmCli) fail("chapters:publish must be run through npm.");
    runQuiet(process.execPath, [npmCli, "test"], "Batch application test suite");
    runQuiet(process.execPath, [npmCli, "run", "lint"], "Batch lint");
  } catch (error) {
    await writeAtomic(catalogPath, previousCatalog);
    for (const state of states.reverse()) await rollbackPublication(state);
    throw error;
  }
  const label = entries.length === 1 ? `Chapter ${entries[0].chapter}` : `Chapters ${entries[0].chapter}-${entries.at(-1).chapter}`;
  console.log(`${label} automated publication gates passed with one catalog sync and one global test/lint run. Complete the desktop and narrow visual review.`);
}

async function main() {
  requireSupportedNode();
  const command = process.argv[2];
  if (command === "sync") {
    verifyPackages();
    return syncRegistry();
  }
  if (command === "check") return checkSystem();
  if (command === "status") return statusSystem();
  if (command === "verify") return verifyPackages(Number(option("--chapter")) || undefined);
  if (command === "inspect") {
    const { result } = await inspectPdf(option("--pdf"));
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (command === "prepare") return prepareChapter();
  if (command === "bundle") return bundleChapterSources();
  if (command === "start") return startChapter();
  if (command === "publish") return publishChapter();
  fail("Use one of: status, check, verify, sync, inspect, prepare, bundle, start, publish.");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`Chapter system failed: ${error.message}`);
    process.exitCode = 1;
  });
}
