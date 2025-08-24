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
  - Use an 8px grid for layout. Typical values: dialog margins 16 px; panel margins 12 px (half-step); vertical spacing 8–12 px; align children left. Half-sizes (4 px) may be used when finer spacing is needed.
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

## Confirmation Dialogs

- Default policy: avoid adding an extra “Are you sure?” confirmation step before running actions.
    - Prefer a clear, descriptive primary action label (e.g., “Run Cleanup”, “Delete Unused Styles”), show impact in the dialog itself, and rely on a single undo step via `app.doScript(..., UndoModes.ENTIRE_SCRIPT, ...)`.
    - Offer safer alternatives when needed: Preview, Dry‑run/Report‑only.
    - Add a confirmation only for truly destructive and hard‑to‑recover operations (e.g., permanent deletions with no undo path, cross‑document bulk deletes, irreversible data loss).

## Dialogs

Directive (summary):
- Build a single main utility dialog that contains Options and Scope with a clear, descriptive primary action (e.g., “Run Cleanup”, “Delete Unused Styles”).
- Do not add a post-click “Are you sure?” confirmation. Prefer safer in-dialog alternatives: Preview, Dry‑run/Report‑only, or an explicit checkbox like “I understand this will delete X”. See “Confirmation Dialogs” above for narrow exceptions.

Use InDesign dialogs (ScriptUI modal windows or `app.dialogs`) instead of system dialogs (`alert`/`confirm`/`prompt`) to keep visual consistency and proper keyboard roles.
- Why this is preferred:
  - Visual consistency with the rest of the script UI and InDesign themes.
  - Clear default/cancel roles and keyboard handling (Enter/Esc) within one dialog flow.
  - Multi-line messages and layout control without truncation.
  - Easier localization and reuse of shared strings.
- Acceptable exceptions:
  - Critical, one-off error states where the script must stop immediately and no parent dialog exists.
  - Very simple post-run notifications where a full dialog would be excessive.

Preferred pattern: Main utility dialog (ScriptUI)

```jsx
// Main dialog pattern (no extra confirmation). Includes Options, Scope, and Dry‑run.
var win = new Window('dialog', 'Delete Unused Styles');
win.orientation = 'column';
win.margins = 16;
win.spacing = 12;

// Options panel
var optionsPanel = win.add('panel', undefined, 'Options');
optionsPanel.orientation = 'column';
optionsPanel.margins = 12;
optionsPanel.spacing = 8;
var chkDryRun = optionsPanel.add('checkbox', undefined, 'Dry run (report only)');
chkDryRun.value = true; // safer default

// Scope panel (placeholder; integrate your shared scope chooser here)
var scopePanel = win.add('panel', undefined, 'Scope');
scopePanel.orientation = 'column';
scopePanel.margins = 12;
scopePanel.add('statictext', undefined, 'Document (active)'); // example default

// Footer buttons
var row = win.add('group');
row.alignment = 'right';
row.spacing = 8;
var btnCancel = row.add('button', undefined, 'Cancel', { name: 'cancel' });
var btnRun = row.add('button', undefined, 'Delete Unused Styles', { name: 'ok' });

win.defaultElement = btnRun;
win.cancelElement = btnCancel;

var result = win.show(); // 1 = OK, 2 = Cancel
if (result !== 1) { /* user canceled */ }

var dryRun = chkDryRun.value;
// Proceed with resolved scope and options; wrap work in app.doScript(..., UndoModes.ENTIRE_SCRIPT, ...)
```

When a confirmation is justified (destructive actions only)

```jsx
// Only show a confirmation when the action is truly destructive and not easily undoable.
var win = new Window('dialog', 'Confirm deletion');
win.orientation = 'column';
win.margins = 16;
win.spacing = 12;

// Warning message
var msg = win.add('statictext', undefined, 'Delete 12 styles across 5 documents? This cannot be undone.');
msg.characters = 60;

var row = win.add('group');
row.alignment = 'right';
row.spacing = 8;
var btnCancel = row.add('button', undefined, 'Cancel', { name: 'cancel' });
var btnOk = row.add('button', undefined, 'Delete 12 styles', { name: 'ok' }); // explicit, descriptive label

win.defaultElement = btnOk;
win.cancelElement = btnCancel;

var result = win.show(); // 1 = OK, 2 = Cancel
if (result !== 1) { /* user canceled */ }
```

Pattern (classic `app.dialogs`)

```jsx
var dlg = app.dialogs.add({ name: 'Confirm deletion' });
with (dlg.dialogColumns.add()) {
  staticTexts.add({ staticLabel: 'Delete 12 styles across 5 documents? This cannot be undone.' });
}
var ok = dlg.show(); // true if OK, false if Cancel
dlg.destroy();
if (!ok) { /* user canceled */ }
```

Do not use `confirm()` or `prompt()`; avoid `alert()` for confirmations. If alerting an error, keep it concise and prefer integrating messages into the existing dialog when feasible.

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
win.spacing = 12; // 8px grid with half-step example

// Ensure sufficient size to avoid truncation
win.preferredSize = { width: 520, height: 200 }; // or: win.bounds = [0, 0, 520, 200];

var label = win.add('statictext', undefined, 'Action: Exporting current document…');
label.characters = 48; // label wide enough for long action titles

win.show();
```
