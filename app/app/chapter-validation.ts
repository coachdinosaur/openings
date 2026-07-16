import { Chess } from "chess.js";
import type { ChapterConfig } from "./chapter-definition";
import type { VariationMove, VariationNode } from "./lesson-model";

const DISPLAYED_MOVE_TOKEN = /(?:\d+\.(?:\.\.)?\s*)?(?:O-O-O|O-O|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?|[a-h]x[a-h][1-8]|[a-h][1-8])[+#]?[!?N=]*/g;

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
  const allMoves = lesson.lines.flatMap((line) => line.moves);
  const moveMap = new Map(allMoves.map((move) => [move.id, move]));

  if (config.label !== prefix) errors.push(`label must be ${prefix}`);
  if (config.manifest.id !== Number(config.id)) errors.push("manifest id does not match package id");
  if (config.manifest.source.printedEnd - config.manifest.source.printedStart + 1 !== config.manifest.evidence.pageCount) errors.push("printed range does not match evidence page count");
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
  unique(allMoves.map((move) => move.id), "move", errors);
  unique(config.annotatedMoveIds, "annotated move", errors);
  unique(config.sections.map((section) => section.id), "section", errors);
  unique(config.importDefinition.regions.map((region) => region.id), "import region", errors);

  config.annotatedMoveIds.forEach((id) => {
    if (!moveMap.has(id)) errors.push(`annotated move ${id} does not exist`);
  });
  if (lesson.diagrams.length !== config.manifest.evidence.diagramCount) errors.push(`expected ${config.manifest.evidence.diagramCount} diagrams, found ${lesson.diagrams.length}`);
  const pageCrops = new Set(lesson.sourceSpans.map((span) => span.crop));
  if (!legacy && pageCrops.size !== config.manifest.evidence.pageCount) errors.push(`expected ${config.manifest.evidence.pageCount} page images, found ${pageCrops.size}`);

  lesson.sourceSpans.forEach((span, index) => {
    if (span.order !== index + 1) errors.push(`source span ${span.id} order must be ${index + 1}`);
    if (span.bbox.x1 <= span.bbox.x0 || span.bbox.bottom <= span.bbox.top) errors.push(`source span ${span.id} has an invalid bounding box`);
    if (span.pageIndex < 0 || span.pageIndex >= config.manifest.source.pdfPageCount) errors.push(`source span ${span.id} is outside the PDF page count`);
    if (span.printedPage < config.manifest.source.printedStart || span.printedPage > config.manifest.source.printedEnd) errors.push(`source span ${span.id} is outside the printed range`);
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
    ("moveRefs" in block ? block.moveRefs : undefined)?.forEach((reference) => {
      const line = lineMap.get(reference.lineId);
      if (!line?.moves[reference.moveIndex]) errors.push(`block ${block.id} has an invalid move reference`);
      if (!legacy && "text" in block && !block.text.includes(reference.source)) errors.push(`block ${block.id} does not contain source token ${reference.source}`);
    });
    if (!legacy && Number(config.id) >= 3 && "text" in block && /(?:^|\s)\d+\.(?:\.\.)?\s*(?:O-O-O|O-O|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8])/.test(block.text) && !block.moveRefs?.length) {
      errors.push(`block ${block.id} contains chess notation but has no linked moves`);
    }
    if (!legacy && Number(config.id) >= 6 && "text" in block) {
      const displayed = [...block.text.matchAll(DISPLAYED_MOVE_TOKEN)].map((match) => match[0].trim());
      const references = "moveRefs" in block ? block.moveRefs ?? [] : [];
      if (displayed.length !== references.length || displayed.some((token, index) => references[index]?.source !== token)) {
        errors.push(`block ${block.id} must link every displayed chess token in source order`);
      }
    }
  });

  lesson.diagrams.forEach((diagram) => {
    if (!spanMap.has(diagram.sourceSpanId)) errors.push(`diagram ${diagram.id} references missing span ${diagram.sourceSpanId}`);
    try { new Chess(diagram.fen); } catch { errors.push(`diagram ${diagram.id} has invalid FEN`); }
    if (diagram.lineId) {
      const line = lineMap.get(diagram.lineId);
      if (!line) errors.push(`diagram ${diagram.id} references missing line ${diagram.lineId}`);
      else if (diagram.moveIndex === null || diagram.moveIndex < -1 || diagram.moveIndex >= line.moves.length || (diagram.moveIndex === -1 && !line.startFen)) errors.push(`diagram ${diagram.id} has an invalid move index`);
      else if (!legacy) {
        try {
          const board = new Chess(line.startFen ?? lesson.basePosition.fen);
          const moves = line.startFen
            ? line.moves.slice(0, diagram.moveIndex + 1)
            : [...prefixMoves(line), ...line.moves.slice(0, diagram.moveIndex + 1)];
          moves.forEach((move) => board.move(move.san));
          if (board.fen() !== diagram.fen) errors.push(`diagram ${diagram.id} FEN does not match its move path`);
        } catch (error) {
          errors.push(`diagram ${diagram.id} move path is invalid: ${error instanceof Error ? error.message : "unknown chess error"}`);
        }
      }
    }
  });

  // Chapters 1-5 established the learner-facing lesson contract. Starting with
  // Chapter 6, a package must preserve that authored shape rather than exposing
  // extracted regions or independently recognised board positions as a lesson.
  // Extraction remains useful authoring evidence, but it is not publishable
  // content on its own.
  const requiresAuthoredPublication = !legacy && Number(config.id) >= 6;
  if (requiresAuthoredPublication && config.manifest.lesson.publicationProfile !== "authored") {
    errors.push("newer chapters require the authored publication profile");
  }
  if (requiresAuthoredPublication || config.manifest.lesson.publicationProfile === "authored") {
    const variationSpans = new Set(lesson.blocks.filter((block) => block.type === "variation").map((block) => block.sourceSpanId));
    for (const span of lesson.sourceSpans) {
      if (!variationSpans.has(span.id)) errors.push(`source span ${span.id} needs an authored variation block`);
    }
    for (const block of lesson.blocks) {
      if (block.type !== "variation") continue;
      if (!block.title.trim() || block.text.trim().length < 40) errors.push(`variation block ${block.id} needs authored title and prose`);
      if (/^source position\b|^chapter \d+ analysis - printed page/i.test(block.title) || /this region contains the source analysis|linked source image preserves the complete notation/i.test(block.text)) {
        errors.push(`variation block ${block.id} contains generated placeholder content`);
      }
    }
    for (const diagram of lesson.diagrams) {
      if (diagram.positionStatus !== "deterministically derived" || !diagram.lineId || diagram.moveIndex === null || diagram.moveIndex < 0) {
        errors.push(`diagram ${diagram.id} must be derived from an authored legal line`);
      }
      if (/^source position\b/i.test(diagram.role)) errors.push(`diagram ${diagram.id} needs an authored role`);
    }
  }

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
  if (!legacy) {
    const spanIds = lesson.sourceSpans.map((span) => span.id);
    const regionIds = config.importDefinition.regions.map((region) => region.id);
    if (spanIds.length !== regionIds.length || spanIds.some((id, index) => regionIds[index] !== id)) errors.push("import regions must cover source spans in reading order");
  }
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
