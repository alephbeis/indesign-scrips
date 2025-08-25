/**
 * ExportPDF (UXP)
 *
 * Purpose:
 * - UXP-based export of the active InDesign document to PDF in normal and/or reversed page order.
 * - Optional: Skip the first two pages (cover + blank) for the reversed export.
 * - Uses a chosen PDF preset and a sensible output location.
 *
 * Notes:
 * - This UXP script avoids ScriptUI; configure behavior via CONFIG below.
 * - Security options and watermarking are not included in this UXP version.
 * - Follows Engineering Code Standards: single undo, prefs restore, early returns.
 */

/* global require */
"use strict";

// Configuration (edit defaults as needed)
var CONFIG = {
    exportNormal: true, // export in normal page order (+1-+N)
    exportReversed: true, // export in reversed order (+N,+N-1,...)
    removeFirstTwoInReversed: false, // when reversed, skip first two pages (start at +3)
    presetName: "[Press Quality]", // default preset by name; falls back to first available if not found
    viewAfterExport: false, // open exported PDF(s) after export
    output: {
        strategy: "document", // 'document' | 'documentSubfolder' | 'scriptsFolder'
        subfolderName: "PDF", // used when strategy === 'documentSubfolder'
        filenameBase: null // if null, derived from active document name (without extension)
    }
};

