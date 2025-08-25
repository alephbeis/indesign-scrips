/**
 * Frames off their Object Style X/Y — compact UI + Fix actions
 * - Page-relative, spread-safe comparison (only X and Y)
 * - Only checks styles that demonstrably enforce absolute position on that page
 * - Columns: Page | Style | dX/dY
 * - Buttons:
 *     Left:  Close, Go To
 *     Right: Fix, Fix and Next, Fix All
 */
(function () {
    // Local dialog helper to keep UI within InDesign (ScriptUI), not system alerts
    function showDialog(message, title) {
        try {
            var win = new Window('dialog', title || 'Object Position Checker');
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

    if (app.documents.length === 0) { showDialog("Open a document first.", "Object Position Checker"); return; }

    app.doScript(function(){
        var sp = app.scriptPreferences;
        var _origUnits = null;
        try {
            try { _origUnits = sp.measurementUnit; sp.measurementUnit = MeasurementUnits.POINTS; } catch(_u0) {}

            var doc = app.activeDocument;

    // --- CONFIG ---
    var TOL_PT = 0.5;               // tolerance for X/Y
    var TEMP_W = 10, TEMP_H = 10;   // seed frame size
    var SEED1 = { x: 315.123, y: 222.987 };
    var SEED2 = { x: 123.456, y: 345.678 };
    var MAX_DIALOG_HEIGHT = 480;    // px-ish; ScriptUI uses logical units

    // --- helpers ---
    function anchorPB(item){
        try {
            var r = item.resolve(AnchorPoint.TOP_LEFT_ANCHOR, CoordinateSpaces.PASTEBOARD_COORDINATES);
            if (r && r.length && r[0].length === 2) return {x:r[0][0], y:r[0][1]};
        } catch (e) {}
        return null;
    }
    function pageOrigin(page){ var b = page.bounds; return {x:b[1], y:b[0]}; }
    function pageRelXY(item){
        var pg = item.parentPage; if (!pg || !pg.isValid) return null;
        var a = anchorPB(item); if (!a) return null;
        var o = pageOrigin(pg);
        return {x: a.x - o.x, y: a.y - o.y, page: pg};
    }
    function toPBFromPageRel(page, pr){ var o = pageOrigin(page); return {x:o.x + pr.x, y:o.y + pr.y}; }
    function abs(v){ return v < 0 ? -v : v; }
    function close(a,b,t){ return abs(a-b) <= t; }
    function n2(v){ return Math.round(v * 100) / 100; }
    function key(style, page){ return (style && style.isValid ? style.name : "<none>") + "@" + (page && page.isValid ? page.id : "pb"); }

    // Prove style enforces absolute page-relative position (two seeds collapse to same XY)
    function expectedXY(style, page){
        var tf1, tf2, after1, after2, res = null, eps = 0.001;
        try {
            tf1 = page.textFrames.add({ geometricBounds: [SEED1.y, SEED1.x, SEED1.y+TEMP_H, SEED1.x+TEMP_W] });
            tf2 = page.textFrames.add({ geometricBounds: [SEED2.y, SEED2.x, SEED2.y+TEMP_H, SEED2.x+TEMP_W] });
            tf1.appliedObjectStyle = style;
            tf2.appliedObjectStyle = style;
            after1 = pageRelXY(tf1); after2 = pageRelXY(tf2);
            if (after1 && after2 && abs(after1.x-after2.x)<=eps && abs(after1.y-after2.y)<=eps) {
                res = { x: after1.x, y: after1.y };
            }
        } catch (_) {} finally {
            try { if (tf1 && tf1.isValid) tf1.remove(); } catch(_){}
            try { if (tf2 && tf2.isValid) tf2.remove(); } catch(_){}
        }
        return res;
    }

    var cache = {};
    function getExpectedXY(style, page){
        var k = key(style,page);
        if (cache.hasOwnProperty(k)) return cache[k];
        cache[k] = expectedXY(style,page); // may be null
        return cache[k];
    }

    // --- scan all text frames ---
    var rows = []; // {pageName, styleName, dx, dy, ref, page, targetPR}
    var frames = doc.textFrames.everyItem().getElements();
    for (var i=0;i<frames.length;i++){
        var f = frames[i];
        if (!f.isValid) continue;

        var st = f.appliedObjectStyle;
        if (!st || !st.isValid) continue;

        var pr = pageRelXY(f);
        if (!pr) continue; // skip pasteboard

        var exp = getExpectedXY(st, pr.page);
        if (!exp) continue; // style doesn't enforce position here

        var dx = pr.x - exp.x, dy = pr.y - exp.y;
        if (close(pr.x, exp.x, TOL_PT) && close(pr.y, exp.y, TOL_PT)) continue;

        rows.push({
            pageName: pr.page.name,
            styleName: st.name,
            dx: n2(dx), dy: n2(dy),
            ref: f,
            page: pr.page,
            targetPR: exp
        });
    }

    if (!rows.length){
        showDialog("No frames differ from their style-defined X/Y (page-relative).", "Object Position Checker");
        return;
    }

    // --- compute compact column widths based on content ---
    function estWidthFromTextLen(maxLen, min, max){
        // rough monospace estimate (6 px per char) with bounds
        var w = Math.round(maxLen * 6 + 20);
        if (min && w < min) w = min;
        if (max && w > max) w = max;
        return w;
    }
    var maxPageLen  = 0, maxStyleLen = 0, maxDeltaLen = 0;
    for (var r=0;r<rows.length;r++){
        var dtxt = rows[r].dx + " / " + rows[r].dy;
        if (String(rows[r].pageName).length > maxPageLen) maxPageLen = String(rows[r].pageName).length;
        if (String(rows[r].styleName).length > maxStyleLen) maxStyleLen = String(rows[r].styleName).length;
        if (dtxt.length > maxDeltaLen) maxDeltaLen = dtxt.length;
    }
    var colW_page  = estWidthFromTextLen(maxPageLen, 70, 120);
    var colW_style = estWidthFromTextLen(maxStyleLen, 120, 300);
    var colW_delta = estWidthFromTextLen(maxDeltaLen, 90, 140);
    var listWidth  = colW_page + colW_style + colW_delta + 40; // padding

    // --- UI (compact) ---
    var dlg = new Window("dialog", "Frames off their Object Style X/Y");
    dlg.alignChildren = "fill";

    var list = dlg.add("listbox", undefined, "", {
        numberOfColumns: 3,
        showHeaders: true,
        columnWidths: [colW_page, colW_style, colW_delta],
        columnTitles: ["Page","Style","dX / dY"],
        multiselect: true
    });

    // Height = content-based with max
    var rowCount = rows.length;
    var rowH = 18;             // approx row height
    var headerH = 24;          // header height
    var chrome = 80;           // extra room for buttons/margins
    var targetH = Math.min(MAX_DIALOG_HEIGHT, headerH + (Math.min(rowCount, 18) * rowH) + chrome);
    list.minimumSize = { width: listWidth, height: targetH - chrome };

    // Populate
    for (var i2=0;i2<rows.length;i2++){
        var it = list.add("item", String(rows[i2].pageName));
        it.subItems[0].text = rows[i2].styleName;
        it.subItems[1].text = rows[i2].dx + " / " + rows[i2].dy;
        it._data = rows[i2];
    }
    if (list.items.length) list.selection = 0;

    // --- two button sections ---
    var btnRow = dlg.add("group");
    btnRow.alignment = "fill";
    btnRow.alignChildren = ["fill","center"];

    var leftBtns = btnRow.add("group");
    leftBtns.alignment = "left";

    var rightBtns = btnRow.add("group");
    rightBtns.alignment = "right";

    // Left: Close, Go To
    leftBtns.add("button", undefined, "Close", {name:"ok"});
    var btnGoto  = leftBtns.add("button", undefined, "Go To");

    // Right: Fix, Fix and Next, Fix All
    var btnFix     = rightBtns.add("button", undefined, "Fix");
    var btnFixNext = rightBtns.add("button", undefined, "Fix and Next");
    var btnFixAll  = rightBtns.add("button", undefined, "Fix All");

    // --- actions ---
    function gotoItem(item){
        if (!item) return;
        var row = item._data;
        try {
            app.select(NothingEnum.NOTHING);
            app.select(row.ref);
            if (row.ref.parentPage && row.ref.parentPage.isValid) app.activeWindow.activePage = row.ref.parentPage;
        } catch(e){ showDialog("Could not select that frame: " + e, "Object Position Checker"); }
    }

    btnGoto.onClick = function(){
        var sel = list.selection;
        if (!sel || (sel instanceof Array && !sel.length)) { showDialog("Select a row first.", "Object Position Checker"); return; }
        var item = (sel instanceof Array) ? sel[0] : sel;
        gotoItem(item);
    };


    function fixRow(row){
        try {
            var currentPB = anchorPB(row.ref);
            var targetPB  = toPBFromPageRel(row.page, row.targetPR);
            if (!currentPB || !targetPB) return false;

            var dx = targetPB.x - currentPB.x;
            var dy = targetPB.y - currentPB.y;

            var wasLockedItem = false, wasLockedLayer = false;
            try { if (row.ref.locked) { wasLockedItem = true; row.ref.locked = false; } } catch(_){}
            try { if (row.ref.itemLayer && row.ref.itemLayer.locked) { wasLockedLayer = true; row.ref.itemLayer.locked = false; } } catch(_){}

            row.ref.move(undefined, [dx, dy]);

            try { if (wasLockedItem) row.ref.locked = true; } catch(_){}
            try { if (wasLockedLayer) row.ref.itemLayer.locked = true; } catch(_){}
            return true;
        } catch(e){ return false; }
    }

    btnFix.onClick = function(){
        var sel = list.selection;
        if (!sel || (sel instanceof Array && !sel.length)) { showDialog("Select one or more rows first.", "Object Position Checker"); return; }
        var items = (sel instanceof Array) ? sel : [sel];
        var fixed = 0;
        // remove from bottom up to avoid reindexing issues
        // collect indices
        var idxs = [];
        for (var i=0;i<items.length;i++) idxs.push(items[i].index);
        idxs.sort(function(a,b){ return b-a; });
        for (var j=0;j<idxs.length;j++){
            var idx = idxs[j];
            var row = list.items[idx]._data;
            if (fixRow(row)) { fixed++; list.remove(idx); }
        }
        if (fixed === 0) showDialog("Nothing fixed.", "Object Position Checker");
    };

    btnFixNext.onClick = function(){
        var sel = list.selection;
        if (!sel || (sel instanceof Array && !sel.length)) { showDialog("Select a row first.", "Object Position Checker"); return; }
        var item = (sel instanceof Array) ? sel[0] : sel;
        var idx  = item.index;
        var row  = item._data;
        if (fixRow(row)) {
            list.remove(idx);
            // select next visible row (same index now points to next item)
            var nextIdx = Math.min(idx, list.items.length - 1);
            if (nextIdx >= 0) {
                list.selection = list.items[nextIdx];
                gotoItem(list.items[nextIdx]); // jump to next
            }
        } else {
            showDialog("Could not fix that item.", "Object Position Checker");
        }
    };

    btnFixAll.onClick = function(){
        var fixed = 0;
        for (var i=list.items.length-1; i>=0; i--){
            var row = list.items[i]._data;
            if (fixRow(row)) { fixed++; list.remove(i); }
        }
        if (fixed === 0) showDialog("No items fixed.", "Object Position Checker");
    };

    // Close just dismisses the dialog (OK)
    // btnClose already has {name:"ok"}

    dlg.show();

        } finally {
            try { if (_origUnits != null) sp.measurementUnit = _origUnits; } catch(_u1) {}
        }
    }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Frames off their Object Style X/Y");
})();
