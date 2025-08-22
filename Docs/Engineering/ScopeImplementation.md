# Scope Option - Implementation Guide

## Overview

This document provides technical implementation details and code examples for integrating the scope option functionality into InDesign scripts. It serves as a reference for developers implementing consistent scope behavior across the script repository.

**Important**: This document describes the unified implementation pattern based on DeleteHebrewMarks.jsx. All scripts should be updated to follow this comprehensive approach to ensure consistency across the repository.

## Canonical Scope Implementation (2025 Standardization)

All scripts should implement the scope option using the following standardized approach:

### Standard Scope Options Order
1. All Documents (`allDocs`)
2. Document (`doc`) - **Default Selection**
3. Page (`page`)
4. Story (`story`)
5. Frame (`frame`) - *Optional, include only when frame-specific operations are needed*
6. Selected Text (`selection`)

### Implementation Requirements
- **Labels**: Use clean labels without helper text (avoid "(active)" or "(from selection)")
- **Default**: Always default to "Document" scope
- **Availability**: Show all options but disable contextually unavailable ones
- **Processing Model**: Resolve targets first, then iterate targets and perform operations on each

## Technical Implementation

### UI Component Structure

**Comprehensive Implementation (DeleteHebrewMarks.jsx Pattern)**

```javascript
// Create scope panel (integrated within main dialog)
var scopePanel = row.add("panel", undefined, "Scope");
scopePanel.orientation = "column";
scopePanel.alignChildren = "left";
scopePanel.margins = 12;

// Determine selection context first
var hasTextFrameSelection = false;
var inTextContext = false;            // true for any text context, including caret
var hasRangedTextSelection = false;   // true only when there is an actual text range selection (not caret)
try {
    if (app.selection && app.selection.length > 0) {
        for (var _i = 0; _i < app.selection.length; _i++) {
            var _sel = app.selection[_i];
            try {
                var ctor = String(_sel && _sel.constructor && _sel.constructor.name);
                // Text context detection
                if (ctor === "InsertionPoint" || ctor === "Text" || ctor === "Word" || ctor === "Character" || ctor === "TextStyleRange" || ctor === "Paragraph" || ctor === "Line") {
                    inTextContext = true;
                }
                // Ranged text selection (exclude caret and frame selections)
                if (ctor !== "InsertionPoint" && ctor !== "TextFrame") {
                    var t = null;
                    try { if (_sel && _sel.texts && _sel.texts.length > 0) t = _sel.texts[0]; } catch (eT) { t = null; }
                    try {
                        if (t && t.characters && t.characters.length && t.characters.length > 0) {
                            hasRangedTextSelection = true;
                        }
                    } catch (eLen) {}
                }
                // Consider as text frame if it's a TextFrame or exposes text/lines
                if (ctor === "TextFrame") {
                    hasTextFrameSelection = true;
                } else if (_sel && _sel.texts && _sel.texts.length > 0 && _sel.lines) {
                    hasTextFrameSelection = true;
                }
            } catch (e) {}
        }
    }
} catch (e0) {}

// Order: All Documents, Document, Page, Story, Frame, Selected Text
var rbAllDocs = scopePanel.add("radiobutton", undefined, "All Documents");
var rbDoc = scopePanel.add("radiobutton", undefined, "Document");
var rbPage = scopePanel.add("radiobutton", undefined, "Page");
var rbStory = scopePanel.add("radiobutton", undefined, "Story");
var rbFrame = scopePanel.add("radiobutton", undefined, "Frame");
var rbSelection = scopePanel.add("radiobutton", undefined, "Selected Text");

// Defaults
rbDoc.value = true; // default scope

// Enablement rules: show but disable if not applicable
rbSelection.enabled = hasRangedTextSelection; // Disable for caret-only selection
rbStory.enabled = (inTextContext || hasTextFrameSelection);
rbFrame.enabled = (inTextContext || hasTextFrameSelection);

// Ensure no disabled option is selected
if (!rbSelection.enabled && rbSelection.value) { rbSelection.value = false; rbDoc.value = true; }
if (!rbStory.enabled && rbStory.value) { rbStory.value = false; rbDoc.value = true; }
if (!rbFrame.enabled && rbFrame.value) { rbFrame.value = false; rbDoc.value = true; }
```

**Simplified Implementation (For Scripts Not Requiring Frame Scope)**

