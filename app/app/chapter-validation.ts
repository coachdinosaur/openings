import { Chess } from "chess.js";
import type { ChapterConfig } from "./chapter-definition";
import type { VariationMove, VariationNode } from "./lesson-model";

function unique(values: string[], label: string, errors: string[]) {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) errors.push(`${label} ${value} is duplicated`);
    seen.add(value);
  }
}

export function validateChapterConfig(config: ChapterConfig): string[] {
  const errors: string[] = [];
  const { lesson } = config;
  const legacy = config.validationProfile === "legacy";
  const prefix = `Chapter ${config.id}`;
  const lineMap = new Map(lesson.lines.map((line) => [line.id, line]));
  const spanMap = new Map(lesson.sourceSpans.map((span) => [span.id, span]));
  const blockMap = new Map(lesson.blocks.map((block) => [block.id, block]));

  if (config.label !== prefix) errors.push(`label must be ${prefix}`);
  if (config.importDefinition.filename !== `Chapter${config.id}_Catalan.pdf`) errors.push("source filename does not match the chapter id");
  if (lesson.source.filename !== config.importDefinition.filename) errors.push("lesson and package source filenames differ");
  if (lesson.source.sha256 !== config.importDefinition.sourceHash) errors.push("lesson and package source hashes differ");
  if (!/^[A-F0-9]{64}$/.test(lesson.source.sha256)) errors.push("source SHA-256 must be 64 uppercase hexadecimal characters");
  if (config.id !== "1" && !/^[A-F0-9]{64}$/.test(config.importDefinition.expectedCanonicalHash ?? "")) errors.push("canonical lesson hash is missing or invalid");
  if (!config.reviewKey.includes(`chapter${config.id}`) && !config.reviewKey.includes(`chapter-${config.id}`) && config.id !== "1") errors.push("review key must identify its chapter");

  unique(lesson.sourceSpans.map((span) => span.id), "source span", errors);
  unique(lesson.lines.map((line) => line.id), "line", errors);
  unique(lesson.blocks.map((block) => block.id), "block", errors);
  unique(lesson.diagrams.map((diagram) => diagram.id), "diagram", errors);
  unique(lesson.lines.flatMap((line) => line.moves.map((move) => move.id)), "move", errors);

  lesson.sourceSpans.forEach((span, index) => {
    if (span.order !== index + 1) errors.push(`source span ${span.id} order must be ${index + 1}`);
    if (span.bbox.x1 <= span.bbox.x0 || span.bbox.bottom <= span.bbox.top) errors.push(`source span ${span.id} has an invalid bounding box`);
  });

  const prefixMoves = (line: VariationNode, stack = new Set<string>()): VariationMove[] => {
    if (!line.parentLineId) return [];
    if (stack.has(line.id)) {
      errors.push(`line ${line.id} has a parent cycle`);
      return [];
    }
    const parent = lineMap.get(line.parentLineId);
    if (!parent) {
      errors.push(`line ${line.id} has missing parent ${line.parentLineId}`);
      return [];
    }
    if (line.parentPly < 0 || line.parentPly > parent.moves.length) errors.push(`line ${line.id} has invalid parent ply ${line.parentPly}`);
    const nextStack = new Set(stack).add(line.id);
    return [...prefixMoves(parent, nextStack), ...parent.moves.slice(0, line.parentPly)];
  };

  lesson.lines.forEach((line) => {
    line.moves.forEach((move) => {
      if (!spanMap.has(move.sourceSpanId)) errors.push(`move ${move.id} references missing span ${move.sourceSpanId}`);
    });
    const moves = line.startFen ? line.moves : [...prefixMoves(line), ...line.moves];
    try {
      const board = new Chess(line.startFen ?? lesson.basePosition.fen);
      moves.forEach((move) => board.move(move.san));
    } catch (error) {
      if (!legacy) errors.push(`line ${line.id} is not a legal move path: ${error instanceof Error ? error.message : "unknown chess error"}`);
    }
  });

  let lastBlockOrder = 0;
  lesson.blocks.forEach((block) => {
    const span = spanMap.get(block.sourceSpanId);
    if (!span) errors.push(`block ${block.id} references missing span ${block.sourceSpanId}`);
    else if (span.order < lastBlockOrder) errors.push(`block ${block.id} breaks source reading order`);
    else lastBlockOrder = span.order;
    if (block.type === "variation" && !lineMap.has(block.lineId)) errors.push(`block ${block.id} references missing line ${block.lineId}`);
    block.moveRefs?.forEach((reference) => {
      const line = lineMap.get(reference.lineId);
      if (!line?.moves[reference.moveIndex]) errors.push(`block ${block.id} has an invalid move reference`);
      if (!legacy && "text" in block && !block.text.includes(reference.source)) errors.push(`block ${block.id} does not contain source token ${reference.source}`);
    });
    if (!legacy && Number(config.id) >= 3 && "text" in block && /(?:^|\s)\d+\.(?:\.\.)?\s*(?:O-O-O|O-O|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8])/.test(block.text) && !block.moveRefs?.length) {
      errors.push(`block ${block.id} contains chess notation but has no linked moves`);
    }
  });

  lesson.diagrams.forEach((diagram) => {
    if (!spanMap.has(diagram.sourceSpanId)) errors.push(`diagram ${diagram.id} references missing span ${diagram.sourceSpanId}`);
    try { new Chess(diagram.fen); } catch { errors.push(`diagram ${diagram.id} has invalid FEN`); }
    if (diagram.lineId) {
      const line = lineMap.get(diagram.lineId);
      if (!line) errors.push(`diagram ${diagram.id} references missing line ${diagram.lineId}`);
      else if (diagram.moveIndex === null || diagram.moveIndex < 0 || diagram.moveIndex >= line.moves.length) errors.push(`diagram ${diagram.id} has an invalid move index`);
    }
  });

  config.sections.forEach((section) => {
    if (!blockMap.has(section.blockId)) errors.push(`section ${section.id} references missing block ${section.blockId}`);
  });
  const defaultLine = lineMap.get(config.defaultPosition.lineId);
  if (!defaultLine) errors.push(`default position references missing line ${config.defaultPosition.lineId}`);
  else if (config.defaultPosition.ply < 0 || config.defaultPosition.ply > prefixMoves(defaultLine).length + defaultLine.moves.length) errors.push("default position ply is outside its line");
  config.importDefinition.regions.forEach((region) => {
    if (!spanMap.has(region.id)) errors.push(`import region ${region.id} has no source span`);
    if (!region.anchors.length || region.anchors.some((anchor) => !anchor.trim())) errors.push(`import region ${region.id} needs non-empty anchors`);
  });
  return errors;
}

export function assertChapterCatalog(chapters: ChapterConfig[]) {
  const ids = new Set<string>();
  const reviewKeys = new Set<string>();
  for (const chapter of chapters) {
    if (ids.has(chapter.id)) throw new Error(`Chapter id ${chapter.id} is duplicated.`);
    if (reviewKeys.has(chapter.reviewKey)) throw new Error(`Review key ${chapter.reviewKey} is duplicated.`);
    ids.add(chapter.id);
    reviewKeys.add(chapter.reviewKey);
    const errors = validateChapterConfig(chapter);
    if (errors.length) throw new Error(`${chapter.label} package is invalid:\n- ${errors.join("\n- ")}`);
  }
}
