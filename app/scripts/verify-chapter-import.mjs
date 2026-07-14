import { readFile } from "node:fs/promises";
import ts from "typescript";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const [lessonPath, packagePath, pdfPath] = process.argv.slice(2);
if (!lessonPath || !packagePath || !pdfPath) throw new Error("Usage: node scripts/verify-chapter-import.mjs app/chapterN-lesson.ts app/chapter-packages/chapter-N.ts ../ChapterN_Catalan.pdf");

async function importLesson(path) {
  const source = await readFile(path, "utf8");
  let output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  output = output.replace(/from ["']chess\.js["']/, `from ${JSON.stringify(import.meta.resolve("chess.js"))}`);
  const lessonModule = await import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);
  return Object.entries(lessonModule).find(([name]) => /_LESSON$/.test(name))?.[1];
}

function regionsFromPackage(source) {
  const file = ts.createSourceFile(packagePath, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
  let regions;
  const readLiteral = (node) => {
    if (ts.isStringLiteral(node)) return node.text;
    if (ts.isArrayLiteralExpression(node)) return node.elements.map(readLiteral);
    if (ts.isObjectLiteralExpression(node)) return Object.fromEntries(node.properties.filter(ts.isPropertyAssignment).map((property) => [property.name.getText(file).replace(/["']/g, ""), readLiteral(property.initializer)]));
    throw new Error(`Unsupported package literal: ${node.getText(file)}`);
  };
  const visit = (node) => {
    if (ts.isPropertyAssignment(node) && node.name.getText(file) === "regions") regions = readLiteral(node.initializer);
    ts.forEachChild(node, visit);
  };
  visit(file);
  if (!regions) throw new Error(`No literal regions array found in ${packagePath}`);
  return regions;
}

const lesson = await importLesson(lessonPath);
if (!lesson) throw new Error(`No lesson export found in ${lessonPath}`);
const regions = regionsFromPackage(await readFile(packagePath, "utf8"));
const pdf = await getDocument({ data: new Uint8Array(await readFile(pdfPath)) }).promise;
for (const region of regions) {
  const span = lesson.sourceSpans.find((item) => item.id === region.id);
  if (!span) throw new Error(`${region.id}: source span is missing`);
  const page = await pdf.getPage(span.pageIndex + 1);
  const viewport = page.getViewport({ scale: 1 });
  const content = await page.getTextContent();
  const text = content.items.filter((item) => "str" in item && "transform" in item)
    .map((item) => ({ str: item.str, x: item.transform[4], top: viewport.height - item.transform[5] }))
    .filter((item) => item.x >= span.bbox.x0 - 8 && item.x <= span.bbox.x1 + 8 && item.top >= span.bbox.top - 18 && item.top <= span.bbox.bottom + 18)
    .sort((left, right) => Math.abs(left.top - right.top) < 2 ? left.x - right.x : left.top - right.top)
    .map((item) => item.str).join(" ").replace(/\s+/g, " ").trim();
  const missing = region.anchors.filter((anchor) => !text.includes(anchor));
  if (missing.length) throw new Error(`${region.id}: missing ${missing.join(", ")}`);
}
pdf.cleanup();
console.log(`Verified ${regions.length} import regions from ${pdfPath}`);
