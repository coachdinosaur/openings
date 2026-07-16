import { Chess } from "chess.js";
import type { LessonDocument } from "../lesson-model";

export type InteractiveMoveEntry = {
  displayText: string;
  resultingFen: string;
  ply: number;
};

const SOURCE_MOVE_TOKEN = /(?:\d+\.(?:\.\.)?\s*)?(?:O-O-O|O-O|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?|[a-h]x[a-h][1-8]|[a-h][1-8])[+#]?[!?N=]*/g;

function normalizeSan(raw: string): string {
  let san = raw.replace(/^\d+\.(?:\.\.)?\s*/, "").replace(/[!?N=*∞±∓→←]+/g, "").trim();
  san = san.replace(/0/g, "O");
  if (/^O-O-O/i.test(san)) san = "O-O-O";
  else if (/^O-O/i.test(san)) san = "O-O";
  san = san.replace(/[+#]+$/, "");
  return san;
}

const SQUARE_ONLY = /^[a-h][1-8]$/;

function isLikelyProseSquare(text: string, at: number, source: string): boolean {
  const bare = source.replace(/^\d+\.(?:\.\.)?\s*/, "");
  if (!SQUARE_ONLY.test(bare)) return false;
  const prefix = text.slice(Math.max(0, at - 8), at).toLowerCase();
  if (/(?:^|\s)(?:on|to|the|a|toward) $/.test(prefix)) return true;
  if (text.slice(at + source.length, at + source.length + 7).toLowerCase().startsWith("-square")) return true;
  return false;
}

function parenDepthAt(text: string, pos: number): number {
  let depth = 0;
  for (let i = 0; i < pos; i++) {
    if (text[i] === "(") depth++;
    else if (text[i] === ")") depth = Math.max(0, depth - 1);
  }
  return depth;
}

function nearestDiagramFen(lesson: LessonDocument, diagrams: Map<string, { fen: string }>, blockIndex: number): string | null {
  for (let j = blockIndex - 1; j >= 0; j--) {
    const prev = lesson.blocks[j];
    if (prev.type === "diagram") {
      const diag = diagrams.get(prev.diagramId);
      if (diag) return diag.fen;
    }
  }
  return null;
}

export function compileInteractiveMoves(lesson: LessonDocument): Map<string, { startingFen: string; entries: InteractiveMoveEntry[] }> {
  const diagrams = new Map(lesson.diagrams.map(d => [d.id, d]));
  const result = new Map<string, { startingFen: string; entries: InteractiveMoveEntry[] }>();

  for (let i = 0; i < lesson.blocks.length; i++) {
    const block = lesson.blocks[i];
    if (!("text" in block) || !block.text) continue;

    const startingFen = nearestDiagramFen(lesson, diagrams, i);
    if (!startingFen) continue;

    const text = block.text;
    const chess = new Chess(startingFen);
    const entries: InteractiveMoveEntry[] = [];
    const stateStack: Chess[] = [];
    let activeChess: Chess = chess;
    let currentDepth = 0;

    for (const match of text.matchAll(SOURCE_MOVE_TOKEN)) {
      const at = match.index ?? 0;
      const depth = parenDepthAt(text, at);

      while (depth > currentDepth) {
        stateStack.push(new Chess(activeChess.fen()));
        activeChess = stateStack[stateStack.length - 1];
        currentDepth++;
      }
      while (depth < currentDepth) {
        stateStack.pop();
        activeChess = stateStack.length > 0 ? stateStack[stateStack.length - 1] : chess;
        currentDepth--;
      }

      const source = match[0].trim();
      if (!source) continue;
      if (isLikelyProseSquare(text, at, source)) continue;

      const san = normalizeSan(source);
      if (!san) continue;

      try {
        activeChess.move(san, { strict: true });
        entries.push({ displayText: source, resultingFen: activeChess.fen(), ply: entries.length + 1 });
      } catch {
        continue;
      }
    }

    if (entries.length > 0) {
      result.set(block.id, { startingFen, entries });
    }
  }

  return result;
}
