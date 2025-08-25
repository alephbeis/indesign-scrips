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
    // InDesign dialog helper and override for alert(): avoid system dialogs
    function __showMessageDialog(title, text) {
        var w = new Window('dialog', title || 'Message');
        w.orientation = 'column';
        w.alignChildren = 'left';
        w.margins = 16;
        w.spacing = 12;
        var st = w.add('statictext', undefined, String(text));
        st.characters = 60;
        var row = w.add('group'); row.alignment = 'right'; row.spacing = 8;
        var btn = row.add('button', undefined, 'Close', { name: 'ok' });
        w.defaultElement = btn; w.cancelElement = btn;
        w.show();
    }
    var alert = function (msg) { try { __showMessageDialog('Message', msg); } catch (e) { try { $.writeln(String(msg)); } catch(_e){} } };

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
            // Find all matches across targets and display by page
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
            var goBack = showOccurrencesDialog(summaryText, items);

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

    // Helper: show combined main dialog (Scope only). Returns {action, scope} or null
    function showMainDialog() {
        var dialog = new Window("dialog", "Explicit Numeric Prefixes");
        dialog.orientation = "column";
        dialog.alignChildren = "left";
        dialog.margins = 16;
        dialog.spacing = 12;

        var msg = dialog.add("statictext", undefined, "Manage explicit numeric prefixes (e.g., '1. ' at the start of a paragraph)");
        msg.characters = 70;

        // Scope panel
        var scopePanel = dialog.add("panel", undefined, "Scope");
        scopePanel.orientation = "column"; scopePanel.alignChildren = "left"; scopePanel.margins = 12;
        scopePanel.spacing = 8;

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

        // Bottom buttons: Cancel, Show List, and Run
        var g = dialog.add("group");
        g.alignment = "right";
        var cancelBtn = g.add("button", undefined, "Cancel", {name: "cancel"});
        var showBtn = g.add("button", undefined, "Show List");
        var runBtn = g.add("button", undefined, "Run", {name: "ok"});

        // Default/cancel roles per UX conventions
        dialog.defaultElement = runBtn;
        dialog.cancelElement = cancelBtn;

        var result = null;
        
        function getScope() {
            var scope = "doc"; // default
            if (rbAllDocs.value) scope = "allDocs";
            else if (rbDoc.value) scope = "doc";
            else if (rbPage.value) scope = "page";
            else if (rbStory.value) scope = "story";
            else if (rbFrame.value) scope = "frame";
            else if (rbSelection.value) scope = "selection";
            return scope;
        }
        
        runBtn.onClick = function(){
            result = { action: "remove", scope: getScope() };
            dialog.close(1);
        };
        showBtn.onClick = function(){
            result = { action: "show", scope: getScope() };
            dialog.close(1);
        };
        cancelBtn.onClick = function(){ result = null; dialog.close(0); };

        var shown = dialog.show();
        if (shown !== 1) return null;
        return result;
    }

    // Helper: show occurrences dialog with two-column layout; returns true if Back was pressed
    function showOccurrencesDialog(summaryText, items) {
        var w = new Window("dialog", "Occurrences by Page");
        w.orientation = "column";
        w.alignChildren = "fill";
        w.margins = 16;
        w.spacing = 12;
        var summary = w.add("statictext", undefined, summaryText);
        summary.characters = 70;
        
        // Create container for the two-column layout
        var listContainer = w.add("panel", undefined, "Page Occurrences");
        listContainer.orientation = "column";
        listContainer.alignChildren = "fill";
        listContainer.margins = 12;
        listContainer.preferredSize.width = 420;
        listContainer.preferredSize.height = 280;
        
        // Header row
        var headerGroup = listContainer.add("group");
        headerGroup.orientation = "row";
        headerGroup.alignChildren = "top";
        var pageHeader = headerGroup.add("statictext", undefined, "Page");
        pageHeader.preferredSize.width = 280;
        pageHeader.graphics.font = ScriptUI.newFont("dialog", "Bold", 12);
        var countHeader = headerGroup.add("statictext", undefined, "Count");
        countHeader.preferredSize.width = 80;
        countHeader.graphics.font = ScriptUI.newFont("dialog", "Bold", 12);
        countHeader.justify = "right";
        
        // Separator line
        var separator = listContainer.add("panel");
        separator.preferredSize.height = 2;
        
        // Scrollable list container
        var scrollPanel = listContainer.add("panel");
        scrollPanel.orientation = "column";
        scrollPanel.alignChildren = "fill";
        scrollPanel.preferredSize.height = 200;
        
        // Add rows for each item
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var pageLabel = (item.index >= 0) ? ("Page " + item.name + " (" + (item.index + 1) + ")") : item.name;
            
            var rowGroup = scrollPanel.add("group");
            rowGroup.orientation = "row";
            rowGroup.alignChildren = "top";
            rowGroup.margins = [0, 2, 0, 2];
            
            var pageText = rowGroup.add("statictext", undefined, pageLabel);
            pageText.preferredSize.width = 280;
            
            var countText = rowGroup.add("statictext", undefined, formatNumber(item.count));
            countText.preferredSize.width = 80;
            countText.justify = "right";
        }
        
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
