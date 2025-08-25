# Adobe InDesign Scripting — Engineering Best Practices

**Scope:** This guide codifies team standards for writing maintainable, performant scripts for the latest InDesign releases (v19–20, “InDesign 2024/2025+”). We target **modern JavaScript via UXP-powered scripting** first, while noting behaviors that also apply to classic ExtendScript where relevant.

**Current State:** This repository currently contains primarily ExtendScript (JSX) implementations with a growing UXP component. The standards below apply to both approaches, with UXP-specific patterns highlighted where they differ from ExtendScript.

---

## 1) Project Setup & Tooling

* **Use UXP scripting where possible.** InDesign ships with UXP-powered scripting (modern JS, modules, `require('indesign')`). APIs map closely to the classic DOM with some differences (globals are imported).
* **Editor & debugging:** VS Code + ESLint + Prettier. Keep a shared `.eslintrc` and `.prettierrc`.
* **TypeScript optional but recommended:** Compile to JS; enables safer DOM access in large codebases.
* **Script discovery:** Keep runnable scripts in the user/application Scripts folders; reference the location programmatically when needed (e.g., `app.scriptPreferences.scriptsFolder`).

**Repository layout**

```
indesign-scripts/
  scripts/
  shared/
    dom-helpers.ts
    error.ts
.eslintrc.cjs
.prettierrc
```

---

## 2) Code Style (Team Standard)

* **Modules & Imports**
    * UXP: `const { app, Document } = require('indesign');` (no implied globals).
* **Naming**
    * `camelCase` for variables/functions, `PascalCase` for classes, `SCREAMING_SNAKE_CASE` for constants.
* **Immutability first:** Prefer `const` and pure helpers; avoid mutating arguments.
* **No magic numbers:** Centralize measurement constants (points per inch, etc.).
* **Options objects:** For functions with >2 params, accept a single `options` object with defaults.
* **Early returns:** Guard invalid state with `if (!obj?.isValid) return;`.
* **Comments & JSDoc:** Document DOM-side effects and any preference changes you make (units, find/change).

---

## 3) Safety & Hygiene Patterns

Scripts often flip global state (units, find/change prefs, redraw). **Always restore state in `finally`:**

```js
const { app, MeasurementUnits, UndoModes } = require('indesign');

function runWithUndo(name, fn) {
  // Correct signature for function callbacks:
  // app.doScript(function, [arguments], [language], [undoMode], [undoName])
  // We pass no arguments and no language; set undoMode and name.
  return app.doScript(fn, undefined, undefined, UndoModes.ENTIRE_SCRIPT, name);
}

function exampleSafeBlock() {
  const sp = app.scriptPreferences;
  const orig = {
    enableRedraw: sp.enableRedraw,
    measurementUnit: sp.measurementUnit,
  };

  return runWithUndo("Example Safe Block", () => {
    try {
      sp.enableRedraw = false;             // may boost perf
      sp.measurementUnit = MeasurementUnits.POINTS;
      // ...work...
    } finally {
      sp.measurementUnit = orig.measurementUnit;
      sp.enableRedraw = orig.enableRedraw;
    }
  });
}
```

* **Reset Find/Change prefs.** Before and after any search/replace:
  `app.findTextPreferences = app.changeTextPreferences = NothingEnum.nothing;`
* **Validate object specifiers:** Resolve by touching a property/method, then check `.isValid` before proceeding.
* **Undo semantics:** Wrap entry points in `app.doScript` with `UndoModes.ENTIRE_SCRIPT` for one clean undo.
* **Measurement units:** Explicitly set to a known unit (e.g., points) and restore it.

---

## 4) Performance Guidelines

* **Minimize redraw:** `app.scriptPreferences.enableRedraw = false` during heavy operations, restore afterward.
* **Batch operations:** Prefer collection methods (`everyItem()`, `getElements()`) to reduce round-trips.
* **Avoid UI interaction while processing:** Build data in memory, then apply changes.
* **Search scope:** Limit find/change to target stories/layers.
* **Single undo step:** Wrap in `doScript` with undo.

