export type Status = "source-verified" | "deterministically derived" | "proposed" | "unresolved";

export type SourceSpan = {
  id: string;
  status: Status;
  pageIndex: number;
  printedPage: number;
  column: "left" | "right" | "full";
  order: number;
  crop: string;
  bbox: { x0: number; top: number; x1: number; bottom: number };
};

export type MoveAnnotation = {
  punctuation?: string;
  novelty?: string;
  evaluation?: string;
};

export type VariationMove = {
  id: string;
  san: string;
  sourceToken: string;
  annotation?: MoveAnnotation;
  sourceSpanId: string;
};

export type VariationNode = {
  id: string;
  label: string;
  parentLineId: string | null;
  parentPly: number;
  /** Independent source lines may begin from a position before their first move. */
  startFen?: string;
  startLabel?: string;
  moves: VariationMove[];
};

export type MoveReference = {
  source: string;
  lineId: string;
  moveIndex: number;
  /** The token is preserved and clickable, but its exact source position still needs review. */
  unresolved?: boolean;
};

type LessonBlockBase = {
  id: string;
  status: Status;
  sourceSpanId: string;
};

export type LessonBlock = LessonBlockBase & (
  | { type: "heading"; text: string; moveRefs?: MoveReference[] }
  | { type: "prose" | "assessment"; text: string; moveRefs?: MoveReference[] }
  | { type: "move-sequence"; text: string; moveRefs: MoveReference[] }
  | { type: "variation"; title: string; text: string; lineId: string; moveRefs: MoveReference[]; diagramId?: string }
  | { type: "diagram"; diagramId: string }
);

export type DiagramLink = {
  id: string;
  associationStatus: Status;
  positionStatus: Status;
  boardIdentityStatus: Status;
  sourceSpanId: string;
  crop: string;
  role: string;
  lineId: string | null;
  moveIndex: number | null;
  fen: string;
};

export type LessonDocument = {
  schemaVersion: 2;
  lessonId: string;
  status: Status;
  title: string;
  subtitle: string;
  source: { documentId: string; filename: string; sha256: string };
  basePosition: { status: Status; after: string; fen: string; moves: string[] };
  sourceSpans: SourceSpan[];
  lines: VariationNode[];
  diagrams: DiagramLink[];
  blocks: LessonBlock[];
};

export type ReviewItem = {
  decision: "pending" | "accepted" | "needs correction";
  correctedText?: string;
  correctedSan?: string;
  sourceToken?: string;
  punctuation?: string;
  novelty?: string;
  evaluation?: string;
  correctedFen?: string;
  confidence?: "unreviewed" | "visually plausible" | "manually confirmed";
  note?: string;
};

export type ReviewOverlay = {
  schemaVersion: 2;
  fixtureSha256: string;
  items: Record<string, ReviewItem>;
  legacyTextReview?: { transcription: string; decision: string };
};

export type ImportComparison = {
  status: "no_change" | "review_required" | "rejected";
  sourceHash: string;
  canonicalLessonHash: string;
  changedLessonEntities: number;
  preservedCorrections: number;
  extractedRegionCount: number;
  message: string;
};
