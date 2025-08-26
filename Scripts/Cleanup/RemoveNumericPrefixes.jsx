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

    // Load scope utilities
    var scopeUtilsFile = File(scriptFile.parent.parent + "/Shared/ScopeUtils.jsx");
    if (scopeUtilsFile.exists) $.evalFile(scopeUtilsFile);
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
    var initialTargets = InDesignUtils.Scope.resolveScopeTargets("doc"); // Start with document scope for initial scan
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
        var targets = InDesignUtils.Scope.resolveScopeTargets(selection.scope);
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
        var initialTargets = InDesignUtils.Scope.resolveScopeTargets("doc");
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

        // Create scope panel using shared utility
        var scopeUI = InDesignUtils.Scope.createScopePanel(mainContainer);

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
            return scopeUI.getSelectedScope();
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
