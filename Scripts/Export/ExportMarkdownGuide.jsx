/*
ExportMarkdownGuide.jsx

Purpose:
- Export the active InDesign document to Markdown format, converting paragraph styles to markdown headers
  while preserving page separation and page numbers.
- Optimized for teacher guides and educational content destined for AMA (Ask Me Anything) RAG system.

Approach:
- Scan all text frames on each page in reading order (top-to-bottom, left-to-right)
- Detect paragraph styles (H1, H2, H3, Heading 1, Heading 2, etc.) and convert to markdown headers
- Preserve page boundaries with page number markers
- Strip inline object placeholders (U+FFFC) and formatting artifacts
- Export as .md or .txt file with markdown formatting

Style Mapping:
- "H1" or "Heading 1" → # Header
- "H2" or "Heading 2" → ## Header
- "H3" or "Heading 3" → ### Header
- "H4" or "Heading 4" → #### Header
- "H5" or "Heading 5" → ##### Header
- "H6" or "Heading 6" → ###### Header
- Any style containing "title" → # Header (customizable)
- Regular text → plain paragraph

Notes:
- Original document is not modified
- Non-text objects (images, shapes) are ignored
- Anchored object markers removed from text
- Page breaks preserved with "---" separator and page number
*/

/* global UIUtils */
// Load shared utilities
var scriptFile = File($.fileName);
var utilsFile = File(scriptFile.parent.parent + "/Shared/InDesignUtils.jsx");
$.evalFile(utilsFile);

// Load UI utilities
var uiUtilsFile = File(scriptFile.parent.parent + "/Shared/UIUtils.jsx");
if (uiUtilsFile.exists) $.evalFile(uiUtilsFile);

