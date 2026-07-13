# Catalan interactive lessons

Run this from PowerShell:

```powershell
.\start-local.ps1
```

The launcher starts the local-only app and opens `http://localhost:3000`. The app now exposes Chapter 1 (printed pages 8–23) and Chapter 2 (printed pages 24–33) as separate chapter routes. Chapter 2 follows the verified source order—printed page 24's full-page index, then each body page's left column before its right column—and includes all 25 source diagrams.

The learner view hides builder tools. Use the **Editor mode** switch at the bottom of the sidebar to reveal chapter-specific Source Review and Re-import screens. Review decisions are saved in this browser's local storage under separate keys, so Chapter 2 review state cannot overwrite Chapter 1 decisions.
