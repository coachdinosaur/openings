import crypto from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { canonicalize } from "../app/canonical";
import type { ChapterConfig } from "../app/chapter-definition";
import { extractDeclaredRegions } from "../app/pdf-regions";

const [lessonPath, packagePath, pdfPath] = process.argv.slice(2);
if (!lessonPath || !packagePath || !pdfPath) throw new Error("Usage: tsx scripts/verify-chapter-import.ts app/chapterN-lesson.ts app/chapter-packages/chapter-N.ts ../ChapterN_Catalan.pdf");

const packageModule = await import(pathToFileURL(path.resolve(packagePath)).href) as { CHAPTER_CONFIG?: ChapterConfig };
const config = packageModule.CHAPTER_CONFIG;
if (!config) throw new Error(`No CHAPTER_CONFIG export found in ${packagePath}`);
const expectedLessonName = `chapter${config.id}-lesson.ts`;
if (path.basename(lessonPath).toLowerCase() !== expectedLessonName) throw new Error(`Expected lesson path ${expectedLessonName}, received ${path.basename(lessonPath)}`);
if (path.basename(pdfPath) !== config.manifest.source.filename) throw new Error(`Expected source ${config.manifest.source.filename}, received ${path.basename(pdfPath)}`);

const bytes = await readFile(pdfPath);
const sourceHash = crypto.createHash("sha256").update(bytes).digest("hex").toUpperCase();
if (sourceHash !== config.manifest.source.sha256) throw new Error(`Source PDF hash ${sourceHash} does not match the manifest.`);
const pdf = await getDocument({ data: new Uint8Array(bytes) }).promise;
const regions = await extractDeclaredRegions(pdf, config.lesson, config.manifest.verification.regions);
await pdf.cleanup();
const canonicalHash = crypto.createHash("sha256").update(canonicalize(config.lesson)).digest("hex").toUpperCase();
if (config.manifest.lesson.expectedCanonicalHash && canonicalHash !== config.manifest.lesson.expectedCanonicalHash) throw new Error(`Canonical lesson hash ${canonicalHash} does not match the manifest.`);
console.log(`Verified ${regions.length} regions, source ${sourceHash}, and canonical lesson ${canonicalHash} from ${pdfPath}.`);
