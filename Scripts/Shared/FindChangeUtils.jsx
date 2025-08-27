/**
 * FindChangeUtils.jsx — Standalone Find/Change utilities for InDesign (ExtendScript, ES3-safe)
 * Namespace: FindChange
 *
 * Public API:
 *  - FindChange.runFindChange(config, runner?)
 *  - FindChange.withFindChange(engine, options, fn)
 *  - FindChange.clearAllPrefs(engine)
 *  - FindChange.expandScope(scope, target?)
 *  - FindChange.report(results)
 *  - FindChange.configure(adapters)  // optional injection of { isValid, getActiveDocument, getSelection }
 *
 * Notes:
 *  - No global polyfills are added (e.g., Object.keys). Internal helpers are used instead.
 *  - Optional auto-wire: if InDesignUtils.Error and InDesignUtils.Objects exist, adapters are injected.
 */

// Namespace (ES3-safe)
var FindChange = FindChange || {};

(function (NS) {
    // Internal adapters with safe defaults
    var _adapters = {
        isValid: function (obj) {
            try {
                return obj && obj.isValid === true;
            } catch (e) {
                return false;
            }
        },
        getActiveDocument: function () {
            try {
                if (app.documents && app.documents.length > 0) {
                    var doc = app.activeDocument;
                    return doc && doc.isValid ? doc : null;
                }
            } catch (e) {}
            return null;
        },
        getSelection: function () {
            try {
                var doc = _adapters.getActiveDocument();
                if (!doc) return null;
                var sel = doc.selection;
                return sel && sel.length > 0 ? sel : null;
            } catch (e) {
                return null;
            }
        }
    };

    // Allow optional configuration/injection
    NS.configure = function (adapters) {
        if (!adapters) return;
        if (adapters.isValid) _adapters.isValid = adapters.isValid;
        if (adapters.getActiveDocument) _adapters.getActiveDocument = adapters.getActiveDocument;
        if (adapters.getSelection) _adapters.getSelection = adapters.getSelection;
    };

    // Helper: check if an object has any own enumerable properties
    function _hasAnyOwnProps(obj) {
        if (!obj) return false;
        for (var k in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, k)) return true;
        }
        return false;
    }

    /**
     * Unified find/change operation entry point
     * @param {Object} config - { engine, find, change, options, scope, target, dryRun }
     * @param {Function} runner - optional custom runner
     * @returns {Object} results
     */
    NS.runFindChange = function (config, runner) {
        config = config || {};
        var engine = config.engine || "text"; // "text" | "grep" | "glyph" | "object"
        var find = config.find || {};
        var change = config.change || {};
        var options = config.options || {};
        var scope = config.scope || "document"; // "selection" | "stories" | "document"
        var target = config.target || _adapters.getActiveDocument();
        var dryRun = config.dryRun || false;

        if (!target) {
            throw new Error("No target document available for find/change operation");
        }

        var results = {
            engine: engine,
            totalFound: 0,
            totalChanged: 0,
            details: [],
            errors: []
        };

        // Use custom runner or default implementation
        if (typeof runner === "function") {
            return runner(config, results);
        }

        // Default implementation using withFindChange helper
        return NS.withFindChange(engine, options, function () {
            try {
                // Set find preferences
                _setFindPreferences(engine, find);

                if (!dryRun) {
                    // Set change preferences
                    _setChangePreferences(engine, change);
                }

                // Resolve scope to concrete targets
                var targets = NS.expandScope(scope, target);

                // Execute find/change on each target
                for (var i = 0; i < targets.length; i++) {
                    var currentTarget = targets[i];
                    if (!_adapters.isValid(currentTarget)) continue;

                    try {
                        var found = _executeFind(engine, currentTarget);
                        var foundCount = found ? found.length : 0;
                        results.totalFound += foundCount;

                        if (foundCount > 0 && !dryRun) {
                            _executeChange(engine, currentTarget);
                            results.totalChanged += foundCount; // Assume all found items were changed
                        }

                        results.details.push({
                            target: _getTargetName(currentTarget),
                            found: foundCount,
                            changed: dryRun ? 0 : foundCount
                        });
                    } catch (e) {
                        results.errors.push({
                            target: _getTargetName(currentTarget),
                            error: e.toString()
                        });
                    }
                }

                return results;
            } catch (e2) {
                results.errors.push({ target: "global", error: e2.toString() });
                return results;
            }
        });
    };

    /**
     * Execute find/change with automatic preference cleanup and state restoration
     */
    NS.withFindChange = function (engine, options, fn) {
        options = options || {};
        var savedOptions = {};

        try {
            // Clear current preferences first
            NS.clearAllPrefs(engine);

            // Save and set options if present
            if (_hasAnyOwnProps(options)) {
                _saveAndSetOptions(engine, options, savedOptions);
            }

            return fn();
        } finally {
            // Restore options then clear prefs
            _restoreOptions(engine, savedOptions);
            NS.clearAllPrefs(engine);
        }
    };

    /**
     * Clear all find/change preferences for specified engine
     */
    NS.clearAllPrefs = function (engine) {
        try {
            switch (engine) {
                case "text":
                    app.findTextPreferences = app.changeTextPreferences = NothingEnum.nothing;
                    break;
                case "grep":
                    app.findGrepPreferences = app.changeGrepPreferences = NothingEnum.nothing;
                    break;
                case "glyph":
                    app.findGlyphPreferences = app.changeGlyphPreferences = NothingEnum.nothing;
                    break;
                case "object":
                    app.findObjectPreferences = app.changeObjectPreferences = NothingEnum.nothing;
                    break;
                default:
                    app.findTextPreferences = app.changeTextPreferences = NothingEnum.nothing;
                    app.findGrepPreferences = app.changeGrepPreferences = NothingEnum.nothing;
                    app.findGlyphPreferences = app.changeGlyphPreferences = NothingEnum.nothing;
                    app.findObjectPreferences = app.changeObjectPreferences = NothingEnum.nothing;
            }
        } catch (e) {
            // Ignore: preferences may not be available in current context
        }
    };

    /**
     * Expand scope specification to concrete story/container objects
     */
    NS.expandScope = function (scope, target) {
        var targets = [];
        try {
            switch (scope) {
                case "selection":
                    var sel = _adapters.getSelection();
                    if (sel && sel.length > 0) targets = sel;
                    else targets = [target];
                    break;
                case "stories":
                    if (target && target.stories) {
                        var stories = target.stories.everyItem().getElements();
                        for (var i = 0; i < stories.length; i++) {
                            if (_adapters.isValid(stories[i])) targets.push(stories[i]);
                        }
                    }
                    break;
                case "document":
                default:
                    if (_adapters.isValid(target)) targets = [target];
                    break;
            }
        } catch (e) {
            if (_adapters.isValid(target)) targets = [target];
        }
        return targets;
    };

    /**
     * Generate report from find/change results
     */
    NS.report = function (results) {
        var report = {
            summary: "",
            details: results.details || [],
            errors: results.errors || [],
            hasErrors: (results.errors || []).length > 0
        };
        var engine = (results.engine || "unknown").toUpperCase();
        var found = results.totalFound || 0;
        var changed = results.totalChanged || 0;
        if (found === 0) report.summary = "No matches found for " + engine + " operation.";
        else if (changed === 0)
            report.summary = "Found " + found + " matches for " + engine + " operation (dry run - no changes made).";
        else
            report.summary =
                "Found " + found + " matches and made " + changed + " changes using " + engine + " operation.";
        return report;
    };

    // PRIVATE HELPERS ------------------------------------------------------
    function _saveAndSetOptions(engine, options, savedOptions) {
        try {
            var optionsObj = _getOptionsObject(engine);
            if (!optionsObj) return;

            var keys = _getOptionKeys(engine);
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                if (typeof optionsObj[key] !== "undefined") {
                    savedOptions[key] = optionsObj[key];
                }
            }

            for (var k in options) {
                if (Object.prototype.hasOwnProperty.call(options, k) && typeof optionsObj[k] !== "undefined") {
                    optionsObj[k] = options[k];
                }
            }
        } catch (e) {}
    }

    function _restoreOptions(engine, savedOptions) {
        try {
            var optionsObj = _getOptionsObject(engine);
            if (!optionsObj) return;
            for (var k in savedOptions) {
                if (Object.prototype.hasOwnProperty.call(savedOptions, k)) {
                    try {
                        optionsObj[k] = savedOptions[k];
                    } catch (e) {}
                }
            }
        } catch (e2) {}
    }

    function _getOptionsObject(engine) {
        switch (engine) {
            case "text":
                return app.findChangeTextOptions;
            case "grep":
                return app.findChangeGrepOptions;
            case "glyph":
                return app.findChangeGlyphOptions;
            case "object":
                return app.findChangeObjectOptions;
            default:
                return null;
        }
    }

    // Option keys per engine (ES3-safe static arrays)
    var textKeys = [
        "caseSensitive",
        "wholeWord",
        "ignoreAccents",
        "ignoreDiacritics",
        "kanjiNumberConversion",
        // Inclusive search flags (supported in modern InDesign versions; safely ignored if unavailable)
        "includeFootnotes",
        "includeHiddenLayers",
        "includeLockedLayersForFind",
        "includeLockedStoriesForFind",
        "includeMasterPages"
    ];
    var grepKeys = [
        "includeFootnotes",
        "includeHiddenLayers",
        "includeLockedLayersForFind",
        "includeLockedStoriesForFind",
        "includeMasterPages",
        "includeNoteStories",
        "includeTableContents",
        "includeXMP"
    ];
    var glyphKeys = ["searchRange"];
    var objectKeys = ["includeMasterPages", "includeLockedLayersForFind", "includeHiddenLayers", "includeFootnotes"];

    function _getOptionKeys(engine) {
        switch (engine) {
            case "text":
                return textKeys;
            case "grep":
                return grepKeys;
            case "glyph":
                return glyphKeys;
            case "object":
                return objectKeys;
            default:
                return [];
        }
    }

    function _setFindPreferences(engine, findPrefs) {
        var prefsObj = _getFindPreferencesObject(engine);
        if (!prefsObj || !findPrefs) return;
        for (var key in findPrefs) {
            if (Object.prototype.hasOwnProperty.call(findPrefs, key)) {
                try {
                    prefsObj[key] = findPrefs[key];
                } catch (e) {}
            }
        }
    }

    function _setChangePreferences(engine, changePrefs) {
        var prefsObj = _getChangePreferencesObject(engine);
        if (!prefsObj || !changePrefs) return;
        for (var key in changePrefs) {
            if (Object.prototype.hasOwnProperty.call(changePrefs, key)) {
                try {
                    prefsObj[key] = changePrefs[key];
                } catch (e) {}
            }
        }
    }

    function _getFindPreferencesObject(engine) {
        switch (engine) {
            case "text":
                return app.findTextPreferences;
            case "grep":
                return app.findGrepPreferences;
            case "glyph":
                return app.findGlyphPreferences;
            case "object":
                return app.findObjectPreferences;
            default:
                return null;
        }
    }

    function _getChangePreferencesObject(engine) {
        switch (engine) {
            case "text":
                return app.changeTextPreferences;
            case "grep":
                return app.changeGrepPreferences;
            case "glyph":
                return app.changeGlyphPreferences;
            case "object":
                return app.changeObjectPreferences;
            default:
                return null;
        }
    }

    function _executeFind(engine, target) {
        switch (engine) {
            case "text":
                return target.findText ? target.findText() : [];
            case "grep":
                return target.findGrep ? target.findGrep() : [];
            case "glyph":
                return target.findGlyph ? target.findGlyph() : [];
            case "object":
                return target.findObject ? target.findObject() : [];
            default:
                return [];
        }
    }

    function _executeChange(engine, target) {
        switch (engine) {
            case "text":
                return target.changeText ? target.changeText() : false;
            case "grep":
                return target.changeGrep ? target.changeGrep() : false;
            case "glyph":
                return target.changeGlyph ? target.changeGlyph() : false;
            case "object":
                return target.changeObject ? target.changeObject() : false;
            default:
                return false;
        }
    }

    function _getTargetName(target) {
        try {
            if (target.name) return target.name;
            if (target.constructor && target.constructor.name) return target.constructor.name;
            return "Unknown";
        } catch (e) {
            return "Invalid";
        }
    }

    // Expose for reporting in custom runners (used by some scripts during migration)
    NS._getTargetName = _getTargetName;

    // Backward-friendly helper maintained for existing scripts
    NS.withCleanPrefs = function (fn, scope, options) {
        options = options || {};
        var engine = options.engine || "text";
        return NS.withFindChange(engine, options, function () {
            return fn(scope || _adapters.getActiveDocument());
        });
    };

    // Auto-wire from InDesignUtils if available (optional)
    try {
        if (typeof InDesignUtils !== "undefined" && InDesignUtils.Error && InDesignUtils.Objects) {
            NS.configure({
                isValid: InDesignUtils.Error.isValid,
                getActiveDocument: InDesignUtils.Objects.getActiveDocument,
                getSelection: InDesignUtils.Objects.getSelection
            });
        }
    } catch (e) {}
})(FindChange);
