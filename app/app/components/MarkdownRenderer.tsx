"use client";

import { memo, ReactNode, useMemo } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "./Chessboard";
import { loadChapterById, loadChapterByNumber } from "../lib/chapter-markdown-loader";

const SOURCE_MOVE_TOKEN = /(?:\d+\.(?:\.\.)?\s*)?(?:O-O-O|O-O|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?|[a-h]x[a-h][1-8]|[a-h][1-8])[+#]?[!?N=]*/g;

const SQUARE_ONLY = /^[a-h][1-8]$/;

function isLikelyProseSquare(text: string, at: number, source: string): boolean {
  const bare = source.replace(/^\d+\.(?:\.\.)?\s*/, "");
  if (!SQUARE_ONLY.test(bare)) return false;
  const prefix = text.slice(Math.max(0, at - 8), at).toLowerCase();
  if (/(?:^|\s)(?:on|to|the|a|toward) $/.test(prefix)) return true;
  if (text.slice(at + source.length, at + source.length + 7).toLowerCase().startsWith("-square")) return true;
  return false;
}

function normalizeSan(raw: string): string {
  let san = raw.replace(/^\d+\.(?:\.\.)?\s*/, "").replace(/[!?N=*∞±∓→←]+/g, "").trim();
  san = san.replace(/0/g, "O");
  if (/^O-O-O/i.test(san)) san = "O-O-O";
  else if (/^O-O/i.test(san)) san = "O-O";
  san = san.replace(/[+#]+$/, "");
  return san;
}

type MoveButton = { display: string; fen: string | null; index: number };

type MoveContext = { boards: Chess[]; spine: Chess[] };

const START_FEN = new Chess().fen();
const MAX_BOARDS = 96;

function fenExists(boards: Chess[], fen: string): boolean {
  for (const board of boards) if (board.fen() === fen) return true;
  return false;
}

function tryMove(fen: string, san: string): string | null {
  try {
    const next = new Chess(fen);
    next.move(san, { strict: true });
    return next.fen();
  } catch {
    return null;
  }
}

function extractMoveButtons(text: string, ctx: MoveContext): MoveButton[] {
  const buttons: MoveButton[] = [];
  for (const match of text.matchAll(SOURCE_MOVE_TOKEN)) {
    const source = match[0].trim();
    if (!source) continue;
    if (isLikelyProseSquare(text, match.index ?? 0, source)) continue;
    const san = normalizeSan(source);
    if (!san) continue;
    let fen: string | null = null;
    // Try every reachable position: the live branch frontier plus the full move history (spine).
    // The spine keeps earlier recap/opening positions alive so standalone fragments like `4...dxc4`
    // stay playable, while the frontier lets sibling variations share a diagram and still diverge.
    const candidates = [...ctx.boards, ...ctx.spine];
    for (const board of candidates) {
      const result = tryMove(board.fen(), san);
      if (result !== null) {
        fen = result;
        const next = new Chess(result);
        if (ctx.boards.length < MAX_BOARDS && !fenExists(ctx.boards, result)) ctx.boards.push(next);
        if (!fenExists(ctx.spine, result)) ctx.spine.push(next);
        break;
      }
    }
    buttons.push({ display: source, fen, index: match.index ?? 0 });
  }
  return buttons;
}

function renderInlineWithMoves(
  text: string,
  ctx: MoveContext,
  onMove: (fen: string) => void,
  keyPrefix: string,
): ReactNode[] {
  const buttons = extractMoveButtons(text, ctx);
  if (buttons.length === 0) return [text];

  const inlineRegex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/g;
  const out: ReactNode[] = [];
  let cursor = 0;
  let lastButtonEnd = 0;
  let bIdx = 0;
  const pushPlain = (segment: string) => {
    if (!segment) return;
    let m: RegExpExecArray | null;
    inlineRegex.lastIndex = 0;
    let plainCursor = 0;
    const segs: ReactNode[] = [];
    while ((m = inlineRegex.exec(segment)) !== null) {
      if (m.index > plainCursor) segs.push(segment.slice(plainCursor, m.index));
      if (m[1]?.startsWith("***")) segs.push(<em key={`${keyPrefix}-e${plainCursor}`}><strong>{m[2]}</strong></em>);
      else if (m[1]?.startsWith("**")) segs.push(<strong key={`${keyPrefix}-s${plainCursor}`}>{m[3]}</strong>);
      else if (m[1]?.startsWith("*")) segs.push(<em key={`${keyPrefix}-i${plainCursor}`}>{m[4]}</em>);
      else if (m[1]?.startsWith("`")) segs.push(<code key={`${keyPrefix}-c${plainCursor}`}>{m[5]}</code>);
      plainCursor = inlineRegex.lastIndex;
    }
    if (plainCursor < segment.length) segs.push(segment.slice(plainCursor));
    if (segs.length === 1) out.push(segs[0]);
    else if (segs.length) out.push(<span key={`${keyPrefix}-p${cursor}`}>{segs}</span>);
  };

  for (const btn of buttons) {
    const at = btn.index;
    if (at > lastButtonEnd) pushPlain(text.slice(lastButtonEnd, at));
    if (btn.fen) {
      out.push(
        <button
          type="button"
          key={`${keyPrefix}-mv-${bIdx}`}
          className="inline-move interactive-move"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMove(btn.fen as string); }}
          aria-label={`Show position after ${btn.display}`}
        >{btn.display}</button>,
      );
    } else {
      out.push(<span key={`${keyPrefix}-mv-${bIdx}`} className="inline-move unresolved">{btn.display}</span>);
    }
    lastButtonEnd = at + btn.display.length;
    bIdx++;
    cursor = lastButtonEnd;
  }
  if (lastButtonEnd < text.length) pushPlain(text.slice(lastButtonEnd));
  return out.length ? out : [text];
}

function FenBoard({ fen }: { fen: string }) {
  try {
    new Chess(fen);
  } catch {
    return <div className="fen-invalid" role="alert">Invalid FEN position</div>;
  }
  return (
    <div className="fen-block">
      <strong>FEN:</strong>
      <div className="fen-board-container">
        <Chessboard fen={fen} />
      </div>
      <code className="fen-string">{fen}</code>
    </div>
  );
}

function parseMarkdownToReact(markdown: string, onMove: (fen: string) => void): ReactNode[] {
  const lines = markdown.split(/\r?\n/);
  const nodes: ReactNode[] = [];
  let i = 0;
  const startBoard = new Chess(START_FEN);
  const ctx: MoveContext = { boards: [startBoard], spine: [startBoard] };

  const renderInline = (text: string, key: string): ReactNode =>
    renderInlineWithMoves(text, ctx, onMove, key);

  const processFenBlocks = (text: string, key: string): ReactNode[] => {
    const parts: ReactNode[] = [];
    const fenRegex = /\*\*FEN:\*\*\s*\n\s*`([^`]+)`/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let first = true;
    while ((match = fenRegex.exec(text)) !== null) {
      if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
      const fen = match[1].trim();
      if (fen.split(" ").length >= 4) {
        const board = new Chess(fen);
        ctx.boards = [board];
        parts.push(<FenBoard key={`${key}-fen-${match.index}`} fen={fen} />);
      } else {
        parts.push(match[0]);
      }
      lastIndex = fenRegex.lastIndex;
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex));
    return parts;
  };

  const renderParagraph = (text: string, key: string): ReactNode => {
    if (text.includes("**FEN:**")) return <p key={key}>{processFenBlocks(text, key)}</p>;
    return <p key={key}>{renderInline(text, key)}</p>;
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") { i++; continue; }

    if (/^## /i.test(line) && /^## Page \d+/i.test(line)) {
      nodes.push(<h2 key={`h2-${i}`} className="page-heading-markdown">{renderInline(line.replace(/^##\s+/, ""), `h2-${i}`)}</h2>);
      i++; continue;
    }
    if (/^### /i.test(line)) {
      nodes.push(<h3 key={`h3-${i}`}>{renderInline(line.replace(/^###\s+/, ""), `h3-${i}`)}</h3>);
      i++; continue;
    }
    if (/^#### /i.test(line)) {
      nodes.push(<h4 key={`h4-${i}`}>{renderInline(line.replace(/^####\s+/, ""), `h4-${i}`)}</h4>);
      i++; continue;
    }
    if (/^##### /i.test(line)) {
      nodes.push(<h5 key={`h5-${i}`}>{renderInline(line.replace(/^#####\s+/, ""), `h5-${i}`)}</h5>);
      i++; continue;
    }
    if (/^---+\s*$/.test(line)) { nodes.push(<hr key={`hr-${i}`} />); i++; continue; }
    if (/^&nbsp;/.test(line.trim())) { i++; continue; }

    if (line.trim().startsWith("**FEN:**")) {
      const fenBlock = [line];
      i++;
      while (i < lines.length) {
        const next = lines[i].trim();
        if (next.startsWith("`") && next.endsWith("`") && !next.startsWith("**")) {
          fenBlock.push(lines[i]);
          i++;
        } else break;
      }
      const text = fenBlock.join("\n");
      const m = /\*\*FEN:\*\*\s*\n\s*`([^`]+)`/.exec(text);
      if (m) {
        const fen = m[1].trim();
        if (fen.split(" ").length >= 4) {
          ctx.boards = [new Chess(fen)];
        }
        nodes.push(<div key={`fen-block-${i}`}><FenBoard fen={fen} /></div>);
      }
      continue;
    }

    if (line.trim().startsWith("-") || line.trim().startsWith("* ")) {
      const listItems: ReactNode[] = [];
      while (i < lines.length) {
        const trimmed = lines[i].trim();
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          listItems.push(<li key={`li-${i}`}>{renderInline(trimmed.replace(/^[-*]\s+/, ""), `li-${i}`)}</li>);
          i++;
        } else break;
      }
      nodes.push(<ul key={`ul-${i}`}>{listItems}</ul>);
      continue;
    }

    const paragraphLines: string[] = [line];
    i++;
    while (i < lines.length) {
      const next = lines[i];
      if (next.trim() === "" || /^#{1,5}\s/.test(next) || /^---+\s*$/.test(next) || next.trim().startsWith("**FEN:**") || next.trim().startsWith("* ") || next.trim().startsWith("- ")) break;
      paragraphLines.push(next);
      i++;
    }
    nodes.push(renderParagraph(paragraphLines.join("\n"), `p-${i}`));
  }

  return nodes;
}

export const MarkdownChapterView = memo(function MarkdownChapterView({ chapterId, onMove }: { chapterId: string; onMove: (fen: string) => void }) {
  const markdown = useMemo(() => {
    const number = parseInt(chapterId, 10);
    const chapter = Number.isFinite(number) ? loadChapterByNumber(number) : loadChapterById(chapterId);
    if (!chapter) return `# Chapter ${chapterId}\n\nContent unavailable.`;
    return chapter.pages.map((p) => p.markdown).join("\n\n");
  }, [chapterId]);

  const elements = useMemo(() => parseMarkdownToReact(markdown, onMove), [markdown, onMove]);
  return <article className="narrative markdown-narrative" aria-label="Chapter source text">{elements}</article>;
});
