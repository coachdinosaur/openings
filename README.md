# Catalan interactive lessons

Catalan Atelier is a Markdown-first chess reader. All published lesson content lives in:

```text
app/app/content/chapters/chapter-N-catalan.md
```

The app renders authored prose and FEN diagrams directly, resolves legal move notation with `chess.js`, and lets the reader click a move and traverse that variation with the board controls. Manual board moves, board flipping, keyboard navigation, and lazy-loaded Stockfish analysis remain available in every chapter.

PDF files and extracted images may be kept or attached as optional accuracy references. They are not application inputs, build dependencies, or content-conversion steps.

## Run locally

From PowerShell:

```powershell
.\start-local.ps1
```

Or from `app/`:

```powershell
npm install
npm run dev
```

## Chapter workflow

To add the next chapter, create `app/app/content/chapters/chapter-N-catalan.md` with:

- one `#` title;
- contiguous `## Page N` boundaries;
- the complete authored prose and printed move notation;
- visible `**FEN:**` code blocks for diagrams;
- optional `<!-- FEN: ... -->` branch anchors where an embedded variation needs a distinct root.

Then run:

```powershell
cd app
npm run chapters:status
npm run chapters:sync
npm run chapters:check
npm test
npm run lint
```

The catalog and shared route expose new contiguous chapters automatically. Do not add chapter-specific routes, manifests, lesson TypeScript, packages, review/import screens, or PDF conversion code.
