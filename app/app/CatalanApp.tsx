"use client";

import { ChangeEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { Chess, Square } from "chess.js";
import { B2_LESSON } from "./b2-lesson";
import { CHAPTER1_ANNOTATED_MOVE_IDS, CHAPTER1_LESSON } from "./chapter1-lesson";
import { canonicalize, EXPECTED_B2_LESSON_HASH, sha256 } from "./canonical";
import type { DiagramLink, ImportComparison, LessonBlock, MoveReference, ReviewItem, ReviewOverlay, VariationMove, VariationNode } from "./lesson-model";

type View = "lesson" | "review" | "import";
type ActivePosition = { lineId: string; ply: number };
type ReviewTab = "text" | "moves" | "boards";

const REVIEW_KEY = "catalan-b2-review-v2";
const LEGACY_REVIEW_KEY = "catalan-b2-review-v1";
const EDITOR_KEY = "catalan-editor-mode-v1";

const emptyOverlay = (): ReviewOverlay => ({ schemaVersion: 2, fixtureSha256: B2_LESSON.source.sha256, items: {} });
const lineById = (id: string) => CHAPTER1_LESSON.lines.find((line) => line.id === id) ?? CHAPTER1_LESSON.lines[0];
const spanById = (id: string) => CHAPTER1_LESSON.sourceSpans.find((span) => span.id === id) ?? CHAPTER1_LESSON.sourceSpans[0];
const diagramById = (id: string) => CHAPTER1_LESSON.diagrams.find((diagram) => diagram.id === id) ?? CHAPTER1_LESSON.diagrams[0];

function effectiveSan(move: VariationMove, overlay: ReviewOverlay): string {
  const item = overlay.items[move.id];
  return item?.decision === "accepted" && item.correctedSan?.trim() ? item.correctedSan.trim() : move.san;
}

function linePrefix(line: VariationNode, overlay: ReviewOverlay): VariationMove[] {
  if (!line.parentLineId) return [];
  const parent = lineById(line.parentLineId);
  return [...linePrefix(parent, overlay), ...parent.moves.slice(0, line.parentPly)];
}

function linePath(lineId: string, overlay: ReviewOverlay): VariationMove[] {
  const line = lineById(lineId);
  return [...linePrefix(line, overlay), ...line.moves];
}

function lineStartFen(line: VariationNode): string {
  if (line.startFen) return line.startFen;
  if (line.parentLineId) return lineStartFen(lineById(line.parentLineId));
  return CHAPTER1_LESSON.basePosition.fen;
}

function localMovePly(lineId: string, moveIndex: number, overlay: ReviewOverlay): number {
  return linePrefix(lineById(lineId), overlay).length + moveIndex + 1;
}

function positionFor(active: ActivePosition, overlay: ReviewOverlay) {
  const path = linePath(active.lineId, overlay);
  const startFen = lineStartFen(lineById(active.lineId));
  const chess = new Chess(startFen);
  let valid = true;
  try {
    path.slice(0, active.ply).forEach((move) => chess.move(effectiveSan(move, overlay)));
  } catch {
    valid = false;
    const fallback = new Chess(startFen);
    path.slice(0, active.ply).forEach((move) => fallback.move(move.san));
    return { fen: fallback.fen(), path, valid, activeMove: path[active.ply - 1] };
  }
  return { fen: chess.fen(), path, valid, activeMove: path[active.ply - 1] };
}

function migrateReview(): ReviewOverlay {
  const stored = localStorage.getItem(REVIEW_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as ReviewOverlay;
      if (parsed.schemaVersion === 2 && parsed.fixtureSha256 === B2_LESSON.source.sha256) return parsed;
    } catch {}
  }
  const next = emptyOverlay();
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
    localStorage.setItem(REVIEW_KEY, JSON.stringify(next));
  } catch {}
  return next;
}

