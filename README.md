# Catalan interactive lessons

Run this from PowerShell:

```powershell
.\start-local.ps1
```

The launcher starts the local-only app and opens `http://localhost:3000`. Published chapters are discovered from verified chapter packages and exposed through shared routes. Run `npm run chapters:status` from `app/` for the current catalog and next staged chapter. Each chapter follows verified source order: the full-page index first, then every body page's left column before its right column.

The learner view hides builder tools. Use the **Editor mode** switch at the bottom of the sidebar to reveal chapter-specific Source Review and Re-import screens. Review decisions are saved in this browser's local storage under separate keys, so Chapter 2 review state cannot overwrite Chapter 1 decisions.

## Adding the next chapter

The chapter system supports adding succeeding chapters when a request needs them. It discovers published packages and the next expected chapter dynamically; run `npm run chapters:check` from `app/` to see the current state. New `ChapterN_Catalan.pdf` files can be staged at the repository root without appearing in the app.

Publishing is package-driven and strictly sequential. A staged PDF remains hidden until its complete lesson, versioned manifest, page and diagram evidence, package, canonical hash, exact-PDF verification, tests, lint, and desktop/narrow visual checks all pass. For Chapter 6 onward, the manifest must use `publicationProfile: "authored"`, and a complete lesson means the same authored structure used by Chapters 1-5: named legal variation lines, readable variation blocks for every source region, meaningful diagram roles, and diagrams derived from legal move paths. Extraction output, generic summaries, or independently recognised board positions are authoring evidence only and cannot be published. `npm run chapters:sync` imports and fully verifies every package before atomically regenerating the lightweight catalog and server loaders; the shared routes and navigation then expose the lesson, review, and source-verification views automatically. Do not create chapter-specific routes or navigation entries.

Codex must follow [the project chapter skill](.agents/skills/add-catalan-chapter/SKILL.md). The normal workflow uses two resumable commands from `app/`:

```powershell
npm run chapters:start -- --pdf ..\ChapterN_Catalan.pdf --printed-start <page> --expected-crops <count>
# Author the complete app/chapterN-lesson.ts from the generated context and contact sheet.
npm run chapters:publish -- --chapter N --default-line <line-id> --default-ply <ply>
```

`chapters:start` performs the baseline check once, prepares or reuses rendered evidence, extracts the audited board count, and writes one de-duplicated `authoring-context.md`, one crop contact sheet, and a generated manifest draft under `tmp/pdfs/`. It deliberately never generates a learner lesson. Rerunning it with unchanged input reuses the expensive work.

`chapters:publish` promotes the prepared evidence, creates the standard package and manifest when absent, freezes generated hashes, verifies the exact PDF, regenerates the catalog, and runs the full test and lint gates with concise output. It only accepts the authored lesson already in `app/app/chapterN-lesson.ts`; it never synthesizes one from extraction output. It restores the prior catalog and removes only artifacts it generated if a gate fails. Low-level `chapters:inspect`, `chapters:prepare`, `chapters:crops`, `chapters:validate-lesson`, `chapters:verify`, `chapters:verify-import`, and `chapters:sync` commands remain available for diagnosis rather than normal publication.

For multiple PDFs, repeat the same three preparation arguments in chapter order:

```powershell
npm run chapters:start -- `
  --pdf ..\Chapter6_Catalan.pdf --printed-start 73 --expected-crops 43 `
  --pdf ..\Chapter7_Catalan.pdf --printed-start 87 --expected-crops 73

# After authoring both lessons:
npm run chapters:publish -- `
  --pdf ..\Chapter6_Catalan.pdf --default-line ch6-opening --default-ply 10 `
  --pdf ..\Chapter7_Catalan.pdf --default-line ch7-opening --default-ply 10
```

The same commands therefore handle either one PDF or many PDFs directly. All PDFs must remain at the repository root and form a contiguous sequence. A publication command always starts with the next unpublished chapter, even when it contains only one item.

For a reusable queue, the repeated arguments can instead be stored in a batch definition:

```json
{
  "chapters": [
    { "chapter": 6, "printedStart": 73, "expectedCrops": 43, "defaultLine": "ch6-opening", "defaultPly": 10 },
    { "chapter": 7, "printedStart": 87, "expectedCrops": 73, "defaultLine": "ch7-opening", "defaultPly": 10 }
  ]
}
```

```powershell
npm run chapters:start -- --batch ..\chapter-batch.json
# Author each generated app/chapterN-lesson.ts.
npm run chapters:publish -- --batch ..\chapter-batch.json
```

Direct multi-PDF input and batch-file input have identical behavior: preparation performs the baseline verification once and leaves completed workspaces resumable if a later extraction fails. Publication preflights every lesson and exact PDF before one catalog sync and one global test/build/lint run. Any publication failure rolls the entire set back.

If one source PDF contains several consecutive chapters, add complete `pageStart` and `pageEnd` ranges to that same batch definition, then register the immutable source split before preparing it:

```json
{
  "chapters": [
    { "chapter": 6, "pageStart": 1, "pageEnd": 14, "printedStart": 73, "expectedCrops": 43 },
    { "chapter": 7, "pageStart": 15, "pageEnd": 39, "printedStart": 87, "expectedCrops": 73 },
    { "chapter": 8, "pageStart": 40, "pageEnd": 53, "printedStart": 112, "expectedCrops": 37 }
  ]
}
```

```powershell
npm run chapters:bundle -- --pdf ..\Chapter678_Catalan.pdf --batch ..\chapter-batch.json
npm run chapters:start -- --batch ..\chapter-batch.json
```

`chapters:bundle` splits only into staged `ChapterN_Catalan.pdf` inputs and records the combined PDF hash, page ranges, and derived hashes in a source-bundle manifest. It does not create lessons, packages, navigation, or published catalog entries.

The first printed page and expected crop count must still come from source inspection, not guesses. After automated publication passes, inspect `/chapters/N`, `/chapters/N/review`, and `/chapters/N/import` at desktop and narrow widths. The `/import` URL is retained for compatibility; its UI performs verification and never reconstructs lesson content.
