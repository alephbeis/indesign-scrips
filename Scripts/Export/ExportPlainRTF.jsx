/*
ExportPlainRTF.jsx

Purpose:
- Export the active InDesign document to a plain RTF where all formatting and objects are removed,
  while preserving page separation and page numbers.

Approach:
- Build a temporary, clean document with the same page geometry (size/orientation/margins) and page count.
- For each source page, gather all text frames on that page, sort them top-to-bottom then left-to-right, and
  concatenate their raw text contents.
- Strip inline object placeholders (U+FFFC) and other non-text artifacts; insert a simple page header
  containing the page label (page.name) to preserve page numbering information.
- Create one text frame per page in the temp document, thread them into a single story, and insert an explicit
  page break between pages so the RTF preserves page boundaries.
- Export that single Story to RTF (Story.exportFile), then close the temp document without saving.

Notes:
- The original document is not modified.
- Non-text objects (images, shapes, etc.) are ignored; anchored object markers are removed from text.
- Minimal formatting: The temp document uses default Basic Paragraph / [None] styles; no local overrides.
- If the original document uses sections/numbering, page.name preserves the labeled page number string.
*/

(function () {
    if (app && app.doScript) {
        app.doScript(function () {
            // Single undo and state safety
            var sp = app.scriptPreferences;
            var __prevRedraw = sp.enableRedraw;
            var tmpDoc = null;
            var progWin = null;
            var outFile = null;
            try {
                sp.enableRedraw = false;
    // Guards: Ensure InDesign and a document are available
    if (!app || !app.documents || app.documents.length === 0) {
        alert("Open a document before running ExportPlainRTF.");
        return;
    }

    var srcDoc = app.activeDocument;

    // Helper: Get base name without extension
    function getBaseName(name) {
        if (!name) return "Export";
        var dot = name.lastIndexOf(".");
        return (dot > 0) ? name.substring(0, dot) : name;
    }

    // Helper: Build a default output file
    function suggestOutputFile() {
        var base = getBaseName(srcDoc.name);
        var suggested = base + "-plain.rtf";
        try {
            // Prefer the source document's folder if saved; otherwise default to desktop
            var folder = (srcDoc.saved && srcDoc.fullName && srcDoc.fullName.parent) ? srcDoc.fullName.parent : Folder.desktop;
            return File(folder.fsName + "/" + suggested);
        } catch (e) {
            return File(Folder.desktop.fsName + "/" + suggested);
        }
    }

    // Ask user where to save
    var defaultFile = suggestOutputFile();
    outFile = null;
    try {
        if (defaultFile && typeof defaultFile.saveDlg === "function") {
            outFile = defaultFile.saveDlg("Save Plain RTF", "RTF:*.rtf");
        } else {
            outFile = File.saveDialog("Save Plain RTF", "RTF:*.rtf");
        }
    } catch (_) {
        outFile = File.saveDialog("Save Plain RTF", "RTF:*.rtf");
    }
    if (!outFile) {
        // User canceled
        return;
    }
    // Ensure .rtf extension
    if (!/\.rtf$/i.test(outFile.name)) {
        outFile = File(outFile.fsName + ".rtf");
    }

    // Progress window (simple)
    progWin = new Window("palette", "Export to Plain RTF");
    progWin.orientation = "column"; progWin.alignChildren = ["fill", "top"]; progWin.margins = 12; progWin.spacing = 8;
    var progTxt = progWin.add("statictext", undefined, "Preparing...");
    var progBar = progWin.add("progressbar", undefined, 0, Math.max(1, srcDoc.pages.length));
    progBar.preferredSize.width = 320;
    try { progWin.show(); } catch (_) {}

    // Create temporary clean document with same geometry
    tmpDoc = app.documents.add();

    // Copy document setup from source where practical
    try {
        tmpDoc.documentPreferences.facingPages = srcDoc.documentPreferences.facingPages;
        tmpDoc.documentPreferences.pageWidth = srcDoc.documentPreferences.pageWidth;
        tmpDoc.documentPreferences.pageHeight = srcDoc.documentPreferences.pageHeight;
        tmpDoc.documentPreferences.pagesPerDocument = srcDoc.pages.length; // set intended page count
        tmpDoc.documentPreferences.pageOrientation = srcDoc.documentPreferences.pageOrientation;
        tmpDoc.viewPreferences.rulerOrigin = RulerOrigin.pageOrigin;
        tmpDoc.zeroPoint = srcDoc.zeroPoint;
    } catch (_) {}

    // Ensure tmpDoc has the same number of pages as source
    while (tmpDoc.pages.length < srcDoc.pages.length) { tmpDoc.pages.add(); }
    while (tmpDoc.pages.length > srcDoc.pages.length) { tmpDoc.pages.lastItem().remove(); }

    // Helper: compute text frame bounds within margins for a given page
    function getTextBounds(page) {
        var b = page.bounds; // [y1, x1, y2, x2]
        var m = page.marginPreferences;
        // Account for side-specific margins automatically provided by marginPreferences
        var top = b[0] + m.top;
        var left = b[1] + (page.side === PageSideOptions.LEFT_HAND ? m.right : m.left); // InDesign swaps visually; use side
        var right = b[3] - (page.side === PageSideOptions.LEFT_HAND ? m.left : m.right);
        var bottom = b[2] - m.bottom;
        return [top, left, bottom, right];
    }

    // Helper: sort frames by Y then X
    function sortFrames(frames) {
        frames.sort(function (a, b) {
            try {
                var ga = a.geometricBounds; // [y1,x1,y2,x2]
                var gb = b.geometricBounds;
                if (ga[0] !== gb[0]) return ga[0] - gb[0];
                return ga[1] - gb[1];
            } catch (e) {
                return 0;
            }
        });
        return frames;
    }

    // Helper: normalize plain text
    function plainify(s) {
        if (!s || s === "") return "";
        // Remove object replacement character (anchored/inline objects)
        // and any odd non-text artifacts we don't want.
        try {
            s = s.replace(/[\uFFFC\uF8FF]/g, "");
        } catch (_) {}
        return s;
    }

    // Helper: get the display label for a page respecting sections and numbering
    function getDisplayPageLabel(page) {
        try {
            if (page && page.name) return String(page.name); // section-aware label
        } catch (_e1) {}
        try {
            // Fallback: 1-based absolute index
            return String(page.documentOffset + 1);
        } catch (_e2) {}
        return "?";
    }

    // Pre-create destination text frames (one per page) and thread them into a single story
    var dstFrames = [];
    for (var pi = 0; pi < tmpDoc.pages.length; pi++) {
        var dstPage = tmpDoc.pages[pi];
        var tf = null;
        try {
            var gb = getTextBounds(dstPage);
            tf = dstPage.textFrames.add({ geometricBounds: [gb[0], gb[1], gb[2], gb[3]] });
        } catch (e1) {
            // Fallback: inset within full page bounds
            try {
                var fb = dstPage.bounds;
                tf = dstPage.textFrames.add({ geometricBounds: [fb[0] + 12, fb[1] + 12, fb[2] - 12, fb[3] - 12] });
            } catch (e2) {}
        }
        if (tf) dstFrames.push(tf);
    }
    for (var ti = 0; ti < dstFrames.length - 1; ti++) {
        try { dstFrames[ti].nextTextFrame = dstFrames[ti + 1]; } catch (_) {}
    }

    var mainStory = (dstFrames.length > 0) ? dstFrames[0].parentStory : null;
    if (!mainStory) {
        try { progWin.close(); } catch (_) {}
        try { tmpDoc.close(SaveOptions.NO); } catch (_) {}
        alert("Could not create destination story for RTF export.");
        return;
    }

    // Build plain story content page-by-page
    for (var i = 0; i < srcDoc.pages.length; i++) {
        var srcPage = srcDoc.pages[i];

        progTxt.text = "Processing page " + srcPage.name + " (" + (i + 1) + "/" + srcDoc.pages.length + ")...";
        progBar.value = i;
        try { progWin.update(); } catch (_) {}

        // Gather text frames on this page only (ignore masters/pasteboard)
        var frames = [];
        try {
            var pf = srcPage.textFrames;
            for (var fi = 0; fi < pf.length; fi++) {
                var tfSrc = pf[fi];
                if (tfSrc && tfSrc.parentPage && tfSrc.parentPage === srcPage) {
                    frames.push(tfSrc);
                }
            }
        } catch (_) {}

        // Sort frames in reading-ish order
        sortFrames(frames);

        // Build the page text: header + frames
        var parts = [];
        parts.push("Page " + getDisplayPageLabel(srcPage));
        for (var k = 0; k < frames.length; k++) {
            var raw = "";
            try {
                // Use the text contained in the frame (not entire story)
                raw = String(frames[k].contents);
            } catch (_) { raw = ""; }
            raw = plainify(raw);
            if (raw && /\S/.test(raw)) {
                parts.push(raw);
            }
        }
        var pageText = parts.join("\r\r");
        if (!pageText) { pageText = "Page " + getDisplayPageLabel(srcPage); }

        // Append to the main story; insert page break between pages
        try {
            if (i === 0) {
                dstFrames[0].contents = pageText;
            } else {
                mainStory.insertionPoints[-1].contents = SpecialCharacters.PAGE_BREAK;
                mainStory.insertionPoints[-1].contents = pageText;
            }
        } catch (_) {}
    }

    // Ensure minimal formatting (best-effort; safe if styles exist)
    try {
        // Apply Basic Paragraph if available
        try { mainStory.texts[0].appliedParagraphStyle = tmpDoc.paragraphStyles.item("Basic Paragraph"); } catch (_) {}
        // Apply [None] character style if available (index 0)
        try { mainStory.texts[0].appliedCharacterStyle = tmpDoc.characterStyles[0]; } catch (_) {}
        // Clear overrides if supported
        try { mainStory.texts[0].clearOverrides(OverrideType.ALL); } catch (_) {}
    } catch (_) {}

    // Enforce center alignment for mixed-direction paragraphs
    try { tmpDoc.paragraphStyles.item("Basic Paragraph").justification = Justification.CENTER_ALIGN; } catch (_) {}
    try { mainStory.paragraphs.everyItem().justification = Justification.CENTER_ALIGN; } catch (_) {}

    // Update progress to export
    progTxt.text = "Exporting RTF...";
    progBar.value = progBar.maxvalue;
    try { progWin.update(); } catch (_) {}

    // Export to RTF from the Story (Document-level RTF export is not supported)
    try {
        mainStory.exportFile(ExportFormat.RTF, outFile);
    } catch (expErr) {
        alert("RTF export failed: " + expErr);
        try { tmpDoc.close(SaveOptions.NO); } catch (_) {}
        try { progWin.close(); } catch (_) {}
        return;
    }

    // Close temp doc without saving changes
    try { tmpDoc.close(SaveOptions.NO); } catch (_) {}
    try { progWin.close(); } catch (_) {}

    alert("Plain RTF exported successfully to:\n" + outFile.fsName);
            } catch (err) {
                try { if (tmpDoc && tmpDoc.isValid) tmpDoc.close(SaveOptions.NO); } catch (_) {}
                try { if (progWin) progWin.close(); } catch (_) {}
                alert("Plain RTF export failed: " + err);
            } finally {
                try { sp.enableRedraw = __prevRedraw; } catch (_) {}
            }
        }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Export Plain RTF");
    } else {
        // Fallback: run directly if doScript is unavailable
        // Note: Most InDesign scripting environments support app.doScript
    }
})();