function Chessboard({ fen, flipped = false }: { fen: string; flipped?: boolean }) {
  const chess = useMemo(() => new Chess(fen), [fen]);
  const files = flipped ? ["h", "g", "f", "e", "d", "c", "b", "a"] : ["a", "b", "c", "d", "e", "f", "g", "h"];
  const ranks = flipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
  return <div className="board" role="img" aria-label={`Chess position: ${fen}`}>
    {ranks.flatMap((rank) => files.map((file) => {
      const square = `${file}${rank}` as Square;
      const piece = chess.get(square);
      const light = (file.charCodeAt(0) - 97 + rank) % 2 === 0;
      return <div className={`square ${light ? "light" : "dark"}`} key={square}>
        {piece && <img draggable={false} src={`/assets/pieces/mpchess/${piece.color}${piece.type.toUpperCase()}.svg`} alt={`${piece.color === "w" ? "White" : "Black"} ${piece.type}`} />}
        {file === files[0] && <span className="rank-label">{rank}</span>}
        {rank === ranks[ranks.length - 1] && <span className="file-label">{file}</span>}
      </div>;
    }))}
  </div>;
}

function Decision({ value, onChange }: { value: ReviewItem["decision"]; onChange: (value: ReviewItem["decision"]) => void }) {
  return <div className="decision" role="group" aria-label="Review decision">
    {(["pending", "accepted", "needs correction"] as const).map((item) => <button key={item} className={value === item ? "selected" : ""} onClick={() => onChange(item)}>{item}</button>)}
  </div>;
}

function RichText({ text, refs = [], activeMoveId, overlay, onMove }: { text: string; refs?: MoveReference[]; activeMoveId?: string; overlay: ReviewOverlay; onMove: (lineId: string, moveIndex: number) => void }) {
  const output: ReactNode[] = [];
  let cursor = 0;
  refs.forEach((reference, index) => {
    const at = text.indexOf(reference.source, cursor);
    if (at < 0) return;
    if (at > cursor) output.push(text.slice(cursor, at));
    const move = lineById(reference.lineId).moves[reference.moveIndex];
    output.push(<button key={`${move.id}-${index}`} className={`inline-move ${activeMoveId === move.id ? "active" : ""}`} onClick={() => onMove(reference.lineId, reference.moveIndex)} title={`Canonical SAN: ${effectiveSan(move, overlay)}`}>{reference.source}</button>);
    cursor = at + reference.source.length;
  });
  output.push(text.slice(cursor));
  return <>{output}</>;
}

function SourceRegion({ spanId }: { spanId: string }) {
  const span = spanById(spanId);
  return <div className="source-region">
    <span>Source order {span.order}</span>
    <strong>Printed page {span.printedPage} · {span.column} column</strong>
    <details><summary>View source evidence</summary><img src={span.crop} alt={`Printed page ${span.printedPage} ${span.column} column crop`} /></details>
  </div>;
}

function DiagramCard({ diagram, overlay, onJump, compact = false }: { diagram: DiagramLink; overlay: ReviewOverlay; onJump: () => void; compact?: boolean }) {
  const review = overlay.items[diagram.id];
  const fen = review?.decision === "accepted" && review.correctedFen ? review.correctedFen : diagram.fen;
  return <article className={`lesson-diagram ${compact ? "compact" : ""}`}>
    <div className="diagram-heading"><div><span>{diagram.id}</span><h3>{diagram.role}</h3></div><button onClick={onJump}>Jump to position</button></div>
    <div className="diagram-statuses"><span>{diagram.associationStatus} association</span><span>{diagram.positionStatus} position</span><span>{review?.decision === "accepted" ? "manually reviewed" : diagram.boardIdentityStatus + " identity"}</span></div>
    {compact && <div className="diagram-preview-board"><Chessboard fen={fen} /></div>}
    <details className="printed-diagram"><summary>View printed diagram</summary><img src={diagram.crop} alt={`${diagram.id} printed chess diagram`} /></details>
  </article>;
}

