/*
BulkVariantPDFReverse.jsx

Purpose:
- Bulk export one PDF per "variant" layer (layers prefixed with "v-").
- For each variant layer: hide all other variant layers, show only that one, then export.
- PDF export is always in reversed page order and always removes the first two pages from the export (cover + blank).
- Abort if the document ends on an odd page.

Conventions:
- Non-destructive: Uses pageRange-based export; document is not modified.
- Restores PDF export preferences and layer visibility states after completion.
- Follows UI/UX patterns used in this repo: preset selection and base filename; output location defaults to a 'PDF' subfolder next to the INDD file.

Usage:
- Open a document with variant layers named with prefix "v-".
- Run the script, choose PDF preset and base filename.
- The script will export one PDF per variant layer to the 'PDF' subfolder: <base>-<layerName>.pdf
*/

(function () {
    function showDialog(message, title) {
        try {
            var win = new Window('dialog', title || 'Message');
            win.orientation = 'column';
            win.margins = 16;
            win.spacing = 12;
            var txt = win.add('statictext', undefined, String(message));
            txt.characters = 60;
            var row = win.add('group');
            row.alignment = 'right';
            var ok = row.add('button', undefined, 'OK', { name: 'ok' });
            win.defaultElement = ok;
            win.cancelElement = ok;
            win.show();
        } catch (e) {
            try { $.writeln(String(message)); } catch(_) {}
        }
    }
    if (!app || !app.documents || app.documents.length === 0) {
        alert("Open a document before running BulkVariantPDFReverse.");
        return;
    }

    var doc = app.activeDocument;
    var totalPages = doc.pages.length;

    // Require an even number of pages
    if (totalPages % 2 === 1) {
        alert("This document ends on an odd page. Please fix the pagination before running this script.");
        return;
    }

    // Collect variant layers: names starting with "v-" (case-insensitive)
    function getVariantLayers(d) {
        var result = [];
        try {
            var layers = d.layers;
            for (var i = 0; i < layers.length; i++) {
                var nm = String(layers[i].name || "");
                if (/^v\-/i.test(nm)) {
                    result.push(layers[i]);
                }
            }
        } catch (e) {}
        return result;
    }

    var variantLayers = getVariantLayers(doc);
    if (variantLayers.length === 0) {
        alert("No variant layers were found. A variant layer name must start with 'v-'.");
        return;
    }

    // Gather PDF presets
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
        alert("No PDF export presets found. Create a PDF preset and try again.");
        return;
    }

    // Helpers
    function getBaseNameFromDoc(d) {
        var n = d.name || "Document";
        var dot = n.lastIndexOf(".");
        return dot > 0 ? n.substring(0, dot) : n;
    }

    function sanitizeFilenamePart(s) {
        return String(s || "").replace(/[\\\/:*?"<>|]/g, "_");
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
        alert("Please save the document before exporting so the output folder can be created (a 'PDF' subfolder next to the INDD file).");
        return;
    }

    // UI: minimal, consistent with other scripts in this repo
    var w = new Window("dialog", "Bulk Variant PDF Export (Reversed, skip first two)");
    w.orientation = "column"; w.alignChildren = ["fill", "top"]; w.margins = 16; w.spacing = 12;

    var _info = w.add("statictext", undefined, "Exports one PDF per 'v-' layer in reversed order, skipping first two pages.");

    var presetGroup = w.add("group"); presetGroup.orientation = "row"; presetGroup.alignChildren = ["left", "center"]; presetGroup.spacing = 8;
    presetGroup.add("statictext", undefined, "PDF Preset:");
    var presetDropdown = presetGroup.add("dropdownlist", undefined, presetNames);
    // Default to [Press Quality] if available
    var defaultPresetIndex = 0;
    for (var pi = 0; pi < presetNames.length; pi++) {
        if (presetNames[pi] === "[Press Quality]") { defaultPresetIndex = pi; break; }
    }
    presetDropdown.selection = presetDropdown.items[defaultPresetIndex];

    var baseGroup = w.add("group"); baseGroup.orientation = "row"; baseGroup.alignChildren = ["left", "center"]; baseGroup.spacing = 8;
    baseGroup.add("statictext", undefined, "Base filename:");
    var baseEdit = baseGroup.add("edittext", undefined, getBaseNameFromDoc(doc));
    baseEdit.characters = 30;

    var outInfo = w.add("group"); outInfo.orientation = "row"; outInfo.alignChildren = ["left", "center"]; outInfo.spacing = 8;
    outInfo.add("statictext", undefined, "Output folder:");
    var outPathLabel = outInfo.add("statictext", undefined, pdfFolder.fsName);
    outPathLabel.characters = 40;

    var _variantsLabel = w.add("statictext", undefined, "Variant layers found: " + variantLayers.length);

    var variantsPanel = w.add("panel", undefined, "Variants to export");
    variantsPanel.alignment = ["fill", "fill"]; variantsPanel.margins = 12; variantsPanel.spacing = 8; variantsPanel.alignChildren = ["fill", "top"];
    var variantsList = variantsPanel.add("listbox", undefined, [], {multiselect:false});
    variantsList.preferredSize = [420, 150];
    for (var vli = 0; vli < variantLayers.length; vli++) {
        try { variantsList.add("item", String(variantLayers[vli].name)); } catch(_eVL) {}
    }

    var btns = w.add("group"); btns.alignment = ["right", "bottom"];
    var _cancelBtn = btns.add("button", undefined, "Cancel", {name: "cancel"});
    var _runBtn = btns.add("button", undefined, "Run", {name: "ok"});

    var r = w.show();
    if (r !== 1) return; // canceled

    var outFolder = pdfFolder;
    if (!outFolder.exists) {
        if (!outFolder.create()) {
            alert("Could not access or create the output folder:\n" + outFolder.fsName);
            return;
        }
    }

    var baseName = sanitizeFilenamePart(baseEdit.text);
    if (!baseName || baseName.replace(/\s+/g, "").length === 0) {
        alert("Please provide a valid base filename.");
        return;
    }

    var preset = presetObjs[presetDropdown.selection.index];

    // Progress palette
    var _prog = (function(){
        try {
            var p = new Window("palette", "Exporting Variant PDFs");
            p.orientation = "column"; p.alignChildren = ["fill", "top"]; p.margins = 16; p.spacing = 12;
            try { p.preferredSize.width = 520; } catch(_eSz) {}
            var lbl = p.add("statictext", undefined, "Starting…");
            lbl.characters = 48;
            var bar = p.add("progressbar", undefined, 0, 100); bar.value = 0;
            p.show();
            return {
                set: function(txt, percent){ try { if (txt) lbl.text = txt; if (percent != null) bar.value = percent; p.update(); } catch (_e) {} },
                close: function(){ try { p.close(); } catch(_e2) {} }
            };
        } catch(_e0) {
            return { set: function(){}, close: function(){} };
        }
    })();

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
    try { origPageRange = pdfPrefs.pageRange; } catch(_e0) {}
    try { origReaderSpreads = pdfPrefs.exportReaderSpreads; } catch(_e1) {}
    try { origViewPDF = pdfPrefs.viewPDF; } catch(_e2) {}

    function buildReversedSkipTwoRange(total) {
        var startPage = 3; // remove first two pages
        if (startPage > total) return "";
        var pages = [];
        for (var p = total; p >= startPage; p--) pages.push("+" + p);
        return pages.join(",");
    }

    function hideAllVariantLayers() {
        for (var i = 0; i < variantLayers.length; i++) {
            try { variantLayers[i].visible = false; } catch (e) {}
        }
    }

    function restoreVariantVisibility() {
        for (var i = 0; i < originalVisibility.length; i++) {
            try { originalVisibility[i].layer.visible = originalVisibility[i].visible; } catch (e) {}
        }
    }

    var okCount = 0;
    var failCount = 0;

    try {
        // Apply fixed export prefs for our use case
        try { pdfPrefs.exportReaderSpreads = false; } catch(_eRS) {}
        try { pdfPrefs.viewPDF = false; } catch(_eVP) {}

        var pageRange = buildReversedSkipTwoRange(totalPages);
        if (!pageRange) {
            alert("Nothing to export after removing the first two pages.");
            return;
        }

        for (var idx = 0; idx < variantLayers.length; idx++) {
            var lyr = variantLayers[idx];
            var suffix = sanitizeFilenamePart(lyr.name);
            var outFile = File(outFolder.fsName + "/" + baseName + "-" + suffix + ".pdf");

            _prog.set("Exporting: " + outFile.name, (idx / variantLayers.length) * 100);

            // Toggle visibility: only this variant visible
            hideAllVariantLayers();
            try { lyr.visible = true; } catch (e) {}

            // Set page range and export
            try {
                app.pdfExportPreferences.pageRange = pageRange;
                doc.exportFile(ExportFormat.PDF_TYPE, outFile, false, preset);
                okCount++;
            } catch (ex) {
                failCount++;
            }
        }
        _prog.set("Done.", 100);
    } finally {
        // Restore visibility
        restoreVariantVisibility();
        // Restore pdf export prefs
        try { app.pdfExportPreferences.pageRange = origPageRange; } catch(_eR0) {}
        try { app.pdfExportPreferences.exportReaderSpreads = origReaderSpreads; } catch(_eR1) {}
        try { app.pdfExportPreferences.viewPDF = origViewPDF; } catch(_eR2) {}
        _prog.close();
    }

    alert("Export completed. Success: " + okCount + (failCount ? (", Failed: " + failCount) : ""));
})();
