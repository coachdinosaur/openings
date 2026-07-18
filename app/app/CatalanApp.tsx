"use client";

import { MouseEvent, useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Chess } from "chess.js";
import { useRouter } from "next/navigation";
import LessonLoading from "./LessonLoading";
import { Chessboard } from "./components/Chessboard";
import { MarkdownChapterView } from "./components/MarkdownRenderer";
import { playAnalysisMove } from "./board-analysis";
import type { AnalysisMove, BoardMoveInput } from "./board-analysis";
import { extractFenBlocks, type ChapterSummary, type Markdown