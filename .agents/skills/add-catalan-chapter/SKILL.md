---
name: add-catalan-chapter
description: Add, rebuild, or validate a succeeding ChapterN_Catalan.pdf lesson in the Catalan Atelier app. Use whenever a new chapter PDF is staged, a chapter must be published, chapter source assets or lesson data are being created, or chapter routing/navigation/import/review parity must be checked.
---

# Add a Catalan chapter

Preserve the Markdown-first app pattern by treating each chapter as one verified source document. Do not add one-off routes, navigation links, lesson TypeScript, manifests, packages, review/import screens, or runtime PDF conversion.

1. Read [the chapter contract](references/chapter-contract.md), then run `npm run chapters:status` from `app/`. A new chapter must be the next contiguous number.
2. Keep the supplied root Markdown and PDF immutable. Render and visually inspect the PDF, confirm its page count and printed-page flow, and count every source diagram by eye. Detector output and staged FEN counts are supporting evidence only.
3. Copy the root Markdown to `app/app/content/chapters/chapter-N-catalan.md`. Normalize it to exactly one `#` title, contiguous `## Page N` boundaries beginning at 1, source-faithful `###` or deeper headings, regular-space indentation, and visible `**FEN:**` blocks for PDF diagrams. Preserve prose, punctuation, chess annotations, paragraph order, and diagram placement.
4. Add `<!-- FEN: ... -->` anchors only where a legal variation needs a distinct root. Derive every anchor with `chess.js`; never guess a position or alter printed move notation merely to make it resolve.
5. Run the non-mutating audit before publication:

   `npm run chapters:audit -- --chapter N --markdown app/content/chapters/chapter-N-catalan.md --expected-pages P --expected-diagrams D --strict-moves`

   Resolve every flagged genuine analysis-sequence token. Human-review isolated move references, prose squares, and cross-chapter references rather than treating them as complete analysis lines.
6. Add exact page/diagram assertions and navigation regressions for the chapter's main, sibling, nested, and conclusion branches. Run `npm run chapters:sync` only after the Markdown passes focused checks.
7. Complete `npm run chapters:check`, `npm test`, and `npm run lint`. Inspect `/chapters/N` at desktop and narrow widths, including every page, diagrams, page controls, sidebar navigation, critical move clicks, and previous/next traversal.

Publish chapters one at a time. Do not publish a partial chapter or placeholder, do not modify earlier lesson content merely to make a new chapter pass, and leave any later staged PDF unpublished until its complete Markdown is available.
