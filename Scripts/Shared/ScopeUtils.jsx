/**
 * InDesign Scope Utilities
 * Scope resolution and UI creation for InDesign scripts
 *
 * Usage:
 *   var scriptFile = File($.fileName);
 *   var utilsFile = File(scriptFile.parent + "/Shared/ScopeUtils.jsx");
 *   if (utilsFile.exists) $.evalFile(utilsFile);
 *
 * Version: 1.0.0
 */

// Ensure namespace exists
if (typeof InDesignUtils === "undefined") InDesignUtils = {};

/**
 * Scope Utilities
 */
InDesignUtils.Scope = InDesignUtils.Scope || {};

/**
 * Resolve scope targets based on scope type
 * @param {string} scope - Scope type: 'allDocs', 'doc', 'page', 'story', 'frame', 'selection'
 * @returns {Array} Array of resolved targets
 */
InDesignUtils.Scope.resolveScopeTargets = function (scope) {
    var tgts = [];
    if (scope === "allDocs") {
        if (!app.documents || app.documents.length === 0) {
            // Use UI.alert if available, otherwise fallback to alert
            if (InDesignUtils.UI && InDesignUtils.UI.alert) {
                InDesignUtils.UI.alert("No open documents.");
            } else {
                alert("No open documents.");
            }
            return [];
        }
        for (var d = 0; d < app.documents.length; d++) {
            try {
                if (app.documents[d].isValid) {
                    tgts.push(app.documents[d]);
                }
            } catch (e) {}
        }
        return tgts;
    }
    if (scope === "doc") {
        try {
            var doc = app.activeDocument;
            if (doc && doc.isValid) {
                tgts.push(doc);
            } else {
                if (InDesignUtils.UI && InDesignUtils.UI.alert) {
                    InDesignUtils.UI.alert("No active document.");
                } else {
                    alert("No active document.");
                }
            }
        } catch (e2) {
            if (InDesignUtils.UI && InDesignUtils.UI.alert) {
                InDesignUtils.UI.alert("No active document.");
            } else {
                alert("No active document.");
            }
        }
        return tgts;
    }
    if (scope === "story") {
        var story = null;
        try {
            if (app.selection && app.selection.length > 0) {
                var sel = app.selection[0];
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
            if (InDesignUtils.UI && InDesignUtils.UI.alert) {
                InDesignUtils.UI.alert("Select some text or a text frame to target its story.");
            } else {
                alert("Select some text or a text frame to target its story.");
            }
            return [];
        }
        tgts.push(story);
        return tgts;
    }
    if (scope === "page") {
        var page = null;
        try {
            if (app.layoutWindows && app.layoutWindows.length > 0) page = app.layoutWindows[0].activePage;
            else if (app.activeWindow) page = app.activeWindow.activePage;
        } catch (e4) {}
        if (!page) {
            if (InDesignUtils.UI && InDesignUtils.UI.alert) {
                InDesignUtils.UI.alert("No active page. Open a layout window and try again.");
            } else {
                alert("No active page. Open a layout window and try again.");
            }
            return [];
        }
        try {
            var frames = page.textFrames ? page.textFrames.everyItem().getElements() : [];
            for (var i = 0; i < frames.length; i++) {
                try {
                    var tf = frames[i];
                    var lines = null;
                    try {
                        lines = tf && tf.lines ? tf.lines.everyItem().getElements() : [];
                    } catch (ee0) {
                        lines = [];
                    }
                    if (lines && lines.length > 0) {
                        var firstChar = null,
                            lastChar = null;
                        try {
                            firstChar = lines[0].characters[0];
                        } catch (ee1) {}
                        try {
                            var lastLine = lines[lines.length - 1];
                            lastChar = lastLine.characters[-1];
                        } catch (ee2) {}
                        if (firstChar && lastChar) {
                            var range = null;
                            try {
                                range = tf.parentStory.texts.itemByRange(firstChar, lastChar);
                            } catch (ee3) {}
                            if (range && range.isValid) tgts.push(range);
                        }
                    }
                } catch (e5) {}
            }
        } catch (e7) {}
        if (tgts.length === 0) {
            if (InDesignUtils.UI && InDesignUtils.UI.alert) {
                InDesignUtils.UI.alert("No text found on the active page.");
            } else {
                alert("No text found on the active page.");
            }
        }
        return tgts;
    }
    if (scope === "frame") {
        if (!app.selection || app.selection.length === 0) {
            if (InDesignUtils.UI && InDesignUtils.UI.alert) {
                InDesignUtils.UI.alert("Select one or more frames.");
            } else {
                alert("Select one or more frames.");
            }
            return [];
        }
        for (var sFrame = 0; sFrame < app.selection.length; sFrame++) {
            var frameItem = app.selection[sFrame];
            var frameTextFrame = null;
            try {
                var frameCtor = String(frameItem && frameItem.constructor && frameItem.constructor.name);
                if (frameCtor === "TextFrame") frameTextFrame = frameItem;
            } catch (ef) {}
            if (!frameTextFrame) {
                try {
                    if (frameItem && frameItem.texts && frameItem.texts.length > 0 && frameItem.lines)
                        frameTextFrame = frameItem;
                } catch (ef2) {}
            }
            if (frameTextFrame) {
                var frameLines = null;
                try {
                    frameLines = frameTextFrame.lines ? frameTextFrame.lines.everyItem().getElements() : [];
                } catch (ee0) {
                    frameLines = [];
                }
                if (frameLines && frameLines.length > 0) {
                    var frameFirstChar = null,
                        frameLastChar = null;
                    try {
                        frameFirstChar = frameLines[0].characters[0];
                    } catch (ee1) {}
                    try {
                        var frameLastLine = frameLines[frameLines.length - 1];
                        frameLastChar = frameLastLine.characters[-1];
                    } catch (ee2) {}
                    if (frameFirstChar && frameLastChar) {
                        var frameRange = null;
                        try {
                            frameRange = frameTextFrame.parentStory.texts.itemByRange(frameFirstChar, frameLastChar);
                        } catch (ee3) {}
                        if (frameRange && frameRange.isValid) tgts.push(frameRange);
                    }
                }
            }
        }
        if (tgts.length === 0) {
            if (InDesignUtils.UI && InDesignUtils.UI.alert) {
                InDesignUtils.UI.alert("No text found in the selected frame(s).");
            } else {
                alert("No text found in the selected frame(s).");
            }
        }
        return tgts;
    }
    if (scope === "selection") {
        if (!app.selection || app.selection.length === 0) {
            if (InDesignUtils.UI && InDesignUtils.UI.alert) {
                InDesignUtils.UI.alert("Make a text selection first.");
            } else {
                alert("Make a text selection first.");
            }
            return [];
        }
        for (var sSel = 0; sSel < app.selection.length; sSel++) {
            var selItem = app.selection[sSel];
            var selTxt = null;
            try {
                if (selItem && selItem.texts && selItem.texts.length > 0) selTxt = selItem.texts[0];
            } catch (e8) {}
            // Do not escalate to parentStory in Selection scope; require actual text
            if (selTxt && selTxt.isValid) tgts.push(selTxt);
        }
        if (tgts.length === 0) {
            if (InDesignUtils.UI && InDesignUtils.UI.alert) {
                InDesignUtils.UI.alert("The selection does not contain editable text.");
            } else {
                alert("The selection does not contain editable text.");
            }
        }
        return tgts;
    }
    return []; // Unknown scope
};

/**
 * Create scope selection UI panel
 * @param {Object} container - UI container to add scope panel to
 * @param {Object} options - Configuration options
 * @returns {Object} Scope UI elements and helper functions
 */
InDesignUtils.Scope.createScopePanel = function (container, options) {
    options = options || {};
    var scopePanel = container.add("panel", undefined, options.title || "Scope");
    scopePanel.orientation = "column";
    scopePanel.alignChildren = "left";
    scopePanel.margins = options.margins || 12;

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
    var rbAllDocs = scopePanel.add("radiobutton", undefined, "All Documents");
    var rbDoc = scopePanel.add("radiobutton", undefined, "Document");
    var rbPage = scopePanel.add("radiobutton", undefined, "Page");
    var rbStory = scopePanel.add("radiobutton", undefined, "Story");
    var rbFrame = null;
    var rbSelection = scopePanel.add("radiobutton", undefined, "Selected Text");

    // Include Frame option only if requested
    if (options.includeFrame !== false) {
        rbFrame = scopePanel.add("radiobutton", undefined, "Frame");
        // Insert frame before selection
        scopePanel.remove(rbSelection);
        rbSelection = scopePanel.add("radiobutton", undefined, "Selected Text");
    }

    // Defaults
    rbDoc.value = true; // default scope

    // Enablement rules: show but disable if not applicable
    rbSelection.enabled = hasRangedTextSelection; // Disable for caret-only selection
    rbStory.enabled = inTextContext || hasTextFrameSelection;
    if (rbFrame) rbFrame.enabled = inTextContext || hasTextFrameSelection;

    // Ensure no disabled option is selected
    if (!rbSelection.enabled && rbSelection.value) {
        rbSelection.value = false;
        rbDoc.value = true;
    }
    if (!rbStory.enabled && rbStory.value) {
        rbStory.value = false;
        rbDoc.value = true;
    }
    if (rbFrame && !rbFrame.enabled && rbFrame.value) {
        rbFrame.value = false;
        rbDoc.value = true;
    }

    return {
        panel: scopePanel,
        rbAllDocs: rbAllDocs,
        rbDoc: rbDoc,
        rbPage: rbPage,
        rbStory: rbStory,
        rbFrame: rbFrame,
        rbSelection: rbSelection,
        getSelectedScope: function () {
            if (rbAllDocs.value) return "allDocs";
            if (rbDoc.value) return "doc";
            if (rbPage.value) return "page";
            if (rbStory.value) return "story";
            if (rbFrame && rbFrame.value) return "frame";
            if (rbSelection.value) return "selection";
            return "doc"; // fallback
        }
    };
};
