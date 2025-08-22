# Dialog UI/UX Conventions

This guide defines dialog layout and UX conventions used across our InDesign scripts. It consolidates the UI guidance into the Engineering docs for clarity and discoverability.

## Dialog UX Conventions (Scripts UI)

To ensure consistency across utilities, use these general conventions while allowing dialog-specific flexibility:

- One combined dialog per script entry point.
  - Options and Scope must both appear in the main dialog.
  - Scope choices: All Documents, Document (active), Story (from selection), Page (active), Selection.
  - Default scope must be Document (active).
- Layout patterns:
  - Stacked (column): Options panel on top, Scope panel below — recommended for dialogs with many or complex options (e.g., CharacterCleanup).
  - Side-by-side (row): Options panel on the left and Scope panel on the right — recommended for compact dialogs with short option lists (e.g., RemoveNumericPrefixes, DeleteHebrewMarks).
  - Dialog margins ~16 px; panel margins ~12 px; vertical spacing ~6–10 px; align children left.
- Bottom action buttons:
  - Right-aligned, ordered: "Cancel" then "Run" as the primary action (default button role `{ name: 'ok' }` when applicable).
  - Additional buttons are allowed when they are primary actions essential to the flow (e.g., Back, Preview, Close for informational dialogs). Avoid using the footer as a general area for secondary/tertiary actions; place such controls within the dialog body.
- Behavior guidelines:
  - Validate that at least one option is selected when applicable.
  - Resolve scope into explicit targets before running.
  - Wrap processing in a single undo step using `app.doScript(..., UndoModes.ENTIRE_SCRIPT, ...)`.
  - Reset Find/Change preferences before and after operations.

Notes:
- Secondary informational dialogs (e.g., read-only reports) may use different primary actions (e.g., Close), while main utility dialogs typically use Cancel/Run.
- Avoid scope-only dialogs; integrate scope into the main dialog.

## Progress Windows (Run-time Feedback)

- During long-running operations, show a small progress window to provide feedback and (when applicable) an abort option.
- Size: ensure the window is large enough to display full action titles without truncation.
- Recommended minimum size: 520 px width and add 200px height if there is more vertical content. This has proven sufficient to show typical action titles.
- Larger sizes are fine; avoid going smaller to prevent text truncation.

Implementation notes (ScriptUI / ExtendScript):
- Set the window size explicitly.
- Make the status label wide enough using the `characters` property to accommodate long titles.

Example:

```jsx
var win = new Window('palette', 'Working…');
win.orientation = 'column';
win.margins = 16;
win.spacing = 10;

// Ensure sufficient size to avoid truncation
win.preferredSize = { width: 520, height: 200 }; // or: win.bounds = [0, 0, 520, 200];

var label = win.add('statictext', undefined, 'Action: Exporting current document…');
label.characters = 48; // label wide enough for long action titles

win.show();
```
