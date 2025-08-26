/*
 CharacterCleanup: consolidated GREP replacements into a single array and loop.
 Adds a multi-select dialog (with "All") to choose what to clean.
 Preserves behavior and order. Adds a guard for no open document. Resets GREP prefs safely.
*/

(function () {
    // Load shared utilities
    var scriptFile = File($.fileName);
    var utilsFile = File(scriptFile.parent.parent + "/Shared/InDesignUtils.jsx");
    if (utilsFile.exists) {
        $.evalFile(utilsFile);
    } else {
        throw new Error("InDesignUtils.jsx not found. Required for this script to function.");
    }

    // Load ScopeUtils for scope functionality
    var scopeUtilsFile = File(scriptFile.parent.parent + "/Shared/ScopeUtils.jsx");
    if (scopeUtilsFile.exists) {
        $.evalFile(scopeUtilsFile);
    } else {
        throw new Error("ScopeUtils.jsx not found. Required for scope functionality.");
    }

    // Check for active document
    var activeDoc = InDesignUtils.Objects.getActiveDocument();
    if (!activeDoc) {
        InDesignUtils.UI.alert("Open a document before running CharacterCleanup.");
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
    var groupTrimTrailingParagraphs = [["\\r{2,}\\z", "\\r"]];

    // Build UI dialog with side-by-side layout
    var dlg = new Window("dialog", "Character Cleanup");
    dlg.orientation = "column";
    dlg.alignChildren = "left";
    dlg.margins = 16;
    dlg.spacing = 12;

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
    optionsPanel.spacing = 8;

    var allCb = optionsPanel.add("checkbox", undefined, "All");
    var cbFix = optionsPanel.add("checkbox", undefined, "Fix marks order (dagesh before vowels)");
    var cbNorm = optionsPanel.add("checkbox", undefined, "Normalize Hebrew presentation forms (letters with marks)");
    var cbDbl = optionsPanel.add("checkbox", undefined, "Remove double spaces");
    var cbTrail = optionsPanel.add("checkbox", undefined, "Trim trailing paragraph marks at end of story (leave one)");
    var cbGuides = optionsPanel.add("checkbox", undefined, "Remove non-master guides");

    // Create scope panel using shared utility
    var scopeUI = InDesignUtils.Scope.createScopePanel(row);

    // Defaults
    allCb.value = true;
    cbFix.value = true;
    cbNorm.value = true;
    cbDbl.value = true;
    cbTrail.value = true;
    cbGuides.value = true;

    // Helpers to sync the `All` checkbox
    function syncAllFromChildren() {
        allCb.value = cbFix.value && cbNorm.value && cbDbl.value && cbTrail.value && cbGuides.value;
    }
    function setChildren(v) {
        cbFix.value = v;
        cbNorm.value = v;
        cbDbl.value = v;
        cbTrail.value = v;
        cbGuides.value = v;
    }

    // Enable/disable Run button depending on whether any option is selected
    function anyOptionSelected() {
        return cbFix.value || cbNorm.value || cbDbl.value || cbTrail.value || cbGuides.value || allCb.value;
    }
    function updateRunEnabled() {
        try {
            if (runBtn) runBtn.enabled = anyOptionSelected();
        } catch (e) {}
    }

    allCb.onClick = function () {
        setChildren(allCb.value);
        updateRunEnabled();
    };
    cbFix.onClick =
        cbNorm.onClick =
        cbDbl.onClick =
        cbTrail.onClick =
        cbGuides.onClick =
            function () {
                syncAllFromChildren();
                updateRunEnabled();
            };

    var btns = dlg.add("group");
    btns.alignment = "right";
    var cancelBtn = btns.add("button", undefined, "Cancel", { name: "cancel" });
    var runBtn = btns.add("button", undefined, "Run", { name: "ok" });

    // Default/cancel roles for keyboard handling
    dlg.defaultElement = runBtn;
    dlg.cancelElement = cancelBtn;

    updateRunEnabled();

    runBtn.onClick = function () {
        dlg.close(1);
    };
    cancelBtn.onClick = function () {
        dlg.close(0);
    };

    var dlgRes = dlg.show();
    if (dlgRes !== 1) {
        return;
    }

    // Run button is disabled when no options are selected (no alert needed)

    // Determine what actions are requested
    var wantsText = allCb.value || cbFix.value || cbNorm.value || cbDbl.value || cbTrail.value;
    var wantsGuides = allCb.value || cbGuides.value;

    // Resolve text targets only if needed
    var targets = [];
    var hasTextTargets = false;
    if (wantsText) {
        var selectedScope = scopeUI.getSelectedScope();
        targets = InDesignUtils.Scope.resolveScopeTargets(selectedScope);
        hasTextTargets = targets && targets.length > 0;
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

    app.doScript(
        function () {
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
        },
        ScriptLanguage.JAVASCRIPT,
        undefined,
        UndoModes.ENTIRE_SCRIPT,
        "Character Cleanup"
    );

    // Show completion confirmation
    var message;
    if (changesApplied.length === 0) {
        message = "Nothing to clean - no changes were made.";
    } else {
        // Remove duplicates from changesApplied
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
        message = "Character cleanup completed successfully!\nThe following actions were performed:\n\n";
        for (var j = 0; j < uniqueChanges.length; j++) {
            message += "• " + uniqueChanges[j] + "\n";
        }
    }
    InDesignUtils.UI.showMessage("Cleanup Complete", message);

    function pushPairs(dest, src) {
        for (var i = 0; i < src.length; i++) dest.push(src[i]);
    }

    function changeTargets(find, replaceTo, tgts) {
        var any = false;
        return InDesignUtils.FindChange.withCleanPrefs(function () {
            for (var ti = 0; ti < tgts.length; ti++) {
                var t = tgts[ti];
                try {
                    app.findGrepPreferences.findWhat = find;
                    app.changeGrepPreferences.changeTo = replaceTo;
                    var foundItems = t.findGrep();
                    if (foundItems && foundItems.length > 0) {
                        t.changeGrep(true);
                        any = true;
                    }
                } catch (e) {
                    // Continue with other targets on error
                }
            }
            return any;
        });
    }

    function changeIterativeTargets(find, replaceTo, tgts) {
        var any = false;
        return InDesignUtils.FindChange.withCleanPrefs(function () {
            for (var ti = 0; ti < tgts.length; ti++) {
                var t = tgts[ti];
                var maxIterations = 50; // hard cap safeguard
                var iterations = 0;
                var noProgressStreak = 0; // break if we detect no progress across consecutive passes

                while (iterations < maxIterations) {
                    var beforeCount = 0;
                    try {
                        app.findGrepPreferences.findWhat = find;
                        app.changeGrepPreferences.changeTo = replaceTo;
                        var foundItems = t.findGrep();
                        beforeCount = foundItems ? foundItems.length : 0;
                        if (!foundItems || beforeCount === 0) {
                            break; // nothing to do
                        }
                        t.changeGrep(true);
                        any = true;
                    } catch (e) {
                        // Unexpected error: stop iterating on this target
                        break;
                    }

                    // After the change, check if we are making progress
                    var afterCount = 0;
                    try {
                        app.findGrepPreferences.findWhat = find;
                        var checkItems = t.findGrep();
                        afterCount = checkItems ? checkItems.length : 0;
                    } catch (e2) {
                        afterCount = 0; // if we cannot evaluate, err on the side of exiting
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
        });
    }

    // Remove non-master guides according to selected scope
    function removeNonMasterGuidesForScope() {
        var totalRemoved = 0;
        var selectedScope = scopeUI.getSelectedScope();

        // All Documents
        if (selectedScope === "allDocs") {
            if (!app.documents || app.documents.length === 0) return 0;
            for (var d = 0; d < app.documents.length; d++) {
                var doc = null;
                try {
                    doc = app.documents[d];
                } catch (e0) {
                    doc = null;
                }
                if (InDesignUtils.Error.isValid(doc)) {
                    totalRemoved += removeNonMasterGuidesInDocument(doc);
                }
            }
            return totalRemoved;
        }
        // Active Document
        if (selectedScope === "doc") {
            var ad;
            try {
                ad = app.activeDocument;
            } catch (e1) {
                ad = null;
            }
            if (InDesignUtils.Error.isValid(ad)) totalRemoved += removeNonMasterGuidesInDocument(ad);
            return totalRemoved;
        }
        // Active Page
        if (selectedScope === "page") {
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
            try {
                pid = String(p.id);
            } catch (e2) {
                pid = String(i);
            }
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
        try {
            prevLocked = doc.guidePreferences.guidesLocked;
            doc.guidePreferences.guidesLocked = false;
        } catch (e) {
            prevLocked = null;
        }
        try {
            // Remove spread guides from non-master spreads
            var spreads;
            try {
                spreads = doc.spreads.everyItem().getElements();
            } catch (e1) {
                spreads = [];
            }
            for (var si = 0; si < spreads.length; si++) {
                var sp = spreads[si];
                var ctor;
                try {
                    ctor = String(sp && sp.constructor && sp.constructor.name);
                } catch (e2) {
                    ctor = "";
                }
                if (ctor === "Spread") {
                    removed += removeGuidesFromSpread(sp);
                }
            }
            // Remove page guides on all document pages
            var pages;
            try {
                pages = doc.pages.everyItem().getElements();
            } catch (e3) {
                pages = [];
            }
            for (var pi = 0; pi < pages.length; pi++) {
                removed += removeGuidesFromPage(pages[pi]);
            }
        } catch (e4) {}
        // restore lock state
        try {
            if (prevLocked !== null) doc.guidePreferences.guidesLocked = prevLocked;
        } catch (e5) {}
        return removed;
    }

    function removeGuidesOnPageAndSpread(page) {
        var removed = 0;
        if (!InDesignUtils.Error.isValid(page)) return 0;
        var doc;
        try {
            doc = page.parent.parent;
        } catch (e) {
            doc = null;
        }
        var prevLocked;
        try {
            if (doc) {
                prevLocked = doc.guidePreferences.guidesLocked;
                doc.guidePreferences.guidesLocked = false;
            }
        } catch (e0) {
            prevLocked = null;
        }
        try {
            // Page guides
            removed += removeGuidesFromPage(page);
            // Spread guides (ensure not master spread)
            var spread;
            try {
                spread = page.parent;
            } catch (e1) {
                spread = null;
            }
            var ctor;
            try {
                ctor = String(spread && spread.constructor && spread.constructor.name);
            } catch (e2) {
                ctor = "";
            }
            if (ctor === "Spread") {
                removed += removeGuidesFromSpread(spread);
            }
        } catch (e3) {}
        try {
            if (doc && prevLocked !== null) doc.guidePreferences.guidesLocked = prevLocked;
        } catch (e4) {}
        return removed;
    }

    function removeGuidesFromSpread(spread) {
        var count = 0;
        if (!InDesignUtils.Error.isValid(spread)) return 0;
        var guides;
        try {
            guides = spread.guides.everyItem().getElements();
        } catch (e) {
            guides = [];
        }
        for (var i = 0; i < guides.length; i++) {
            var g = guides[i];
            if (!InDesignUtils.Error.isValid(g)) continue;
            var layer = null;
            var prev = null;
            try {
                layer = g.itemLayer;
                prev = layer.locked;
                if (prev) layer.locked = false;
            } catch (e1) {
                layer = null;
                prev = null;
            }
            try {
                if (g.locked) g.locked = false;
            } catch (e2) {}
            try {
                g.remove();
                count++;
            } catch (e3) {}
            try {
                if (layer && prev !== null) layer.locked = prev;
            } catch (e4) {}
        }
        return count;
    }

    function removeGuidesFromPage(page) {
        var count = 0;
        if (!InDesignUtils.Error.isValid(page)) return 0;
        var guides;
        try {
            guides = page.guides.everyItem().getElements();
        } catch (e) {
            guides = [];
        }
        for (var i = 0; i < guides.length; i++) {
            var g = guides[i];
            if (!InDesignUtils.Error.isValid(g)) continue;
            var layer = null;
            var prev = null;
            try {
                layer = g.itemLayer;
                prev = layer.locked;
                if (prev) layer.locked = false;
            } catch (e1) {
                layer = null;
                prev = null;
            }
            try {
                if (g.locked) g.locked = false;
            } catch (e2) {}
            try {
                g.remove();
                count++;
            } catch (e3) {}
            try {
                if (layer && prev !== null) layer.locked = prev;
            } catch (e4) {}
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
                try {
                    page = it.parentPage;
                } catch (e) {
                    page = null;
                }
                if (!page) {
                    try {
                        var story = null;
                        try {
                            if (it && InDesignUtils.Error.isValid(it.parentStory)) story = it.parentStory;
                        } catch (es) {
                            story = null;
                        }
                        if (story) {
                            var containers = [];
                            try {
                                containers = story.textContainers;
                            } catch (ec) {
                                containers = [];
                            }
                            for (var c = 0; c < containers.length; c++) {
                                var p = null;
                                try {
                                    p = containers[c].parentPage;
                                } catch (ep) {
                                    p = null;
                                }
                                if (InDesignUtils.Error.isValid(p)) pages.push(p);
                            }
                        }
                    } catch (e2) {}
                } else if (InDesignUtils.Error.isValid(page)) {
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
        } catch (e) {
            page = null;
        }
        return page;
    }
})();
