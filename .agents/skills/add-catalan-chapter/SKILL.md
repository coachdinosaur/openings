---
name: add-catalan-chapter
description: Add, rebuild, or validate a succeeding ChapterN_Catalan.pdf lesson in the Catalan Atelier app. Use whenever a new chapter PDF is staged, a chapter must be published, chapter source assets or lesson data are being created, or chapter routing/navigation/import/review parity must be checked.
---

# Add a Catalan chapter

Preserve the current app pattern by treating a chapter as one verified package. Do not add one-off routes or navigation links.

1. Run `npm run chapters:status` from `app/`. Confirm that staged root PDFs form one contiguous sequence beginning with the next chapter.
2. Determine each chapter's first printed page and visually audit each diagram count from the source. Never infer either from PDF indices or detector output alone.
3. If one PDF contains several consecutive chapters, first use `npm run chapters:bundle -- --pdf ..\Chapter678_Catalan.pdf --batch ..\chapter-batch.json`, where every batch entry declares contiguous `pageStart` and `pageEnd` values. Otherwise run `npm run chapters:start -- --pdf ..\ChapterN_Catalan.pdf --printed-start P --expected-crops COUNT`. For several PDFs, repeat all three arguments in chapter order in the same command. A reusable `--batch ..\chapter-batch.json` is also supported. Baseline verification runs once, and unchanged workspaces are reused.
4. Read each generated `authoring-context.md` in order and visually inspect its rendered pages plus crop contact sheet. Read [the chapter contract](references/chapter-contract.md) before authoring.
5. Implement only the complete `app/app/chapterN-lesson.ts` for every staged chapter, matching the authored shape of Chapters 1-5: named legal variation lines, one meaningful variation block per source region, source-linked move references, descriptive diagram roles, and FENs deterministically derived from those lines. The generated manifest draft sets `publicationProfile: "authored"`; retain it. Keep canonical SAN separate from printed annotations and derive legal FENs with `chess.js`. Extraction, OCR, generic summaries, and independently recognised FENs are evidence for authoring only; they are never a publishable lesson. Use `npm run chapters:validate-lesson -- app/chapterN-lesson.ts` only for focused transcription diagnosis.
6. Publish with one or repeated `--pdf`, pairing each with `--default-line` and `--default-ply`, or use `--batch ..\chapter-batch.json`. Direct multi-PDF and batch-file modes preflight every chapter, then perform one catalog sync and one test/build/lint run. Any failure rolls back the entire set. A single `--chapter N` must still be the next sequential chapter. Do not duplicate low-level commands unless diagnosing a failure.
7. Inspect every new `/chapters/N`, `/chapters/N/review`, and `/chapters/N/import` route at desktop and narrow widths. The import URL is a compatibility route for source verification; it must not claim to reconstruct the lesson.

Do not publish a partial chapter or placeholder package. A staged PDF is allowed to remain unpublished until all contract gates pass. Do not modify earlier lesson content merely to make a new chapter pass.
