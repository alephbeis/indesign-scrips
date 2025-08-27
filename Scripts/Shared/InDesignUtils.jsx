/**
 * InDesignUtils.jsx — Shared utilities for InDesign (ExtendScript, ES3-safe)
 * Namespace: InDesignUtils
 *
 * Provides:
 *  - Error handling helpers: InDesignUtils.Error.safe, InDesignUtils.Error.isValid
 *  - Object helpers: InDesignUtils.Objects.getActiveDocument, getSelection, findOversetFrames
 *  - Layer helpers: InDesignUtils.Layers.setVisibility, hideAll, restoreVisibility
 *  - Preferences helpers: InDesignUtils.Prefs.withUnits, withoutRedraw, withSafePreferences
 *  - General helpers: InDesignUtils.Utils.getScriptInfo, loadUtility
 *
 * Usage:
 *   var scriptFile = File($.fileName);
 *   var utilsFile = File(scriptFile.parent + "/Shared/InDesignUtils.jsx");
 *   if (utilsFile.exists) $.evalFile(utilsFile);
 *
 * Notes:
 *  Load helper files explicitly if needed:
 *  - UI helpers were moved to Scripts/Shared/UIUtils.jsx (namespace UIUtils).ScopeUtils
 *  - Find/Change helpers live in Scripts/Shared/FindChangeUtils.jsx.ScopeUtils
 *  - Scope helpers live in Scripts/Shared/ScopeUtils.jsx.ScopeUtils
 *  - Export and PDF helpers live in Scripts/Shared/ExportUtils.jsx.ScopeUtils
 *
 * Version: 1.0.0
 */

// Ensure namespace exists (avoid globals conflicts)
if (typeof InDesignUtils === "undefined") InDesignUtils = {};

InDesignUtils.version = "1.0.0";

/**
 * SECTION: Error Handling Utilities
 */
InDesignUtils.Error = InDesignUtils.Error || {};

/**
 * Safe wrapper for operations that might fail
 * @param {Function} fn - Function to execute
 * @param {*} defaultValue - Value to return on error
 * @param {boolean} silent - Whether to suppress error logging
 * @returns {*} Function result or default value
 */
InDesignUtils.Error.safe = function (fn, defaultValue, silent) {
    try {
        return fn();
    } catch (e) {
        if (!silent) {
            try {
                $.writeln("Safe operation failed: " + e.toString());
            } catch (_) {}
        }
        return defaultValue;
    }
};

/**
 * Validate InDesign object
 * @param {Object} obj - Object to validate
 * @returns {boolean} True if object exists and is valid
 */
InDesignUtils.Error.isValid = function (obj) {
    try {
        return obj && obj.isValid === true;
    } catch (e) {
        return false;
    }
};

/**
 * SECTION: InDesign Object Utilities
 */
InDesignUtils.Objects = InDesignUtils.Objects || {};

/**
 * Get document safely
 * @returns {Document|null} Active document or null
 */
InDesignUtils.Objects.getActiveDocument = function () {
    return InDesignUtils.Error.safe(function () {
        if (app.documents.length === 0) return null;
        var doc = app.activeDocument;
        return InDesignUtils.Error.isValid(doc) ? doc : null;
    }, null);
};

/**
 * Get selection safely
 * @returns {Array|null} Selection array or null
 */
InDesignUtils.Objects.getSelection = function () {
    return InDesignUtils.Error.safe(function () {
        var doc = InDesignUtils.Objects.getActiveDocument();
        if (!doc) return null;
        var sel = doc.selection;
        return sel && sel.length > 0 ? sel : null;
    }, null);
};

/**
 * Find text frames with overset text
 * @param {Document} document - Document to search in
 * @returns {Array} Array of page names/locations where overset text was found
 */
