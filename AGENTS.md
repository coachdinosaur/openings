# Repository instructions

For any request to add, rebuild, finish, or validate a Catalan chapter, use the project skill at `.agents/skills/add-catalan-chapter/SKILL.md` and follow every completion gate. Chapters are authored as Markdown files in `app/app/content/chapters/chapter-N-catalan.md` with `## Page N` boundaries and FEN code blocks. Never add chapter-specific navigation or route files; add a Markdown chapter and regenerate the catalog.

Use `npm run chapters:status` from `app/` to inspect the current catalog and `npm run chapters:check` for full verification instead of hard-coding chapter state here.
