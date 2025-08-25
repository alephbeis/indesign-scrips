/**
 * InDesign Shared Utilities
 * Common functions and patterns for InDesign scripts
 *
 * Usage:
 *   var scriptFile = File($.fileName);
 *   var utilsFile = File(scriptFile.parent + "/Shared/InDesignUtils.jsx");
 *   if (utilsFile.exists) $.evalFile(utilsFile);
 *
 * Version: 1.0.0
 */

// Namespace to avoid conflicts
if (typeof InDesignUtils === 'undefined') InDesignUtils = {};

InDesignUtils.version = "1.0.0";

/**
 * Dialog and UI Helpers
 */
InDesignUtils.UI = InDesignUtils.UI || {};

/**
 * Show a message dialog with consistent styling
 * @param {string} title - Dialog title
 * @param {string} message - Message to display
 * @param {Object} options - Optional dialog options
 */
InDesignUtils.UI.showMessage = function(title, message, options) {
    options = options || {};
    try {
        var win = new Window('dialog', title || 'Message');
        win.orientation = 'column';
        win.margins = options.margins || 16;
        win.spacing = options.spacing || 12;

        var txt = win.add('statictext', undefined, String(message), { multiline: true });
        txt.characters = options.characters || 60;

        var row = win.add('group');
        row.alignment = 'right';
        row.spacing = 8;
        var ok = row.add('button', undefined, 'OK', { name: 'ok' });
        win.defaultElement = ok;
        win.cancelElement = ok;

        if (options.width) win.preferredSize.width = options.width;
        if (options.height) win.preferredSize.height = options.height;

        win.center();
        return win.show();
    } catch (e) {
        // Fallback to console
        try { $.writeln(String(message)); } catch(_) {}
        return 1;
    }
};

/**
 * Safe alert function with multiple fallbacks
 * @param {string} message - Message to display
 * @param {string} title - Optional title
 */
InDesignUtils.UI.alert = function(message, title) {
    try {
        return InDesignUtils.UI.showMessage(title || 'Alert', String(message));
    } catch (e) {
        try {
            if (typeof alert === 'function') return alert(message);
        } catch(_) {
            try { $.writeln(String(message)); } catch(__) {}
        }
    }
    return 1;
};

/**
 * Create a progress window
 * @param {string} title - Progress window title
 * @param {Object} options - Optional configuration
 * @returns {Object} Progress window controller
 */
InDesignUtils.UI.createProgressWindow = function(title, options) {
    options = options || {};
    var progressWin = null;
    var progressBar = null;
    var progressLabel = null;

    try {
        progressWin = new Window('palette', title || 'Working...');
        progressWin.orientation = 'column';
        progressWin.margins = 16;
        progressWin.spacing = 12;
        progressWin.preferredSize.width = options.width || 400;

        if (options.showLabel !== false) {
            progressLabel = progressWin.add('statictext', undefined, options.initialText || 'Processing...');
        }

        progressBar = progressWin.add('progressbar', undefined, 0, 100);
        progressBar.preferredSize.width = (options.width || 400) - 32;

        progressWin.show();

        return {
            window: progressWin,
            bar: progressBar,
            label: progressLabel,

            update: function(value, text) {
                try {
                    if (typeof value === 'number') progressBar.value = Math.max(0, Math.min(100, value));
                    if (text && progressLabel) progressLabel.text = String(text);
                    progressWin.update();
                } catch(_) {}
            },

            close: function() {
                try {
                    if (progressWin) progressWin.close();
                    progressWin = null;
                } catch(_) {}
            }
        };
    } catch (e) {
        return {
            update: function() {},
            close: function() {}
        };
    }
};

/**
 * Error Handling Utilities
 */
InDesignUtils.Error = InDesignUtils.Error || {};

