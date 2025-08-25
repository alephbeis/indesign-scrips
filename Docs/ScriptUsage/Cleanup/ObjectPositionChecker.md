# ObjectPositionChecker

Checks text frames whose applied Object Style enforces an absolute page-relative position (X/Y) and lists frames that deviate from that position, with tools to navigate and fix them.

Status: Active
Location: Scripts/Cleanup/ObjectPositionChecker.jsx

Overview
- Scans all text frames in the active document.
- For each frame, determines whether its applied Object Style enforces a specific page-relative X/Y position on that page.
- Lists frames whose current position differs from the expected style-defined position beyond a small tolerance.
- Provides quick navigation to each frame and safe fix actions.

UI and Controls
- List columns: Page | Style | dX / dY
  - dX/dY reflect the delta between the current position and the style-defined expected position (in points), rounded to 2 decimals.
- Buttons
  - Left: Close, Go To
  - Right: Fix, Fix and Next, Fix All

Actions
- Go To: Selects the frame and navigates to its page.
- Fix: Moves the selected frame(s) so their top-left anchor matches the style-defined X/Y for that page.
- Fix and Next: Fixes the selected frame, selects the next row, and navigates to it.
- Fix All: Attempts to fix all listed frames.

Behavior and Safety
- Spread-safe, page-relative evaluation ensures correct comparison across spreads.
- Locked items/layers: The script temporarily unlocks a locked item or its layer (if needed) to perform the move, then restores the lock state.
- Pasteboard items are ignored.
- Tolerance: A small tolerance (default 0.5 pt) is used to avoid listing negligible deltas.

Engineering Notes
- Single undo step: the main run is wrapped in a single undo step for easy revert.
- Measurement units: temporarily normalizes to points and restores afterward.
- Dialogs: Uses InDesign ScriptUI dialogs (no system alerts or pre-action confirmations).
- The script uses early returns and validates object specifiers (`.isValid`) where applicable.
- Temporary objects created to verify style behavior are removed in a `finally` block.

Change Log
- 2025-08-24: Removed "Export CSV" feature and its button to simplify the UI and reduce maintenance. The list remains fully navigable and fixable within the dialog.

Limitations
- Only text frames are scanned (by design). Extend as needed for other page items if your workflow requires it.

Tips
- Select multiple rows to fix several frames at once.
- If nothing is fixed, ensure the items/layers are not protected by other constraints (e.g., master page overrides, locked states outside of what the script handles).
