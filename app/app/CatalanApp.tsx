"use client";

import { MouseEvent, useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Chess, type Square } from "chess.js";
import { useRouter } from "next/navigation";
import { Chessboard } from "./components/Chessboard";
import { MarkdownRenderer } from "./components/MarkdownRenderer";
import LessonLoading from "./LessonLoading";
import type { MarkdownChapter } from "./lib/markdown-chapter";
import { extractFenBlocks } from "./lib/markdown-chapter";
import type { AnalysisUpdate, EnginePhase, EngineScore, StockfishClient, StockfishEvent } from "./stockfish-client";

const CHAPTER_NAVIGATION_PAINT_DELAY_MS = 120;

function scoreToWhiteFraction(score: EngineScore | null): number | null {
  if (!score) return null;
  if (score.kind === "mate") return score.whiteValue > 0 ? 0.98 : score.whiteValue < 0 ? 0.02 : 0.5;
  return Math.min(0.94, Math.max(0.06, 0.5 + score.whiteValue / 1200));
}

function EvaluationRail({ score, flipped }: { score: EngineScore | null; flipped: boolean }) {
  const whiteFraction = scoreToWhiteFraction(score);
  const whitePercent = (whiteFraction ?? 0.5) * 100;
  const blackPercent = 100 - whitePercent;
  const segments = flipped
    ? [{ side: "white" as const, height: whitePercent }, { side: "black" as const, height: blackPercent }]
    : [{ side: "black" as const, height: blackPercent }, { side: "white" as const, height: whitePercent }];
  return <div className="evaluation-rail" role="img" aria-label={score ? "Engine evaluation" : "Neutral engine evaluation, equal split"} data-orientation={flipped ? "flipped" : "normal"}>
    <div className="evaluation-segments" aria-hidden="true">{segments.map((segment) => <div key={segment.side} className={`evaluation-segment ${segment.side}`} style={{ height: `${segment.height}%` }} />)}</div>
  </div>;
}

const INITIAL_ENGINE_PHASE: EnginePhase = "uninitialized";

