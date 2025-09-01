/*
SeferGuideExport.jsx

Purpose:
- Export a separate PDF for each section in the active document.
- A section starts at any page that contains an object with the object style named "Divider Page".
- The section name is taken from the first object on that page (uses the page item's name).
- Each exported PDF includes the document's first 3 pages (front matter) in addition to the section's pages.
- Before each export, the object on the first page named "Level" is updated to the section name (with '-' replaced by '•'); after all exports, it is restored to its original text.
- PDF filename: "<DocumentBase> - <SectionName>.pdf"

Notes:
- Output location: Exports into a subfolder named "PDF" inside the document's folder (or inside a user-chosen base folder for unsaved docs).
- Uses absolute page numbering with '+' to avoid section numbering issues.
- Follows repository engineering standards: single undo step, restore globals in finally, validate object specifiers, minimize redraw.
- This script supersedes the older ExportSectionsToPDF.jsx.
*/

/* global UIUtils, ExportUtils */
(function () {
    // Bootstrapping: load shared utilities for consistency with the repo
    var __scriptFile = File($.fileName);
    var __sharedDir = __scriptFile.parent.parent + "/Shared";

    function __tryLoad(fileRel) {
        var f = File(__sharedDir + "/" + fileRel);
        if (f.exists) $.evalFile(f);
        return f.exists;
    }

    try {
        if (!__tryLoad("InDesignUtils.jsx")) {
            alert("Required utilities missing: InDesignUtils.jsx");
            return;
        }
        __tryLoad("UIUtils.jsx");
        __tryLoad("ExportUtils.jsx");
    } catch (bootErr) {
        try {
            alert("Failed to load utilities: " + bootErr);
        } catch (_) {}
        return;
    }

    function notify(msg, title) {
        if (typeof UIUtils !== "undefined" && UIUtils && UIUtils.alert)
            return UIUtils.alert(String(msg), title || "Sefer Guide Export");
        try {
            return alert(String(msg));
        } catch (e) {
            try {
                $.writeln(String(msg));
            } catch (_) {}
        }
        return 1;
    }

    // Guard: require an open document
    if (!app || !app.documents || app.documents.length === 0) {
        notify("Open a document before running this script.", "Sefer Guide Export");
        return;
    }

    // Helpers
    function getBaseName(n) {
        var name = String(n || "");
        var i = name.lastIndexOf(".");
        return i > 0 ? name.substring(0, i) : name;
    }

    function getDocBaseName(doc) {
        try {
            return getBaseName(doc.name);
        } catch (e) {
            return "Document";
        }
    }

    function getOutputFolder(doc) {
        // Return a subfolder named "PDF" within the document folder (if saved) or a user-chosen base folder.
        try {
            var baseFolder = null;
            try {
                if (doc && doc.saved && doc.filePath && doc.filePath.exists) baseFolder = doc.filePath;
            } catch (_) {}
            if (!baseFolder) {
                try {
                    baseFolder = Folder.selectDialog("Choose base folder; PDFs will be saved in its 'PDF' subfolder");
                } catch (_) {}
            }
            if (!baseFolder) return null;
            var pdfFolder = Folder(baseFolder.fsName + "/PDF");
            if (!pdfFolder.exists) {
                try {
                    if (!pdfFolder.create()) return null;
                } catch (eCreate) {
                    return null;
                }
            }
            return pdfFolder;
        } catch (e) {
            return null;
        }
    }

    function pageHasDividerObject(page) {
        // A page is a divider if it contains any object with object style named "Divider Page"
        try {
            if (!page || !page.isValid) return false;
            var items = page.pageItems;
            for (var i = 0; i < items.length; i++) {
                var it = items[i];
                try {
                    var os = it.appliedObjectStyle;
                    if (os && os.isValid) {
                        var osName = String(os.name || "");
                        if (osName === "Divider Page") return true;
                    }
                } catch (_) {}
            }
            return false;
        } catch (_) {
            return false;
        }
    }

    function buildSections(doc) {
        // Returns array of { startPage: Page, endPage: Page }
        var sections = [];
        var pages = doc.pages;
        if (!pages || pages.length === 0) return sections;

        var i;
        var starters = [];
        for (i = 0; i < pages.length; i++) {
            var p = pages[i];
            if (InDesignUtils.Error && !InDesignUtils.Error.isValid(p)) continue;
            if (pageHasDividerObject(p)) starters.push(p);
        }
        if (starters.length === 0) return sections;

        for (i = 0; i < starters.length; i++) {
            var startP = starters[i];
            var endP = i + 1 < starters.length ? starters[i + 1] : pages[pages.length - 1];
            // end page is the page before the next starter; adjust if necessary
            if (i + 1 < starters.length) {
                try {
                    var endIndex = starters[i + 1].documentOffset - 1;
                    if (endIndex >= startP.documentOffset) endP = pages[endIndex];
                } catch (_) {}
            }
            sections.push({ startPage: startP, endPage: endP });
        }
        return sections;
    }

    function getFirstLayerNameOnPage(doc, page) {
        // Collect layers that actually have items on this page, keep document layer order
        try {
            var layersOnPage = {};
            var items = page.pageItems;
            for (var i = 0; i < items.length; i++) {
                var it = items[i];
                try {
                    var lyr = it.itemLayer; // Layer
                    if (lyr && lyr.isValid) layersOnPage[lyr.id] = lyr;
                } catch (_) {}
            }
            // Choose the first layer in doc.layers order that appears on this page
            var allLayers = doc.layers.everyItem().getElements();
            for (var j = 0; j < allLayers.length; j++) {
                var L = allLayers[j];
                if (layersOnPage[L.id]) return String(L.name || "");
            }
            // Fallback: topmost layer name
            if (allLayers.length > 0) return String(allLayers[0].name || "");
        } catch (_) {}
        return "Section";
    }

    function getFirstObjectNameOnPage(page) {
        // Return the first page item's non-empty name on the page (document order), or empty string if none
        try {
            if (!page || !page.isValid) return "";
            var items = page.pageItems;
            if (!items || items.length === 0) return "";
            for (var i = 0; i < items.length; i++) {
                var it = items[i];
                try {
                    if (it && it.isValid) {
                        var nm = String(it.name || "");
                        if (nm && nm.length > 0) return nm;
                    }
                } catch (_) {}
            }
        } catch (_) {}
        return "";
    }

    function findLevelTextFrameOnFirstPage(doc) {
        // Find a text container on the first page named "Level". Returns a text frame or null.
        try {
            if (!doc || !doc.isValid) return null;
            var pages = doc.pages;
            if (!pages || pages.length === 0) return null;
            var firstPage = pages[0];
            if (!firstPage || !firstPage.isValid) return null;

            // 1) Direct pageItem by name
            try {
                var itemByName = firstPage.pageItems.itemByName("Level");
                if (itemByName && itemByName.isValid) {
                    // If it's a text frame, use it
                    try {
                        if (itemByName.constructor && String(itemByName.constructor.name || "") === "TextFrame") {
                            return itemByName;
                        }
                    } catch (_) {}
                    // If it has textFrames collection (e.g., a group), grab first
                    try {
                        if (itemByName.textFrames && itemByName.textFrames.length > 0) {
                            var tf0 = itemByName.textFrames[0];
                            if (tf0 && tf0.isValid) return tf0;
                        }
                    } catch (_) {}
                    // If it exposes contents directly
                    try {
                        if (typeof itemByName.contents !== "undefined") return itemByName;
                    } catch (_) {}
                }
            } catch (_) {}

            // 2) Search text frames on the page with the name "Level"
            try {
                var tfs = firstPage.textFrames;
                for (var i = 0; i < tfs.length; i++) {
                    var tf = tfs[i];
                    try {
                        var nm = String(tf.name || "");
                        if (nm === "Level") return tf;
                    } catch (_) {}
                }
            } catch (_) {}
        } catch (_) {}
        return null;
    }

    function buildCombinedPageRange(doc, startPage, endPage) {
        // Build an absolute page list including +1..+min(3,N) and +start..+end, unique and ordered
        try {
            if (!doc || !doc.isValid || !startPage || !endPage) return "+1";
            var total = doc.pages.length;
            var firstEnd = total < 3 ? total : 3;
            var seen = {};
            var out = [];
            var i;
            for (i = 1; i <= firstEnd; i++) {
                if (!seen[i]) {
                    out.push("+" + i);
                    seen[i] = true;
                }
            }
            var s = startPage.documentOffset + 1;
            var e = endPage.documentOffset + 1;
            if (s < 1) s = 1;
            if (e > total) e = total;
            for (i = s; i <= e; i++) {
                if (!seen[i]) {
                    out.push("+" + i);
                    seen[i] = true;
                }
            }
            return out.join(",");
        } catch (e) {
            try {
                var t = doc.pages.length;
                var upto = t < 3 ? t : 3;
                var parts = [];
                for (var j = 1; j <= upto; j++) parts.push("+" + j);
                return parts.join(",");
            } catch (_) {
                return "+1";
            }
        }
    }

    function sanitizeName(s) {
        try {
            if (typeof ExportUtils !== "undefined" && ExportUtils && ExportUtils.sanitizeFilenamePart)
                return ExportUtils.sanitizeFilenamePart(String(s || ""), "_");
        } catch (_) {}
        // Fallback simple sanitizer
        var out = String(s || "");
        var bad = ["/", "\\", ":", "*", "?", '"', "<", ">", "|"];
        for (var i = 0; i < bad.length; i++) out = out.split(bad[i]).join("_");
        return out;
    }

    function exportSection(doc, range, outFile) {
        // Export given absolute page range to Interactive PDF (preserves hyperlinks)
        var ok = true;
        var origRange = null;
        var origSpreads = null;
        var origViewPDF = null;
        try {
            origRange = app.interactivePDFExportPreferences.pageRange;
        } catch (_) {}
        try {
            origSpreads = app.interactivePDFExportPreferences.exportReaderSpreads;
        } catch (_) {}
        try {
            origViewPDF = app.interactivePDFExportPreferences.viewPDF;
        } catch (_) {}

        try {
            app.interactivePDFExportPreferences.pageRange = range;
            app.interactivePDFExportPreferences.exportReaderSpreads = false;
            // Ensure the exported PDF is not opened automatically
            app.interactivePDFExportPreferences.viewPDF = false;
            doc.exportFile(ExportFormat.INTERACTIVE_PDF, outFile, false);
        } catch (e) {
            ok = false;
            notify("Export failed for " + outFile.fsName + "\n" + e, "Sefer Guide Export");
        } finally {
            try {
                if (origRange !== null) app.interactivePDFExportPreferences.pageRange = origRange;
            } catch (_) {}
            try {
                if (origSpreads !== null) app.interactivePDFExportPreferences.exportReaderSpreads = origSpreads;
            } catch (_) {}
            try {
                if (origViewPDF !== null) app.interactivePDFExportPreferences.viewPDF = origViewPDF;
            } catch (_) {}
        }
        return ok;
    }

    function main() {
        var doc = InDesignUtils.Objects.getActiveDocument();
        if (!doc) {
            notify("No active document.", "Sefer Guide Export");
            return;
        }

        var outFolder = getOutputFolder(doc);
        if (!outFolder) {
            notify("No output folder selected.", "Sefer Guide Export");
            return;
        }

        var base = getDocBaseName(doc);
        var sections = buildSections(doc);
        if (sections.length === 0) {
            notify(
                "No sections found. No pages contain an object with object style 'Divider Page'.",
                "Sefer Guide Export"
            );
            return;
        }

        // Locate the 'Level' text target on the first page and store original contents
        var levelFrame = findLevelTextFrameOnFirstPage(doc);
        var levelOriginal = null;
        if (levelFrame && levelFrame.isValid) {
            try {
                levelOriginal = String(levelFrame.contents);
            } catch (_) {}
        }

        // Progress UI (palette)
        var prog = null;
        if (typeof UIUtils !== "undefined" && UIUtils && UIUtils.createProgressWindow) {
            prog = UIUtils.createProgressWindow("Exporting Sections…", {
                width: 420,
                showLabel: true,
                initialText: "Preparing…"
            });
        }

        var successCount = 0;
        try {
            for (var i = 0; i < sections.length; i++) {
                var sec = sections[i];
                var objName = getFirstObjectNameOnPage(sec.startPage);
                var secName = objName || getFirstLayerNameOnPage(doc, sec.startPage);

                // Update the 'Level' text frame with the current section name
                if (levelFrame && levelFrame.isValid) {
                    try {
                        var __lvlTxt = String(objName || secName || "");
                        // Replace hyphens with bullet per requirement
                        try {
                            __lvlTxt = __lvlTxt.replace(/-/g, "•");
                        } catch (_r) {
                            __lvlTxt = __lvlTxt.split("-").join("•");
                        }
                        levelFrame.contents = __lvlTxt;
                    } catch (_) {}
                }

                var safeSec = sanitizeName(secName || "Section " + (i + 1));
                var fileName = base + " - " + safeSec + ".pdf";
                var outFile = File(outFolder.fsName + "/" + fileName);

                if (prog && prog.update) {
                    prog.update(Math.round((i / sections.length) * 100), "Exporting: " + fileName);
                }

                // Build combined page range including first 3 pages and the section pages
                var range = buildCombinedPageRange(doc, sec.startPage, sec.endPage);
                if (exportSection(doc, range, outFile)) successCount++;
            }
        } finally {
            // Restore original 'Level' text after all exports
            if (levelFrame && levelFrame.isValid && levelOriginal !== null) {
                try {
                    levelFrame.contents = levelOriginal;
                } catch (_) {}
            }
        }

        if (prog && prog.update) prog.update(100, "Done.");
        if (prog && prog.close) prog.close();

        notify("Exported " + successCount + " section PDF(s) to:\n" + outFolder.fsName, "Sefer Guide Export");
    }

    // Entry: single undo step and safe preferences
    try {
        var undoName = "Sefer Guide Export";
        var run = function () {
            var sp = app.scriptPreferences;
            var origUnits = null;
            var origRedraw = null;
            try {
                origUnits = sp.measurementUnit;
            } catch (_) {}
            try {
                origRedraw = sp.enableRedraw;
            } catch (_) {}
            try {
                sp.measurementUnit = MeasurementUnits.POINTS;
            } catch (_) {}
            try {
                sp.enableRedraw = false;
            } catch (_) {}
            try {
                main();
            } catch (e) {
                notify("Error: " + e, "Sefer Guide Export");
            } finally {
                try {
                    if (origUnits !== null) sp.measurementUnit = origUnits;
                } catch (_) {}
                try {
                    if (origRedraw !== null) sp.enableRedraw = origRedraw;
                } catch (_) {}
            }
        };
        if (app.doScript) {
            app.doScript(run, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, undoName);
        } else {
            run();
        }
    } catch (eOuter) {
        notify("Script failed: " + eOuter, "Sefer Guide Export");
    }
})();