(function main() {
    var app, ExportFormat, UndoModes, MeasurementUnits;
    try {
        // UXP-style import of InDesign DOM
        var ind = require("indesign");
        app = ind.app;
        ExportFormat = ind.ExportFormat;
        UndoModes = ind.UndoModes;
        MeasurementUnits = ind.MeasurementUnits;
    } catch (e) {
        var msg = 'This script requires InDesign UXP scripting (require("indesign")).';
        try {
            alert(msg);
        } catch (_) {}
        return;
    }

    // Helper: run a function inside a single undo step
    function runWithUndo(name, fn) {
        return app.doScript(fn, undefined, undefined, UndoModes.ENTIRE_SCRIPT, name);
    }

    // Simple join for folder and file name
    function joinPath(folderPath, filename) {
        if (!folderPath) return filename;
        var last = folderPath.charAt(folderPath.length - 1);
        var sepNeeded = last !== "/" && last !== "\\";
        return folderPath + (sepNeeded ? "/" : "") + filename;
    }

    // Helper: build a safe output target (File if available; else OS path string)
    function makeOutputTarget(folderPath, filename) {
        var fullPath = joinPath(folderPath, filename);
        // In some environments, ExtendScript File may still exist; otherwise, pass string path
        try {
            if (typeof File !== "undefined") {
                return new File(fullPath);
            }
        } catch (_) {}
        return fullPath; // assume UXP accepts path string for exportFile target
    }

    // Helper: derive folder path for output
    function resolveOutputFolder(doc) {
        try {
            if (CONFIG.output.strategy === "scriptsFolder") {
                var sf = app.scriptPreferences && app.scriptPreferences.scriptsFolder;
                return String(sf && (sf.fsName || sf));
            }
            var docFolder = "";
            try {
                if (doc && doc.filePath) docFolder = String(doc.filePath);
            } catch (e1) {}
            if (!docFolder) {
                try {
                    if (doc && doc.fullName && doc.fullName.parent)
                        docFolder = String(doc.fullName.parent.fsName || doc.fullName.parent);
                } catch (e2) {}
            }
            if (!docFolder) {
                var sf2 = app.scriptPreferences && app.scriptPreferences.scriptsFolder;
                docFolder = String(sf2 && (sf2.fsName || sf2));
            }
            if (CONFIG.output.strategy === "documentSubfolder") {
                var sub = joinPath(docFolder, CONFIG.output.subfolderName || "PDF");
                // Best-effort folder creation where possible (ExtendScript Folder). If not available, assume exists/created by user.
                try {
                    if (typeof Folder !== "undefined") {
                        var f = new Folder(sub);
                        if (!f.exists) f.create();
                    }
                } catch (_) {}
                return sub;
            }
            // default: document folder
            return docFolder;
        } catch (_) {
            var sf3 = app.scriptPreferences && app.scriptPreferences.scriptsFolder;
            return String(sf3 && (sf3.fsName || sf3));
        }
    }

    // Helper: base name from doc name
    function getBaseName(doc) {
        if (CONFIG.output.filenameBase && String(CONFIG.output.filenameBase).replace(/^\s+|\s+$/g, "").length) {
            return String(CONFIG.output.filenameBase).replace(/^\s+|\s+$/g, "");
        }
        var n = "Export";
        try {
            n = String(doc && doc.name ? doc.name : "Export");
        } catch (_e) {}
        var i = n.lastIndexOf(".");
        return i > 0 ? n.substring(0, i) : n;
    }

    // Helper: find preset by name or fallback to first
    function resolvePresetByName(name) {
        try {
            var presets = app.pdfExportPresets;
            if (presets && presets.length > 0) {
                var i;
                // Try exact match first
                for (i = 0; i < presets.length; i++) {
                    if (String(presets[i].name) === String(name)) return presets[i];
                }
                // Try common Press Quality fallback
                for (i = 0; i < presets.length; i++) {
                    if (String(presets[i].name).toLowerCase().indexOf("press quality") !== -1) return presets[i];
                }
                return presets[0];
            }
        } catch (_) {}
        return null;
    }

    // Core exporter (print PDF only)
    function exportVariant(doc, opts) {
        var isReversed = opts && opts.isReversed;
        var removeFirstTwo = opts && opts.removeFirstTwo;
        var outTarget = opts && opts.outTarget;
        var preset = opts && opts.preset;
        var viewPDF = opts && opts.viewPDF;

        // Save original prefs and script prefs
        var sp = app.scriptPreferences;
        var origSP = {
            enableRedraw: sp.enableRedraw,
            measurementUnit: sp.measurementUnit
        };
        var pdfPrefs = app.pdfExportPreferences;
        var orig = {
            pageRange: pdfPrefs.pageRange,
            exportReaderSpreads: pdfPrefs.exportReaderSpreads,
            useSecurity: pdfPrefs.useSecurity,
            viewPDF: pdfPrefs.viewPDF
        };

        try {
            // Performance & predictability
            sp.enableRedraw = false;
            sp.measurementUnit = MeasurementUnits.POINTS;

            // Configure PDF prefs
            pdfPrefs.exportReaderSpreads = false;
            pdfPrefs.useSecurity = false; // not handled in UXP version
            pdfPrefs.viewPDF = !!viewPDF;

            // Build page range
            var totalPages = doc.pages.length;
            var pageRange = "";
            if (!isReversed) {
                pageRange = "+1-+" + totalPages;
            } else {
                var start = removeFirstTwo ? 3 : 1;
                if (start > totalPages) return false;
                var pages = [];
                var p;
                for (p = totalPages; p >= start; p--) pages.push("+" + p);
                if (pages.length === 0) return false;
                pageRange = pages.join(",");
            }
            pdfPrefs.pageRange = pageRange;

            // Execute export
            doc.exportFile(ExportFormat.PDF_TYPE, outTarget, false, preset);
            return true;
        } catch (e) {
            // User-safe failure notice
            var m = "Export failed" + (doc && doc.name ? " for " + doc.name : "") + ": " + e;
            try {
                alert(m);
            } catch (_) {}
            return false;
        } finally {
            // Restore prefs
            try {
                pdfPrefs.pageRange = orig.pageRange;
            } catch (_) {}
            try {
                pdfPrefs.exportReaderSpreads = orig.exportReaderSpreads;
            } catch (_) {}
            try {
                pdfPrefs.useSecurity = orig.useSecurity;
            } catch (_) {}
            try {
                pdfPrefs.viewPDF = orig.viewPDF;
            } catch (_) {}

            try {
                sp.measurementUnit = origSP.measurementUnit;
            } catch (_) {}
            try {
                sp.enableRedraw = origSP.enableRedraw;
            } catch (_) {}
        }
    }

    // Entry point guarded and undo-wrapped
    return runWithUndo("Export PDF (UXP)", function () {
        // Preconditions
        if (!app.documents || app.documents.length === 0) {
            try {
                alert("Open a document before running ExportPDF (UXP).");
            } catch (_) {}
            return;
        }
        var doc = app.activeDocument;

        // Resolve preset
        var preset = resolvePresetByName(CONFIG.presetName);
        if (!preset) {
            try {
                alert("No PDF export presets found. Create a PDF preset and try again.");
            } catch (_) {}
            return;
        }

        // Resolve output folder and filenames
        var folderPath = resolveOutputFolder(doc);
        var base = getBaseName(doc);

        var targets = [];
        if (CONFIG.exportNormal) {
            targets.push({
                isReversed: false,
                removeFirstTwo: false,
                name: base + ".pdf"
            });
        }
        if (CONFIG.exportReversed) {
            targets.push({
                isReversed: true,
                removeFirstTwo: !!CONFIG.removeFirstTwoInReversed,
                name: base + "-reversed.pdf"
            });
        }

        // Execute exports
        var i;
        for (i = 0; i < targets.length; i++) {
            var t = targets[i];
            var outTarget = makeOutputTarget(folderPath, t.name);
            exportVariant(doc, {
                isReversed: t.isReversed,
                removeFirstTwo: t.removeFirstTwo,
                outTarget: outTarget,
                preset: preset,
                viewPDF: CONFIG.viewAfterExport
            });
        }
    });
})();
