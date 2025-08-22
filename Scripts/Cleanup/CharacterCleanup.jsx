/*
 CharacterCleanup: consolidated GREP replacements into a single array and loop.
 Adds a multi-select dialog (with "All") to choose what to clean and a confirmation before running.
 Preserves behavior and order. Adds a guard for no open document. Resets GREP prefs safely.
*/

(function () {
    if (!app || !app.documents || app.documents.length === 0) {
        alert("Open a document before running CharacterCleanup.");
        return;
    }

    // Define replacement groups (categories)
    var groupFixOrder = [
        ["([א-הח-ת])([ְֱֲֳִֵֶַָֹֻׁׂ]+)(ּ)", "$1$3$2"] // ensure dagesh (\x{05BC}) comes before vowels
    ];

    var groupNormalizeForms = [
        ["\\x{FB2E}", "\\x{00DA}\\x{05B7}"],
        ["\\x{FB30}", "\\x{00DA}\\x{05BC}"],
        ["\\x{FB2F}", "\\x{00DA}\\x{05B8}"],
        ["\\x{FB31}", "\\x{05D1}\\x{05BC}"],
        ["\\x{FB4C}", "\\x{05D1}\\x{05BF}"],
        ["\\x{FB32}", "\\x{05D2}\\x{05BC}"],
        ["\\x{FB33}", "\\x{05D3}\\x{05BC}"],
        ["\\x{FB34}", "\\x{05D4}\\x{05BC}"],
        ["\\x{FB35}", "\\x{05D5}\\x{05BC}"],
        ["\\x{E801}", "\\x{05D5}\\x{05B9}"],
        ["\\x{FB4B}", "\\x{05D5}\\x{05B9}"],
        ["\\x{FB36}", "\\x{05D6}\\x{05BC}"],
        ["\\x{FB38}", "\\x{05D8}\\x{05BC}"],
        ["\\x{FB39}", "\\x{05D9}\\x{05BC}"],
        ["\\x{FB1D}", "\\x{05D9}\\x{05B4}"],
        ["\\x{FB3B}", "\\x{05DB}\\x{05BC}"],
        ["\\x{FB3A}", "\\x{05DA}\\x{05BC}"],
        ["\\x{E803}", "\\x{05DA}\\x{05B8}"],
        ["\\x{FB4D}", "\\x{05DB}\\x{05BF}"],
        ["\\x{E802}", "\\x{05DA}\\x{05B0}"],
        ["\\x{FB3C}", "\\x{05DC}\\x{05BC}"],
        ["\\x{E805}", "\\x{05DC}\\x{05BC}\\x{05B9}"],
        ["\\x{E804}", "\\x{05DC}\\x{05B9}"],
        ["\\x{FB3E}", "\\x{05DE}\\x{05BC}"],
        ["\\x{FB40}", "\\x{05E0}\\x{05BC}"],
        ["\\x{FB41}", "\\x{05E1}\\x{05BC}"],
        ["\\x{FB43}", "\\x{05E3}\\x{05BC}"],
        ["\\x{FB44}", "\\x{05E4}\\x{05BC}"],
        ["\\x{FB4E}", "\\x{05E4}\\x{05BF}"],
        ["\\x{FB46}", "\\x{05E6}\\x{05BC}"],
        ["\\x{FB47}", "\\x{05E7}\\x{05BC}"],
        ["\\x{FB48}", "\\x{05E8}\\x{05BC}"],
        ["\\x{FB49}", "\\x{05E9}\\x{05BC}"],
        ["\\x{FB2B}", "\\x{05E9}\\x{05C2}"],
        ["\\x{FB2D}", "\\x{05E9}\\x{05BC}\\x{05C2}"],
        ["\\x{FB2A}", "\\x{05E9}\\x{05C1}"],
        ["\\x{FB2C}", "\\x{05E9}\\x{05BC}\\x{05C1}"],
        ["\\x{FB4A}", "\\x{05EA}\\x{05BC}"]
    ];

    var groupDoubleSpace = [
        ["\\x{0020}\\x{0020}", "\\x{0020}"] // remove double space
    ];

    // Trim redundant trailing paragraph marks at the end of a story (leave one)
    var groupTrimTrailingParagraphs = [
        ["\\r{2,}\\z", "\\r"]
    ];

    // Build UI dialog with side-by-side layout
    var dlg = new Window("dialog", "Character Cleanup");
    dlg.orientation = "column";
    dlg.alignChildren = "left";
    dlg.margins = 16;

    dlg.add("statictext", undefined, "Select the cleanup actions to run:");

    // Options and Scope side-by-side
    var row = dlg.add("group");
    row.orientation = "row";
    row.alignChildren = "top";
    row.spacing = 12;

    // Left panel: Main options
    var optionsPanel = row.add("panel", undefined, "Options");
    optionsPanel.orientation = "column";
    optionsPanel.alignChildren = "left";
    optionsPanel.margins = 12;
    optionsPanel.spacing = 6;

    var allCb = optionsPanel.add("checkbox", undefined, "All");
    var cbFix = optionsPanel.add("checkbox", undefined, "Fix marks order (dagesh before vowels)");
    var cbNorm = optionsPanel.add("checkbox", undefined, "Normalize Hebrew presentation forms (letters with marks)");
    var cbDbl = optionsPanel.add("checkbox", undefined, "Remove double spaces");
    var cbTrail = optionsPanel.add("checkbox", undefined, "Trim trailing paragraph marks at end of story (leave one)");

    // Right panel: Scope chooser
    var scopePanel = row.add("panel", undefined, "Scope");
    scopePanel.orientation = "column";
    scopePanel.alignChildren = "left";
    scopePanel.margins = 12;
    scopePanel.spacing = 6;

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
    allCb.value = true;
    cbFix.value = true;
    cbNorm.value = true;
    cbDbl.value = true;
    cbTrail.value = true;
    rbDoc.value = true; // default scope per requirement

    // Enablement rules: show but disable if not applicable
    rbSelection.enabled = hasRangedTextSelection; // Disable for caret-only selection
    rbStory.enabled = (inTextContext || hasTextFrameSelection);
    rbFrame.enabled = (inTextContext || hasTextFrameSelection);

    // Ensure no disabled option is selected
    if (!rbSelection.enabled && rbSelection.value) { rbSelection.value = false; rbDoc.value = true; }
    if (!rbStory.enabled && rbStory.value) { rbStory.value = false; rbDoc.value = true; }
    if (!rbFrame.enabled && rbFrame.value) { rbFrame.value = false; rbDoc.value = true; }

    // Helpers to sync the `All` checkbox
    function syncAllFromChildren() {
        allCb.value = (cbFix.value && cbNorm.value && cbDbl.value && cbTrail.value);
    }
    function setChildren(v) {
        cbFix.value = v; cbNorm.value = v; cbDbl.value = v; cbTrail.value = v;
    }

    allCb.onClick = function () { setChildren(allCb.value); };
    cbFix.onClick = cbNorm.onClick = cbDbl.onClick = cbTrail.onClick = function () { syncAllFromChildren(); };

    var btns = dlg.add("group");
    btns.alignment = "right";
    var cancelBtn = btns.add("button", undefined, "Cancel");
    var runBtn = btns.add("button", undefined, "Run", {name: "ok"});

    runBtn.onClick = function () { dlg.close(1); };
    cancelBtn.onClick = function () { dlg.close(0); };

    var dlgRes = dlg.show();
    if (dlgRes !== 1) { return; }

    // Ensure at least one option selected
    if (!allCb.value && !cbFix.value && !cbNorm.value && !cbDbl.value && !cbTrail.value) {
        alert("No cleanup actions were selected.");
        return;
    }

    // Confirmation dialog (pattern similar to other scripts)
    var selectedNames = [];
    if (allCb.value || cbFix.value) selectedNames.push("Fix marks order");
    if (allCb.value || cbNorm.value) selectedNames.push("Normalize presentation forms");
    if (allCb.value || cbDbl.value) selectedNames.push("Remove double spaces");
    if (allCb.value || cbTrail.value) selectedNames.push("Trim trailing paragraph marks (leave one)");

    var confirmDlg = new Window("dialog", "Confirm Cleanup");
    confirmDlg.orientation = "column";
    confirmDlg.alignChildren = "left";
    confirmDlg.margins = 16;
    var msg = "Proceed with " + selectedNames.length + " selected cleanup action" + (selectedNames.length === 1 ? "" : "s") + "?";
    confirmDlg.add("statictext", undefined, msg);
    // show a compact list
    for (var si = 0; si < selectedNames.length; si++) {
        confirmDlg.add("statictext", undefined, "• " + selectedNames[si]);
    }
    var cg = confirmDlg.add("group");
    cg.alignment = "right";
    var yesBtn = cg.add("button", undefined, "Yes");
    var noBtn = cg.add("button", undefined, "No");
    var confirmed = false;
    yesBtn.onClick = function(){ confirmed = true; confirmDlg.close(1); };
    noBtn.onClick = function(){ confirmed = false; confirmDlg.close(0); };

    var cRes = confirmDlg.show();
    if (cRes !== 1 || !confirmed) { return; }

    // Resolve targets based on selected scope
    var targets = resolveScopeTargets();
    if (!targets || targets.length === 0) {
        return; // an alert has already been shown when invalid
    }

    // Build the list of replacements to run based on selection
    var toRun = [];
    if (allCb.value || cbFix.value) {
        pushPairs(toRun, groupFixOrder);
    }
    if (allCb.value || cbNorm.value) {
        pushPairs(toRun, groupNormalizeForms);
    }
    if (allCb.value || cbDbl.value) {
        pushPairs(toRun, groupDoubleSpace);
    }
    if (allCb.value || cbTrail.value) {
        // run trailing paragraph cleanup last
        pushPairs(toRun, groupTrimTrailingParagraphs);
    }

    // Track what was actually changed for the completion dialog
    var changesApplied = [];
    var actionNames = [];
    if (allCb.value || cbFix.value) actionNames.push("Fix marks order");
    if (allCb.value || cbNorm.value) actionNames.push("Normalize presentation forms");
    if (allCb.value || cbDbl.value) actionNames.push("Remove double spaces");
    if (allCb.value || cbTrail.value) actionNames.push("Trim trailing paragraph marks");

    app.doScript(function () {
        for (var i = 0; i < toRun.length; i++) {
            var pair = toRun[i];
            var actionName = actionNames[Math.floor(i / (toRun.length / actionNames.length))];
            
            // Special handling for double space removal - make it iterative
            if (pair[0] === "\\x{0020}\\x{0020}") {
                if (changeIterativeTargets(pair[0], pair[1], targets)) {
                    changesApplied.push(actionName);
                }
            } else {
                if (changeTargets(pair[0], pair[1], targets)) {
                    changesApplied.push(actionName);
                }
            }
        }
    }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Character Cleanup");

    // Show completion confirmation
    showCompletionDialog(changesApplied);

    function pushPairs(dest, src) {
        for (var i = 0; i < src.length; i++) dest.push(src[i]);
    }

    function safeReset() {
        try { app.findGrepPreferences = null; } catch (e) {}
        try { app.changeGrepPreferences = null; } catch (e2) {}
    }

    function changeTargets(find, replaceTo, tgts) {
        var any = false;
        for (var ti = 0; ti < tgts.length; ti++) {
            var t = tgts[ti];
            try {
                safeReset();
                app.findGrepPreferences.findWhat = find;
                app.changeGrepPreferences.changeTo = replaceTo;
                var foundItems = [];
                try { foundItems = t.findGrep(); } catch (e3) { foundItems = []; }
                if (foundItems && foundItems.length > 0) {
                    try { t.changeGrep(true); } catch (e4) {}
                    any = true;
                }
            } catch (e) {
                // continue
            } finally {
                safeReset();
            }
        }
        return any;
    }

    function changeIterativeTargets(find, replaceTo, tgts) {
        var any = false;
        for (var ti = 0; ti < tgts.length; ti++) {
            var t = tgts[ti];
            var maxIterations = 10;
            var iterations = 0;
            while (iterations < maxIterations) {
                var changedThisPass = false;
                try {
                    safeReset();
                    app.findGrepPreferences.findWhat = find;
                    app.changeGrepPreferences.changeTo = replaceTo;
                    var foundItems = [];
                    try { foundItems = t.findGrep(); } catch (e3) { foundItems = []; }
                    if (!foundItems || foundItems.length === 0) {
                        break;
                    }
                    try { t.changeGrep(true); } catch (e4) {}
                    changedThisPass = true;
                    any = true;
                } catch (e) {
                    break;
                } finally {
                    safeReset();
                }
                if (!changedThisPass) break;
                iterations++;
            }
        }
        return any;
    }

    function resolveScopeTargets() {
        var tgts = [];
        // All Documents
        if (rbAllDocs.value) {
            if (!app.documents || app.documents.length === 0) {
                alert("No open documents.");
                return [];
            }
            for (var d = 0; d < app.documents.length; d++) {
                try { if (app.documents[d] && app.documents[d].isValid) tgts.push(app.documents[d]); } catch (e) {}
            }
            return tgts;
        }
        // Active Document
        if (rbDoc.value) {
            try {
                var doc = app.activeDocument;
                if (doc && doc.isValid) tgts.push(doc);
                else alert("No active document.");
            } catch (e2) { alert("No active document."); }
            return tgts;
        }
        // Story (from selection)
        if (rbStory.value) {
            var story = null;
            try {
                if (app.selection && app.selection.length > 0) {
                    var sel = app.selection[0];
                    try {
                        if (sel && sel.constructor && String(sel.constructor.name) === "Story") {
                            story = sel;
                        }
                    } catch (e3) {}
                    if (!story) {
                        try { if (sel && sel.parentStory && sel.parentStory.isValid) story = sel.parentStory; } catch (e4) {}
                    }
                }
            } catch (e5) {}
            if (!story) {
                alert("Select some text or a text frame to target its story.");
                return [];
            }
            tgts.push(story);
            return tgts;
        }
        // Page (active)
        if (rbPage.value) {
            var page = null;
            try {
                if (app.layoutWindows && app.layoutWindows.length > 0) {
                    page = app.layoutWindows[0].activePage;
                } else if (app.activeWindow) {
                    page = app.activeWindow.activePage;
                }
            } catch (e6) {}
            if (!page) {
                alert("No active page. Open a layout window and try again.");
                return [];
            }
            var seenStoryIds = {};
            try {
                var frames = [];
                try { frames = page.textFrames ? page.textFrames.everyItem().getElements() : []; } catch (e7) { frames = []; }
                for (var i = 0; i < frames.length; i++) {
                    var st = null;
                    try { st = frames[i].parentStory; } catch (e8) { st = null; }
                    if (st && st.isValid) {
                        var sid = "";
                        try { sid = String(st.id); } catch (e9) { sid = String(i); }
                        if (!seenStoryIds[sid]) { seenStoryIds[sid] = true; tgts.push(st); }
                    }
                }
            } catch (e10) {}
            if (tgts.length === 0) {
                alert("No text found on the active page.");
            }
            return tgts;
        }
        // Frame (selected frames)
        if (rbFrame.value) {
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
        // Selection
        if (rbSelection.value) {
            if (!app.selection || app.selection.length === 0) {
                alert("Make a selection first.");
                return [];
            }
            for (var s = 0; s < app.selection.length; s++) {
                var item = app.selection[s];
                var txt = null;
                try { if (item && item.texts && item.texts.length > 0) txt = item.texts[0]; } catch (e11) {}
                if (!txt) {
                    try { if (item && item.parentStory && item.parentStory.isValid) txt = item.texts && item.texts.length > 0 ? item.texts[0] : item.parentStory; } catch (e12) {}
                }
                if (txt && txt.isValid) tgts.push(txt);
            }
            if (tgts.length === 0) {
                alert("The selection does not contain editable text.");
            }
            return tgts;
        }
        // Fallback to active document
        try { var dflt = app.activeDocument; if (dflt && dflt.isValid) tgts.push(dflt); } catch (e13) {}
        return tgts;
    }

    function showCompletionDialog(changesApplied) {
        var completionDlg = new Window("dialog", "Cleanup Complete");
        completionDlg.orientation = "column";
        completionDlg.alignChildren = "left";
        completionDlg.margins = 16;
        completionDlg.spacing = 10;

        if (changesApplied.length === 0) {
            completionDlg.add("statictext", undefined, "Nothing to clean - no changes were made.");
        } else {
            completionDlg.add("statictext", undefined, "Character cleanup completed successfully!");
            completionDlg.add("statictext", undefined, "The following actions were performed:");
            
            // Remove duplicates from changesApplied (avoid Array.prototype.indexOf for ExtendScript compatibility)
            var uniqueChanges = [];
            for (var i = 0; i < changesApplied.length; i++) {
                var exists = false;
                for (var k = 0; k < uniqueChanges.length; k++) {
                    if (uniqueChanges[k] === changesApplied[i]) {
                        exists = true;
                        break;
                    }
                }
                if (!exists) {
                    uniqueChanges.push(changesApplied[i]);
                }
            }
            
            for (var j = 0; j < uniqueChanges.length; j++) {
                completionDlg.add("statictext", undefined, "• " + uniqueChanges[j]);
            }
        }

        var okGroup = completionDlg.add("group");
        okGroup.alignment = "center";
        var okButton = okGroup.add("button", undefined, "OK");
        okButton.onClick = function() { completionDlg.close(); };
        
        completionDlg.show();
    }
})();