/**
 * Safe wrapper for operations that might fail
 * @param {Function} fn - Function to execute
 * @param {*} defaultValue - Value to return on error
 * @param {boolean} silent - Whether to suppress error logging
 * @returns {*} Function result or default value
 */
InDesignUtils.Error.safe = function(fn, defaultValue, silent) {
    try {
        return fn();
    } catch (e) {
        if (!silent) {
            try { $.writeln("Safe operation failed: " + e.toString()); } catch(_) {}
        }
        return defaultValue;
    }
};

/**
 * Validate InDesign object
 * @param {Object} obj - Object to validate
 * @returns {boolean} True if object exists and is valid
 */
InDesignUtils.Error.isValid = function(obj) {
    try {
        return obj && obj.isValid === true;
    } catch (e) {
        return false;
    }
};

/**
 * InDesign Object Utilities
 */
InDesignUtils.Objects = InDesignUtils.Objects || {};

/**
 * Get document safely
 * @returns {Document|null} Active document or null
 */
InDesignUtils.Objects.getActiveDocument = function() {
    return InDesignUtils.Error.safe(function() {
        if (app.documents.length === 0) return null;
        var doc = app.activeDocument;
        return InDesignUtils.Error.isValid(doc) ? doc : null;
    }, null);
};

/**
 * Get selection safely
 * @returns {Array|null} Selection array or null
 */
InDesignUtils.Objects.getSelection = function() {
    return InDesignUtils.Error.safe(function() {
        var doc = InDesignUtils.Objects.getActiveDocument();
        if (!doc) return null;
        var sel = doc.selection;
        return (sel && sel.length > 0) ? sel : null;
    }, null);
};

/**
 * Find text frames with overset text
 * @param {Document} document - Document to search in
 * @returns {Array} Array of page names/locations where overset text was found
 */
InDesignUtils.Objects.findOversetFrames = function(document) {
    return InDesignUtils.Error.safe(function() {
        if (!document || !InDesignUtils.Error.isValid(document)) return [];

        var hits = [];
        var textFrames = document.textFrames;

        for (var i = 0; i < textFrames.length; i++) {
            var tf = textFrames[i];
            if (InDesignUtils.Error.isValid(tf)) {
                var isOverflowing = InDesignUtils.Error.safe(function() {
                    return tf.overflows === true;
                }, false, true);

                if (isOverflowing) {
                    var pageName = InDesignUtils.Error.safe(function() {
                        return tf.parentPage ? tf.parentPage.name : null;
                    }, null, true);

                    hits.push(pageName ? ("Page " + pageName) : "Pasteboard/No page");
                }
            }
        }

        return hits;
    }, []);
};

/**
 * Layer Management Utilities
 */
InDesignUtils.Layers = InDesignUtils.Layers || {};

/**
 * Set layer visibility safely
 * @param {Layer} layer - Layer to modify
 * @param {boolean} visible - Visibility state to set
 * @returns {boolean} True if successful
 */
InDesignUtils.Layers.setVisibility = function(layer, visible) {
    return InDesignUtils.Error.safe(function() {
        if (InDesignUtils.Error.isValid(layer)) {
            layer.visible = Boolean(visible);
            return true;
        }
        return false;
    }, false, true);
};

/**
 * Hide all layers in an array
 * @param {Array} layers - Array of layers to hide
 * @returns {number} Number of layers successfully hidden
 */
InDesignUtils.Layers.hideAll = function(layers) {
    return InDesignUtils.Error.safe(function() {
        if (!layers || !layers.length) return 0;

        var count = 0;
        for (var i = 0; i < layers.length; i++) {
            if (InDesignUtils.Layers.setVisibility(layers[i], false)) {
                count++;
            }
        }
        return count;
    }, 0);
};

/**
 * Restore layer visibility from saved state
 * @param {Array} visibilityState - Array of {layer, visible} objects
 * @returns {number} Number of layers successfully restored
 */
