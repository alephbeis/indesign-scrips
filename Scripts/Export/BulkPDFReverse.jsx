/*
BulkPDFReverse.jsx

Purpose:
- Bulk export one PDF per "variant" layer (layers prefixed with "v-").
- For each variant layer: hide all other variant layers, show only that one, then export.
- Provides Export Options: Normal order, or Reverse order (reverse also removes the first two pages: cover + blank).
- Abort if the document ends on an odd page.

Conventions:
- Non-destructive: Uses pageRange-based export; document is not modified.
- Restores PDF export preferences and layer visibility states after completion.
- Follows UI/UX patterns used in this repo: preset selection and base filename; output location defaults to a 'PDF' subfolder next to the INDD file.

Usage:
- Open a document with variant layers named with prefix "v-".
- Run the script, choose PDF preset, base filename, and export option (Normal or Reverse).
- The script will export one PDF per variant layer to the 'PDF' subfolder: <base>-<layerName>.pdf
*/

(function () {
    // Load shared utilities (Shared/InDesignUtils.jsx)
    try {
        var __scriptFile = File($.fileName);
        var __utilsFile = File(__scriptFile.parent.parent + "/Shared/InDesignUtils.jsx");
        if (__utilsFile.exists) {
            $.evalFile(__utilsFile);
        } else {
            alert("Required utilities not found: " + __utilsFile.fsName);
            return;
        }
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

    var doc = InDesignUtils.Objects.getActiveDocument();
    if (!doc) {
        InDesignUtils.UI.showMessage(
            "Bulk Variant PDF Export",
            "Open a document before running BulkVariantPDFReverse."
        );
        return;
    }

    function notify(msg, title) {
        return InDesignUtils.UI.alert(String(msg), title || "Bulk Variant PDF Export");
    }

    var totalPages = doc.pages.length;

    // Note: Reverse export requires even number of pages; this will be validated after option selection.

    // Collect variant layers: names starting with "v-" (case-insensitive)
    function getVariantLayers(d) {
        var result = [];
        try {
            var layers = d.layers;
            for (var i = 0; i < layers.length; i++) {
                var nm = String(layers[i].name || "");
                if (/^v-/i.test(nm)) {
                    result.push(layers[i]);
                }
            }
        } catch (e) {}
        return result;
    }

    var variantLayers = getVariantLayers(doc);
    if (variantLayers.length === 0) {
        notify("No variant layers were found. A variant layer name must start with 'v-'.");
        return;
    }

    // Gather PDF presets
    var presetNames = [];
    var presetObjs = [];
    var presets = InDesignUtils.Error.safe(function () {
        return app.pdfExportPresets;
    }, []);

    if (presets && presets.length > 0) {
        for (var i = 0; i < presets.length; i++) {
            var currentPreset = presets[i];
            InDesignUtils.Error.safe(function () {
                presetNames.push(currentPreset.name);
                presetObjs.push(currentPreset);
            });
        }
    }

    if (presetNames.length === 0) {
        notify("No PDF export presets found. Create a PDF preset and try again.");
        return;
    }

    // Helpers
    function getBaseNameFromDoc(d) {
        var n = d.name || "Document";
        var dot = n.lastIndexOf(".");
        return dot > 0 ? n.substring(0, dot) : n;
    }

    function sanitizeFilenamePart(s) {
        return InDesignUtils.PDF.sanitizeFilenamePart(s, "_");
    }

    function getPdfSubfolder(d) {
        try {
            if (d.saved && d.filePath) {
                var base = d.filePath; // Folder
                return new Folder(base.fsName + "/PDF");
            }
        } catch (e) {}
        return null; // require saved doc to resolve
    }

    // Resolve output folder (document folder + '/PDF')
    var pdfFolder = getPdfSubfolder(doc);
    if (!pdfFolder) {
        notify(
            "Please save the document before exporting so the output folder can be created (a 'PDF' subfolder next to the INDD file)."
        );
        return;
    }

    // UI: minimal, consistent with other scripts in this repo
    var w = new Window("dialog", "Bulk Variant PDF Export");
    w.orientation = "column";
    w.alignChildren = ["fill", "top"];
    w.margins = 16;
    w.spacing = 12;

    w.add("statictext", undefined, "Exports one PDF per 'v-' layer. Choose export order below.");

    var optionsPanel = w.add("panel", undefined, "Export Options");
    optionsPanel.orientation = "column";
    optionsPanel.alignChildren = ["left", "top"];
    optionsPanel.margins = 12;
    optionsPanel.spacing = 6;
    var cbNormal = optionsPanel.add("checkbox", undefined, "Export Normal Order");
    cbNormal.value = false;
    var cbReverse = optionsPanel.add("checkbox", undefined, "Export Reverse Order (skip first two pages)");
    cbReverse.value = true; // default to current behavior

    var presetGroup = w.add("group");
    presetGroup.orientation = "row";
    presetGroup.alignChildren = ["left", "center"];
    presetGroup.spacing = 8;
    presetGroup.add("statictext", undefined, "PDF Preset:");
    var presetDropdown = presetGroup.add("dropdownlist", undefined, presetNames);
    // Default to [Press Quality] if available
    var defaultPresetIndex = 0;
    for (var pi = 0; pi < presetNames.length; pi++) {
        if (presetNames[pi] === "[Press Quality]") {
            defaultPresetIndex = pi;
            break;
        }
    }
    presetDropdown.selection = presetDropdown.items[defaultPresetIndex];

    var baseGroup = w.add("group");
    baseGroup.orientation = "row";
    baseGroup.alignChildren = ["left", "center"];
    baseGroup.spacing = 8;
    baseGroup.add("statictext", undefined, "Base filename:");
    var baseEdit = baseGroup.add("edittext", undefined, getBaseNameFromDoc(doc));
    baseEdit.characters = 30;

    var outInfo = w.add("group");
    outInfo.orientation = "row";
    outInfo.alignChildren = ["left", "center"];
    outInfo.spacing = 8;
    outInfo.add("statictext", undefined, "Output folder:");
    var outPathLabel = outInfo.add("statictext", undefined, pdfFolder.fsName);
    outPathLabel.characters = 40;

    w.add("statictext", undefined, "Variant layers found: " + variantLayers.length);

    var variantsPanel = w.add("panel", undefined, "Variants to export");
    variantsPanel.alignment = ["fill", "fill"];
    variantsPanel.margins = 12;
    variantsPanel.spacing = 8;
    variantsPanel.alignChildren = ["fill", "top"];
    var variantsList = variantsPanel.add("listbox", undefined, [], { multiselect: false });
    variantsList.preferredSize = [420, 150];
    for (var vli = 0; vli < variantLayers.length; vli++) {
        try {
            variantsList.add("item", String(variantLayers[vli].name));
        } catch (_eVL) {}
    }

    var btns = w.add("group");
    btns.alignment = ["right", "bottom"];
    btns.add("button", undefined, "Cancel", { name: "cancel" });
    btns.add("button", undefined, "Run", { name: "ok" });

    var r = w.show();
    if (r !== 1) return; // canceled

    var outFolder = pdfFolder;
    if (!outFolder.exists) {
        if (!outFolder.create()) {
            notify("Could not access or create the output folder:\n" + outFolder.fsName);
            return;
        }
    }

    var baseName = sanitizeFilenamePart(baseEdit.text);
    if (!baseName || baseName.replace(/\s+/g, "").length === 0) {
        notify("Please provide a valid base filename.");
        return;
    }

    var preset = presetObjs[presetDropdown.selection.index];

    // Validate selection and page parity
    if (!cbNormal.value && !cbReverse.value) {
        notify("Please select at least one export option (Normal and/or Reverse).");
        return;
    }
    if (cbReverse.value && totalPages % 2 === 1) {
        notify(
            "This document ends on an odd page. Please fix the pagination before running Reverse export (or deselect Reverse)."
        );
        return;
    }

    // Overset text check: abort export if any text frame overflows
    var __overs = InDesignUtils.Objects.findOversetFrames(doc);
    if (__overs && __overs.length > 0) {
        notify("Overset text detected in " + __overs.length + " text frame(s). Please fix overset before exporting.");
        return;
    }

    InDesignUtils.FindChange.withCleanPrefs(function () {
        // Progress (shared)
        var __pw = InDesignUtils.UI.createProgressWindow("Exporting Variant PDFs", {
            width: 520,
            initialText: "Starting…"
        });
        var _prog = {
            set: function (txt, percent) {
                __pw.update(typeof percent === "number" ? percent : undefined, txt || undefined);
            },
            close: function () {
                __pw.close();
            }
        };

        // Save original visibility for variant layers to restore later
        var originalVisibility = [];
        for (var vi = 0; vi < variantLayers.length; vi++) {
            originalVisibility.push({ layer: variantLayers[vi], visible: variantLayers[vi].visible });
        }

        // Save original PDF export prefs to restore later
        var pdfPrefs = app.pdfExportPreferences;
        var origPageRange = null;
        var origReaderSpreads = null;
        var origViewPDF = null;
        try {
            origPageRange = pdfPrefs.pageRange;
        } catch (_e0) {}
        try {
            origReaderSpreads = pdfPrefs.exportReaderSpreads;
        } catch (_e1) {}
        try {
            origViewPDF = pdfPrefs.viewPDF;
        } catch (_e2) {}

        function buildReversedSkipTwoRange(total) {
            var startPage = 3; // remove first two pages
            if (startPage > total) return "";
            var pages = [];
            for (var p = total; p >= startPage; p--) pages.push("+" + p);
            return pages.join(",");
        }

        function buildNormalAllRange(total) {
            if (total <= 0) return "";
            // Use absolute page numbers to avoid section naming issues
            return "+1-+" + total;
        }

        function hideAllVariantLayers() {
            InDesignUtils.Layers.hideAll(variantLayers);
        }

        function restoreVariantVisibility() {
            InDesignUtils.Layers.restoreVisibility(originalVisibility);
        }

        var okCount = 0;
        var failCount = 0;

        InDesignUtils.Prefs.withSafePreferences(function () {
            try {
                // Apply fixed export prefs for our use case
                try {
                    pdfPrefs.exportReaderSpreads = false;
                } catch (_eRS) {}
                try {
                    pdfPrefs.viewPDF = false;
                } catch (_eVP) {}

                var doNormal = cbNormal.value;
                var doReverse = cbReverse.value;
                var modes = [];
                if (doNormal) modes.push("normal");
                if (doReverse) modes.push("reverse");

                var totalJobs = variantLayers.length * modes.length;
                var jobIndex = 0;

                for (var idx = 0; idx < variantLayers.length; idx++) {
                    var lyr = variantLayers[idx];
                    var rawSuffix = String(lyr.name || "");
                    var stripped = rawSuffix.replace(/^v-/i, "");
                    var cleanSuffix = sanitizeFilenamePart(stripped && stripped.length ? stripped : rawSuffix);

                    // Toggle visibility: only this variant visible
                    hideAllVariantLayers();
                    InDesignUtils.Layers.setVisibility(lyr, true);

                    for (var m = 0; m < modes.length; m++) {
                        var mode = modes[m];
                        var pageRange =
                            mode === "reverse"
                                ? buildReversedSkipTwoRange(totalPages)
                                : buildNormalAllRange(totalPages);
                        if (!pageRange) {
                            if (mode === "reverse") {
                                notify("Nothing to export after removing the first two pages.");
                            } else {
                                notify("Nothing to export.");
                            }
                            return;
                        }

                        var nameSuffix = cleanSuffix + (mode === "reverse" && doNormal && doReverse ? "-reversed" : "");
                        var outFile = File(outFolder.fsName + "/" + baseName + "-" + nameSuffix + ".pdf");

                        var percent = totalJobs > 0 ? (jobIndex / totalJobs) * 100 : 0;
                        _prog.set("Exporting: " + outFile.name, percent);

                        try {
                            app.pdfExportPreferences.pageRange = pageRange;
                            doc.exportFile(ExportFormat.PDF_TYPE, outFile, false, preset);
                            okCount++;
                        } catch (ex) {
                            failCount++;
                        }
                        jobIndex++;
                    }
                }
                _prog.set("Done.", 100);
            } finally {
                // Restore visibility
                restoreVariantVisibility();
                // Restore pdf export prefs
                try {
                    app.pdfExportPreferences.pageRange = origPageRange;
                } catch (_eR0) {}
                try {
                    app.pdfExportPreferences.exportReaderSpreads = origReaderSpreads;
                } catch (_eR1) {}
                try {
                    app.pdfExportPreferences.viewPDF = origViewPDF;
                } catch (_eR2) {}
                _prog.close();
            }
        });
        // Report summary
        notify("Export completed. Success: " + okCount + (failCount ? ", Failed: " + failCount : ""));
    });
})();
