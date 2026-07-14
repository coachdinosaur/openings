"use client";

import { ChangeEvent, memo, MouseEvent, ReactNode, RefObject, useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Chess, Square } from "chess.js";
import { useRouter } from "next/navigation";
import { B2_LESSON } from "./b2-lesson";
import { CHAPTERS, chapterConfig, type ChapterConfig, type ChapterId } from "./chapter-config";
import { canonicalize, sha256 } from "./canonical";
import LessonLoading from "./LessonLoading";
import type { DiagramLink, ImportComparison, LessonDocument, MoveReference, ReviewItem, ReviewOverlay, VariationMove, VariationNode } from "./lesson-model";
import { legalTargets, playAnalysisMove } from "./board-analysis";
import type { AnalysisMove, BoardMoveInput, PromotionPiece } from "./board-analysis";
import type { AnalysisUpdate, EnginePhase, EngineScore, StockfishClient, StockfishEvent } from "./stockfish-client";

type View = "lesson" | "review" | "import";
type ActivePosition = { lineId: string; ply: number };
type ReviewTab = "text" | "moves" | "boards";

const LEGACY_REVIEW_KEY = "catalan-b2-review-v1";
const EDITOR_KEY = "catalan-editor-mode-v1";
const CHAPTER_NAVIGATION_PAINT_DELAY_MS = 120;

const lessonLineIndexes = new WeakMap<LessonDocument, Map<string, VariationNode>>();
const lessonSpanIndexes = new WeakMap<LessonDocument, Map<string, LessonDocument["sourceSpans"][number]>>();
const lessonDiagramIndexes = new WeakMap<LessonDocument, Map<string, DiagramLink>>();
const lessonPathCaches = new WeakMap<LessonDocument, Map<string, VariationMove[]>>();
type ResolvedPosition = { fen: string; path: VariationMove[]; valid: boolean; activeMove: VariationMove | undefined };
const positionCaches = new WeakMap<ReviewOverlay, WeakMap<LessonDocument, Map<string, ResolvedPosition>>>();

const emptyOverlay = (lesson: LessonDocument): ReviewOverlay => ({ schemaVersion: 2, fixtureSha256: lesson.source.sha256, items: {} });
const lineById = (lesson: LessonDocument, id: string) => {
  let index = lessonLineIndexes.get(lesson);
  if (!index) {
    index = new Map(lesson.lines.map((line) => [line.id, line]));
    lessonLineIndexes.set(lesson, index);
  }
  return index.get(id) ?? lesson.lines[0];
};
const spanById = (lesson: LessonDocument, id: string) => {
  let index = lessonSpanIndexes.get(lesson);
  if (!index) {
    index = new Map(lesson.sourceSpans.map((span) => [span.id, span]));
    lessonSpanIndexes.set(lesson, index);
  }
  return index.get(id) ?? lesson.sourceSpans[0];
};
const diagramById = (lesson: LessonDocument, id: string) => {
  let index = lessonDiagramIndexes.get(lesson);
  if (!index) {
    index = new Map(lesson.diagrams.map((diagram) => [diagram.id, diagram]));
    lessonDiagramIndexes.set(lesson, index);
  }
  return index.get(id) ?? lesson.diagrams[0];
};

function effectiveSan(move: VariationMove, overlay: ReviewOverlay): string {
  const item = overlay.items[move.id];
  return item?.decision === "accepted" && item.correctedSan?.trim() ? item.correctedSan.trim() : move.san;
}

function linePrefix(lesson: LessonDocument, line: VariationNode): VariationMove[] {
  if (!line.parentLineId) return [];
  const parent = lineById(lesson, line.parentLineId);
  return [...linePrefix(lesson, parent), ...parent.moves.slice(0, line.parentPly)];
}

function linePath(lesson: LessonDocument, lineId: string): VariationMove[] {
  let cache = lessonPathCaches.get(lesson);
  if (!cache) {
    cache = new Map();
    lessonPathCaches.set(lesson, cache);
  }
  const cached = cache.get(lineId);
  if (cached) return cached;
  const line = lineById(lesson, lineId);
  const path = [...linePrefix(lesson, line), ...line.moves];
  cache.set(lineId, path);
  return path;
}

function lineStartFen(lesson: LessonDocument, line: VariationNode): string {
  if (line.startFen) return line.startFen;
  if (line.parentLineId) return lineStartFen(lesson, lineById(lesson, line.parentLineId));
  return lesson.basePosition.fen;
}

function localMovePly(lesson: LessonDocument, lineId: string, moveIndex: number): number {
  return linePrefix(lesson, lineById(lesson, lineId)).length + moveIndex + 1;
}

