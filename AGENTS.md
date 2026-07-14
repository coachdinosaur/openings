# Repository instructions

For any request to add, rebuild, finish, or validate a Catalan PDF chapter, use the project skill at `.agents/skills/add-catalan-chapter/SKILL.md` and follow every completion gate. If the requested work needs an unpublished chapter, add the next sequential chapter package only when its complete lesson, versioned manifest, evidence assets, canonical hash, exact-PDF verification, tests, and visual checks pass. Never add chapter-specific navigation or route files; publish a chapter package and regenerate the catalog.

Treat any root `ChapterN_Catalan.pdf` without a matching published package as staged source input. Staged PDFs must remain hidden from the app until every publication gate passes. Use `npm run chapters:status` from `app/` to inspect the current catalog and `npm run chapters:check` for full verification instead of hard-coding chapter state here.
