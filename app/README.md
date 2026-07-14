# Catalan Atelier app

This is the local web application used by the root `start-local.ps1` launcher. It serves the dynamically generated published chapter catalog, legal interactive lesson entries, chapter-specific review overlays, and deterministic source-verification checks.

For development with Node.js 22 or newer:

```powershell
npm install
npm run dev
```

Production verification:

```powershell
npm test
```

Chapter publication is controlled by `app/chapter-packages/chapter-N.ts` files paired with versioned manifests under `app/chapter-manifests/`. See the repository-level `AGENTS.md` and `.agents/skills/add-catalan-chapter/SKILL.md` before adding a chapter. `npm run chapters:status` reports the catalog quickly; `npm run chapters:check` performs the complete PDF, lesson, evidence, import-region, and generated-catalog verification.