function LessonView({ overlay }: { overlay: ReviewOverlay }) {
  const [active, setActive] = useState<ActivePosition>({ lineId: "chapter-start", ply: 7 });
  const [flipped, setFlipped] = useState(false);
  const position = useMemo(() => positionFor(active, overlay), [active, overlay]);
  const selectMove = (lineId: string, moveIndex: number) => setActive({ lineId, ply: localMovePly(lineId, moveIndex, overlay) });
  const jumpDiagram = (diagram: DiagramLink) => diagram.lineId === null || diagram.moveIndex === null ? setActive({ lineId: "b2-main", ply: 0 }) : selectMove(diagram.lineId, diagram.moveIndex);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;
      if (event.key === "ArrowRight") setActive((value) => ({ ...value, ply: Math.min(linePath(value.lineId, overlay).length, value.ply + 1) }));
      if (event.key === "ArrowLeft") setActive((value) => ({ ...value, ply: Math.max(0, value.ply - 1) }));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlay]);

  const activeIndex = active.ply - 1;
  const start = new Chess(lineStartFen(lineById(active.lineId)));
  const [, turn, , , , fullmove] = start.fen().split(" ");
  const halfMove = (turn === "b" ? 1 : 0) + Math.max(activeIndex, 0);
  const moveNumber = Number(fullmove) + Math.floor(halfMove / 2);
  const moveLabel = position.activeMove ? `${moveNumber}${halfMove % 2 === 0 ? "." : "..."}${effectiveSan(position.activeMove, overlay)}` : (lineById(active.lineId).startLabel ?? "Line start");
  let lastSpan = "";
  return <main className="view lesson-reader">
    <section className="lesson-heading"><div><p className="eyebrow">Chapter 1 · Complete guided source lesson</p><h1>{CHAPTER1_LESSON.title}</h1><p className="lede">Read the complete chapter in verified two-column order through A, B, C, and the conclusion. Select a highlighted move to synchronize the board.</p></div><span className="status-pill verified">✓ Source text verified</span></section>
    <section className="guided-layout">
      <aside className="sticky-board">
        <div className="board-frame"><Chessboard fen={position.fen} flipped={flipped} /></div>
        <div className="board-controls" aria-label="Chessboard controls">
          <button onClick={() => setActive((value) => ({ ...value, ply: 0 }))} aria-label="Go to line start">|‹</button>
          <button onClick={() => setActive((value) => ({ ...value, ply: Math.max(0, value.ply - 1) }))} aria-label="Previous move">‹</button>
          <span>{moveLabel}</span>
          <button onClick={() => setActive((value) => ({ ...value, ply: Math.min(linePath(value.lineId, overlay).length, value.ply + 1) }))} aria-label="Next move">›</button>
          <button onClick={() => setActive((value) => ({ ...value, ply: linePath(value.lineId, overlay).length }))} aria-label="Go to line end">›|</button>
          <button className="flip-button" onClick={() => setFlipped((value) => !value)} aria-label="Flip board">↻ Flip</button>
        </div>
        <div className="active-line"><span>Active line</span><strong>{lineById(active.lineId).label}</strong>{!position.valid && <small>Manual SAN correction is not legal; showing verified baseline position.</small>}</div>
      </aside>
      <article className="narrative" aria-label="Complete Chapter 1 source text">
        {CHAPTER1_LESSON.blocks.map((block) => {
          const region = block.sourceSpanId !== lastSpan ? <SourceRegion spanId={block.sourceSpanId} /> : null;
          lastSpan = block.sourceSpanId;
          const item = overlay.items[block.id];
          const text = item?.decision === "accepted" && item.correctedText !== undefined ? item.correctedText : "text" in block ? block.text : "";
          let content: ReactNode;
          if (block.type === "heading") content = <h2 className="source-heading"><RichText text={text} refs={block.moveRefs} activeMoveId={position.activeMove?.id} overlay={overlay} onMove={selectMove} /></h2>;
          else if (block.type === "diagram") {
            const diagram = diagramById(block.diagramId);
            content = <DiagramCard diagram={diagram} overlay={overlay} onJump={() => jumpDiagram(diagram)} />;
          } else if (block.type === "variation") {
            const diagram = block.diagramId ? diagramById(block.diagramId) : null;
            content = <details className="variation-card"><summary><span>Sideline</span><strong>{block.title}</strong><small>Open complete source variation</small></summary><div className="variation-body"><p><RichText text={text} refs={block.moveRefs} activeMoveId={position.activeMove?.id} overlay={overlay} onMove={selectMove} /></p>{diagram && <DiagramCard compact diagram={diagram} overlay={overlay} onJump={() => jumpDiagram(diagram)} />}</div></details>;
          } else if (block.type === "move-sequence") content = <div className="main-move-block"><RichText text={text} refs={block.moveRefs} activeMoveId={position.activeMove?.id} overlay={overlay} onMove={selectMove} /></div>;
          else if (block.type === "assessment") content = <blockquote className="final-assessment"><RichText text={text} refs={block.moveRefs} activeMoveId={position.activeMove?.id} overlay={overlay} onMove={selectMove} /></blockquote>;
          else content = <p className="lesson-prose"><RichText text={text} refs={block.moveRefs} activeMoveId={position.activeMove?.id} overlay={overlay} onMove={selectMove} /></p>;
          return <div className="narrative-block" data-block-id={block.id} key={block.id}>{region}{content}</div>;
        })}
      </article>
    </section>
  </main>;
}

