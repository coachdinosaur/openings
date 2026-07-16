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

Chapter publication is controlled by `app/chapter-packages/chapter-N.ts` files paired with versioned manifests under `app/chapter-manifests/`. See the repository-level `AGENTS.md` and `.agents/skills/add-catalan-chapter/SKILL.md` before adding a chapter. Use `npm run chapters:start` to create compact, resumable authoring workspaces and `npm run chapters:publish` to run all automated publication gates once. Both accept one `--pdf`, repeated `--pdf` arguments, or a reusable `--batch <file>`. `npm run chapters:bundle` first splits one combined source PDF into verified staged chapter inputs when needed. Multiple chapters are cataloged and globally tested once, with whole-set rollback. From Chapter 6 onward, the authored publication profile requires legal variation lines, one meaningful variation block per source region, and diagrams deterministically derived from those lines. Extraction and recognition output remain evidence for authoring, never publishable lesson content. The lower-level commands remain available for diagnosis. `npm run chapters:status` reports the catalog quickly; `npm run chapters:check` performs the complete PDF, lesson, evidence, import-region, and generated-catalog verification.