```javascript
// Scope panel (right column)
var scopeOptions = [
  { text: 'All Documents', value: 'allDocs' },
  { text: 'Document', value: 'doc' },
  { text: 'Page', value: 'page' },
  { text: 'Story', value: 'story' },
  { text: 'Selected Text', value: 'selection' }
];

// Disable Selected Text when no text is selected
var hasTextSelection = false;
if (app.selection && app.selection.length > 0) {
  for (var i = 0; i < app.selection.length; i++) {
    var sel = app.selection[i];
    try {
      var ctor = String(sel && sel.constructor && sel.constructor.name);
      if (ctor === 'Text' || ctor === 'InsertionPoint' || ctor === 'Word' || ctor === 'Character' || ctor === 'TextStyleRange' || ctor === 'Paragraph' || ctor === 'Line') {
        hasTextSelection = true; break;
      }
    } catch (e) {}
  }
}
selectedTextRadio.enabled = hasTextSelection; // where selectedTextRadio is the radio with value 'selection'
```

## Scope Resolution Logic

### Comprehensive Resolution Function

```javascript
function resolveScopeTargets(scope) {
    var tgts = [];
    if (scope === "allDocs") {
        if (!app.documents || app.documents.length === 0) { alert("No open documents."); return []; }
        for (var d = 0; d < app.documents.length; d++) { 
            try { if (app.documents[d].isValid) tgts.push(app.documents[d]); } catch (e) {} 
        }
        return tgts;
    }
    if (scope === "doc") {
        try { 
            var doc = app.activeDocument; 
            if (doc && doc.isValid) tgts.push(doc); 
            else alert("No active document."); 
        } catch (e2) { alert("No active document."); }
        return tgts;
    }
    if (scope === "story") {
        var story = null;
        try {
            if (app.selection && app.selection.length > 0) {
                var sel = app.selection[0];
                try { if (sel && sel.constructor && String(sel.constructor.name) === "Story") story = sel; } catch (ex) {}
                if (!story) { 
                    try { if (sel && sel.parentStory && sel.parentStory.isValid) story = sel.parentStory; } catch (ex2) {} 
                }
            }
        } catch (e3) {}
        if (!story) { alert("Select some text or a text frame to target its story."); return []; }
        tgts.push(story); return tgts;
    }
    if (scope === "page") {
        var page = null;
        try { 
            if (app.layoutWindows && app.layoutWindows.length > 0) page = app.layoutWindows[0].activePage; 
            else if (app.activeWindow) page = app.activeWindow.activePage; 
        } catch (e4) {}
        if (!page) { alert("No active page. Open a layout window and try again."); return []; }
        try {
            var frames = page.textFrames ? page.textFrames.everyItem().getElements() : [];
            for (var i = 0; i < frames.length; i++) {
                try {
                    var tf = frames[i];
                    var lines = null;
                    try { lines = tf && tf.lines ? tf.lines.everyItem().getElements() : []; } catch (ee0) { lines = []; }
                    if (lines && lines.length > 0) {
                        var firstChar = null, lastChar = null;
                        try { firstChar = lines[0].characters[0]; } catch (ee1) {}
                        try { var lastLine = lines[lines.length - 1]; lastChar = lastLine.characters[-1]; } catch (ee2) {}
                        if (firstChar && lastChar) {
                            var range = null;
                            try { range = tf.parentStory.texts.itemByRange(firstChar, lastChar); } catch (ee3) {}
                            if (range && range.isValid) tgts.push(range);
                        }
                    }
                } catch (e5) {}
            }
        } catch (e7) {}
        if (tgts.length === 0) alert("No text found on the active page.");
        return tgts;
    }
    if (scope === "frame") {
        if (!app.selection || app.selection.length === 0) { alert("Select one or more frames."); return []; }
        for (var s = 0; s < app.selection.length; s++) {
            var it = app.selection[s];
            var tf = null;
            try { var ctor = String(it && it.constructor && it.constructor.name); if (ctor === "TextFrame") tf = it; } catch (ef) {}
            if (!tf) { try { if (it && it.texts && it.texts.length > 0 && it.lines) tf = it; } catch (ef2) {} }
            if (tf) {
                var lines = null;
                try { lines = tf.lines ? tf.lines.everyItem().getElements() : []; } catch (ee0) { lines = []; }
                if (lines && lines.length > 0) {
                    var firstChar = null, lastChar = null;
                    try { firstChar = lines[0].characters[0]; } catch (ee1) {}
                    try { var lastLine = lines[lines.length - 1]; lastChar = lastLine.characters[-1]; } catch (ee2) {}
                    if (firstChar && lastChar) {
                        var range = null;
                        try { range = tf.parentStory.texts.itemByRange(firstChar, lastChar); } catch (ee3) {}
                        if (range && range.isValid) tgts.push(range);
                    }
                }
            }
        }
        if (tgts.length === 0) alert("No text found in the selected frame(s).");
        return tgts;
    }
    if (scope === "selection") {
        if (!app.selection || app.selection.length === 0) { alert("Make a text selection first."); return []; }
        for (var s = 0; s < app.selection.length; s++) {
            var item = app.selection[s];
            var txt = null;
            try { if (item && item.texts && item.texts.length > 0) txt = item.texts[0]; } catch (e8) {}
            // Do not escalate to parentStory in Selection scope; require actual text
            if (txt && txt.isValid) tgts.push(txt);
        }
        if (tgts.length === 0) alert("The selection does not contain editable text.");
        return tgts;
    }
    return []; // Unknown scope
}
```

