/**
 * Purpose: Convert one Hebrew nekuda to another within a chosen scope; provides a guided UI and respects repository scope conventions.
 * Public API: Script entry point (IIFE). No exported functions; run via the InDesign Scripts panel.
 * Dependencies: Adobe InDesign ExtendScript runtime (app). Shared modules loaded at runtime: InDesignUtils.jsx, FindChangeUtils.jsx (FindChange), ScopeUtils.jsx, UIUtils.jsx. Requires an open document.
 * Usage:
 *   // In InDesign Scripts panel: double-click "ChangeNekuda.jsx" with a document open and choose From/To and Scope.
 */
/* global UIUtils, ScopeUtils, FindChange */

(function () {
    // Load shared utilities
    var scriptFile = File($.fileName);
    var sharedRoot = scriptFile.parent.parent + "/Shared/";

    function _load(fileName, required) {
        var f = File(sharedRoot + fileName);
        if (f.exists) {
            $.evalFile(f);
            return true;
        } else if (required) {
            throw new Error(fileName + " not found in Shared/");
        }
        return false;
    }

    _load("InDesignUtils.jsx", true);
    _load("FindChangeUtils.jsx", true);
    _load("ScopeUtils.jsx", true);
    _load("UIUtils.jsx", true);

    // Guard: ensure there is an active document context
    var activeDoc =
        InDesignUtils && InDesignUtils.Objects && InDesignUtils.Objects.getActiveDocument
            ? InDesignUtils.Objects.getActiveDocument()
            : app.documents && app.documents.length > 0
              ? app.activeDocument
              : null;
    if (!activeDoc) {
        UIUtils.alert("Open a document before running Change Nekuda.", "Change Nekuda");
        return;
    }

    // Original order list of nekudos (names and patterns)
    // Note: patterns use GREP Unicode escapes (\x{XXXX}) for reliability
    var NEKUDOS = [
        { id: "kamatz", name: "קמץ", find: "\\x{05B8}", change: "\\x{05B8}" },
        { id: "pasach", name: "פתח", find: "\\x{05B7}", change: "\\x{05B7}" },
        { id: "tzeirei", name: "צירי", find: "\\x{05B5}", change: "\\x{05B5}" },
        { id: "segol", name: "סגול", find: "\\x{05B6}", change: "\\x{05B6}" },
        { id: "sheva", name: "שבא", find: "\\x{05B0}", change: "\\x{05B0}" },
        { id: "cholamChaser", name: "חולם חסר", find: "\\x{05B9}", change: "\\x{05B9}" },
        {
            id: "cholamMalei",
            name: "חולם מלא",
            find: "\\x{05D5}\\x{05B9}",
            change: "\\x{05D5}\\x{05B9}"
        },
        { id: "chirikChaser", name: "חיריק חסר", find: "\\x{05B4}", change: "\\x{05B4}" },
        {
            id: "chirikMalei",
            name: "חיריק מלא",
            find: "\\x{05B4}\\x{05D9}",
            change: "\\x{05B4}\\x{05D9}"
        },
        { id: "kubutz", name: "קובוץ", find: "\\x{05BB}", change: "\\x{05BB}" },
        { id: "shuruk", name: "שורוק", find: "\\x{05D5}\\x{05BC}", change: "\\x{05D5}\\x{05BC}" },
        { id: "chatafKamatz", name: "חטף קמץ", find: "\\x{05B3}", change: "\\x{05B3}" },
        { id: "chatafPasach", name: "חטף פתח", find: "\\x{05B2}", change: "\\x{05B2}" },
        { id: "chatafSegol", name: "חטף סגול", find: "\\x{05B1}", change: "\\x{05B1}" },
        { id: "shinDot", name: "נקודת שׁ", find: "\\x{05C1}", change: "\\x{05C1}" },
        { id: "sinDot", name: "נקודת שׂ", find: "\\x{05C2}", change: "\\x{05C2}" }
    ];

    function showAlert(msg) {
        UIUtils.alert(String(msg), "Change Nekuda");
    }

    // GREP options used during scans and replacements
    var GREP_OPTIONS = {
        includeFootnotes: true,
        includeHiddenLayers: true,
        includeLockedLayersForFind: true,
        includeLockedStoriesForFind: true,
        includeMasterPages: true,
        kanaSensitive: false,
        searchBackwards: false,
        widthSensitive: false
    };

    function createDialog() {
        var dlg = new Window("dialog", "Change Nekuda");
        dlg.orientation = "column";
        dlg.alignChildren = "left";
        dlg.margins = 16;
        dlg.spacing = 12;

        dlg.add("statictext", undefined, "Select a nekuda to replace and a target nekuda:");

        var row = dlg.add("group");
        row.orientation = "row";
        row.alignChildren = "top";
        row.spacing = 12;

        // Three columns: From | To | Scope
        var fromPanel = row.add("panel", undefined, "Change From");
        fromPanel.orientation = "column";
        fromPanel.alignChildren = "left";
        fromPanel.margins = 12;

        // Radio buttons for From
        var fromRadios = [];
        for (var i = 0; i < NEKUDOS.length; i++) {
            var rb = fromPanel.add("radiobutton", undefined, NEKUDOS[i].name);
            rb.enabled = false; // will be enabled if found in scope after scan
            fromRadios.push(rb);
        }

        var toPanel = row.add("panel", undefined, "Change To");
        toPanel.orientation = "column";
        toPanel.alignChildren = "left";
        toPanel.margins = 12;

        // Radio buttons for To (all enabled by default)
        var toRadios = [];
        for (var j = 0; j < NEKUDOS.length; j++) {
            var trb = toPanel.add("radiobutton", undefined, NEKUDOS[j].name);
            toRadios.push(trb);
        }

        // Right column: Scope panel
        var scopeUI = ScopeUtils.createScopePanel(row);

        // Bottom buttons
        var btns = dlg.add("group");
        btns.alignment = "right";
        var cancelBtn = btns.add("button", undefined, "Cancel", { name: "cancel" });
        var runBtn = btns.add("button", undefined, "Run", { name: "ok" });
        dlg.defaultElement = runBtn;
        dlg.cancelElement = cancelBtn;

        // Helpers
        function getSelectedFromIndex() {
            for (var idx = 0; idx < fromRadios.length; idx++) if (fromRadios[idx].value) return idx;
            return -1;
        }
        function getSelectedToIndex() {
            for (var idx = 0; idx < toRadios.length; idx++) if (toRadios[idx].value) return idx;
            return -1;
        }
        function updateRunEnabled() {
            var fi = getSelectedFromIndex();
            var ti = getSelectedToIndex();
            var hasValidFrom = fi >= 0 && fromRadios[fi].enabled;
            var hasValidTo = ti >= 0; // To radios are always enabled
            var notSame = hasValidFrom && hasValidTo ? fi !== ti : false;
            runBtn.enabled = hasValidFrom && hasValidTo && notSame;
        }

        function scanAndEnableFrom() {
            var scopeChoice = scopeUI.getSelectedScope();
            var targets = ScopeUtils.resolveScopeTargets(scopeChoice);

            // Reset From enablement and labels
            for (var r = 0; r < fromRadios.length; r++) {
                fromRadios[r].enabled = false;
                fromRadios[r].text = NEKUDOS[r].name;
                fromRadios[r].value = false;
            }
            // Always enable ALL To radios with base labels (no conditions)
            for (var r2 = 0; r2 < toRadios.length; r2++) {
                toRadios[r2].enabled = true;
                toRadios[r2].text = NEKUDOS[r2].name;
            }
            if (!targets || targets.length === 0) {
                updateRunEnabled();
                return;
            }
            // Count occurrences for each nekuda across targets to enable From radios and show counts
            for (var k = 0; k < NEKUDOS.length; k++) {
                var total = 0;
                try {
                    // Use direct GREP search without FindChange wrapper to avoid closure issues
                    app.findGrepPreferences = NothingEnum.nothing;
                    app.changeGrepPreferences = NothingEnum.nothing;

                    // Apply GREP options directly
                    try {
                        app.findChangeGrepOptions.includeFootnotes = GREP_OPTIONS.includeFootnotes;
                        app.findChangeGrepOptions.includeHiddenLayers = GREP_OPTIONS.includeHiddenLayers;
                        app.findChangeGrepOptions.includeLockedLayersForFind = GREP_OPTIONS.includeLockedLayersForFind;
                        app.findChangeGrepOptions.includeLockedStoriesForFind =
                            GREP_OPTIONS.includeLockedStoriesForFind;
                        app.findChangeGrepOptions.includeMasterPages = GREP_OPTIONS.includeMasterPages;
                    } catch (optErr) {
                        // Ignore options errors; continue with search
                    }

                    for (var t = 0; t < targets.length; t++) {
                        try {
                            app.findGrepPreferences.findWhat = NEKUDOS[k].find;
                            var found = targets[t].findGrep();
                            var foundCount = found ? found.length : 0;
                            total += foundCount;
                        } catch (eInner) {
                            // Ignore individual search errors; continue
                        }
                    }

                    // Clear preferences after search
                    app.findGrepPreferences = NothingEnum.nothing;
                    app.changeGrepPreferences = NothingEnum.nothing;
                } catch (e) {
                    // Ignore overall search errors; continue with next nekuda
                }
                if (total > 0) {
                    fromRadios[k].enabled = true;
                    fromRadios[k].text = NEKUDOS[k].name;
                }
            }
            updateRunEnabled();
        }

        // Wire events
        for (var s = 0; s < fromRadios.length; s++) {
            (function (ii) {
                fromRadios[ii].onClick = function () {
                    updateRunEnabled();
                };
            })(s);
        }
        // Wire to radios
        for (var s2 = 0; s2 < toRadios.length; s2++) {
            (function (ii) {
                toRadios[ii].onClick = function () {
                    updateRunEnabled();
                };
            })(s2);
        }

        // Rescan when scope choice changes
        scopeUI.rbAllDocs.onClick = scanAndEnableFrom;
        scopeUI.rbDoc.onClick = scanAndEnableFrom;
        scopeUI.rbPage.onClick = scanAndEnableFrom;
        scopeUI.rbStory.onClick = scanAndEnableFrom;
        if (scopeUI.rbFrame) scopeUI.rbFrame.onClick = scanAndEnableFrom;
        scopeUI.rbSelection.onClick = scanAndEnableFrom;

        // Initial scan
        scanAndEnableFrom();

        // Validate and close
        runBtn.onClick = function () {
            var fi = getSelectedFromIndex();
            var ti = getSelectedToIndex();
            if (fi < 0 || !fromRadios[fi].enabled) {
                UIUtils.alert("Choose a nekuda to replace (enabled item)", "Change Nekuda");
                return;
            }
            if (ti < 0) {
                UIUtils.alert("Choose a target nekuda in 'Change To'", "Change Nekuda");
                return;
            }
            if (fi === ti) {
                UIUtils.alert("'Change From' and 'Change To' cannot be the same.", "Change Nekuda");
                return;
            }
            dlg.close(1);
        };
        cancelBtn.onClick = function () {
            dlg.close(0);
        };

        var res = dlg.show();
        if (res !== 1) return null;
        return {
            scope: scopeUI.getSelectedScope(),
            fromIndex: getSelectedFromIndex(),
            toIndex: getSelectedToIndex()
        };
    }

    function replaceAcrossTargets(fromIdx, toIdx, targets) {
        var fromPattern = NEKUDOS[fromIdx].find;
        var toText = NEKUDOS[toIdx].change;
        var changedTotal = 0;

        var results = FindChange.runFindChange(
            {
                engine: "grep",
                find: { findWhat: fromPattern },
                change: { changeTo: toText },
                scope: "document",
                target: targets && targets.length ? targets[0] : activeDoc
            },
            function (config, results) {
                return FindChange.withFindChange("grep", GREP_OPTIONS, function () {
                    for (var i = 0; i < targets.length; i++) {
                        var t = targets[i];
                        try {
                            app.findGrepPreferences.findWhat = fromPattern;
                            app.changeGrepPreferences.changeTo = toText;
                            var foundItems = t.findGrep();
                            var count = foundItems ? foundItems.length : 0;
                            results.totalFound += count;
                            if (count > 0) {
                                t.changeGrep(true);
                                results.totalChanged += count;
                            }
                        } catch (e) {
                            results.errors.push({ target: FindChange._getTargetName(t), error: e.toString() });
                        }
                    }
                    return results;
                });
            }
        );

        changedTotal = results.totalChanged || 0;
        return changedTotal;
    }

    // Run flow
    var selection = createDialog();
    if (!selection) return; // cancelled

    var scopeChoice = selection.scope;
    var targets = ScopeUtils.resolveScopeTargets(scopeChoice);
    if (!targets || targets.length === 0) {
        // Resolver already alerted if needed
        return;
    }

    app.doScript(
        function () {
            var changed = replaceAcrossTargets(selection.fromIndex, selection.toIndex, targets);
            if (changed > 0) {
                showAlert("Change Nekuda completed: " + changed + " replacements made.");
            } else {
                showAlert("No matching nekuda found to replace.");
            }
        },
        ScriptLanguage.JAVASCRIPT,
        undefined,
        UndoModes.ENTIRE_SCRIPT,
        "Change Nekuda"
    );
})();
