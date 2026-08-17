/**
 * Purpose: Convert a document from the three-font Sharp pairing to Alephbeis Sans, which sets both scripts,
 *   and remove the GREP styles that existed only to hold that pairing together.
 * Public API: Script entry point (IIFE). No exported functions; run via the InDesign Scripts panel.
 * Dependencies: Adobe InDesign ExtendScript runtime (app). Shared modules loaded at runtime: InDesignUtils.jsx,
 *   UIUtils.jsx. Requires an open document and Alephbeis Sans v2.0 installed.
 * Usage:
 *   // In InDesign Scripts panel: double-click "SharpToSans.jsx" with a document open.
 */
/* global UIUtils, FontStatus */

/*
 * Alephbeis Sharp sets Hebrew and Sharp Sans Display No1 sets the Latin beside it, so a bilingual document
 * needs GREP styles to hand each run to the right font: a Latin letter inside a Hebrew paragraph is switched
 * to the Latin face, and Hebrew inside a Latin paragraph back again. Alephbeis Sans carries both scripts, so
 * those rules are not merely unnecessary — left in place they re-apply a character style whose font no longer
 * differs, which is an override nobody can see and every new paragraph inherits.
 *
 * A rule is judged by what it DOES rather than by what it is called: it goes only if its character style sets
 * one of the fonts being replaced. GREP styles that colour a letter or set an ornament are somebody's
 * typography and are left alone.
 *
 * The weights are not named the same on both sides. Sharp and Sans are the same drawing released differently,
 * and three cuts carry different labels — Sharp's Book is Sans's Regular, Sharp's Thin is Sans's ExtraLight,
 * and Sharp's Ultrathin is Sans's Thin. A family swap that kept the style name would move two of those a full
 * step without saying so, which is why the name is mapped rather than carried.
 */

