# Repository Style Guide

This document defines the single source of truth for code and comment style across this repository. It complements (not replaces) Docs/Engineering/CodeStandards.md which covers runtime safety patterns and engineering practices.

Tools and versions (detected from repo)

- ESLint: ^8.57.0
- Prettier: ^3.6.2
- Languages: ExtendScript (.jsx – ES3/ES5 for Adobe InDesign), JavaScript (.js for UXP), Markdown (.md), JSON

Formatting (enforced by Prettier and .editorconfig)

- Indent: 4 spaces (JSON: 2 spaces)
- Max line width: 120
- Quotes: double quotes in JSX/JS (Prettier singleQuote=false)
- Semicolons: required
- Trailing commas: none
- End of line: LF; files end with a newline
- Tabs: do not use tabs (spaces only)

Linting

- ESLint runs on Scripts/\*_/_.jsx with ExtendScript-specific globals and ES3 parser options. Do not introduce modern Node or browser globals in JSX.
- UXP JavaScript (.js) follows modern rules under UXP/; avoid browser/Node globals unless declared.
- Fix all ESLint errors before submitting; address warnings where practical.

File headers (first lines in each script/module)
Include a concise header at the top of files with:

- Module name and purpose (1–2 lines)
- Public API (top-level entry points / exported functions)
- Dependencies (shared modules, runtime assumptions)
- Short example usage

Example header (ExtendScript)
/_
Module: UnusedStylesManager.jsx
Purpose: Find and delete unused paragraph/character/object/table/cell styles.
Public API: entry point is main(); uses Scripts/Shared/_ utilities.
Dependencies: InDesignUtils.jsx, FindChangeUtils.jsx, ScopeUtils.jsx, UIUtils.jsx
Namespaces: InDesignUtils, FindChange, UIUtils, ScopeUtils
Usage: Place under Scripts Panel and run. Requires an open document.
\*/

Function docblocks

- One-line summary followed by parameter and return annotations.
- Use JSDoc-style tags when helpful (types are indicative only for reference).

/\*\*

- Delete unused styles from the current document.
- @param {Document} doc InDesign document
- @returns {number} Number of removed styles
  \*/

Inline comments

- Explain why, not what; keep under ~100 characters.
- Use sentence case; avoid trailing personal notes.

TODO/FIXME format

- TODO(USER|TICKET): actionable message
- Example: TODO(#123): Replace ad-hoc parsing with ScopeUtils.parse

Engineering safety patterns (must follow; see CodeStandards.md)

- Single undo step for entry points: app.doScript(..., UndoModes.ENTIRE_SCRIPT, "<Meaningful Undo Name>")
- Always restore global preferences in finally blocks (measurement units, redraw state, etc.)
- Reset find/change preferences before and after usage: app.findTextPreferences = app.changeTextPreferences = NothingEnum.nothing;
- Validate object specifiers; guard selection-dependent logic.
- Explicitly set/restore measurement units; minimize redraw during heavy operations.

Naming and structure

- Prefer early returns; avoid magic numbers.
- Clear, descriptive names (verbs for functions, nouns for values).
- Shared/common utilities reside in Scripts/Shared/; entry-point scripts live in category folders (Export, Utilities, Cleanup).

Markdown and docs

- Use sentence case headings and concise sections.
- Keep examples current with code; update when behavior changes.

Maintenance and guardrails

- Run formatting before commit: npm run format
- Run linting: npm run lint
- CI: .github/workflows/style.yml enforces `npm run lint` and `npm run format:check` on pushes and PRs.
- Quick commands:
    - Check formatting: npm run format:check
    - Fix formatting: npm run format
    - Lint: npm run lint

Compatibility

- Use only APIs available in targeted InDesign versions and UXP runtime; avoid deprecated namespaces. When in doubt, mirror patterns from Scripts/Shared/\*.

Scope of this guide

- This guide governs code & comment style across all languages used in this repo. For runtime safety and performance, always follow Docs/Engineering/CodeStandards.md.
