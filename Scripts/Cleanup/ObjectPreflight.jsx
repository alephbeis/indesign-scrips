/**
 * Frames off their Object Style X/Y — compact UI + Fix actions + Reverse Check
 * - Mode A (default): report frames whose page-relative X/Y differs from their Object Style's enforced position
 * - Mode B (Reverse check): report frames whose Object Style does NOT enforce absolute page-relative X/Y
 * - Scope: excludes master pages; only checks pages in the document's LAST SECTION
 * - Columns: Page | Style | dX/dY ("—" in reverse mode)
 * - Buttons (both sets right-aligned):
 *     Top Right:  Go To, Go To Next
 *     Bottom Right: Close, Fix, Fix and Next, Fix All  (Fix buttons disabled in Reverse mode)
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

    if (app.documents.length === 0) {
        showDialog("Open a document first.", "Object Position Checker");
        return;
    }

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
            function isOnMasterFrame(tf){
                try {
                    if (!tf || !tf.isValid) return false;
                    var p = tf.parentPage;
                    if (!p || !p.isValid) return false; // pasteboard or detached
                    // If the page belongs to a MasterSpread, parent of page is a MasterSpread
                    return p.parent && p.parent.constructor && (String(p.parent.constructor.name) === 'MasterSpread');
                } catch(e) { return false; }
            }
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

            // Determine pages in the LAST SECTION only (inclusive of start to doc end)
            function buildLastSectionPageSet(){
                var res = {};
                if (doc.sections.length === 0) { // if no sections, treat entire doc as last section
                    for (var i=0;i<doc.pages.length;i++) res[doc.pages[i].id] = true;
                    return res;
                }
                var lastSec = doc.sections.lastItem();
                var startPg = lastSec.pageStart; // Page object
                var startIndex = startPg.documentOffset; // 0-based
                for (var j=startIndex; j<doc.pages.length; j++) res[doc.pages[j].id] = true;
                return res;
            }
            var lastSectionPages = buildLastSectionPageSet();

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
                } catch (_) {
                } finally {
                    try { if (tf1 && tf1.isValid) tf1.remove(); } catch(_){ }
                    try { if (tf2 && tf2.isValid) tf2.remove(); } catch(_){ }
                }
                return res;
            }

            var cache = {};
            function getExpectedXY(style, page){
                var k = key(style,page);
                if (Object.prototype.hasOwnProperty.call(cache, k)) return cache[k];
                cache[k] = expectedXY(style,page); // may be null
                return cache[k];
            }

            // --- DATA BUILDERS (per mode) ---
            function buildRowsNormal(){
                var out = []; // {pageName, styleName, dx, dy, ref, page, targetPR}
                var frames = doc.textFrames.everyItem().getElements();
                for (var i=0;i<frames.length;i++){
                    var f = frames[i];
                    if (!f.isValid) continue;
                    if (isOnMasterFrame(f)) continue; // exclude master pages
                    var pg = f.parentPage; if (!pg || !pg.isValid) continue;
                    if (!lastSectionPages[pg.id]) continue; // only last section

                    var st = f.appliedObjectStyle;
                    if (!st || !st.isValid) continue;

                    var pr = pageRelXY(f);
                    if (!pr) continue; // skip pasteboard

                    var exp = getExpectedXY(st, pr.page);
                    if (!exp) continue; // style doesn't enforce position here

                    var dx = pr.x - exp.x, dy = pr.y - exp.y;
                    if (close(pr.x, exp.x, TOL_PT) && close(pr.y, exp.y, TOL_PT)) continue;

                    out.push({
                        pageName: pr.page.name,
                        styleName: st.name,
                        dx: n2(dx), dy: n2(dy),
                        ref: f,
                        page: pr.page,
                        targetPR: exp
                    });
                }
                return out;
            }

            function buildRowsReverse(){
                var out = []; // list frames whose style does NOT enforce absolute X/Y on their page
                var frames = doc.textFrames.everyItem().getElements();
                for (var i=0;i<frames.length;i++){
                    var f = frames[i];
                    if (!f.isValid) continue;
                    if (isOnMasterFrame(f)) continue; // exclude master pages
                    var pg = f.parentPage; if (!pg || !pg.isValid) continue;
                    if (!lastSectionPages[pg.id]) continue; // only last section

                    var st = f.appliedObjectStyle;
                    if (!st || !st.isValid) continue;

                    var pr = pageRelXY(f);
                    if (!pr) continue;

                    var exp = getExpectedXY(st, pr.page);
                    if (exp) continue; // in reverse mode we want styles that DO NOT fix X/Y

                    out.push({
                        pageName: pr.page.name,
                        styleName: st.name,
                        dx: '—', dy: '—',
                        ref: f,
                        page: pr.page,
                        targetPR: null
                    });
                }
                return out;
            }

            // --- UI (compact, guaranteed right-aligned buttons) ---
            var dlg = new Window("dialog", "Frames off their Object Style X/Y");
            dlg.alignChildren = "fill";

            // Top row: Mode + spacer + right-aligned buttons
            var modeRow = dlg.add('group');
            modeRow.orientation = 'row';
            modeRow.alignment = 'fill';

            var modeLeft = modeRow.add('group');
            modeLeft.orientation = 'row';
            modeLeft.add('statictext', undefined, 'Mode:');
            var modeDrop = modeLeft.add('dropdownlist', undefined, [
                'Check mismatches',
                'Find styles without X/Y'
            ]);
            modeDrop.selection = 0; // default = normal

            // Spacer expands to push next group right
            modeRow.add('group').alignment = 'fill';

            // Right-aligned top buttons
            var topBtns = modeRow.add('group');
            topBtns.orientation = 'row';
            topBtns.alignment = 'right';
            var btnGoto = topBtns.add('button', undefined, 'Go To');
            var btnGotoNext = topBtns.add('button', undefined, 'Go To Next');

            // Results list
            var list = dlg.add("listbox", undefined, "", {
                numberOfColumns: 3,
                showHeaders: true,
                columnWidths: [90, 220, 120],
                columnTitles: ["Page","Style","dX / dY"],
                multiselect: true
            });

            // Bottom row: right-aligned buttons
            var btnRow = dlg.add("group");
            btnRow.orientation = "row";
            btnRow.alignment = "right";

            var _btnClose  = btnRow.add("button", undefined, "Close", { name: "ok" });
            var btnFix     = btnRow.add("button", undefined, "Fix");
            var btnFixNext = btnRow.add("button", undefined, "Fix and Next");
            var btnFixAll  = btnRow.add("button", undefined, "Fix All");

            // content height sizing
            function setListHeight(rowCount){
                var rowH = 18, headerH = 24, chrome = 80;
                var minRows = 6; // ensure comfortable space even when no rows in current mode
                var visibleRows = Math.max(Math.min(rowCount, 18), minRows);
                var targetH = Math.min(MAX_DIALOG_HEIGHT, headerH + (visibleRows * rowH) + chrome);
                var sz = { width: 90+220+120+40, height: targetH - chrome };
                list.minimumSize = sz;
                list.preferredSize = sz; // help ScriptUI expand/shrink the control
                try { dlg.layout.layout(true); } catch(_){ }
            }

            // rows data + render
            var rows = [];

            function updateButtonStates(mode){
                var hasItems = list.items.length > 0;
                var reverse = (mode === 'reverse');

                // Go To buttons: only enabled if there are items in the list
                btnGoto.enabled = hasItems;
                btnGotoNext.enabled = hasItems;

                // Fix buttons: disabled in reverse mode OR when list is empty
                btnFix.enabled = !reverse && hasItems;
                btnFixNext.enabled = !reverse && hasItems;
                btnFixAll.enabled = !reverse && hasItems;

                // Close button is always enabled (no change needed)
            }

            function render(mode){
                // mode: 'normal' | 'reverse'
                rows = (mode === 'reverse') ? buildRowsReverse() : buildRowsNormal();
                list.removeAll();
                for (var i=0;i<rows.length;i++){
                    var it = list.add("item", String(rows[i].pageName));
                    it.subItems[0].text = rows[i].styleName;
                    it.subItems[1].text = rows[i].dx + " / " + rows[i].dy;
                    it._data = rows[i];
                }
                if (list.items.length) list.selection = 0;
                setListHeight(rows.length);

                // Update button states based on list content and mode
                updateButtonStates(mode);
            }

            // initial render
            render('normal');

            modeDrop.onChange = function(){
                var m = (modeDrop.selection && modeDrop.selection.index === 1) ? 'reverse' : 'normal';
                render(m);
            };

            // --- actions ---
            function gotoItem(item){
                if (!item) return;
                var row = item._data;
                try {
                    // Activate the page first to ensure cross-page selection works
                    if (row.ref.parentPage && row.ref.parentPage.isValid) app.activeWindow.activePage = row.ref.parentPage;
                    app.select(NothingEnum.NOTHING);
                    app.select(row.ref);
                } catch(e){ showDialog("Could not select that frame: " + e, "Object Position Checker"); }
            }

            btnGoto.onClick = function(){
                var sel = list.selection;
                if (!sel || (sel instanceof Array && !sel.length)) { showDialog("Select a row first.", "Object Position Checker"); return; }
                var item = (sel instanceof Array) ? sel[0] : sel;
                // Enforce single selection in the list
                try { list.selection = null; } catch(_){ }
                try { list.selection = list.items[item.index]; } catch(_){ }
                gotoItem(list.items[item.index]);
            };

            btnGotoNext.onClick = function(){
                var total = list.items.length;
                if (total === 0) { showDialog("No items to navigate.", "Object Position Checker"); return; }
                var sel = list.selection;
                var idx = -1;
                if (sel) {
                    if (sel instanceof Array) { if (sel.length) idx = sel[0].index; }
                    else { idx = sel.index; }
                }
                var nextIdx = (idx >= 0) ? (idx + 1) : 0;
                if (nextIdx >= total) { showDialog("Already at the last item.", "Object Position Checker"); return; }
                // Enforce single selection and go to the next item (even across pages)
                try { list.selection = null; } catch(_){ }
                var targetItem = list.items[nextIdx];
                try { list.selection = targetItem; } catch(_){ }
                gotoItem(targetItem);
            };

            function fixRow(row){
                try {
                    var currentPB = anchorPB(row.ref);
                    var targetPB  = toPBFromPageRel(row.page, row.targetPR);
                    if (!currentPB || !targetPB) return false;

                    var dx = targetPB.x - currentPB.x;
                    var dy = targetPB.y - currentPB.y;

                    var wasLockedItem = false, wasLockedLayer = false;
                    try { if (row.ref.locked) { wasLockedItem = true; row.ref.locked = false; } } catch(_){ }
                    try { if (row.ref.itemLayer && row.ref.itemLayer.locked) { wasLockedLayer = true; row.ref.itemLayer.locked = false; } } catch(_){ }

                    row.ref.move(undefined, [dx, dy]);

                    try { if (wasLockedItem) row.ref.locked = true; } catch(_){ }
                    try { if (wasLockedLayer) row.ref.itemLayer.locked = true; } catch(_){ }
                    return true;
                } catch(e){ return false; }
            }

            btnFix.onClick = function(){
                if (!btnFix.enabled) return;
                var sel = list.selection;
                if (!sel || (sel instanceof Array && !sel.length)) { showDialog("Select one or more rows first.", "Object Position Checker"); return; }
                var items = (sel instanceof Array) ? sel : [sel];
                var fixed = 0;
                var idxs = [];
                for (var i=0;i<items.length;i++) idxs.push(items[i].index);
                idxs.sort(function(a,b){ return b-a; });
                for (var j=0;j<idxs.length;j++){
                    var idx = idxs[j];
                    var row = list.items[idx]._data;
                    if (fixRow(row)) { fixed++; list.remove(idx); }
                }
                // Update button states after removing items
                var currentMode = (modeDrop.selection && modeDrop.selection.index === 1) ? 'reverse' : 'normal';
                updateButtonStates(currentMode);
                if (fixed === 0) showDialog("Nothing fixed.", "Object Position Checker");
            };

            btnFixNext.onClick = function(){
                if (!btnFixNext.enabled) return;
                var sel = list.selection;
                if (!sel || (sel instanceof Array && !sel.length)) { showDialog("Select a row first.", "Object Position Checker"); return; }
                var item = (sel instanceof Array) ? sel[0] : sel;
                var idx  = item.index;
                var row  = item._data;
                if (fixRow(row)) {
                    list.remove(idx);
                    // Update button states after removing item
                    var currentMode = (modeDrop.selection && modeDrop.selection.index === 1) ? 'reverse' : 'normal';
                    updateButtonStates(currentMode);
                    var nextIdx = Math.min(idx, list.items.length - 1);
                    if (nextIdx >= 0) {
                        list.selection = list.items[nextIdx];
                        gotoItem(list.items[nextIdx]);
                    }
                } else {
                    showDialog("Could not fix that item.", "Object Position Checker");
                }
            };

            btnFixAll.onClick = function(){
                if (!btnFixAll.enabled) return;
                var fixed = 0;
                for (var i=list.items.length-1; i>=0; i--){
                    var row = list.items[i]._data;
                    if (fixRow(row)) { fixed++; list.remove(i); }
                }
                // Update button states after removing items
                var currentMode = (modeDrop.selection && modeDrop.selection.index === 1) ? 'reverse' : 'normal';
                updateButtonStates(currentMode);
                if (fixed === 0) showDialog("No items fixed.", "Object Position Checker");
            };

            dlg.show();

        } finally {
            try { if (_origUnits != null) sp.measurementUnit = _origUnits; } catch(_u1) {}
        }
    }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Frames off their Object Style X/Y (with Reverse Check)");
})();