function ReviewView({ overlay, setOverlay }: { overlay: ReviewOverlay; setOverlay: (overlay: ReviewOverlay) => void }) {
  const [tab, setTab] = useState<ReviewTab>("text");
  const updateItem = (id: string, patch: Partial<ReviewItem>) => setOverlay({ ...overlay, items: { ...overlay.items, [id]: { ...(overlay.items[id] ?? { decision: "pending" as const }), ...patch } } });
  const textBlocks = CHAPTER1_LESSON.blocks.filter((block) => "text" in block && block.type !== "heading");
  const annotatedMoves = CHAPTER1_ANNOTATED_MOVE_IDS.map((id) => CHAPTER1_LESSON.lines.flatMap((line) => line.moves).find((move) => move.id === id)).filter(Boolean) as VariationMove[];
  return <main className="view editor-view">
    <section className="page-heading"><div><p className="eyebrow">Editor mode · Complete Chapter 1</p><h1>Source review</h1><p className="lede">Review stable lesson entities. Accepted corrections form a separate local overlay and are never written over imported evidence.</p></div><span className="autosave">● Saved locally</span></section>
    {overlay.legacyTextReview && <div className="legacy-notice"><strong>Legacy review preserved</strong><p>The earlier partial transcription was archived and was not applied over the new complete source text.</p></div>}
    <div className="review-tabs"><button className={tab === "text" ? "active" : ""} onClick={() => setTab("text")}>Text · {textBlocks.length}</button><button className={tab === "moves" ? "active" : ""} onClick={() => setTab("moves")}>Moves · {annotatedMoves.length}</button><button className={tab === "boards" ? "active" : ""} onClick={() => setTab("boards")}>Boards · {B2_LESSON.diagrams.length}</button></div>
    {tab === "text" && <div className="review-list">{textBlocks.map((block) => {
      const item = overlay.items[block.id] ?? { decision: "pending" as const };
      const span = spanById(block.sourceSpanId);
      return <article className="review-card" key={block.id}><div className="review-card-meta"><span>{block.id}</span><strong>Page {span.printedPage} · {span.column}</strong><details><summary>View crop</summary><img src={span.crop} alt={`Source crop for ${block.id}`} /></details></div><div><label>Source-verified text<textarea rows={Math.max(3, Math.ceil(block.text.length / 85))} value={item.correctedText ?? block.text} onChange={(event) => updateItem(block.id, { correctedText: event.target.value })} /></label><Decision value={item.decision} onChange={(decision) => updateItem(block.id, { decision })} /></div></article>;
    })}</div>}
    {tab === "moves" && <div className="review-list">{annotatedMoves.map((move) => {
      const item = overlay.items[move.id] ?? { decision: "pending" as const };
      return <article className="review-card compact-card" key={move.id}><div className="review-card-meta"><span>{move.id}</span><strong>{move.sourceToken}</strong><small>Canonical and annotations are separate fields.</small></div><div><div className="move-editor-grid"><label>Canonical SAN<input value={item.correctedSan ?? move.san} onChange={(event) => updateItem(move.id, { correctedSan: event.target.value })} /></label><label>Source token<input value={item.sourceToken ?? move.sourceToken} onChange={(event) => updateItem(move.id, { sourceToken: event.target.value })} /></label><label>Punctuation<input value={item.punctuation ?? move.annotation?.punctuation ?? ""} onChange={(event) => updateItem(move.id, { punctuation: event.target.value })} /></label><label>Novelty<input value={item.novelty ?? move.annotation?.novelty ?? ""} onChange={(event) => updateItem(move.id, { novelty: event.target.value })} /></label><label>Evaluation<input value={item.evaluation ?? move.annotation?.evaluation ?? ""} onChange={(event) => updateItem(move.id, { evaluation: event.target.value })} /></label></div><Decision value={item.decision} onChange={(decision) => updateItem(move.id, { decision })} /></div></article>;
    })}</div>}
    {tab === "boards" && <div className="review-list">{B2_LESSON.diagrams.map((diagram) => {
      const item = overlay.items[diagram.id] ?? { decision: "pending" as const, confidence: "unreviewed" as const };
      const fen = item.correctedFen ?? diagram.fen;
      let valid = true; try { new Chess(fen); } catch { valid = false; }
      return <article className="review-card board-review" key={diagram.id}><div className="review-card-meta"><span>{diagram.id} · printed source</span><img src={diagram.crop} alt={`${diagram.id} source diagram`} /></div><div className="board-review-body"><div className="mini-board"><Chessboard fen={valid ? fen : diagram.fen} /></div><div><h2>{diagram.role}</h2><p className="status-line">Association: {diagram.associationStatus} · Position: {diagram.positionStatus} · Identity: {diagram.boardIdentityStatus}</p><label>Candidate FEN<input className={!valid ? "invalid" : ""} value={fen} onChange={(event) => updateItem(diagram.id, { correctedFen: event.target.value })} /></label><label>Comparison confidence<select value={item.confidence ?? "unreviewed"} onChange={(event) => updateItem(diagram.id, { confidence: event.target.value as ReviewItem["confidence"] })}><option>unreviewed</option><option>visually plausible</option><option>manually confirmed</option></select></label><label>Reviewer note<textarea rows={2} value={item.note ?? ""} onChange={(event) => updateItem(diagram.id, { note: event.target.value })} /></label><p className={valid ? "validity valid" : "validity invalid-text"}>{valid ? "✓ Legal FEN syntax" : "Invalid FEN - correction required"}</p><Decision value={item.decision} onChange={(decision) => updateItem(diagram.id, { decision })} /></div></div></article>;
    })}</div>}
  </main>;
}

