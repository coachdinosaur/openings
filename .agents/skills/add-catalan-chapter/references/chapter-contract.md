# Catalan chapter contract

## Required artifacts

- Root input: `ChapterN_Catalan.pdf` (immutable source evidence).
- Lesson: `app/app/chapterN-lesson.ts`, exporting the complete `LessonDocument`, annotated move IDs, and section list.
- Package: `app/app/chapter-packages/chapter-N.ts`, exporting `CHAPTER_CONFIG`.
- Evidence: `app/public/source/chapterN/pages/printed-PP.png` and `app/public/source/chapterN/crops/CHN-DXX.png` (or equally stable IDs declared by the lesson).
- Registry: `app/app/chapter-registry.generated.ts`, produced only by `npm run chapters:sync`.

## Package fields

Set a string `id`, `Chapter N` label, printed range, complete lesson, annotated move IDs, section anchors, legal default position, unique chapter-specific review key, and import definition. The source filename must be `ChapterN_Catalan.pdf`. Use at least one stable text anchor for every imported source region and set the expected canonical hash for the complete lesson snapshot.

## Source fidelity

- Account for every PDF page and every source diagram.
- Keep source spans contiguous and ordered from 1.
- Preserve the reading stream: full-page index/intro, then left column and right column per body page unless visual inspection proves a different layout.
- Preserve exact prose meaning, chess notation, punctuation, novelty marks, and evaluations. Store legal canonical SAN separately from the printed token.
- Link each readable move token to an existing line and move index. Mark genuinely unreadable material unresolved; do not invent it.
- Derive diagram FENs from legal move paths. Visually compare each rendered board with its crop.

## Completion gates

A chapter is publishable only when all are true:

1. The root PDF hash equals the lesson/package source hash.
2. Source spans, blocks, lines, moves, diagrams, sections, and import regions pass the shared structural validator.
3. Every move path is legal and every diagram link/FEN is valid.
   Beginning with Chapter 3, the shared validator must also reject any block that contains numbered chess notation but has no move links. Chapters 1 and 2 predate this publication gate.
4. The complete lesson canonical hash is frozen in the package.
5. `chapters:sync`, `chapters:check`, build, tests, and lint pass.
6. Learner, review, and import routes render correctly, navigation includes the chapter automatically, and the exact PDF produces a zero-change import.
7. Desktop and narrow-width visual checks show no clipping, overlap, broken boards, missing assets, or out-of-order content.

Use `chapters:validate-lesson` before publishing and retain the exact diagram count in the crop extraction command. These two gates catch the most common PDF transcription failures: chess-font glyph confusion, SAN disambiguation, diagrams that show the position before the captioned move, and an omitted or duplicated board crop.

Chapter 1 is the only legacy exception to the full-chapter expected canonical hash because its import demonstration predates this system.