---

## 5) Error Handling & Logging

* **try/catch/finally** around any code that touches global prefs or performs I/O.
* **User-safe errors:** Convert raw exceptions into concise messages (include doc name, page, selection type).
* **Optional debug logger:** Feature-flag extra logging.
* **Hard stops:** Bail early with clear alerts if prerequisites aren’t met.

---

## 6) Find/Change: Canonical Pattern

```js
const { app, NothingEnum } = require('indesign');

function replaceTabsWithSpace(scope) {
  const target = scope ?? app.activeDocument;
  try {
    app.findTextPreferences = app.changeTextPreferences = NothingEnum.nothing;
    app.findTextPreferences.findWhat = "\t\t";
    app.changeTextPreferences.changeTo = " ";
    const hits = target.findText();
    hits.forEach(h => h.changeText());
    return hits.length;
  } finally {
    app.findTextPreferences = app.changeTextPreferences = NothingEnum.nothing;
  }
}
```

---

## 7) Selection & Type Guards

* **Check selection type first** (`TextFrame`, `InsertionPoint`, `Rectangle`).
* **Prefer feature checks over class-name checks** when robust.

```js
function isGraphic(item) {
  return 'graphics' in item || 'imageTypeName' in item;
}
```

---

## 8) Document & Ruler/Units Handling

* Always set and restore:

    * `scriptPreferences.measurementUnit` (work in points internally).
    * Any document-level preferences you modify (ruler origin, zero point, etc.).
* If surfacing unit inputs, support strings (`"10 mm"`, `"0.25 in"`) and normalize to points.

---

## 9) Undo Modes — Choose Intentionally

* **`UndoModes.ENTIRE_SCRIPT`**: Default for batch jobs; one clean undo.
* **`UndoModes.AUTO_UNDO`**: Lets InDesign segment some operations.
* **Avoid `FAST_ENTIRE_SCRIPT`** unless measured.

---

## 10) Progress & UX

