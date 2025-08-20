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

    // Main options dialog
    var action = showOptionsDialog();
    if (!action) {
        return;
    }

    var pattern = "^\\d+\\.\\s*"; // explicit numeric prefixes at start of paragraphs

    if (action === "show") {
        while (true) {
            // Prepare GREP and find all matches (do not select; list occurrences by page)
            safeReset();
            app.findGrepPreferences.findWhat = pattern;
            var doc = app.activeDocument;
            var matches = [];
            try {
                matches = doc.findGrep();
            } catch (e) {
                // ignore; matches remains []
            } finally {
                safeReset();
            }

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
                action = showOptionsDialog();
                if (!action) {
                    return;
                }
                if (action === "remove") {
                    performRemoval(pattern);
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

        // Count, then change
        var doc2 = app.activeDocument;
        var count = 0;
        try {
            safeReset();
            app.findGrepPreferences.findWhat = pattern;
            var found = doc2.findGrep();
            count = found ? found.length : 0;
        } catch (e4) {
            count = 0;
        } finally {
            safeReset();
        }

        if (count === 0) {
            alert("There was nothing to delete.");
            return;
        }

        try {
            safeReset();
            app.findGrepPreferences.findWhat = pattern;
            app.changeGrepPreferences.changeTo = "";
            doc2.changeGrep(true);
        } catch (e5) {
            // ignore errors to ensure reset below
        } finally {
            safeReset();
        }

        alert("Removal completed.\n" + formatNumber(count) + " occurrence" + (count === 1 ? " was" : "s were") + " removed.");
        return;
    }

    // Helper: show main options dialog, returns "show", "remove", or null
    function showOptionsDialog() {
        var dialog = new Window("dialog", "Explicit Numeric Prefixes");
        dialog.orientation = "column";
        dialog.alignChildren = "fill";
        dialog.margins = 16;
        var msg = dialog.add("statictext", undefined, "Choose an action for explicit numeric prefixes (e.g., '1. ' at the start of a paragraph)");
        msg.characters = 70;
        var btnGroup = dialog.add("group");
        btnGroup.alignment = "right";
        var showBtn = btnGroup.add("button", undefined, "List occurrences");
        var removeBtn = btnGroup.add("button", undefined, "Remove all");
        var cancelBtn = btnGroup.add("button", undefined, "Cancel");
        var action = null;
        showBtn.onClick = function () { action = "show"; dialog.close(1); };
        removeBtn.onClick = function () { action = "remove"; dialog.close(1); };
        cancelBtn.onClick = function () { action = null; dialog.close(0); };
        var result = dialog.show();
        if (result !== 1 || !action) return null;
        return action;
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

    // Helper: perform removal with confirmation and reporting
    function performRemoval(pattern) {
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
        // Count, then change
        var doc2 = app.activeDocument;
        var count = 0;
        try {
            safeReset();
            app.findGrepPreferences.findWhat = pattern;
            var found = doc2.findGrep();
            count = found ? found.length : 0;
        } catch (e4) {
            count = 0;
        } finally {
            safeReset();
        }
        if (count === 0) {
            alert("There was nothing to delete.");
            return;
        }
        try {
            safeReset();
            app.findGrepPreferences.findWhat = pattern;
            app.changeGrepPreferences.changeTo = "";
            doc2.changeGrep(true);
        } catch (e5) {
            // ignore errors to ensure reset below
        } finally {
            safeReset();
        }
        alert("Removal completed.\n" + formatNumber(count) + " occurrence" + (count === 1 ? " was" : "s were") + " removed.");
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

    // Utility: reset GREP prefs safely
    function safeReset() {
        try { app.findGrepPreferences = null; } catch (e) {}
        try { app.changeGrepPreferences = null; } catch (e2) {}
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
