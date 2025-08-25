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
2) Read the AI agent instructions overview
   - Location: Docs/AI-Agent-Instructions.md
   - Explains scope, required practices, and links to standards.
3) Run the linter and fix reported issues
   - First-time setup: `npm ci`
   - Lint command: `npm run lint`
   - All lint errors must be resolved before submitting. Do not disable rules to bypass issues; update code to comply.
   - Aim to address warnings where practical.
4) Ensure UI changes conform to UX conventions
   - For any dialogs, panels, or alerts: mirror existing labels, layout, default actions, and keyboard shortcuts used in this repo.
5) Keep changes minimal and focused
   - Modify only what is necessary to satisfy the issue. Preserve existing behavior unless explicitly required to change.
6) Sanity-check behavior manually when applicable
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
