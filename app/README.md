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
npm run chapters:sync
npm run chapters:check
```

Add a chapter by creating `app/content/chapters/chapter-N-catalan.md`; never add a chapter-specific route or navigation entry.

## Verification

```powershell
npm test
npm run lint
```
