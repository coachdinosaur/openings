# Catalan Vertical Prototype - Milestone 1

This directory contains only the approved fixture-and-provenance gate for the
Catalan B2 prototype. It does not contain an extraction pipeline, database,
application server, frontend, notation parser, variation reconstructor,
diagram recognizer, chessboard component, or generated lesson.

The fixture preserves four and only four classification values:

- `source-verified`
- `deterministically derived`
- `proposed`
- `unresolved`

The source PDF is identified by filename and SHA-256. Chess Study resources are
identified by repository URL, commit, repository-relative path, byte length,
and SHA-256. Nothing in this directory depends at runtime on a local Chess Study
checkout.

Run the milestone checks from the workspace root with:

```powershell
py -m unittest discover -s milestone1/tests -v
```

To additionally compare every copied byte against a local source checkout, set
the generic `SOURCE_ASSET_REPO` environment variable for the test process.
