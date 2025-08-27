/*
ExportPDF.jsx

Purpose:
- Export the active InDesign document to PDF in normal and/or reversed page order.
- Optional: Remove the first two pages (cover + blank) from the export.
- Allow exporting both normal and reversed PDFs in one operation, using a chosen PDF preset and output folder.
- Additional PDF settings: security options, hyperlinks/bookmarks, layers, and viewer preferences.

Features:
- Page ordering: Normal sequential order and/or fully reversed page order
- Page removal: Optional removal of first two pages (applies only to reversed export)
- Security settings: Enable PDF security with restrictions on printing, copying, and document changes
- Export options: Include/exclude hyperlinks, bookmarks, and layers
- Viewer options: Automatically view PDF after export
- Progress feedback: Shows export progress with a progress bar

Non-destructive:
- The original document is never modified. Page order is controlled through PDF export page ranges.
- All PDF export preferences are restored to their original state after export.

Usage:
- Run with a document open.
- Choose export options (normal/reversed order, page removal).
- Configure PDF settings (security, hyperlinks, bookmarks, layers, viewer).
- Select a PDF preset, output folder, and base filename.
- Click Export.
*/

/* global UIUtils, ExportUtils */
// SECTION: Bootstrapping & Guards
// - Load shared utilities and verify an active document exists before proceeding.
// - Provide simple notify helpers via UIUtils.
(function () {
    // Load shared utilities (Shared/InDesignUtils.jsx)
    try {
        var __scriptFile = File($.fileName);
        // This script is in Scripts/Export, utilities are in Scripts/Shared
        var __utilsFile = File(__scriptFile.parent.parent + "/Shared/InDesignUtils.jsx");
        if (__utilsFile.exists) {
            $.evalFile(__utilsFile);
        } else {
            alert("Required utilities not found: " + __utilsFile.fsName);
            return;
        }

        // Load UI utilities
        var __uiUtilsFile = File(__scriptFile.parent.parent + "/Shared/UIUtils.jsx");
        if (__uiUtilsFile.exists) $.evalFile(__uiUtilsFile);

        // Load Export utilities
        var __exportUtilsFile = File(__scriptFile.parent.parent + "/Shared/ExportUtils.jsx");
        if (__exportUtilsFile.exists) $.evalFile(__exportUtilsFile);
        if (typeof InDesignUtils === "undefined") {
            alert("Failed to load required utilities.");
            return;
        }
    } catch (_loadErr) {
        try {
            alert("Failed to load utilities: " + _loadErr);
        } catch (_) {}
        return;
    }
    function showDialog(message, title) {
        return UIUtils.showMessage(title || "Message", String(message));
    }
    // Local notifier delegating to shared utilities
    function notify(msg, title) {
        return UIUtils.alert(String(msg), title || "Message");
    }
    if (!app || !app.documents || app.documents.length === 0) {
        showDialog("Open a document before running ExportPDF.", "Export PDF");
        return;
    }

    var doc = InDesignUtils.Objects.getActiveDocument();
    if (!doc) {
        showDialog("Open a document before running ExportPDF.", "Export PDF");
        return;
    }

    // Helper function to get the default base name for export files
    function getBaseName(f) {
        try {
            var n = f && f.name ? f.name : doc.name;
            var lastDot = n.lastIndexOf(".");
            if (lastDot > 0) return n.substring(0, lastDot);
            return n;
        } catch (e) {
            return "Export";
        }
    }

    // Collect available PDF presets
    var presetNames = [];
    var presetObjs = [];
    try {
        var presets = app.pdfExportPresets;
        for (var i = 0; i < presets.length; i++) {
            presetNames.push(presets[i].name);
            presetObjs.push(presets[i]);
        }
    } catch (e) {}

    if (presetNames.length === 0) {
        showDialog("No PDF export presets found. Create a PDF preset and try again.", "Export PDF");
        return;
    }

    // SECTION: UI Construction
    // Build user interface
    var w = new Window("dialog", "Export PDF (Normal/Reversed)");
    w.orientation = "column";
    w.alignChildren = ["fill", "top"];
    w.margins = 16;
    w.spacing = 12;

    w.add("statictext", undefined, "Choose what to export and how:");

    var optionsPanel = w.add("panel", undefined, "Export Options");
    optionsPanel.orientation = "column";
    optionsPanel.alignChildren = ["left", "top"];
    optionsPanel.margins = 12;
    optionsPanel.spacing = 6;
    var cbNormal = optionsPanel.add("checkbox", undefined, "Export Normal order");
    cbNormal.value = true;
    var cbReversed = optionsPanel.add("checkbox", undefined, "Export Reversed order");
    cbReversed.value = false;
    var cbRemoveTwo = optionsPanel.add("checkbox", undefined, "Remove first two pages (cover + blank) before export");
    cbRemoveTwo.value = false; // initially unchecked
    // This option applies only to reversed export; disable when not reversed
    cbRemoveTwo.enabled = cbReversed.value;
    cbReversed.onClick = function () {
        cbRemoveTwo.enabled = cbReversed.value;
        cbRemoveTwo.value = cbReversed.value; // mirror reversed selection
    };

    var presetGroup = w.add("group");
    presetGroup.orientation = "row";
    presetGroup.alignChildren = ["left", "center"];
    presetGroup.spacing = 8;
    presetGroup.add("statictext", undefined, "PDF Preset:");
    var presetDropdown = presetGroup.add("dropdownlist", undefined, presetNames);
    // Default to [Press Quality] if available, otherwise use first preset
    var defaultPresetIndex = 0;
    for (var pi = 0; pi < presetNames.length; pi++) {
        if (presetNames[pi] === "[Press Quality]") {
            defaultPresetIndex = pi;
            break;
        }
    }
    presetDropdown.selection = presetDropdown.items[defaultPresetIndex];

    // PDF Settings panel for additional options
    var settingsPanel = w.add("panel", undefined, "PDF Settings");
    settingsPanel.orientation = "column";
    settingsPanel.alignChildren = ["left", "top"];
    settingsPanel.margins = 12;
    settingsPanel.spacing = 8;

    var cbUseSecurity = settingsPanel.add(
        "checkbox",
        undefined,
        "Enable PDF security (restrict printing, copying, and changes)"
    );
    cbUseSecurity.value = false;

    var cbInteractivePDF = settingsPanel.add("checkbox", undefined, "Interactive PDF (working hyperlinks and buttons)");
    cbInteractivePDF.value = false;

    var cbViewPDF;

    // Watermark section
    var sep = settingsPanel.add("group", undefined, "");
    sep.margins = 0;
    sep.spacing = 0;
    sep.alignment = ["fill", "top"];
    sep.alignChildren = ["fill", "fill"]; // thin separator without extra spacing
    var sepLine = sep.add("panel", undefined, "");
    sepLine.margins = 0;
    sepLine.preferredSize.height = 1; // 1px line

    var cbWatermark = settingsPanel.add("checkbox", undefined, "Add text watermark (preconfigured styling)");
    cbWatermark.value = false;

    var watermarkGroup = settingsPanel.add("group");
    watermarkGroup.orientation = "column";
    watermarkGroup.alignChildren = ["fill", "top"];
    watermarkGroup.spacing = 4;
    watermarkGroup.margins = [20, 0, 0, 0]; // indent

    var watermarkTextGroup = watermarkGroup.add("group");
    watermarkTextGroup.orientation = "row";
    watermarkTextGroup.alignChildren = ["left", "center"];
    watermarkTextGroup.spacing = 8;
    watermarkTextGroup.add("statictext", undefined, "Text:");
    var watermarkTextEdit = watermarkTextGroup.add("edittext", undefined, "Sample");
    watermarkTextEdit.characters = 20;

    // Enable/disable watermark text input based on main checkbox
    function updateWatermarkEnabled() {
        watermarkTextEdit.enabled = cbWatermark.value;
    }
    // SECTION: Compatibility & State Helpers
    // Compatibility: Security is not supported with Interactive PDFs.
    function updateCompatibility() {
        try {
            if (cbInteractivePDF.value) {
                cbUseSecurity.value = false;
                cbUseSecurity.enabled = false;
            } else {
                cbUseSecurity.enabled = true;
            }
        } catch (_e) {}
    }
    updateWatermarkEnabled();
    cbWatermark.onClick = updateWatermarkEnabled;
    cbInteractivePDF.onClick = updateCompatibility;
    cbUseSecurity.onClick = function () {
        if (cbUseSecurity.value) {
            cbInteractivePDF.value = false;
        }
        updateCompatibility();
    };
    updateCompatibility();

    // Place View PDF option last in Settings panel
    cbViewPDF = settingsPanel.add("checkbox", undefined, "View PDF after export");
    cbViewPDF.value = false;

    var folderPanel = w.add("panel", undefined, "Output");
    folderPanel.orientation = "column";
    folderPanel.alignChildren = ["fill", "top"];
    folderPanel.margins = 12;
    folderPanel.spacing = 8;
    var baseNameGroup = folderPanel.add("group");
    baseNameGroup.orientation = "row";
    baseNameGroup.alignChildren = ["left", "center"];
    baseNameGroup.spacing = 8;
    baseNameGroup.add("statictext", undefined, "Base filename:");
    var baseNameEdit = baseNameGroup.add(
        "edittext",
        undefined,
        getBaseName(doc.saved ? doc.fullName : { name: doc.name })
    );
    baseNameEdit.characters = 30;

    var pathGroup = folderPanel.add("group");
    pathGroup.orientation = "row";
    pathGroup.alignChildren = ["fill", "center"];
    pathGroup.spacing = 8;
    var pathEdit = pathGroup.add("edittext", undefined, doc.saved ? doc.fullName.parent.fsName : Folder.desktop.fsName);
    pathEdit.characters = 40;
    var browseBtn = pathGroup.add("button", undefined, "Choose Folder...");
    browseBtn.onClick = function () {
        var f = Folder.selectDialog("Select a folder for the exported PDFs");
        if (f) pathEdit.text = f.fsName;
    };

    // Option: export into a 'PDF' subfolder under the selected directory
    var pdfSubfolderCheckbox = folderPanel.add("checkbox", undefined, "Export to PDF folder");
    pdfSubfolderCheckbox.value = false;

    var btns = w.add("group");
    btns.alignment = "right";
    var cancelBtn = btns.add("button", undefined, "Cancel");
    var okBtn = btns.add("button", undefined, "Export", { name: "ok" });

    okBtn.onClick = function () {
        w.close(1);
    };
    cancelBtn.onClick = function () {
        w.close(0);
    };

    if (w.show() !== 1) {
        return;
    }

    // Validations
    if (!cbNormal.value && !cbReversed.value) {
        showDialog("Select at least one of: Export Normal or Export Reversed.", "Export PDF");
        return;
    }

    // Conditional even-page requirement: only when exporting Reversed
    try {
        var totalPages = doc.pages.length;
        if (cbReversed.value && totalPages % 2 === 1) {
            notify("This document ends on an odd page. Please fix the pagination or deselect 'Export Reversed'.");
            return;
        }
    } catch (eOdd) {}

    // Determine output folder; if 'Export to PDF folder' is checked, use a 'PDF' subfolder
    var selectedFolder = new Folder(pathEdit.text);
    var outFolder = selectedFolder;
    if (pdfSubfolderCheckbox.value) {
        outFolder = new Folder(selectedFolder.fsName + "/PDF");
    }
    if (!outFolder.exists) {
        if (!outFolder.create()) {
            notify("Could not access or create the output folder.");
            return;
        }
    }

    var baseName = baseNameEdit.text.replace(new RegExp('[\\/:*?"<>|]', "g"), "_");
    if (!baseName || baseName.replace(/\s+/g, "").length === 0) {
        notify("Please provide a valid base filename.");
        return;
    }

    var preset = presetObjs[presetDropdown.selection.index];

    // Overset text check: abort export if any text frame overflows
    function _findOversetFrames(d) {
        var hits = [];
        try {
            var tfs = d.textFrames;
            for (var i = 0; i < tfs.length; i++) {
                var tf = tfs[i];
                if (tf && tf.isValid) {
                    try {
                        if (tf.overflows === true) {
                            var pg = null;
                            try {
                                pg = tf.parentPage ? tf.parentPage.name : null;
                            } catch (_) {}
                            hits.push(pg ? "Page " + pg : "Pasteboard/No page");
                        }
                    } catch (_eOf) {}
                }
            }
        } catch (_eAll) {}
        return hits;
    }
    var __overs = _findOversetFrames(doc);
    if (__overs && __overs.length > 0) {
        notify("Overset text detected in " + __overs.length + " text frame(s). Please fix overset before exporting.");
        return;
    }

    // Create progress UI using shared utility only
    var __pw = UIUtils.createProgressWindow("Exporting PDFs", { width: 520, initialText: "Starting…" });
    var _prog = {
        set: function (txt, percent) {
            __pw.update(typeof percent === "number" ? percent : undefined, txt || undefined);
        },
        close: function () {
            __pw.close();
        }
    };

    // Export function that uses page range specification (completely non-destructive)
    function exportVariant(isReversed, removeFirstTwo, outFile) {
        var useInteractive = cbInteractivePDF.value;
        var totalPages = doc.pages.length;

        // Variables for storing original preferences (different for regular vs interactive PDF)
        var origPageRange = null;
        var origReaderSpreads = null;
        var origUseSecurity = null;
        var origDisallowPrinting = null;
        var origDisallowCopying = null;
        var origDisallowChanging = null;
        var origViewPDF = null;

        try {
            if (useInteractive) {
                // Store and apply interactive PDF preferences
                var intPrefs = app.interactivePDFExportPreferences;
                try {
                    origPageRange = intPrefs.pageRange;
                } catch (_e0) {}
                try {
                    origReaderSpreads = intPrefs.exportReaderSpreads;
                } catch (_e1) {}
                try {
                    origViewPDF = intPrefs.viewPDF;
                } catch (_e2) {}

                // Apply interactive PDF settings
                try {
                    intPrefs.exportReaderSpreads = false;
                } catch (_eRS) {}
                try {
                    intPrefs.viewPDF = cbViewPDF.value;
                } catch (_eVP) {}
            } else {
                // Store and apply regular PDF preferences
                var pdfPrefs = app.pdfExportPreferences;
                try {
                    origPageRange = pdfPrefs.pageRange;
                } catch (_e0) {}
                try {
                    origReaderSpreads = pdfPrefs.exportReaderSpreads;
                } catch (_e1) {}
                try {
                    origUseSecurity = pdfPrefs.useSecurity;
                } catch (_e2) {}
                try {
                    origDisallowPrinting = pdfPrefs.disallowPrinting;
                } catch (_e3) {}
                try {
                    origDisallowCopying = pdfPrefs.disallowCopying;
                } catch (_e4) {}
                try {
                    origDisallowChanging = pdfPrefs.disallowChanging;
                } catch (_e5) {}
                try {
                    origViewPDF = pdfPrefs.viewPDF;
                } catch (_e6) {}

                // Apply regular PDF settings
                try {
                    pdfPrefs.exportReaderSpreads = false;
                } catch (_eRS) {}
                try {
                    pdfPrefs.useSecurity = cbUseSecurity.value;
                } catch (_eUS) {}
                if (cbUseSecurity.value) {
                    try {
                        pdfPrefs.disallowPrinting = true;
                    } catch (_eDP) {}
                    try {
                        pdfPrefs.disallowCopying = true;
                    } catch (_eDC) {}
                    try {
                        pdfPrefs.disallowChanging = true;
                    } catch (_eDCh) {}
                }
                try {
                    pdfPrefs.viewPDF = cbViewPDF.value;
                } catch (_eVP) {}
            }

            // Build page range string based on export requirements
            var pageRange = "";

            if (!isReversed) {
                // Normal export: sequential pages 1 through N (use absolute numbering with '+')
                _prog.set("Preparing normal page range…", 20);
                pageRange = "+1-+" + totalPages;
            } else {
                // Reversed export: pages in reverse order, optionally skipping first two
                _prog.set("Preparing reversed page range…", 20);
                var startPage = removeFirstTwo ? 3 : 1;

                if (startPage > totalPages) {
                    return false; // nothing to export after removal
                }

                // Build a comma-separated reverse page list with absolute numbers: "+N,+N-1,...,+startPage"
                var pages = [];
                for (var p = totalPages; p >= startPage; p--) {
                    pages.push("+" + p.toString());
                }
                pageRange = pages.join(",");

                if (pages.length === 0) {
                    return false; // nothing to export
                }
            }

            // Set page range and export based on PDF type
            if (useInteractive) {
                _prog.set("Exporting: " + outFile.name, 60);
                app.interactivePDFExportPreferences.pageRange = pageRange;
                doc.exportFile(ExportFormat.INTERACTIVE_PDF, outFile, false);
            } else {
                _prog.set("Exporting: " + outFile.name, 60);
                app.pdfExportPreferences.pageRange = pageRange;
                doc.exportFile(ExportFormat.PDF_TYPE, outFile, false, preset);
            }

            _prog.set("Exported: " + outFile.fsName, 100);
            return true;
        } catch (e) {
            notify("Export failed: " + e);
            return false;
        } finally {
            // Restore original preferences based on export type
            if (useInteractive) {
                // Restore interactive PDF preferences
                try {
                    if (origPageRange !== null) app.interactivePDFExportPreferences.pageRange = origPageRange;
                } catch (_r0) {}
                try {
                    if (origReaderSpreads !== null)
                        app.interactivePDFExportPreferences.exportReaderSpreads = origReaderSpreads;
                } catch (_r1) {}
                try {
                    if (origViewPDF !== null) app.interactivePDFExportPreferences.viewPDF = origViewPDF;
                } catch (_r2) {}
            } else {
                // Restore regular PDF preferences
                try {
                    if (origPageRange !== null) app.pdfExportPreferences.pageRange = origPageRange;
                } catch (_r0) {}
                try {
                    if (origReaderSpreads !== null) app.pdfExportPreferences.exportReaderSpreads = origReaderSpreads;
                } catch (_r1) {}
                try {
                    if (origUseSecurity !== null) app.pdfExportPreferences.useSecurity = origUseSecurity;
                } catch (_r2) {}
                try {
                    if (origDisallowPrinting !== null) app.pdfExportPreferences.disallowPrinting = origDisallowPrinting;
                } catch (_r3) {}
                try {
                    if (origDisallowCopying !== null) app.pdfExportPreferences.disallowCopying = origDisallowCopying;
                } catch (_r4) {}
                try {
                    if (origDisallowChanging !== null) app.pdfExportPreferences.disallowChanging = origDisallowChanging;
                } catch (_r5) {}
                try {
                    if (origViewPDF !== null) app.pdfExportPreferences.viewPDF = origViewPDF;
                } catch (_r6) {}
            }
        }
    }

    // SECTION: Export Execution Helpers
    // - exportNormal delegates to exportVariant for consistent logic.
    // - applyWatermarkLayer/removeWatermarkLayer proxy to ExportUtils when available.
    // Descriptive function names: Normal = exportNormal; Reversed = exportVariant (isReversed = true)
    function exportNormal(outFile) {
        return exportVariant(false, false, outFile);
    }

    function applyWatermarkLayer(doc, text) {
        if (typeof ExportUtils !== "undefined" && ExportUtils.applyWatermarkLayer) {
            return ExportUtils.applyWatermarkLayer(doc, text);
        }
        // Fallback: if ExportUtils isn't available, do nothing
        return null;
    }

    function removeWatermarkLayer(doc, lyr) {
        if (typeof ExportUtils !== "undefined" && ExportUtils.removeWatermarkLayer) {
            return ExportUtils.removeWatermarkLayer(doc, lyr);
        }
        // Fallback: attempt simple removal if utils not available
        if (lyr && lyr.isValid) {
            try {
                lyr.remove();
            } catch (_e) {}
        }
    }

    var didSomething = false;
    var tmpWM = null;

    // SECTION: Single Undo Wrapper & Preference Safety
    // Wrap export work in one undo step and use Prefs.withSafePreferences to normalize
    // global settings and restore them afterward.
    app.doScript(
        function () {
            function runExports() {
                // Apply watermark if selected (this is the destructive part)
                if (cbWatermark.value) {
                    // Use the UI value or "Sample" as default
                    tmpWM = applyWatermarkLayer(doc, String(watermarkTextEdit.text || "Sample"));
                }

                // Normal
                if (cbNormal.value) {
                    var normalFile = File(outFolder.fsName + "/" + baseName + ".pdf");
                    _prog.set("Exporting: " + normalFile.name, 10);
                    // Removal of first two pages is NOT applied for normal export
                    if (exportNormal(normalFile)) didSomething = true;
                }

                // Reversed
                if (cbReversed.value) {
                    var reversedFile = File(outFolder.fsName + "/" + baseName + "-reversed.pdf");
                    _prog.set("Exporting: " + reversedFile.name, tmpWM ? 60 : 10);
                    if (exportVariant(true, cbRemoveTwo.value, reversedFile)) didSomething = true;
                }
            }

            try {
                InDesignUtils.Prefs.withSafePreferences(
                    function () {
                        // Normalize units and suppress redraw during heavy operations
                        return runExports();
                    },
                    { measurementUnit: MeasurementUnits.POINTS, enableRedraw: false }
                );
            } finally {
                // Always clean up watermark layer first, then close progress
                if (tmpWM) {
                    try {
                        removeWatermarkLayer(doc, tmpWM);
                    } catch (_ew) {}
                }
                try {
                    _prog.close();
                } catch (_ec) {}
            }
        },
        ScriptLanguage.JAVASCRIPT,
        undefined,
        UndoModes.ENTIRE_SCRIPT,
        "Export PDF"
    );

    // SECTION: Post-Export UI & Viewer Activation
    // Notify the user and optionally bring a PDF viewer to the foreground via ExportUtils.
    if (didSomething) {
        notify("Export completed.");

        // Bring PDF viewer to front AFTER the completion dialog is dismissed
        if (cbViewPDF.value) {
            try {
                // Small delay to ensure dialog is dismissed and PDF is ready
                $.sleep(300);

                // Bring PDF viewer to front using shared helper
                if (typeof ExportUtils !== "undefined" && ExportUtils.bringPdfViewerToFront) {
                    try {
                        ExportUtils.bringPdfViewerToFront();
                    } catch (_ef) {}
                }
            } catch (e) {
                // Silently ignore focus errors - export was successful
            }
        }
    } else {
        notify("Nothing was exported.");
    }

    // SECTION: Cleanup
    // Reset find/change preferences to avoid leaking state
    try {
        app.findTextPreferences = app.changeTextPreferences = NothingEnum.nothing;
        app.findGrepPreferences = app.changeGrepPreferences = NothingEnum.nothing;
    } catch (_fcReset) {}
})();
