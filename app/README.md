# Catalan Atelier app

A Markdown-first chess opening reader. Chapters are authored in `app/content/chapters/` and rendered with legal move navigation, FEN diagrams, an exploratory board, and optional Stockfish analysis.

PDFs may be used outside the app as transcription references. The runtime does not parse or convert them.

## Development

```powershell
npm install
npm run dev
```

## Chapter management

```powershell
npm run chapters:status
npm run chapters:audit -- --chapter N --markdown app/content/chapters/chapter-N-catalan.md --expected-pages P --expected-diagrams D --strict-moves
npm run chapters:sync
npm run chapters:check
```

Add one contiguous chapter by creating `app/content/chapters/chapter-N-catalan.md`. Visually confirm its PDF page and diagram totals, make every genuine analysis sequence navigable, and pass the read-only audit before catalog sync. Never add a chapter-specific route or navigation entry.

## Verification

```powershell
npm test
npm run lint
```
