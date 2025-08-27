/**
 * ExportUtils.jsx — Shared export/PDF helpers for InDesign (ExtendScript, ES3-safe)
 * Namespace: ExportUtils
 *
 * Provides:
 *  - ExportUtils.sanitizeFilenamePart(s, replacement)  → Filename-safe string helper
 *  - ExportUtils.bringPdfViewerToFront()               → Post-export: focus a PDF viewer
 *  - ExportUtils.applyWatermarkLayer(doc, text)        → Temporarily add a watermark layer
 *  - ExportUtils.removeWatermarkLayer(doc, layer)      → Remove watermark layer and temp styles
 *
 * Conventions:
 *  - Each major feature is clearly delimited by SECTION headers below.
 *  - No runtime behavior is tied to comments; these are documentation-only.
 */

var ExportUtils = ExportUtils || {};

(function (NS) {
    // SECTION: Filename Sanitization
    // Purpose: Ensure arbitrary strings can be used safely in single filename segments by
    // replacing characters that are invalid on common file systems.
    /**
     * Sanitize a string for safe use in filenames (single path segment)
     * Replaces invalid characters with the provided replacement (default: underscore)
     * Invalid characters: \/ : * ? " < > |
     * @param {string} s
     * @param {string} [replacement]
     * @returns {string}
     */
    NS.sanitizeFilenamePart = function (s, replacement) {
        var rep = replacement == null ? "_" : String(replacement);
        try {
            return String(s || "").replace(new RegExp('[\\/:*?"<>|]', "g"), rep);
        } catch (e) {
            // Defensive fallback without regex
            var out = String(s || "");
            var bad = ["/", "\\", ":", "*", "?", '"', "<", ">", "|"];
            for (var i = 0; i < bad.length; i++) {
                var ch = bad[i];
                out = out.split(ch).join(rep);
            }
            return out;
        }
    };

    // SECTION: Bring PDF Viewer To Front
    // Purpose: After a successful PDF export, bring a common PDF viewer to the foreground
    // in a permission-friendly way. Uses Apple Events on macOS (no UI scripting) and a
    // best-effort AppActivate on Windows.
    // Bring PDF viewer to front using platform-appropriate methods
    // - macOS: Apple Events (activate by bundle id). Avoids System Events/UI scripting.
    // - Windows: PowerShell AppActivate fallback (kept minimal and best-effort).
    // Returns true if an activation command was issued without throwing.
    NS.bringPdfViewerToFront = function () {
        var osName;
        try {
            osName = String($.os || "").toLowerCase();
        } catch (_eOs) {
            osName = "";
        }

        // Windows path: use AppActivate for any Adobe window (Acrobat/Reader)
        if (osName.indexOf("windows") !== -1) {
            try {
                var cmd =
                    'powershell -Command "Add-Type -AssemblyName Microsoft.VisualBasic; [Microsoft.VisualBasic.Interaction]::AppActivate("Adobe")"';
                app.system(cmd);
                return true;
            } catch (_eWin) {
                return false;
            }
        }

        // macOS path: use Apple Events to activate common PDF viewers by bundle id
        if (osName.indexOf("mac") !== -1) {
            var scripts = [
                'tell application id "com.apple.Preview" to activate',
                'tell application id "com.adobe.Acrobat" to activate',
                'tell application id "com.adobe.Reader" to activate'
            ];
            for (var i = 0; i < scripts.length; i++) {
                try {
                    app.doScript(scripts[i], ScriptLanguage.APPLESCRIPT_LANGUAGE);
                    return true;
                } catch (_eMac) {}
            }
            // Fallback: try to start Preview via shell if Apple Events failed
            try {
                app.doScript('do shell script "open -a Preview"', ScriptLanguage.APPLESCRIPT_LANGUAGE);
                return true;
            } catch (_eShell) {}
            return false;
        }

        return false;
    };

    // SECTION: PDF Watermark Utilities
    // Purpose: Temporarily apply a text watermark layer to all pages during export and
    // remove both the layer and its temporary styles afterward.
    // Defaults chosen to match Acrobat sequence (literal text, no numbers)
    var WM_DEFAULT_ANGLE = 45; // degrees
    var WM_DEFAULT_OPACITY = 65; // percent
    var WM_DEFAULT_COVERAGE = 0.8; // fraction of page diagonal

    function createWatermarkObjectStyle(doc) {
        var styleName = "__TEMP_WM_OBJECT__";
        var objStyle;

        try {
            objStyle = doc.objectStyles.itemByName(styleName);
        } catch (_e) {}
        if (!objStyle || !objStyle.isValid) {
            objStyle = doc.objectStyles.add();
            objStyle.name = styleName;
            try {
                objStyle.basedOn = doc.objectStyles.itemByName("[None]");
            } catch (_b0) {}
            try {
                objStyle.enableStroke = false;
            } catch (_s1) {}
            try {
                objStyle.enableFill = false;
            } catch (_s2) {}
            try {
                objStyle.strokeWeight = 0;
            } catch (_s2w) {}
            try {
                objStyle.fillColor = doc.swatches.itemByName("[None]");
            } catch (_fc) {}
            try {
                objStyle.strokeColor = doc.swatches.itemByName("[None]");
            } catch (_sc) {}
            try {
                objStyle.textFramePreferences.autoSizingType = AutoSizingTypeEnum.OFF;
            } catch (_s3) {}
            try {
                objStyle.textFramePreferences.useNoLineBreaksForAutoSizing = false;
            } catch (_s4) {}
            try {
                objStyle.textFramePreferences.insetSpacing = [0, 0, 0, 0];
            } catch (_sInset) {}
            try {
                objStyle.textFramePreferences.firstBaselineOffset = FirstBaseline.CAP_HEIGHT;
            } catch (_fb) {}
        }
        return objStyle;
    }

    function createWatermarkParagraphStyle(doc, textLength, pageWidth, pageHeight) {
        var styleName = "__TEMP_WM_PARAGRAPH__";
        var paraStyle;

        try {
            paraStyle = doc.paragraphStyles.itemByName(styleName);
        } catch (_e) {}
        if (!paraStyle || !paraStyle.isValid) {
            var baseStyle;
            try {
                baseStyle = doc.paragraphStyles.itemByName("[No Paragraph Style]");
            } catch (_base) {
                baseStyle = doc.paragraphStyles[0];
            }

            paraStyle = doc.paragraphStyles.add();
            paraStyle.name = styleName;
            paraStyle.basedOn = baseStyle;

            try {
                paraStyle.justification = Justification.CENTER_ALIGN;
            } catch (_p1) {}
            try {
                paraStyle.numberedListStyle = app.numberedListStyles.itemByName("[None]");
            } catch (_p2) {}
            try {
                paraStyle.bulletedListStyle = app.bulletedListStyles.itemByName("[None]");
            } catch (_p3) {}
            try {
                paraStyle.numberingContinue = false;
            } catch (_p4) {}
            try {
                paraStyle.numberingStartAt = 1;
            } catch (_p5) {}

            try {
                paraStyle.appliedFont = app.fonts.itemByName("Arial\tBold");
            } catch (_fb0) {
                try {
                    paraStyle.appliedFont = app.fonts.itemByName("Arial\tRegular");
                    paraStyle.fontStyle = "Bold";
                } catch (_f1) {
                    try {
                        paraStyle.appliedFont = app.fonts.itemByName("Helvetica\tBold");
                    } catch (_f2) {}
                }
            }

            try {
                paraStyle.hyphenation = false;
            } catch (_hy) {}
            try {
                paraStyle.tracking = 0;
            } catch (_tr) {}
            try {
                paraStyle.horizontalScale = 100;
            } catch (_hs) {}
            try {
                paraStyle.verticalScale = 100;
            } catch (_vs) {}
            try {
                paraStyle.ligatures = false;
            } catch (_lg) {}
            try {
                paraStyle.kerningMethod = AutoKernType.METRICS;
            } catch (_km) {}
            try {
                paraStyle.fillColor = doc.swatches.itemByName("[Black]");
            } catch (_fc2) {}
            try {
                paraStyle.strokeColor = doc.swatches.itemByName("[None]");
            } catch (_sc2) {}
            try {
                paraStyle.spaceBefore = 0;
            } catch (_sb) {}
            try {
                paraStyle.spaceAfter = 0;
            } catch (_sa) {}
            try {
                paraStyle.alignToBaseline = false;
            } catch (_ab) {}
            try {
                paraStyle.composer = "Adobe Paragraph Composer";
            } catch (_cp) {}
            try {
                paraStyle.appliedLanguage = app.languagesWithVendors.itemByName("[No Language]");
            } catch (_lang1) {}
            try {
                if (!paraStyle.appliedLanguage || !paraStyle.appliedLanguage.isValid)
                    paraStyle.appliedLanguage = app.languagesWithVendors.itemByName("English: USA");
            } catch (_lang2) {}

            try {
                var diag = Math.sqrt(pageWidth * pageWidth + pageHeight * pageHeight);
                var targetLen = diag * WM_DEFAULT_COVERAGE;
                paraStyle.pointSize = Math.max(24, (targetLen / Math.max(1, textLength)) * 1.35);
            } catch (_pSize) {
                try {
                    paraStyle.pointSize = 72;
                } catch (_pSizeFallback) {}
            }
        }
        return paraStyle;
    }

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

    NS.applyWatermarkLayer = function (doc, text) {
        if (!text || text === "") return null;
        var avgWidth = 0,
            avgHeight = 0;
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

        var tempObjStyle = createWatermarkObjectStyle(doc);
        var tempParaStyle = createWatermarkParagraphStyle(doc, String(text).length, avgWidth, avgHeight);

        var lyr;
        try {
            lyr = doc.layers.itemByName("__TEMP_WATERMARK__");
            if (!lyr.isValid) lyr = doc.layers.add({ name: "__TEMP_WATERMARK__" });
        } catch (_e0) {
            lyr = doc.layers.add({ name: "__TEMP_WATERMARK__" });
        }
        lyr.locked = false;
        lyr.visible = true;
        try {
            lyr.move(LocationOptions.AT_BEGINNING);
        } catch (_eMove) {}

        var i;
        for (i = 0; i < pages.length; i++) {
            var p = pages[i];
            var pb2 = p.bounds;
            var w = pb2[3] - pb2[1],
                h = pb2[2] - pb2[0];
            var tf = p.textFrames.add(lyr);
            var cx = pb2[1] + w / 2,
                cy = pb2[0] + h / 2,
                half = Math.max(w, h);
            tf.geometricBounds = [cy - half / 2, cx - half / 2, cy + half / 2, cx + half / 2];
            try {
                tf.appliedObjectStyle = tempObjStyle;
            } catch (_eObj) {}
            try {
                tf.textFramePreferences.insetSpacing = [0, 0, 0, 0];
            } catch (_finset) {}
            try {
                tf.textFramePreferences.firstBaselineOffset = FirstBaseline.CAP_HEIGHT;
            } catch (_ffb) {}
            tf.contents = String(text);
            var story = tf.parentStory;
            try {
                story.appliedParagraphStyle = tempParaStyle;
            } catch (_ePara) {}
            try {
                var noneChar = doc.characterStyles.itemByName("[None]");
                if (tf.texts && tf.texts.length > 0) {
                    try {
                        tf.texts[0].appliedCharacterStyle = noneChar;
                    } catch (_cs) {}
                    try {
                        if (tf.texts[0].clearOverrides) tf.texts[0].clearOverrides();
                    } catch (_co) {}
                }
            } catch (_eChar) {}
            try {
                tf.textFramePreferences.ignoreTextWrap = true;
            } catch (_eWrap) {}
            try {
                tf.textFramePreferences.verticalJustification = VerticalJustification.CENTER_ALIGN;
            } catch (_e3) {}
            try {
                tf.transparencySettings.blendingSettings.opacity = WM_DEFAULT_OPACITY;
            } catch (_e4) {}
            try {
                tf.rotationAngle = WM_DEFAULT_ANGLE;
            } catch (_e5) {}
            try {
                var gb = tf.geometricBounds,
                    fx = (gb[1] + gb[3]) / 2,
                    fy = (gb[0] + gb[2]) / 2;
                tf.move(undefined, [cx - fx, cy - fy]);
            } catch (_e6) {}
        }
        return lyr;
    };

    NS.removeWatermarkLayer = function (doc, lyr) {
        if (!lyr || !lyr.isValid) return;
        try {
            lyr.remove();
        } catch (_e) {}
        removeWatermarkStyles(doc);
    };
})(ExportUtils);
