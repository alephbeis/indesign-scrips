/*
 RemoveNumericPrefixes: Manage explicit numeric prefixes at the start of paragraphs.
 Provides a dialog with two actions:
 1) List occurrences: lists counts by page and overall (no highlighting/selection).
 2) Remove all: asks for confirmation, removes all matches, and reports how many were removed.
 Notes:
 - Targets typed numbers (not auto-numbering) with pattern: ^\d+\.\s*
 - Follows repository conventions for guards, alerts, and safe GREP pref resets.
*/

(function () {
    // Guard: ensure InDesign and a document are available
    if (!app || !app.documents || app.documents.length === 0) {
        alert("Open a document before running RemoveNumericPrefixes.");
        return;
    }

    // Combined main dialog (Options + Scope)
    var selection = showMainDialog();
    if (!selection) { return; }
    var action = selection.action;
    var scopeChoice = selection.scope;
    var targets = resolveScopeTargets(scopeChoice);
    if (!targets || targets.length === 0) { return; }

    var pattern = "^\\d+\\.\\s*"; // explicit numeric prefixes at start of paragraphs

    if (action === "show") {
        while (true) {
            // Prepare GREP and find all matches across targets (do not select; list by page)
            var matches = findMatchesAcrossTargets(pattern, targets);

            var count = matches ? matches.length : 0;
            if (count === 0) {
                alert("No explicit numeric prefixes were found.");
                return;
            }

            // Group by page index/name
            var buckets = {}; // key: pageIndex or "no"
            for (var i = 0; i < matches.length; i++) {
                var info = getPageInfoFromText(matches[i]);
                var key = info ? String(info.index) : "no";
                if (!buckets[key]) {
                    buckets[key] = { name: info ? info.name : "(no page)", index: info ? info.index : -1, count: 0 };
                }
                buckets[key].count++;
            }

            // Flatten & sort by page order; "(no page)" goes to the end
            var items = [];
            for (var k in buckets) if (buckets.hasOwnProperty(k)) items.push(buckets[k]);
            items.sort(function(a, b){
                var ai = (a.index < 0) ? 1e9 : a.index;
                var bi = (b.index < 0) ? 1e9 : b.index;
                return ai - bi;
            });

            // Compose listing text
            var lines = [];
            for (var j = 0; j < items.length; j++) {
                var it = items[j];
                var pageLabel = (it.index >= 0) ? ("Page " + it.name + " (" + (it.index + 1) + ")") : it.name;
                lines.push(pageLabel + ": " + formatNumber(it.count));
            }
            var pagesWithHits = items.length;

            var summaryText = formatNumber(count) + " occurrence" + (count === 1 ? "" : "s") + " across " + pagesWithHits + " page" + (pagesWithHits === 1 ? "" : "s") + ".";
            var goBack = showOccurrencesDialog(summaryText, lines.join("\n"));

            if (goBack) {
                var sel = showMainDialog();
                if (!sel) { return; }
                action = sel.action;
                scopeChoice = sel.scope;
                targets = resolveScopeTargets(scopeChoice);
                if (!targets || targets.length === 0) { return; }
                if (action === "remove") {
                    performRemoval(pattern, targets);
                    return;
                }
                // else action === 'show' -> loop and recompute
                continue;
            } else {
                return;
            }
        }
    }

    if (action === "remove") {
        performRemoval(pattern, targets);
        return;
    }

    // Helper: show combined main dialog (Options + Scope). Returns {action, scope} or null
    function showMainDialog() {
        var dialog = new Window("dialog", "Explicit Numeric Prefixes");
        dialog.orientation = "column";
        dialog.alignChildren = "left";
        dialog.margins = 16;

        var msg = dialog.add("statictext", undefined, "Choose how to handle explicit numeric prefixes (e.g., '1. ' at the start of a paragraph)");
        msg.characters = 70;

        // Options and Scope side-by-side
        var row = dialog.add("group");
        row.orientation = "row"; row.alignChildren = "top"; row.spacing = 12;

        // Options panel (left)
        var optPanel = row.add("panel", undefined, "Options");
        optPanel.orientation = "column"; optPanel.alignChildren = "left"; optPanel.margins = 12; optPanel.spacing = 6;
        var rbShow = optPanel.add("radiobutton", undefined, "List occurrences");
        var rbRemove = optPanel.add("radiobutton", undefined, "Remove all");
        rbShow.value = true; // default action

        // Scope panel (right)
        var scopePanel = row.add("panel", undefined, "Scope");
        scopePanel.orientation = "column"; scopePanel.alignChildren = "left"; scopePanel.margins = 12; scopePanel.spacing = 6;
        var rbAllDocs = scopePanel.add("radiobutton", undefined, "All Documents");
        var rbDoc = scopePanel.add("radiobutton", undefined, "Document (active)");
        var rbStory = scopePanel.add("radiobutton", undefined, "Story (from selection)");
        var rbPage = scopePanel.add("radiobutton", undefined, "Page (active)");
        var rbSelection = scopePanel.add("radiobutton", undefined, "Selection");
        rbDoc.value = true; // default scope per requirement

        // Bottom-right buttons: Cancel then Run
        var g = dialog.add("group");
        g.alignment = "right";
        var cancelBtn = g.add("button", undefined, "Cancel");
        var runBtn = g.add("button", undefined, "Run", {name: "ok"});

        var result = null;
        runBtn.onClick = function(){
            var action = rbRemove.value ? "remove" : "show";
            var scope = rbAllDocs.value ? "allDocs" : (rbDoc.value ? "doc" : (rbStory.value ? "story" : (rbPage.value ? "page" : "selection")));
            result = { action: action, scope: scope };
            dialog.close(1);
        };
        cancelBtn.onClick = function(){ result = null; dialog.close(0); };

        var shown = dialog.show();
        if (shown !== 1) return null;
        return result;
    }

    // Helper: show occurrences dialog with Back and Close; returns true if Back was pressed
    function showOccurrencesDialog(summaryText, itemsText) {
        var w = new Window("dialog", "Occurrences by Page");
        w.orientation = "column";
        w.alignChildren = "fill";
        w.margins = 16;
        var summary = w.add("statictext", undefined, summaryText);
        summary.characters = 70;
        var note = w.add("statictext", undefined, "Note: In 'Page N (M): C' — N is the page name/label; M is the page's order in the document; C is the number of occurrences on that page.");
        note.characters = 70;
        var box = w.add("edittext", undefined, itemsText, {multiline:true, scrolling:true});
        box.readonly = true;
        box.preferredSize.width = 420;
        box.preferredSize.height = 260;
        var g = w.add("group");
        g.alignment = "right";
        var backBtn = g.add("button", undefined, "Back");
        var closeBtn = g.add("button", undefined, "Close", {name: "ok"});
        var goBack = false;
        backBtn.onClick = function(){ goBack = true; w.close(1); };
        closeBtn.onClick = function(){ goBack = false; w.close(1); };
        w.show();
        return goBack;
    }

    // Helper: perform removal with confirmation and reporting across targets
    function performRemoval(pattern, targets) {
        // Ask for confirmation
        var confirmDlg = new Window("dialog", "Confirm Removal");
        confirmDlg.orientation = "column";
        confirmDlg.alignChildren = "left";
        confirmDlg.margins = 16;
        confirmDlg.add("statictext", undefined, "Remove all explicit numeric prefixes at the start of paragraphs?");
        var cg = confirmDlg.add("group");
        cg.alignment = "right";
        var yesBtn = cg.add("button", undefined, "Yes");
        var noBtn = cg.add("button", undefined, "No");
        var confirmed = false;
        yesBtn.onClick = function(){ confirmed = true; confirmDlg.close(1); };
        noBtn.onClick = function(){ confirmed = false; confirmDlg.close(0); };
        var cRes = confirmDlg.show();
        if (cRes !== 1 || !confirmed) {
            return; // user declined
        }

        // Count across targets, then change within a single undo step
        var count = 0;
        var matches = findMatchesAcrossTargets(pattern, targets);
        count = matches ? matches.length : 0;
        if (count === 0) {
            alert("There was nothing to delete.");
            return;
        }

        app.doScript(function(){
            changeAcrossTargets(pattern, "", targets);
        }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Remove Numeric Prefixes");

        alert("Removal completed.\n" + formatNumber(count) + " occurrence" + (count === 1 ? " was" : "s were") + " removed.");
    }

    // Scope dialog and target resolution
    function showScopeDialog() {
        var dlg = new Window("dialog", "Scope");
        dlg.orientation = "column";
        dlg.alignChildren = "left";
        dlg.margins = 16;
        dlg.add("statictext", undefined, "Choose where to apply the action:");
        var panel = dlg.add("panel", undefined, "Scope");
        panel.orientation = "column"; panel.alignChildren = "left"; panel.margins = 12;
        var rbAllDocs = panel.add("radiobutton", undefined, "All Documents");
        var rbDoc = panel.add("radiobutton", undefined, "Document (active)");
        var rbStory = panel.add("radiobutton", undefined, "Story (from selection)");
        var rbPage = panel.add("radiobutton", undefined, "Page (active)");
        var rbSelection = panel.add("radiobutton", undefined, "Selection");
        rbDoc.value = true; // default
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

    function findMatchesAcrossTargets(pattern, targets) {
        var results = [];
        for (var i = 0; i < targets.length; i++) {
            var t = targets[i];
            try {
                safeReset();
                app.findGrepPreferences.findWhat = pattern;
                var found = [];
                try { found = t.findGrep(); } catch (e3) { found = []; }
                if (found && found.length) {
                    for (var j = 0; j < found.length; j++) results.push(found[j]);
                }
            } catch (e) {
            } finally {
                safeReset();
            }
        }
        return results;
    }

    function changeAcrossTargets(pattern, changeTo, targets) {
        for (var i = 0; i < targets.length; i++) {
            var t = targets[i];
            try {
                safeReset();
                app.findGrepPreferences.findWhat = pattern;
                app.changeGrepPreferences.changeTo = changeTo;
                try { t.changeGrep(true); } catch (e4) {}
            } catch (e2) {
            } finally {
                safeReset();
            }
        }
    }

    // Resolve page info (index and display name) for a given text range; returns null if unavailable
    function getPageInfoFromText(t) {
        var page = null;
        if (!t) return null;
        // Try via parentTextFrames
        try {
            if (t.parentTextFrames && t.parentTextFrames.length > 0) {
                page = t.parentTextFrames[0].parentPage;
            }
        } catch (e) {}
        // Try via insertion point's parentTextFrames
        if (!page) {
            try {
                var ip = (t.insertionPoints && t.insertionPoints.length > 0) ? t.insertionPoints[0] : null;
                if (ip && ip.parentTextFrames && ip.parentTextFrames.length > 0) {
                    page = ip.parentTextFrames[0].parentPage;
                }
            } catch (e2) {}
        }
        // Try via story's first text container
        if (!page) {
            try {
                var story = t.parentStory;
                if (story && story.textContainers && story.textContainers.length > 0) {
                    var tc = story.textContainers[0];
                    if (tc && tc.parentPage) page = tc.parentPage;
                }
            } catch (e3) {}
        }
        if (!page) return null;
        var idx = -1;
        try { if (typeof page.documentOffset !== "undefined") idx = page.documentOffset; } catch (e4) {}
        if (idx < 0) { try { if (typeof page.index !== "undefined") idx = page.index; } catch (e5) {} }
        var name = null;
        try { name = page.name; } catch (e6) {}
        if (!name && idx >= 0) name = String(idx + 1);
        if (!name) name = "(no page)";
        return { page: page, index: idx, name: name };
    }


    // Formats integer numbers with comma thousands separators
    function formatNumber(n) {
        var s = String(n);
        var isNeg = (s.charAt(0) === "-");
        var x = isNeg ? s.substring(1) : s;
        var formatted = x.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
        return isNeg ? ("-" + formatted) : formatted;
    }
})();
