"use client";

import { memo, ReactNode } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "./Chessboard";

function validateFen(fen: string): boolean {
  try {
    new Chess(fen);
    return true;
  } catch {
    return false;
  }
}

function FenBoard({ fen }: { fen: string }) {
  const valid = validateFen(fen);
  if (!valid) {
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

function parseMarkdownToReact(markdown: string): ReactNode[] {
  const lines = markdown.split(/\r?\n/);
  const nodes: ReactNode[] = [];
  let i = 0;

  const processFenBlocks = (text: string): ReactNode[] => {
    const parts: ReactNode[] = [];
    const fenRegex = /\*\*FEN:\*\*\s*\n\s*`([^`]+)`/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = fenRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      const fen = match[1].trim();
      if (fen.split(" ").length >= 4) {
        parts.push(<FenBoard key={`fen-${match.index}`} fen={fen} />);
      } else {
        parts.push(match[0]);
      }
      lastIndex = fenRegex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    return parts;
  };

  const renderInline = (text: string): ReactNode => {
    const segments: ReactNode[] = [];
    let lastIndex = 0;
    const inlineRegex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/g;
    let match: RegExpExecArray | null;

    while ((match = inlineRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push(text.slice(lastIndex, match.index));
      }
      if (match[1]?.startsWith("***")) {
        segments.push(<em key={match.index}><strong>{match[2]}</strong></em>);
      } else if (match[1]?.startsWith("**")) {
        segments.push(<strong key={match.index}>{match[3]}</strong>);
      } else if (match[1]?.startsWith("*")) {
        segments.push(<em key={match.index}>{match[4]}</em>);
      } else if (match[1]?.startsWith("`")) {
        segments.push(<code key={match.index}>{match[5]}</code>);
      }
      lastIndex = inlineRegex.lastIndex;
    }
    if (lastIndex < text.length) {
      segments.push(text.slice(lastIndex));
    }
    return segments.length === 1 ? segments[0] : <>{segments}</>;
  };

  const processFenAndInline = (text: string): ReactNode => {
    if (text.includes("**FEN:**")) {
      return <>{processFenBlocks(text)}</>;
    }
    return renderInline(text);
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    if (/^## /i.test(line) && /^## Page \d+/i.test(line)) {
      nodes.push(
        <h2 key={`h2-${i}`} className="page-heading-markdown">
          {renderInline(line.replace(/^##\s+/, ""))}
        </h2>
      );
      i++;
      continue;
    }

    if (/^### /i.test(line)) {
      nodes.push(<h3 key={`h3-${i}`}>{renderInline(line.replace(/^###\s+/, ""))}</h3>);
      i++;
      continue;
    }

    if (/^#### /i.test(line)) {
      nodes.push(<h4 key={`h4-${i}`}>{renderInline(line.replace(/^####\s+/, ""))}</h4>);
      i++;
      continue;
    }

    if (/^##### /i.test(line)) {
      nodes.push(<h5 key={`h5-${i}`}>{renderInline(line.replace(/^#####\s+/, ""))}</h5>);
      i++;
      continue;
    }

    if (/^---+\s*$/.test(line)) {
      nodes.push(<hr key={`hr-${i}`} />);
      i++;
      continue;
    }

    if (/^&nbsp;/.test(line.trim())) {
      i++;
      continue;
    }

    if (line.trim().startsWith("**FEN:**")) {
      const fenBlock = [line];
      i++;
      while (i < lines.length) {
        const next = lines[i].trim();
        if (next.startsWith("`") && next.endsWith("`") && !next.startsWith("**")) {
          fenBlock.push(lines[i]);
          i++;
        } else {
          break;
        }
      }
      const text = fenBlock.join("\n");
      if (text.includes("**FEN:**")) {
        nodes.push(<div key={`fen-block-${i}`}>{processFenBlocks(text)}</div>);
      } else {
        const fen = fenBlock[1]?.replace(/^`|`$/g, "").trim() ?? "";
        if (fen && fen.split(" ").length >= 4) {
          nodes.push(<FenBoard key={`fen-${i}`} fen={fen} />);
        }
      }
      continue;
    }

    if (line.trim().startsWith("-") || line.trim().startsWith("* ")) {
      const listItems: ReactNode[] = [];
      while (i < lines.length) {
        const trimmed = lines[i].trim();
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          listItems.push(<li key={`li-${i}`}>{processFenAndInline(trimmed.replace(/^[-*]\s+/, ""))}</li>);
          i++;
        } else {
          break;
        }
      }
      nodes.push(<ul key={`ul-${i}`}>{listItems}</ul>);
      continue;
    }

    if (/^\d+\.\s/.test(line.trim())) {
      const paragraphLines: string[] = [line];
      i++;
      while (i < lines.length) {
        const next = lines[i];
        if (next.trim() === "" || /^#{1,5}\s/.test(next) || /^---+\s*$/.test(next)) {
          break;
        }
        if (/^\d+\.\s/.test(next.trim()) && /^\d+\.\s/.test(line.trim())) {
          break;
        }
        paragraphLines.push(next);
        i++;
      }
      const text = paragraphLines.join("\n");
      if (text.includes("**FEN:**")) {
        nodes.push(<p key={`p-${i}`}>{processFenBlocks(text)}</p>);
      } else {
        nodes.push(<p key={`p-${i}`}>{renderInline(text)}</p>);
      }
      continue;
    }

    const paragraphLines: string[] = [line];
    i++;
    while (i < lines.length) {
      const next = lines[i];
      if (next.trim() === "" || /^#{1,5}\s/.test(next) || /^---+\s*$/.test(next) || next.trim().startsWith("**FEN:**") || next.trim().startsWith("* ") || next.trim().startsWith("- ")) {
        break;
      }
      paragraphLines.push(next);
      i++;
    }
    const text = paragraphLines.join("\n");
    if (text.includes("**FEN:**")) {
      nodes.push(<p key={`p-${i}`}>{processFenBlocks(text)}</p>);
    } else {
      nodes.push(<p key={`p-${i}`}>{renderInline(text)}</p>);
    }
  }

  return nodes;
}

export const MarkdownRenderer = memo(function MarkdownRenderer({ markdown }: { markdown: string }) {
  const elements = parseMarkdownToReact(markdown);
  return <div className="markdown-content">{elements}</div>;
});