InDesignUtils.Layers.restoreVisibility = function(visibilityState) {
    return InDesignUtils.Error.safe(function() {
        if (!visibilityState || !visibilityState.length) return 0;

        var count = 0;
        for (var i = 0; i < visibilityState.length; i++) {
            var state = visibilityState[i];
            if (state && state.layer) {
                if (InDesignUtils.Layers.setVisibility(state.layer, state.visible)) {
                    count++;
                }
            }
        }
        return count;
    }, 0);
};

/**
 * Preferences Management
 */
InDesignUtils.Prefs = InDesignUtils.Prefs || {};

/**
 * Execute function with preserved measurement units
 * @param {Function} fn - Function to execute
 * @param {MeasurementUnits} units - Units to use during execution
 * @returns {*} Function result
 */
InDesignUtils.Prefs.withUnits = function(fn, units) {
    var sp = app.scriptPreferences;
    var originalUnit = null;

    try {
        originalUnit = sp.measurementUnit;
        if (units) sp.measurementUnit = units;
        return fn();
    } finally {
        try {
            if (originalUnit !== null) sp.measurementUnit = originalUnit;
        } catch(_) {}
    }
};

/**
 * Execute function with redraw disabled
 * @param {Function} fn - Function to execute
 * @returns {*} Function result
 */
InDesignUtils.Prefs.withoutRedraw = function(fn) {
    var sp = app.scriptPreferences;
    var originalRedraw = null;

    try {
        originalRedraw = sp.enableRedraw;
        sp.enableRedraw = false;
        return fn();
    } finally {
        try {
            if (originalRedraw !== null) sp.enableRedraw = originalRedraw;
        } catch(_) {}
    }
};

/**
 * Execute function with preserved global preferences
 * @param {Function} fn - Function to execute
 * @param {Object} tempPrefs - Temporary preferences to set
 * @returns {*} Function result
 */
InDesignUtils.Prefs.withSafePreferences = function(fn, tempPrefs) {
    var sp = app.scriptPreferences;
    var original = {};

    try {
        // Save original preferences
        original.measurementUnit = sp.measurementUnit;
        original.enableRedraw = sp.enableRedraw;

        // Apply temporary preferences
        if (tempPrefs) {
            if (tempPrefs.measurementUnit) sp.measurementUnit = tempPrefs.measurementUnit;
            if (tempPrefs.enableRedraw !== undefined) sp.enableRedraw = tempPrefs.enableRedraw;
        }

        return fn();
    } finally {
        // Restore original preferences
        try {
            sp.measurementUnit = original.measurementUnit;
            sp.enableRedraw = original.enableRedraw;
        } catch(_) {}
    }
};

/**
 * Find/Change Utilities
 */
InDesignUtils.FindChange = InDesignUtils.FindChange || {};

/**
 * Execute find/change operation with automatic preference cleanup
 * @param {Function} fn - Function that performs find/change operations
 * @param {Object} scope - Optional search scope (default: active document)
 * @param {Object} options - Optional configuration {inclusive: boolean}
 * @returns {*} Function result
 */
