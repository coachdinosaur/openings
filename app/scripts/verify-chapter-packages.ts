import crypto from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { canonicalize } from "../app/canonical";
import type { ChapterConfig } from "../app/chapter-definition";
import { validateChapterConfig } from "../app/chapter-validation";
import { extractDeclaredRegions } from "../app/pdf-regions";

const appRoot = path.resolve(import.meta.dirname, "..");
const repoRoot = path.resolve(appRoot, "..");
const packagesDirectory = path.join(appRoot, "app", "chapter-packages");
const requestedId = process.argv.includes("--chapter") ? Number(process.argv[process.argv.indexOf("--chapter") + 1]) : undefined;
const json = process.argv.includes("--json");

function sha256(data: Uint8Array | string) {
  return crypto.createHash("sha256").update(data).digest("hex").toUpperCase();
}

function publicPath(assetPath: string) {
  return path.join(appRoot, "public", assetPath.replace(/^\//, "").replaceAll("/", path.sep));
}

async function packageIds() {
  return (await readdir(packagesDirectory))
    .map((name) => /^chapter-(\d+)\.ts$/.exec(name)?.[1])
    .filter((id): id is string => Boolean(id))
    .map(Number)
    .filter((id) => requestedId === undefined || id === requestedId)
    .sort((left, right) => left - right);
}

async function verifyEvidence(config: ChapterConfig, errors: string[]) {
  const referencedPages = [...new Set(config.lesson.sourceSpans.map((span) => span.crop))];
  const referencedDiagrams = [...new Set(config.lesson.diagrams.map((diagram) => diagram.crop))];
  const referencedAssets = [...new Set([...referencedPages, ...referencedDiagrams])].sort();
  const inventory: string[] = [];
  for (const asset of referencedAssets) {
    const bytes = await readFile(publicPath(asset)).catch(() => undefined);
    if (!bytes) errors.push(`missing evidence asset ${asset}`);
    else inventory.push(`${asset}\0${sha256(bytes)}`);
  }
  const inventoryHash = sha256(inventory.join("\n"));
  if (config.manifest.evidence.inventorySha256 && inventoryHash !== config.manifest.evidence.inventorySha256) errors.push(`evidence inventory hash ${inventoryHash} does not match manifest`);
  if (config.manifest.evidence.strictDirectory) {
    for (const [kind, assets] of [["page", referencedPages], ["diagram", referencedDiagrams]] as const) {
      const directories = [...new Set(assets.map((asset) => path.dirname(publicPath(asset))))];
      if (directories.length !== 1) {
        errors.push(`${kind} evidence must use one directory`);
        continue;
      }
      const files = (await readdir(directories[0])).filter((name) => name.toLowerCase().endsWith(".png")).sort();
      const expected = assets.map((asset) => path.basename(asset)).sort();
      if (files.length !== expected.length || files.some((name, index) => name !== expected[index])) errors.push(`${kind} evidence directory does not exactly match referenced assets`);
    }
  }
  return inventoryHash;
}

async function verifyPackage(id: number) {
  const modulePath = path.join(packagesDirectory, `chapter-${id}.ts`);
  const chapterModule = await import(`${pathToFileURL(modulePath).href}?verify=${Date.now()}`) as { CHAPTER_CONFIG?: ChapterConfig };
  if (!chapterModule.CHAPTER_CONFIG) throw new Error(`chapter-${id}.ts does not export CHAPTER_CONFIG`);
  const config = chapterModule.CHAPTER_CONFIG;
  const errors = validateChapterConfig(config);
  if (config.id !== String(id)) errors.push(`package filename chapter-${id} does not match config id ${config.id}`);

  const pdfPath = path.join(repoRoot, config.manifest.source.filename);
  const bytes = await readFile(pdfPath).catch(() => undefined);
  let extractedRegionCount = 0;
  if (!bytes) {
    errors.push(`missing root source PDF ${config.manifest.source.filename}`);
  } else {
    const sourceHash = sha256(bytes);
    if (sourceHash !== config.manifest.source.sha256) errors.push(`source PDF hash ${sourceHash} does not match manifest`);
    const pdf = await getDocument({ data: new Uint8Array(bytes) }).promise;
    if (pdf.numPages !== config.manifest.source.pdfPageCount) errors.push(`source PDF has ${pdf.numPages} pages, expected ${config.manifest.source.pdfPageCount}`);
    try {
      extractedRegionCount = (await extractDeclaredRegions(pdf, config.lesson, config.manifest.verification.regions)).length;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "source regions could not be verified");
    }
    await pdf.cleanup();
  }

  const canonicalHash = sha256(canonicalize(config.lesson));
  if (config.manifest.lesson.expectedCanonicalHash && canonicalHash !== config.manifest.lesson.expectedCanonicalHash) errors.push(`canonical lesson hash ${canonicalHash} does not match manifest`);
  const evidenceInventoryHash = await verifyEvidence(config, errors);
  return { id, label: config.label, canonicalHash, evidenceInventoryHash, extractedRegionCount, errors };
}

const ids = await packageIds();
if (!ids.length) throw new Error(requestedId ? `No package found for Chapter ${requestedId}` : "No chapter packages found");
const reports = [];
for (const id of ids) reports.push(await verifyPackage(id));
if (json) console.log(JSON.stringify({ ok: reports.every((report) => !report.errors.length), reports }, null, 2));
else {
  for (const report of reports) {
    if (report.errors.length) console.error(`${report.label}:\n- ${report.errors.join("\n- ")}`);
    else console.log(`${report.label} verified: ${report.extractedRegionCount} regions; canonical ${report.canonicalHash}.`);
  }
}
if (reports.some((report) => report.errors.length)) process.exitCode = 1;
