import { Chess } from "chess.js";
import { fenMoveNumberKey, indexChessMoves, isLikelyProseSquare, moveNumberKey, moveNumberMatchesFen, normalizeSan, resolveChessMove, SOURCE_MOVE_TOKEN, type ResolvedChessMove } from "./chess-notation";

export type NavigationStep = { fen: string; label: string };
export type MoveNavigation = { steps: NavigationStep[]; index: number };
export type MarkdownMoveToken = { display: string; index: number; navigation: MoveNavigation | null };

type PositionPath = { fen: string; steps: NavigationStep[] };
type RootMoveCandidate = { before: PositionPath; move: ResolvedChessMove };

const START_FEN = new Chess().fen();

function uniqueCandidates(candidates: PositionPath[]): PositionPath[] {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    if (seen.has(candidate.fen)) return false;
    seen.add(candidate.fen);
    return true;
  });
}

function pathExtends(steps: NavigationStep[], prefix: NavigationStep[]): boolean {
  if (steps.length <= prefix.length) return false;
  return prefix.every((step, index) => step.fen === steps[index]?.fen && step.label === steps[index]?.label);
}

function parenDepthAt(text: string, pos: number): number {
  let depth = 0;
  for (let index = 0; index < pos; index++) {
    if (text[index] === "(") depth++;
    else if (text[index] === ")") depth = Math.max(0, depth - 1);
  }
  return depth;
}

export class MarkdownMoveResolver {
  private active: PositionPath;
  private history: PositionPath[];
  private historyByMove: Map<string, PositionPath[]>;
  private knownRootFens: Set<string>;
  private knownMoveIndex: Map<string, RootMoveCandidate[]>;
  private moveCache: Map<string, ReturnType<typeof resolveChessMove>>;
  private navigations: MoveNavigation[];

  constructor(fen = START_FEN, label = "Initial position") {
    const root = { fen, steps: [{ fen, label }] };
    this.active = root;
    this.history = [];
    this.historyByMove = new Map();
    this.knownRootFens = new Set();
    this.knownMoveIndex = new Map();
    this.moveCache = new Map();
    this.navigations = [];
    this.indexRoot(root);
    this.resetHistory(root);
  }

  addRoot(fen: string, label = "Known chapter position"): void {
    new Chess(fen);
    const root = { fen, steps: [{ fen, label }] };
    this.indexRoot(root);
  }

  setAnchor(fen: string, label = "Diagram position"): MoveNavigation {
    new Chess(fen);
    const root = { fen, steps: [{ fen, label }] };
    this.indexRoot(root);
    this.active = root;
    this.resetHistory(root);
    return { steps: root.steps, index: 0 };
  }

  private indexRoot(root: PositionPath): void {
    if (this.knownRootFens.has(root.fen)) return;
    this.knownRootFens.add(root.fen);
    const aliases = new Map<string, ResolvedChessMove[]>();
    for (const move of indexChessMoves(root.fen)) {
      for (const alias of move.aliases) {
        const candidates = aliases.get(alias) ?? [];
        candidates.push(move);
        aliases.set(alias, candidates);
      }
    }
    const moveKey = fenMoveNumberKey(root.fen);
    for (const [alias, moves] of aliases) {
      if (moves.length !== 1) continue;
      const key = `${moveKey}\u0000${alias}`;
      const candidates = this.knownMoveIndex.get(key) ?? [];
      candidates.push({ before: root, move: moves[0] });
      this.knownMoveIndex.set(key, candidates);
    }
  }

  private resetHistory(root: PositionPath): void {
    this.history = [];
    this.historyByMove = new Map();
    this.remember(root);
    if (root.fen !== START_FEN) {
      this.remember({ fen: START_FEN, steps: [{ fen: START_FEN, label: "Initial position" }] });
    }
  }

