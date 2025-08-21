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

    // Build UI dialog with multi-select and an `All` option
    var dlg = new Window("dialog", "Character Cleanup");
    dlg.orientation = "column";
    dlg.alignChildren = "left";
    dlg.margins = 16;

    dlg.add("statictext", undefined, "Select the cleanup actions to run:");

    var allCb = dlg.add("checkbox", undefined, "All");
    var panel = dlg.add("panel", undefined, "Options");
    panel.orientation = "column";
    panel.alignChildren = "left";
    panel.margins = 12;
    panel.spacing = 6;

    var cbFix = panel.add("checkbox", undefined, "Fix marks order (dagesh before vowels)");
    var cbNorm = panel.add("checkbox", undefined, "Normalize Hebrew presentation forms (letters with marks)");
    var cbDbl = panel.add("checkbox", undefined, "Remove double spaces");
    var cbTrail = panel.add("checkbox", undefined, "Trim trailing paragraph marks at end of story (leave one)");

    // Default to All selected
    allCb.value = true;
    cbFix.value = true;
    cbNorm.value = true;
    cbDbl.value = true;
    cbTrail.value = true;

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
    var okBtn = btns.add("button", undefined, "OK");
    var cancelBtn = btns.add("button", undefined, "Cancel");

    okBtn.onClick = function () { dlg.close(1); };
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

    for (var i = 0; i < toRun.length; i++) {
        var pair = toRun[i];
        var actionName = actionNames[Math.floor(i / (toRun.length / actionNames.length))];
        
        // Special handling for double space removal - make it iterative
        if (pair[0] === "\\x{0020}\\x{0020}") {
            if (changeIterative(pair[0], pair[1])) {
                changesApplied.push(actionName);
            }
        } else {
            if (change(pair[0], pair[1])) {
                changesApplied.push(actionName);
            }
        }
    }

    // Show completion confirmation
    showCompletionDialog(changesApplied);

    function pushPairs(dest, src) {
        for (var i = 0; i < src.length; i++) dest.push(src[i]);
    }

    function change(find, replaceTo) {
        // Reset preferences, run, and always reset again
        var foundItems = [];
        try {
            app.findGrepPreferences = null;
            app.changeGrepPreferences = null;
            app.findGrepPreferences.findWhat = find;
            app.changeGrepPreferences.changeTo = replaceTo;
            foundItems = app.activeDocument.findGrep();
            if (foundItems.length > 0) {
                app.activeDocument.changeGrep(true);
                return true;
            }
        } catch (e) {
            // Swallow to continue processing other replacements
        } finally {
            app.findGrepPreferences = null;
            app.changeGrepPreferences = null;
        }
        return false;
    }

    function changeIterative(find, replaceTo) {
        // For double space removal, keep iterating until no more changes
        var totalChanges = false;
        var maxIterations = 10; // Safety limit
        var iterations = 0;
        
        while (iterations < maxIterations) {
            try {
                app.findGrepPreferences = null;
                app.changeGrepPreferences = null;
                app.findGrepPreferences.findWhat = find;
                app.changeGrepPreferences.changeTo = replaceTo;
                
                var foundItems = app.activeDocument.findGrep();
                if (foundItems.length === 0) {
                    break; // No more matches found
                }
                
                app.activeDocument.changeGrep(true);
                totalChanges = true;
                iterations++;
            } catch (e) {
                break;
            } finally {
                app.findGrepPreferences = null;
                app.changeGrepPreferences = null;
            }
        }
        return totalChanges;
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
