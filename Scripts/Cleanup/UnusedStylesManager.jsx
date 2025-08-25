/**
 * UnusedStylesManager.jsx — Mode dropdown + folder path column
 * Default mode: "Has no usage at all"
 * Robust delete: uses replacement style so removal always succeeds.
 * ES3-safe; tolerant to find options across builds.
 */

(function () {
  // InDesign dialog helper and override for alert(): avoid system dialogs
  function __showMessageDialog(title, text) {
    var w = new Window('dialog', title || 'Message');
    w.orientation = 'column';
    w.alignChildren = 'left';
    w.margins = 16;
    w.spacing = 12;
    var st = w.add('statictext', undefined, String(text));
    st.characters = 60;
    var row = w.add('group'); row.alignment = 'right'; row.spacing = 8;
    var btn = row.add('button', undefined, 'Close', { name: 'ok' });
    w.defaultElement = btn; w.cancelElement = btn;
    w.show();
  }
  var alert = function (msg) { try { __showMessageDialog('Message', msg); } catch (e) { try { $.writeln(String(msg)); } catch(_e){} } };

  if (app.documents.length === 0) { alert("Open a document first."); return; }
  var doc = app.activeDocument;

  // ---------- utils ----------
  function safeName(o){ try{return o.name;}catch(e){return "(unknown)";} }
  function isBracketedStyleName(s){ try{ var n = (s && s.isValid) ? s.name : null; return n && n.length>=2 && n.charAt(0)==="[" && n.charAt(n.length-1)==="]"; }catch(_e){ return false; } }
  function isBuiltInParagraphStyle(s){ return s && s.isValid && isBracketedStyleName(s); }
  function isBuiltInCharacterStyle(s){ return s && s.isValid && isBracketedStyleName(s); }
  function isBuiltInObjectStyle(s){    return s && s.isValid && isBracketedStyleName(s); }
  function isBuiltInTableStyle(s){     return s && s.isValid && isBracketedStyleName(s); }
  function isBuiltInCellStyle(s){      return s && s.isValid && isBracketedStyleName(s); }
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

  // Safe replacement styles for delete(): prefer "None" variants to preserve formatting
  function replacementFor(kind){
    function byName(coll, n){ try{ var it=coll.itemByName(n); if (it && it.isValid) return it; }catch(_e){} return null; }
    function byNames(coll, names){
      var i, it; for (i=0; i<names.length; i++){ it = byName(coll, names[i]); if (it) return it; }
      try{ if (coll && coll.length>0) return coll[0]; }catch(_e2){}
      return null;
    }
    if (kind==="Paragraph"){
      // Prefer [No Paragraph Style] for replace-with-none semantics; fall back to basic paragraph
      return byNames(doc.paragraphStyles, ["[No Paragraph Style]", "[Basic Paragraph]", "[Basic Paragraph Style]"]);
    }
    if (kind==="Character"){
      return byNames(doc.characterStyles, ["[None]"]);
    }
    if (kind==="Object"){
      return byNames(doc.objectStyles, ["[None]"]);
    }
    if (kind==="Table"){
      // Use [None] if available (some builds expose it), otherwise [Basic Table]
      return byNames(doc.tableStyles, ["[None]", "[Basic Table]"]);
    }
    if (kind==="Cell"){
      return byNames(doc.cellStyles, ["[None]"]);
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

    // Character (indirect: Based On)
    try{
      for (ci=0; ci<C.length; ci++){
        var csty=C[ci];
        try{ var cb=csty.basedOn; if (cb && cb.isValid && cb.id!==csty.id){ usedI.charS[cb.id]=true; addDep(deps.charS, cb.id, "Referenced as 'Based On' by '"+safeName(csty)+"'"); } }catch(_cbo){}
      }
    }catch(_eCBO){}

    // Object (direct: include items inside Groups)
    try {
      var items=[], m, seenMap={};
      try { items = items.concat(doc.pageItems.everyItem().getElements()); } catch(_eo1){}
      try {
        var ms = doc.masterSpreads ? doc.masterSpreads.everyItem().getElements() : [];
        for (m=0; m<ms.length; m++) { try { items = items.concat(ms[m].pageItems.everyItem().getElements()); } catch(_eo2){} }
        // Also seed master spread groups explicitly
        for (m=0; m<ms.length; m++) { try { items = items.concat(ms[m].groups ? ms[m].groups.everyItem().getElements() : []); } catch(_eomg){} }
      } catch(_eoM){}
      // Seed with groups explicitly (some builds don't expose groups via pageItems)
      try { items = items.concat(doc.groups ? doc.groups.everyItem().getElements() : []); } catch(_eog){}
      // Seed with groups on spreads as well
      try {
        var sps = doc.spreads ? doc.spreads.everyItem().getElements() : [];
        var si; for (si=0; si<sps.length; si++){ try { items = items.concat(sps[si].groups ? sps[si].groups.everyItem().getElements() : []); } catch(_eosg){} }
      } catch(_eoS){}
      function __markOS(it){
        try{ var os=it.appliedObjectStyle; if(os&&os.isValid){ usedD.obj[os.id]=true; addDep(deps.obj, os.id, "Applied to a page item"); } }catch(_eos){}
      }
      function __scanItem(it){
        if(!it||!it.isValid) return;
        try{ var sid = it.id; if (sid && seenMap[sid]) return; if (sid) seenMap[sid]=1; }catch(_eid){}
        __markOS(it);
        // Dive into group members if available
        var members=[], k, tmp;
        try{
          if (it.allPageItems && it.allPageItems.everyItem){ tmp = it.allPageItems.everyItem().getElements(); if (tmp && tmp.length) members = members.concat(tmp); }
        }catch(_eg1){}
        try{
          if (it.pageItems && it.pageItems.everyItem){ tmp = it.pageItems.everyItem().getElements(); if (tmp && tmp.length) members = members.concat(tmp); }
        }catch(_eg2){}
        try{
          if (it.groups && it.groups.everyItem){ tmp = it.groups.everyItem().getElements(); if (tmp && tmp.length) members = members.concat(tmp); }
        }catch(_eg3){}
        for (k=0; k<members.length; k++){ try{ __scanItem(members[k]); }catch(_erg){} }
      }
      var i2; for (i2=0;i2<items.length;i2++){ __scanItem(items[i2]); }
    }catch(_eo){}

    // Object (indirect: Based On)
    try{
      var allO = getAllStyles("obj");
      var oi; for (oi=0; oi<allO.length; oi++){
        var osty=allO[oi];
        try{ var ob=osty.basedOn; if (ob && ob.isValid && ob.id!==osty.id){ usedI.obj[ob.id]=true; addDep(deps.obj, ob.id, "Referenced as 'Based On' by '"+safeName(osty)+"'"); } }catch(_obo){}
      }
    }catch(_eOBO){}

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

    // Table (indirect: Based On)
    try{
      var allT = getAllStyles("table");
      var ti; for (ti=0; ti<allT.length; ti++){
        var tsty=allT[ti];
        try{ var tbBase=tsty.basedOn; if (tbBase && tbBase.isValid && tbBase.id!==tsty.id){ usedI.table[tbBase.id]=true; addDep(deps.table, tbBase.id, "Referenced as 'Based On' by '"+safeName(tsty)+"'" ); } }catch(_tbo){}
      }
    }catch(_eTBO){}

    // Cell (indirect: Based On)
    try{
      var allCell = getAllStyles("cell");
      var ci2; for (ci2=0; ci2<allCell.length; ci2++){
        var celsty=allCell[ci2];
        try{ var cb2=celsty.basedOn; if (cb2 && cb2.isValid && cb2.id!==celsty.id){ usedI.cell[cb2.id]=true; addDep(deps.cell, cb2.id, "Referenced as 'Based On' by '"+safeName(celsty)+"'"); } }catch(_cbo2){}
      }
    }catch(_eCBO2){}

    restoreInclusiveFind(savedFind);

    function filterBuiltins(arr, isBI){ var out=[], i; for(i=0;i<arr.length;i++) if(!isBI(arr[i])) out.push(arr[i]); return out; }

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
    function filter(arr, usedD, usedI){
      var out=[], i, s, id, d, ind;
      for (i=0;i<arr.length;i++){
        s=arr[i]; if(!s||!s.isValid) continue; id=s.id;
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

  // ---- group utilities ----
  function collectEmptyGroups(){
    function walkGroups(rootColl, kind){
      var result = [];
      function childGroups(g){
        try{
          if (kind==="Paragraph") return g.paragraphStyleGroups.everyItem().getElements();
          if (kind==="Character") return g.characterStyleGroups.everyItem().getElements();
          if (kind==="Object")    return g.objectStyleGroups.everyItem().getElements();
          if (kind==="Table")     return g.tableStyleGroups.everyItem().getElements();
          if (kind==="Cell")      return g.cellStyleGroups.everyItem().getElements();
        }catch(_e2){}
        return [];
      }
      function hasOwnStyles(g){
        try{
          if (kind==="Paragraph") return g.paragraphStyles.length>0;
          if (kind==="Character") return g.characterStyles.length>0;
          if (kind==="Object")    return g.objectStyles.length>0;
          if (kind==="Table")     return g.tableStyles.length>0;
          if (kind==="Cell")      return g.cellStyles.length>0;
        }catch(_e){}
        return false;
      }
      function walkAndMark(g){
        if (!g || !g.isValid) return false;
        var subs = [], i, allSubsEmpty = true;
        try{ subs = childGroups(g); }catch(_e4){}
        for (i=0;i<subs.length;i++){
          var subEmpty = walkAndMark(subs[i]);
          if (!subEmpty) allSubsEmpty = false;
        }
        var ownHas = hasOwnStyles(g);
        var isEmptyDeep = (!ownHas) && allSubsEmpty && subs.length>=0; // if no styles and all children empty
        if (isEmptyDeep) { try{ result.push(g); }catch(_eP){} }
        return isEmptyDeep;
      }
      try{
        var i, arr = rootColl.everyItem ? rootColl.everyItem().getElements() : [];
        for (i=0;i<arr.length;i++) walkAndMark(arr[i]);
      }catch(_e5){}
      return result;
    }
    return {
      para:  walkGroups(doc.paragraphStyleGroups, "Paragraph"),
      charS: walkGroups(doc.characterStyleGroups, "Character"),
      obj:   walkGroups(doc.objectStyleGroups,    "Object"),
      table: walkGroups(doc.tableStyleGroups,     "Table"),
      cell:  walkGroups(doc.cellStyleGroups,      "Cell")
    };
  }

  // ---- run once, then UI ----
  var scan = scanDocument();
  var emptyGroups = collectEmptyGroups();

  var modeMap   = ["noDirectButIndirect","noUsageAtAll","bothSets"];
  var modeNames = ["Has no direct usage","Has no usage at all","Both of the above"];
  var mode = "noUsageAtAll"; // <<< default as requested
  var unused = computeUnused(scan, mode);

  // Main UI
  var w = new Window("dialog","Unused Styles Manager");
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
  var modeDD = hdr.add("dropdownlist", undefined, modeNames); modeDD.selection = 1; // default "no usage at all"

  // Columns list
  var list = right.add("listbox", [0,0,704,384], '', {
    multiselect:true,
    numberOfColumns: 3,
    showHeaders: true,
    columnTitles: ['Type', 'Style', 'Folder'],
    columnWidths: [152, 240, 240]
  });

  var btns = right.add("group"); btns.alignment = "right";
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

  function currentEmptyGroups(kind){
    if (kind==="Paragraph") return emptyGroups.para;
    if (kind==="Character") return emptyGroups.charS;
    if (kind==="Object")    return emptyGroups.obj;
    if (kind==="Table")     return emptyGroups.table;
    if (kind==="Cell")      return emptyGroups.cell;
    return [];
  }

  function getSelectedType(){
    try{
      if (rbAll.value) return "All";
      if (rbParagraph.value) return "Paragraph";
      if (rbCharacter.value) return "Character";
      if (rbObject.value) return "Object";
      if (rbTable.value) return "Table";
      if (rbCell.value) return "Cell";
    }catch(_eRST){}
    return "All";
  }

  function fillList(){
    list.removeAll();
    var selType = getSelectedType();
    var kindsOrder = ["Paragraph","Character","Object","Table","Cell"];
    function addItem(kind, s){
      var it = list.add('item', kind);
      try { it.subItems[0].text = safeName(s); } catch(_e1){}
      try { it.subItems[1].text = stylePath(s); } catch(_e2){}
      it._ref = s;
      it._kind = kind;
    }
    function addGroupItem(kind, g){
      var label = kind + " Folder (Empty)";
      var it = list.add('item', label);
      try { it.subItems[0].text = safeName(g); } catch(_eg1){}
      try { it.subItems[1].text = stylePath(g); } catch(_eg2){}
      it._ref = g;
      it._kind = kind; // base kind without "Folder"
      it._isGroup = true;
    }
    var i, s, arr, k, grs, gi;
    if (selType === "All"){
      for (k=0; k<kindsOrder.length; k++){
        var kind = kindsOrder[k];
        arr = currentArr(kind);
        for (i=0; i<arr.length; i++){
          s = arr[i];
          addItem(kind, s);
        }
        // Append empty folders for this kind
        grs = currentEmptyGroups(kind);
        for (gi=0; gi<grs.length; gi++) addGroupItem(kind, grs[gi]);
      }
    } else {
      arr = currentArr(selType);
      for (i=0; i<arr.length; i++){
        s = arr[i];
        addItem(selType, s);
      }
      // Append empty folders for the selected kind
      grs = currentEmptyGroups(selType);
      for (gi=0; gi<grs.length; gi++) addGroupItem(selType, grs[gi]);
    }
  }

  // Type selection via radio buttons
  rbAll.onClick = fillList;
  rbParagraph.onClick = fillList;
  rbCharacter.onClick = fillList;
  rbObject.onClick = fillList;
  rbTable.onClick = fillList;
  rbCell.onClick = fillList;

  modeDD.onChange = function(){
    var idx = modeDD.selection.index;
    mode = modeMap[idx];
    unused = computeUnused(scan, mode);
    // Empty folders are independent of mode, but refresh in case the user deleted items
    emptyGroups = collectEmptyGroups();
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
    if (!list.selection || list.selection.length===0){ alert("Select an item first."); return; }
    var sel = list.selection[0];
    var s = sel._ref;
    if (sel._isGroup){
      var msgG = "Folder: " + safeName(s) + "\rParent: " + stylePath(s) + "\r\rThis folder is empty (no styles and no subfolders).";
      alert(msgG);
      return;
    }
    var d = depsForStyle(s);
    var msg = "Style: " + safeName(s) + "\rGroup: " + stylePath(s) + "\r\r";
    if (!d.length) msg += "(No dependencies recorded.)";
    else { var i; msg += "Dependencies:\r"; for (i=0;i<d.length;i++) msg += "  • " + d[i] + "\r"; }
    alert(msg);
  };

  delBtn.onClick = function(){
    if (!list.selection || list.selection.length===0){ alert("Select one or more items to delete."); return; }
    var sel=list.selection, copy=[], i;
    for (i=0;i<sel.length;i++) copy.push(sel[i]); // ES3 copy

    // No pre-action confirmation per UX policy; rely on a single undo step instead
    // Proceed to delete selected items directly

    var delCount=0, fail=0;

    app.doScript(function(){
      var j, it, s, knd;
      var replCache = {};
      function getRepl(k){ if (!replCache[k]) replCache[k] = replacementFor(k); return replCache[k]; }
      for (j=copy.length-1; j>=0; j--){
        it = copy[j];
        s  = it._ref;
        // If it's an empty folder (group), delete directly
        if (it._isGroup){
          try{ s.remove(); delCount++; try { it.remove(); }catch(_eUIF){} continue; }catch(_egDel){ fail++; continue; }
        }
        knd = it._kind || (function(){ try{ return getSelectedType(); }catch(_g){ return null; } })();
        try{ if (knd === "All") knd = null; }catch(_eK){}
        try{
          if (!knd) {
            // Fallback: try to infer from style constructor
            try{
              if (s && s.constructor && s.constructor.name) {
                var cn = s.constructor.name;
                if (cn.indexOf("ParagraphStyle")>=0) knd = "Paragraph";
                else if (cn.indexOf("CharacterStyle")>=0) knd = "Character";
                else if (cn.indexOf("ObjectStyle")>=0) knd = "Object";
                else if (cn.indexOf("TableStyle")>=0) knd = "Table";
                else if (cn.indexOf("CellStyle")>=0) knd = "Cell";
              }
            }catch(_eInf){}
          }
          if (s && s.isValid && knd && canDelete(knd, s)){
            // Use replacement so InDesign is happy even if there are hidden refs
            var repl = getRepl(knd);
            try { s.remove(repl); } catch(_eTry){ s.remove(); } // fallback
            delCount++;
            try { it.remove(); } catch(_eUI){} // remove from list UI
          } else {
            fail++;
          }
        }catch(_er){ fail++; }
      }
    }, ScriptLanguage.JAVASCRIPT, undefined, UndoModes.ENTIRE_SCRIPT, "Delete unused styles and folders");

    // Refresh lists so counts reflect the change
    scan = scanDocument();
    emptyGroups = collectEmptyGroups();
    unused = computeUnused(scan, mode);
    fillList();

    alert("Deleted (styles replaced with None; formatting preserved where applicable): "+delCount + (fail?("\rFailed: "+fail):""));
  };

  // initial fill
  fillList();
  closeBtn.onClick = function(){ w.close(1); };
  w.show();
})();