  private remember(path: PositionPath): void {
    if (!this.history.some((candidate) => candidate.fen === path.fen)) this.history.push(path);
    const key = fenMoveNumberKey(path.fen);
    const candidates = this.historyByMove.get(key) ?? [];
    if (!candidates.some((candidate) => candidate.fen === path.fen)) {
      candidates.push(path);
      this.historyByMove.set(key, candidates);
    }
  }

  private resolveFrom(fen: string, display: string): ReturnType<typeof resolveChessMove> {
    const key = `${fen}\u0000${display}`;
    if (this.moveCache.has(key)) return this.moveCache.get(key) ?? null;
    const move = resolveChessMove(fen, display);
    this.moveCache.set(key, move);
    return move;
  }

  private createNavigation(path: PositionPath): MoveNavigation {
    for (const navigation of this.navigations) {
      if (pathExtends(path.steps, navigation.steps)) navigation.steps = path.steps;
    }
    const navigation = { steps: path.steps, index: path.steps.length - 1 };
    this.navigations.push(navigation);
    return navigation;
  }

  currentNavigation(): MoveNavigation {
    return { steps: this.active.steps, index: this.active.steps.length - 1 };
  }

  resolveText(text: string): MarkdownMoveToken[] {
    const tokens: MarkdownMoveToken[] = [];
    let active = this.active;
    let lastBefore = active;
    let depth = 0;
    const returnStates: PositionPath[] = [];

    for (const match of text.matchAll(SOURCE_MOVE_TOKEN)) {
      const at = match.index ?? 0;
      const nextDepth = parenDepthAt(text, at);
      while (nextDepth > depth) {
        returnStates.push(active);
        active = lastBefore;
        depth++;
      }
      while (nextDepth < depth) {
        active = returnStates.pop() ?? active;
        depth--;
      }

      const display = match[0].trim();
      if (!display || isLikelyProseSquare(text, at, display)) continue;

      const numberedKey = moveNumberKey(display);
      // A parenthetical variation has one explicit branch point. Searching old
      // history from inside it can attach a later move to the main line when
      // the variation's first move is invalid or anchored incorrectly.
      const indexedHistory = numberedKey && depth === 0 ? [...(this.historyByMove.get(numberedKey) ?? [])].reverse() : [];
      const candidates = uniqueCandidates([active, ...indexedHistory]);
      let resolved: PositionPath | null = null;
      let before: PositionPath | null = null;
      const legalCandidates: Array<{ before: PositionPath; resolved: PositionPath }> = [];
      for (const candidate of candidates) {
        if (!moveNumberMatchesFen(display, candidate.fen)) continue;
        const move = this.resolveFrom(candidate.fen, display);
        if (!move) continue;
        legalCandidates.push({ before: candidate, resolved: {
          fen: move.fen,
          steps: [...candidate.steps, { fen: move.fen, label: display }],
        } });
      }
      if (numberedKey && depth === 0) {
        const rootCandidates = this.knownMoveIndex.get(`${numberedKey}\u0000${normalizeSan(display)}`) ?? [];
        for (const candidate of rootCandidates) {
          legalCandidates.push({
            before: candidate.before,
            resolved: {
              fen: candidate.move.fen,
              steps: [...candidate.before.steps, { fen: candidate.move.fen, label: display }],
            },
          });
        }
      }

      const activeMatch = legalCandidates.find((candidate) => candidate.before.fen === active.fen);
      if (activeMatch) {
        ({ before, resolved } = activeMatch);
      } else {
        const distinct = legalCandidates.filter((candidate, index, all) => all.findIndex((other) => other.before.fen === candidate.before.fen) === index);
        if (distinct.length === 1) ({ before, resolved } = distinct[0]);
      }

      if (resolved && before) {
        lastBefore = before;
        active = resolved;
        this.remember(resolved);
        tokens.push({ display, index: at, navigation: this.createNavigation(resolved) });
      } else {
        tokens.push({ display, index: at, navigation: null });
      }
    }

    while (depth > 0) {
      active = returnStates.pop() ?? active;
      depth--;
    }
    this.active = active;
    return tokens;
  }
}