InDesignUtils.FindChange.withCleanPrefs = function(fn, scope, options) {
    options = options || {};
    var savedFindOptions = null;

    try {
        // Clear preferences before
        app.findTextPreferences = app.changeTextPreferences = NothingEnum.nothing;

        // Enable inclusive find options for comprehensive scanning if requested
        if (options.inclusive) {
            savedFindOptions = {};
            try {
                var fco = app.findChangeTextOptions;
                savedFindOptions.includeFootnotes = fco.includeFootnotes;
                savedFindOptions.includeHiddenLayers = fco.includeHiddenLayers;
                savedFindOptions.includeLockedLayersForFind = fco.includeLockedLayersForFind;
                savedFindOptions.includeLockedStoriesForFind = fco.includeLockedStoriesForFind;
                savedFindOptions.includeMasterPages = fco.includeMasterPages;

                fco.includeFootnotes = true;
                fco.includeHiddenLayers = true;
                fco.includeLockedLayersForFind = true;
                fco.includeLockedStoriesForFind = true;
                fco.includeMasterPages = true;
                fco.includeOversetText = true;
            } catch(_) {}
        }

        return fn(scope || InDesignUtils.Objects.getActiveDocument());
    } finally {
        // Restore find options if they were modified
        if (savedFindOptions) {
            try {
                var restoreFco = app.findChangeTextOptions;
                if (typeof savedFindOptions.includeFootnotes !== "undefined") restoreFco.includeFootnotes = savedFindOptions.includeFootnotes;
                if (typeof savedFindOptions.includeHiddenLayers !== "undefined") restoreFco.includeHiddenLayers = savedFindOptions.includeHiddenLayers;
                if (typeof savedFindOptions.includeLockedLayersForFind !== "undefined") restoreFco.includeLockedLayersForFind = savedFindOptions.includeLockedLayersForFind;
                if (typeof savedFindOptions.includeLockedStoriesForFind !== "undefined") restoreFco.includeLockedStoriesForFind = savedFindOptions.includeLockedStoriesForFind;
                if (typeof savedFindOptions.includeMasterPages !== "undefined") restoreFco.includeMasterPages = savedFindOptions.includeMasterPages;
            } catch(_) {}
        }

        // Clear preferences after
        try {
            app.findTextPreferences = app.changeTextPreferences = NothingEnum.nothing;
        } catch(_) {}
    }
};

/**
 * Utility Functions
 */
InDesignUtils.Utils = InDesignUtils.Utils || {};

/**
 * Get script file information
 * @returns {Object} Script file information
 */
InDesignUtils.Utils.getScriptInfo = function() {
    try {
        var scriptFile = File($.fileName);
        return {
            file: scriptFile,
            name: scriptFile.name,
            folder: scriptFile.parent,
            path: scriptFile.fsName
        };
    } catch (e) {
        return {
            file: null,
            name: "Unknown",
            folder: null,
            path: "Unknown"
        };
    }
};

/**
 * Load additional utility file
 * @param {string} fileName - Name of utility file to load
 * @param {boolean} required - Whether file is required (throws on missing)
 * @returns {boolean} True if loaded successfully
 */
InDesignUtils.Utils.loadUtility = function(fileName, required) {
    try {
        var scriptInfo = InDesignUtils.Utils.getScriptInfo();
        if (!scriptInfo.folder) {
            if (required) throw new Error("Cannot determine script location");
            return false;
        }

        var utilFile = File(scriptInfo.folder + "/Shared/" + fileName);
        if (!utilFile.exists) {
            if (required) throw new Error("Required utility not found: " + fileName);
            return false;
        }

        $.evalFile(utilFile);
        return true;
    } catch (e) {
        if (required) throw e;
        return false;
    }
};

/**
 * PDF Utilities
 */
InDesignUtils.PDF = InDesignUtils.PDF || {};

/**
 * Sanitize a string for safe use in filenames (single path segment)
 * Replaces invalid characters with the provided replacement (default: underscore)
 * Invalid characters: \/ : * ? " < > |
 */
InDesignUtils.PDF.sanitizeFilenamePart = function(s, replacement) {
    var rep = (replacement == null) ? "_" : String(replacement);
    try {
        return String(s || "").replace(new RegExp('[\\/:*?"<>|]', 'g'), rep);
    } catch (e) {
        // Extremely defensive fallback using chained splits (should never be needed)
        var out = String(s || "");
        var bad = ['/', '\\', ':', '*', '?', '"', '<', '>', '|'];
        for (var i = 0; i < bad.length; i++) {
            var ch = bad[i];
            // split-join fallback because some engines struggle with edge-case regex construction
            out = out.split(ch).join(rep);
        }
        return out;
    }
};

// Utilities are available via the InDesignUtils namespace