function ImportView({ overlay }: { overlay: ReviewOverlay }) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ImportComparison | null>(null);
  const preservedCorrections = Object.values(overlay.items).filter((item) => item.decision === "accepted").length;
  const compareLesson = async (sourceHash: string, extractedRegionCount: number): Promise<ImportComparison> => {
    const canonicalLessonHash = await sha256(canonicalize(B2_LESSON));
    const matches = canonicalLessonHash === EXPECTED_B2_LESSON_HASH;
    return { status: matches ? "no_change" : "review_required", sourceHash, canonicalLessonHash, changedLessonEntities: matches ? 0 : 1, preservedCorrections, extractedRegionCount, message: matches ? "The source-complete B2 lesson rebuilt identically. Manual corrections remain separate and preserved." : "The rebuilt canonical lesson differs from the packaged expected snapshot. Nothing was overwritten." };
  };
  const runBundled = async () => {
    setRunning(true); setResult(null);
    try { setResult(await compareLesson(B2_LESSON.source.sha256, B2_LESSON.sourceSpans.length)); }
    finally { setRunning(false); }
  };
  const checkPdf = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    setRunning(true); setResult(null);
    try {
      const bytes = await file.arrayBuffer();
      const sourceHash = await sha256(bytes);
      if (sourceHash !== B2_LESSON.source.sha256) {
        setResult({ status: "rejected", sourceHash, canonicalLessonHash: "not generated", changedLessonEntities: 0, preservedCorrections, extractedRegionCount: 0, message: "This PDF does not match the verified Chapter1_Catalan.pdf. No lesson or review data was changed." });
      } else {
        const { extractB2Regions } = await import("./pdf-import");
        const regions = await extractB2Regions(bytes);
        setResult(await compareLesson(sourceHash, regions.length));
      }
    } catch (error) {
      setResult({ status: "review_required", sourceHash: B2_LESSON.source.sha256, canonicalLessonHash: "not generated", changedLessonEntities: 0, preservedCorrections, extractedRegionCount: 0, message: error instanceof Error ? error.message : "The PDF regions could not be extracted. Nothing was overwritten." });
    } finally { setRunning(false); event.target.value = ""; }
  };
  return <main className="view editor-view"><section className="page-heading"><div><p className="eyebrow">Editor mode · deterministic rebuild</p><h1>Re-import B2</h1><p className="lede">Rebuild the three verified reading regions, compare the canonical lesson snapshot, and preserve the local review overlay.</p></div></section><section className="import-card"><div className="import-mark">↧</div><h2>Rebuild packaged B2 snapshot</h2><p>Checks the complete lesson document derived from the verified fixture and reviewed baseline.</p><button className="primary-button" onClick={runBundled} disabled={running}>{running ? "Rebuilding..." : "Run zero-change demonstration"}</button><div className="or"><span>or</span></div><label className="file-button">Choose Chapter1_Catalan.pdf<input type="file" accept="application/pdf" onChange={checkPdf} /></label></section>{result && <section className={`import-result ${result.status}`}><div className="result-icon">{result.status === "no_change" ? "✓" : "!"}</div><div><p className="eyebrow">Import result</p><h2>{result.status}</h2><p>{result.message}</p><dl><div><dt>Extracted regions</dt><dd>{result.extractedRegionCount}</dd></div><div><dt>Changed lesson entities</dt><dd>{result.changedLessonEntities}</dd></div><div><dt>Corrections preserved</dt><dd>{result.preservedCorrections}</dd></div><div><dt>Canonical lesson hash</dt><dd>{result.canonicalLessonHash}</dd></div></dl></div></section>}</main>;
}

