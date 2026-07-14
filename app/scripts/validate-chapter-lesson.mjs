import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import crypto from "node:crypto";
import ts from "typescript";

const lessonPath = process.argv[2];
if (!lessonPath) throw new Error("Usage: node scripts/validate-chapter-lesson.mjs app/chapterN-lesson.ts");

const source = await readFile(lessonPath, "utf8");
let output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
output = output.replace(/from ["']chess\.js["']/, `from ${JSON.stringify(import.meta.resolve("chess.js"))}`);
try {
  const lessonModule = await import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);
  console.log(`Validated ${pathToFileURL(lessonPath).pathname}`);
  const lesson = Object.entries(lessonModule).find(([name]) => /_LESSON$/.test(name))?.[1];
  if (lesson) {
    const linkedBlocks = lesson.blocks.filter((block) => block.moveRefs?.length).length;
    const linkedMoves = lesson.blocks.reduce((total, block) => total + (block.moveRefs?.length ?? 0), 0);
    const unlinkedNotationBlocks = lesson.blocks.filter((block) => "text" in block && /(?:^|\s)\d+\.(?:\.\.)?\s*(?:O-O-O|O-O|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8])/.test(block.text) && !block.moveRefs?.length);
    if (unlinkedNotationBlocks.length) throw new Error(`Notation blocks without move links: ${unlinkedNotationBlocks.map((block) => block.id).join(", ")}`);
    console.log(`Move links ${linkedMoves} across ${linkedBlocks} blocks`);
    const excluded = new Set(["timestamp", "generatedId", "absolutePath", "importRunId", "machineName", "userName", "temporaryPath"]);
    const canonicalize = (value) => {
      if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
      if (value && typeof value === "object") return `{${Object.entries(value).filter(([key]) => !excluded.has(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => `${JSON.stringify(key)}:${canonicalize(item)}`).join(",")}}`;
      return JSON.stringify(value);
    };
    console.log(`Canonical SHA-256 ${crypto.createHash("sha256").update(canonicalize(lesson)).digest("hex").toUpperCase()}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
