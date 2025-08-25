// Hebrew Marks Deletion Script
// Combines functionality to delete Nikud, Teamim, Meseg, or combination

// InDesign-style message dialog helper and alert override
function __showMessage__(title, message) {
    var w = new Window('dialog', title || 'Message');
    w.orientation = 'column';
    w.margins = 16;
    w.spacing = 12;
    var msg = w.add('statictext', undefined, message, { multiline: true });
    msg.characters = 60;
    var row = w.add('group');
    row.alignment = 'right';
    row.spacing = 8;
    var okBtn = row.add('button', undefined, 'OK', { name: 'ok' });
    w.defaultElement = okBtn;
    w.cancelElement = okBtn;
    w.center();
    w.show();
}
function showAlert(message) { __showMessage__('Hebrew Marks Deletion', String(message)); }

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

    // Scope panel (right)
    var scopePanel = row.add("panel", undefined, "Scope");
    scopePanel.orientation = "column";
    scopePanel.alignChildren = "left";
    scopePanel.margins = 12;
    scopePanel.spacing = 8;

    // Scope options with conditional availability
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

    runButton.onClick = function() {
        if (nikudRadio.value) chosen = "Nikud";
        else if (teamimRadio.value) chosen = "Teamim";
        else if (mesegConditionalRadio.value) chosen = "Meteg not preceded by a Kamatz";
        else if (mesegAllRadio.value) chosen = "All Meteg";
        else if (allRadio.value) chosen = "All of the above";

        if (rbAllDocs.value) scopeChoice = "allDocs";
        else if (rbDoc.value) scopeChoice = "doc";
        else if (rbPage.value) scopeChoice = "page";
        else if (rbStory && rbStory.value) scopeChoice = "story";
        else if (rbFrame && rbFrame.value) scopeChoice = "frame";
        else if (rbSelection.value) scopeChoice = "selection";
        dialog.close(1);
    };
    cancelButton.onClick = function() { dialog.close(0); };

    var result = dialog.show();
    if (result === 1 && chosen) {
        return { choice: chosen, scope: scopeChoice };
    }
    return null; // User cancelled
}

