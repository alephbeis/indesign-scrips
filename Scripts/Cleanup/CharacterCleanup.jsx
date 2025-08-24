/*
 CharacterCleanup: consolidated GREP replacements into a single array and loop.
 Adds a multi-select dialog (with "All") to choose what to clean.
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
    var cbGuides = optionsPanel.add("checkbox", undefined, "Remove non-master guides");

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
    cbGuides.value = true;
    rbDoc.value = true; // default scope

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
        allCb.value = (cbFix.value && cbNorm.value && cbDbl.value && cbTrail.value && cbGuides.value);
    }
    function setChildren(v) {
        cbFix.value = v; cbNorm.value = v; cbDbl.value = v; cbTrail.value = v; cbGuides.value = v;
    }

    // Enable/disable Run button depending on whether any option is selected
    function anyOptionSelected() {
        return (cbFix.value || cbNorm.value || cbDbl.value || cbTrail.value || cbGuides.value || allCb.value);
    }
    function updateRunEnabled() {
        try { if (runBtn) runBtn.enabled = anyOptionSelected(); } catch (e) {}
    }

    allCb.onClick = function () { setChildren(allCb.value); updateRunEnabled(); };
    cbFix.onClick = cbNorm.onClick = cbDbl.onClick = cbTrail.onClick = cbGuides.onClick = function () { syncAllFromChildren(); updateRunEnabled(); };

    var btns = dlg.add("group");
    btns.alignment = "right";
    var cancelBtn = btns.add("button", undefined, "Cancel");
    var runBtn = btns.add("button", undefined, "Run", {name: "ok"});
    updateRunEnabled();

    runBtn.onClick = function () { dlg.close(1); };
    cancelBtn.onClick = function () { dlg.close(0); };

    var dlgRes = dlg.show();
    if (dlgRes !== 1) { return; }

    // Run button is disabled when no options are selected (no alert needed)

    // Determine what actions are requested
    var wantsText = (allCb.value || cbFix.value || cbNorm.value || cbDbl.value || cbTrail.value);
    var wantsGuides = (allCb.value || cbGuides.value);

    // Resolve text targets only if needed
    var targets = [];
    var hasTextTargets = false;
    if (wantsText) {
        targets = resolveScopeTargets();
        hasTextTargets = (targets && targets.length > 0);
        if (!hasTextTargets && !wantsGuides) {
            return; // nothing to do
        }
    } else if (!wantsGuides) {
        return; // nothing selected (should not happen due to earlier validation)
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
        // Remove non-master guides if requested
        if (allCb.value || cbGuides.value) {
            try {
                var removedGuides = removeNonMasterGuidesForScope();
                if (removedGuides > 0) {
                    changesApplied.push("Remove non-master guides");
                }
            } catch (eg) {}
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

    // Centralized lightweight error logging for ExtendScript
    var ENABLE_DEBUG_LOG = true;
    var __errorLog = [];
    function logError(context, err) {
        try {
            var msg;
            try { msg = err && err.message ? String(err.message) : String(err); } catch (ie) { msg = "[unknown error]"; }
            var entry = (new Date()).toUTCString() + " | " + context + " | " + msg;
            __errorLog.push(entry);
            try { if (ENABLE_DEBUG_LOG && $.writeln) $.writeln("[CharacterCleanup] " + entry); } catch (we) {}
        } catch (le) {}
    }
    function getErrorLog() { return __errorLog; }

    function changeTargets(find, replaceTo, tgts) {
        var any = false;
        for (var ti = 0; ti < tgts.length; ti++) {
            var t = tgts[ti];
            try {
                safeReset();
                app.findGrepPreferences.findWhat = find;
                app.changeGrepPreferences.changeTo = replaceTo;
                var foundItems = [];
                try { foundItems = t.findGrep(); } catch (e3) { logError("changeTargets: t.findGrep failed", e3); foundItems = []; }
                if (foundItems && foundItems.length > 0) {
                    try { t.changeGrep(true); } catch (e4) { logError("changeTargets: t.changeGrep failed", e4); }
                    any = true;
                }
            } catch (e) {
                logError("changeTargets: outer try failed", e);
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
            var maxIterations = 50; // hard cap safeguard
            var iterations = 0;
            var noProgressStreak = 0; // break if we detect no progress across consecutive passes
            while (iterations < maxIterations) {
                var beforeCount = 0;
                try {
                    safeReset();
                    app.findGrepPreferences.findWhat = find;
                    app.changeGrepPreferences.changeTo = replaceTo;
                    var foundItems = [];
                    try { foundItems = t.findGrep(); } catch (e3) { logError("changeIterativeTargets: t.findGrep (before) failed", e3); foundItems = []; }
                    beforeCount = foundItems ? foundItems.length : 0;
                    if (!foundItems || beforeCount === 0) {
                        break; // nothing to do
                    }
                    try { t.changeGrep(true); } catch (e4) { logError("changeIterativeTargets: t.changeGrep failed", e4); }
                    any = true;
                } catch (e) {
                    logError("changeIterativeTargets: outer iteration error", e);
                    // Unexpected error: stop iterating on this target
                    break;
                } finally {
                    safeReset();
                }

                // After the change, check if we are making progress; if not, stop after a couple of tries
                var afterCount = 0;
                try {
                    safeReset();
                    app.findGrepPreferences.findWhat = find;
                    var checkItems = [];
                    try { checkItems = t.findGrep(); } catch (e5) { logError("changeIterativeTargets: t.findGrep (after) failed", e5); checkItems = []; }
                    afterCount = checkItems ? checkItems.length : 0;
                } catch (e6) {
                    logError("changeIterativeTargets: after-count evaluation failed", e6);
                    afterCount = 0; // if we cannot evaluate, err on the side of exiting
                } finally {
                    safeReset();
                }

                if (afterCount >= beforeCount) {
                    noProgressStreak++;
                } else {
                    noProgressStreak = 0;
                }
                if (noProgressStreak >= 2) {
                    // No meaningful progress across iterations; avoid potential infinite loop
                    break;
                }

                iterations++;
            }
        }
        return any;
    }

    // Remove non-master guides according to selected scope
    function removeNonMasterGuidesForScope() {
        var totalRemoved = 0;
        // All Documents
        if (rbAllDocs.value) {
            if (!app.documents || app.documents.length === 0) return 0;
            for (var d = 0; d < app.documents.length; d++) {
                var doc = null;
                try { doc = app.documents[d]; } catch (e0) { doc = null; }
                if (doc && doc.isValid) {
                    totalRemoved += removeNonMasterGuidesInDocument(doc);
                }
            }
            return totalRemoved;
        }
        // Active Document
        if (rbDoc.value) {
            var ad;
            try { ad = app.activeDocument; } catch (e1) { ad = null; }
            if (ad && ad.isValid) totalRemoved += removeNonMasterGuidesInDocument(ad);
            return totalRemoved;
        }
        // Active Page
        if (rbPage.value) {
            var page = getActivePageSafe();
            if (page) totalRemoved += removeGuidesOnPageAndSpread(page);
            return totalRemoved;
        }
        // Story / Frame / Selection -> remove on pages containing selection containers
        var pages = collectPagesFromSelection();
        var unique = {};
        for (var i = 0; i < pages.length; i++) {
            var p = pages[i];
            var pid = "";
            try { pid = String(p.id); } catch (e2) { pid = String(i); }
            if (!unique[pid]) {
                unique[pid] = true;
                totalRemoved += removeGuidesOnPageAndSpread(p);
            }
        }
        return totalRemoved;
    }

    function removeNonMasterGuidesInDocument(doc) {
        var removed = 0;
        var prevLocked;
        try { prevLocked = doc.guidePreferences.guidesLocked; doc.guidePreferences.guidesLocked = false; } catch (e) { prevLocked = null; }
        try {
            // Remove spread guides from non-master spreads
            var spreads;
            try { spreads = doc.spreads.everyItem().getElements(); } catch (e1) { spreads = []; }
            for (var si = 0; si < spreads.length; si++) {
                var sp = spreads[si];
                var ctor; try { ctor = String(sp && sp.constructor && sp.constructor.name); } catch (e2) { ctor = ""; }
                if (ctor === "Spread") {
                    removed += removeGuidesFromSpread(sp);
                }
            }
            // Remove page guides on all document pages
            var pages;
            try { pages = doc.pages.everyItem().getElements(); } catch (e3) { pages = []; }
            for (var pi = 0; pi < pages.length; pi++) {
                removed += removeGuidesFromPage(pages[pi]);
            }
        } catch (e4) {}
        // restore lock state
        try { if (prevLocked !== null) doc.guidePreferences.guidesLocked = prevLocked; } catch (e5) {}
        return removed;
    }

    function removeGuidesOnPageAndSpread(page) {
        var removed = 0;
        if (!page || !page.isValid) return 0;
        var doc; try { doc = page.parent.parent; } catch (e) { doc = null; }
        var prevLocked; try { if (doc) { prevLocked = doc.guidePreferences.guidesLocked; doc.guidePreferences.guidesLocked = false; } } catch (e0) { prevLocked = null; }
        try {
            // Page guides
            removed += removeGuidesFromPage(page);
            // Spread guides (ensure not master spread)
            var spread; try { spread = page.parent; } catch (e1) { spread = null; }
            var ctor; try { ctor = String(spread && spread.constructor && spread.constructor.name); } catch (e2) { ctor = ""; }
            if (ctor === "Spread") {
                removed += removeGuidesFromSpread(spread);
            }
        } catch (e3) {}
        try { if (doc && prevLocked !== null) doc.guidePreferences.guidesLocked = prevLocked; } catch (e4) {}
        return removed;
    }

    function removeGuidesFromSpread(spread) {
        var count = 0;
        if (!spread || !spread.isValid) return 0;
        var guides;
        try { guides = spread.guides.everyItem().getElements(); } catch (e) { guides = []; }
        for (var i = 0; i < guides.length; i++) {
            var g = guides[i];
            if (!g || !g.isValid) continue;
            var layer = null; var prev = null;
            try { layer = g.itemLayer; prev = layer.locked; if (prev) layer.locked = false; } catch (e1) { layer = null; prev = null; }
            try { if (g.locked) g.locked = false; } catch (e2) {}
            try { g.remove(); count++; } catch (e3) {}
            try { if (layer && prev !== null) layer.locked = prev; } catch (e4) {}
        }
        return count;
    }

    function removeGuidesFromPage(page) {
        var count = 0;
        if (!page || !page.isValid) return 0;
        var guides;
        try { guides = page.guides.everyItem().getElements(); } catch (e) { guides = []; }
        for (var i = 0; i < guides.length; i++) {
            var g = guides[i];
            if (!g || !g.isValid) continue;
            var layer = null; var prev = null;
            try { layer = g.itemLayer; prev = layer.locked; if (prev) layer.locked = false; } catch (e1) { layer = null; prev = null; }
            try { if (g.locked) g.locked = false; } catch (e2) {}
            try { g.remove(); count++; } catch (e3) {}
            try { if (layer && prev !== null) layer.locked = prev; } catch (e4) {}
        }
        return count;
    }

    function collectPagesFromSelection() {
        var pages = [];
        try {
            if (!app.selection || app.selection.length === 0) return pages;
            for (var i = 0; i < app.selection.length; i++) {
                var it = app.selection[i];
                var page = null;
                try { page = it.parentPage; } catch (e) { page = null; }
                if (!page) {
                    try {
                        var story = null;
                        try { if (it && it.parentStory && it.parentStory.isValid) story = it.parentStory; } catch (es) { story = null; }
                        if (story) {
                            var containers = [];
                            try { containers = story.textContainers; } catch (ec) { containers = []; }
                            for (var c = 0; c < containers.length; c++) {
                                var p = null; try { p = containers[c].parentPage; } catch (ep) { p = null; }
                                if (p && p.isValid) pages.push(p);
                            }
                        }
                    } catch (e2) {}
                } else if (page && page.isValid) {
                    pages.push(page);
                }
            }
        } catch (e3) {}
        return pages;
    }

    function getActivePageSafe() {
        var page = null;
        try {
            if (app.layoutWindows && app.layoutWindows.length > 0) {
                page = app.layoutWindows[0].activePage;
            } else if (app.activeWindow) {
                page = app.activeWindow.activePage;
            }
        } catch (e) { page = null; }
        return page;
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
                var frames;
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
            for (var s2 = 0; s2 < app.selection.length; s2++) {
                var item = app.selection[s2];
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

            // If any errors were logged, inform the user succinctly
            try {
                var errs = (typeof getErrorLog === "function") ? getErrorLog() : [];
                if (errs && errs.length > 0) {
                    completionDlg.add("statictext", undefined, "Note: " + errs.length + " non-fatal error(s) occurred. See Console for details.");
                }
            } catch (e) {}
        }

        var okGroup = completionDlg.add("group");
        okGroup.alignment = "center";
        var okButton = okGroup.add("button", undefined, "OK");
        okButton.onClick = function() { completionDlg.close(); };
        
        completionDlg.show();
    }
})();
