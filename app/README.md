# Catalan Atelier app

This is the local web application used by the root `start-local.ps1` launcher. It contains guided Chapters 1-3, legal interactive section entries, chapter-specific review overlays, and deterministic PDF re-import checks.

For development with Node.js 22 or newer:

```powershell
npm install
npm run dev
```

Production verification:

```powershell
npm test
```

Chapter publication is controlled by `app/chapter-packages/chapter-N.ts` files and the generated registry. See the repository-level `AGENTS.md` and `.agents/skills/add-catalan-chapter/SKILL.md` before adding a chapter. `npm run chapters:check` reports published and staged chapters without exposing unfinished work.