(function () {
    // Load shared utilities
    var scriptFile = File($.fileName);
    var sharedRoot = scriptFile.parent.parent + "/Shared/";

    var indUtilsFile = File(sharedRoot + "InDesignUtils.jsx");
    if (!indUtilsFile.exists) throw new Error("InDesignUtils.jsx not found in Shared.");
    $.evalFile(indUtilsFile);

    var uiUtilsFile = File(sharedRoot + "UIUtils.jsx");
    if (!uiUtilsFile.exists) throw new Error("UIUtils.jsx not found in Shared.");
    $.evalFile(uiUtilsFile);

    var TARGET_FAMILY = "Alephbeis Sans";

    // Everything the pairing was made of. All three become the one family.
    var SOURCE_FAMILIES = ["Alephbeis Sharp", "Sharp Sans Display No1", "Sharp Sans"];

    // Sharp's cut names against Sans's. Anything absent here is named the same in both.
    var STYLE_MAP = {
        Book: "Regular",
        Semibold: "SemiBold",
        Ultrathin: "Thin",
        Thin: "ExtraLight",
        Extrabold: "ExtraBold",
        Extralight: "ExtraLight",
        Ultralight: "ExtraLight",
        Hairline: "Hairline",
        Light: "Light",
        Regular: "Regular",
        Medium: "Medium",
        Bold: "Bold",
        Black: "Black"
    };

    var FALLBACK_STYLE = "Regular";

    var doc = InDesignUtils.Objects.getActiveDocument();
    if (!doc) {
        UIUtils.alert("Open a document before running Sharp to Sans.");
        return;
    }

    var stats = {
        paragraphStyles: 0,
        characterStyles: 0,
        defaults: 0,
        overrides: 0,
        grepsRemoved: 0,
        grepsKept: 0,
        notes: []
    };

    // Every cut this document will ask for, checked before anything is changed: a weight discovered missing
    // halfway through leaves a document converted in part, which is worse than one not converted at all.
    var needed = collectNeededStyles();
    var missing = [];
    for (var i = 0; i < needed.length; i++) {
        if (!fontFor(needed[i])) missing.push(TARGET_FAMILY + " " + needed[i]);
    }
    if (missing.length) {
        UIUtils.alert(
            "These cuts are not available in InDesign:\n\n  " +
                missing.join("\n  ") +
                "\n\nInstall Alephbeis Sans v2.0 (Design/Fonts/AlephbeisSans/v2.0 on the shared drive), " +
                "or add them as document fonts, then run again."
        );
        return;
    }

    var dlg = new Window("dialog", "Sharp to Sans");
    dlg.orientation = "column";
    dlg.alignChildren = "fill";
    dlg.margins = 16;
    dlg.spacing = 8;

    dlg.add("statictext", undefined, "Replace Alephbeis Sharp, Sharp Sans Display No1 and Sharp Sans");
    dlg.add("statictext", undefined, "with " + TARGET_FAMILY + ", which sets both scripts.");

    var dropGreps = dlg.add("checkbox", undefined, "Remove the GREP styles that switched between the two fonts");
    dropGreps.value = true;

    var buttons = dlg.add("group");
    buttons.alignment = "right";
    buttons.add("button", undefined, "Cancel", { name: "cancel" });
    var runBtn = buttons.add("button", undefined, "Convert", { name: "ok" });

    var proceed = false;
    runBtn.onClick = function () {
        proceed = true;
        dlg.close();
    };
    dlg.show();
    if (!proceed) return;

    var progress = UIUtils.createProgressWindow("Sharp to Sans");

    app.doScript(
        function () {
            // Read before the fonts move: what marks a rule as a script switch is that its character style
            // sets a font of the family being replaced, and the remap is about to erase that evidence.
            if (dropGreps.value) {
                progress.update(10, "Removing the script-switching GREP styles");
                removeScriptSwitchGreps(stats);
            }

            progress.update(35, "Paragraph styles");
            remapStyles(safeElements(doc.allParagraphStyles), stats, "paragraphStyles");

            progress.update(55, "Character styles");
            remapStyles(safeElements(doc.allCharacterStyles), stats, "characterStyles");

            progress.update(70, "Text defaults");
            remapTextDefaults(stats);

            progress.update(85, "Local overrides");
            remapOverrides(stats);

            progress.update(100, "Done");
        },
        ScriptLanguage.JAVASCRIPT,
        undefined,
        UndoModes.ENTIRE_SCRIPT,
        "Sharp to Sans"
    );

    progress.close();
    report(stats);

    /**
     * The InDesign font for one cut of the target family.
     * @param {string} styleName Cut name, e.g. "SemiBold"
     * @returns {Font|null} The font, or null where it is not installed
     */
    function fontFor(styleName) {
        try {
            var f = app.fonts.itemByName(TARGET_FAMILY + "\t" + styleName);
            if (f && f.isValid && f.status === FontStatus.INSTALLED) return f;
        } catch (e) {
            return null;
        }
        return null;
    }

    /**
     * The family of an applied font, whether it arrives as an object or a string.
     * @param {Font|string} appliedFont Value read from a style or text object
     * @returns {string} Family name, or empty where it cannot be read
     */
    function familyName(appliedFont) {
        if (appliedFont === undefined || appliedFont === null) return "";
        try {
            if (typeof appliedFont === "string") return appliedFont.split("\t")[0];
            var fam = appliedFont.fontFamily;
            if (fam) return String(fam);
            return String(appliedFont.name).split("\t")[0];
        } catch (e) {
            return "";
        }
    }

    /**
     * Whether an applied font belongs to the pairing being replaced.
     * @param {Font|string} appliedFont Value read from a style or text object
     * @returns {boolean} True where the family is one of the three
     */
    function isSource(appliedFont) {
        var fam = familyName(appliedFont);
        for (var i = 0; i < SOURCE_FAMILIES.length; i++) {
            if (fam === SOURCE_FAMILIES[i]) return true;
        }
        return false;
    }

    /**
     * Sharp's cut name translated to Sans's.
     * @param {string} name Cut name as the document holds it
     * @returns {string} The matching cut in the target family
     */
    function mapStyle(name) {
        if (!name) return FALLBACK_STYLE;
        var clean = String(name);
        if (Object.prototype.hasOwnProperty.call(STYLE_MAP, clean)) return STYLE_MAP[clean];
        for (var key in STYLE_MAP) {
            if (Object.prototype.hasOwnProperty.call(STYLE_MAP, key) && key.toLowerCase() === clean.toLowerCase()) {
                return STYLE_MAP[key];
            }
        }
        note('Unknown weight "' + clean + '" set to ' + FALLBACK_STYLE + ".");
        return FALLBACK_STYLE;
    }

    /**
     * Every cut of the target family this document is going to ask for.
     * @returns {Array} Cut names
     */
    function collectNeededStyles() {
        var wanted = {};
        var lists = [safeElements(doc.allParagraphStyles), safeElements(doc.allCharacterStyles)];
        for (var l = 0; l < lists.length; l++) {
            for (var i = 0; i < lists[l].length; i++) {
                var st = lists[l][i];
                try {
                    if (!isSource(st.appliedFont)) continue;
                    wanted[mapStyle(st.fontStyle)] = true;
                } catch (e) {
                    // A style that cannot be read cannot be converted either; the remap reports it.
                }
            }
        }
        try {
            var td = doc.textDefaults;
            if (isSource(td.appliedFont)) wanted[mapStyle(td.fontStyle)] = true;
        } catch (e) {
            // Defaults are optional; the remap reports what it cannot reach.
        }

        // Local overrides can name a cut that no style does.
        var fonts = safeElements(app.fonts);
        for (var f = 0; f < fonts.length; f++) {
            try {
                if (!isSource(fonts[f])) continue;
                wanted[mapStyle(fonts[f].fontStyleName)] = true;
            } catch (e) {
                // Skip fonts that will not report a style name.
            }
        }

        var out = [];
        for (var k in wanted) {
            if (Object.prototype.hasOwnProperty.call(wanted, k)) out.push(k);
        }
        if (!out.length) out.push(FALLBACK_STYLE);
        return out;
    }

    /**
     * Remove the GREP styles whose only job was to switch between the two fonts.
     * @param {Object} st Running totals
     * @returns {void}
     */
    function removeScriptSwitchGreps(st) {
        var styles = safeElements(doc.allParagraphStyles);
        for (var i = 0; i < styles.length; i++) {
            var para = styles[i];
            var greps;
            try {
                greps = safeElements(para.nestedGrepStyles);
            } catch (e) {
                continue;
            }
            // Backwards, because removing one re-indexes the rest.
            for (var g = greps.length - 1; g >= 0; g--) {
                var rule = greps[g];
                var cs = null;
                try {
                    cs = rule.appliedCharacterStyle;
                } catch (e) {
                    continue;
                }
                if (!setsSourceFont(cs)) {
                    st.grepsKept++;
                    continue;
                }
                try {
                    var where = safeName(para);
                    var what = String(rule.grepExpression);
                    rule.remove();
                    st.grepsRemoved++;
                    note("Removed from " + where + ": " + what);
                } catch (e) {
                    note("Could not remove a GREP style on " + safeName(para) + ": " + e);
                }
            }
        }
    }

    /**
     * Whether a character style sets one of the fonts being replaced.
     * @param {CharacterStyle} cs Style applied by a GREP rule
     * @returns {boolean} True where it sets a font of the pairing
     */
    function setsSourceFont(cs) {
        if (!cs) return false;
        try {
            // [None] and [No character style] set nothing at all.
            if (String(cs.name).indexOf("$ID/") === 0) return false;
            return isSource(cs.appliedFont);
        } catch (e) {
            return false;
        }
    }

    /**
     * Point every style using the pairing at the matching cut of the target family.
     * @param {Array} styles Paragraph or character styles
     * @param {Object} st Running totals
     * @param {string} counter Which total to raise
     * @returns {void}
     */
    function remapStyles(styles, st, counter) {
        for (var i = 0; i < styles.length; i++) {
            var style = styles[i];
            try {
                if (!isSource(style.appliedFont)) continue;
                var want = mapStyle(style.fontStyle);
                var font = fontFor(want);
                if (!font) {
                    note("No " + TARGET_FAMILY + " " + want + " for style " + safeName(style));
                    continue;
                }
                style.appliedFont = font;
                style.fontStyle = want;
                st[counter]++;
            } catch (e) {
                note("Style " + safeName(style) + ": " + e);
            }
        }
    }

    /**
     * The document's own text defaults, which no style covers.
     * @param {Object} st Running totals
     * @returns {void}
     */
    function remapTextDefaults(st) {
        try {
            var td = doc.textDefaults;
            if (!isSource(td.appliedFont)) return;
            var want = mapStyle(td.fontStyle);
            var font = fontFor(want);
            if (!font) return;
            td.appliedFont = font;
            td.fontStyle = want;
            st.defaults++;
        } catch (e) {
            note("Text defaults: " + e);
        }
    }

    /**
     * Sweep local overrides, one cut at a time.
     *
     * Per cut rather than per family because the style name has to be mapped, and find/change carries the
     * font across as a single value: asking for the family alone would land every weight on one cut.
     * @param {Object} st Running totals
     * @returns {void}
     */
    function remapOverrides(st) {
        var fonts = safeElements(app.fonts);
        for (var f = 0; f < fonts.length; f++) {
            var from = fonts[f];
            if (!isSource(from)) continue;

            var want, to;
            try {
                want = mapStyle(from.fontStyleName);
                to = fontFor(want);
            } catch (e) {
                continue;
            }
            if (!to) continue;

            try {
                app.findTextPreferences = NothingEnum.NOTHING;
                app.changeTextPreferences = NothingEnum.NOTHING;
                app.findTextPreferences.appliedFont = from;
                app.changeTextPreferences.appliedFont = to;
                var found = doc.changeText();
                if (found && found.length) st.overrides += found.length;
            } catch (e) {
                note("Overrides in " + familyName(from) + " " + want + ": " + e);
            } finally {
                app.findTextPreferences = NothingEnum.NOTHING;
                app.changeTextPreferences = NothingEnum.NOTHING;
            }
        }
    }

    /**
     * A collection as a plain array, empty where it cannot be read.
     * @param {Object} collection InDesign collection
     * @returns {Array} Its elements
     */
    function safeElements(collection) {
        try {
            return collection.everyItem().getElements();
        } catch (e) {
            return [];
        }
    }

    /**
     * An object's name, for a message.
     * @param {Object} o Any InDesign object
     * @returns {string} Its name, or a placeholder
     */
    function safeName(o) {
        try {
            return String(o.name);
        } catch (e) {
            return "(unnamed)";
        }
    }

    /**
     * Record something the operator should see afterwards.
     * @param {string} message What happened
     * @returns {void}
     */
    function note(message) {
        if (stats.notes.length < 40) stats.notes.push(message);
    }

    /**
     * Show what changed, and anything that could not.
     * @param {Object} st Running totals
     * @returns {void}
     */
    function report(st) {
        var lines = [];
        lines.push("Converted to " + TARGET_FAMILY + ".");
        lines.push("");
        lines.push("  paragraph styles   " + st.paragraphStyles);
        lines.push("  character styles   " + st.characterStyles);
        lines.push("  text defaults      " + st.defaults);
        lines.push("  local overrides    " + st.overrides);
        if (dropGreps.value) {
            lines.push("");
            lines.push("  GREP styles removed " + st.grepsRemoved);
            lines.push("  GREP styles kept    " + st.grepsKept + " (they do something else)");
        }
        if (st.notes.length) {
            lines.push("");
            lines.push("Notes");
            for (var i = 0; i < st.notes.length; i++) lines.push("  " + st.notes[i]);
        }
        UIUtils.showMessage("Sharp to Sans", lines.join("\n"));
    }
})();
