/**
 * Change Nekuda - Unified Script
 * Combines all Hebrew vowel mark (nekuda) transformations into a single interface
 * 
 * This script provides a dialog interface to select from 10 different Hebrew vowel
 * transformations that were previously available as separate scripts.
 */

// Main entry point
(function() {
    'use strict';
    
    // Check if document is available
    if (!app.documents.length) {
        alert("Please open a document before running this script.");
        return;
    }
    
    // Define all transformations
    var transformations = [
        {
            name: "Kamatz → Pasach",
            description: "Change Kamatz (קמץ) to Pasach (פתח)",
            operations: [
                { find: "קמץ", replace: "פתח" },
                { find: "\\x{05B8}", replace: "\\x{05B7}" }
            ]
        },
        {
            name: "Pasach → Tzeirei",
            description: "Change Pasach (פתח) to Tzeirei (צירי)",
            operations: [
                { find: "\\x{05B7}\\x{05B7}", replace: "\\x{05B7}" }, // double to single
                { find: "\\x{05B7}\\x{05B7}", replace: "\\x{05B7}" }, // triple to single
                { find: "פתח", replace: "צירי" },
                { find: "\\x{05B7}", replace: "\\x{05B5}" }
            ]
        },
        {
            name: "Tzeirei → Segol",
            description: "Change Tzeirei (צירי) to Segol (סגול)",
            operations: [
                { find: "צירי", replace: "סגול" },
                { find: "\\x{05B5}", replace: "\\x{05B6}" }
            ]
        },
        {
            name: "Segol → Sheva",
            description: "Change Segol (סגול) to Sheva (שוא)",
            operations: [
                { find: "סגול", replace: "שוא" },
                { find: "\\x{05B6}", replace: "\\x{05B0}" }
            ]
        },
        {
            name: "Sheva → Chirik Chaser",
            description: "Change Sheva (שוא) to Chirik Chaser (חיריק חסר)",
            operations: [
                { find: "שוא", replace: "חיריק חסר" },
                { find: "\\x{05B0}", replace: "\\x{05B4}" }
            ]
        },
        {
            name: "Chirik Chaser → Chirik Male",
            description: "Change Chirik Chaser (חיריק חסר) to Chirik Male (חיריק מלא)",
            operations: [
                { find: "חיריק חסר", replace: "חיריק מלא" },
                { find: "\\x{05B4}", replace: "\\x{05B4}\\x{05D9}" }
            ]
        },
        {
            name: "Chirik Male → Kubutz",
            description: "Change Chirik Male (חיריק מלא) to Kubutz (קבוץ)",
            operations: [
                { find: "חיריק מלא", replace: "קבוץ" },
                { find: "\\x{05B4}\\x{05D9}", replace: "\\x{05BB}" }
            ]
        },
        {
            name: "Kubutz → Shuruk",
            description: "Change Kubutz (קבוץ) to Shuruk (שורוק)",
            operations: [
                { find: "קבוץ", replace: "שורוק" },
                { find: "\\x{05BB}", replace: "\\x{05D5}\\x{05BC}" }
            ]
        },
        {
            name: "Shuruk → Cholam Chaser",
            description: "Change Shuruk (שורוק) to Cholam Chaser (חולם חסר)",
            operations: [
                { find: "שורוק", replace: "חולם חסר" },
                { find: "\\x{05D5}\\x{05BC}", replace: "\\x{05B9}" }
            ]
        },
        {
            name: "Cholam Chaser → Cholam Male",
            description: "Change Cholam Chaser (חולם חסר) to Cholam Male (חולם מלא)",
            operations: [
                { find: "חולם חסר", replace: "חולם מלא" },
                { find: "\\x{05B9}", replace: "\\x{05D5}\\x{05B9}" }
            ]
        },
        {
            name: "Cholam Male → Pasach",
            description: "Change Cholam Male (חולם מלא) to Pasach (פתח)",
            operations: [
                { find: "חולם מלא", replace: "פתח" },
                { find: "\\x{05D5}\\x{05B9}", replace: "\\x{05B7}" }
            ]
        }
    ];
    
    // Show dialog and get user selection
    var selectedTransformation = showTransformationDialog(transformations);
    
    if (selectedTransformation !== null) {
        // Execute the selected transformation
        executeTransformation(transformations[selectedTransformation]);
    }
    
    /**
     * Show dialog for transformation selection
     * @param {Array} transformations - Array of transformation objects
     * @returns {number|null} - Index of selected transformation or null if cancelled
     */
    function showTransformationDialog(transformations) {
        var dialog = new Window('dialog', 'Change Nekuda - Select Transformation');
        dialog.orientation = 'column';
        dialog.margins = 16;
        dialog.spacing = 10;
        
        // Options panel
        var optionsPanel = dialog.add('panel', undefined, 'Transformation Options');
        optionsPanel.orientation = 'column';
        optionsPanel.margins = 12;
        optionsPanel.spacing = 6;
        optionsPanel.alignChildren = 'left';
        
        var radioButtons = [];
        for (var i = 0; i < transformations.length; i++) {
            var radioGroup = optionsPanel.add('group');
            radioGroup.orientation = 'column';
            radioGroup.alignChildren = 'left';
            
            var radio = radioGroup.add('radiobutton', undefined, transformations[i].name);
            radio.value = (i === 0); // Select first option by default
            radioButtons.push(radio);
            
            var desc = radioGroup.add('statictext', undefined, '    ' + transformations[i].description);
            desc.graphics.font = ScriptUI.newFont(desc.graphics.font.name, ScriptUI.FontStyle.ITALIC, desc.graphics.font.size);
        }
        
        // Scope panel
        var scopePanel = dialog.add('panel', undefined, 'Scope');
        scopePanel.orientation = 'column';
        scopePanel.margins = 12;
        scopePanel.spacing = 6;
        scopePanel.alignChildren = 'left';
        
        var scopeRadios = [];
        var scopeOptions = [
            { text: 'All Documents', value: 'all' },
            { text: 'Document (active)', value: 'document' },
            { text: 'Story (from selection)', value: 'story' },
            { text: 'Page (active)', value: 'page' },
            { text: 'Selection', value: 'selection' }
        ];
        
        for (var j = 0; j < scopeOptions.length; j++) {
            var scopeRadio = scopePanel.add('radiobutton', undefined, scopeOptions[j].text);
            scopeRadio.value = (j === 1); // Select 'Document (active)' by default (index 1)
            scopeRadio.scopeValue = scopeOptions[j].value;
            scopeRadios.push(scopeRadio);
        }
        
        // Action buttons
        var buttonGroup = dialog.add('group');
        buttonGroup.alignment = 'right';
        buttonGroup.spacing = 10;
        
        var cancelButton = buttonGroup.add('button', undefined, 'Cancel');
        var runButton = buttonGroup.add('button', undefined, 'Run', { name: 'ok' });
        
        // Button handlers
        cancelButton.onClick = function() {
            dialog.close();
        };
        
        runButton.onClick = function() {
            // Validate selection
            var selectedIndex = -1;
            for (var k = 0; k < radioButtons.length; k++) {
                if (radioButtons[k].value) {
                    selectedIndex = k;
                    break;
                }
            }
            
            if (selectedIndex === -1) {
                alert("Please select a transformation option.");
                return;
            }
            
            // Store selected scope
            for (var l = 0; l < scopeRadios.length; l++) {
                if (scopeRadios[l].value) {
                    dialog.selectedScope = scopeRadios[l].scopeValue;
                    break;
                }
            }
            
            dialog.selectedTransformation = selectedIndex;
            dialog.close();
        };
        
        // Show dialog
        dialog.center();
        if (dialog.show() === 1) {
            return dialog.selectedTransformation;
        }
        
        return null;
    }
    
    /**
     * Execute the selected transformation
     * @param {Object} transformation - Transformation object with operations
     */
    function executeTransformation(transformation) {
        // Store original preferences
        var originalPrefs = {
            enableRedraw: app.scriptPreferences.enableRedraw
        };
        
        try {
            // Disable redraw for better performance
            app.scriptPreferences.enableRedraw = false;
            
            // Wrap in undo group
            app.doScript(function() {
                performTransformation(transformation);
            }, ScriptUI.environment.keyboardState.shiftKey ? UndoModes.AUTO_UNDO : UndoModes.ENTIRE_SCRIPT, 
               undefined, undefined, "Change Nekuda: " + transformation.name);
            
            // Show completion message
            alert("Transformation completed: " + transformation.name);
            
        } catch (error) {
            alert("Error during transformation: " + error.message);
        } finally {
            // Restore original preferences
            app.scriptPreferences.enableRedraw = originalPrefs.enableRedraw;
        }
    }
    
    /**
     * Perform the actual GREP find/replace operations
     * @param {Object} transformation - Transformation object with operations
     */
    function performTransformation(transformation) {
        // Set up find/change options (same as original scripts)
        app.findChangeGrepOptions.properties = {
            includeFootnotes: true,
            includeHiddenLayers: true,
            includeMasterPages: true,
            includeLockedLayersForFind: true,
            includeLockedStoriesForFind: true
        };
        
        // Execute each operation in the transformation
        for (var i = 0; i < transformation.operations.length; i++) {
            var op = transformation.operations[i];
            performGrepChange(op.find, op.replace);
        }
    }
    
    /**
     * Perform a single GREP find/replace operation
     * @param {string} findWhat - Pattern to find
     * @param {string} changeTo - Replacement pattern
     */
    function performGrepChange(findWhat, changeTo) {
        try {
            // Reset preferences
            app.findGrepPreferences = app.changeGrepPreferences = null;
            
            // Set find/change preferences
            app.findGrepPreferences.findWhat = findWhat;
            app.changeGrepPreferences.changeTo = changeTo;
            
            // Perform the change
            app.activeDocument.changeGrep(true);
            
        } finally {
            // Always reset preferences
            app.findGrepPreferences = app.changeGrepPreferences = null;
        }
    }
    
})();