// Guard: ensure document context exists
if (!app || !app.documents || app.documents.length === 0) {
    showAlert("Open a document before running Hebrew Marks Deletion.");
} else {
    // Get user selection and scope in a single dialog, then execute
    var userChoice = createDialog();
    if (userChoice && userChoice.choice) {
        var scopeChoice = userChoice.scope;
        var targets = resolveScopeTargets(scopeChoice);
        if (!targets || targets.length === 0) {
            // message already shown in resolver
        } else {
            app.doScript(function(){
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
                }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Delete Hebrew Marks");
            }
        }
    }


function resolveScopeTargets(scope) {
    var tgts = [];
    if (scope === "allDocs") {
        if (!app.documents || app.documents.length === 0) { showAlert("No open documents."); return []; }
        for (var d = 0; d < app.documents.length; d++) { try { if (app.documents[d].isValid) tgts.push(app.documents[d]); } catch (e) {} }
        return tgts;
    }
    if (scope === "doc") {
        try { var doc = app.activeDocument; if (doc && doc.isValid) tgts.push(doc); else showAlert("No active document."); } catch (e2) { showAlert("No active document."); }
        return tgts;
    }
    if (scope === "story") {
        var story = null;
        try {
            if (app.selection && app.selection.length > 0) {
                var sel = app.selection[0];
                try { if (sel && sel.constructor && String(sel.constructor.name) === "Story") story = sel; } catch (ex) {}
                if (!story) { try { if (sel && sel.parentStory && sel.parentStory.isValid) story = sel.parentStory; } catch (ex2) {} }
            }
        } catch (e3) {}
        if (!story) { showAlert("Select some text or a text frame to target its story."); return []; }
        tgts.push(story); return tgts;
    }
    if (scope === "page") {
        var page = null;
        try { if (app.layoutWindows && app.layoutWindows.length > 0) page = app.layoutWindows[0].activePage; else if (app.activeWindow) page = app.activeWindow.activePage; } catch (e4) {}
        if (!page) { showAlert("No active page. Open a layout window and try again."); return []; }
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
        if (tgts.length === 0) showAlert("No text found on the active page.");
        return tgts;
    }
    if (scope === "frame") {
        if (!app.selection || app.selection.length === 0) { showAlert("Select one or more frames."); return []; }
        for (var sFrame = 0; sFrame < app.selection.length; sFrame++) {
            var it = app.selection[sFrame];
            var tf2 = null;
            try { var ctor = String(it && it.constructor && it.constructor.name); if (ctor === "TextFrame") tf2 = it; } catch (ef) {}
            if (!tf2) { try { if (it && it.texts && it.texts.length > 0 && it.lines) tf2 = it; } catch (ef2) {} }
            if (tf2) {
                var lines2 = null;
                try { lines2 = tf2.lines ? tf2.lines.everyItem().getElements() : []; } catch (ee0) { lines2 = []; }
                if (lines2 && lines2.length > 0) {
                    var firstChar2 = null, lastChar2 = null;
                    try { firstChar2 = lines2[0].characters[0]; } catch (ee1) {}
                    try { var lastLine2 = lines2[lines2.length - 1]; lastChar2 = lastLine2.characters[-1]; } catch (ee2) {}
                    if (firstChar2 && lastChar2) {
                        var range2 = null;
                        try { range2 = tf2.parentStory.texts.itemByRange(firstChar2, lastChar2); } catch (ee3) {}
                        if (range2 && range2.isValid) tgts.push(range2);
                    }
                }
            }
        }
        if (tgts.length === 0) showAlert("No text found in the selected frame(s).");
        return tgts;
    }
    if (scope === "selection") {
        if (!app.selection || app.selection.length === 0) { showAlert("Make a text selection first."); return []; }
        for (var sSel = 0; sSel < app.selection.length; sSel++) {
            var item = app.selection[sSel];
            var txt = null;
            try { if (item && item.texts && item.texts.length > 0) txt = item.texts[0]; } catch (e8) {}
            // Do not escalate to parentStory in Selection scope; require actual text
            if (txt && txt.isValid) tgts.push(txt);
        }
        if (tgts.length === 0) showAlert("The selection does not contain editable text.");
        return tgts;
    }
    // fallback
    try { var dflt = app.activeDocument; if (dflt && dflt.isValid) tgts.push(dflt); } catch (e10) {}
    return tgts;
}

function safeReset() {
    try { app.findGrepPreferences = null; } catch (e) {}
    try { app.changeGrepPreferences = null; } catch (e2) {}
}



function changeAcrossTargets(findPattern, replaceText, targets) {
    // Correct approach: changeGrep returns collections, check if any have length > 0
    var foundAny = false;

    for (var i = 0; i < targets.length; i++) {
        var t = targets[i];
        try {
            // Perform the change and check what was returned
            safeReset();
            app.findGrepPreferences.findWhat = findPattern;
            app.changeGrepPreferences.changeTo = replaceText;
            try {
                var result = t.changeGrep();
                // changeGrep returns a collection - check if it has items
                if (result && result.length && result.length > 0) {
                    foundAny = true;
                }
            } catch (ce) {
                // Continue if error
            }

        } catch (e) {
            // Continue with next target
        } finally {
            safeReset();
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
    var nikudPattern = "(\\x{05B0}|\\x{05B1}|\\x{05B2}|\\x{05B3}|\\x{05B4}|\\x{05B5}|\\x{05B6}|\\x{05B7}|\\x{05B8}|\\x{05B9}|\\x{05BA}|\\x{05BB}|\\x{05BC}|\\x{05BD}|\\x{05BE}|\\x{05BF}|\\x{05C0}|\\x{05C1}|\\x{05C2}|\\x{05C3}|\\x{05C4}|\\x{05C5}|\\x{05C7})";
    var foundAny = changeAcrossTargets(nikudPattern, "", targets);
    if (!silent) { notifyDeletionResult("Nikud deletion", foundAny); }
    return foundAny;
}

function deleteTeamim(silent, targets) {
    // Hebrew cantillation marks (teamim)
    var teamimPattern = "(\\x{0591}|\\x{0592}|\\x{0593}|\\x{0594}|\\x{0595}|\\x{0596}|\\x{0597}|\\x{0598}|\\x{0599}|\\x{059A}|\\x{059B}|\\x{059C}|\\x{059D}|\\x{05AE}|\\x{059E}|\\x{059F}|\\x{05A0}|\\x{05A1}|\\x{05A2}|\\x{05A3}|\\x{05A4}|\\x{05A5}|\\x{05A6}|\\x{05A7}|\\x{05A8}|\\x{05A9}|\\x{05AA}|\\x{05AB}|\\x{05AC}|\\x{05AD}|\\x{05AF}|\\x{05F3}|\\x{05F4})";
    var foundAny = changeAcrossTargets(teamimPattern, "", targets);
    if (!silent) { notifyDeletionResult("Teamim deletion", foundAny); }
    return foundAny;
}

function deleteMesegConditional(silent, targets) {
    // Meteg (\x{05BD}) but only when NOT preceded by qamatz (\x{05B8})
    var mesegPattern = "(?<!\\x{05B8})\\x{05BD}";
    var foundAny = changeAcrossTargets(mesegPattern, "", targets);
    if (!silent) { notifyDeletionResult("Meteg (selective) deletion", foundAny); }
    return foundAny;
}

function deleteMesegAll(silent, targets) {
    // Delete all meteg characters (\x{05BD}) regardless of context
    var mesegPattern = "\\x{05BD}";
    var foundAny = changeAcrossTargets(mesegPattern, "", targets);
    if (!silent) { notifyDeletionResult("Meteg (all) deletion", foundAny); }
    return foundAny;
}
