// Hebrew Marks Deletion Script
// Combines functionality to delete Nikud, Teamim, Meseg, or combination

// Create dialog with radio buttons for user selection
function createDialog() {
    var dialog = new Window("dialog", "Hebrew Marks Deletion");
    dialog.orientation = "column";
    dialog.alignChildren = "left";
    dialog.spacing = 10;
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
    radioGroup.margins = 16;

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

    var rbAllDocs = scopePanel.add("radiobutton", undefined, "All Documents");
    var rbDoc = scopePanel.add("radiobutton", undefined, "Document (active)");
    var rbStory = scopePanel.add("radiobutton", undefined, "Story (from selection)");
    var rbPage = scopePanel.add("radiobutton", undefined, "Page (active)");
    var rbSelection = scopePanel.add("radiobutton", undefined, "Selection");
    rbDoc.value = true; // default scope

    // Bottom buttons (right-aligned): Cancel then Run
    var buttonGroup = dialog.add("group");
    buttonGroup.alignment = "right";
    var cancelButton = buttonGroup.add("button", undefined, "Cancel");
    var runButton = buttonGroup.add("button", undefined, "Run", {name: "ok"});

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
        else if (rbStory.value) scopeChoice = "story";
        else if (rbPage.value) scopeChoice = "page";
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
    alert("Open a document before running Hebrew Marks Deletion.");
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
                            var nikudCount = deleteNikud(true, targets);
                            var teamimCount = deleteTeamim(true, targets);
                            var mesegCount = deleteMesegAll(true, targets);
                            var totalCount = nikudCount + teamimCount + mesegCount;
                            if (totalCount === 0) {
                                alert("There was nothing to delete.");
                            } else {
                                alert(
                                    "All Hebrew marks deletion completed!\n\nSummary:\n" +
                                    "• " + countWithNoun(nikudCount, "vowel point", "vowel points") + " (nikud) removed\n" +
                                    "• " + countWithNoun(teamimCount, "cantillation mark", "cantillation marks") + " (teamim) removed\n" +
                                    "• " + countWithNoun(mesegCount, "meteg mark", "meteg marks") + " removed\n\n" +
                                    "Total: " + countWithNoun(totalCount, "mark", "marks") + " removed."
                                );
                            }
                            break;
                    }
                }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Delete Hebrew Marks");
            }
        }
    }

// Helper to show consistent confirmation messages with proper grammar
function notifyDeletion(context, count, singularNoun, pluralNoun) {
    if (count > 0) {
        var noun = (count === 1) ? singularNoun : pluralNoun;
        var verb = (count === 1) ? "was" : "were";
        var formattedCount = formatNumber(count);
        alert(context + " completed.\n" + formattedCount + " " + noun + " " + verb + " removed.");
    } else {
        alert("There was nothing to delete.");
    }
}

function countWithNoun(count, singular, plural) {
    var formatted = formatNumber(count);
    return formatted + " " + ((count === 1) ? singular : plural);
}

function showScopeDialog() {
    var dlg = new Window("dialog", "Scope");
    dlg.orientation = "column";
    dlg.alignChildren = "left";
    dlg.margins = 16;
    dlg.add("statictext", undefined, "Choose where to apply the deletion:");
    var panel = dlg.add("panel", undefined, "Scope");
    panel.orientation = "column"; panel.alignChildren = "left"; panel.margins = 12;
    var rbAllDocs = panel.add("radiobutton", undefined, "All Documents");
    var rbDoc = panel.add("radiobutton", undefined, "Document (active)");
    var rbStory = panel.add("radiobutton", undefined, "Story (from selection)");
    var rbPage = panel.add("radiobutton", undefined, "Page (active)");
    var rbSelection = panel.add("radiobutton", undefined, "Selection");
    rbDoc.value = true; // default = Document
    var g = dlg.add("group"); g.alignment = "right";
    var ok = g.add("button", undefined, "OK");
    var cancel = g.add("button", undefined, "Cancel");
    var result = null;
    ok.onClick = function(){
        if (rbAllDocs.value) result = "allDocs";
        else if (rbDoc.value) result = "doc";
        else if (rbStory.value) result = "story";
        else if (rbPage.value) result = "page";
        else if (rbSelection.value) result = "selection";
        dlg.close(1);
    };
    cancel.onClick = function(){ result = null; dlg.close(0); };
    var shown = dlg.show();
    return (shown === 1) ? result : null;
}

