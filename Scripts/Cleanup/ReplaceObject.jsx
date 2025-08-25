/**
 * Replace Layer or Parent (Master) — Combined Script
 * Provides a single ScriptUI dialog (like DeleteHebrewMarks) to:
 *  - Move all objects from one layer to another and delete the source layer.
 *  - OR move/merge parent (master) spreads and delete the source parent.
 *
 * InDesign ExtendScript (JSX)
 */
(function () {
    // Load shared utilities
    var scriptFile = File($.fileName);
    var utilsFile = File(scriptFile.parent.parent + "/Shared/InDesignUtils.jsx");
    var utils = null;
    if (utilsFile.exists) {
        $.evalFile(utilsFile);
        // Use try/catch to safely access InDesignUtils without ESLint errors
        try {
            utils = this.InDesignUtils || $.global.InDesignUtils || null;
        } catch (e) {
            utils = null;
        }
    }

    // Use shared alert function
    var alert =
        utils && utils.UI && utils.UI.alert
            ? utils.UI.alert
            : function (msg) {
                  try {
                      $.writeln(String(msg));
                  } catch (_) {}
              };

    if (app.documents.length === 0) {
        alert("Open a document first.");
        return;
    }
    var doc = app.activeDocument;

    // ---------- Helpers (confirmation + number formatting) ----------
    function formatNumber(n) {
        var s = String(n);
        var isNeg = s.charAt(0) === "-";
        var x = isNeg ? s.substring(1) : s;
        var formatted = x.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
        return isNeg ? "-" + formatted : formatted;
    }

    function notify(contextTitle, linesArray) {
        // linesArray is an array of strings; we join with newlines
        var text = linesArray.join("\n");
        if (utils && utils.UI && utils.UI.showMessage) {
            utils.UI.showMessage(contextTitle, text);
        } else {
            alert(contextTitle + "\n" + text);
        }
    }

    // ---------- Collect data ----------
    // Layers
    var layerRefs = [];
    var layerNames = [];
    for (var li = 0; li < doc.layers.length; li++) {
        var lyr = doc.layers[li];
        layerRefs.push(lyr);
        layerNames.push(lyr.name);
    }

    // Parents (Masters)
    var masterRefs = [];
    var masterNames = [];
    for (var mi = 0; mi < doc.masterSpreads.length; mi++) {
        var ms = doc.masterSpreads[mi];
        var prefix = "";
        try {
            prefix = ms.namePrefix ? ms.namePrefix + "-" : "";
        } catch (e0) {}
        var baseName = "";
        try {
            baseName = ms.baseName || ms.name || "Master " + (mi + 1);
        } catch (e1) {
            baseName = "Master " + (mi + 1);
        }
        masterRefs.push(ms);
        masterNames.push(prefix + baseName);
    }

    // ---------- Build ScriptUI dialog (like DeleteHebrewMarks) ----------
    function createDialog() {
        var dlg = new Window("dialog", "Replace: Layer or Parent");
        dlg.orientation = "column";
        dlg.alignChildren = "fill";
        dlg.spacing = 12; // 8px grid: prefer 12px spacing for vertical rhythm
        dlg.margins = 16; // standard dialog margins

        var titleGroup = dlg.add("group");
        titleGroup.add("statictext", undefined, "Choose what to replace and configure options:");

        // Operation choice
        var opPanel = dlg.add("panel", undefined, "Operation");
        opPanel.orientation = "column";
        opPanel.alignChildren = "left";
        opPanel.margins = 12; // standard panel margins
        var rbLayer = opPanel.add("radiobutton", undefined, "Replace a Layer (move items, then delete layer)");
        var rbParent = opPanel.add(
            "radiobutton",
            undefined,
            "Replace a Parent/Master (move master items, then delete parent)"
        );
        rbLayer.value = layerRefs.length >= 2; // default if possible
        rbParent.value = !rbLayer.value && masterRefs.length >= 2;

        // Unified Options panel with conditional content (prevents blank space)
        var optionsPanel = dlg.add("panel", undefined, "Options");
        optionsPanel.orientation = "stack"; // overlay groups; only one is visible
        optionsPanel.alignChildren = ["fill", "top"];
        optionsPanel.margins = 12; // standard panel margins

        // Layer options group
        var layerGroup = optionsPanel.add("group");
        layerGroup.orientation = "column";
        layerGroup.alignChildren = "left";

        var rowL1 = layerGroup.add("group");
        rowL1.add("statictext", undefined, "Layer to delete:");
        var ddSrcLayer = rowL1.add("dropdownlist", undefined, layerNames);
        // No preselection; user must choose

        var rowL2 = layerGroup.add("group");
        rowL2.add("statictext", undefined, "Destination layer:");
        var ddDstLayer = rowL2.add("dropdownlist", undefined, layerNames);
        // No preselection; user must choose

        var cbLayerMasters = layerGroup.add("checkbox", undefined, "Also move items on master spreads");
        cbLayerMasters.value = true;
        var cbLayerGuides = layerGroup.add("checkbox", undefined, "Also move guides on the layer");
        cbLayerGuides.value = true;
        var cbLayerSkipLocked = layerGroup.add("checkbox", undefined, "Skip locked items (don’t force-unlock objects)");
        cbLayerSkipLocked.value = false;

        // Parent options group
        var parentGroup = optionsPanel.add("group");
        parentGroup.orientation = "column";
        parentGroup.alignChildren = "left";

        var rowP1 = parentGroup.add("group");
        rowP1.add("statictext", undefined, "Parent to delete:");
        var ddSrcParent = rowP1.add("dropdownlist", undefined, masterNames);
        // No preselection; user must choose

        var rowP2 = parentGroup.add("group");
        rowP2.add("statictext", undefined, "Destination parent:");
        var ddDstParent = rowP2.add("dropdownlist", undefined, masterNames);
        // No preselection; user must choose

        var cbMoveGuides = parentGroup.add("checkbox", undefined, "Also move guides");
        cbMoveGuides.value = false;
        var cbSkipLocked = parentGroup.add("checkbox", undefined, "Skip locked items (don’t force-unlock)");
        cbSkipLocked.value = false;
        var cbPreserve = parentGroup.add(
            "checkbox",
            undefined,
            "Preserve coordinates (match left/right when possible)"
        );
        cbPreserve.value = true;
        var cbReassign = parentGroup.add("checkbox", undefined, "Reassign document pages that used the source parent");
        cbReassign.value = true;

        // Hide both option groups initially to avoid early oversized layout
        layerGroup.visible = false;
        parentGroup.visible = false;

        // Toggle visibility based on radio selection within shared panel
        function updatePanels() {
            var showLayer = rbLayer.value;
            optionsPanel.text = showLayer ? "Layer Options" : "Parent/Master Options";
            layerGroup.visible = showLayer;
            parentGroup.visible = !showLayer;
            // relayout to shrink/grow without blank areas
            optionsPanel.layout.layout(true);
            dlg.layout.layout(true);
        }
        rbLayer.onClick = updatePanels;
        rbParent.onClick = updatePanels;

        // Measure both groups to reserve adequate height for the larger one
        layerGroup.visible = true;
        parentGroup.visible = true;
        dlg.layout.layout(true);
        var lH = layerGroup.bounds && layerGroup.bounds.length === 4 ? layerGroup.bounds[3] - layerGroup.bounds[1] : 0;
        var pH =
            parentGroup.bounds && parentGroup.bounds.length === 4 ? parentGroup.bounds[3] - parentGroup.bounds[1] : 0;
        var maxH = Math.max(lH, pH);
        if (maxH > 0) {
            try {
                optionsPanel.minimumSize.height = maxH;
            } catch (eMin) {}
            try {
                optionsPanel.preferredSize.height = maxH;
            } catch (ePref) {}
        }
        // Now apply initial selection visibility and layout
        updatePanels();

        // When dialog is shown, re-apply layout to ensure buttons are visible
        dlg.onShow = function () {
            updatePanels();
        };

        var btns = dlg.add("group");
        btns.alignment = "right"; // Right-aligned per UX conventions
        var btnCancel = btns.add("button", undefined, "Cancel", { name: "cancel" });
        var btnOK = btns.add("button", undefined, "Run", { name: "ok" });

        // Default/cancel roles for keyboard handling
        dlg.defaultElement = btnOK;
        dlg.cancelElement = btnCancel;

        // Disable OK until both source and destination are selected for the active operation
        btnOK.enabled = false;

        function selectedBothForLayer() {
            return !!(ddSrcLayer && ddSrcLayer.selection) && !!(ddDstLayer && ddDstLayer.selection);
        }
        function selectedBothForParent() {
            return !!(ddSrcParent && ddSrcParent.selection) && !!(ddDstParent && ddDstParent.selection);
        }
        function updateOkState() {
            var isLayerOp = rbLayer.value;
            btnOK.enabled = isLayerOp ? selectedBothForLayer() : selectedBothForParent();
        }

        // Wire up change handlers
        ddSrcLayer.onChange = updateOkState;
        ddDstLayer.onChange = updateOkState;
        ddSrcParent.onChange = updateOkState;
        ddDstParent.onChange = updateOkState;

        // Ensure radio button toggles also refresh OK state and panels
        rbLayer.onClick = function () {
            updatePanels();
            updateOkState();
        };
        rbParent.onClick = function () {
            updatePanels();
            updateOkState();
        };

        // Ensure initial state is correct when dialog appears
        dlg.onShow = function () {
            updatePanels();
            updateOkState();
        };

        btnOK.onClick = function () {
            if (rbLayer.value) {
                if (!selectedBothForLayer()) {
                    alert("Please select both source and destination layers.");
                    return;
                }
            } else {
                if (!selectedBothForParent()) {
                    alert("Please select both source and destination parents/masters.");
                    return;
                }
            }
            dlg.close(1);
        };
        btnCancel.onClick = function () {
            dlg.close(0);
        };

        var res = dlg.show();
        if (res !== 1) return null;

        if (rbLayer.value) {
            if (layerRefs.length < 2) {
                alert("Document needs at least two layers.");
                return null;
            }
            if (!ddSrcLayer || !ddSrcLayer.selection || !ddDstLayer || !ddDstLayer.selection) {
                alert("Please select both source and destination layers.");
                return null;
            }
            var srcIdxL = ddSrcLayer.selection.index;
            var dstIdxL = ddDstLayer.selection.index;
            return {
                op: "layer",
                srcIdx: srcIdxL,
                dstIdx: dstIdxL,
                includeMasters: cbLayerMasters.value,
                includeGuides: cbLayerGuides.value,
                skipLocked: cbLayerSkipLocked.value
            };
        } else {
            if (masterRefs.length < 2) {
                alert("Document needs at least two parents/masters.");
                return null;
            }
            if (!ddSrcParent || !ddSrcParent.selection || !ddDstParent || !ddDstParent.selection) {
                alert("Please select both source and destination parents/masters.");
                return null;
            }
            var srcIdxP = ddSrcParent.selection.index;
            var dstIdxP = ddDstParent.selection.index;
            return {
                op: "parent",
                srcIdx: srcIdxP,
                dstIdx: dstIdxP,
                moveGuides: cbMoveGuides.value,
                skipLocked: cbSkipLocked.value,
                preservePos: cbPreserve.value,
                reassign: cbReassign.value
            };
        }
    }

    // ---------- Operations ----------
    function replaceLayer(opts) {
        var srcLayer = layerRefs[opts.srcIdx];
        var dstLayer = layerRefs[opts.dstIdx];
        if (srcLayer === dstLayer) {
            alert("Source and destination layers must be different.");
            return;
        }
        var srcLayerValid =
            utils && utils.Error && utils.Error.isValid ? utils.Error.isValid(srcLayer) : srcLayer.isValid;
        var dstLayerValid =
            utils && utils.Error && utils.Error.isValid ? utils.Error.isValid(dstLayer) : dstLayer.isValid;
        if (!srcLayerValid || !dstLayerValid) {
            alert("Selected layers are not valid.");
            return;
        }

        function getAllPageItems(doc, includeMasters) {
            var items = [];
            try {
                items = items.concat(doc.pageItems.everyItem().getElements());
            } catch (e) {}
            if (includeMasters) {
                for (var i = 0; i < doc.masterSpreads.length; i++) {
                    try {
                        items = items.concat(doc.masterSpreads[i].pageItems.everyItem().getElements());
                    } catch (e2) {}
                }
            }
            return items;
        }
        function getAllGuides(doc, includeMasters) {
            var guides = [];
            try {
                guides = guides.concat(doc.guides.everyItem().getElements());
            } catch (g1) {}
            for (var p = 0; p < doc.pages.length; p++) {
                try {
                    guides = guides.concat(doc.pages[p].guides.everyItem().getElements());
                } catch (g2) {}
            }
            if (includeMasters) {
                for (var m = 0; m < doc.masterSpreads.length; m++) {
                    var ms = doc.masterSpreads[m];
                    for (var mp = 0; mp < ms.pages.length; mp++) {
                        try {
                            guides = guides.concat(ms.pages[mp].guides.everyItem().getElements());
                        } catch (g3) {}
                    }
                }
            }
            return guides;
        }
        function moveItemToLayer(item, dstLayer, skipLocked, srcLayer) {
            if (!item.isValid || !("itemLayer" in item)) return false;
            if (item.itemLayer !== srcLayer) return false;
            if (skipLocked && item.locked) return false;
            var prevLocked = false;
            try {
                prevLocked = item.locked;
            } catch (e) {}
            try {
                if (!skipLocked && item.locked) item.locked = false;
                if (item.visible === false) item.visible = true;
                item.itemLayer = dstLayer;
                if (!skipLocked) item.locked = prevLocked;
                return true;
            } catch (e2) {
                try {
                    if (!skipLocked) item.locked = prevLocked;
                } catch (e3) {}
                return false;
            }
        }

        // Save and set layer states for editing
        var srcLayerState = {
            locked:
                utils && utils.Error && utils.Error.safe
                    ? utils.Error.safe(function () {
                          return srcLayer.locked;
                      }, false)
                    : srcLayer.locked,
            visible:
                utils && utils.Error && utils.Error.safe
                    ? utils.Error.safe(function () {
                          return srcLayer.visible;
                      }, true)
                    : srcLayer.visible
        };
        var dstLayerState = {
            locked:
                utils && utils.Error && utils.Error.safe
                    ? utils.Error.safe(function () {
                          return dstLayer.locked;
                      }, false)
                    : dstLayer.locked,
            visible:
                utils && utils.Error && utils.Error.safe
                    ? utils.Error.safe(function () {
                          return dstLayer.visible;
                      }, true)
                    : dstLayer.visible
        };

        // Make layers editable/visible during move
        if (utils && utils.Layers) {
            utils.Layers.setVisibility(srcLayer, true);
            utils.Layers.setVisibility(dstLayer, true);
        } else {
            srcLayer.visible = true;
            dstLayer.visible = true;
        }
        srcLayer.locked = false;
        dstLayer.locked = false;

        // Execute with proper preference handling
        var executeReplacement = function () {
            return app.doScript(
                function () {
                    var movedCount = 0,
                        skippedLocked = 0,
                        guideMoves = 0;
                    var movedItems = [];

                    var items = getAllPageItems(doc, opts.includeMasters);
                    for (var i = 0; i < items.length; i++) {
                        var it = items[i];
                        try {
                            if (it.isValid && "itemLayer" in it && it.itemLayer === srcLayer) {
                                var wasLocked = false;
                                try {
                                    wasLocked = it.locked;
                                } catch (e) {}
                                if (moveItemToLayer(it, dstLayer, opts.skipLocked, srcLayer)) {
                                    movedCount++;
                                    movedItems.push(it);
                                } else if (opts.skipLocked && wasLocked) skippedLocked++;
                            }
                        } catch (e1) {}
                    }

                    if (opts.includeGuides) {
                        var guides = getAllGuides(doc, opts.includeMasters);
                        for (var g = 0; g < guides.length; g++) {
                            var gd = guides[g];
                            try {
                                if (gd.isValid && "itemLayer" in gd && gd.itemLayer === srcLayer) {
                                    var prevGLocked = false;
                                    try {
                                        prevGLocked = gd.locked;
                                    } catch (eg) {}
                                    if (!opts.skipLocked && prevGLocked) {
                                        try {
                                            gd.locked = false;
                                        } catch (e2) {}
                                    }
                                    try {
                                        gd.itemLayer = dstLayer;
                                        guideMoves++;
                                    } catch (e3) {}
                                    if (!opts.skipLocked) {
                                        try {
                                            gd.locked = prevGLocked;
                                        } catch (e4) {}
                                    }
                                }
                            } catch (e5) {}
                        }
                    }

                    // Adjust stacking order of moved items according to layer order
                    try {
                        var srcAboveDst = opts.srcIdx < opts.dstIdx;
                        for (var k = 0; k < movedItems.length; k++) {
                            var m = movedItems[k];
                            if (!m || !m.isValid) continue;
                            try {
                                var prevL = false;
                                try {
                                    prevL = m.locked;
                                } catch (eL) {}
                                if (prevL) {
                                    try {
                                        m.locked = false;
                                    } catch (eu) {}
                                }
                                try {
                                    if (srcAboveDst) m.bringToFront();
                                    else m.sendToBack();
                                } catch (ez) {}
                                if (prevL) {
                                    try {
                                        m.locked = true;
                                    } catch (er) {}
                                }
                            } catch (eAdj) {}
                        }
                    } catch (eOrder) {}

                    // Attempt to delete source layer
                    var lines = [];
                    lines.push(
                        "Moved " +
                            formatNumber(movedCount) +
                            " object(s)" +
                            (opts.includeGuides ? " and " + formatNumber(guideMoves) + " guide(s)" : "") +
                            "."
                    );
                    if (opts.skipLocked && skippedLocked)
                        lines.push("Skipped " + formatNumber(skippedLocked) + " locked item(s).");
                    try {
                        var deletedLayerName;
                        try {
                            deletedLayerName = srcLayer && srcLayer.isValid ? srcLayer.name : "(unknown)";
                        } catch (_eName) {
                            deletedLayerName = "(unknown)";
                        }
                        srcLayer.remove();
                        lines.push("Deleted layer: " + deletedLayerName);
                        notify("Layer replacement completed.", lines);
                    } catch (eDel) {
                        lines.push(
                            "However, the layer could not be deleted. There may still be locked or special items on it."
                        );
                        notify("Layer replacement partially completed.", lines);
                    }
                },
                ScriptLanguage.JAVASCRIPT,
                undefined,
                UndoModes.ENTIRE_SCRIPT,
                "Replace Layer"
            );
        };

        // Execute with safe preferences if available
        if (utils && utils.Prefs && utils.Prefs.withSafePreferences) {
            utils.Prefs.withSafePreferences(executeReplacement, { enableRedraw: false });
        } else {
            executeReplacement();
        }

        // Restore layer states
        if (utils && utils.Error && utils.Error.safe) {
            utils.Error.safe(function () {
                dstLayer.locked = dstLayerState.locked;
                if (utils.Layers) {
                    utils.Layers.setVisibility(dstLayer, dstLayerState.visible);
                } else {
                    dstLayer.visible = dstLayerState.visible;
                }
            });
            if (utils.Error.isValid(srcLayer)) {
                utils.Error.safe(function () {
                    srcLayer.locked = srcLayerState.locked;
                    if (utils.Layers) {
                        utils.Layers.setVisibility(srcLayer, srcLayerState.visible);
                    } else {
                        srcLayer.visible = srcLayerState.visible;
                    }
                });
            }
        } else {
            try {
                dstLayer.locked = dstLayerState.locked;
                dstLayer.visible = dstLayerState.visible;
            } catch (eR1) {}
            if (srcLayer.isValid) {
                try {
                    srcLayer.locked = srcLayerState.locked;
                    srcLayer.visible = srcLayerState.visible;
                } catch (eR2) {}
            }
        }
    }

    function replaceParent(opts) {
        var srcMaster = masterRefs[opts.srcIdx];
        var dstMaster = masterRefs[opts.dstIdx];
        if (srcMaster === dstMaster) {
            alert("Source and destination parents must be different.");
            return;
        }
        var srcMasterValid =
            utils && utils.Error && utils.Error.isValid ? utils.Error.isValid(srcMaster) : srcMaster.isValid;
        var dstMasterValid =
            utils && utils.Error && utils.Error.isValid ? utils.Error.isValid(dstMaster) : dstMaster.isValid;
        if (!srcMasterValid || !dstMasterValid) {
            alert("Selected parents are not valid.");
            return;
        }

        function moveItemsFromPageToPage(srcPage, dstPage, opts) {
            var moved = 0,
                skipped = 0;
            var items = [];
            try {
                items = srcPage.pageItems.everyItem().getElements();
            } catch (e) {}
            for (var i = 0; i < items.length; i++) {
                var it = items[i];
                if (!it || !it.isValid) continue;
                if (opts.skipLocked && it.locked) {
                    skipped++;
                    continue;
                }
                var prevLocked = false;
                try {
                    prevLocked = it.locked;
                } catch (e1) {}
                try {
                    if (!opts.skipLocked && it.locked) it.locked = false;
                } catch (e2) {}
                try {
                    var gb = null;
                    try {
                        gb = it.geometricBounds.slice(0);
                    } catch (e3) {}
                    try {
                        it.itemLayer.locked = false;
                    } catch (e4) {}
                    it.move(LocationOptions.AT_END, dstPage);
                    if (opts.preservePos && gb && it.isValid) {
                        try {
                            it.geometricBounds = gb;
                        } catch (e5) {}
                    }
                    if (!opts.skipLocked) {
                        try {
                            it.locked = prevLocked;
                        } catch (e6) {}
                    }
                    moved++;
                } catch (eMove) {
                    try {
                        var dupe = it.duplicate(dstPage, LocationOptions.AT_END);
                        if (opts.preservePos && dupe && dupe.isValid) {
                            try {
                                dupe.geometricBounds = it.geometricBounds;
                            } catch (eGB) {}
                        }
                        moved++;
                        try {
                            it.remove();
                        } catch (eRem) {}
                    } catch (eDup) {
                        if (!opts.skipLocked) {
                            try {
                                it.locked = prevLocked;
                            } catch (e7) {}
                        }
                        skipped++;
                    }
                }
            }
            if (opts.moveGuides) {
                var guides = [];
                try {
                    guides = srcPage.guides.everyItem().getElements();
                } catch (eg) {}
                for (var g = 0; g < guides.length; g++) {
                    var gd = guides[g];
                    if (!gd || !gd.isValid) continue;
                    var glocked = false;
                    try {
                        glocked = gd.locked;
                    } catch (eg1) {}
                    if (opts.skipLocked && glocked) {
                        skipped++;
                        continue;
                    }
                    try {
                        if (!opts.skipLocked && glocked) gd.locked = false;
                        var newG = dstPage.guides.add();
                        try {
                            newG.itemLayer = gd.itemLayer;
                            newG.orientation = gd.orientation;
                            newG.location = gd.location;
                            newG.guideType = gd.guideType;
                            newG.fitToPage = gd.fitToPage;
                        } catch (eg2) {}
                        try {
                            gd.remove();
                        } catch (eg3) {}
                        if (!opts.skipLocked) {
                            try {
                                newG.locked = glocked;
                            } catch (eg4) {}
                        }
                        moved++;
                    } catch (eg5) {
                        skipped++;
                    }
                }
            }
            return { moved: moved, skipped: skipped };
        }

        function reassignAppliedMaster(doc, fromMaster, toMaster) {
            var changed = 0;
            for (var p = 0; p < doc.pages.length; p++) {
                var pg = doc.pages[p];
                if (pg.appliedMaster === fromMaster) {
                    try {
                        pg.appliedMaster = toMaster;
                        changed++;
                    } catch (e) {}
                }
            }
            for (var m = 0; m < doc.masterSpreads.length; m++) {
                var ms = doc.masterSpreads[m];
                if (ms === fromMaster || ms === toMaster) continue;
                try {
                    if (ms.baseMaster === fromMaster) ms.baseMaster = toMaster;
                } catch (e2) {}
            }
            return changed;
        }

        // Execute with proper preference handling
        var executeParentReplacement = function () {
            return app.doScript(
                function () {
                    var totalMoved = 0,
                        totalSkipped = 0;
                    var srcPages = srcMaster.pages;
                    var dstPages = dstMaster.pages;
                    var mapToMatching = opts.preservePos && srcPages.length === dstPages.length && srcPages.length > 1;

                    if (mapToMatching) {
                        for (var i = 0; i < srcPages.length; i++) {
                            var r = moveItemsFromPageToPage(srcPages[i], dstPages[i], opts);
                            totalMoved += r.moved;
                            totalSkipped += r.skipped;
                        }
                    } else {
                        var target = dstPages[0];
                        for (var j = 0; j < srcPages.length; j++) {
                            var r2 = moveItemsFromPageToPage(srcPages[j], target, opts);
                            totalMoved += r2.moved;
                            totalSkipped += r2.skipped;
                        }
                    }

                    var reassigned = 0;
                    if (opts.reassign) reassigned = reassignAppliedMaster(doc, srcMaster, dstMaster);

                    var lines = [];
                    lines.push(
                        "Moved " +
                            formatNumber(totalMoved) +
                            " master item(s)" +
                            (opts.moveGuides ? " (including guides)." : ".")
                    );
                    if (totalSkipped) lines.push("Skipped " + formatNumber(totalSkipped) + " locked/special item(s).");
                    if (opts.reassign) lines.push("Reassigned " + formatNumber(reassigned) + " document page(s).");

                    // Attempt to delete source master using safe error handling
                    var deleteResult =
                        utils && utils.Error && utils.Error.safe
                            ? utils.Error.safe(function () {
                                  srcMaster.remove();
                                  return true;
                              }, false)
                            : (function () {
                                  try {
                                      srcMaster.remove();
                                      return true;
                                  } catch (eDel) {
                                      return false;
                                  }
                              })();

                    if (deleteResult) {
                        lines.push("Deleted parent.");
                        notify("Parent replacement completed.", lines);
                    } else {
                        lines.push("However, the parent could not be deleted. Check for locked or special elements.");
                        notify("Parent replacement partially completed.", lines);
                    }
                },
                ScriptLanguage.JAVASCRIPT,
                undefined,
                UndoModes.ENTIRE_SCRIPT,
                "Replace Parent"
            );
        };

        // Execute with safe preferences if available
        if (utils && utils.Prefs && utils.Prefs.withSafePreferences) {
            utils.Prefs.withSafePreferences(executeParentReplacement, { enableRedraw: false });
        } else {
            executeParentReplacement();
        }
    }

    // ---------- Run ----------
    if (layerRefs.length < 2 && masterRefs.length < 2) {
        alert("Document needs at least two layers or two parents/masters.");
        return;
    }
    var choice = createDialog();
    if (!choice) return; // canceled or invalid

    if (choice.op === "layer") {
        replaceLayer({
            srcIdx: choice.srcIdx,
            dstIdx: choice.dstIdx,
            includeMasters: choice.includeMasters,
            includeGuides: choice.includeGuides,
            skipLocked: choice.skipLocked
        });
    } else if (choice.op === "parent") {
        replaceParent({
            srcIdx: choice.srcIdx,
            dstIdx: choice.dstIdx,
            moveGuides: choice.moveGuides,
            skipLocked: choice.skipLocked,
            preservePos: choice.preservePos,
            reassign: choice.reassign
        });
    }
})();
