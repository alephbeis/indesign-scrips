# ObjectPreflight

Frames off their Object Style X/Y — with Reverse Check.

Status: Active
Location: Scripts/Cleanup/ObjectPreflight.jsx

Overview
- Scans all text frames in the active document (pages only; pasteboard and master items are ignored).
- Evaluates page-relative X/Y position against what the applied Object Style enforces on that page.
- Two modes:
  - Check mismatches: Lists frames whose current page-relative X/Y differs from the style-enforced position beyond a small tolerance.
  - Find styles without X/Y (Reverse): Lists frames whose applied Object Style does not enforce an absolute X/Y for that page. Fix buttons are disabled in this mode.
- Scope optimization: Only pages in the document’s last section are considered (if no sections exist, all pages are considered the last section).

UI and Controls
- Dialog title: "Frames off their Object Style X/Y"
- Mode dropdown: "Check mismatches" | "Find styles without X/Y"
- List columns: Page | Style | dX / dY
  - In mismatches mode, dX/dY show the delta (in points, 2 decimals) from current position to the expected style-defined position.
  - In reverse mode, dX/dY display "—" because no expected position is enforced.
- Navigation buttons (top-right):
  - Go To: Selects the frame and navigates to its page.
  - Go To Next: Selects the next row and navigates to its item.
- Action buttons (bottom-right):
  - Close
  - Fix: Moves the selected frame(s) so their top-left anchor matches the style-enforced X/Y for the page.
  - Fix and Next: Fixes the selected frame, then selects and navigates to the next row.
  - Fix All: Attempts to fix all listed frames.
  - Note: All Fix buttons are disabled in Reverse mode.

Behavior and Safety
- Single undo step wraps the entire run for easy revert.
- Measurement units are temporarily normalized to points and restored afterward.
- Locked items and layers are temporarily unlocked to perform safe moves, then restored to their prior lock state.
- Pasteboard items are skipped. Master page items are excluded by design.
- Tolerance: 0.5 pt to avoid flagging negligible deltas.

Limitations
- Only text frames are scanned. Extend as needed if your workflow requires other page items.
- Operates only on the last section’s pages to align with typical production flows. Create a final section to focus the check if needed.

Tips
- You can multi-select rows to fix several frames at once.
- If nothing is fixed, verify there are no other constraints (overrides, protection) preventing the move.

Change Log
- 2025-08-25: Introduced Reverse Check mode in documentation; clarified last-section scope and master-page exclusion.