### Simplified Resolution Function (Reference Implementation)

```javascript
function resolveScopeTargets(scope) {
  var tgts = [];
  if (scope === 'allDocs') { 
    for (var d=0; d<app.documents.length; d++) 
      if (app.documents[d].isValid) tgts.push(app.documents[d]); 
    return tgts; 
  }
  if (scope === 'doc') { 
    if (app.activeDocument && app.activeDocument.isValid) tgts.push(app.activeDocument); 
    return tgts; 
  }
  if (scope === 'page') {
    var page = null; 
    try { 
      if (app.layoutWindows && app.layoutWindows.length>0) page = app.layoutWindows[0].activePage; 
      else if (app.activeWindow) page = app.activeWindow.activePage; 
    } catch(e) {}
    if (!page) return [];
    var seen = {}, frames = page.textFrames ? page.textFrames.everyItem().getElements() : [];
    for (var i=0; i<frames.length; i++) { 
      var st=null; 
      try { st = frames[i].parentStory; } catch(e2) {}
      if (st && st.isValid) { 
        var sid = ''+st.id; 
        if (!seen[sid]) { seen[sid]=true; tgts.push(st); } 
      }
    }
    return tgts;
  }
  if (scope === 'story') {
    var story = null; 
    try {
      if (app.selection && app.selection.length>0) { 
        var sel = app.selection[0];
        try { if (sel && sel.constructor && String(sel.constructor.name) === 'Story') story = sel; } catch(e3) {}
        if (!story) { try { if (sel && sel.parentStory && sel.parentStory.isValid) story = sel.parentStory; } catch(e4) {} }
      }
    } catch(e5) {}
    if (story) tgts.push(story); 
    return tgts;
  }
  if (scope === 'selection') {
    if (!app.selection || app.selection.length === 0) return [];
    for (var s=0; s<app.selection.length; s++) {
      var it = app.selection[s], txt=null; 
      try { if (it && it.texts && it.texts.length>0) txt = it.texts[0]; } catch(e6) {}
      if (txt && txt.isValid) tgts.push(txt);
    }
    return tgts;
  }
  return tgts;
}
```

## Implementation Patterns

### Dialog Integration Pattern

```javascript
// Main dialog with side-by-side layout
var dialog = new Window("dialog", "Script Name");
dialog.orientation = "column";

// Options and Scope side-by-side
var row = dialog.add("group");
row.orientation = "row";
row.alignChildren = "top";
row.spacing = 12;

// Left panel: Main options
var optionsPanel = row.add("panel", undefined, "Options");
// ... add main script options

// Right panel: Scope
var scopePanel = row.add("panel", undefined, "Scope");
// ... add scope implementation from above

// Bottom buttons
var buttonGroup = dialog.add("group");
buttonGroup.alignment = "right";
var cancelButton = buttonGroup.add("button", undefined, "Cancel");
var runButton = buttonGroup.add("button", undefined, "Run", {name: "ok"});
```

### Processing Pattern

