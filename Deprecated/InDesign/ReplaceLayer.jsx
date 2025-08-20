/**
 * Move all objects from one layer to another, then delete the source layer.
 * InDesign ExtendScript (JSX) — compatible with engines that lack Array.map on collections.
 */
(function () {
  if (app.documents.length === 0) { alert("Open a document first."); return; }
  var doc = app.activeDocument;

  // Build arrays from the collection (names + layer refs)
  var layerRefs = [];
  var layerNames = [];
  for (var i = 0; i < doc.layers.length; i++) {
    layerRefs.push(doc.layers[i]);
    layerNames.push(doc.layers[i].name);
  }
  if (layerRefs.length < 2) { alert("Document needs at least two layers."); return; }

  // Dialog
  var dlg = app.dialogs.add({ name: "Move content and delete layer" });
  var srcDropdown, dstDropdown, includeMastersCheckbox, includeGuidesCheckbox, skipLockedCheckbox;

  with (dlg.dialogColumns.add()) {
    staticTexts.add({ staticLabel: "Choose the layer to delete and where to move its content." });

    var r1 = dialogRows.add();
    r1.staticTexts.add({ staticLabel: "Layer to delete:" });
    srcDropdown = r1.dropdowns.add({ stringList: layerNames, selectedIndex: 0 });

    var r2 = dialogRows.add();
    r2.staticTexts.add({ staticLabel: "Destination layer:" });
    // Preselect the next layer if it exists
    var defaultDst = layerRefs.length > 1 ? 1 : 0;
    dstDropdown = r2.dropdowns.add({ stringList: layerNames, selectedIndex: defaultDst });

    var r3 = dialogRows.add();
    includeMastersCheckbox = r3.checkboxControls.add({ staticLabel: "Also move items on master spreads", checkedState: true });

    var r4 = dialogRows.add();
    includeGuidesCheckbox = r4.checkboxControls.add({ staticLabel: "Also move guides on the layer", checkedState: true });

    var r5 = dialogRows.add();
    skipLockedCheckbox = r5.checkboxControls.add({ staticLabel: "Skip locked items (don’t force-unlock objects)", checkedState: false });
  }

  if (!dlg.show()) { dlg.destroy(); return; }

  var srcLayerName = layerNames[srcDropdown.selectedIndex];
  var dstLayerName = layerNames[dstDropdown.selectedIndex];
  var includeMasters = includeMastersCheckbox.checkedState;
  var includeGuides = includeGuidesCheckbox.checkedState;
  var skipLocked = skipLockedCheckbox.checkedState;
  dlg.destroy();

  if (srcLayerName === dstLayerName) { alert("Source and destination layers must be different."); return; }

  var srcLayer = doc.layers.itemByName(srcLayerName);
  var dstLayer = doc.layers.itemByName(dstLayerName);
  if (!srcLayer.isValid || !dstLayer.isValid) { alert("Selected layers are not valid."); return; }

  // Helpers
  function getAllPageItems(doc, includeMasters) {
    var items = [];
    try { items = items.concat(doc.pageItems.everyItem().getElements()); } catch (e) {}
    if (includeMasters) {
      for (var i = 0; i < doc.masterSpreads.length; i++) {
        try { items = items.concat(doc.masterSpreads[i].pageItems.everyItem().getElements()); } catch (e) {}
      }
    }
    return items;
  }
  function getAllGuides(doc, includeMasters) {
    var guides = [];
    try { guides = guides.concat(doc.guides.everyItem().getElements()); } catch (e) {}
    for (var p = 0; p < doc.pages.length; p++) {
      try { guides = guides.concat(doc.pages[p].guides.everyItem().getElements()); } catch (e) {}
    }
    if (includeMasters) {
      for (var m = 0; m < doc.masterSpreads.length; m++) {
        var ms = doc.masterSpreads[m];
        for (var mp = 0; mp < ms.pages.length; mp++) {
          try { guides = guides.concat(ms.pages[mp].guides.everyItem().getElements()); } catch (e) {}
        }
      }
    }
    return guides;
  }
  function moveItemToLayer(item, dstLayer, skipLocked) {
    if (!item.isValid || !("itemLayer" in item)) return false;
    if (item.itemLayer !== srcLayer) return false;
    if (skipLocked && item.locked) return false;

    var prevLocked = false;
    try { prevLocked = item.locked; } catch (e) {}
    try {
      if (!skipLocked && item.locked) item.locked = false;
      if (item.visible === false) item.visible = true;
      item.itemLayer = dstLayer;
      if (!skipLocked) item.locked = prevLocked;
      return true;
    } catch (e2) {
      try { if (!skipLocked) item.locked = prevLocked; } catch (e3) {}
      return false;
    }
  }

  // Ensure layers are editable/visible during move
  var srcPrevLocked = srcLayer.locked, srcPrevVisible = srcLayer.visible;
  var dstPrevLocked = dstLayer.locked, dstPrevVisible = dstLayer.visible;
  srcLayer.locked = false; srcLayer.visible = true;
  dstLayer.locked = false; dstLayer.visible = true;

  app.doScript(function () {
    var movedCount = 0, skippedLocked = 0, guideMoves = 0;

    var items = getAllPageItems(doc, includeMasters);
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      try {
        if (it.isValid && "itemLayer" in it && it.itemLayer === srcLayer) {
          var wasLocked = false; try { wasLocked = it.locked; } catch (e) {}
          var ok = moveItemToLayer(it, dstLayer, skipLocked);
          if (ok) movedCount++; else if (skipLocked && wasLocked) skippedLocked++;
        }
      } catch (e) {}
    }

    if (includeGuides) {
      var guides = getAllGuides(doc, includeMasters);
      for (var g = 0; g < guides.length; g++) {
        var gd = guides[g];
        try {
          if (gd.isValid && "itemLayer" in gd && gd.itemLayer === srcLayer) {
            var prevGLocked = false; try { prevGLocked = gd.locked; } catch (e) {}
            if (!skipLocked && prevGLocked) { try { gd.locked = false; } catch (e) {} }
            try { gd.itemLayer = dstLayer; guideMoves++; } catch (e) {}
            if (!skipLocked) { try { gd.locked = prevGLocked; } catch (e) {} }
          }
        } catch (e) {}
      }
    }

    try {
      srcLayer.remove();
      alert(
        "Done!\n\nMoved " + movedCount + " object(s)" +
        (includeGuides ? (" and " + guideMoves + " guide(s)") : "") +
        (skipLocked && skippedLocked ? ("\nSkipped " + skippedLocked + " locked item(s).") : "") +
        "\nDeleted layer: " + srcLayerName
      );
    } catch (e) {
      alert(
        "Moved " + movedCount + " object(s)" +
        (includeGuides ? (" and " + guideMoves + " guide(s)") : "") +
        (skipLocked && skippedLocked ? ("\nSkipped " + skippedLocked + " locked item(s).") : "") +
        "\n\nHowever, the layer could not be deleted. There may still be locked or special items on it."
      );
    }
  }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Move items to layer & delete layer");

  // Restore previous states
  try { dstLayer.locked = dstPrevLocked; dstLayer.visible = dstPrevVisible; } catch (e) {}
  if (srcLayer.isValid) {
    try { srcLayer.locked = srcPrevLocked; srcLayer.visible = srcPrevVisible; } catch (e) {}
  }
})();
