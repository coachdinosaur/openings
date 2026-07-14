# Catalan interactive lessons

Run this from PowerShell:

```powershell
.\start-local.ps1
```

The launcher starts the local-only app and opens `http://localhost:3000`. The app exposes Chapter 1 (printed pages 8–23), Chapter 2 (printed pages 24–33), and Chapter 3 (printed pages 34–50) through shared chapter routes. Each chapter follows verified source order: the full-page index first, then every body page's left column before its right column. Chapter 3 includes all 44 source diagrams.

The learner view hides builder tools. Use the **Editor mode** switch at the bottom of the sidebar to reveal chapter-specific Source Review and Re-import screens. Review decisions are saved in this browser's local storage under separate keys, so Chapter 2 review state cannot overwrite Chapter 1 decisions.

## Adding the next chapter

New source PDFs can be staged at the repository root without appearing in the app. Chapter 4 is the next expected package. Publishing is package-driven: a completed chapter package is registered once, and shared routes/navigation expose its lesson, review, and import views automatically.

Codex must follow [the project chapter skill](.agents/skills/add-catalan-chapter/SKILL.md). The deterministic commands run from `app/`:

```powershell
npm run chapters:check
npm run chapters:inspect -- --pdf ..\ChapterN_Catalan.pdf
npm run chapters:prepare -- --pdf ..\ChapterN_Catalan.pdf --printed-start <page>
npm run chapters:crops -- --input ..\tmp\pdfs\chapter-N --output ..\tmp\pdfs\chapter-N-crops --prefix CHN --expected <count>
npm run chapters:validate-lesson -- app/chapterN-lesson.ts
npm run chapters:verify-import -- app/chapterN-lesson.ts app/chapter-packages/chapter-N.ts ..\ChapterN_Catalan.pdf
npm run chapters:sync
```

`chapters:prepare` writes temporary text and rendered-page evidence under `tmp/pdfs/`; it does not publish an incomplete lesson.
