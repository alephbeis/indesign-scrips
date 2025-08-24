/**
 * Change Nekuda
 * Provides flexible interface to change any Hebrew vowel mark (nekuda) to any other
 * 
 * Features:
 * - Change From: Lists all Nekudos plus Shin and Sin dots
 * - Change To: Lists all Nekudos plus Shin and Sin dots
 * - Full flexibility for any combination of changes
 */

// Main entry point
(function() {
    'use strict';
    
    // Check if document is available
    if (!app.documents.length) {
        alert("Please open a document before running this script.");
        return;
    }
    
    // Define all Nekudos with their Unicode characters and Hebrew names
    // Ordered according to requirements: Kamatz, Pasach, Tzeirei, Segol, Sheva, etc.
    var nekudos = [
        { name: "Kamatz", hebrew: "קמץ", unicode: "\\x{05B8}", character: "\u05B8" },
        { name: "Pasach", hebrew: "פתח", unicode: "\\x{05B7}", character: "\u05B7" },
        { name: "Tzeirei", hebrew: "צירי", unicode: "\\x{05B5}", character: "\u05B5" },
        { name: "Segol", hebrew: "סגול", unicode: "\\x{05B6}", character: "\u05B6" },
        { name: "Sheva", hebrew: "שוא", unicode: "\\x{05B0}", character: "\u05B0" },
        { name: "Cholam Chaser", hebrew: "חולם חסר", unicode: "\\x{05B9}", character: "\u05B9" },
        { name: "Cholam Malei", hebrew: "חולם מלא", unicode: "\\x{05D5}\\x{05B9}", character: "\u05D5\u05B9" },
        { name: "Chirik Chaser", hebrew: "חיריק חסר", unicode: "\\x{05B4}", character: "\u05B4" },
        { name: "Chirik Malei", hebrew: "חיריק מלא", unicode: "\\x{05B4}\\x{05D9}", character: "\u05B4\u05D9" },
        { name: "Kubutz", hebrew: "קובוץ", unicode: "\\x{05BB}", character: "\u05BB" },
        { name: "Shuruk", hebrew: "שורוק", unicode: "\\x{05D5}\\x{05BC}", character: "\u05D5\u05BC" },
        { name: "Chataf Kamatz", hebrew: "חטף קמץ", unicode: "\\x{05B3}", character: "\u05B3" },
        { name: "Chataf Pasach", hebrew: "חטף פתח", unicode: "\\x{05B2}", character: "\u05B2" },
        { name: "Chataf Segol", hebrew: "חטף סגול", unicode: "\\x{05B1}", character: "\u05B1" },
        { name: "Shin Dot", hebrew: "נקודת שין", unicode: "\\x{05C1}", character: "\u05C1" },
        { name: "Sin Dot", hebrew: "נקודת שין שמאלית", unicode: "\\x{05C2}", character: "\u05C2" }
    ];
    
    // Show main dialog
    showChangeNekudaDialog();
    
    /**
     * Show the main dialog with Change From and Change To options
     */
    function showChangeNekudaDialog() {
        var dialog = new Window('dialog', 'Change Nekuda');
        dialog.orientation = 'column';
        dialog.margins = 16;
        dialog.spacing = 10;
        dialog.preferredSize.width = 600;
        
        // Scan document for existing nekudos
        var foundNekudos = scanDocumentForNekudos();
        
        // Build a presence map for quick lookup (name -> count)
        var presentMap = {};
        for (var _fi = 0; _fi < foundNekudos.length; _fi++) {
            presentMap[foundNekudos[_fi].name] = foundNekudos[_fi].count || 0;
        }
        
        // Main two-column layout
        var mainGroup = dialog.add('group');
        mainGroup.orientation = 'row';
        mainGroup.alignment = 'left';
        mainGroup.spacing = 10;
        
        // Left column (smaller) - Change From/To
        var leftColumn = mainGroup.add('group');
        leftColumn.orientation = 'row';
        leftColumn.spacing = 8;
        leftColumn.alignment = 'top';
        
        // Change From section
        var fromPanel = leftColumn.add('panel', undefined, 'Change From');
        fromPanel.orientation = 'column';
        fromPanel.margins = 12;
        fromPanel.spacing = 6;
        fromPanel.alignChildren = 'fill';
        
        // Single-column radio list for Change From
        var fromListCol = fromPanel.add('group');
        fromListCol.orientation = 'column';
        fromListCol.alignChildren = 'left';
        
        var fromRadios = [];
        var firstEnabledFromIndex = -1;
        for (var i = 0; i < nekudos.length; i++) {
            var n = nekudos[i];
            var label = n.name + ' (' + n.hebrew + ')';
            var rb = fromListCol.add('radiobutton', undefined, label);
            rb.enabled = presentMap.hasOwnProperty(n.name) && presentMap[n.name] > 0;
            rb._index = i; // store index into nekudos array
            fromRadios.push(rb);
            if (firstEnabledFromIndex === -1 && rb.enabled) firstEnabledFromIndex = fromRadios.length - 1;
        }
        // Manual exclusivity across columns
        function bindExclusive(radios) {
            for (var r = 0; r < radios.length; r++) {
                (function(idx){
                    radios[idx].onClick = function(){
                        for (var k = 0; k < radios.length; k++) { radios[k].value = (k === idx); }
                    };
                })(r);
            }
        }
        bindExclusive(fromRadios);
        if (firstEnabledFromIndex !== -1) { fromRadios[firstEnabledFromIndex].value = true; }
        
        // Change To section
        var toPanel = leftColumn.add('panel', undefined, 'Change To');
        toPanel.orientation = 'column';
        toPanel.margins = 12;
        toPanel.spacing = 6;
        toPanel.alignChildren = 'fill';
        
        // Single-column radio list for Change To
        var toListCol = toPanel.add('group');
        toListCol.orientation = 'column';
        toListCol.alignChildren = 'left';
        
        var toRadios = [];
        for (var j = 0; j < nekudos.length; j++) {
            var nt = nekudos[j];
            var lbl = nt.name + ' (' + nt.hebrew + ')';
            var rb2 = toListCol.add('radiobutton', undefined, lbl);
            rb2.enabled = true; // always allow choosing any target
            rb2._index = j; // store index into nekudos array
            toRadios.push(rb2);
        }
        bindExclusive(toRadios);
        // Intentionally do not preselect any item for "Change To" per UX requirement
        
        // Right column - Scope panel
        var scopePanel = mainGroup.add('panel', undefined, 'Scope');
        scopePanel.orientation = 'column';
        scopePanel.margins = 12;
        scopePanel.spacing = 6;
        scopePanel.alignChildren = 'left';
        scopePanel.alignment = 'top';
        
        var scopeRadios = [];
        // Canonical order: All Documents, Document, Page, Story, Frame, Selected Text
        var scopeOptions = [
            { text: 'All Documents', value: 'allDocs' },
            { text: 'Document', value: 'doc' },
            { text: 'Page', value: 'page' },
            { text: 'Story', value: 'story' },
            { text: 'Frame', value: 'frame' },
            { text: 'Selected Text', value: 'selection' }
        ];
        
        for (var k = 0; k < scopeOptions.length; k++) {
            var scopeRadio = scopePanel.add('radiobutton', undefined, scopeOptions[k].text);
            scopeRadio.value = (scopeOptions[k].value === 'doc'); // Select 'Document' by default
            scopeRadio.scopeValue = scopeOptions[k].value;
            scopeRadios.push(scopeRadio);
        }
        
        // Fixed heights so each list fits all 16 items in one column
        try {
            var fixedPanelH = 440; // fits 16 radios comfortably
            fromPanel.preferredSize.height = fixedPanelH;
            toPanel.preferredSize.height = fixedPanelH;
            // Scope panel height: ensure at least the same height for alignment
            scopePanel.preferredSize.height = fixedPanelH;
            // Window height: panels + margins + buttons area
            dialog.preferredSize.height = 560;
        } catch (_eSizing) {}
        
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
        
        // Enablement rules: show but disable if not applicable
        for (var _r = 0; _r < scopeRadios.length; _r++) {
            if (scopeRadios[_r].scopeValue === 'selection') {
                scopeRadios[_r].enabled = hasRangedTextSelection; // Disable for caret-only selection
            } else if (scopeRadios[_r].scopeValue === 'story') {
                scopeRadios[_r].enabled = (inTextContext || hasTextFrameSelection);
            } else if (scopeRadios[_r].scopeValue === 'frame') {
                scopeRadios[_r].enabled = (inTextContext || hasTextFrameSelection);
            }
        }
        
        // Ensure no disabled option is selected
        for (var _r = 0; _r < scopeRadios.length; _r++) {
            if (!scopeRadios[_r].enabled && scopeRadios[_r].value) {
                scopeRadios[_r].value = false;
                // ensure Document is active
                for (var _r2 = 0; _r2 < scopeRadios.length; _r2++) {
                    if (scopeRadios[_r2].scopeValue === 'doc') { scopeRadios[_r2].value = true; break; }
                }
            }
        }
        
        // Action buttons
        var buttonGroup = dialog.add('group');
        buttonGroup.alignment = 'right';
        buttonGroup.spacing = 10;
        
        var cancelButton = buttonGroup.add('button', undefined, 'Cancel');
        var runButton = buttonGroup.add('button', undefined, 'Run', {name: 'ok'});
        
        // Cancel button handler
        cancelButton.onClick = function() {
            dialog.close();
        };
        
        // Run button handler
        runButton.onClick = function() {
            var fromIndex = -1;
            for (var f = 0; f < fromRadios.length; f++) { if (fromRadios[f].value) { fromIndex = fromRadios[f]._index; break; } }
            var toIndex = -1;
            for (var t = 0; t < toRadios.length; t++) { if (toRadios[t].value) { toIndex = toRadios[t]._index; break; } }
            
            if (fromIndex === -1 || toIndex === -1) {
                alert("Please select both 'Change From' and 'Change To' options.");
                return;
            }
            
            var fromNekuda = nekudos[fromIndex];
            var toNekuda = nekudos[toIndex];
            
            if (fromNekuda.unicode === toNekuda.unicode) {
                alert("Source and target Nekudos are the same. No changes would be made.");
                return;
            }
            
            // Get selected scope
            var selectedScope = 'doc';
            for (var l = 0; l < scopeRadios.length; l++) {
                if (scopeRadios[l].value) {
                    selectedScope = scopeRadios[l].scopeValue;
                    break;
                }
            }
            
            // Store values and close dialog immediately
            dialog.close(1);
            
            // Execute change after dialog closes
            executeChange(fromNekuda, toNekuda, selectedScope);
        };
        
        // Show dialog
        dialog.center();
        dialog.show();
    }
    
    /**
     * Scan the document to find which Nekudos are actually present
     * @returns {Array} Array of nekuda objects with count information
     */
    function scanDocumentForNekudos() {
        var foundNekudos = [];
        var doc = app.activeDocument;
        
        // Store original preferences
        var originalPrefs = {
            enableRedraw: app.scriptPreferences.enableRedraw
        };
        
        try {
            app.scriptPreferences.enableRedraw = false;
            
            for (var i = 0; i < nekudos.length; i++) {
                var nekuda = nekudos[i];
                var count = 0;
                
                // Reset preferences
                app.findGrepPreferences = null;
                
                // Set up search for this nekuda
                app.findGrepPreferences.findWhat = nekuda.unicode;
                
                // Find all instances
                var found = doc.findGrep();
                count = found.length;
                
                if (count > 0) {
                    foundNekudos.push({
                        name: nekuda.name,
                        hebrew: nekuda.hebrew,
                        unicode: nekuda.unicode,
                        character: nekuda.character,
                        count: count
                    });
                }
                
                // Reset preferences
                app.findGrepPreferences = null;
            }
            
        } finally {
            app.scriptPreferences.enableRedraw = originalPrefs.enableRedraw;
            app.findGrepPreferences = null;
        }
        
        // Sort by predefined nekudos array order instead of occurrence count
        foundNekudos.sort(function(a, b) {
            var aIndex = -1, bIndex = -1;
            for (var i = 0; i < nekudos.length; i++) {
                if (nekudos[i].name === a.name) aIndex = i;
                if (nekudos[i].name === b.name) bIndex = i;
            }
            return aIndex - bIndex;
        });
        
        return foundNekudos;
    }
    
    /**
     * Execute the change operation
     * @param {Object} fromNekuda - Source nekuda object
     * @param {Object} toNekuda - Target nekuda object  
     * @param {string} scope - Scope of the change
     */
    function executeChange(fromNekuda, toNekuda, scope) {
        // Store original preferences
        var originalPrefs = {
            enableRedraw: app.scriptPreferences.enableRedraw
        };
        
        try {
            // Disable redraw for better performance
            app.scriptPreferences.enableRedraw = false;
            
            // Resolve targets first
            var targets = resolveScopeTargets(scope);
            if (!targets || targets.length === 0) {
                // Resolver already alerted the user
                return;
            }
            
            var changesMade = false;
            
            // Wrap in undo group
            app.doScript(function() {
                changesMade = performChange(fromNekuda, toNekuda, targets);
            }, undefined, undefined, UndoModes.ENTIRE_SCRIPT,
               "Change Nekuda: " + fromNekuda.name + " → " + toNekuda.name);
            
            // Show completion message based on whether changes were made
            if (changesMade) {
                alert("Change completed successfully!\n\n" + 
                      "Changed: " + fromNekuda.name + " → " + toNekuda.name);
            } else {
                alert("No changes were made.\n\n" +
                      "No instances of " + fromNekuda.name + " were found in the selected scope.");
            }
            
        } catch (error) {
            alert("Error during change operation: " + error.message);
        } finally {
            // Restore original preferences
            app.scriptPreferences.enableRedraw = originalPrefs.enableRedraw;
        }
    }
    
    /**
     * Perform the actual change operation
     * @param {Object} fromNekuda - Source nekuda object
     * @param {Object} toNekuda - Target nekuda object
     * @param {Array} targets - Target objects resolved from scope
     * @returns {boolean} True if changes were made, false otherwise
     */
    function performChange(fromNekuda, toNekuda, targets) {
        // Set up find/change options
        app.findChangeGrepOptions.properties = {
            includeFootnotes: true,
            includeHiddenLayers: true,
            includeMasterPages: true,
            includeLockedLayersForFind: true,
            includeLockedStoriesForFind: true
        };

        // Helper resets
        function safeReset() {
            try { app.findGrepPreferences = null; } catch (e) {}
            try { app.changeGrepPreferences = null; } catch (e2) {}
        }

        var changesMade = false;

        try {
            // Reset preferences, set find/change once per target
            for (var t = 0; t < targets.length; t++) {
                var tgt = targets[t];
                try {
                    safeReset();
                    app.findGrepPreferences.findWhat = fromNekuda.unicode;
                    app.changeGrepPreferences.changeTo = toNekuda.unicode;
                    var result = tgt.changeGrep();
                    // changeGrep returns a collection - check if it has items
                    if (result && result.length && result.length > 0) {
                        changesMade = true;
                    }
                } catch (inner) {
                    // continue other targets
                } finally {
                    safeReset();
                }
            }
        } finally {
            // Always reset preferences
            safeReset();
        }
        
        return changesMade;
    }
    
    /**
     * Resolve scope targets based on the selected scope
     * @param {string} scope - The scope type
     * @returns {Array} Array of target objects
     */
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
    
})();