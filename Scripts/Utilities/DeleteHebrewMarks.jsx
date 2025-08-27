/*
DeleteHebrewMarks.jsx
Purpose: Remove Hebrew marks with selective options: Nikud, Teamim, Meteg (conditional or all), or all combined.
Public API: Entry point on load; shows dialog and executes based on user choice.
Dependencies: InDesignUtils.jsx, FindChangeUtils.jsx, ScopeUtils.jsx, UIUtils.jsx
Usage: Place under Scripts Panel and run with a document open.
*/

// Load shared utilities
try {
    var scriptFile = File($.fileName);
    var utilsFile = File(scriptFile.parent.parent + "/Shared/InDesignUtils.jsx");
    if (utilsFile.exists) $.evalFile(utilsFile);

    // Load Find/Change utilities explicitly
    var findChangeFile = File(scriptFile.parent.parent + "/Shared/FindChangeUtils.jsx");
    if (findChangeFile.exists) $.evalFile(findChangeFile);

    // Load ScopeUtils for scope functionality
    var scopeUtilsFile = File(scriptFile.parent.parent + "/Shared/ScopeUtils.jsx");
    if (scopeUtilsFile.exists) $.evalFile(scopeUtilsFile);

    // Load UI utilities
    var uiUtilsFile = File(scriptFile.parent.parent + "/Shared/UIUtils.jsx");
    if (uiUtilsFile.exists) $.evalFile(uiUtilsFile);
} catch (e) {
    throw new Error("Cannot load shared utilities: " + e.toString());
}

function showAlert(message) {
    UIUtils.alert(String(message), "Hebrew Marks Deletion");
}

/* global ScopeUtils, FindChange, UIUtils */
// Create dialog with radio buttons for user selection
function createDialog() {
    var dialog = new Window("dialog", "Hebrew Marks Deletion");
    dialog.orientation = "column";
    dialog.alignChildren = "left";
    dialog.spacing = 12;
    dialog.margins = 16;

    // Title
    var titleGroup = dialog.add("group");
    titleGroup.add("statictext", undefined, "Choose what to remove from Hebrew text:");

    // Options and Scope side-by-side
    var row = dialog.add("group");
    row.orientation = "row";
    row.alignChildren = "top";
    row.spacing = 12;

    // Options panel (left)
    var radioGroup = row.add("panel", undefined, "Options");
    radioGroup.orientation = "column";
    radioGroup.alignChildren = "left";
    radioGroup.spacing = 8;
    radioGroup.margins = 12;

    var nikudRadio = radioGroup.add("radiobutton", undefined, "Nikud");
    var teamimRadio = radioGroup.add("radiobutton", undefined, "Teamim");
    var mesegConditionalRadio = radioGroup.add("radiobutton", undefined, "Meteg not preceded by a Kamatz");
    var mesegAllRadio = radioGroup.add("radiobutton", undefined, "All Meteg");
    var allRadio = radioGroup.add("radiobutton", undefined, "All of the above");

    // Defaults
    nikudRadio.value = true;

    // Create scope panel using shared utility
    var scopeUI = ScopeUtils.createScopePanel(row);

    // Bottom buttons (right-aligned): Cancel then Run
    var buttonGroup = dialog.add("group");
    buttonGroup.alignment = "right";
    buttonGroup.spacing = 8;
    var cancelButton = buttonGroup.add("button", undefined, "Cancel", { name: "cancel" });
    var runButton = buttonGroup.add("button", undefined, "Run", { name: "ok" });
    dialog.defaultElement = runButton;
    dialog.cancelElement = cancelButton;

    var chosen = null;
    var scopeChoice = null;

    runButton.onClick = function () {
        if (nikudRadio.value) chosen = "Nikud";
        else if (teamimRadio.value) chosen = "Teamim";
        else if (mesegConditionalRadio.value) chosen = "Meteg not preceded by a Kamatz";
        else if (mesegAllRadio.value) chosen = "All Meteg";
        else if (allRadio.value) chosen = "All of the above";

        scopeChoice = scopeUI.getSelectedScope();
        dialog.close(1);
    };
    cancelButton.onClick = function () {
        dialog.close(0);
    };

    var result = dialog.show();
    if (result === 1 && chosen) {
        return { choice: chosen, scope: scopeChoice };
    }
    return null; // User cancelled
}

