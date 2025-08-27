/**
 * UnusedStylesManager.jsx — Mode dropdown + folder path column
 * Default mode: "Has no usage at all"
 * Robust delete: uses replacement style so removal always succeeds.
 * ES3-safe; tolerant to find options across builds.
 */

/* global FindChange, UIUtils */
(function () {
    // Load shared utilities
    try {
        var scriptInfo = (function () {
            var scriptFile = File($.fileName);
            return { folder: scriptFile.parent };
        })();
        var utilsFile = File(scriptInfo.folder.parent + "/Shared/InDesignUtils.jsx");
        if (utilsFile.exists) $.evalFile(utilsFile);

        // Load Find/Change utilities explicitly
        var findChangeFile = File(scriptInfo.folder.parent + "/Shared/FindChangeUtils.jsx");
        if (findChangeFile.exists) $.evalFile(findChangeFile);

        // Load UI utilities explicitly (needed for Details and alerts)
        var uiUtilsFile = File(scriptInfo.folder.parent + "/Shared/UIUtils.jsx");
        if (uiUtilsFile.exists) $.evalFile(uiUtilsFile);
    } catch (e) {
        try {
            UIUtils.alert("Could not load shared utilities: " + e);
        } catch (_) {
            alert("Could not load shared utilities: " + e);
        }
        return;
    }

    var doc = InDesignUtils.Objects.getActiveDocument();
    if (!doc) {
        UIUtils.alert("Open a document first.");
        return;
    }

    // Simplified utility functions using shared utilities directly
    var isValid = InDesignUtils.Error.isValid;
    var safeName = function (o) {
        return InDesignUtils.Error.safe(
            function () {
                return o.name;
            },
            "(unknown)",
            true
        );
    };

    function isBuiltInStyle(s) {
        if (!isValid(s)) return false;
        var n = safeName(s);
        return n && n.length >= 2 && n.charAt(0) === "[" && n.charAt(n.length - 1) === "]";
    }
    var isBuiltInParagraphStyle = isBuiltInStyle;
    var isBuiltInCharacterStyle = isBuiltInStyle;
    var isBuiltInObjectStyle = isBuiltInStyle;
    var isBuiltInTableStyle = isBuiltInStyle;
    var isBuiltInCellStyle = isBuiltInStyle;
    function addDep(map, id, text) {
        if (!id) return;
        if (!map[id]) map[id] = [];
        map[id].push(text);
    }

    function stylePath(s) {
        var parts = [],
            p;
        try {
            p = s.parent;
        } catch (_e0) {
            p = null;
        }
        while (p && p.isValid && p !== doc) {
            try {
                if (p.name) parts.push(p.name);
            } catch (_e1) {}
            try {
                p = p.parent;
            } catch (_e2) {
                break;
            }
        }
        if (parts.length === 0) return "(root)";
        var out = [],
            i;
        for (i = parts.length - 1; i >= 0; i--) out.push(parts[i]);
        return out.join(" / ");
    }

    // Safe replacement styles for delete(): prefer "None" variants to preserve formatting
    function replacementFor(kind) {
        function findByNames(coll, names) {
            for (var i = 0; i < names.length; i++) {
                var name = names[i];
                var style = InDesignUtils.Error.safe(
                    function () {
                        var s = coll.itemByName(name);
                        return isValid(s) ? s : null;
                    },
                    null,
                    true
                );
                if (style) return style;
            }
            return InDesignUtils.Error.safe(
                function () {
                    return coll.length > 0 ? coll[0] : null;
                },
                null,
                true
            );
        }
        var collections = {
            Paragraph: [doc.paragraphStyles, ["[No Paragraph Style]", "[Basic Paragraph]", "[Basic Paragraph Style]"]],
            Character: [doc.characterStyles, ["[None]"]],
            Object: [doc.objectStyles, ["[None]"]],
            Table: [doc.tableStyles, ["[None]", "[Basic Table]"]],
            Cell: [doc.cellStyles, ["[None]"]]
        };
        var config = collections[kind];
        return config ? findByNames(config[0], config[1]) : null;
    }

    // Collectors (fallback when all* APIs not present)
    function getAllStyles(kind) {
        try {
            if (kind === "para" && doc.allParagraphStyles) return doc.allParagraphStyles.everyItem().getElements();
            if (kind === "char" && doc.allCharacterStyles) return doc.allCharacterStyles.everyItem().getElements();
            if (kind === "obj" && doc.allObjectStyles) return doc.allObjectStyles.everyItem().getElements();
            if (kind === "table" && doc.allTableStyles) return doc.allTableStyles.everyItem().getElements();
            if (kind === "cell" && doc.allCellStyles) return doc.allCellStyles.everyItem().getElements();
        } catch (e) {}
        var out = [],
            i;
        if (kind === "para") {
            for (i = 0; i < doc.paragraphStyles.length; i++) out.push(doc.paragraphStyles[i]);
            function walkPSG(g) {
                var si, gi;
                try {
                    for (si = 0; si < g.paragraphStyles.length; si++) out.push(g.paragraphStyles[si]);
                    for (gi = 0; gi < g.paragraphStyleGroups.length; gi++) walkPSG(g.paragraphStyleGroups[gi]);
                } catch (_e1) {}
            }
            for (i = 0; i < doc.paragraphStyleGroups.length; i++) walkPSG(doc.paragraphStyleGroups[i]);
            return out;
        }
        if (kind === "char") {
            for (i = 0; i < doc.characterStyles.length; i++) out.push(doc.characterStyles[i]);
            function walkCSG(g) {
                var si, gi;
                try {
                    for (si = 0; si < g.characterStyles.length; si++) out.push(g.characterStyles[si]);
                    for (gi = 0; gi < g.characterStyleGroups.length; gi++) walkCSG(g.characterStyleGroups[gi]);
                } catch (_e2) {}
            }
            for (i = 0; i < doc.characterStyleGroups.length; i++) walkCSG(doc.characterStyleGroups[i]);
            return out;
        }
        if (kind === "obj") {
            for (i = 0; i < doc.objectStyles.length; i++) out.push(doc.objectStyles[i]);
            function walkOSG(g) {
                var si, gi;
                try {
                    for (si = 0; si < g.objectStyles.length; si++) out.push(g.objectStyles[si]);
                    for (gi = 0; gi < g.objectStyleGroups.length; gi++) walkOSG(g.objectStyleGroups[gi]);
                } catch (_e3) {}
            }
            for (i = 0; i < doc.objectStyleGroups.length; i++) walkOSG(doc.objectStyleGroups[i]);
            return out;
        }
        if (kind === "table") {
            for (i = 0; i < doc.tableStyles.length; i++) out.push(doc.tableStyles[i]);
            function walkTSG(g) {
                var si, gi;
                try {
                    for (si = 0; si < g.tableStyles.length; si++) out.push(g.tableStyles[si]);
                    for (gi = 0; gi < g.tableStyleGroups.length; gi++) walkTSG(g.tableStyleGroups[gi]);
                } catch (_e4) {}
            }
            for (i = 0; i < doc.tableStyleGroups.length; i++) walkTSG(doc.tableStyleGroups[i]);
            return out;
        }
        if (kind === "cell") {
            for (i = 0; i < doc.cellStyles.length; i++) out.push(doc.cellStyles[i]);
            function walkCSLG(g) {
                var si, gi;
                try {
                    for (si = 0; si < g.cellStyles.length; si++) out.push(g.cellStyles[si]);
                    for (gi = 0; gi < g.cellStyleGroups.length; gi++) walkCSLG(g.cellStyleGroups[gi]);
                } catch (_e5) {}
            }
            for (i = 0; i < doc.cellStyleGroups.length; i++) walkCSLG(doc.cellStyleGroups[i]);
            return out;
        }
        return out;
    }

    // Helper: lean master-page aware style usage check using shared FindChange utils
    function _hasStyleOnMasterPages(style, kind) {
        // kind: "para" or "char"
        if (!isValid(style)) return false;

        var foundOnScope = false;
        try {
            FindChange.withFindChange(
                "text",
                {
                    includeMasterPages: true,
                    includeHiddenLayers: true,
                    includeLockedLayersForFind: true,
                    includeLockedStoriesForFind: true,
                    includeFootnotes: true
                },
                function () {
                    // Reset and apply the style to appropriate find preference
                    try {
                        app.findTextPreferences = NothingEnum.nothing;
                    } catch (_r0) {}

                    if (kind === "para") {
                        try {
                            app.findTextPreferences.appliedParagraphStyle = style;
                        } catch (e4) {}
                    } else if (kind === "char") {
                        try {
                            app.findTextPreferences.appliedCharacterStyle = style;
                        } catch (e5) {}
                    }

                    var hits = [];
                    try {
                        hits = doc.findText();
                    } catch (e) {
                        hits = [];
                    }
                    foundOnScope = hits && hits.length > 0;
                    return foundOnScope;
                }
            );
        } catch (_e) {}
        return foundOnScope;
    }

    // -------- scan: build direct + indirect + dependency notes --------
    function scanDocument() {
        return FindChange.withCleanPrefs(
            function () {
                var usedD = { para: {}, charS: {}, obj: {}, table: {}, cell: {} }; // direct
                var usedI = { para: {}, charS: {}, obj: {}, table: {}, cell: {} }; // indirect
                var deps = { para: {}, charS: {}, obj: {}, table: {}, cell: {} }; // notes

                // Paragraph (direct via find)
                var allP = getAllStyles("para");
                var P = [],
                    i;
                for (i = 0; i < allP.length; i++) if (!isBuiltInParagraphStyle(allP[i])) P.push(allP[i]);
                for (i = 0; i < P.length; i++) {
                    var ps = P[i];
                    try {
                        if (_hasStyleOnMasterPages(ps, "para")) {
                            usedD.para[ps.id] = true;
                            addDep(deps.para, ps.id, "Direct usage found (including master pages)");
                        }
                    } catch (_eP) {}
                }

                // Paragraph (indirect: Based On / Next Style / TOC)
                for (i = 0; i < P.length; i++) {
                    var p = P[i],
                        b,
                        nx;
                    try {
                        b = p.basedOn;
                        if (b && b.isValid && b.id !== p.id) {
                            usedI.para[b.id] = true;
                            addDep(deps.para, b.id, "Referenced as 'Based On' by '" + safeName(p) + "'");
                        }
                    } catch (_b) {}
                    try {
                        nx = p.nextStyle;
                        if (nx && nx.isValid && nx.id !== p.id) {
                            usedI.para[nx.id] = true;
                            addDep(deps.para, nx.id, "Referenced as 'Next Style' by '" + safeName(p) + "'");
                        }
                    } catch (_n) {}
                }
                try {
                    var tocs = doc.tocStyles ? doc.tocStyles.everyItem().getElements() : [];
                    var t, ents, e, aps, acs, toc;
                    for (t = 0; t < tocs.length; t++) {
                        toc = tocs[t];
                        try {
                            ents = toc.tocStyleEntries ? toc.tocStyleEntries.everyItem().getElements() : [];
                            for (e = 0; e < ents.length; e++) {
                                try {
                                    aps = ents[e].appliedParagraphStyle || ents[e].formatStyle;
                                    if (aps && aps.isValid) {
                                        usedI.para[aps.id] = true;
                                        addDep(deps.para, aps.id, "Referenced by TOC style '" + safeName(toc) + "'");
                                    }
                                } catch (_eTE) {}
                                try {
                                    acs = ents[e].appliedCharacterStyle;
                                    if (acs && acs.isValid && acs.name !== "[None]") {
                                        usedI.charS[acs.id] = true;
                                        addDep(deps.charS, acs.id, "Referenced by TOC style '" + safeName(toc) + "'");
                                    }
                                } catch (_eTCE) {}
                            }
                        } catch (_eT) {}
                    }
                } catch (_eTOC) {}

                // Character (direct via find)
                var allC = getAllStyles("char");
                var C = [],
                    ci;
                for (ci = 0; ci < allC.length; ci++) if (!isBuiltInCharacterStyle(allC[ci])) C.push(allC[ci]);
                for (ci = 0; ci < C.length; ci++) {
                    var cs = C[ci];
                    try {
                        if (_hasStyleOnMasterPages(cs, "char")) {
                            usedD.charS[cs.id] = true;
                            addDep(deps.charS, cs.id, "Direct usage found (including master pages)");
                        }
                    } catch (_eC) {}
                }

                // Character (indirect via paragraph automations)
                for (i = 0; i < P.length; i++) {
                    var pr = P[i],
                        g,
                        n,
                        l;
                    try {
                        var gstyles = pr.nestedGrepStyles ? pr.nestedGrepStyles.everyItem().getElements() : [];
                        for (g = 0; g < gstyles.length; g++) {
                            try {
                                var gcs = gstyles[g].appliedCharacterStyle;
                                if (gcs && gcs.isValid && gcs.name !== "[None]") {
                                    usedI.charS[gcs.id] = true;
                                    addDep(deps.charS, gcs.id, "Referenced by GREP style in '" + safeName(pr) + "'");
                                }
                            } catch (_e1) {}
                        }
                    } catch (_eG) {}
                    try {
                        var nstyles = pr.nestedStyles ? pr.nestedStyles.everyItem().getElements() : [];
                        for (n = 0; n < nstyles.length; n++) {
                            try {
                                var ncs = nstyles[n].appliedCharacterStyle;
                                if (ncs && ncs.isValid && ncs.name !== "[None]") {
                                    usedI.charS[ncs.id] = true;
                                    addDep(deps.charS, ncs.id, "Referenced by Nested style in '" + safeName(pr) + "'");
                                }
                            } catch (_e2) {}
                        }
                    } catch (_eN2) {}
                    try {
                        var lstyles = pr.nestedLineStyles ? pr.nestedLineStyles.everyItem().getElements() : [];
                        for (l = 0; l < lstyles.length; l++) {
                            try {
                                var lcs = lstyles[l].appliedCharacterStyle;
                                if (lcs && lcs.isValid && lcs.name !== "[None]") {
                                    usedI.charS[lcs.id] = true;
                                    addDep(deps.charS, lcs.id, "Referenced by Line style in '" + safeName(pr) + "'");
                                }
                            } catch (_e3) {}
                        }
                    } catch (_eL) {}
                    try {
                        var dcs = pr.dropCapStyle;
                        if (dcs && dcs.isValid && dcs.name !== "[None]") {
                            usedI.charS[dcs.id] = true;
                            addDep(deps.charS, dcs.id, "Referenced by Drop Caps in '" + safeName(pr) + "'");
                        }
                    } catch (_eDC) {}
                    try {
                        var bcs =
                            pr.bulletCharacterStyle ||
                            pr.bulletsCharacterStyle ||
                            (pr.bulletsAndNumberingTextDefault
                                ? pr.bulletsAndNumberingTextDefault.characterStyle
                                : null);
                        if (bcs && bcs.isValid && bcs.name !== "[None]") {
                            usedI.charS[bcs.id] = true;
                            addDep(
                                deps.charS,
                                bcs.id,
                                "Referenced by Bullets character style in '" + safeName(pr) + "'"
                            );
                        }
                    } catch (_eB) {}
                    try {
                        var ncs2 =
                            pr.numberingCharacterStyle ||
                            (pr.bulletsAndNumberingTextDefault
                                ? pr.bulletsAndNumberingTextDefault.numberingCharacterStyle
                                : null);
                        if (ncs2 && ncs2.isValid && ncs2.name !== "[None]") {
                            usedI.charS[ncs2.id] = true;
                            addDep(
                                deps.charS,
                                ncs2.id,
                                "Referenced by Numbering character style in '" + safeName(pr) + "'"
                            );
                        }
                    } catch (_eNC) {}
                }

                // Character (indirect: Based On)
                try {
                    for (ci = 0; ci < C.length; ci++) {
                        var csty = C[ci];
                        try {
                            var cb = csty.basedOn;
                            if (cb && cb.isValid && cb.id !== csty.id) {
                                usedI.charS[cb.id] = true;
                                addDep(deps.charS, cb.id, "Referenced as 'Based On' by '" + safeName(csty) + "'");
                            }
                        } catch (_cbo) {}
                    }
                } catch (_eCBO) {}

                // Object (direct: include items inside Groups)
                try {
                    var items = [],
                        m,
                        seenMap = {};
                    try {
                        items = items.concat(doc.pageItems.everyItem().getElements());
                    } catch (_eo1) {}
                    try {
                        var ms = doc.masterSpreads ? doc.masterSpreads.everyItem().getElements() : [];
                        for (m = 0; m < ms.length; m++) {
                            try {
                                items = items.concat(ms[m].pageItems.everyItem().getElements());
                            } catch (_eo2) {}
                        }
                        // Also seed master spread groups explicitly
                        for (m = 0; m < ms.length; m++) {
                            try {
                                items = items.concat(ms[m].groups ? ms[m].groups.everyItem().getElements() : []);
                            } catch (_eomg) {}
                        }
                    } catch (_eoM) {}
                    // Seed with groups explicitly (some builds don't expose groups via pageItems)
                    try {
                        items = items.concat(doc.groups ? doc.groups.everyItem().getElements() : []);
                    } catch (_eog) {}
                    // Seed with groups on spreads as well
                    try {
                        var sps = doc.spreads ? doc.spreads.everyItem().getElements() : [];
                        var si;
                        for (si = 0; si < sps.length; si++) {
                            try {
                                items = items.concat(sps[si].groups ? sps[si].groups.everyItem().getElements() : []);
                            } catch (_eosg) {}
                        }
                    } catch (_eoS) {}
                    function __markOS(it) {
                        try {
                            var os = it.appliedObjectStyle;
                            if (os && os.isValid) {
                                usedD.obj[os.id] = true;
                                addDep(deps.obj, os.id, "Applied to a page item");
                            }
                        } catch (_eos) {}
                    }
                    function __scanItem(it) {
                        if (!it || !it.isValid) return;
                        try {
                            var sid = it.id;
                            if (sid && seenMap[sid]) return;
                            if (sid) seenMap[sid] = 1;
                        } catch (_eid) {}
                        __markOS(it);
                        // Dive into group members if available
                        var members = [],
                            k,
                            tmp;
                        try {
                            if (it.allPageItems && it.allPageItems.everyItem) {
                                tmp = it.allPageItems.everyItem().getElements();
                                if (tmp && tmp.length) members = members.concat(tmp);
                            }
                        } catch (_eg1) {}
                        try {
                            if (it.pageItems && it.pageItems.everyItem) {
                                tmp = it.pageItems.everyItem().getElements();
                                if (tmp && tmp.length) members = members.concat(tmp);
                            }
                        } catch (_eg2) {}
                        try {
                            if (it.groups && it.groups.everyItem) {
                                tmp = it.groups.everyItem().getElements();
                                if (tmp && tmp.length) members = members.concat(tmp);
                            }
                        } catch (_eg3) {}
                        for (k = 0; k < members.length; k++) {
                            try {
                                __scanItem(members[k]);
                            } catch (_erg) {}
                        }
                    }
                    var i2;
                    for (i2 = 0; i2 < items.length; i2++) {
                        __scanItem(items[i2]);
                    }
                } catch (_eo) {}

                // Object (indirect: Based On)
                try {
                    var allO = getAllStyles("obj");
                    var oi;
                    for (oi = 0; oi < allO.length; oi++) {
                        var osty = allO[oi];
                        try {
                            var ob = osty.basedOn;
                            if (ob && ob.isValid && ob.id !== osty.id) {
                                usedI.obj[ob.id] = true;
                                addDep(deps.obj, ob.id, "Referenced as 'Based On' by '" + safeName(osty) + "'");
                            }
                        } catch (_obo) {}
                    }
                } catch (_eOBO) {}

                // Table/Cell (direct only)
                try {
                    var stories = [];
                    try {
                        stories = doc.stories.everyItem().getElements();
                    } catch (_eSt) {}
                    var s, tb, c;
                    for (s = 0; s < stories.length; s++) {
                        var tables = [];
                        try {
                            tables = stories[s].tables.everyItem().getElements();
                        } catch (_eT) {}
                        for (tb = 0; tb < tables.length; tb++) {
                            try {
                                var ts = tables[tb].appliedTableStyle;
                                if (ts && ts.isValid) {
                                    usedD.table[ts.id] = true;
                                    addDep(deps.table, ts.id, "Applied to a table");
                                }
                            } catch (_eTS) {}
                            var cells = [];
                            try {
                                cells = tables[tb].cells.everyItem().getElements();
                            } catch (_eC2) {}
                            for (c = 0; c < cells.length; c++) {
                                try {
                                    var cs2 = cells[c].appliedCellStyle;
                                    if (cs2 && cs2.isValid) {
                                        usedD.cell[cs2.id] = true;
                                        addDep(deps.cell, cs2.id, "Applied to a cell");
                                    }
                                } catch (_eCe) {}
                            }
                        }
                    }
                } catch (_eTab) {}

                // Table (indirect: Based On)
                try {
                    var allT = getAllStyles("table");
                    var ti;
                    for (ti = 0; ti < allT.length; ti++) {
                        var tsty = allT[ti];
                        try {
                            var tbBase = tsty.basedOn;
                            if (tbBase && tbBase.isValid && tbBase.id !== tsty.id) {
                                usedI.table[tbBase.id] = true;
                                addDep(deps.table, tbBase.id, "Referenced as 'Based On' by '" + safeName(tsty) + "'");
                            }
                        } catch (_tbo) {}
                    }
                } catch (_eTBO) {}

                // Cell (indirect: Based On)
                try {
                    var allCell = getAllStyles("cell");
                    var ci2;
                    for (ci2 = 0; ci2 < allCell.length; ci2++) {
                        var celsty = allCell[ci2];
                        try {
                            var cb2 = celsty.basedOn;
                            if (cb2 && cb2.isValid && cb2.id !== celsty.id) {
                                usedI.cell[cb2.id] = true;
                                addDep(deps.cell, cb2.id, "Referenced as 'Based On' by '" + safeName(celsty) + "'");
                            }
                        } catch (_cbo2) {}
                    }
                } catch (_eCBO2) {}

                function filterBuiltins(arr, isBI) {
                    var out = [],
                        i;
                    for (i = 0; i < arr.length; i++) if (!isBI(arr[i])) out.push(arr[i]);
                    return out;
                }

                return {
                    lists: {
                        para: filterBuiltins(getAllStyles("para"), isBuiltInParagraphStyle),
                        charS: filterBuiltins(getAllStyles("char"), isBuiltInCharacterStyle),
                        obj: filterBuiltins(getAllStyles("obj"), isBuiltInObjectStyle),
                        table: filterBuiltins(getAllStyles("table"), isBuiltInTableStyle),
                        cell: filterBuiltins(getAllStyles("cell"), isBuiltInCellStyle)
                    },
                    usedDirect: usedD,
                    usedIndirect: usedI,
                    deps: deps
                };
            },
            undefined,
            { inclusive: true }
        );
    }

    // Compute lists per mode:
    // "noDirectButIndirect"  → !direct &&  indirect
    // "noUsageAtAll"         → !direct && !indirect
    // "bothSets"             → !direct
    function computeUnused(scan, mode) {
        function filter(arr, usedD, usedI) {
            var out = [],
                i,
                s,
                id,
                d,
                ind;
            for (i = 0; i < arr.length; i++) {
                s = arr[i];
                if (!s || !s.isValid) continue;
                id = s.id;
                d = usedD[id] === true;
                ind = usedI[id] === true;
                if (mode === "noDirectButIndirect") {
                    if (!d && ind) out.push(s);
                } else if (mode === "noUsageAtAll") {
                    if (!d && !ind) out.push(s);
                } /* bothSets */ else {
                    if (!d) out.push(s);
                }
            }
            return out;
        }
        return {
            para: filter(scan.lists.para, scan.usedDirect.para, scan.usedIndirect.para),
            charS: filter(scan.lists.charS, scan.usedDirect.charS, scan.usedIndirect.charS),
            obj: filter(scan.lists.obj, scan.usedDirect.obj, scan.usedIndirect.obj),
            table: filter(scan.lists.table, scan.usedDirect.table, scan.usedIndirect.table),
            cell: filter(scan.lists.cell, scan.usedDirect.cell, scan.usedIndirect.cell)
        };
    }

    // ---- group utilities ----
    function collectEmptyGroups() {
        function walkGroups(rootColl, kind) {
            var result = [];
            function childGroups(g) {
                try {
                    if (kind === "Paragraph") return g.paragraphStyleGroups.everyItem().getElements();
                    if (kind === "Character") return g.characterStyleGroups.everyItem().getElements();
                    if (kind === "Object") return g.objectStyleGroups.everyItem().getElements();
                    if (kind === "Table") return g.tableStyleGroups.everyItem().getElements();
                    if (kind === "Cell") return g.cellStyleGroups.everyItem().getElements();
                } catch (_e2) {}
                return [];
            }
            function hasOwnStyles(g) {
                try {
                    if (kind === "Paragraph") return g.paragraphStyles.length > 0;
                    if (kind === "Character") return g.characterStyles.length > 0;
                    if (kind === "Object") return g.objectStyles.length > 0;
                    if (kind === "Table") return g.tableStyles.length > 0;
                    if (kind === "Cell") return g.cellStyles.length > 0;
                } catch (_e) {}
                return false;
            }
            function walkAndMark(g) {
                if (!g || !g.isValid) return false;
                var subs = [],
                    i,
                    allSubsEmpty = true;
                try {
                    subs = childGroups(g);
                } catch (_e4) {}
                for (i = 0; i < subs.length; i++) {
                    var subEmpty = walkAndMark(subs[i]);
                    if (!subEmpty) allSubsEmpty = false;
                }
                var ownHas = hasOwnStyles(g);
                var isEmptyDeep = !ownHas && allSubsEmpty && subs.length >= 0; // if no styles and all children empty
                if (isEmptyDeep) {
                    try {
                        result.push(g);
                    } catch (_eP) {}
                }
                return isEmptyDeep;
            }
            try {
                var i,
                    arr = rootColl.everyItem ? rootColl.everyItem().getElements() : [];
                for (i = 0; i < arr.length; i++) walkAndMark(arr[i]);
            } catch (_e5) {}
            return result;
        }
        return {
            para: walkGroups(doc.paragraphStyleGroups, "Paragraph"),
            charS: walkGroups(doc.characterStyleGroups, "Character"),
            obj: walkGroups(doc.objectStyleGroups, "Object"),
            table: walkGroups(doc.tableStyleGroups, "Table"),
            cell: walkGroups(doc.cellStyleGroups, "Cell")
        };
    }

    // ---- run once, then UI ----
    var scan = scanDocument();
    var emptyGroups = collectEmptyGroups();

    var modeMap = ["noDirectButIndirect", "noUsageAtAll", "bothSets"];
    var modeNames = ["Has no direct usage", "Has no usage at all", "Both of the above"];
    var mode = "noUsageAtAll"; // <<< default as requested
    var unused = computeUnused(scan, mode);

    // Main UI
    var w = new Window("dialog", "Unused Styles Manager");
    w.alignChildren = "fill";
    w.margins = 16;
    w.spacing = 12;

    // Layout: left column with type radios; right panel with mode + list + buttons
    var main = w.add("group");
    main.orientation = "row";
    main.alignChildren = "fill";

    // Left type filter column (radio buttons)
    var typeCol = main.add("panel", undefined, "Type");
    typeCol.orientation = "column";
    typeCol.alignChildren = "left";
    typeCol.margins = 12;
    typeCol.spacing = 8;
    var rbAll = typeCol.add("radiobutton", undefined, "All");
    var rbParagraph = typeCol.add("radiobutton", undefined, "Paragraph");
    var rbCharacter = typeCol.add("radiobutton", undefined, "Character");
    var rbObject = typeCol.add("radiobutton", undefined, "Object");
    var rbTable = typeCol.add("radiobutton", undefined, "Table");
    var rbCell = typeCol.add("radiobutton", undefined, "Cell");
    rbAll.value = true; // default selection

    // Right side panel
    var right = main.add("group");
    right.orientation = "column";
    right.alignChildren = "fill";

    var hdr = right.add("group");
    hdr.add("statictext", undefined, "Mode:");
    var modeDD = hdr.add("dropdownlist", undefined, modeNames);
    modeDD.selection = 1; // default "no usage at all"

    // Columns list
    var list = right.add("listbox", [0, 0, 704, 384], "", {
        multiselect: true,
        numberOfColumns: 3,
        showHeaders: true,
        columnTitles: ["Type", "Style", "Folder"],
        columnWidths: [152, 240, 240]
    });

    var btns = right.add("group");
    btns.alignment = "right";
    var detailsBtn = btns.add("button", undefined, "Details…");
    var delBtn = btns.add("button", undefined, "Delete Selected");
    var closeBtn = btns.add("button", undefined, "Close", { name: "ok" });

    function currentArr(kind) {
        if (kind === "Paragraph") return unused.para;
        if (kind === "Character") return unused.charS;
        if (kind === "Object") return unused.obj;
        if (kind === "Table") return unused.table;
        if (kind === "Cell") return unused.cell;
        return [];
    }

    function currentEmptyGroups(kind) {
        if (kind === "Paragraph") return emptyGroups.para;
        if (kind === "Character") return emptyGroups.charS;
        if (kind === "Object") return emptyGroups.obj;
        if (kind === "Table") return emptyGroups.table;
        if (kind === "Cell") return emptyGroups.cell;
        return [];
    }

    function getSelectedType() {
        try {
            if (rbAll.value) return "All";
            if (rbParagraph.value) return "Paragraph";
            if (rbCharacter.value) return "Character";
            if (rbObject.value) return "Object";
            if (rbTable.value) return "Table";
            if (rbCell.value) return "Cell";
        } catch (_eRST) {}
        return "All";
    }

    function fillList() {
        list.removeAll();
        var selType = getSelectedType();
        var kindsOrder = ["Paragraph", "Character", "Object", "Table", "Cell"];
        function addItem(kind, s) {
            var it = list.add("item", kind);
            try {
                it.subItems[0].text = safeName(s);
            } catch (_e1) {}
            try {
                it.subItems[1].text = stylePath(s);
            } catch (_e2) {}
            it._ref = s;
            it._kind = kind;
        }
        function addGroupItem(kind, g) {
            var label = kind + " Folder (Empty)";
            var it = list.add("item", label);
            try {
                it.subItems[0].text = safeName(g);
            } catch (_eg1) {}
            try {
                it.subItems[1].text = stylePath(g);
            } catch (_eg2) {}
            it._ref = g;
            it._kind = kind; // base kind without "Folder"
            it._isGroup = true;
        }
        var i, s, arr, k, grs, gi;
        if (selType === "All") {
            for (k = 0; k < kindsOrder.length; k++) {
                var kind = kindsOrder[k];
                arr = currentArr(kind);
                for (i = 0; i < arr.length; i++) {
                    s = arr[i];
                    addItem(kind, s);
                }
                // Append empty folders for this kind
                grs = currentEmptyGroups(kind);
                for (gi = 0; gi < grs.length; gi++) addGroupItem(kind, grs[gi]);
            }
        } else {
            arr = currentArr(selType);
            for (i = 0; i < arr.length; i++) {
                s = arr[i];
                addItem(selType, s);
            }
            // Append empty folders for the selected kind
            grs = currentEmptyGroups(selType);
            for (gi = 0; gi < grs.length; gi++) addGroupItem(selType, grs[gi]);
        }
    }

    // Type selection via radio buttons
    rbAll.onClick = fillList;
    rbParagraph.onClick = fillList;
    rbCharacter.onClick = fillList;
    rbObject.onClick = fillList;
    rbTable.onClick = fillList;
    rbCell.onClick = fillList;

    modeDD.onChange = function () {
        var idx = modeDD.selection.index;
        mode = modeMap[idx];
        unused = computeUnused(scan, mode);
        // Empty folders are independent of mode, but refresh in case the user deleted items
        emptyGroups = collectEmptyGroups();
        fillList();
    };

    function depsForStyle(s) {
        var id = s.id,
            lines = [];
        if (scan.deps.para[id]) lines = lines.concat(scan.deps.para[id]);
        if (scan.deps.charS[id]) lines = lines.concat(scan.deps.charS[id]);
        if (scan.deps.obj[id]) lines = lines.concat(scan.deps.obj[id]);
        if (scan.deps.table[id]) lines = lines.concat(scan.deps.table[id]);
        if (scan.deps.cell[id]) lines = lines.concat(scan.deps.cell[id]);
        return lines;
    }

    function canDelete(kind, s) {
        if (kind === "Paragraph") return !isBuiltInParagraphStyle(s);
        if (kind === "Character") return !isBuiltInCharacterStyle(s);
        if (kind === "Object") return !isBuiltInObjectStyle(s);
        if (kind === "Table") return !isBuiltInTableStyle(s);
        if (kind === "Cell") return !isBuiltInCellStyle(s);
        return true;
    }

    detailsBtn.onClick = function () {
        if (!list.selection || list.selection.length === 0) {
            UIUtils.alert("Select an item first.");
            return;
        }
        var sel = list.selection[0];
        var s = sel._ref;
        if (sel._isGroup) {
            var msgG =
                "Folder: " +
                safeName(s) +
                "\rParent: " +
                stylePath(s) +
                "\r\rThis folder is empty (no styles and no subfolders).";
            UIUtils.alert(msgG);
            return;
        }
        var d = depsForStyle(s);
        var msg = "Style: " + safeName(s) + "\rGroup: " + stylePath(s) + "\r\r";
        if (!d.length) msg += "(No dependencies recorded.)";
        else {
            var i;
            msg += "Dependencies:\r";
            for (i = 0; i < d.length; i++) msg += "  • " + d[i] + "\r";
        }
        UIUtils.alert(msg);
    };

    delBtn.onClick = function () {
        if (!list.selection || list.selection.length === 0) {
            UIUtils.alert("Select one or more items to delete.");
            return;
        }
        var sel = list.selection,
            copy = [],
            i;
        for (i = 0; i < sel.length; i++) copy.push(sel[i]); // ES3 copy

        // No pre-action confirmation per UX policy; rely on a single undo step instead
        // Proceed to delete selected items directly

        var delCount = 0,
            fail = 0;

        InDesignUtils.Prefs.withoutRedraw(function () {
            app.doScript(
                function () {
                    var j, it, s, knd;
                    var replCache = {};
                    function getRepl(k) {
                        if (!replCache[k]) replCache[k] = replacementFor(k);
                        return replCache[k];
                    }
                    for (j = copy.length - 1; j >= 0; j--) {
                        it = copy[j];
                        s = it._ref;
                        // If it's an empty folder (group), delete directly
                        if (it._isGroup) {
                            try {
                                s.remove();
                                delCount++;
                                try {
                                    it.remove();
                                } catch (_eUIF) {}
                                continue;
                            } catch (_egDel) {
                                fail++;
                                continue;
                            }
                        }
                        knd =
                            it._kind ||
                            (function () {
                                try {
                                    return getSelectedType();
                                } catch (_g) {
                                    return null;
                                }
                            })();
                        try {
                            if (knd === "All") knd = null;
                        } catch (_eK) {}
                        try {
                            if (!knd) {
                                // Fallback: try to infer from style constructor
                                try {
                                    if (s && s.constructor && s.constructor.name) {
                                        var cn = s.constructor.name;
                                        if (cn.indexOf("ParagraphStyle") >= 0) knd = "Paragraph";
                                        else if (cn.indexOf("CharacterStyle") >= 0) knd = "Character";
                                        else if (cn.indexOf("ObjectStyle") >= 0) knd = "Object";
                                        else if (cn.indexOf("TableStyle") >= 0) knd = "Table";
                                        else if (cn.indexOf("CellStyle") >= 0) knd = "Cell";
                                    }
                                } catch (_eInf) {}
                            }
                            if (s && s.isValid && knd && canDelete(knd, s)) {
                                // Use replacement so InDesign is happy even if there are hidden refs
                                var repl = getRepl(knd);
                                try {
                                    s.remove(repl);
                                } catch (_eTry) {
                                    s.remove();
                                } // fallback
                                delCount++;
                                try {
                                    it.remove();
                                } catch (_eUI) {} // remove from list UI
                            } else {
                                fail++;
                            }
                        } catch (_er) {
                            fail++;
                        }
                    }
                },
                ScriptLanguage.JAVASCRIPT,
                undefined,
                UndoModes.ENTIRE_SCRIPT,
                "Delete unused styles and folders"
            );
        });

        // Refresh lists so counts reflect the change
        scan = scanDocument();
        emptyGroups = collectEmptyGroups();
        unused = computeUnused(scan, mode);
        fillList();

        UIUtils.alert(
            "Deleted (styles replaced with None; formatting preserved where applicable): " +
                delCount +
                (fail ? "\rFailed: " + fail : "")
        );
    };

    // initial fill
    fillList();
    closeBtn.onClick = function () {
        w.close(1);
    };
    w.show();
})();