function resolveScopeTargets(scope) {
    var tgts = [];
    if (scope === "allDocs") {
        if (!app.documents || app.documents.length === 0) { alert("No open documents."); return []; }
        for (var d = 0; d < app.documents.length; d++) { try { if (app.documents[d].isValid) tgts.push(app.documents[d]); } catch (e) {} }
        return tgts;
    }
    if (scope === "doc") {
        try { var doc = app.activeDocument; if (doc && doc.isValid) tgts.push(doc); else alert("No active document."); } catch (e2) { alert("No active document."); }
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
        if (!story) { alert("Select some text or a text frame to target its story."); return []; }
        tgts.push(story); return tgts;
    }
    if (scope === "page") {
        var page = null;
        try { if (app.layoutWindows && app.layoutWindows.length > 0) page = app.layoutWindows[0].activePage; else if (app.activeWindow) page = app.activeWindow.activePage; } catch (e4) {}
        if (!page) { alert("No active page. Open a layout window and try again."); return []; }
        var seen = {};
        try {
            var frames = page.textFrames ? page.textFrames.everyItem().getElements() : [];
            for (var i = 0; i < frames.length; i++) {
                var st = null; try { st = frames[i].parentStory; } catch (e5) {}
                if (st && st.isValid) { var sid = ""; try { sid = String(st.id); } catch (e6) { sid = String(i); } if (!seen[sid]) { seen[sid] = true; tgts.push(st); } }
            }
        } catch (e7) {}
        if (tgts.length === 0) alert("No text found on the active page.");
        return tgts;
    }
    if (scope === "selection") {
        if (!app.selection || app.selection.length === 0) { alert("Make a selection first."); return []; }
        for (var s = 0; s < app.selection.length; s++) {
            var item = app.selection[s];
            var txt = null;
            try { if (item && item.texts && item.texts.length > 0) txt = item.texts[0]; } catch (e8) {}
            if (!txt) { try { if (item && item.parentStory && item.parentStory.isValid) txt = item.texts && item.texts.length > 0 ? item.texts[0] : item.parentStory; } catch (e9) {}
            }
            if (txt && txt.isValid) tgts.push(txt);
        }
        if (tgts.length === 0) alert("The selection does not contain editable text.");
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
    var total = 0;
    for (var i = 0; i < targets.length; i++) {
        var t = targets[i];
        try {
            safeReset();
            app.findGrepPreferences.findWhat = findPattern;
            var matches = [];
            try { matches = t.findGrep(); } catch (e3) { matches = []; }
            var count = matches ? matches.length : 0;
            if (count > 0) {
                try { app.changeGrepPreferences.changeTo = replaceText; t.changeGrep(true); } catch (e4) {}
                total += count;
            }
        } catch (e) {
        } finally {
            safeReset();
        }
    }
    return total;
}

function deleteNikud(silent, targets) {
    // Hebrew vowel points (nikud)
    var nikudPattern = "(\\x{05B0}|\\x{05B1}|\\x{05B2}|\\x{05B3}|\\x{05B4}|\\x{05B5}|\\x{05B6}|\\x{05B7}|\\x{05B8}|\\x{05B9}|\\x{05BA}|\\x{05BB}|\\x{05BC}|\\x{05BD}|\\x{05BE}|\\x{05BF}|\\x{05C0}|\\x{05C2}|\\x{05C3}|\\x{05C4}|\\x{05C5}|\\x{05C7})";
    var count = changeAcrossTargets(nikudPattern, "", targets);
    if (!silent) { notifyDeletion("Nikud deletion", count, "vowel point", "vowel points"); }
    return count;
}

function deleteTeamim(silent, targets) {
    // Hebrew cantillation marks (teamim)
    var teamimPattern = "(\\x{0591}|\\x{0592}|\\x{0593}|\\x{0594}|\\x{0595}|\\x{0596}|\\x{0597}|\\x{0598}|\\x{0599}|\\x{059A}|\\x{059B}|\\x{059C}|\\x{059D}|\\x{05AE}|\\x{059E}|\\x{059F}|\\x{05A0}|\\x{05A1}|\\x{05A2}|\\x{05A3}|\\x{05A4}|\\x{05A5}|\\x{05A6}|\\x{05A7}|\\x{05A8}|\\x{05A9}|\\x{05AA}|\\x{05AB}|\\x{05AC}|\\x{05AD}|\\x{05AF}|\\x{05F3}|\\x{05F4})";
    var count = changeAcrossTargets(teamimPattern, "", targets);
    if (!silent) { notifyDeletion("Teamim deletion", count, "cantillation mark", "cantillation marks"); }
    return count;
}

function deleteMesegConditional(silent, targets) {
    // Meteg (\x{05BD}) but only when NOT preceded by qamatz (\x{05B8})
    var mesegPattern = "(?<!\\x{05B8})\\x{05BD}";
    var count = changeAcrossTargets(mesegPattern, "", targets);
    if (!silent) { notifyDeletion("Meteg (selective) deletion", count, "meteg mark (not preceded by a Kamatz)", "meteg marks (not preceded by a Kamatz)"); }
    return count;
}

function deleteMesegAll(silent, targets) {
    // Delete all meteg characters (\x{05BD}) regardless of context
    var mesegPattern = "\\x{05BD}";
    var count = changeAcrossTargets(mesegPattern, "", targets);
    if (!silent) { notifyDeletion("Meteg (all) deletion", count, "meteg mark", "meteg marks"); }
    return count;
}

// Formats integer numbers with comma thousands separators (e.g., 1,234,567)
function formatNumber(n) {
    var s = String(n);
    var isNeg = (s.charAt(0) === "-");
    var x = isNeg ? s.substring(1) : s;
    // Insert commas every three digits from the right
    var formatted = x.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
    return isNeg ? ("-" + formatted) : formatted;
}