// Guard: ensure document context exists
var activeDoc = InDesignUtils.Objects.getActiveDocument();
if (!activeDoc) {
    showAlert("Open a document before running Hebrew Marks Deletion.");
} else {
    // Get user selection and scope in a single dialog, then execute
    var userChoice = createDialog();
    if (userChoice && userChoice.choice) {
        var scopeChoice = userChoice.scope;
        var targets = ScopeUtils.resolveScopeTargets(scopeChoice);
        if (!targets || targets.length === 0) {
            // message already shown in resolver
        } else {
            app.doScript(
                function () {
                    switch (userChoice.choice) {
                        case "Nikud":
                            deleteNikud(false, targets);
                            break;
                        case "Teamim":
                            deleteTeamim(false, targets);
                            break;
                        case "Meteg not preceded by a Kamatz":
                            deleteMesegConditional(false, targets);
                            break;
                        case "All Meteg":
                            deleteMesegAll(false, targets);
                            break;
                        case "All of the above":
                            var foundNikud = deleteNikud(true, targets);
                            var foundTeamim = deleteTeamim(true, targets);
                            var foundMeseg = deleteMesegAll(true, targets);
                            var foundAny = foundNikud || foundTeamim || foundMeseg;
                            if (foundAny) {
                                showAlert("All Hebrew marks deletion completed!");
                            } else {
                                showAlert("No Hebrew marks found to delete.");
                            }
                            break;
                    }
                },
                ScriptLanguage.JAVASCRIPT,
                undefined,
                UndoModes.ENTIRE_SCRIPT,
                "Delete Hebrew Marks"
            );
        }
    }
}

function changeAcrossTargets(findPattern, replaceText, targets) {
    var foundAny = false;
    for (var i = 0; i < targets.length; i++) {
        var t = targets[i];
        try {
            var result = FindChange.withCleanPrefs(
                function (scope) {
                    app.findGrepPreferences.findWhat = findPattern;
                    app.changeGrepPreferences.changeTo = replaceText;
                    return scope.changeGrep();
                },
                t,
                { engine: "grep" }
            );

            if (result && result.length && result.length > 0) {
                foundAny = true;
            }
        } catch (e) {
            // Continue with next target
        }
    }
    return foundAny;
}

function notifyDeletionResult(context, foundAny) {
    if (foundAny) {
        showAlert(context + " completed.");
    } else {
        showAlert("No Hebrew marks found to delete.");
    }
}

function deleteNikud(silent, targets) {
    // Hebrew vowel points (nikud)
    var nikudPattern =
        "(\\x{05B0}|\\x{05B1}|\\x{05B2}|\\x{05B3}|\\x{05B4}|\\x{05B5}|\\x{05B6}|\\x{05B7}|\\x{05B8}|\\x{05B9}|\\x{05BA}|\\x{05BB}|\\x{05BC}|\\x{05BD}|\\x{05BE}|\\x{05BF}|\\x{05C0}|\\x{05C1}|\\x{05C2}|\\x{05C3}|\\x{05C4}|\\x{05C5}|\\x{05C7})";
    var foundAny = changeAcrossTargets(nikudPattern, "", targets);
    if (!silent) {
        notifyDeletionResult("Nikud deletion", foundAny);
    }
    return foundAny;
}

function deleteTeamim(silent, targets) {
    // Hebrew cantillation marks (teamim)
    var teamimPattern =
        "(\\x{0591}|\\x{0592}|\\x{0593}|\\x{0594}|\\x{0595}|\\x{0596}|\\x{0597}|\\x{0598}|\\x{0599}|\\x{059A}|\\x{059B}|\\x{059C}|\\x{059D}|\\x{05AE}|\\x{059E}|\\x{059F}|\\x{05A0}|\\x{05A1}|\\x{05A2}|\\x{05A3}|\\x{05A4}|\\x{05A5}|\\x{05A6}|\\x{05A7}|\\x{05A8}|\\x{05A9}|\\x{05AA}|\\x{05AB}|\\x{05AC}|\\x{05AD}|\\x{05AF}|\\x{05F3}|\\x{05F4})";
    var foundAny = changeAcrossTargets(teamimPattern, "", targets);
    if (!silent) {
        notifyDeletionResult("Teamim deletion", foundAny);
    }
    return foundAny;
}

function deleteMesegConditional(silent, targets) {
    // Meteg (\x{05BD}) but only when NOT preceded by qamatz (\x{05B8})
    var mesegPattern = "(?<!\\x{05B8})\\x{05BD}";
    var foundAny = changeAcrossTargets(mesegPattern, "", targets);
    if (!silent) {
        notifyDeletionResult("Meteg (selective) deletion", foundAny);
    }
    return foundAny;
}

function deleteMesegAll(silent, targets) {
    // Delete all meteg characters (\x{05BD}) regardless of context
    var mesegPattern = "\\x{05BD}";
    var foundAny = changeAcrossTargets(mesegPattern, "", targets);
    if (!silent) {
        notifyDeletionResult("Meteg (all) deletion", foundAny);
    }
    return foundAny;
}
