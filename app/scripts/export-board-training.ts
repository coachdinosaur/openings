import { writeFile } from "node:fs/promises";
import { CHAPTER_CONFIG as CHAPTER_2 } from "../app/chapter-packages/chapter-2";
import { CHAPTER_CONFIG as CHAPTER_3 } from "../app/chapter-packages/chapter-3";
import { CHAPTER_CONFIG as CHAPTER_4 } from "../app/chapter-packages/chapter-4";
import { CHAPTER_CONFIG as CHAPTER_5 } from "../app/chapter-packages/chapter-5";

const output = process.argv[2];
if (!output) throw new Error("Pass an output JSON path.");

const diagrams = [CHAPTER_2, CHAPTER_3, CHAPTER_4, CHAPTER_5].flatMap((chapter) =>
  chapter.lesson.diagrams.map(({ crop, fen }) => ({ crop, fen })),
);
await writeFile(output, `${JSON.stringify(diagrams)}\n`, "utf8");
console.log(`Exported ${diagrams.length} verified source boards.`);