```javascript
// Get selected scope
var selectedScope = 'doc'; // default
for (var i = 0; i < scopeRadios.length; i++) {
    if (scopeRadios[i].value) {
        selectedScope = scopeRadios[i].scopeValue;
        break;
    }
}

// Resolve targets
var targets = resolveScopeTargets(selectedScope);
if (!targets || targets.length === 0) {
    // Error already shown in resolver
    return;
}

// Process targets
app.doScript(function(){
    for (var t = 0; t < targets.length; t++) {
        // Perform operations on targets[t]
        // Use find/change or direct manipulation
    }
}, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Script Name");
```

## Best Practices for Developers

### 1. Consistent Implementation
- Use the standardized scope option definitions above
- Implement identical UI layout across scripts
- Follow established naming conventions (`allDocs`, `doc`, `page`, `story`, `frame`, `selection`)

### 2. Error Handling
- Validate scope targets before processing
- Provide clear error messages when scope prerequisites are not met
- Use try/catch blocks around all InDesign API calls
- Always check `isValid` property on InDesign objects

### 3. Performance Considerations
- Disable redraw during scope-based operations: `app.scriptPreferences.enableRedraw = false`
- Use appropriate find/change preferences and reset them after use
- Implement progress feedback for large scope operations
- Consider memory usage for "All Documents" operations

### 4. User Experience
- Default to "Document" scope
- Provide clear scope descriptions in UI
- Include scope information in confirmation dialogs
- Show but disable unavailable scope options rather than hiding them

### 5. Code Organization
```javascript
// Recommended function organization:

// 1. UI creation functions
function createScopePanel(parentContainer) { /* ... */ }

// 2. Selection detection utilities
function detectSelectionContext() { /* ... */ }

// 3. Scope resolution
function resolveScopeTargets(scope) { /* ... */ }

// 4. Processing functions
function processTargets(targets, operation) { /* ... */ }

// 5. Error handling utilities
function showScopeError(message) { /* ... */ }
```

## Code Standards Compliance

### Variable Naming
- Use descriptive names: `hasRangedTextSelection` not `hasText`
- Consistent prefixes: `rb` for radio buttons, `cb` for checkboxes
- Scope values: Use standard strings (`allDocs`, `doc`, `page`, `story`, `frame`, `selection`)

### Error Handling Patterns
```javascript
// Standard error handling pattern
try {
    var result = riskyInDesignOperation();
    if (result && result.isValid) {
        // Process result
    }
} catch (e) {
    // Handle error gracefully
    $.writeln("Error in operation: " + e.message);
}
```

### Preference Management
```javascript
// Always reset preferences after use
function safeReset() {
    try { app.findGrepPreferences = null; } catch (e) {}
    try { app.changeGrepPreferences = null; } catch (e2) {}
}

// Use in processing
try {
    app.findGrepPreferences.findWhat = pattern;
    // ... perform operation
} finally {
    safeReset();
}
```

## Migration Guide

### Updating Existing Scripts

1. **Identify Current Pattern**: Check how scope is currently implemented
2. **Replace UI Code**: Use the standardized UI component structure
3. **Update Resolution Logic**: Replace with comprehensive `resolveScopeTargets` function
4. **Standardize Scope Values**: Use consistent naming (`allDocs`, `doc`, etc.)
5. **Add Context Detection**: Implement proper selection context detection
6. **Test All Scopes**: Verify each scope works correctly in various contexts

### Common Migration Issues

- **Inconsistent Scope Names**: Update to standard values
- **Missing Context Detection**: Add proper selection state checking
- **Incomplete Error Handling**: Add validation and user feedback
- **Performance Issues**: Add redraw disabling and progress feedback

## Testing Checklist

- [ ] All scope options appear in correct order
- [ ] Default selection is "Document"
- [ ] Unavailable scopes are disabled but visible
- [ ] Each scope resolves to correct targets
- [ ] Error messages are clear and helpful
- [ ] Operations work correctly on all target types
- [ ] UI layout is consistent with other scripts
- [ ] Performance is acceptable for large scopes

## Related Documentation

- [Scope Functional Requirements](../ScriptUsage/Components/ScopeChooser.md) - User-facing functionality and requirements
- [Dialog UX Conventions](DialogUXConventions.md) - UI layout and interaction standards
- [Code Standards](CodeStandards.md) - Development guidelines and best practices

---

*This implementation guide ensures consistent scope behavior across all InDesign scripts. Always refer to DeleteHebrewMarks.jsx as the reference implementation when implementing scope functionality.*