function positionFor(lesson: LessonDocument, active: ActivePosition, overlay: ReviewOverlay): ResolvedPosition {
  let lessonCaches = positionCaches.get(overlay);
  if (!lessonCaches) {
    lessonCaches = new WeakMap();
    positionCaches.set(overlay, lessonCaches);
  }
  let cache = lessonCaches.get(lesson);
  if (!cache) {
    cache = new Map();
    lessonCaches.set(lesson, cache);
  }
  const cacheKey = `${active.lineId}:${active.ply}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  const path = linePath(lesson, active.lineId);
  const startFen = lineStartFen(lesson, lineById(lesson, active.lineId));
  const chess = new Chess(startFen);
  let valid = true;
  try {
    path.slice(0, active.ply).forEach((move) => chess.move(effectiveSan(move, overlay)));
  } catch {
    valid = false;
    const fallback = new Chess(startFen);
    path.slice(0, active.ply).forEach((move) => fallback.move(move.san));
    const resolved = { fen: fallback.fen(), path, valid, activeMove: path[active.ply - 1] };
    cache.set(cacheKey, resolved);
    return resolved;
  }
  const resolved = { fen: chess.fen(), path, valid, activeMove: path[active.ply - 1] };
  cache.set(cacheKey, resolved);
  return resolved;
}

function scoreToWhiteFraction(score: EngineScore | null): number | null {
  if (!score) return null;
  if (score.kind === "mate") return score.whiteValue > 0 ? 0.98 : score.whiteValue < 0 ? 0.02 : 0.5;
  return Math.min(0.94, Math.max(0.06, 0.5 + score.whiteValue / 1200));
}

function migrateReview(config: ChapterConfig): ReviewOverlay {
  const stored = localStorage.getItem(config.reviewKey);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as ReviewOverlay;
      if (parsed.schemaVersion === 2 && parsed.fixtureSha256 === config.lesson.source.sha256) return parsed;
    } catch {}
  }
  const next = emptyOverlay(config.lesson);
  if (config.id !== "1") return next;
  const legacy = localStorage.getItem(LEGACY_REVIEW_KEY);
  if (!legacy) return next;
  try {
    const old = JSON.parse(legacy) as Record<string, unknown>;
    const moveDecision = typeof old.moveDecision === "string" ? old.moveDecision : "pending";
    next.items["b2-main-10b-d4"] = {
      decision: moveDecision === "accepted" || moveDecision === "needs correction" ? moveDecision : "pending",
      correctedSan: typeof old.canonicalSan === "string" ? old.canonicalSan : undefined,
      punctuation: typeof old.punctuation === "string" ? old.punctuation : undefined,
      novelty: typeof old.novelty === "string" ? old.novelty : undefined,
      sourceToken: "d4!?N",
    };
    const diagrams = old.diagrams as Record<string, Record<string, string>> | undefined;
    for (const diagram of B2_LESSON.diagrams) {
      const item = diagrams?.[diagram.id];
      if (!item) continue;
      next.items[diagram.id] = {
        decision: item.decision === "accepted" || item.decision === "needs correction" ? item.decision : "pending",
        correctedFen: item.fen,
        confidence: item.confidence === "visually plausible" || item.confidence === "manually confirmed" ? item.confidence : "unreviewed",
        note: item.note,
      };
    }
    if (typeof old.transcription === "string") next.legacyTextReview = { transcription: old.transcription, decision: typeof old.textDecision === "string" ? old.textDecision : "pending" };
    localStorage.setItem(config.reviewKey, JSON.stringify(next));
  } catch {}
  return next;
}

const Chessboard = memo(function Chessboard({ fen, flipped = false, onMove, lastMove }: { fen: string; flipped?: boolean; onMove?: (move: BoardMoveInput) => void; lastMove?: BoardMoveInput | null }) {
  const chess = useMemo(() => new Chess(fen), [fen]);
  const interactive = Boolean(onMove);
  const boardKey = `${fen}:${flipped ? "flipped" : "normal"}`;
  const [selectionState, setSelectionState] = useState<{ boardKey: string; square: Square | null }>({ boardKey, square: null });
  const [promotionState, setPromotionState] = useState<{ boardKey: string; move: { from: Square; to: Square } | null }>({ boardKey, move: null });
  const selected = selectionState.boardKey === boardKey ? selectionState.square : null;
  const promotion = promotionState.boardKey === boardKey ? promotionState.move : null;
  const setSelected = (square: Square | null) => setSelectionState({ boardKey, square });
  const setPromotion = (move: { from: Square; to: Square } | null) => setPromotionState({ boardKey, move });
  const targets = useMemo(() => selected ? legalTargets(fen, selected) : [], [fen, selected]);
  const files = flipped ? ["h", "g", "f", "e", "d", "c", "b", "a"] : ["a", "b", "c", "d", "e", "f", "g", "h"];
  const ranks = flipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];

  const targetFor = (square: Square) => targets.filter((target) => target.to === square);
  const selectSquare = (square: Square) => {
    if (!interactive || !onMove) return;
    const piece = chess.get(square);
    const options = targetFor(square);
    if (selected) {
      if (square === selected) {
        setSelected(null);
        return;
      }
      if (options.length) {
        if (options.some((target) => target.promotion)) setPromotion({ from: selected, to: square });
        else onMove({ from: selected, to: square });
        setSelected(null);
        return;
      }
      setSelected(piece?.color === chess.turn() ? square : null);
      return;
    }
    if (piece?.color === chess.turn()) setSelected(square);
  };
  const dropMove = (from: Square, to: Square) => {
    if (!interactive || !onMove) return;
    const fromTargets = legalTargets(fen, from);
    const options = fromTargets.filter((target) => target.to === to);
    if (!options.length) {
      setSelected(null);
      return;
    }
    if (options.some((target) => target.promotion)) setPromotion({ from, to });
    else onMove({ from, to });
    setSelected(null);
  };
  const choosePromotion = (piece: PromotionPiece) => {
    if (promotion && onMove) onMove({ from: promotion.from, to: promotion.to, promotion: piece });
    setPromotion(null);
    setSelected(null);
  };
  const boardLabel = interactive ? `Interactive chess position: ${fen}` : `Chess position: ${fen}`;
  return <div className={`board ${interactive ? "interactive" : ""}`} role={interactive ? "grid" : "img"} aria-label={boardLabel}>
    {ranks.flatMap((rank) => files.map((file) => {
      const square = `${file}${rank}` as Square;
      const piece = chess.get(square);
      const light = (file.charCodeAt(0) - 97 + rank) % 2 === 0;
      const options = targetFor(square);
      const isSelected = selected === square;
      const isLastMove = lastMove?.from === square || lastMove?.to === square;
      const classes = `square ${light ? "light" : "dark"} ${interactive ? "interactive" : ""} ${isSelected ? "selected" : ""} ${options.length ? "legal-target" : ""} ${options.some((target) => target.capture) ? "capture-target" : ""} ${isLastMove ? "last-move" : ""}`;
      const content = <>
        {piece && <img data-color={piece.color} data-piece={piece.type} draggable={false} decoding="async" src={`/assets/pieces/mpchess/${piece.color}${piece.type.toUpperCase()}.svg`} alt={`${piece.color === "w" ? "White" : "Black"} ${piece.type}`} />}
        {file === files[0] && <span className="rank-label">{rank}</span>}
        {rank === ranks[ranks.length - 1] && <span className="file-label">{file}</span>}
      </>;
      const description = `${square}, ${piece ? `${piece.color === "w" ? "white" : "black"} ${piece.type}` : "empty"}${isSelected ? ", selected" : ""}${options.length ? ", legal destination" : ""}`;
      if (!interactive) return <div className={classes} key={square}>{content}</div>;
      return <button
        type="button"
        className={classes}
        key={square}
        aria-label={description}
        draggable={Boolean(piece)}
        onClick={() => selectSquare(square)}
        onDragStart={(event) => {
          if (!piece || piece.color !== chess.turn()) { event.preventDefault(); return; }
          setSelected(square);
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", square);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const source = event.dataTransfer.getData("text/plain") as Square;
          if (source && source !== square) {
            setSelected(source);
            dropMove(source, square);
          }
        }}
      >{content}</button>;
    }))}
    {promotion && <div className="promotion-picker" role="dialog" aria-modal="true" aria-label="Choose promotion piece">
      <strong>Promote pawn</strong>
      <div>{(["q", "r", "b", "n"] as const).map((piece) => <button type="button" key={piece} onClick={() => choosePromotion(piece)} aria-label={`Promote to ${piece === "q" ? "queen" : piece === "r" ? "rook" : piece === "b" ? "bishop" : "knight"}`}><img decoding="async" src={`/assets/pieces/mpchess/${chess.get(promotion.from)?.color ?? "w"}${piece.toUpperCase()}.svg`} alt="" /></button>)}</div>
      <button type="button" className="promotion-cancel" onClick={() => setPromotion(null)}>Cancel</button>
    </div>}
  </div>;
});

function Decision({ value, onChange }: { value: ReviewItem["decision"]; onChange: (value: ReviewItem["decision"]) => void }) {
  return <div className="decision" role="group" aria-label="Review decision">
    {(["pending", "accepted", "needs correction"] as const).map((item) => <button key={item} className={value === item ? "selected" : ""} onClick={() => onChange(item)}>{item}</button>)}
  </div>;
}

function RichText({ lesson, text, refs = [], overlay, onMove }: { lesson: LessonDocument; text: string; refs?: MoveReference[]; overlay: ReviewOverlay; onMove: (lineId: string, moveIndex: number) => void }) {
  const output: ReactNode[] = [];
  let cursor = 0;
  refs.forEach((reference, index) => {
    const at = text.indexOf(reference.source, cursor);
    if (at < 0) return;
    if (at > cursor) output.push(text.slice(cursor, at));
    const move = lineById(lesson, reference.lineId).moves[reference.moveIndex];
    output.push(<button key={`${move.id}-${index}`} data-move-id={move.id} className={`inline-move ${reference.unresolved ? "unresolved" : ""}`} onClick={() => onMove(reference.lineId, reference.moveIndex)} title={reference.unresolved ? "Source token preserved; exact board position needs review." : `Canonical SAN: ${effectiveSan(move, overlay)}`}>{reference.source}</button>);
    cursor = at + reference.source.length;
  });
  output.push(text.slice(cursor));
  return <>{output}</>;
}

function SourceRegion({ lesson, spanId }: { lesson: LessonDocument; spanId: string }) {
  const span = spanById(lesson, spanId);
  return <div className="source-region">
    <span>Source order {span.order}</span>
    <strong>Printed page {span.printedPage} · {span.column} column</strong>
    <details><summary>View source evidence</summary><img loading="lazy" decoding="async" src={span.crop} alt={`Printed page ${span.printedPage} ${span.column} column crop`} /></details>
  </div>;
}

function DiagramCard({ diagram, overlay, onJump, compact = false }: { diagram: DiagramLink; overlay: ReviewOverlay; onJump: () => void; compact?: boolean }) {
  const review = overlay.items[diagram.id];
  const fen = review?.decision === "accepted" && review.correctedFen ? review.correctedFen : diagram.fen;
  return <article className={`lesson-diagram ${compact ? "compact" : ""}`}>
    <div className="diagram-heading"><div><span>{diagram.id}</span><h3>{diagram.role}</h3></div><button onClick={onJump}>Jump to position</button></div>
    <div className="diagram-statuses"><span>{diagram.associationStatus} association</span><span>{diagram.positionStatus} position</span><span>{review?.decision === "accepted" ? "manually reviewed" : diagram.boardIdentityStatus + " identity"}</span></div>
    {compact && <div className="diagram-preview-board"><Chessboard fen={fen} /></div>}
    <details className="printed-diagram"><summary>View printed diagram</summary><img loading="lazy" decoding="async" src={diagram.crop} alt={`${diagram.id} printed chess diagram`} /></details>
  </article>;
}

const Narrative = memo(function Narrative({ lesson, overlay, onMove, onJump, containerRef }: { lesson: LessonDocument; overlay: ReviewOverlay; onMove: (lineId: string, moveIndex: number) => void; onJump: (diagram: DiagramLink) => void; containerRef: RefObject<HTMLElement | null> }) {
  return <article ref={containerRef} className="narrative" aria-label={`Complete ${lesson.title} source text`}>
    {lesson.blocks.map((block, index) => {
      const previousSpan = lesson.blocks[index - 1]?.sourceSpanId;
      const region = block.sourceSpanId !== previousSpan ? <SourceRegion lesson={lesson} spanId={block.sourceSpanId} /> : null;
      const item = overlay.items[block.id];
      const text = item?.decision === "accepted" && item.correctedText !== undefined ? item.correctedText : "text" in block ? block.text : "";
      let content: ReactNode;
      if (block.type === "heading") content = <h2 className="source-heading"><RichText lesson={lesson} text={text} refs={block.moveRefs} overlay={overlay} onMove={onMove} /></h2>;
      else if (block.type === "diagram") {
        const diagram = diagramById(lesson, block.diagramId);
        content = <DiagramCard diagram={diagram} overlay={overlay} onJump={() => onJump(diagram)} />;
      } else if (block.type === "variation") {
        const diagram = block.diagramId ? diagramById(lesson, block.diagramId) : null;
        content = <details className="variation-card"><summary><span>Sideline</span><strong>{block.title}</strong></summary><div className="variation-body"><p><RichText lesson={lesson} text={text} refs={block.moveRefs} overlay={overlay} onMove={onMove} /></p>{diagram && <DiagramCard compact diagram={diagram} overlay={overlay} onJump={() => onJump(diagram)} />}</div></details>;
      } else if (block.type === "move-sequence") content = <div className="main-move-block"><RichText lesson={lesson} text={text} refs={block.moveRefs} overlay={overlay} onMove={onMove} /></div>;
      else if (block.type === "assessment") content = <blockquote className="final-assessment"><RichText lesson={lesson} text={text} refs={block.moveRefs} overlay={overlay} onMove={onMove} /></blockquote>;
      else content = <p className="lesson-prose"><RichText lesson={lesson} text={text} refs={block.moveRefs} overlay={overlay} onMove={onMove} /></p>;
      return <div className="narrative-block" data-block-id={block.id} key={block.id}>{region}{content}</div>;
    })}
  </article>;
});

function EvaluationRail({ score, flipped }: { score: EngineScore | null; flipped: boolean }) {
  const whiteFraction = scoreToWhiteFraction(score);
  const whitePercent = (whiteFraction ?? 0.5) * 100;
  const blackPercent = 100 - whitePercent;
  const segments = flipped
    ? [{ side: "white", height: whitePercent }, { side: "black", height: blackPercent }]
    : [{ side: "black", height: blackPercent }, { side: "white", height: whitePercent }];
  return <div className="evaluation-rail" role="img" aria-label={score ? "Engine evaluation" : "Neutral engine evaluation, equal split"} data-orientation={flipped ? "flipped" : "normal"}>
    <div className="evaluation-segments" aria-hidden="true">{segments.map((segment) => <div key={segment.side} className={`evaluation-segment ${segment.side}`} style={{ height: `${segment.height}%` }} />)}</div>
  </div>;
}

const INITIAL_ENGINE_PHASE: EnginePhase = "uninitialized";

function LessonView({ config, overlay }: { config: ChapterConfig; overlay: ReviewOverlay }) {
  const { lesson } = config;
  const [active, setActive] = useState<ActivePosition>(config.defaultPosition);
  const [flipped, setFlipped] = useState(false);
  const position = useMemo(() => positionFor(lesson, active, overlay), [lesson, active, overlay]);
  const [analysisMoves, setAnalysisMoves] = useState<AnalysisMove[]>([]);
  const displayedFen = analysisMoves.length ? analysisMoves[analysisMoves.length - 1].fen : position.fen;
  const lastAnalysisMove = analysisMoves.length ? analysisMoves[analysisMoves.length - 1] : null;
  const [enginePhase, setEnginePhase] = useState<EnginePhase>(INITIAL_ENGINE_PHASE);
  const [engineAnalysis, setEngineAnalysis] = useState<AnalysisUpdate | null>(null);
  const [engineError, setEngineError] = useState<string | null>(null);
  const [analysisRequested, setAnalysisRequested] = useState(false);
  const engineClientRef = useRef<StockfishClient | null>(null);
  const engineClientLoadRef = useRef<Promise<StockfishClient> | null>(null);
  const engineUnsubscribeRef = useRef<(() => void) | null>(null);
  const narrativeRef = useRef<HTMLElement | null>(null);
  const currentFenRef = useRef(displayedFen);
  const analysisRequestedRef = useRef(false);
  const expectedSearchIdRef = useRef<number | null>(null);
  const analysisRequestTokenRef = useRef(0);
  const enginePhaseRef = useRef<EnginePhase>(INITIAL_ENGINE_PHASE);
  const mountedRef = useRef(true);
  const setActivePosition = useCallback((value: ActivePosition | ((current: ActivePosition) => ActivePosition)) => {
    setEngineAnalysis(null);
    setAnalysisMoves([]);
    setActive(value);
  }, []);
  const applyAnalysisMove = useCallback((input: BoardMoveInput) => {
    const move = playAnalysisMove(displayedFen, input);
    if (!move) return;
    setEngineAnalysis(null);
    setEngineError(null);
    setAnalysisMoves((current) => [...current, move]);
  }, [displayedFen]);
  const undoAnalysisMove = () => {
    setEngineAnalysis(null);
    setAnalysisMoves((current) => current.slice(0, -1));
  };
  const resetAnalysis = () => {
    setEngineAnalysis(null);
    setAnalysisMoves([]);
  };
  const selectMove = useCallback((lineId: string, moveIndex: number) => {
    setActivePosition({ lineId, ply: localMovePly(lesson, lineId, moveIndex) });
  }, [lesson, setActivePosition]);
  const jumpDiagram = useCallback((diagram: DiagramLink) => {
    if (diagram.lineId === null || diagram.moveIndex === null) setActivePosition(config.defaultPosition);
    else selectMove(diagram.lineId, diagram.moveIndex);
  }, [config.defaultPosition, selectMove, setActivePosition]);

  const setEngineFailure = useCallback((error: unknown) => {
    if (!mountedRef.current) return;
    analysisRequestedRef.current = false;
    expectedSearchIdRef.current = null;
    analysisRequestTokenRef.current += 1;
    enginePhaseRef.current = "error";
    setAnalysisRequested(false);
    setEnginePhase("error");
    setEngineAnalysis(null);
    setEngineError(error instanceof Error ? error.message : "Stockfish could not analyze this position.");
  }, []);

  const ensureEngineClient = useCallback(async () => {
    if (engineClientRef.current) return engineClientRef.current;
    if (engineClientLoadRef.current) return engineClientLoadRef.current;
    const load = import("./stockfish-client").then(({ StockfishClient: Client }) => {
      if (!mountedRef.current) throw new Error("Stockfish loading was cancelled.");
      const client = new Client();
      const unsubscribe = client.subscribe((event: StockfishEvent) => {
        if (!mountedRef.current) return;
        const previousPhase = enginePhaseRef.current;
        const displayPhase = event.phase === "uninitialized" && analysisRequestedRef.current ? "loading" : event.phase;
        enginePhaseRef.current = displayPhase;
        setEnginePhase(displayPhase);
        if (event.phase === "error") {
          analysisRequestedRef.current = false;
          setAnalysisRequested(false);
          setEngineAnalysis(null);
          setEngineError(event.error ?? "Stockfish failed to load.");
          return;
        }
        setEngineError(event.error);
        const matchesDisplayedSearch = event.analysis
          && event.analysis.fen === currentFenRef.current
          && event.analysis.searchId === expectedSearchIdRef.current;
        setEngineAnalysis(matchesDisplayedSearch ? event.analysis : null);
        if (previousPhase === "searching" && event.phase === "ready" && analysisRequestedRef.current) {
          analysisRequestedRef.current = false;
          setAnalysisRequested(false);
        }
      });
      engineClientRef.current = client;
      engineUnsubscribeRef.current = unsubscribe;
      return client;
    }).finally(() => {
      engineClientLoadRef.current = null;
    });
    engineClientLoadRef.current = load;
    return load;
  }, []);

  const requestAnalysis = useCallback((client: StockfishClient, fen: string) => {
    const requestToken = ++analysisRequestTokenRef.current;
    expectedSearchIdRef.current = null;
    void client.analyze(fen).then((searchId) => {
      if (!mountedRef.current || requestToken !== analysisRequestTokenRef.current || currentFenRef.current !== fen || !analysisRequestedRef.current) return;
      expectedSearchIdRef.current = searchId;
      const current = client.getSnapshot().analysis;
      if (current?.searchId === searchId && current.fen === fen) setEngineAnalysis(current);
    }).catch(setEngineFailure);
  }, [setEngineFailure]);

  const toggleAnalysis = async () => {
    if (enginePhase === "loading" || enginePhase === "stopping" || enginePhase === "restarting" || enginePhase === "error") return;
    if (analysisRequestedRef.current || enginePhase === "searching") {
      analysisRequestedRef.current = false;
      analysisRequestTokenRef.current += 1;
      setAnalysisRequested(false);
      if (engineClientRef.current) void engineClientRef.current.stop().catch(setEngineFailure);
      return;
    }
    analysisRequestedRef.current = true;
    enginePhaseRef.current = "loading";
    setAnalysisRequested(true);
    setEnginePhase("loading");
    setEngineAnalysis(null);
    setEngineError(null);
    try {
      const client = await ensureEngineClient();
      if (!mountedRef.current || !analysisRequestedRef.current) return;
      requestAnalysis(client, currentFenRef.current);
    } catch (error) {
      setEngineFailure(error);
    }
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;
      if (event.key === "ArrowRight") setActivePosition((value) => ({ ...value, ply: Math.min(linePath(lesson, value.lineId).length, value.ply + 1) }));
      if (event.key === "ArrowLeft") setActivePosition((value) => ({ ...value, ply: Math.max(0, value.ply - 1) }));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lesson, setActivePosition]);

  useEffect(() => {
    const root = narrativeRef.current;
    if (!root) return;
    root.querySelectorAll<HTMLElement>(".inline-move.active").forEach((element) => {
      element.classList.remove("active");
      element.removeAttribute("aria-current");
    });
    const activeMoveId = position.activeMove?.id;
    if (!activeMoveId) return;
    root.querySelectorAll<HTMLElement>(`[data-move-id="${CSS.escape(activeMoveId)}"]`).forEach((element) => {
      element.classList.add("active");
      element.setAttribute("aria-current", "true");
    });
  }, [overlay, position.activeMove?.id]);

  useEffect(() => {
    currentFenRef.current = displayedFen;
    if (analysisRequestedRef.current && engineClientRef.current) {
      requestAnalysis(engineClientRef.current, displayedFen);
    } else {
      expectedSearchIdRef.current = null;
    }
  }, [displayedFen, requestAnalysis]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      engineUnsubscribeRef.current?.();
      engineUnsubscribeRef.current = null;
      engineClientRef.current?.dispose();
      engineClientRef.current = null;
      engineClientLoadRef.current = null;
      expectedSearchIdRef.current = null;
      analysisRequestTokenRef.current += 1;
    };
  }, []);

  const activeIndex = active.ply - 1;
  const start = new Chess(lineStartFen(lesson, lineById(lesson, active.lineId)));
  const [, turn, , , , fullmove] = start.fen().split(" ");
  const halfMove = (turn === "b" ? 1 : 0) + Math.max(activeIndex, 0);
  const moveNumber = Number(fullmove) + Math.floor(halfMove / 2);
  const moveLabel = lastAnalysisMove?.label ?? (position.activeMove ? `${moveNumber}${halfMove % 2 === 0 ? "." : "..."}${effectiveSan(position.activeMove, overlay)}` : (lineById(lesson, active.lineId).startLabel ?? "Line start"));
  // A retained result is visible only after the FEN ref catches up with the
  // rendered position. Navigation therefore blanks the old PV immediately,
  // while Stop keeps it visible for the unchanged position.
  const visibleAnalysis = engineAnalysis?.fen === displayedFen ? engineAnalysis : null;
  // Keep the last valid PV visible while Stockfish is stopping or ready. A
  // new search and FEN navigation clear the retained update above.
  const showPv = visibleAnalysis !== null;
  const pvOutput = showPv
    ? [`Depth ${visibleAnalysis.depth ?? "—"}`, visibleAnalysis.score?.label ?? "—", visibleAnalysis.formattedPv].filter(Boolean).join(" · ")
    : "";
  const analysisTransition = enginePhase === "loading" || enginePhase === "stopping" || enginePhase === "restarting" || (analysisRequested && enginePhase === "ready");
  const analysisButtonLabel = enginePhase === "loading" || (analysisRequested && enginePhase === "ready")
    ? "Loading engine…"
    : enginePhase === "stopping"
      ? "Stopping…"
      : enginePhase === "restarting"
        ? "Restarting…"
        : enginePhase === "searching"
          ? "Stop"
          : "Analyze";
  return <main className="view lesson-reader">
    <h1 className="sr-only">{lesson.title}</h1>
    <section className="guided-layout">
      <aside className="sticky-board">
        <div className="analysis-pv" aria-label="Stockfish principal variation"><span className="analysis-pv-output">{pvOutput}</span></div>
        <div className="board-frame primary-board-frame"><div className="board-analysis-row">
          <EvaluationRail score={visibleAnalysis?.score ?? null} flipped={flipped} />
          <div className="primary-board"><Chessboard fen={displayedFen} flipped={flipped} onMove={applyAnalysisMove} lastMove={lastAnalysisMove} /></div>
        </div></div>
        <div className="board-controls" aria-label="Chessboard controls">
          <div className="board-nav-controls">
            <button onClick={() => setActivePosition((value) => ({ ...value, ply: 0 }))} aria-label="Go to line start">|‹</button>
            <button onClick={() => setActivePosition((value) => ({ ...value, ply: Math.max(0, value.ply - 1) }))} aria-label="Previous move">‹</button>
            <span>{moveLabel}</span>
            <button onClick={() => setActivePosition((value) => ({ ...value, ply: Math.min(linePath(lesson, value.lineId).length, value.ply + 1) }))} aria-label="Next move">›</button>
            <button onClick={() => setActivePosition((value) => ({ ...value, ply: linePath(lesson, value.lineId).length }))} aria-label="Go to line end">›|</button>
          </div>
          {analysisMoves.length > 0 && <div className="analysis-branch-controls" aria-label="Analysis branch controls">
            <span>Analysis branch · {analysisMoves.length} {analysisMoves.length === 1 ? "ply" : "plies"}</span>
            <div><button onClick={undoAnalysisMove} aria-label="Undo analysis move">Undo</button><button onClick={resetAnalysis} aria-label="Reset analysis to lesson position">Reset</button></div>
          </div>}
          <div className="board-action-controls">
            <button className="analysis-button" onClick={toggleAnalysis} aria-label={enginePhase === "searching" ? "Stop Stockfish analysis" : "Analyze current position with Stockfish"} aria-pressed={analysisRequested} disabled={analysisTransition || enginePhase === "error"}>{analysisButtonLabel}</button>
            <button className="flip-button" onClick={() => setFlipped((value) => !value)} aria-label="Flip board">↻ Flip</button>
          </div>
          {engineError && <p className="analysis-error" role="alert">{engineError}</p>}
        </div>
        <div className="active-line"><span>{analysisMoves.length ? "Analysis from" : "Active line"}</span><strong>{lineById(lesson, active.lineId).label}</strong>{analysisMoves.length > 0 && <small>{analysisMoves.length} exploratory {analysisMoves.length === 1 ? "move" : "moves"}; lesson source remains unchanged.</small>}{!position.valid && <small>Manual SAN correction is not legal; showing verified baseline position.</small>}</div>
      </aside>
      <Narrative lesson={lesson} overlay={overlay} onMove={selectMove} onJump={jumpDiagram} containerRef={narrativeRef} />
    </section>
  </main>;
}

function ReviewView({ config, overlay, setOverlay }: { config: ChapterConfig; overlay: ReviewOverlay; setOverlay: (overlay: ReviewOverlay) => void }) {
  const { lesson } = config;
  const [tab, setTab] = useState<ReviewTab>("text");
  const updateItem = (id: string, patch: Partial<ReviewItem>) => setOverlay({ ...overlay, items: { ...overlay.items, [id]: { ...(overlay.items[id] ?? { decision: "pending" as const }), ...patch } } });
  const textBlocks = lesson.blocks.filter((block) => "text" in block && block.type !== "heading");
  const annotatedMoves = config.annotatedMoveIds.map((id) => lesson.lines.flatMap((line) => line.moves).find((move) => move.id === id)).filter(Boolean) as VariationMove[];
  return <main className="view editor-view">
    <section className="page-heading"><div><p className="eyebrow">Editor mode · {config.label}</p><h1>Source review</h1><p className="lede">Review stable lesson entities. Accepted corrections form a separate local overlay and are never written over imported evidence.</p></div><span className="autosave">● Saved locally</span></section>
    {overlay.legacyTextReview && <div className="legacy-notice"><strong>Legacy review preserved</strong><p>The earlier partial transcription was archived and was not applied over the new complete source text.</p></div>}
    <div className="review-tabs"><button className={tab === "text" ? "active" : ""} onClick={() => setTab("text")}>Text · {textBlocks.length}</button><button className={tab === "moves" ? "active" : ""} onClick={() => setTab("moves")}>Moves · {annotatedMoves.length}</button><button className={tab === "boards" ? "active" : ""} onClick={() => setTab("boards")}>Boards · {lesson.diagrams.length}</button></div>
    {tab === "text" && <div className="review-list">{textBlocks.map((block) => {
      const item = overlay.items[block.id] ?? { decision: "pending" as const };
      const span = spanById(lesson, block.sourceSpanId);
      return <article className="review-card" key={block.id}><div className="review-card-meta"><span>{block.id}</span><strong>Page {span.printedPage} · {span.column}</strong><details><summary>View crop</summary><img loading="lazy" decoding="async" src={span.crop} alt={`Source crop for ${block.id}`} /></details></div><div><label>Source-verified text<textarea rows={Math.max(3, Math.ceil(block.text.length / 85))} value={item.correctedText ?? block.text} onChange={(event) => updateItem(block.id, { correctedText: event.target.value })} /></label><Decision value={item.decision} onChange={(decision) => updateItem(block.id, { decision })} /></div></article>;
    })}</div>}
    {tab === "moves" && <div className="review-list">{annotatedMoves.map((move) => {
      const item = overlay.items[move.id] ?? { decision: "pending" as const };
      return <article className="review-card compact-card" key={move.id}><div className="review-card-meta"><span>{move.id}</span><strong>{move.sourceToken}</strong><small>Canonical and annotations are separate fields.</small></div><div><div className="move-editor-grid"><label>Canonical SAN<input value={item.correctedSan ?? move.san} onChange={(event) => updateItem(move.id, { correctedSan: event.target.value })} /></label><label>Source token<input value={item.sourceToken ?? move.sourceToken} onChange={(event) => updateItem(move.id, { sourceToken: event.target.value })} /></label><label>Punctuation<input value={item.punctuation ?? move.annotation?.punctuation ?? ""} onChange={(event) => updateItem(move.id, { punctuation: event.target.value })} /></label><label>Novelty<input value={item.novelty ?? move.annotation?.novelty ?? ""} onChange={(event) => updateItem(move.id, { novelty: event.target.value })} /></label><label>Evaluation<input value={item.evaluation ?? move.annotation?.evaluation ?? ""} onChange={(event) => updateItem(move.id, { evaluation: event.target.value })} /></label></div><Decision value={item.decision} onChange={(decision) => updateItem(move.id, { decision })} /></div></article>;
    })}</div>}
    {tab === "boards" && <div className="review-list">{lesson.diagrams.map((diagram) => {
      const item = overlay.items[diagram.id] ?? { decision: "pending" as const, confidence: "unreviewed" as const };
      const fen = item.correctedFen ?? diagram.fen;
      let valid = true; try { new Chess(fen); } catch { valid = false; }
      return <article className="review-card board-review" key={diagram.id}><div className="review-card-meta"><span>{diagram.id} · printed source</span><img loading="lazy" decoding="async" src={diagram.crop} alt={`${diagram.id} source diagram`} /></div><div className="board-review-body"><div className="mini-board"><Chessboard fen={valid ? fen : diagram.fen} /></div><div><h2>{diagram.role}</h2><p className="status-line">Association: {diagram.associationStatus} · Position: {diagram.positionStatus} · Identity: {diagram.boardIdentityStatus}</p><label>Candidate FEN<input className={!valid ? "invalid" : ""} value={fen} onChange={(event) => updateItem(diagram.id, { correctedFen: event.target.value })} /></label><label>Comparison confidence<select value={item.confidence ?? "unreviewed"} onChange={(event) => updateItem(diagram.id, { confidence: event.target.value as ReviewItem["confidence"] })}><option>unreviewed</option><option>visually plausible</option><option>manually confirmed</option></select></label><label>Reviewer note<textarea rows={2} value={item.note ?? ""} onChange={(event) => updateItem(diagram.id, { note: event.target.value })} /></label><p className={valid ? "validity valid" : "validity invalid-text"}>{valid ? "✓ Legal FEN syntax" : "Invalid FEN - correction required"}</p><Decision value={item.decision} onChange={(decision) => updateItem(diagram.id, { decision })} /></div></div></article>;
    })}</div>}
  </main>;
}

function ImportView({ config, overlay }: { config: ChapterConfig; overlay: ReviewOverlay }) {
  const { lesson } = config;
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ImportComparison | null>(null);
  const preservedCorrections = Object.values(overlay.items).filter((item) => item.decision === "accepted").length;
  const compareLesson = async (sourceHash: string, extractedRegionCount: number): Promise<ImportComparison> => {
    const canonicalLessonHash = await sha256(canonicalize(lesson));
    const matches = !config.importDefinition.expectedCanonicalHash || canonicalLessonHash === config.importDefinition.expectedCanonicalHash;
    return { status: matches ? "no_change" : "review_required", sourceHash, canonicalLessonHash, changedLessonEntities: matches ? 0 : 1, preservedCorrections, extractedRegionCount, message: matches ? "The packaged lesson rebuilt identically. Manual corrections remain separate and preserved." : "The rebuilt canonical lesson differs from the packaged expected snapshot. Nothing was overwritten." };
  };
  const runBundled = async () => {
    setRunning(true); setResult(null);
    try { setResult(await compareLesson(lesson.source.sha256, config.importDefinition.regions.length)); }
    finally { setRunning(false); }
  };
  const checkPdf = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    setRunning(true); setResult(null);
    try {
      const bytes = await file.arrayBuffer();
      const sourceHash = await sha256(bytes);
      if (sourceHash !== lesson.source.sha256) {
        setResult({ status: "rejected", sourceHash, canonicalLessonHash: "not generated", changedLessonEntities: 0, preservedCorrections, extractedRegionCount: 0, message: `This PDF does not match the verified ${config.importDefinition.filename}. No lesson or review data was changed.` });
      } else {
        const { extractLessonRegions } = await import("./pdf-import");
        const regions = await extractLessonRegions(bytes, lesson, config.importDefinition.regions);
        setResult(await compareLesson(sourceHash, regions.length));
      }
    } catch (error) {
      setResult({ status: "review_required", sourceHash: lesson.source.sha256, canonicalLessonHash: "not generated", changedLessonEntities: 0, preservedCorrections, extractedRegionCount: 0, message: error instanceof Error ? error.message : "The PDF regions could not be extracted. Nothing was overwritten." });
    } finally { setRunning(false); event.target.value = ""; }
  };
  return <main className="view editor-view"><section className="page-heading"><div><p className="eyebrow">Editor mode · deterministic rebuild</p><h1>Re-import {config.label}</h1><p className="lede">Rebuild the declared source regions, compare the canonical lesson snapshot, and preserve the local review overlay.</p></div></section><section className="import-card"><div className="import-mark">↧</div><h2>Rebuild packaged lesson snapshot</h2><p>Checks the {config.importDefinition.scopeLabel}, compares the reviewed baseline, and never overwrites corrections.</p><button className="primary-button" onClick={runBundled} disabled={running}>{running ? "Rebuilding..." : "Run zero-change demonstration"}</button><div className="or"><span>or</span></div><label className="file-button">Choose {config.importDefinition.filename}<input type="file" accept="application/pdf" onChange={checkPdf} /></label></section>{result && <section className={`import-result ${result.status}`}><div className="result-icon">{result.status === "no_change" ? "✓" : "!"}</div><div><p className="eyebrow">Import result</p><h2>{result.status}</h2><p>{result.message}</p><dl><div><dt>Extracted regions</dt><dd>{result.extractedRegionCount}</dd></div><div><dt>Changed lesson entities</dt><dd>{result.changedLessonEntities}</dd></div><div><dt>Corrections preserved</dt><dd>{result.preservedCorrections}</dd></div><div><dt>Canonical lesson hash</dt><dd>{result.canonicalLessonHash}</dd></div></dl></div></section>}</main>;
}

export default function CatalanApp({ chapterId = "1", initialView = "lesson" }: { chapterId?: ChapterId; initialView?: View }) {
  const config = chapterConfig(chapterId);
  const router = useRouter();
  const [view, setView] = useState<View>(initialView);
  const [overlay, setOverlayState] = useState<ReviewOverlay>(emptyOverlay(config.lesson));
  const [editorMode, setEditorMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chapterTarget, setChapterTarget] = useState<ChapterConfig>();
  const [, startChapterTransition] = useTransition();
  useEffect(() => {
    const hydrationTask = window.setTimeout(() => {
      setOverlayState(migrateReview(config));
      setEditorMode(localStorage.getItem(EDITOR_KEY) === "true");
    }, 0);
    return () => window.clearTimeout(hydrationTask);
  }, [config]);
  const setOverlay = (value: ReviewOverlay) => { setOverlayState(value); localStorage.setItem(config.reviewKey, JSON.stringify(value)); };
  const toggleEditor = () => { const next = !editorMode; setEditorMode(next); localStorage.setItem(EDITOR_KEY, String(next)); if (!next) setView("lesson"); };
  const navigate = (next: View) => { setView(next); setMenuOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const navigateChapter = (event: MouseEvent<HTMLAnchorElement>, chapter: ChapterConfig) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || chapter.id === config.id) return;
    event.preventDefault();
    setMenuOpen(false);
    setChapterTarget(chapter);
    window.setTimeout(() => startChapterTransition(() => router.push(`/chapters/${chapter.id}`)), CHAPTER_NAVIGATION_PAINT_DELAY_MS);
  };
  return <div className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
    <header className="topbar"><button className="sidebar-toggle desktop-sidebar-toggle" onClick={() => setSidebarCollapsed((value) => !value)} aria-label={sidebarCollapsed ? "Show navigation" : "Hide navigation"} aria-expanded={!sidebarCollapsed} aria-controls="course-sidebar">☰</button><button className="sidebar-toggle menu-button" onClick={() => setMenuOpen((value) => !value)} aria-label="Toggle navigation" aria-expanded={menuOpen} aria-controls="course-sidebar">☰</button><button className="brand" onClick={() => navigate("lesson")}><span className="brand-mark">C</span><span><strong>Catalan Atelier</strong><small>{config.label}</small></span></button></header>
    <aside id="course-sidebar" className={`sidebar ${menuOpen ? "open" : ""}`}><nav><p>Course</p>{CHAPTERS.map((chapter) => <a className={`course-link ${chapter.id === config.id ? "active" : ""}`} href={`/chapters/${chapter.id}`} onClick={(event) => navigateChapter(event, chapter)} key={chapter.id}><span className="nav-glyph">{chapter.id}</span><span>{chapter.label}</span></a>)}{editorMode && <><p className="editor-nav-label">Editor tools</p><a className={view === "review" ? "active" : ""} href={`/chapters/${config.id}/review`}><span className="nav-glyph">R</span><span>Source review</span></a><a className={view === "import" ? "active" : ""} href={`/chapters/${config.id}/import`}><span className="nav-glyph">I</span><span>Re-import</span></a></>}</nav><div className="sidebar-footer"><div className="source-card"><span>Verified source</span><strong>{config.importDefinition.filename}</strong><small>SHA-256 · {config.importDefinition.sourceHash.slice(0, 4)}...{config.importDefinition.sourceHash.slice(-4)}</small></div><button className={`editor-toggle ${editorMode ? "on" : ""}`} onClick={toggleEditor} role="switch" aria-checked={editorMode}><span className="toggle-track"><i /></span><strong>Editor mode</strong></button></div></aside>
    {menuOpen && <button className="scrim" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />}
    <div className="chapter-switcher" aria-label="Chapters">{CHAPTERS.map((chapter) => <a className={config.id === chapter.id ? "active" : ""} data-chapter-id={chapter.id} href={`/chapters/${chapter.id}`} onClick={(event) => navigateChapter(event, chapter)} key={chapter.id}>{chapter.label}</a>)}</div>
    <div className="content">{view === "lesson" ? <LessonView config={config} overlay={overlay} /> : view === "review" && editorMode ? <ReviewView config={config} overlay={overlay} setOverlay={setOverlay} /> : view === "import" && editorMode ? <ImportView config={config} overlay={overlay} /> : <LessonView config={config} overlay={overlay} />}</div>
    {chapterTarget && chapterTarget.id !== config.id && <LessonLoading label={`Loading ${chapterTarget.label}…`} overlay />}
  </div>;
}
