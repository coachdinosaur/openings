import { compileInteractiveMoves } from "../app/lib/interactive-moves";
import { CHAPTER10_LESSON } from "../app/chapter10-lesson";
import { CHAPTER11_LESSON } from "../app/chapter11-lesson";

const SOURCE_MOVE_TOKEN = /(?:\d+\.(?:\.\.)?\s*)?(?:O-O-O|O-O|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?|[a-h]x[a-h][1-8]|[a-h][1-8])[+#]?[!?N=]*/g;

const CHAPTERS = [
  { name: "Chapter 10", lesson: CHAPTER10_LESSON },
  { name: "Chapter 11", lesson: CHAPTER11_LESSON },
] as const;

for (const { name, lesson } of CHAPTERS) {
  console.log(`\n========== ${name} Diagnostic ==========\n`);

  const data = compileInteractiveMoves(lesson);

  const diagrams = new Map(lesson.diagrams.map((d) => [d.id, d.fen]));

  for (let i = 0; i < lesson.blocks.length; i++) {
    const block = lesson.blocks[i];
    if (!("text" in block) || !block.text) continue;

    let startingFen: string | null = null;
    let precedingDiagramId: string | null = null;
    for (let j = i - 1; j >= 0; j--) {
      const prev = lesson.blocks[j];
      if (prev.type === "diagram") {
        const fen = diagrams.get(prev.diagramId);
        if (fen) {
          startingFen = fen;
          precedingDiagramId = prev.diagramId;
          break;
        }
      }
    }

    if (!startingFen) continue;

    const text = block.text;
    const matches = [...text.matchAll(SOURCE_MOVE_TOKEN)].filter((m) => m[0].trim());
    const tokenCount = matches.length;
    const blockData = data.get(block.id);
    const entryCount = blockData ? blockData.entries.length : 0;
    const diff = tokenCount - entryCount;

    if (entryCount > 0 || diff > 0) {
      console.log(`--- Block ${block.id} (${block.type}) ---`);
      console.log(`  Preceding diagram: ${precedingDiagramId} FEN: ${startingFen}`);
      console.log(`  Token count: ${tokenCount}, Entry count: ${entryCount}, Diff: ${diff}`);

      if (blockData) {
        console.log(`  Starting FEN of sequence: ${blockData.startingFen}`);
        console.log(`  ${"#".padEnd(3)} ${"displayText".padEnd(28)} ${"ply".padEnd(4)} ${"resultingFen".padEnd(30)}`);
        console.log(`  ${"-".repeat(70)}`);
        for (let k = 0; k < blockData.entries.length; k++) {
          const e = blockData.entries[k];
          console.log(`  ${String(k + 1).padEnd(3)} ${e.displayText.padEnd(28)} ${String(e.ply).padEnd(4)} ${e.resultingFen.padEnd(30)}`);
        }
      }

      if (diff > 0 && blockData) {
        const matchedTexts = new Set(blockData.entries.map((e) => e.displayText));
        const failedTokens = matches
          .map((m) => m[0].trim())
          .filter((t) => !matchedTexts.has(t));
        console.log(`  Failed tokens (${failedTokens.length}):`);
        for (const ft of failedTokens) {
          console.log(`    -> "${ft}"`);
        }
      }

      console.log();
    }
  }

  console.log(`\n--- ${name} Summary ---`);
  let totalTokens = 0;
  let totalEntries = 0;
  for (let i = 0; i < lesson.blocks.length; i++) {
    const block = lesson.blocks[i];
    if (!("text" in block) || !block.text) continue;
    let startingFen: string | null = null;
    for (let j = i - 1; j >= 0; j--) {
      const prev = lesson.blocks[j];
      if (prev.type === "diagram") {
        const fen = diagrams.get(prev.diagramId);
        if (fen) {
          startingFen = fen;
          break;
        }
      }
    }
    if (!startingFen) continue;
    const text = block.text;
    const matches = [...text.matchAll(SOURCE_MOVE_TOKEN)].filter((m) => m[0].trim());
    const tokenCount = matches.length;
    const blockData = data.get(block.id);
    const entryCount = blockData ? blockData.entries.length : 0;
    totalTokens += tokenCount;
    totalEntries += entryCount;
    if (tokenCount !== entryCount) {
      console.log(`  Block ${block.id} (${block.type}): ${tokenCount} tokens -> ${entryCount} entries (lost ${tokenCount - entryCount})`);
    }
  }
  console.log(`  Total tokens: ${totalTokens}, Total entries: ${totalEntries}, Total lost: ${totalTokens - totalEntries}`);
}
