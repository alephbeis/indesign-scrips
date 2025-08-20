/**
 * UnusedStylesManager.jsx — Mode dropdown + folder path column
 * Default mode: "Has no usage at all"
 * Robust delete: uses replacement style so removal always succeeds.
 * ES3-safe; tolerant to find options across builds.
 */

(function () {
  if (app.documents.length === 0) { alert("Open a document first."); return; }
  var doc = app.activeDocument;

  // ---------- utils ----------
  function safeName(o){ try{return o.name;}catch(e){return "(unknown)";} }
  function isBuiltInParagraphStyle(s){ return s && s.isValid && (s.name==="[No Paragraph Style]" || s.name==="[Basic Paragraph Style]"); }
  function isBuiltInCharacterStyle(s){ return s && s.isValid && (s.name==="[None]"); }
  function isBuiltInObjectStyle(s){    return s && s.isValid && (s.name==="[None]" || s.name==="[Basic Graphics Frame]" || s.name==="[Basic Text Frame]"); }
  function isBuiltInTableStyle(s){     return s && s.isValid && (s.name==="[Basic Table]"); }
  function isBuiltInCellStyle(s){      return s && s.isValid && (s.name==="[None]"); }
  function addDep(map,id,text){ if(!id) return; if(!map[id]) map[id]=[]; map[id].push(text); }

  function stylePath(s){
    var parts=[], p; try{ p=s.parent; }catch(_e0){ p=null; }
    while (p && p.isValid && p !== doc) {
      try { if (p.name) parts.push(p.name); } catch(_e1){}
      try { p = p.parent; } catch(_e2){ break; }
    }
    if (parts.length===0) return "(root)";
    var out=[], i; for (i=parts.length-1; i>=0; i--) out.push(parts[i]);
    return out.join(" / ");
  }

  // Safe replacement styles for delete()
  function replacementFor(kind){
    function byName(coll, n){ try{ var it=coll.itemByName(n); if (it && it.isValid) return it; }catch(_e){} return null; }
    if (kind==="Paragraph"){
      return byName(doc.paragraphStyles,"[Basic Paragraph Style]") || doc.paragraphStyles[0];
    }
    if (kind==="Character"){
      return byName(doc.characterStyles,"[None]") || doc.characterStyles[0];
    }
    if (kind==="Object"){
      return byName(doc.objectStyles,"[None]") || doc.objectStyles[0];
    }
    if (kind==="Table"){
      return byName(doc.tableStyles,"[Basic Table]") || doc.tableStyles[0];
    }
    if (kind==="Cell"){
      return byName(doc.cellStyles,"[None]") || doc.cellStyles[0];
    }
    return null;
  }

  // Find/Change options (set-only for overset to avoid Error 55)
  function enableInclusiveFind() {
    var fco = app.findChangeTextOptions, saved = {};
    try { saved.includeFootnotes = fco.includeFootnotes; fco.includeFootnotes = true; } catch(_e1){}
    try { saved.includeHiddenLayers = fco.includeHiddenLayers; fco.includeHiddenLayers = true; } catch(_e2){}
    try { saved.includeLockedLayersForFind = fco.includeLockedLayersForFind; fco.includeLockedLayersForFind = true; } catch(_e3){}
    try { saved.includeLockedStoriesForFind = fco.includeLockedStoriesForFind; fco.includeLockedStoriesForFind = true; } catch(_e4){}
    try { saved.includeMasterPages = fco.includeMasterPages; fco.includeMasterPages = true; } catch(_e5){}
    try { fco.includeOversetText = true; } catch(_e6){}
    return saved;
  }
  function restoreInclusiveFind(saved) {
    var fco = app.findChangeTextOptions;
    try { if(typeof saved.includeFootnotes!=="undefined") fco.includeFootnotes = saved.includeFootnotes; } catch(_r1){}
    try { if(typeof saved.includeHiddenLayers!=="undefined") fco.includeHiddenLayers = saved.includeHiddenLayers; } catch(_r2){}
    try { if(typeof saved.includeLockedLayersForFind!=="undefined") fco.includeLockedLayersForFind = saved.includeLockedLayersForFind; } catch(_r3){}
    try { if(typeof saved.includeLockedStoriesForFind!=="undefined") fco.includeLockedStoriesForFind = saved.includeLockedStoriesForFind; } catch(_r4){}
    try { if(typeof saved.includeMasterPages!=="undefined") fco.includeMasterPages = saved.includeMasterPages; } catch(_r5){}
  }

  // Collectors (fallback when all* APIs not present)
  function getAllStyles(kind) {
    try {
      if (kind==="para"  && doc.allParagraphStyles)  return doc.allParagraphStyles.everyItem().getElements();
      if (kind==="char"  && doc.allCharacterStyles)  return doc.allCharacterStyles.everyItem().getElements();
      if (kind==="obj"   && doc.allObjectStyles)     return doc.allObjectStyles.everyItem().getElements();
      if (kind==="table" && doc.allTableStyles)      return doc.allTableStyles.everyItem().getElements();
      if (kind==="cell"  && doc.allCellStyles)       return doc.allCellStyles.everyItem().getElements();
    } catch(e){}
    var out=[], i;
    if (kind==="para") {
      for (i=0;i<doc.paragraphStyles.length;i++) out.push(doc.paragraphStyles[i]);
      function walkPSG(g){ var si, gi; try{ for(si=0;si<g.paragraphStyles.length;si++) out.push(g.paragraphStyles[si]); for(gi=0;gi<g.paragraphStyleGroups.length;gi++) walkPSG(g.paragraphStyleGroups[gi]); }catch(_e1){} }
      for (i=0;i<doc.paragraphStyleGroups.length;i++) walkPSG(doc.paragraphStyleGroups[i]); return out;
    }
    if (kind==="char") {
      for (i=0;i<doc.characterStyles.length;i++) out.push(doc.characterStyles[i]);
      function walkCSG(g){ var si, gi; try{ for(si=0;si<g.characterStyles.length;si++) out.push(g.characterStyles[si]); for(gi=0;gi<g.characterStyleGroups.length;gi++) walkCSG(g.characterStyleGroups[gi]); }catch(_e2){} }
      for (i=0;i<doc.characterStyleGroups.length;i++) walkCSG(doc.characterStyleGroups[i]); return out;
    }
    if (kind==="obj") {
      for (i=0;i<doc.objectStyles.length;i++) out.push(doc.objectStyles[i]);
      function walkOSG(g){ var si, gi; try{ for(si=0;si<g.objectStyles.length;si++) out.push(g.objectStyles[si]); for(gi=0;gi<g.objectStyleGroups.length;gi++) walkOSG(g.objectStyleGroups[gi]); }catch(_e3){} }
      for (i=0;i<doc.objectStyleGroups.length;i++) walkOSG(doc.objectStyleGroups[i]); return out;
    }
    if (kind==="table") {
      for (i=0;i<doc.tableStyles.length;i++) out.push(doc.tableStyles[i]);
      function walkTSG(g){ var si, gi; try{ for(si=0;si<g.tableStyles.length;si++) out.push(g.tableStyles[si]); for(gi=0;gi<g.tableStyleGroups.length;gi++) walkTSG(g.tableStyleGroups[gi]); }catch(_e4){} }
      for (i=0;i<doc.tableStyleGroups.length;i++) walkTSG(doc.tableStyleGroups[i]); return out;
    }
    if (kind==="cell") {
      for (i=0;i<doc.cellStyles.length;i++) out.push(doc.cellStyles[i]);
      function walkCSLG(g){ var si, gi; try{ for(si=0;si<g.cellStyles.length;si++) out.push(g.cellStyles[si]); for(gi=0;gi<g.cellStyleGroups.length;gi++) walkCSLG(g.cellStyleGroups[gi]); }catch(_e5){} }
      for (i=0;i<doc.cellStyleGroups.length;i++) walkCSLG(doc.cellStyleGroups[i]); return out;
    }
    return out;
  }

  // -------- scan: build direct + indirect + dependency notes --------
  function scanDocument() {
    var usedD = { para:{}, charS:{}, obj:{}, table:{}, cell:{} }; // direct
    var usedI = { para:{}, charS:{}, obj:{}, table:{}, cell:{} }; // indirect
    var deps  = { para:{}, charS:{}, obj:{}, table:{}, cell:{} }; // notes

    var savedFind = enableInclusiveFind();

    // Paragraph (direct via find)
    var allP = getAllStyles("para");
    var P=[], i; for (i=0;i<allP.length;i++) if (!isBuiltInParagraphStyle(allP[i])) P.push(allP[i]);
    app.findTextPreferences = NothingEnum.NOTHING;
    for (i=0;i<P.length;i++){
      var ps=P[i];
      try{
        app.findTextPreferences = NothingEnum.NOTHING;
        app.findTextPreferences.appliedParagraphStyle = ps;
        var hits = doc.findText();
        if (hits && hits.length>0) { usedD.para[ps.id]=true; addDep(deps.para, ps.id, "Direct usage found in text"); }
      }catch(_eP){}
    }
    app.findTextPreferences = NothingEnum.NOTHING;

    // Paragraph (indirect: Based On / Next Style / TOC)
    for (i=0;i<P.length;i++){
      var p=P[i], b, nx;
      try{ b=p.basedOn; if (b && b.isValid && b.id!==p.id){ usedI.para[b.id]=true; addDep(deps.para,b.id,"Referenced as 'Based On' by '"+safeName(p)+"'"); } }catch(_b){}
      try{ nx=p.nextStyle; if (nx && nx.isValid && nx.id!==p.id){ usedI.para[nx.id]=true; addDep(deps.para,nx.id,"Referenced as 'Next Style' by '"+safeName(p)+"'"); } }catch(_n){}
    }
    try{
      var tocs = doc.tocStyles ? doc.tocStyles.everyItem().getElements() : [];
      var t, ents, e, aps, toc;
      for (t=0;t<tocs.length;t++){
        toc=tocs[t];
        try{
          ents = toc.tocStyleEntries ? toc.tocStyleEntries.everyItem().getElements() : [];
          for (e=0;e<ents.length;e++){
            try{
              aps = ents[e].appliedParagraphStyle || ents[e].formatStyle;
              if (aps && aps.isValid){ usedI.para[aps.id]=true; addDep(deps.para, aps.id, "Referenced by TOC style '"+safeName(toc)+"'"); }
            }catch(_eTE){}
          }
        }catch(_eT){}
      }
    }catch(_eTOC){}

    // Character (direct via find)
    var allC = getAllStyles("char");
    var C=[], ci; for (ci=0;ci<allC.length;ci++) if (!isBuiltInCharacterStyle(allC[ci])) C.push(allC[ci]);
    app.findTextPreferences = NothingEnum.NOTHING;
    for (ci=0;ci<C.length;ci++){
      var cs=C[ci];
      try{
        app.findTextPreferences = NothingEnum.NOTHING;
        app.findTextPreferences.appliedCharacterStyle = cs;
        var hitsC = doc.findText();
        if (hitsC && hitsC.length>0) { usedD.charS[cs.id]=true; addDep(deps.charS, cs.id, "Direct usage found in text"); }
      }catch(_eC){}
    }
    app.findTextPreferences = NothingEnum.NOTHING;

    // Character (indirect via paragraph automations)
    for (i=0;i<P.length;i++){
      var pr=P[i], g, n, l;
      try{ var gstyles=pr.nestedGrepStyles ? pr.nestedGrepStyles.everyItem().getElements() : []; for (g=0; g<gstyles.length; g++){ try{ var gcs=gstyles[g].appliedCharacterStyle; if (gcs && gcs.isValid && gcs.name!=="[None]"){ usedI.charS[gcs.id]=true; addDep(deps.charS,gcs.id,"Referenced by GREP style in '"+safeName(pr)+"'"); } }catch(_e1){} } }catch(_eG){}
      try{ var nstyles=pr.nestedStyles ? pr.nestedStyles.everyItem().getElements() : []; for (n=0; n<nstyles.length; n++){ try{ var ncs=nstyles[n].appliedCharacterStyle; if (ncs && ncs.isValid && ncs.name!=="[None]"){ usedI.charS[ncs.id]=true; addDep(deps.charS,ncs.id,"Referenced by Nested style in '"+safeName(pr)+"'"); } }catch(_e2){} } }catch(_eN2){}
      try{ var lstyles=pr.nestedLineStyles ? pr.nestedLineStyles.everyItem().getElements() : []; for (l=0; l<lstyles.length; l++){ try{ var lcs=lstyles[l].appliedCharacterStyle; if (lcs && lcs.isValid && lcs.name!=="[None]"){ usedI.charS[lcs.id]=true; addDep(deps.charS,lcs.id,"Referenced by Line style in '"+safeName(pr)+"'"); } }catch(_e3){} } }catch(_eL){}
      try{ var dcs=pr.dropCapStyle; if (dcs && dcs.isValid && dcs.name!=="[None]"){ usedI.charS[dcs.id]=true; addDep(deps.charS,dcs.id,"Referenced by Drop Caps in '"+safeName(pr)+"'"); } }catch(_eDC){}
      try{ var bcs = pr.bulletCharacterStyle || pr.bulletsCharacterStyle || (pr.bulletsAndNumberingTextDefault ? pr.bulletsAndNumberingTextDefault.characterStyle : null); if (bcs && bcs.isValid && bcs.name!=="[None]"){ usedI.charS[bcs.id]=true; addDep(deps.charS,bcs.id,"Referenced by Bullets character style in '"+safeName(pr)+"'"); } }catch(_eB){}
      try{ var ncs2 = pr.numberingCharacterStyle || (pr.bulletsAndNumberingTextDefault ? pr.bulletsAndNumberingTextDefault.numberingCharacterStyle : null); if (ncs2 && ncs2.isValid && ncs2.name!=="[None]"){ usedI.charS[ncs2.id]=true; addDep(deps.charS,ncs2.id,"Referenced by Numbering character style in '"+safeName(pr)+"'"); } }catch(_eNC){}
    }

    // Object (direct only)
    try {
      var items=[], m;
      try { items = items.concat(doc.pageItems.everyItem().getElements()); } catch(_eo1){}
      for (m=0; m<doc.masterSpreads.length; m++) { try { items = items.concat(doc.masterSpreads[m].pageItems.everyItem().getElements()); } catch(_eo2){} }
      var i2; for (i2=0;i2<items.length;i2++){
        var it=items[i2]; if(!it||!it.isValid) continue;
        try{ var os=it.appliedObjectStyle; if(os&&os.isValid){ usedD.obj[os.id]=true; addDep(deps.obj, os.id, "Applied to a page item"); } }catch(_eo3){}
      }
    }catch(_eo){}

    // Table/Cell (direct only)
    try{
      var stories=[]; try{ stories=doc.stories.everyItem().getElements(); }catch(_eSt){}
      var s, tb, c;
      for (s=0;s<stories.length;s++){
        var tables=[]; try{ tables=stories[s].tables.everyItem().getElements(); }catch(_eT){}
        for (tb=0;tb<tables.length;tb++){
          try{ var ts=tables[tb].appliedTableStyle; if(ts&&ts.isValid){ usedD.table[ts.id]=true; addDep(deps.table, ts.id, "Applied to a table"); } }catch(_eTS){}
          var cells=[]; try{ cells=tables[tb].cells.everyItem().getElements(); }catch(_eC2){}
          for (c=0;c<cells.length;c++){
            try{ var cs2=cells[c].appliedCellStyle; if(cs2&&cs2.isValid){ usedD.cell[cs2.id]=true; addDep(deps.cell, cs2.id, "Applied to a cell"); } }catch(_eCe){}
          }
        }
      }
    }catch(_eTab){}

    restoreInclusiveFind(savedFind);

    function filterBuiltins(list, isBI){ var out=[], i; for(i=0;i<list.length;i++) if(!isBI(list[i])) out.push(list[i]); return out; }

    return {
      lists: {
        para:  filterBuiltins(getAllStyles("para"),  isBuiltInParagraphStyle),
        charS: filterBuiltins(getAllStyles("char"),  isBuiltInCharacterStyle),
        obj:   filterBuiltins(getAllStyles("obj"),   isBuiltInObjectStyle),
        table: filterBuiltins(getAllStyles("table"), isBuiltInTableStyle),
        cell:  filterBuiltins(getAllStyles("cell"),  isBuiltInCellStyle)
      },
      usedDirect: usedD,
      usedIndirect: usedI,
      deps: deps
    };
  }

  // Compute lists per mode:
  // "noDirectButIndirect"  → !direct &&  indirect
  // "noUsageAtAll"         → !direct && !indirect
  // "bothSets"             → !direct
  function computeUnused(scan, mode) {
    function filter(list, usedD, usedI){
      var out=[], i, s, id, d, ind;
      for (i=0;i<list.length;i++){
        s=list[i]; if(!s||!s.isValid) continue; id=s.id;
        d = (usedD[id]===true); ind = (usedI[id]===true);
        if (mode==="noDirectButIndirect") { if (!d &&  ind) out.push(s); }
        else if (mode==="noUsageAtAll")   { if (!d && !ind) out.push(s); }
        else /* bothSets */               { if (!d) out.push(s); }
      }
      return out;
    }
    return {
      para:  filter(scan.lists.para,  scan.usedDirect.para,  scan.usedIndirect.para),
      charS: filter(scan.lists.charS, scan.usedDirect.charS, scan.usedIndirect.charS),
      obj:   filter(scan.lists.obj,   scan.usedDirect.obj,   scan.usedIndirect.obj),
      table: filter(scan.lists.table, scan.usedDirect.table, scan.usedIndirect.table),
      cell:  filter(scan.lists.cell,  scan.usedDirect.cell,  scan.usedIndirect.cell)
    };
  }

  // ---- run once, then UI ----
  var scan = scanDocument();

  var modeMap   = ["noDirectButIndirect","noUsageAtAll","bothSets"];
  var modeNames = ["Has no direct usage","Has no usage at all","Both of the above"];
  var mode = "noUsageAtAll"; // <<< default as requested
  var unused = computeUnused(scan, mode);

  // Main UI
  var w = new Window("dialog","Unused Styles Manager");
  w.alignChildren = "fill";

  var hdr = w.add("group");
  hdr.add("statictext", undefined, "Type:");
  var typeDD = hdr.add("dropdownlist", undefined, ["Paragraph","Character","Object","Table","Cell"]); typeDD.selection = 0;

  hdr.add("statictext", undefined, "   Mode:");
  var modeDD = hdr.add("dropdownlist", undefined, modeNames); modeDD.selection = 1; // default "no usage at all"
  var rescanBtn = hdr.add("button", undefined, "Rescan");

  // Two-column list
  var list = w.add("listbox", [0,0,820,380], '', {
    multiselect:true,
    numberOfColumns: 2,
    showHeaders: true,
    columnTitles: ['Style', 'Folder'],
    columnWidths: [360, 430]
  });

  var btns = w.add("group"); btns.alignment = "right";
  var detailsBtn = btns.add("button", undefined, "Details…");
  var delBtn     = btns.add("button", undefined, "Delete Selected");
  var closeBtn   = btns.add("button", undefined, "Close", {name:"ok"});

  function currentArr(kind){
    if (kind==="Paragraph") return unused.para;
    if (kind==="Character") return unused.charS;
    if (kind==="Object")    return unused.obj;
    if (kind==="Table")     return unused.table;
    if (kind==="Cell")      return unused.cell;
    return [];
  }

  function fillList(){
    list.removeAll();
    var arr = currentArr(typeDD.selection.text);
    var i, s, it;
    for (i=0;i<arr.length;i++){
      s = arr[i];
      it = list.add('item', safeName(s));
      try { it.subItems[0].text = stylePath(s); } catch(_e){}
      it._ref = s;
    }
  }

  typeDD.onChange = fillList;

  modeDD.onChange = function(){
    var idx = modeDD.selection.index;
    mode = modeMap[idx];
    unused = computeUnused(scan, mode);
    fillList();
  };

  rescanBtn.onClick = function(){
    scan = scanDocument();
    unused = computeUnused(scan, mode);
    fillList();
  };

  function depsForStyle(s){
    var id=s.id, lines=[];
    if (scan.deps.para[id])  lines=lines.concat(scan.deps.para[id]);
    if (scan.deps.charS[id]) lines=lines.concat(scan.deps.charS[id]);
    if (scan.deps.obj[id])   lines=lines.concat(scan.deps.obj[id]);
    if (scan.deps.table[id]) lines=lines.concat(scan.deps.table[id]);
    if (scan.deps.cell[id])  lines=lines.concat(scan.deps.cell[id]);
    return lines;
  }

  function canDelete(kind, s){
    if (kind==="Paragraph") return !isBuiltInParagraphStyle(s);
    if (kind==="Character") return !isBuiltInCharacterStyle(s);
    if (kind==="Object")    return !isBuiltInObjectStyle(s);
    if (kind==="Table")     return !isBuiltInTableStyle(s);
    if (kind==="Cell")      return !isBuiltInCellStyle(s);
    return true;
  }

  detailsBtn.onClick = function(){
    if (!list.selection || list.selection.length===0){ alert("Select a style first."); return; }
    var s = list.selection[0]._ref, d = depsForStyle(s);
    var msg = "Style: " + safeName(s) + "\rGroup: " + stylePath(s) + "\r\r";
    if (!d.length) msg += "(No dependencies recorded.)";
    else { var i; msg += "Dependencies:\r"; for (i=0;i<d.length;i++) msg += "  • " + d[i] + "\r"; }
    alert(msg);
  };

  delBtn.onClick = function(){
    if (!list.selection || list.selection.length===0){ alert("Select one or more styles to delete."); return; }
    var kind = typeDD.selection.text;
    var sel=list.selection, copy=[], i;
    for (i=0;i<sel.length;i++) copy.push(sel[i]); // ES3 copy

    var delCount=0, fail=0;

    app.doScript(function(){
      var j, it, s, repl;
      repl = replacementFor(kind); // pick once per kind; fine to reuse
      for (j=copy.length-1; j>=0; j--){
        it = copy[j];
        s  = it._ref;
        try{
          if (s && s.isValid && canDelete(kind, s)){
            // Use replacement so InDesign is happy even if there are hidden refs
            try { s.remove(repl); } catch(_eTry){ s.remove(); } // fallback
            delCount++;
            try { it.remove(); } catch(_eUI){} // remove from list UI
          } else {
            fail++;
          }
        }catch(_er){ fail++; }
      }
    }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Delete unused styles");

    // Refresh lists so counts reflect the change
    scan = scanDocument();
    unused = computeUnused(scan, mode);
    fillList();

    alert("Deleted: "+delCount + (fail?("\rFailed: "+fail):""));
  };

  // initial fill
  fillList();
  closeBtn.onClick = function(){ w.close(1); };
  w.show();
})();
