/*
 RemoveNumericPrefixes: Manage explicit numeric prefixes at the start of paragraphs.
 Provides a dialog with two actions:
 1) List occurrences: lists counts by page and overall (no highlighting/selection).
 2) Remove all: asks for confirmation, removes all matches, and reports how many were removed.
 Notes:
 - Targets typed numbers (not auto-numbering) with pattern: ^\d+\.\s*
 - Follows repository conventions for guards, alerts, and safe GREP pref resets.
*/

// Load shared utilities
try {
    var scriptFile = File($.fileName);
    var utilsFile = File(scriptFile.parent.parent + "/Shared/InDesignUtils.jsx");
    if (utilsFile.exists) $.evalFile(utilsFile);
} catch (e) {}

(function () {
    // Guard: ensure InDesign and a document are available
    var activeDoc = InDesignUtils.Objects.getActiveDocument();
    if (!activeDoc) {
        InDesignUtils.UI.alert("Open a document before running RemoveNumericPrefixes.");
        return;
    }

    var pattern = "^\\d+\\.\\s+"; // explicit numeric prefixes at start of paragraphs (requires space after dot)

    // Pre-scan: Check if there are any occurrences before showing the dialog
    var initialTargets = resolveScopeTargets("doc"); // Start with document scope for initial scan
    if (!initialTargets || initialTargets.length === 0) {
        return;
    }

    var initialMatches = findMatchesAcrossTargets(pattern, initialTargets);
    var initialCount = initialMatches ? initialMatches.length : 0;

    // If no occurrences found, show confirmation and exit
    if (initialCount === 0) {
        InDesignUtils.UI.alert("No explicit numeric prefixes were found in the document.");
        return;
    }

    // Combined main dialog with list and scope options
    var selection = showMainDialog(pattern);
    if (!selection) {
        return;
    }

    var action = selection.action;
    if (action === "remove") {
        var targets = resolveScopeTargets(selection.scope);
        if (!targets || targets.length === 0) {
            return;
        }
        performRemoval(pattern, targets);
    }

    // Helper: show combined main dialog with occurrences list and scope options. Returns {action, scope} or null
    function showMainDialog(pattern) {
        var dialog = new Window("dialog", "Explicit Numeric Prefixes");
        dialog.orientation = "column";
        dialog.alignChildren = "fill";
        dialog.margins = 16;
        dialog.spacing = 12;

        var msg = dialog.add(
            "statictext",
            undefined,
            "Manage explicit numeric prefixes (e.g., '1. ' at the start of a paragraph)"
        );
        msg.characters = 80;

        // Main content container (horizontal layout)
        var mainContainer = dialog.add("group");
        mainContainer.orientation = "row";
        mainContainer.alignChildren = "fill";
        mainContainer.spacing = 16;

        // Left side: Occurrences list
        var leftPanel = mainContainer.add("panel", undefined, "Occurrences");
        leftPanel.orientation = "column";
        leftPanel.alignChildren = "fill";
        leftPanel.margins = 12;
        leftPanel.spacing = 8;
        leftPanel.preferredSize.width = 420;

        // Get initial matches for document scope
        var initialTargets = resolveScopeTargets("doc");
        var initialMatches = [];
        var matchItems = [];

        if (initialTargets && initialTargets.length > 0) {
            initialMatches = findMatchesAcrossTargets(pattern, initialTargets);

            // Prepare match items with page and text info
            for (var i = 0; i < initialMatches.length; i++) {
                var match = initialMatches[i];
                var info = getPageInfoFromText(match);
                var matchText = "";
                try {
                    matchText = match.contents || "";
                    // Truncate long text and remove line breaks for display
                    matchText = matchText.replace(/[\r\n]+/g, " ").substring(0, 20);
                    if (match.contents && match.contents.length > 20) {
                        matchText += "...";
                    }
                } catch (e) {
                    matchText = "[text]";
                }

                matchItems.push({
                    match: match,
                    pageInfo: info,
                    pageName: info ? info.name : "(no page)",
                    pageIndex: info ? info.index : -1,
                    matchText: matchText
                });
            }

            // Sort by page order; "(no page)" goes to the end
            matchItems.sort(function (a, b) {
                var ai = a.pageIndex < 0 ? 1e9 : a.pageIndex;
                var bi = b.pageIndex < 0 ? 1e9 : b.pageIndex;
                return ai - bi;
            });
        }

        // Summary text
        var count = matchItems.length;
        var pageSet = {};
        for (var j = 0; j < matchItems.length; j++) {
            var key = matchItems[j].pageIndex >= 0 ? String(matchItems[j].pageIndex) : "no";
            pageSet[key] = true;
        }
        var pagesWithHits = 0;
        for (var pk in pageSet) if (Object.prototype.hasOwnProperty.call(pageSet, pk)) pagesWithHits++;

        var summaryText =
            formatNumber(count) +
            " occurrence" +
            (count === 1 ? "" : "s") +
            " across " +
            pagesWithHits +
            " page" +
            (pagesWithHits === 1 ? "" : "s") +
            ".";
        var summary = leftPanel.add("statictext", undefined, summaryText);
        summary.characters = 50;

        // Create the listbox - use simple listbox creation to avoid column issues
        var listBox = leftPanel.add("listbox");
        listBox.preferredSize.width = 400;
        listBox.preferredSize.height = 280;

        // Add items to the listbox
        for (var k = 0; k < matchItems.length; k++) {
            var item = matchItems[k];
            var pageLabel = item.pageIndex >= 0 ? "Page " + (item.pageIndex + 1) : "(no page)";
            var displayText = pageLabel + " - " + item.matchText;
            var listItem = listBox.add("item", displayText);
            // Store the match object for navigation
            listItem.matchData = item;
        }

        // Go To button for list
        var goToBtn = leftPanel.add("button", undefined, "Go To");
        goToBtn.alignment = "center";

        // Go To button functionality
        goToBtn.onClick = function () {
            var selectedItem = null;
            if (listBox.selection !== null) {
                // Handle both array and single-item selection
                if (listBox.selection.length !== undefined) {
                    // It's an array - get the first selected item
                    selectedItem = listBox.selection.length > 0 ? listBox.selection[0] : null;
                } else {
                    // It's a single item
                    selectedItem = listBox.selection;
                }
            }

            // If no selection, go to first occurrence
            if (!selectedItem && listBox.items.length > 0) {
                selectedItem = listBox.items[0];
            }

            if (selectedItem && selectedItem.matchData) {
                var selectedMatch = selectedItem.matchData.match;
                try {
                    // Validate that the match is still valid
                    if (!selectedMatch || !selectedMatch.isValid) {
                        InDesignUtils.UI.alert(
                            "The selected occurrence is no longer valid. The document may have changed."
                        );
                        return;
                    }

                    // Navigate to the page first
                    var pageInfo = selectedItem.matchData.pageInfo;
                    if (pageInfo && pageInfo.page && pageInfo.page.isValid) {
                        // Set the active page
                        if (app.layoutWindows && app.layoutWindows.length > 0) {
                            app.layoutWindows[0].activePage = pageInfo.page;
                        } else if (app.activeWindow && app.activeWindow.activePage) {
                            app.activeWindow.activePage = pageInfo.page;
                        }
                    }

                    // Select the text occurrence
                    app.selection = [selectedMatch];

                    // Try to show the text cursor at the match location
                    if (selectedMatch.insertionPoints && selectedMatch.insertionPoints.length > 0) {
                        app.selection = [selectedMatch.insertionPoints[0]];
                    }

                    // Close the dialog to show the navigation result
                    dialog.close(0);
                } catch (e) {
                    InDesignUtils.UI.alert("Could not navigate to the selected occurrence. Error: " + e.message);
                }
            }
        };

        // Right side: Scope options
        var rightPanel = mainContainer.add("panel", undefined, "Scope");
        rightPanel.orientation = "column";
        rightPanel.alignChildren = "left";
        rightPanel.margins = 12;
        rightPanel.spacing = 8;
        rightPanel.preferredSize.width = 200;

        // Determine selection context first
        var hasTextFrameSelection = false;
        var inTextContext = false; // true for any text context, including caret
        var hasRangedTextSelection = false; // true only when there is an actual text range selection (not caret)
        try {
            if (app.selection && app.selection.length > 0) {
                for (var _i = 0; _i < app.selection.length; _i++) {
                    var _sel = app.selection[_i];
                    try {
                        var ctor = String(_sel && _sel.constructor && _sel.constructor.name);
                        // Text context detection
                        if (
                            ctor === "InsertionPoint" ||
                            ctor === "Text" ||
                            ctor === "Word" ||
                            ctor === "Character" ||
                            ctor === "TextStyleRange" ||
                            ctor === "Paragraph" ||
                            ctor === "Line"
                        ) {
                            inTextContext = true;
                        }
                        // Ranged text selection (exclude caret and frame selections)
                        if (ctor !== "InsertionPoint" && ctor !== "TextFrame") {
                            var t = null;
                            try {
                                if (_sel && _sel.texts && _sel.texts.length > 0) t = _sel.texts[0];
                            } catch (eT) {
                                t = null;
                            }
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
        var rbAllDocs = rightPanel.add("radiobutton", undefined, "All Documents");
        var rbDoc = rightPanel.add("radiobutton", undefined, "Document");
        var rbPage = rightPanel.add("radiobutton", undefined, "Page");
        var rbStory = rightPanel.add("radiobutton", undefined, "Story");
        var rbFrame = rightPanel.add("radiobutton", undefined, "Frame");
        var rbSelection = rightPanel.add("radiobutton", undefined, "Selected Text");

        // Defaults
        rbDoc.value = true; // default scope

        // Enablement rules: show but disable if not applicable
        rbSelection.enabled = hasRangedTextSelection; // Disable for caret-only selection
        rbStory.enabled = inTextContext || hasTextFrameSelection;
        rbFrame.enabled = inTextContext || hasTextFrameSelection;

        // Ensure no disabled option is selected
        if (!rbSelection.enabled && rbSelection.value) {
            rbSelection.value = false;
            rbDoc.value = true;
        }
        if (!rbStory.enabled && rbStory.value) {
            rbStory.value = false;
            rbDoc.value = true;
        }
        if (!rbFrame.enabled && rbFrame.value) {
            rbFrame.value = false;
            rbDoc.value = true;
        }

        // Bottom buttons
        var buttonGroup = dialog.add("group");
        buttonGroup.alignment = "right";
        buttonGroup.spacing = 8;

        var cancelBtn = buttonGroup.add("button", undefined, "Cancel", { name: "cancel" });
        var runBtn = buttonGroup.add("button", undefined, "Remove All", { name: "ok" });

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

        runBtn.onClick = function () {
            result = { action: "remove", scope: getScope() };
            dialog.close(1);
        };
        cancelBtn.onClick = function () {
            result = null;
            dialog.close(0);
        };

        var shown = dialog.show();
        if (shown !== 1) return null;
        return result;
    }

    // Helper: perform removal with confirmation and reporting across targets
    function performRemoval(pattern, targets) {
        // Count across targets, then change within a single undo step
        var count;
        var matches = findMatchesAcrossTargets(pattern, targets);
        count = matches ? matches.length : 0;
        if (count === 0) {
            InDesignUtils.UI.alert("There was nothing to delete.");
            return;
        }

        app.doScript(
            function () {
                changeAcrossTargets(pattern, "", targets);
            },
            ScriptLanguage.JAVASCRIPT,
            undefined,
            UndoModes.ENTIRE_SCRIPT,
            "Remove Numeric Prefixes"
        );

        InDesignUtils.UI.alert(
            "Removal completed.\n" +
                formatNumber(count) +
                " occurrence" +
                (count === 1 ? " was" : "s were") +
                " removed."
        );
    }

    function resolveScopeTargets(scope) {
        var tgts = [];
        // shared temps (function-scoped to avoid duplicate var declarations)
        var page, frames, i, tf, lines, firstChar, lastChar, lastLine, range, s, sel, story, it, item, txt, dflt;
        if (scope === "allDocs") {
            if (!app.documents || app.documents.length === 0) {
                InDesignUtils.UI.alert("No open documents.");
                return [];
            }
            for (var d = 0; d < app.documents.length; d++) {
                try {
                    if (app.documents[d].isValid) tgts.push(app.documents[d]);
                } catch (e) {}
            }
            return tgts;
        }
        if (scope === "doc") {
            try {
                var doc = app.activeDocument;
                if (doc && doc.isValid) tgts.push(doc);
                else InDesignUtils.UI.alert("No active document.");
            } catch (e2) {
                InDesignUtils.UI.alert("No active document.");
            }
            return tgts;
        }
        if (scope === "story") {
            story = null;
            try {
                if (app.selection && app.selection.length > 0) {
                    sel = app.selection[0];
                    try {
                        if (sel && sel.constructor && String(sel.constructor.name) === "Story") story = sel;
                    } catch (ex) {}
                    if (!story) {
                        try {
                            if (sel && sel.parentStory && sel.parentStory.isValid) story = sel.parentStory;
                        } catch (ex2) {}
                    }
                }
            } catch (e3) {}
            if (!story) {
                InDesignUtils.UI.alert("Select some text or a text frame to target its story.");
                return [];
            }
            tgts.push(story);
            return tgts;
        }
        if (scope === "page") {
            page = null;
            try {
                if (app.layoutWindows && app.layoutWindows.length > 0) page = app.layoutWindows[0].activePage;
                else if (app.activeWindow) page = app.activeWindow.activePage;
            } catch (e4) {}
            if (!page) {
                InDesignUtils.UI.alert("No active page. Open a layout window and try again.");
                return [];
            }
            try {
                frames = page.textFrames ? page.textFrames.everyItem().getElements() : [];
                for (i = 0; i < frames.length; i++) {
                    try {
                        tf = frames[i];
                        lines = null;
                        try {
                            lines = tf && tf.lines ? tf.lines.everyItem().getElements() : [];
                        } catch (ee0) {
                            lines = [];
                        }
                        if (lines && lines.length > 0) {
                            firstChar = null;
                            lastChar = null;
                            try {
                                firstChar = lines[0].characters[0];
                            } catch (ee1) {}
                            try {
                                lastLine = lines[lines.length - 1];
                                lastChar = lastLine.characters[-1];
                            } catch (ee2) {}
                            if (firstChar && lastChar) {
                                range = null;
                                try {
                                    range = tf.parentStory.texts.itemByRange(firstChar, lastChar);
                                } catch (ee3) {}
                                if (range && range.isValid) tgts.push(range);
                            }
                        }
                    } catch (e5) {}
                }
            } catch (e7) {}
            if (tgts.length === 0) InDesignUtils.UI.alert("No text found on the active page.");
            return tgts;
        }
        if (scope === "frame") {
            if (!app.selection || app.selection.length === 0) {
                InDesignUtils.UI.alert("Select one or more frames.");
                return [];
            }
            for (s = 0; s < app.selection.length; s++) {
                it = app.selection[s];
                tf = null;
                try {
                    var ctor = String(it && it.constructor && it.constructor.name);
                    if (ctor === "TextFrame") tf = it;
                } catch (ef) {}
                if (!tf) {
                    try {
                        if (it && it.texts && it.texts.length > 0 && it.lines) tf = it;
                    } catch (ef2) {}
                }
                if (tf) {
                    lines = null;
                    try {
                        lines = tf.lines ? tf.lines.everyItem().getElements() : [];
                    } catch (ee0) {
                        lines = [];
                    }
                    if (lines && lines.length > 0) {
                        firstChar = null;
                        lastChar = null;
                        try {
                            firstChar = lines[0].characters[0];
                        } catch (ee1) {}
                        try {
                            lastLine = lines[lines.length - 1];
                            lastChar = lastLine.characters[-1];
                        } catch (ee2) {}
                        if (firstChar && lastChar) {
                            range = null;
                            try {
                                range = tf.parentStory.texts.itemByRange(firstChar, lastChar);
                            } catch (ee3) {}
                            if (range && range.isValid) tgts.push(range);
                        }
                    }
                }
            }
            if (tgts.length === 0) InDesignUtils.UI.alert("No text found in the selected frame(s).");
            return tgts;
        }
        if (scope === "selection") {
            if (!app.selection || app.selection.length === 0) {
                InDesignUtils.UI.alert("Make a text selection first.");
                return [];
            }
            for (var si = 0; si < app.selection.length; si++) {
                item = app.selection[si];
                txt = null;
                try {
                    if (item && item.texts && item.texts.length > 0) txt = item.texts[0];
                } catch (e8) {}
                // Do not escalate to parentStory in Selection scope; require actual text
                if (txt && txt.isValid) tgts.push(txt);
            }
            if (tgts.length === 0) InDesignUtils.UI.alert("The selection does not contain editable text.");
            return tgts;
        }
        // fallback
        try {
            dflt = app.activeDocument;
            if (dflt && dflt.isValid) tgts.push(dflt);
        } catch (e10) {}
        return tgts;
    }

    function findMatchesAcrossTargets(pattern, targets) {
        var results = [];
        for (var i = 0; i < targets.length; i++) {
            var t = targets[i];
            try {
                var found = InDesignUtils.FindChange.withCleanPrefs(function (scope) {
                    app.findGrepPreferences.findWhat = pattern;
                    return scope.findGrep();
                }, t);
                if (found && found.length) {
                    for (var j = 0; j < found.length; j++) results.push(found[j]);
                }
            } catch (e) {
                // Continue with next target
            }
        }
        return results;
    }

    function changeAcrossTargets(pattern, changeTo, targets) {
        for (var i = 0; i < targets.length; i++) {
            var t = targets[i];
            try {
                InDesignUtils.FindChange.withCleanPrefs(function (scope) {
                    app.findGrepPreferences.findWhat = pattern;
                    app.changeGrepPreferences.changeTo = changeTo;
                    return scope.changeGrep(true);
                }, t);
            } catch (e) {
                // Continue with next target
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
                var ip = t.insertionPoints && t.insertionPoints.length > 0 ? t.insertionPoints[0] : null;
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
        try {
            if (typeof page.documentOffset !== "undefined") idx = page.documentOffset;
        } catch (e4) {}
        if (idx < 0) {
            try {
                if (typeof page.index !== "undefined") idx = page.index;
            } catch (e5) {}
        }
        var name = null;
        try {
            name = page.name;
        } catch (e6) {}
        if (!name && idx >= 0) name = String(idx + 1);
        if (!name) name = "(no page)";
        return { page: page, index: idx, name: name };
    }

    // Formats integer numbers with comma thousands separators
    function formatNumber(n) {
        var s = String(n);
        var isNeg = s.charAt(0) === "-";
        var x = isNeg ? s.substring(1) : s;
        var formatted = x.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
        return isNeg ? "-" + formatted : formatted;
    }
})();