function ChapterReader({ chapter }: { chapter: MarkdownChapter }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [enginePhase, setEnginePhase] = useState<EnginePhase>(INITIAL_ENGINE_PHASE);
  const [engineAnalysis, setEngineAnalysis] = useState<AnalysisUpdate | null>(null);
  const [engineError, setEngineError] = useState<string | null>(null);
  const [analysisRequested, setAnalysisRequested] = useState(false);
  const engineClientRef = useRef<StockfishClient | null>(null);
  const engineClientLoadRef = useRef<Promise<StockfishClient> | null>(null);
  const engineUnsubscribeRef = useRef<(() => void) | null>(null);
  const mountedRef = useRef(true);
  const currentFenRef = useRef<string | null>(null);
  const analysisRequestedRef = useRef(false);
  const expectedSearchIdRef = useRef<number | null>(null);
  const analysisRequestTokenRef = useRef(0);
  const enginePhaseRef = useRef<EnginePhase>(INITIAL_ENGINE_PHASE);

  const page = chapter.pages[currentPage];
  const fens = useMemo(() => page ? extractFenBlocks(page.markdown).map((b) => b.fen) : [], [page]);
  const activeFen = fens.length > 0 ? fens[0] : null;
  const chess = useMemo(() => {
    if (!activeFen) return null;
    try { return new Chess(activeFen); } catch { return null; }
  }, [activeFen]);

  const totalPages = chapter.pages.length;
  const hasPrev = currentPage > 0;
  const hasNext = currentPage < totalPages - 1;

  const goToPage = useCallback((pageNum: number) => {
    if (pageNum >= 0 && pageNum < totalPages) {
      setEngineAnalysis(null);
      setCurrentPage(pageNum);
    }
  }, [totalPages]);

  const applyAnalysisMove = useCallback((input: { from: string; to: string; promotion?: string }) => {
    if (!activeFen) return;
    try {
      const c = new Chess(activeFen);
      c.move({ from: input.from as Square, to: input.to as Square, promotion: input.promotion });
    } catch {}
  }, [activeFen]);


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
    }).catch((error) => {
      if (!mountedRef.current) return;
      analysisRequestedRef.current = false;
      expectedSearchIdRef.current = null;
      analysisRequestTokenRef.current += 1;
      enginePhaseRef.current = "error";
      setAnalysisRequested(false);
      setEnginePhase("error");
      setEngineAnalysis(null);
      setEngineError(error instanceof Error ? error.message : "Stockfish could not analyze this position.");
    });
  }, []);

  const toggleAnalysis = async () => {
    if (enginePhase === "loading" || enginePhase === "stopping" || enginePhase === "restarting" || enginePhase === "error") return;
    if (analysisRequestedRef.current || enginePhase === "searching") {
      analysisRequestedRef.current = false;
      analysisRequestTokenRef.current += 1;
      setAnalysisRequested(false);
      if (engineClientRef.current) void engineClientRef.current.stop().catch(() => {});
      return;
    }
    if (!activeFen) return;
    analysisRequestedRef.current = true;
    enginePhaseRef.current = "loading";
    setAnalysisRequested(true);
    setEnginePhase("loading");
    setEngineAnalysis(null);
    setEngineError(null);
    try {
      const client = await ensureEngineClient();
      if (!mountedRef.current || !analysisRequestedRef.current) return;
      requestAnalysis(client, activeFen);
    } catch (error) {
      if (!mountedRef.current) return;
      analysisRequestedRef.current = false;
      expectedSearchIdRef.current = null;
      analysisRequestTokenRef.current += 1;
      enginePhaseRef.current = "error";
      setAnalysisRequested(false);
      setEnginePhase("error");
      setEngineAnalysis(null);
      setEngineError(error instanceof Error ? error.message : "Stockfish could not analyze this position.");
    }
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;
      if (event.key === "ArrowRight") setCurrentPage((p) => Math.min(totalPages - 1, p + 1));
      if (event.key === "ArrowLeft") setCurrentPage((p) => Math.max(0, p - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [totalPages]);

  useEffect(() => {
    mountedRef.current = true;
    currentFenRef.current = activeFen;
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
  }, [currentPage, activeFen]);

  useEffect(() => {
    if (analysisRequestedRef.current && engineClientRef.current && activeFen) {
      requestAnalysis(engineClientRef.current, activeFen);
    } else {
      expectedSearchIdRef.current = null;
    }
  }, [activeFen, requestAnalysis]);

  const visibleAnalysis = engineAnalysis?.fen === activeFen ? engineAnalysis : null;
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
    <h1 className="sr-only">{chapter.title}</h1>
    <section className="guided-layout">
      <aside className="sticky-board">
        <div className="analysis-pv" aria-label="Stockfish principal variation"><span className="analysis-pv-output">{pvOutput}</span></div>
        <div className="board-frame primary-board-frame"><div className="board-analysis-row">
          <EvaluationRail score={visibleAnalysis?.score ?? null} flipped={flipped} />
          <div className="primary-board">{activeFen && <Chessboard fen={activeFen} flipped={flipped} onMove={chess ? applyAnalysisMove : undefined} />}</div>
        </div></div>
        <div className="board-controls" aria-label="Chessboard controls">
          <div className="board-action-controls">
            <button className="analysis-button" onClick={toggleAnalysis} aria-label={enginePhase === "searching" ? "Stop Stockfish analysis" : "Analyze current position with Stockfish"} aria-pressed={analysisRequested} disabled={analysisTransition || enginePhase === "error"}>{analysisButtonLabel}</button>
            <button className="flip-button" onClick={() => setFlipped((value) => !value)} aria-label="Flip board">↻ Flip</button>
          </div>
          {engineError && <p className="analysis-error" role="alert">{engineError}</p>}
        </div>
        <div className="page-info-sticky">Page {currentPage + 1} of {totalPages} · {fens.length} FEN position{fens.length !== 1 ? "s" : ""}</div>
      </aside>
      <div className="markdown-page-container">
        <div className="page-nav-top">
          <button disabled={!hasPrev} onClick={() => goToPage(currentPage - 1)} aria-label="Previous page">‹ Previous</button>
          <span>Page {currentPage + 1} of {totalPages}</span>
          <button disabled={!hasNext} onClick={() => goToPage(currentPage + 1)} aria-label="Next page">Next ›</button>
        </div>
        {page && <MarkdownRenderer markdown={page.markdown} />}
        <div className="page-nav-bottom">
          <button disabled={!hasPrev} onClick={() => goToPage(currentPage - 1)} aria-label="Previous page">‹ Previous page</button>
          <button disabled={!hasNext} onClick={() => goToPage(currentPage + 1)} aria-label="Next page">Next page ›</button>
        </div>
      </div>
    </section>
  </main>;
}

export default function CatalanApp({ chapter, chapters, chapterId }: { chapter: MarkdownChapter; chapters: { id: string; label: string }[]; chapterId: string }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chapterTarget, setChapterTarget] = useState<{ id: string; label: string }>();
  const [, startChapterTransition] = useTransition();

  const navigateChapter = (event: MouseEvent<HTMLAnchorElement>, target: { id: string; label: string }) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || target.id === chapterId) return;
    event.preventDefault();
    setMenuOpen(false);
    setChapterTarget(target);
    window.setTimeout(() => startChapterTransition(() => router.push(`/chapters/${target.id}`)), CHAPTER_NAVIGATION_PAINT_DELAY_MS);
  };

  return <div className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
    <header className="topbar">
      <button className="sidebar-toggle desktop-sidebar-toggle" onClick={() => setSidebarCollapsed((value) => !value)} aria-label={sidebarCollapsed ? "Show navigation" : "Hide navigation"} aria-expanded={!sidebarCollapsed} aria-controls="course-sidebar">☰</button>
      <button className="sidebar-toggle menu-button" onClick={() => setMenuOpen((value) => !value)} aria-label="Toggle navigation" aria-expanded={menuOpen} aria-controls="course-sidebar">☰</button>
      <button className="brand" onClick={() => router.push("/")}>
        <span className="brand-mark">C</span>
        <span><strong>Catalan Atelier</strong><small>{chapter.title}</small></span>
      </button>
    </header>
    <aside id="course-sidebar" className={`sidebar ${menuOpen ? "open" : ""}`}>
      <nav>
        <p>Course</p>
        {chapters.map((ch) => (
          <a className={`course-link ${ch.id === chapterId ? "active" : ""}`} href={`/chapters/${ch.id}`} onClick={(event) => navigateChapter(event, ch)} key={ch.id}>
            <span className="nav-glyph">{ch.id.replace("chapter-", "ch")}</span>
            <span>{ch.label}</span>
          </a>
        ))}
      </nav>
    </aside>
    {menuOpen && <button className="scrim" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />}
    <div className="content">
      <ChapterReader chapter={chapter} />
    </div>
    {chapterTarget && chapterTarget.id !== chapterId && <LessonLoading label={`Loading ${chapterTarget.label}…`} overlay />}
  </div>;
}
