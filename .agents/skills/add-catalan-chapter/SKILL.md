---
name: add-catalan-chapter
description: Add, rebuild, or validate a succeeding ChapterN_Catalan.pdf lesson in the Catalan Atelier app. Use whenever a new chapter PDF is staged, a chapter must be published, chapter source assets or lesson data are being created, or chapter routing/navigation/import/review parity must be checked.
---

# Add a Catalan chapter

Preserve the current app pattern by treating a chapter as one verified package. Do not add one-off routes or navigation links.

1. Run `npm run chapters:check` from `app/`. Stop and fix registry/package drift first.
2. Run `npm run chapters:inspect -- --pdf ..\ChapterN_Catalan.pdf`. Confirm the filename, sequential chapter number, page count, and source hash.
3. Determine the first printed page from the source/TOC. Never infer it only from PDF page indices. Then run `npm run chapters:prepare -- --pdf ..\ChapterN_Catalan.pdf --printed-start P`.
4. Extract the source diagrams with `npm run chapters:crops -- --input ..\tmp\pdfs\chapter-N --output ..\tmp\pdfs\chapter-N-crops --prefix CHN --expected COUNT`. Treat the expected count as a source audit: visually inspect every crop and resolve misses or extras before authoring.
5. Read every extracted page text and visually inspect every PNG under `tmp/pdfs/chapter-N/`. Follow full-page content first, then each body page's left column before its right column. Read [the chapter contract](references/chapter-contract.md) before authoring.
6. Implement the complete `app/app/chapterN-lesson.ts`, source page images/crops, and `app/app/chapter-packages/chapter-N.ts`. Keep canonical SAN separate from printed annotations and derive legal FENs with `chess.js`. Run `npm run chapters:validate-lesson -- app/chapterN-lesson.ts` repeatedly while transcribing; it reports the first illegal source ply and the canonical lesson hash.
7. Freeze the reported canonical hash in `app/app/canonical.ts`, reference it from the package, then run `npm run chapters:sync`. The generated registry supplies navigation and all shared routes; do not edit it.
8. Run `npm run chapters:verify-import -- app/chapterN-lesson.ts app/chapter-packages/chapter-N.ts ..\ChapterN_Catalan.pdf`, then `npm run chapters:check`, `npm test`, and `npm run lint`. Inspect `/chapters/N`, `/chapters/N/review`, and `/chapters/N/import` at desktop and narrow widths.

Do not publish a partial chapter or placeholder package. A staged PDF is allowed to remain unpublished until all contract gates pass. Do not modify earlier lesson content merely to make a new chapter pass.
