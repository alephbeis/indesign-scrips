/*
ExportPDFWithOrder.jsx

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
    // Local notifier to avoid reassigning the built-in alert (read-only in ExtendScript)
    function notify(msg) {
        try { showDialog(msg, 'Message'); }
        catch (e) {
            try { if (typeof alert === 'function') alert(msg); } catch(_) {}
            try { $.writeln(String(msg)); } catch(__) {}
        }
    }
    if (!app || !app.documents || app.documents.length === 0) {
        showDialog("Open a document before running ExportPDFWithOrder.", "Export PDF");
        return;
    }

    var doc = app.activeDocument;

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

    // Build user interface
    var w = new Window("dialog", "Export PDF (Normal/Reversed)");
    w.orientation = "column";
    w.alignChildren = ["fill", "top"]; w.margins = 16; w.spacing = 12;

    w.add("statictext", undefined, "Choose what to export and how:");

    var optionsPanel = w.add("panel", undefined, "Export Options");
    optionsPanel.orientation = "column"; optionsPanel.alignChildren = ["left", "top"]; optionsPanel.margins = 12; optionsPanel.spacing = 6;
    var cbNormal = optionsPanel.add("checkbox", undefined, "Export Normal order");
    cbNormal.value = true;
    var cbReversed = optionsPanel.add("checkbox", undefined, "Export Reversed order");
    cbReversed.value = false;
    var cbRemoveTwo = optionsPanel.add("checkbox", undefined, "Remove first two pages (cover + blank) before export");
    cbRemoveTwo.value = false; // initially unchecked
    // This option applies only to reversed export; disable when not reversed
    cbRemoveTwo.enabled = cbReversed.value;
    cbReversed.onClick = function(){
        cbRemoveTwo.enabled = cbReversed.value;
        cbRemoveTwo.value = cbReversed.value; // mirror reversed selection
    };

    var presetGroup = w.add("group"); presetGroup.orientation = "row"; presetGroup.alignChildren = ["left", "center"]; presetGroup.spacing = 8;
    presetGroup.add("statictext", undefined, "PDF Preset:");
    var presetDropdown = presetGroup.add("dropdownlist", undefined, presetNames);
    // Default to [Press Quality] if available, otherwise use first preset
    var defaultPresetIndex = 0;
    for (var pi = 0; pi < presetNames.length; pi++) {
        if (presetNames[pi] === "[Press Quality]") { defaultPresetIndex = pi; break; }
    }
    presetDropdown.selection = presetDropdown.items[defaultPresetIndex];

    // PDF Settings panel for additional options
    var settingsPanel = w.add("panel", undefined, "PDF Settings");
    settingsPanel.orientation = "column"; settingsPanel.alignChildren = ["left", "top"]; settingsPanel.margins = 12; settingsPanel.spacing = 8;

    var cbUseSecurity = settingsPanel.add("checkbox", undefined, "Enable PDF security (restrict printing, copying, and changes)");
    cbUseSecurity.value = false;

    var cbInteractivePDF = settingsPanel.add("checkbox", undefined, "Interactive PDF (working hyperlinks and buttons)");
    cbInteractivePDF.value = false;

    var cbViewPDF;

    // Watermark section
    var sep = settingsPanel.add("group", undefined, "");
    sep.margins = 0; sep.spacing = 0; sep.alignment = ["fill","top"]; sep.alignChildren = ["fill","fill"]; // thin separator without extra spacing
    var sepLine = sep.add("panel", undefined, "");
    sepLine.margins = 0;
    sepLine.preferredSize.height = 1; // 1px line

    var cbWatermark = settingsPanel.add("checkbox", undefined, "Add text watermark (preconfigured styling)");
    cbWatermark.value = false;

    var watermarkGroup = settingsPanel.add("group"); watermarkGroup.orientation = "column"; watermarkGroup.alignChildren = ["fill", "top"];
    watermarkGroup.spacing = 4; watermarkGroup.margins = [20, 0, 0, 0]; // indent

    var watermarkTextGroup = watermarkGroup.add("group"); watermarkTextGroup.orientation = "row"; watermarkTextGroup.alignChildren = ["left", "center"]; watermarkTextGroup.spacing = 8;
    watermarkTextGroup.add("statictext", undefined, "Text:");
    var watermarkTextEdit = watermarkTextGroup.add("edittext", undefined, "Sample");
    watermarkTextEdit.characters = 20;

    // Enable/disable watermark text input based on main checkbox
    function updateWatermarkEnabled() {
        watermarkTextEdit.enabled = cbWatermark.value;
    }
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
    folderPanel.orientation = "column"; folderPanel.alignChildren = ["fill", "top"]; folderPanel.margins = 12; folderPanel.spacing = 8;
    var baseNameGroup = folderPanel.add("group"); baseNameGroup.orientation = "row"; baseNameGroup.alignChildren = ["left", "center"]; baseNameGroup.spacing = 8;
    baseNameGroup.add("statictext", undefined, "Base filename:");
    var baseNameEdit = baseNameGroup.add("edittext", undefined, getBaseName(doc.saved ? doc.fullName : { name: doc.name }));
    baseNameEdit.characters = 30;

    var pathGroup = folderPanel.add("group"); pathGroup.orientation = "row"; pathGroup.alignChildren = ["fill", "center"]; pathGroup.spacing = 8;
    var pathEdit = pathGroup.add("edittext", undefined, (doc.saved ? doc.fullName.parent.fsName : Folder.desktop.fsName));
    pathEdit.characters = 40;
    var browseBtn = pathGroup.add("button", undefined, "Choose Folder...");
    browseBtn.onClick = function () {
        var f = Folder.selectDialog("Select a folder for the exported PDFs");
        if (f) pathEdit.text = f.fsName;
    };

    // Option: export into a 'PDF' subfolder under the selected directory
    var pdfSubfolderCheckbox = folderPanel.add("checkbox", undefined, "Export to PDF folder");
    pdfSubfolderCheckbox.value = false;

    var btns = w.add("group"); btns.alignment = "right";
    var cancelBtn = btns.add("button", undefined, "Cancel");
    var okBtn = btns.add("button", undefined, "Export", {name: "ok"});

    okBtn.onClick = function () { w.close(1); };
    cancelBtn.onClick = function () { w.close(0); };

    if (w.show() !== 1) { return; }

    // Validations
    if (!cbNormal.value && !cbReversed.value) {
        showDialog("Select at least one of: Export Normal or Export Reversed.", "Export PDF");
        return;
    }

    // Conditional even-page requirement: only when exporting Reversed
    try {
        var totalPages = doc.pages.length;
        if (cbReversed.value && (totalPages % 2 === 1)) {
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

    var baseName = baseNameEdit.text.replace(/[\/:*?"<>|]/g, "_");
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
                            var pg = null; try { pg = tf.parentPage ? tf.parentPage.name : null; } catch(_) {}
                            hits.push(pg ? ("Page " + pg) : "Pasteboard/No page");
                        }
                    } catch(_eOf) {}
                }
            }
        } catch(_eAll) {}
        return hits;
    }
    var __overs = _findOversetFrames(doc);
    if (__overs && __overs.length > 0) {
        notify("Overset text detected in " + __overs.length + " text frame(s). Please fix overset before exporting.");
        return;
    }

    // Create progress palette for user feedback during export
    var _prog = (function(){
        try {
            var p = new Window("palette", "Exporting PDFs");
            p.orientation = "column"; p.alignChildren = ["fill", "top"]; p.margins = 16; p.spacing = 12;
            // Ensure sufficient width to avoid truncation; height grows only with content
            try { p.preferredSize.width = 520; } catch(_sz0) {}
            var lbl = p.add("statictext", undefined, "Starting…");
            lbl.characters = 48;
            var bar = p.add("progressbar", undefined, 0, 100);
            bar.value = 0;
            p.show();
            return {
                set: function(txt, percent){ try { if (txt) lbl.text = txt; if (percent != null) bar.value = percent; p.update(); } catch (_e) {} },
                close: function(){ try { p.close(); } catch(_e2) {} }
            };
        } catch(_e0) {
            return { set: function(){}, close: function(){} };
        }
    })();

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
                try { origPageRange = intPrefs.pageRange; } catch(_e0) {}
                try { origReaderSpreads = intPrefs.exportReaderSpreads; } catch(_e1) {}
                try { origViewPDF = intPrefs.viewPDF; } catch(_e2) {}

                // Apply interactive PDF settings
                try { intPrefs.exportReaderSpreads = false; } catch(_eRS) {}
                try { intPrefs.viewPDF = cbViewPDF.value; } catch(_eVP) {}
            } else {
                // Store and apply regular PDF preferences
                var pdfPrefs = app.pdfExportPreferences;
                try { origPageRange = pdfPrefs.pageRange; } catch(_e0) {}
                try { origReaderSpreads = pdfPrefs.exportReaderSpreads; } catch(_e1) {}
                try { origUseSecurity = pdfPrefs.useSecurity; } catch(_e2) {}
                try { origDisallowPrinting = pdfPrefs.disallowPrinting; } catch(_e3) {}
                try { origDisallowCopying = pdfPrefs.disallowCopying; } catch(_e4) {}
                try { origDisallowChanging = pdfPrefs.disallowChanging; } catch(_e5) {}
                try { origViewPDF = pdfPrefs.viewPDF; } catch(_e6) {}

                // Apply regular PDF settings
                try { pdfPrefs.exportReaderSpreads = false; } catch(_eRS) {}
                try { pdfPrefs.useSecurity = cbUseSecurity.value; } catch(_eUS) {}
                if (cbUseSecurity.value) {
                    try { pdfPrefs.disallowPrinting = true; } catch(_eDP) {}
                    try { pdfPrefs.disallowCopying = true; } catch(_eDC) {}
                    try { pdfPrefs.disallowChanging = true; } catch(_eDCh) {}
                }
                try { pdfPrefs.viewPDF = cbViewPDF.value; } catch(_eVP) {}
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
                _prog.set("Exporting Interactive PDF…", 60);
                app.interactivePDFExportPreferences.pageRange = pageRange;
                doc.exportFile(ExportFormat.INTERACTIVE_PDF, outFile, false);
            } else {
                _prog.set("Exporting PDF…", 60);
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
                try { if (origPageRange !== null) app.interactivePDFExportPreferences.pageRange = origPageRange; } catch (_r0) {}
                try { if (origReaderSpreads !== null) app.interactivePDFExportPreferences.exportReaderSpreads = origReaderSpreads; } catch (_r1) {}
                try { if (origViewPDF !== null) app.interactivePDFExportPreferences.viewPDF = origViewPDF; } catch (_r2) {}
            } else {
                // Restore regular PDF preferences
                try { if (origPageRange !== null) app.pdfExportPreferences.pageRange = origPageRange; } catch (_r0) {}
                try { if (origReaderSpreads !== null) app.pdfExportPreferences.exportReaderSpreads = origReaderSpreads; } catch (_r1) {}
                try { if (origUseSecurity !== null) app.pdfExportPreferences.useSecurity = origUseSecurity; } catch (_r2) {}
                try { if (origDisallowPrinting !== null) app.pdfExportPreferences.disallowPrinting = origDisallowPrinting; } catch (_r3) {}
                try { if (origDisallowCopying !== null) app.pdfExportPreferences.disallowCopying = origDisallowCopying; } catch (_r4) {}
                try { if (origDisallowChanging !== null) app.pdfExportPreferences.disallowChanging = origDisallowChanging; } catch (_r5) {}
                try { if (origViewPDF !== null) app.pdfExportPreferences.viewPDF = origViewPDF; } catch (_r6) {}
            }
        }
    }

    // Descriptive function names: Normal = exportNormal; Reversed = exportVariant (isReversed = true)
    function exportNormal(outFile) {
        return exportVariant(false, false, outFile);
    }

    // --- Watermark defaults to match Acrobat sequence (literal text, no numbers) ---
    var WM_DEFAULT_ANGLE = 45;       // degrees
    var WM_DEFAULT_OPACITY = 65;     // percent
    var WM_DEFAULT_COVERAGE = 0.80;  // fraction of page diagonal

    // Create a temporary object style with clean properties for watermarks
    function createWatermarkObjectStyle(doc) {
        var styleName = "__TEMP_WM_OBJECT__";
        var objStyle;

        try {
            // Try to get an existing temp style first
            objStyle = doc.objectStyles.itemByName(styleName);
        } catch (_e) {}
        if (!objStyle || !objStyle.isValid) {
            // Create a new temporary object style
            objStyle = doc.objectStyles.add();
            objStyle.name = styleName;

            // Ensure this style is not based on anything to avoid accidental inheritance
            try { objStyle.basedOn = doc.objectStyles.itemByName("[None]"); } catch (_b0) {}

            // Set clean properties - no stroke, no fill, no auto-sizing
            try { objStyle.enableStroke = false; } catch (_s1) {}
            try { objStyle.enableFill = false; } catch (_s2) {}
            try { objStyle.strokeWeight = 0; } catch (_s2w) {}
            try { objStyle.fillColor = doc.swatches.itemByName("[None]"); } catch (_fc) {}
            try { objStyle.strokeColor = doc.swatches.itemByName("[None]"); } catch (_sc) {}
            try { objStyle.textFramePreferences.autoSizingType = AutoSizingTypeEnum.OFF; } catch (_s3) {}
            try { objStyle.textFramePreferences.useNoLineBreaksForAutoSizing = false; } catch (_s4) {}
            try { objStyle.textFramePreferences.insetSpacing = [0,0,0,0]; } catch (_sInset) {}
            try { objStyle.textFramePreferences.firstBaselineOffset = FirstBaseline.CAP_HEIGHT; } catch (_fb) {}
        }

        return objStyle;
    }

    // Create temporary paragraph style with clean properties for watermarks
    function createWatermarkParagraphStyle(doc, textLength, pageWidth, pageHeight) {
        var styleName = "__TEMP_WM_PARAGRAPH__";
        var paraStyle;

        try {
            // Try to get existing temp style first
            paraStyle = doc.paragraphStyles.itemByName(styleName);
        } catch (_e) {}
        if (!paraStyle || !paraStyle.isValid) {
            // Create new temporary paragraph style based on [No Paragraph Style]
            var baseStyle;
            try {
                baseStyle = doc.paragraphStyles.itemByName("[No Paragraph Style]");
            } catch (_base) {
                baseStyle = doc.paragraphStyles[0]; // Fallback to first available
            }

            paraStyle = doc.paragraphStyles.add();
            paraStyle.name = styleName;
            paraStyle.basedOn = baseStyle;

            // Set clean text properties
            try { paraStyle.justification = Justification.CENTER_ALIGN; } catch (_p1) {}
            try { paraStyle.numberedListStyle = app.numberedListStyles.itemByName("[None]"); } catch (_p2) {}
            try { paraStyle.bulletedListStyle = app.bulletedListStyles.itemByName("[None]"); } catch (_p3) {}
            try { paraStyle.numberingContinue = false; } catch (_p4) {}
            try { paraStyle.numberingStartAt = 1; } catch (_p5) {}

            // Set font to specified sans serif bold with robust fallbacks
            try {
                // Prefer direct Bold face to avoid style resolution issues
                paraStyle.appliedFont = app.fonts.itemByName("Arial\tBold");
            } catch (_fb0) {
                try {
                    // Try constructing Bold via Regular + fontStyle if direct Bold not available
                    paraStyle.appliedFont = app.fonts.itemByName("Arial\tRegular");
                    paraStyle.fontStyle = "Bold";
                } catch (_f1) {
                    try {
                        paraStyle.appliedFont = app.fonts.itemByName("Helvetica\tBold");
                    } catch (_f2) {
                        // Use system default if fonts not available
                    }
                }
            }

            // Normalize key text attributes to avoid inheriting from document styles
            try { paraStyle.hyphenation = false; } catch (_hy) {}
            try { paraStyle.tracking = 0; } catch (_tr) {}
            try { paraStyle.horizontalScale = 100; } catch (_hs) {}
            try { paraStyle.verticalScale = 100; } catch (_vs) {}
            try { paraStyle.ligatures = false; } catch (_lg) {}
            try { paraStyle.kerningMethod = AutoKernType.METRICS; } catch (_km) {}
            try { paraStyle.fillColor = doc.swatches.itemByName("[Black]"); } catch (_fc2) {}
            try { paraStyle.strokeColor = doc.swatches.itemByName("[None]"); } catch (_sc2) {}
            try { paraStyle.spaceBefore = 0; } catch (_sb) {}
            try { paraStyle.spaceAfter = 0; } catch (_sa) {}
            try { paraStyle.alignToBaseline = false; } catch (_ab) {}
            try { paraStyle.composer = "Adobe Paragraph Composer"; } catch (_cp) {}
            try { paraStyle.appliedLanguage = app.languagesWithVendors.itemByName("[No Language]"); } catch (_lang1) {}
            try { if (!paraStyle.appliedLanguage || !paraStyle.appliedLanguage.isValid) paraStyle.appliedLanguage = app.languagesWithVendors.itemByName("English: USA"); } catch (_lang2) {}

            // Calculate and set point size based on page dimensions and text length
            try {
                var diag = Math.sqrt(pageWidth * pageWidth + pageHeight * pageHeight);
                var targetLen = diag * WM_DEFAULT_COVERAGE;
                paraStyle.pointSize = Math.max(24, (targetLen / Math.max(1, textLength)) * 1.35);
            } catch (_pSize) {
                try { paraStyle.pointSize = 72; } catch (_pSizeFallback) {}
            }
        }

        return paraStyle;
    }

    // Remove temporary watermark styles from document
    function removeWatermarkStyles(doc) {
        try {
            var objStyle = doc.objectStyles.itemByName("__TEMP_WM_OBJECT__");
            if (objStyle.isValid) objStyle.remove();
        } catch (_e1) {}

        try {
            var paraStyle = doc.paragraphStyles.itemByName("__TEMP_WM_PARAGRAPH__");
            if (paraStyle.isValid) paraStyle.remove();
        } catch (_e2) {}
    }

    function applyWatermarkLayer(doc, text) {
        if (!text || text === "") return null;

        // Calculate average page dimensions for paragraph style sizing
        var avgWidth = 0, avgHeight = 0;
        var pages = doc.pages;
        for (var avgI = 0; avgI < pages.length; avgI++) {
            var pb = pages[avgI].bounds;
            avgWidth += pb[3] - pb[1];
            avgHeight += pb[2] - pb[0];
        }
        if (pages.length > 0) {
            avgWidth /= pages.length;
            avgHeight /= pages.length;
        }

        // Create temporary styles for clean watermark formatting
        var tempObjStyle = createWatermarkObjectStyle(doc);
        var tempParaStyle = createWatermarkParagraphStyle(doc, String(text).length, avgWidth, avgHeight);

        // Create/find temp layer and move it to the top
        var lyr;
        try {
            lyr = doc.layers.itemByName("__TEMP_WATERMARK__");
            if (!lyr.isValid) lyr = doc.layers.add({ name: "__TEMP_WATERMARK__" });
        } catch (_e0) { lyr = doc.layers.add({ name: "__TEMP_WATERMARK__" }); }
        lyr.locked = false; lyr.visible = true;

        // Move layer to the top of the stack to ensure watermark appears above all content
        try { lyr.move(LocationOptions.AT_BEGINNING); } catch (_eMove) {}

        var i;
        for (i = 0; i < pages.length; i++) {
            var p = pages[i]; pb = p.bounds; // [y1, x1, y2, x2]
            var w = pb[3] - pb[1], h = pb[2] - pb[0];

            var tf = p.textFrames.add(lyr);
            // Center a generous square frame; then rotate/center content.
            var cx = pb[1] + w/2, cy = pb[0] + h/2, half = Math.max(w, h);
            tf.geometricBounds = [cy - half/2, cx - half/2, cy + half/2, cx + half/2];

            // Apply clean temporary object style
            try { tf.appliedObjectStyle = tempObjStyle; } catch (_eObj) {}
            // Normalize frame defaults to avoid new-document variations
            try { tf.textFramePreferences.insetSpacing = [0,0,0,0]; } catch (_finset) {}
            try { tf.textFramePreferences.firstBaselineOffset = FirstBaseline.CAP_HEIGHT; } catch (_ffb) {}

            // Literal text only (no tokens/markers)
            tf.contents = String(text);

            // Apply clean temporary paragraph style (includes font, size, alignment)
            var story = tf.parentStory;
            try { story.appliedParagraphStyle = tempParaStyle; } catch (_ePara) {}

            // Ensure no character style overrides and ignore text wrap for consistency
            try {
                var noneChar = doc.characterStyles.itemByName("[None]");
                if (tf.texts && tf.texts.length > 0) {
                    try { tf.texts[0].appliedCharacterStyle = noneChar; } catch (_cs) {}
                    try { if (tf.texts[0].clearOverrides) tf.texts[0].clearOverrides(); } catch (_co) {}
                }
            } catch (_eChar) {}
            try { tf.textFramePreferences.ignoreTextWrap = true; } catch (_eWrap) {}
            try { tf.textFramePreferences.verticalJustification = VerticalJustification.CENTER_ALIGN; } catch (_e3) {}

            // Apply frame-level properties that cannot be set in paragraph style
            // Opacity 65%
            try { tf.transparencySettings.blendingSettings.opacity = WM_DEFAULT_OPACITY; } catch (_e4) {}

            // Rotate and re-center
            try { tf.rotationAngle = WM_DEFAULT_ANGLE; } catch (_e5) {}
            try {
                var gb = tf.geometricBounds, fx = (gb[1] + gb[3]) / 2, fy = (gb[0] + gb[2]) / 2;
                tf.move(undefined, [cx - fx, cy - fy]);
            } catch (_e6) {}
        }
        return lyr;
    }

    function removeWatermarkLayer(doc, lyr) {
        if (!lyr || !lyr.isValid) return;
        try { lyr.remove(); } catch (_e) {}
        // Clean up temporary watermark styles
        removeWatermarkStyles(doc);
    }

    var didSomething = false;
    var tmpWM = null;

    app.doScript(function(){
        var sp = app.scriptPreferences;
        var _origUnits = null;
        var _origRedraw = null;
        try {
            // Normalize units and suppress redraw during heavy operations
            try { _origUnits = sp.measurementUnit; sp.measurementUnit = MeasurementUnits.POINTS; } catch (_u0) {}
            try { _origRedraw = sp.enableRedraw; sp.enableRedraw = false; } catch (_r0) {}

            // Apply watermark if selected (this is the destructive part)
            if (cbWatermark.value) {
                // Use the UI value or "Sample" as default
                tmpWM = applyWatermarkLayer(doc, String(watermarkTextEdit.text || "Sample"));
            }

            // Normal
            if (cbNormal.value) {
                _prog.set("Exporting normal order…", 10);
                var normalFile = File(outFolder.fsName + "/" + baseName + ".pdf");
                // Removal of first two pages is NOT applied for normal export
                if (exportNormal(normalFile)) didSomething = true;
            }

            // Reversed
            if (cbReversed.value) {
                _prog.set("Exporting reversed order…", tmpWM ? 60 : 10);
                var reversedFile = File(outFolder.fsName + "/" + baseName + "-reversed.pdf");
                if (exportVariant(true, cbRemoveTwo.value, reversedFile)) didSomething = true;
            }
        } finally {
            // Always clean up watermark layer first, then close progress
            if (tmpWM) {
                try { removeWatermarkLayer(doc, tmpWM); } catch (_ew) {}
            }
            // Restore measurement units and redraw
            try { if (_origUnits != null) sp.measurementUnit = _origUnits; } catch (_u1) {}
            try { if (_origRedraw != null) sp.enableRedraw = _origRedraw; } catch (_r1) {}
            try { _prog.close(); } catch (_ec) {}
        }
    }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Export PDF");

    if (didSomething) {
        notify("Export completed.");

        // Bring PDF viewer to front AFTER the completion dialog is dismissed
        if (cbViewPDF.value) {
            try {
                // Small delay to ensure dialog is dismissed and PDF is ready
                $.sleep(300);

                // Try to activate the PDF viewer application (system-specific)
                var osName = $.os.toLowerCase();
                if (osName.indexOf('windows') !== -1) {
                    // Windows: Try to activate Adobe Acrobat/Reader
                    try {
                        var cmd = 'powershell -Command "Add-Type -AssemblyName Microsoft.VisualBasic; [Microsoft.VisualBasic.Interaction]::AppActivate(\\"Adobe\\")"';
                        app.system(cmd);
                    } catch (e) {}
                } else if (osName.indexOf('macintosh') !== -1) {
                    // macOS: Use AppleScript to bring PDF viewer to front
                    try {
                        var script = 'tell application "System Events" to tell process "Preview" to set frontmost to true';
                        app.doScript(script, ScriptLanguage.APPLESCRIPT_LANGUAGE);
                    } catch (e) {
                        // If Preview failed, try Adobe Acrobat/Reader
                        try {
                            var script2 = 'tell application "System Events" to tell process "Adobe Acrobat" to set frontmost to true';
                            app.doScript(script2, ScriptLanguage.APPLESCRIPT_LANGUAGE);
                        } catch (e2) {
                            try {
                                var script3 = 'tell application "System Events" to tell process "Adobe Reader" to set frontmost to true';
                                app.doScript(script3, ScriptLanguage.APPLESCRIPT_LANGUAGE);
                            } catch (e3) {}
                        }
                    }
                }
            } catch (e) {
                // Silently ignore focus errors - export was successful
            }
        }
    } else {
        notify("Nothing was exported.");
    }
})();