(function () {
    if (app && app.doScript) {
        app.doScript(
            function () {
                var sp = app.scriptPreferences;
                var __prevRedraw = sp.enableRedraw;
                var outFile = null;

                try {
                    sp.enableRedraw = false;

                    // UI helpers - using InDesignUtils
                    function showAlert(msg) {
                        return UIUtils.alert(msg);
                    }

                    // Guards: Ensure InDesign and a document are available
                    if (!app || !app.documents || app.documents.length === 0) {
                        showAlert("Open a document before running ExportMarkdownGuide.");
                        return;
                    }

                    var srcDoc = app.activeDocument;

                    // Helper: Get base name without extension
                    function getBaseName(name) {
                        if (!name) return "Export";
                        var dot = name.lastIndexOf(".");
                        return dot > 0 ? name.substring(0, dot) : name;
                    }

                    // Helper: Build a default output file
                    function suggestOutputFile() {
                        var base = getBaseName(srcDoc.name);
                        var suggested = base + ".md";
                        try {
                            var folder =
                                srcDoc.saved && srcDoc.fullName && srcDoc.fullName.parent
                                    ? srcDoc.fullName.parent
                                    : Folder.desktop;
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
                            outFile = defaultFile.saveDlg(
                                "Save Markdown Guide",
                                "Markdown:*.md,Text:*.txt"
                            );
                        } else {
                            outFile = File.saveDialog("Save Markdown Guide", "Markdown:*.md,Text:*.txt");
                        }
                    } catch (_) {
                        outFile = File.saveDialog("Save Markdown Guide", "Markdown:*.md,Text:*.txt");
                    }
                    if (!outFile) {
                        // User canceled
                        return;
                    }

                    // Ensure .md or .txt extension
                    if (!/\.(md|txt)$/i.test(outFile.name)) {
                        outFile = File(outFile.fsName + ".md");
                    }

                    // Progress window - using InDesignUtils
                    var progressController = UIUtils.createProgressWindow("Export to Markdown", {
                        width: 520,
                        initialText: "Preparing..."
                    });

                    // Helper function to close progress window
                    function closeProgress() {
                        progressController.close();
                    }

                    // Helper: sort frames by Y then X (reading order)
                    function sortFrames(frames) {
                        frames.sort(function (a, b) {
                            try {
                                var ga = a.geometricBounds; // [y1,x1,y2,x2]
                                var gb = b.geometricBounds;
                                if (Math.abs(ga[0] - gb[0]) > 5) {
                                    // Different rows (with 5pt tolerance)
                                    return ga[0] - gb[0];
                                }
                                return ga[1] - gb[1]; // Same row, sort by X
                            } catch (e) {
                                return 0;
                            }
                        });
                        return frames;
                    }

                    // Helper: normalize plain text
                    function plainify(s) {
                        if (!s || s === "") return "";
                        // Remove object replacement character and artifacts
                        try {
                            s = s.replace(/[\uFFFC\uF8FF]/g, "");
                            // Normalize line endings to single newline
                            s = s.replace(/\r\n/g, "\n");
                            s = s.replace(/\r/g, "\n");
                        } catch (_) {}
                        return s;
                    }

                    // Helper: get the display label for a page
                    function getDisplayPageLabel(page) {
                        try {
                            if (page && page.name) return String(page.name);
                        } catch (_e1) {}
                        try {
                            return String(page.documentOffset + 1);
                        } catch (_e2) {}
                        return "?";
                    }

                    // Helper: Check if style is a "Book" level (top-level, above H1)
                    function isBookLevel(styleName) {
                        if (!styleName) return false;
                        var name = String(styleName).toUpperCase();
                        // Match "BOOK" but not if it contains H1-H6
                        if (name.indexOf("BOOK") >= 0) {
                            // Make sure it's not also an H-level style
                            if (name.indexOf("H1") < 0 && name.indexOf("H2") < 0 &&
                                name.indexOf("H3") < 0 && name.indexOf("H4") < 0 &&
                                name.indexOf("H5") < 0 && name.indexOf("H6") < 0) {
                                return true;
                            }
                        }
                        return false;
                    }

                    // Helper: Get list indent level from style name
                    function getListIndentLevel(styleName) {
                        if (!styleName) return 0;
                        var name = String(styleName).toUpperCase();

                        // Check for level indicators in style name
                        // L1/Level 1 = top level (indent 0)
                        // L2/Level 2 = first nested (indent 1 = 2 spaces)
                        // L3/Level 3 = second nested (indent 2 = 4 spaces)
                        if (name.indexOf("LEVEL 1") >= 0 || name.indexOf("L1") >= 0 || name.indexOf("LIST 1") >= 0) return 0;
                        if (name.indexOf("LEVEL 2") >= 0 || name.indexOf("L2") >= 0 || name.indexOf("LIST 2") >= 0) return 1;
                        if (name.indexOf("LEVEL 3") >= 0 || name.indexOf("L3") >= 0 || name.indexOf("LIST 3") >= 0) return 2;
                        if (name.indexOf("LEVEL 4") >= 0 || name.indexOf("L4") >= 0 || name.indexOf("LIST 4") >= 0) return 3;
                        if (name.indexOf("LEVEL 5") >= 0 || name.indexOf("L5") >= 0 || name.indexOf("LIST 5") >= 0) return 4;

                        // Check for indent/sub indicators
                        if (name.indexOf("INDENT") >= 0 || name.indexOf("SUB") >= 0 || name.indexOf("NESTED") >= 0) return 1;

                        return 0; // Top level (default)
                    }

                    // Helper: Check if style is a numbered list
                    function isNumberedList(styleName) {
                        if (!styleName) return false;
                        var name = String(styleName).toUpperCase();
                        // Match "numbered", "ordered", "list" patterns
                        if (name.indexOf("NUMBERED") >= 0) return true;
                        if (name.indexOf("ORDERED") >= 0) return true;
                        if (name.indexOf("LIST") >= 0 && name.indexOf("NUMBER") >= 0) return true;
                        return false;
                    }

                    // Helper: Check if style is a bulleted list
                    function isBulletedList(styleName) {
                        if (!styleName) return false;
                        var name = String(styleName).toUpperCase();
                        // Match "bullet", "unordered", "list" patterns
                        if (name.indexOf("BULLET") >= 0) return true;
                        if (name.indexOf("UNORDERED") >= 0) return true;
                        if (name.indexOf("LIST") >= 0 && !isNumberedList(styleName)) return true;
                        return false;
                    }

                    // Helper: Detect markdown header level from paragraph style name
                    // Simple approach: just search for H1, H2, etc. anywhere in the style name
                    function getMarkdownHeaderLevel(styleName) {
                        if (!styleName) return 0;
                        var name = String(styleName).toUpperCase(); // Convert to uppercase for matching

                        // Search for H1-H6 anywhere in the style name
                        // Examples: "H1", "H1 / TOC", "My H2 Style", "H3 / Numbered / Continue"
                        // Check in priority order (H6 first to avoid H1 matching in "H16")
                        if (name.indexOf("H6") >= 0) return 6;
                        if (name.indexOf("H5") >= 0) return 5;
                        if (name.indexOf("H4") >= 0) return 4;
                        if (name.indexOf("H3") >= 0) return 3;
                        if (name.indexOf("H2") >= 0) return 2;
                        if (name.indexOf("H1") >= 0) return 1;

                        return 0; // Not a header
                    }

                    // Helper: Trim whitespace (ExtendScript doesn't have .trim())
                    function trimText(str) {
                        if (!str) return "";
                        return String(str).replace(/^\s+|\s+$/g, "");
                    }

                    // Helper: Convert text to markdown based on style
                    function toMarkdown(text, styleName) {
                        if (!text || !/\S/.test(text)) return "";
                        text = trimText(text);

                        // Check for Book level (top-level, above H1)
                        if (isBookLevel(styleName)) {
                            // Format as emphasized top-level section
                            var separator = "";
                            for (var i = 0; i < text.length && i < 80; i++) {
                                separator += "=";
                            }
                            return "\n" + text + "\n" + separator + "\n";
                        }

                        // Check for numbered list
                        if (isNumberedList(styleName)) {
                            // Determine indent level from style name or text
                            var indentLevel = getListIndentLevel(styleName);

                            // Also check leading spaces in text
                            var indentMatch = text.match(/^(\s+)/);
                            if (indentMatch && indentLevel === 0) {
                                var spaces = indentMatch[1].length;
                                indentLevel = Math.floor(spaces / 4); // 4 spaces = 1 level
                            }

                            // Build indent string (2 spaces per level for markdown)
                            var indent = "";
                            for (var ind = 0; ind < indentLevel; ind++) {
                                indent += "  ";
                            }

                            // Remove existing numbering and leading whitespace
                            var cleanText = text.replace(/^\s*\d+[\.\)]\s*/, "");
                            return indent + "1. " + cleanText;
                        }

                        // Check for bulleted list
                        if (isBulletedList(styleName)) {
                            // Determine indent level from style name or text
                            var indentLevel = getListIndentLevel(styleName);

                            // Also check leading spaces in text
                            var indentMatch = text.match(/^(\s+)/);
                            if (indentMatch && indentLevel === 0) {
                                var spaces = indentMatch[1].length;
                                indentLevel = Math.floor(spaces / 4); // 4 spaces = 1 level
                            }

                            // Build indent string (2 spaces per level for markdown)
                            var indent = "";
                            for (var ind = 0; ind < indentLevel; ind++) {
                                indent += "  ";
                            }

                            // Remove existing bullets and leading whitespace
                            var cleanText = text.replace(/^\s*[•\-\*]\s*/, "");
                            return indent + "- " + cleanText;
                        }

                        var level = getMarkdownHeaderLevel(styleName);
                        if (level > 0) {
                            // Create markdown header
                            var hashes = "";
                            for (var i = 0; i < level; i++) {
                                hashes += "#";
                            }
                            // Split on line breaks - first line gets header, rest get paragraphs
                            var lines = text.split("\n");
                            var result = hashes + " " + lines[0];
                            for (var j = 1; j < lines.length; j++) {
                                if (lines[j] && /\S/.test(lines[j])) {
                                    result += "\n\n" + trimText(lines[j]);
                                }
                            }
                            return result;
                        }

                        // Regular paragraph
                        return text;
                    }

                    // Build the markdown content page-by-page
                    var markdownParts = [];

                    for (var pageIdx = 0; pageIdx < srcDoc.pages.length; pageIdx++) {
                        var srcPage = srcDoc.pages[pageIdx];

                        var progressText =
                            "Processing page " +
                            srcPage.name +
                            " (" +
                            (pageIdx + 1) +
                            "/" +
                            srcDoc.pages.length +
                            ")...";
                        progressController.update((pageIdx / srcDoc.pages.length) * 100, progressText);

                        // Helper: Convert InDesign table to markdown table
                        function tableToMarkdown(table) {
                            try {
                                var rows = table.rows;
                                var cols = table.columns.length;
                                var mdTable = [];

                                // Process each row
                                for (var r = 0; r < rows.length; r++) {
                                    var rowCells = [];
                                    var cells = rows[r].cells;

                                    for (var c = 0; c < cells.length; c++) {
                                        var cellText = String(cells[c].contents);
                                        cellText = plainify(cellText);
                                        cellText = trimText(cellText);
                                        // Remove line breaks within cells
                                        cellText = cellText.replace(/\n/g, " ");
                                        rowCells.push(cellText);
                                    }

                                    mdTable.push("| " + rowCells.join(" | ") + " |");

                                    // Add separator after first row (header)
                                    if (r === 0) {
                                        var sep = [];
                                        for (var s = 0; s < rowCells.length; s++) {
                                            sep.push("---");
                                        }
                                        mdTable.push("| " + sep.join(" | ") + " |");
                                    }
                                }

                                return "\n" + mdTable.join("\n") + "\n";
                            } catch (e) {
                                return "";
                            }
                        }

                        // Gather tables on this page
                        var tables = [];
                        try {
                            var pageTables = srcPage.tables;
                            for (var ti = 0; ti < pageTables.length; ti++) {
                                var tbl = pageTables[ti];
                                if (tbl && tbl.parentPage && tbl.parentPage === srcPage) {
                                    tables.push({
                                        table: tbl,
                                        bounds: tbl.parent.geometricBounds, // Get frame bounds
                                        type: "table"
                                    });
                                }
                            }
                        } catch (_) {}

                        // Gather text frames on this page only
                        var frames = [];
                        try {
                            var pf = srcPage.textFrames;
                            for (var fi = 0; fi < pf.length; fi++) {
                                var tfSrc = pf[fi];
                                if (tfSrc && tfSrc.parentPage && tfSrc.parentPage === srcPage) {
                                    frames.push({
                                        frame: tfSrc,
                                        bounds: tfSrc.geometricBounds,
                                        type: "text"
                                    });
                                }
                            }
                        } catch (_) {}

                        // Combine tables and frames, then sort by position
                        var allItems = frames.concat(tables);
                        allItems.sort(function (a, b) {
                            try {
                                var ga = a.bounds;
                                var gb = b.bounds;
                                if (Math.abs(ga[0] - gb[0]) > 5) {
                                    return ga[0] - gb[0]; // Different rows
                                }
                                return ga[1] - gb[1]; // Same row, sort by X
                            } catch (e) {
                                return 0;
                            }
                        });

                        // Add page separator (except for first page)
                        if (pageIdx > 0) {
                            markdownParts.push("\n---\n");
                        }

                        // Add page number marker
                        markdownParts.push("<!-- Page " + getDisplayPageLabel(srcPage) + " -->\n");

                        // Process each item (table or text frame)
                        for (var itemIdx = 0; itemIdx < allItems.length; itemIdx++) {
                            var item = allItems[itemIdx];

                            // Handle tables
                            if (item.type === "table") {
                                var mdTable = tableToMarkdown(item.table);
                                if (mdTable) {
                                    markdownParts.push(mdTable);
                                    markdownParts.push("\n");
                                }
                                continue;
                            }

                            // Handle text frames
                            var frame = item.frame;

                            try {
                                var paras = frame.paragraphs;

                                for (var pIdx = 0; pIdx < paras.length; pIdx++) {
                                    var para = paras[pIdx];
                                    var paraText = "";
                                    var styleName = "";

                                    // Check if this paragraph contains a table
                                    var paraHasTable = false;
                                    try {
                                        var paraTables = para.tables;
                                        if (paraTables && paraTables.length > 0) {
                                            paraHasTable = true;
                                            // Output the table(s) at this position
                                            for (var ptIdx = 0; ptIdx < paraTables.length; ptIdx++) {
                                                var mdTable = tableToMarkdown(paraTables[ptIdx]);
                                                if (mdTable) {
                                                    markdownParts.push(mdTable);
                                                    markdownParts.push("\n");
                                                }
                                            }
                                            continue; // Skip this paragraph's text (it's the table)
                                        }
                                    } catch (_) {}

                                    try {
                                        paraText = String(para.contents);
                                        paraText = plainify(paraText);
                                    } catch (_) {
                                        continue;
                                    }

                                    // Get paragraph style name
                                    try {
                                        styleName = String(para.appliedParagraphStyle.name);
                                    } catch (_) {
                                        styleName = "";
                                    }

                                    // Convert to markdown
                                    var mdLine = toMarkdown(paraText, styleName);

                                    if (mdLine) {
                                        markdownParts.push(mdLine);
                                        markdownParts.push("\n");

                                        // Add extra line break after headers for readability
                                        if (getMarkdownHeaderLevel(styleName) > 0 || isBookLevel(styleName)) {
                                            markdownParts.push("\n");
                                        }
                                    }
                                }
                            } catch (frameErr) {
                                // If paragraph iteration fails, fall back to frame contents
                                try {
                                    var raw = String(frame.contents);
                                    raw = plainify(raw);
                                    if (raw && /\S/.test(raw)) {
                                        markdownParts.push(raw);
                                        markdownParts.push("\n\n");
                                    }
                                } catch (_) {}
                            }
                        }
                    }

                    // Update progress to export
                    progressController.update(100, "Writing markdown file...");

                    // Join all parts into final markdown
                    var finalMarkdown = markdownParts.join("");

                    // Write to file
                    try {
                        outFile.encoding = "UTF-8";
                        outFile.open("w");
                        outFile.write(finalMarkdown);
                        outFile.close();
                    } catch (writeErr) {
                        closeProgress();
                        showAlert("Failed to write markdown file: " + writeErr);
                        return;
                    }

                    closeProgress();
                    showAlert("Markdown guide exported successfully to:\n" + outFile.fsName);
                } catch (err) {
                    closeProgress();
                    showAlert("Markdown export failed: " + err);
                } finally {
                    try {
                        sp.enableRedraw = __prevRedraw;
                    } catch (_) {}
                }
            },
            ScriptLanguage.JAVASCRIPT,
            undefined,
            UndoModes.ENTIRE_SCRIPT,
            "Export Markdown Guide"
        );
    }
})();
