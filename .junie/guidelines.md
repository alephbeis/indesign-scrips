# Junie Project Guidelines

Purpose
- This file provides project-specific guidance for Junie (JetBrains autonomous coding agent) to ensure all generated code aligns with this repository’s standards and workflows.

Pre-submit checklist
1) Read and follow the Engineering Code Standards
   - Location: Docs/Engineering/CodeStandards.md
   - Key patterns to apply:
     - Single undo step for entry points; always restore global prefs in `finally`.
     - Reset find/change preferences before and after usage.
     - Validate object specifiers and check `.isValid`.
     - Explicitly set and restore measurement units.
     - Prefer early returns, avoid magic numbers, use clear naming.
2) Run the linter and fix reported issues
   - First-time setup: `npm ci`
   - Lint command: `npm run lint`
   - All lint errors must be resolved before submitting. Do not disable rules to bypass issues; update code to comply.
   - Aim to address warnings where practical.
3) Ensure UI changes conform to UX conventions
   - For any dialogs, panels, or alerts: mirror existing labels, layout, default actions, and keyboard shortcuts used in this repo.
4) Keep changes minimal and focused
   - Modify only what is necessary to satisfy the issue. Preserve existing behavior unless explicitly required to change.
5) Sanity-check behavior manually when applicable
   - If the change affects runtime behavior, perform a quick manual verification to catch regressions.

Repository pointers
- Lint configuration: .eslintrc.json
- Lint script: package.json → scripts.lint = eslint "Scripts/**/*.jsx"
- Primary standards: Docs/Engineering/CodeStandards.md
- Additional guidance: Docs/AI-Agent-Instructions.md

Notes for Junie
- Produce minimal diffs and avoid unnecessary refactors.
- Prefer safe patterns detailed in the engineering standards (undo, prefs restore, try/catch/finally, minimize redraw, batch operations).
- If uncertain about a UI or pattern, copy an established pattern from existing scripts in this repository.

---

AI Agents Pre-Submit Checklist (Detailed)
Use this as a final gate before submitting any change.

A) Linting & Formatting
- Run `npm ci` (first time) and `npm run lint`. Ensure there are 0 lint errors.
- Run `npm run format` to apply Prettier formatting to all files before submitting.
- Address warnings where practical. Do not disable rules to bypass issues.
- Ensure files end with a newline, no trailing spaces, and spacing aligns with project standards.
- Prettier configuration enforces consistent formatting - all code must pass `npm run format:check`.

B) UI/UX Compliance
- Dialog type: Use InDesign dialogs (not system dialogs) unless absolutely necessary.
- Progress windows: Keep an appropriate width; only increase height when additional text output requires it.
- Pre-action confirmations: Do not prompt unless necessary (e.g., destructive/bulk actions). Keep confirmations concise.
- Conventions: Mirror existing labels, layout, default buttons/actions, and keyboard shortcuts used in this repo.
- Avoid unnecessary UI during long operations; compute first, then apply (keep UI responsive).

C) Safety & Global Preferences
- Single undo step: Wrap entry points in `app.doScript(..., UndoModes.ENTIRE_SCRIPT, "<Meaningful Undo Name>")`.
- Always restore global preferences in `finally` (measurement units, redraw state, ruler/zero point if modified).
- Reset find/change preferences before and after usage: `app.findTextPreferences = app.changeTextPreferences = NothingEnum.nothing;`.
- Validate object specifiers and check `.isValid` before operating on them; guard selection-dependent logic.

D) Performance
- Minimize redraw during heavy operations and restore it afterward.
- Batch operations and limit scope (e.g., `everyItem().getElements()`, narrow find/change ranges).
- Avoid repeatedly touching the layout; work in memory where possible.

E) Error Handling & Logging
- Use try/catch/finally around I/O and any code that changes global prefs.
- Provide user-safe error messages (include context like document name/page when helpful).
- Keep debug logging behind a flag; remove noisy logs before submitting.

F) Compatibility & Documentation
- Confirm APIs used are supported in targeted InDesign versions; avoid deprecated patterns.
- If you modified runtime behavior, perform a quick manual verification.
- Update or add usage docs if behavior changes materially.

G) Temporary File Management
- Use `.wip` directory: Place all temporary files in the `.wip` directory at the project root to keep them organized and easily identifiable.
- Create subfolders for file sets: If creating a whole set of temporary documents or files, create a subfolder within `.wip` to keep it clean and organized.
- Clean up after completion: Remove temporary files when tasks are complete, or document their retention policy clearly.
- Avoid repository root: Never place temporary files directly in the project root or other non-designated locations.
- See `Docs/Engineering/CodeStandards.md` section "Temporary File Management" for complete details and examples.
