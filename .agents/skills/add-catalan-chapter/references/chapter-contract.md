# Catalan chapter contract

## Required artifacts

- Immutable root references: `ChapterN_Catalan.md` and `ChapterN_Catalan.pdf`.
- Published lesson: `app/app/content/chapters/chapter-N-catalan.md`.
- Generated catalog: `app/app/chapter-catalog.generated.ts`, produced only by `npm run chapters:sync`.
- Temporary PDF renders and contact sheets under ignored `tmp/pdfs/` for visual auditing only.

PDFs are reference evidence, not application inputs or build dependencies. The shared `/chapters/[chapterId]` route, catalog, renderer, board, and navigation must publish the chapter automatically from its Markdown.

## Markdown shape

- Exactly one level-one chapter title.
- One contiguous `## Page N` boundary for every PDF page, starting at 1.
- Source headings represented by `###` through `#####` according to their visible hierarchy.
- Source-faithful prose, punctuation, evaluations, novelty marks, paragraph breaks, and move notation.
- One visible `**FEN:**` block for every PDF diagram and no extra visible diagrams.
- Optional hidden `<!-- FEN: ... -->` anchors only for legal variation roots that are not visible PDF diagrams.
- No non-breaking spaces, conversion notes, placeholder content, or chapter-specific application code.

## Source and navigation fidelity

- Account for every PDF page and diagram and preserve the PDF reading stream.
- Compare every rendered FEN board with its source diagram; derive any new anchor from legal moves with `chess.js`.
- Preserve printed SAN and annotations while resolving their canonical legal moves internally.
- Make every legally reconstructable analysis sequence navigable. Isolated prose squares and cross-chapter references are human-reviewed separately.
- Keep sibling variations isolated, child variations rooted in their parent line, and conclusion recaps navigable from the correct position.

## Completion gates

A chapter is publishable only when all are true:

1. The immutable root Markdown and PDF remain unchanged during conversion.
2. The strict chapter audit passes with the visually confirmed page and diagram totals.
3. Page hierarchy, paragraph spacing, prose, moves, and diagrams match the PDF page by page.
4. Every FEN is valid and every genuine analysis-sequence move is legally navigable.
5. Exact diagram-count and critical branch regression tests pass.
6. `chapters:sync`, `chapters:check`, typecheck, build, tests, and lint pass.
7. `/chapters/N` renders through the shared route, navigation includes it automatically, and invalid/later chapter IDs still return 404.
8. Desktop and narrow-width checks show no clipping, overlap, broken boards, missing assets, out-of-order content, or unusable controls.

Publish one complete chapter at a time and stop at the requested approval checkpoint before starting the next staged chapter.
