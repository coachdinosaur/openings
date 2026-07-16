# Catalan Atelier app

A read-only chess opening reader for Catalan B2 vertical variations. Chapters are authored as Markdown files in `app/content/chapters/` and discovered at build time via Vite's `import.meta.glob`. Each chapter includes annotated pages, FEN positions, and interactive chessboards with Stockfish analysis.

## Development

```powershell
npm install
npm run dev
```

## Verification

```powershell
npm test
```

Runs chapter system checks, TypeScript typecheck, Stockfish client tests, and chapter parser unit tests.

## Chapter management

- Add a new chapter: create `app/content/chapters/chapter-N-catalan.md` and regenerate the catalog
- `npm run chapters:status` — list all published chapters
- `npm run chapters:check` — full validation of all Markdown chapters (page count, FEN blocks, structure)
- See `.agents/skills/add-catalan-chapter/SKILL.md` for the publication workflow