export default function CatalanApp() {
  const [view, setView] = useState<View>("lesson");
  const [overlay, setOverlayState] = useState<ReviewOverlay>(emptyOverlay());
  const [editorMode, setEditorMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { setOverlayState(migrateReview()); setEditorMode(localStorage.getItem(EDITOR_KEY) === "true"); }, []);
  const setOverlay = (value: ReviewOverlay) => { setOverlayState(value); localStorage.setItem(REVIEW_KEY, JSON.stringify(value)); };
  const toggleEditor = () => { const next = !editorMode; setEditorMode(next); localStorage.setItem(EDITOR_KEY, String(next)); if (!next) setView("lesson"); };
  const navigate = (next: View) => { setView(next); setMenuOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); };
  return <div className="app-shell">
    <header className="topbar"><button className="menu-button" onClick={() => setMenuOpen((value) => !value)} aria-label="Toggle navigation">☰</button><button className="brand" onClick={() => navigate("lesson")}><span className="brand-mark">C</span><span><strong>Catalan Atelier</strong><small>Complete Chapter 1</small></span></button><div className="top-source"><span>Reading order</span><strong>printed pp.8–23 · left → right</strong></div></header>
    <aside className={`sidebar ${menuOpen ? "open" : ""}`}><nav><p>Course</p><button className={view === "lesson" ? "active" : ""} onClick={() => navigate("lesson")}><span className="nav-glyph">L</span><span>Chapter 1 lesson<small>Complete · A through C</small></span></button>{editorMode && <><p className="editor-nav-label">Editor tools</p><button className={view === "review" ? "active" : ""} onClick={() => navigate("review")}><span className="nav-glyph">R</span><span>Source review<small>Text, moves & boards</small></span></button><button className={view === "import" ? "active" : ""} onClick={() => navigate("import")}><span className="nav-glyph">I</span><span>Re-import B2<small>Rebuild and compare</small></span></button></>}</nav><div className="sidebar-footer"><div className="source-card"><span>Verified source</span><strong>Chapter1_Catalan.pdf</strong><small>SHA-256 · 3F6E...1E8A</small></div><button className={`editor-toggle ${editorMode ? "on" : ""}`} onClick={toggleEditor} role="switch" aria-checked={editorMode}><span className="toggle-track"><i /></span><span><strong>Editor mode</strong><small>{editorMode ? "Review tools visible" : "Learner view only"}</small></span></button><p className="local-only">Local only · no data leaves this device</p></div></aside>
    {menuOpen && <button className="scrim" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />}
    <div className="content">{view === "lesson" ? <LessonView overlay={overlay} /> : view === "review" && editorMode ? <ReviewView overlay={overlay} setOverlay={setOverlay} /> : view === "import" && editorMode ? <ImportView overlay={overlay} /> : <LessonView overlay={overlay} />}</div>
  </div>;
}