* Prefer **non-blocking** workflows: compute first, then apply.
* Keep UI responsive; don’t redraw the layout repeatedly during loops.
* For confirmations and destructive prompts, prefer InDesign dialogs over system dialogs; see [Dialog UI/UX Conventions](./DialogUXConventions.md#confirmation-dialogs).

---

## 11) Packaging & Distribution

* **Scripts panel:** Ship `.jsx/.js` files and installation notes.
* **UXP extensions/panels:** For richer UI, package with a manifest.
* **Versioning:** Note InDesign version tested (e.g., “tested in 20.0.2”).

---

## 12) Performance Checklist (Pre-commit)

* [ ] Guarded with `app.doScript(..., UndoModes.ENTIRE_SCRIPT, ...)`.
* [ ] `enableRedraw` disabled during heavy ops, restored.
* [ ] `find/change` prefs reset before and after.
* [ ] Minimal scope for searches/loops.
* [ ] Collections resolved once (`everyItem().getElements()`).
* [ ] Measurement unit set and restored.
* [ ] `isValid` checks on user-driven or optional targets.

---

## 13) Troubleshooting Notes

* **Find/Change “does nothing”:** Often due to sticky prefs—reset before/after.
* **Undo behaves oddly:** Revisit undo mode; avoid `FAST_ENTIRE_SCRIPT`.
* **Redraw suppression not effective:** Known inconsistencies—batch work off-screen.

---

## 14) Example: Robust Text Cleanup Script (Skeleton)

```js
/**
 * Normalize whitespace in the active document.
 */
const { app, NothingEnum, UndoModes, MeasurementUnits } = require('indesign');

function normalizeWhitespace(doc = app.activeDocument) {
  if (!doc?.isValid) throw new Error("No valid document open.");

  const sp = app.scriptPreferences;
  const orig = {
    enableRedraw: sp.enableRedraw,
    measurementUnit: sp.measurementUnit,
  };

  return app.doScript(() => {
    try {
      sp.enableRedraw = false;
      sp.measurementUnit = MeasurementUnits.POINTS;

      app.findTextPreferences = app.changeTextPreferences = NothingEnum.nothing;

      app.findTextPreferences.findWhat = "\t\t";
      app.changeTextPreferences.changeTo = " ";
      const hits = doc.stories.everyItem().findText();
      hits.forEach(h => h.changeText());

    } finally {
      app.findTextPreferences = app.changeTextPreferences = NothingEnum.nothing;
      sp.measurementUnit = orig.measurementUnit;
      sp.enableRedraw = orig.enableRedraw;
    }
  }, UndoModes.ENTIRE_SCRIPT, undefined, undefined, "Normalize whitespace");
}
```

---

## 15) Pull Request Checklist

* [ ] Follows repository code style (lint passes).
* [ ] Main procedure wrapped in `doScript` with chosen `UndoModes`.
* [ ] All global prefs restored in `finally`.
* [ ] Scoped operations and `isValid` checks.
* [ ] Performance considered (batching, minimal redraw).
* [ ] Clear user-facing messages and guarded preconditions.

---

**TL;DR:** Prefer UXP JS with explicit imports, wrap scripts in a single undo, suppress redraw during heavy work, reset prefs before/after, resolve object specifiers once, and always restore app state in `finally`. These practices align with Adobe’s current scripting model and the community’s hard-won lessons.


---

## 16) Line Ending Standards

To ensure cross-platform compatibility, all files in this repository must use LF (Line Feed) line endings. Follow these steps:
- Set your Git configuration globally with `git config --global core.autocrlf input` to normalize line endings on commit.
- Optionally, add a `.gitattributes` file in the repository root with `* text=auto` to enforce this setting at the project level.
- Use an IDE or editor (e.g., WebStorm, VS Code) configured to use LF endings (e.g., in WebStorm: Settings > Editor > Code Style > Line Separator > set to Unix (\n)).
- Avoid committing files with CRLF (Carriage Return + Line Feed) endings to prevent warnings and potential conflicts.


---

## 15) ESLint for ExtendScript (JSX)

Key points of our configuration:
- JavaScript version: ES3 for `Scripts/**/*.jsx` via parserOptions override; ES6 features (let/const, classes, modules) are not available in ExtendScript.
- Host globals declared: `app`, `$`, `File`, `Folder`, etc., so `no-undef` can remain strict without flagging InDesign APIs.
- Modern variable rules disabled: `no-var`, `prefer-const`, and `prefer-let` are off to match the ES3 runtime.

Rules we enforce and why they’re appropriate:
- no-undef (error): Prevents typos against host objects like `MeasurementUnits` or `UndoModes` and catches missing symbols early.
- no-redeclare (error): Avoids subtle scope bugs common in ExtendScript where `var` is function-scoped.
- no-dupe-args (error): Guards against duplicate parameter names that ExtendScript would allow but handle poorly.
- no-unreachable (error): Catches dead code after `return/throw`, which can otherwise mask logic errors.
- no-unused-vars (warn with underscore exception): Keeps scripts tidy without blocking patterns where placeholder args are needed.
- valid-typeof (error): Prevents misspelling type strings (e.g., 'undefned').
- eqeqeq (warn allowing null comparisons): Encourages strict equality while allowing the common `x == null` idiom to check for null or undefined.
- light style checks (no-extra-semi, no-trailing-spaces): Low-risk consistency improvements.

Special cases and overrides:
- Some complex scripts (e.g., BulkPDFGenerator.jsx) have `no-undef` disabled due to dynamic scopes or host messaging (e.g., BridgeTalk). Limit this to known files and prefer adding missing globals to `.eslintrc.json` when practical.

When adding new rules:
- Favor safety rules that catch runtime hazards (`no-func-assign`, `no-sparse-arrays`) if they don’t cause churn.
- Avoid rules that imply ES6+ constructs in JSX files.

If targeting UXP/modern JS instead of ExtendScript, revisit the config to enable modern best practices (`prefer-const`, modules, etc.).