InDesignUtils.Objects.findOversetFrames = function (document) {
    return InDesignUtils.Error.safe(function () {
        if (!document || !InDesignUtils.Error.isValid(document)) return [];

        var hits = [];
        var textFrames = document.textFrames;

        for (var i = 0; i < textFrames.length; i++) {
            var tf = textFrames[i];
            if (InDesignUtils.Error.isValid(tf)) {
                var isOverflowing = InDesignUtils.Error.safe(
                    (function (textFrame) {
                        return function () {
                            return textFrame.overflows === true;
                        };
                    })(tf),
                    false,
                    true
                );

                if (isOverflowing) {
                    var pageName = InDesignUtils.Error.safe(
                        (function (textFrame) {
                            return function () {
                                return textFrame.parentPage ? textFrame.parentPage.name : null;
                            };
                        })(tf),
                        null,
                        true
                    );

                    hits.push(pageName ? "Page " + pageName : "Pasteboard/No page");
                }
            }
        }

        return hits;
    }, []);
};

/**
 * SECTION: Layer Management Utilities
 */
InDesignUtils.Layers = InDesignUtils.Layers || {};

/**
 * Set layer visibility safely
 * @param {Layer} layer - Layer to modify
 * @param {boolean} visible - Visibility state to set
 * @returns {boolean} True if successful
 */
InDesignUtils.Layers.setVisibility = function (layer, visible) {
    return InDesignUtils.Error.safe(
        function () {
            if (InDesignUtils.Error.isValid(layer)) {
                layer.visible = Boolean(visible);
                return true;
            }
            return false;
        },
        false,
        true
    );
};

/**
 * Hide all layers in an array
 * @param {Array} layers - Array of layers to hide
 * @returns {number} Number of layers successfully hidden
 */
InDesignUtils.Layers.hideAll = function (layers) {
    return InDesignUtils.Error.safe(function () {
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
InDesignUtils.Layers.restoreVisibility = function (visibilityState) {
    return InDesignUtils.Error.safe(function () {
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
 * SECTION: Preferences Management
 */
InDesignUtils.Prefs = InDesignUtils.Prefs || {};

/**
 * Execute function with preserved measurement units
 * @param {Function} fn - Function to execute
 * @param {MeasurementUnits} units - Units to use during execution
 * @returns {*} Function result
 */
InDesignUtils.Prefs.withUnits = function (fn, units) {
    var sp = app.scriptPreferences;
    var originalUnit = null;

    try {
        originalUnit = sp.measurementUnit;
        if (units) sp.measurementUnit = units;
        return fn();
    } finally {
        try {
            if (originalUnit !== null) sp.measurementUnit = originalUnit;
        } catch (_) {}
    }
};

/**
 * Execute function with redraw disabled
 * @param {Function} fn - Function to execute
 * @returns {*} Function result
 */
InDesignUtils.Prefs.withoutRedraw = function (fn) {
    var sp = app.scriptPreferences;
    var originalRedraw = null;

    try {
        originalRedraw = sp.enableRedraw;
        sp.enableRedraw = false;
        return fn();
    } finally {
        try {
            if (originalRedraw !== null) sp.enableRedraw = originalRedraw;
        } catch (_) {}
    }
};

/**
 * Execute function with preserved global preferences
 * @param {Function} fn - Function to execute
 * @param {Object} tempPrefs - Temporary preferences to set
 * @returns {*} Function result
 */
InDesignUtils.Prefs.withSafePreferences = function (fn, tempPrefs) {
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
        } catch (_) {}
    }
};

/**
 * SECTION: General Utility Functions
 */
InDesignUtils.Utils = InDesignUtils.Utils || {};

/**
 * Format numbers with comma thousands separators
 * @param {number} n - Number to format
 * @returns {string} Formatted number string
 */
InDesignUtils.Utils.formatNumber = function (n) {
    var s = String(n);
    var isNeg = s.charAt(0) === "-";
    var x = isNeg ? s.substring(1) : s;
    var formatted = x.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
    return isNeg ? "-" + formatted : formatted;
};

/**
 * Get script file information
 * @returns {Object} Script file information
 */
InDesignUtils.Utils.getScriptInfo = function () {
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
InDesignUtils.Utils.loadUtility = function (fileName, required) {
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
