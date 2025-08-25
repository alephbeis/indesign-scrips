// testing
nk = {};
nk.doNikkud = {kamatz: true, pasach: true, tzeirei: true, segol: true, sheva: true, cholamchaser: true, cholammalei: true, cholammixed: true, chirikchaser: true, chirikmalei: true, chirikmixed: true,
					kubutz: true, shuruk: true, chatafkamatz: true, chatafpasach: true, chatafsegol: true, randomized: true};
nk.doc = app.documents[0];
nk.originalDoc = app.documents[0];

if (displayUI() === -1){
	exit();
}

function displayUI(){
	var i, nikkudPanel, r, s, toggleButton, w;
	var combinationText, folderRadio, closeDocCheckbox, setCheckboxes = [];
	var sets = establishSets();
	// Warning: The following nikkud array must contain exactly the same elements as the nk.doNikkud object. Moreover, the names have to be identical to the nk.doNikkud object, except for capitalization and added space.
	// We rely later on the fact that by lowercasing these elements and removing spaces, these elements exists in the nk.doNikkud object.
	var nikkud = ["Kamatz", "Pasach", "Tzeirei", "Segol", "Sheva", "Cholam Chaser", "Cholam Malei", "Cholam Mixed", "Chirik Chaser", "Chirik Malei", "Chirik Mixed", "Kubutz", "Shuruk", "Chataf Kamatz",
						"Chataf Pasach", "Chataf Segol", "Randomized"];
	w = new Window("dialog", "Nekudos PDF Generator");
	with (w){
		orientation = "row";
		alignChildren = ["fill", "fill"];
		with (add("group")){
			orientation = "column";
			with (nikkudPanel = add("panel", undefined, "Select Nikkud to Export")){
				alignment = ["fill", "fill"];
				alignChildren = ["left", "top"];
				spacing = 0;
				margins.top = 15;
				for (i = 0; i < nikkud.length; i++){
					with (add("checkbox", undefined, nikkud[i])){
						value = false;
					}
				}
			}
			with (add("group")){
				alignment = ["fill", "fill"];
				orientation = "row";
				toggleButton = add("button", undefined, "Toggle Selection");
			}
			with (add("panel", undefined, "Folder Options")){
				spacing = 3;
				margins.top = 15;
				alignment = ["fill", "fill"];
				alignChildren = ["left", "top"];
				add("radioButton", undefined, "Save PDFs to the same folder as the InDesign file");
				folderRadio = add("radioButton", undefined, "Create subfolder for the PDFs");
				folderRadio.value = true;
			}
			with (add("panel", undefined, "General Options")){
				spacing = 3;
				margins.top = 15;
				alignment = ["fill", "fill"];
				alignChildren = ["left", "top"];
				closeDocCheckbox = add("checkbox", undefined, "Close the InDesign file when the script ends");
				closeDocCheckbox.value = false;
			}
			with(add("group")){
				orientation = "row";
				alignment = ["fill", "fill"];
				alignChildren = ["left", "bottom"];
				add("button", undefined, "OK");
				add("button", undefined, "Cancel");
			}
		}
		with (add("group")){
			orientation = "column";
			minimumSize.width = 400;
			with(add("panel", undefined, "Select Sets for Export")){
				alignment = ["fill", "top"];
				alignChildren = ["left", "top"];
				spacing = 0;
				margins.top = 15;
				for (i = 0; i < sets.length; i++){
					setCheckboxes[i] = add("checkbox", undefined, sets[i][0].setName);
					setCheckboxes[i].onClick = function(){
						combinationText.text = getPermutations(sets, setCheckboxes);
					};
				}
			}
			with(add("panel", undefined, "Combinations")){
				alignment = ["fill", "fill"];
				alignChildren = ["fill", "fill"];
				spacing = 0;
				margins.top = 15;
				combinationText = add("editText", undefined, undefined, {multiline: true});
				combinationText.text = getPermutations(sets,setCheckboxes);
			}
		}
	}
	toggleButton.onClick = function(){
		for (i = 0; i < nikkudPanel.children.length; i++){
			nikkudPanel.children[i].value = !nikkudPanel.children[i].value;
		}
	};
	r =  w.show();
	// User cancelled operation
	if (r === 2){
		return -1;
	}
	// Store choices
	nk.nikkudDoc = false;
	for (i = 0; i < nikkudPanel.children.length; i++){
		if (nikkudPanel.children[i].value === false){
			nk.doNikkud[nikkudPanel.children[i].text.replace(/ /g, "").toLowerCase()] = false;
		}
		else {
			nk.nikkudDoc = true;
		}
	}
	nk.createSubfolder = folderRadio.value;
	nk.closeDoc = closeDocCheckbox.value;
	nk.layerSetsAsString = [];
	s = combinationText.text.split(/[\r\n]+/);
	for (i = 0; i < s.length; i++){
		nk.layerSetsAsString[i] = s[i].split(/ *, */);
	}
}

nk.DOC_NAME = nk.doc.name.replace(/\.indd$/, ""); // The name of the active InDesign document without the .indd file extension
nk.PDF_PRESET = app.pdfExportPresets.item("[Smallest File Size]");
if (nk.nikkudDoc){
	nk.CONDITION1 = nk.doc.conditions.add(); // Used to mark the nikkud in the document
	nk.CONDITION1_NAME = nk.CONDITION1.name;
	nk.CONDITION2 = nk.doc.conditions.add(); // Used to mark the Hebrew name of the nikkud
	nk.CONDITION2_NAME = nk.CONDITION2.name;
	nk.TARGET_LETTER_STYLE = nk.doc.paragraphStyles.itemByName("Target Letter");
	nk.TARGET_LETTER_SMALL_STYLE = nk.doc.paragraphStyleGroups.itemByName("Directions").paragraphStyles.itemByName("Target Letter Small");
	nk.BLACK = nk.doc.swatches.itemByName("Dark Blue").duplicate();
	nk.BLACK_NAME = nk.BLACK.name;
}
nk.scriptName = "Nekudos PDF Generator";
nk.NIKKUD = [];
nk.NIKKUD.push({nikkud: "ָ", name: "Kamatz", hebName: "קמץ", scriptName: "kamatz"});
nk.NIKKUD.push({nikkud: "ַ", name: "Pasach", hebName: "פתח", scriptName: "pasach"});
nk.NIKKUD.push({nikkud: "ֵ", name: "Tzeirei", hebName: "צירי", scriptName: "tzeirei"});
nk.NIKKUD.push({nikkud: "ֶ", name: "Segol", hebName: "סגול", scriptName: "segol"});
nk.NIKKUD.push({nikkud: "ְ", name: "Sheva", hebName: "שוא", scriptName: "sheva"});
nk.NIKKUD.push({nikkud: "ֹ", name: "Cholam Chaser", hebName: "חולם חסר", scriptName: "cholamchaser"});
nk.NIKKUD.push({nikkud: "וֹ", name: "Cholam Malei", hebName: "חולם מלא", scriptName: "cholammalei"});
nk.NIKKUD.push({nikkud: "ִ", name: "Chirik Chaser", hebName: "חיריק חסר", scriptName: "chirikchaser"});
nk.NIKKUD.push({nikkud: "ִי", name: "Chirik Malei", hebName: "חיריק מלא", scriptName: "chirikmalei"});
nk.NIKKUD.push({nikkud: "ֻ", name: "Kubutz", hebName: "קובוץ", scriptName: "kubutz"});
nk.NIKKUD.push({nikkud: "וּ", name: "Shuruk", hebName: "שורוק", scriptName: "shuruk"});
// Note: The 3 chatafs must come last, as they are avoided for Maze characters
nk.NIKKUD.push({nikkud: "ֳ", name: "Chataf Kamatz", hebName: "חטף קמץ", scriptName: "chatafkamatz"});
nk.NIKKUD.push({nikkud: "ֲ", name: "Chataf Pasach", hebName: "חטף פתח", scriptName: "chatafpasach"});
nk.NIKKUD.push({nikkud: "ֱ", name: "Chataf Segol", hebName: "חטף סגול", scriptName: "chatafsegol"});

try{
	app.scriptPreferences.userInteractionLevel = UserInteractionLevels.NEVER_INTERACT;
	main();
}
catch(e){
}
finally{
	app.scriptPreferences.userInteractionLevel = UserInteractionLevels.INTERACT_WITH_ALL;
}

function _findOversetFrames(d){
	var hits = [];
	try{
		var tfs = d.textFrames;
		for (var i=0;i<tfs.length;i++){
			var tf = tfs[i];
			if (tf && tf.isValid){
				try{
					if (tf.overflows === true){
						var pg = null; try { pg = tf.parentPage ? tf.parentPage.name : null; } catch(_){ }
						hits.push(pg ? ("Page " + pg) : "Pasteboard/No page");
					}
				}catch(__){}
			}
		}
	}catch(_e){}
	return hits;
}

function main(){
	var i, tempFile;
	// Overset text check: abort export if any text frame overflows
	var __overs = _findOversetFrames(nk.doc);
	if (__overs && __overs.length > 0){
		alert("Overset text detected in " + __overs.length + " text frame(s). Please fix overset before exporting.");
		return;
	}
	// Turn off preflight of document just in case it's on (seriously slows things down)
	nk.doc.preflightOptions.preflightOff = true;
	setGREPPrefs();
	getPdfOutputFolder();
	getLayerSets();
	hideAllLevelLayers();
	progressBarInitialize();
	if (nk.nikkudDoc){
		tidyFile();
		applyConditionToNikkud();
		nk.currentNikkud = 0;
		// First, do kamatz
		if (nk.doNikkud.kamatz){
			createPdfForEachLayerSet();
		}
		removeManzepachPages();
		applyLetterLabelsToPages();
		// Save a copy of this file in its 'prepared' state, so that we don't have to run through these time-consuming preparations again later when we do the randomized nikkud
		tempFile = File(Folder.temp + "/NekudosPDFGenerator.indd");
		nk.doc.saveACopy(tempFile);
		replaceSofios();
		// Cycle through each nikkud, excluding the 3 chatafs
		for (i = 1; i < nk.NIKKUD.length - 3; i++){
			if (nk.doNikkud[nk.NIKKUD[i].scriptName]){
				changeNikkud(i);
				createPdfForEachLayerSet();
			}
		}
		// Do chirik mixed (maleh/chaser)
		if (nk.doNikkud.chirikmixed){
			changeNikkud(8, "חיריק");
			createSomeChasers("ִי", "ִ");
			updateTargetLetter("תִ תִי");
			createPdfForEachLayerSet("Chirik");
		}
		// Do cholam mixed (maleh/chaser)
		if (nk.doNikkud.cholammixed){
			changeNikkud(6, "חולם");
			createSomeChasers("וֹ", "ֹ");
			updateTargetLetter("תֹ תוֹ");
			createPdfForEachLayerSet("Cholam");
		}
		// Do randomized nikkud. Revert document first
		if (nk.doNikkud.randomized){
			progressBarWrite("Opening temp doc for nikkud randomizing...");
			// Open the saved and ready copy, without a window to speed things up.
			nk.doc = app.open(tempFile, false);
			nk.CONDITION1 = nk.doc.conditions.itemByName(nk.CONDITION1_NAME);
			nk.CONDITION2 = nk.doc.conditions.itemByName(nk.CONDITION2_NAME);
			nk.TARGET_LETTER_STYLE = nk.doc.paragraphStyles.itemByName("Target Letter");
			nk.TARGET_LETTER_SMALL_STYLE = nk.doc.paragraphStyleGroups.itemByName("Directions").paragraphStyles.itemByName("Target Letter Small");
			nk.BLACK = nk.doc.swatches.itemByName(nk.BLACK_NAME);
			nk.doc.preflightOptions.preflightOff = true;
			getLayerSets();
			hideAllLevelLayers();
			nk.currentNikkud = 0;
			randomizeNikkud();
			createPdfForEachLayerSet("All Nekudos");
			progressBarWrite("Closing and deleting temp doc...");
			nk.doc.close(SaveOptions.NO);
		}
		tempFile.remove();
	}
	if (nk.nikkudDoc === false){
		createPdfForEachLayerSet();
	}
	if (nk.closeDoc === true){
		nk.originalDoc.close(SaveOptions.NO);
	}
}

function applyConditionToNikkud(){
	progressBarWrite("Applying condition to nikkud...");
	app.findGrepPreferences.findWhat = "ָ"; // Find the kamatz
	app.changeGrepPreferences.appliedConditions = [nk.CONDITION1];
	nk.doc.changeGrep();
	// Apply black copy to text so we can easily home in on it
	app.findGrepPreferences.findWhat = ".*ָ.*";
	app.changeGrepPreferences = null;
	app.changeGrepPreferences.fillColor = nk.BLACK;
	nk.doc.changeGrep();
	// Find the Hebrew word
	app.findGrepPreferences.findWhat = "קמץ";
	app.changeGrepPreferences.appliedConditions = [nk.CONDITION2];
	nk.doc.changeGrep();
}

// When randomizing the letters on the page, we only want to use letters the talmid has already been taught.
// So we store the current target letter as an ID page label, to make it easy to know the highest random letter that is allowed on this page.
function applyLetterLabelsToPages(){
	var finds, i;
	app.findGrepPreferences = app.changeGrepPreferences = null;
	app.findGrepPreferences.appliedParagraphStyle = nk.TARGET_LETTER_STYLE;
	finds = nk.doc.findGrep();
	for (i = 0; i < finds.length; i++){
		finds[i].parentTextFrames[0].parentPage.label = finds[i].contents[0];
	}
}

function changeNikkud(i, s){
	progressBarWrite("Changing nikkud...");
	app.findGrepPreferences = app.changeGrepPreferences = null;
	nk.currentNikkud = i;
	app.findGrepPreferences.appliedConditions = [nk.CONDITION1];
	app.changeGrepPreferences.appliedConditions = [nk.CONDITION1];
	app.changeGrepPreferences.changeTo = nk.NIKKUD[i].nikkud;
	nk.doc.changeGrep();
	app.findGrepPreferences.appliedConditions = [nk.CONDITION2];
	app.changeGrepPreferences.appliedConditions = [nk.CONDITION2];
	if (!s) app.changeGrepPreferences.changeTo = nk.NIKKUD[i].hebName;
	if (s) app.changeGrepPreferences.changeTo = s;
	nk.doc.changeGrep();
}

function createPDF(theName){
	progressBarWrite("Exporting PDF (" + theName + ")...");
	nk.doc.exportFile(ExportFormat.PDF_TYPE, File(nk.PDF_FOLDER + "/" + theName), false, nk.PDF_PRESET);
}

// Param special is optional. If supplied, it will be used in the pdf filename instead of the name of the nekuda
function createPdfForEachLayerSet(special){
	var aCondition, i, j, theName;
	for (i = 0; i < nk.layerSetsAsString.length; i++){
		theName = nk.DOC_NAME;
		if (nk.nikkudDoc){
			theName += "-";
		}
		if (special){
			theName += special;
		}
		if (!special && nk.nikkudDoc) {
			theName += nk.NIKKUD[nk.currentNikkud].name;
		}
		for (j = 0; j < nk.layerSetsAsString[i].length; j++){
			theName += "_" + nk.layerSetsAsString[i][j].split("-")[1];
		}
		theName += ".pdf";
		progressBarWrite("Creating PDF for layer set " + theName);
		// Update progress bar
		nk.progress.bar.value = (i / nk.layerSetsAsString.length) * 100;
		nk.progress.window.update();
		// Hide old layer
		hideAllLevelLayers();
		// Show layer
		for (j = 0; j < nk.layerSets[i].length; j++){
			nk.layerSets[i][j].visible = true;
			aCondition = nk.doc.conditions.itemByName(nk.layerSets[i][j].name);
			if (aCondition.isValid){
				aCondition.visible = true;
			}
		}
		createPDF(theName);
	}
}

function createSomeChasers(x, y){
	progressBarWrite("Creating some chasers...");
	var finds, i;
	app.findGrepPreferences = app.changeGrepPreferences = null;
	app.findGrepPreferences.fillColor = nk.BLACK;
	app.findGrepPreferences.findWhat = x;
	finds = nk.doc.findGrep(true);
	for (i = 0; i < finds.length; i++){
		if (Math.random() < 0.5){
			continue;
		}
		finds[i].contents = y;
	}
}

function establishSets(){
	var i, j = -1, theName, oldSetName, setName;
	var layerNames = nk.doc.layers.everyItem().name;
	var sets = [];
	for (i = layerNames.length - 1; i >= 0; i--){
		theName = layerNames[i];
		// To be part of a set, a layer must contain a hyphen
		if (theName.match(/-/) === null){
			continue;
		}
		setName = theName.split("-")[0];
		// If, as we're working up the layer list, we come to a new set, create a new array, etc.
		if (setName !== oldSetName){
			oldSetName = setName;
			j++;
			sets[j] = [];
		}
		sets[j].push({setName: setName, item: theName.split("-")[1]});
	}
	return sets;
}

function getLayerSets(){
	var i, j;
	nk.layerSets = [];
	// nk.doc.layers.everyItem().getElements(); // not used
	for (i = 0; i < nk.layerSetsAsString.length; i++){
		nk.layerSets[i] = [];
		for (j = 0; j < nk.layerSetsAsString[i].length; j++){
			nk.layerSets[i][j] = nk.doc.layers.itemByName(nk.layerSetsAsString[i][j]);
		}
	}
}

// Get all the permutations of a 2-dimensional array
function getPermutations(sets, checkboxes){
	var a = [], divisors = [], i, n, result = [], anArray, max = 1, val;
	for (i = 0; i < sets.length; i++){
		if (checkboxes[i].value){
			a.push(sets[i]);
		}
	}
	// Pre-calculate divisors
	for (i = a.length - 1; i >= 0; i--) {
		divisors[i] = divisors[i + 1] ? divisors[i + 1] * a[i + 1].length : 1;
		max *= a[i].length;
	}
	for (n = 0; n < max; n++){
		result[n] = [];
		for (i = 0; i < a.length; i++) {
			anArray = a[i];
			val = Math.floor(n / divisors[i]) % anArray.length;
			result[n].push(anArray[val].setName + "-"  + anArray[val].item);
		}
		result[n] = result[n].join(", ");
	}
	return result.reverse().join("\r");
}

function getPdfOutputFolder(){
	var f = nk.doc.filePath;
	if (nk.createSubfolder){
		f = Folder(f + "/" + nk.DOC_NAME + " PDF");
		if (!f.exists){
			f.create();
		}
	}
	nk.PDF_FOLDER = f;
}

function hideAllLevelLayers(){
	var aCondition;
	var allLayers = nk.doc.layers.everyItem();
	// First, show all layers, then hide all layers that have a - in their name
	allLayers.visible = true;
	allLayers = allLayers.getElements();
	var i;
	for (i = 0; i < allLayers.length; i++){
		if (allLayers[i].name.match("-") !== null){
			allLayers[i].visible = false;
			aCondition = nk.doc.conditions.itemByName(allLayers[i].name);
			if (aCondition.isValid){
				aCondition.visible = false;
			}
		}
	}
}

function progressBarInitialize(){
	nk.progress = {};
	nk.progress.window = new Window('palette', nk.scriptName);
	nk.progress.window.alignChildren = ["fill", "fill"];
	nk.progress.bar = nk.progress.window.add('progressbar', [12, 24, 450, 36], 0, 100);
	nk.progress.text = nk.progress.window.add("staticText");
	nk.progress.window.show();
}

function progressBarWrite(m){
	nk.progress.text.text = m;
	nk.progress.window.update();
}

function randomizeNikkud(){
	progressBarWrite("Randomizing nikkud...");
	var finds, findsLength, i, letters, maxLetter, randomLetter, mazeStyleExists;
	var max = nk.NIKKUD.length;
	mazeStyleExists = nk.doc.objectStyles.itemByName("Maze").isValid; // Use for optimization, to avoid having to fetch the obj. style name of each letter text frame
	letters = "אחהע";
	app.findGrepPreferences = app.changeGrepPreferences = null;
	app.findGrepPreferences.appliedConditions = [nk.CONDITION1];
	finds = nk.doc.findGrep(true);
	findsLength = finds.length;
	for (i = 0; i < findsLength; i++){
		progressBarWrite("Randomizing nikkud (" + i + "/" + findsLength + ")...");
		// If this is a letter in a 'Maze' object-style text frame, avoid applying a chataf nikkud to it, provided it is not אחהע.
		if (mazeStyleExists && finds[i].parentTextFrames[0].appliedObjectStyle.name === "Maze" && finds[i].contents.match("אחהע") === null){
			r = Math.floor(Math.random() * (max - 3));
		}
		else {
			r = Math.floor(Math.random() * max);
		}
		finds[i].contents = nk.NIKKUD[r].nikkud;
	}
	// Now we may have some chataf-nikkud under non אחהע letters, so fix that, randomly
	app.findGrepPreferences = app.changeGrepPreferences = null;
	app.findGrepPreferences.findWhat = "[ֱֲֳ]"; // Find any of the 3 chatafs
	app.findGrepPreferences.fillColor = nk.BLACK;
	finds = nk.doc.findGrep(true);
	findsLength = finds.length;
	for (i = 0; i < findsLength; i++){
		progressBarWrite("Fixing chatafs under non-אחהע letters (" + i + "/" + findsLength + ")...");
		// Skip the big target letters
		if (finds[i].appliedParagraphStyle.name.match("Target Letter") !== null){
			continue;
		}
		maxLetter = finds[i].parentStory.textContainers[0].parentPage.label;
		if (!maxLetter){
			continue;
		}
		do {
			randomLetter = letters[Math.floor(Math.random() * 4)];
		}
		while (randomLetter > maxLetter);
		finds[i].paragraphs[0].contents = randomLetter + finds[i].contents;
	}
	// Reaaply nk.CONDITION1 to all chatafs
	app.findGrepPreferences = app.changeGrepPreferences = null;
	app.findGrepPreferences.findWhat = "[ֱֲֳ]"; // Find any of the 3 chatafs
	app.changeGrepPreferences.appliedConditions = [nk.CONDITION1];
	nk.doc.changeGrep();
	// Ensure that all sofios have a kamatz in them and nothing else
	app.findGrepPreferences = app.changeGrepPreferences = null;
	app.findGrepPreferences.findWhat = "([םןץףך]).+";
	app.findGrepPreferences.fillColor = nk.BLACK;
	app.changeGrepPreferences.changeTo = "$1ָ";
	nk.doc.changeGrep();
	// Remove kamatz after all sofios except nun and chaf
	app.findGrepPreferences.findWhat = "([םצף])(ָ)";
	app.changeGrepPreferences.changeTo = "$1";
	nk.doc.changeGrep();
	// Change Nikkud name
	app.findGrepPreferences = app.changeGrepPreferences = null;
	app.findGrepPreferences.appliedConditions = [nk.CONDITION2];
	app.changeGrepPreferences.appliedConditions = [nk.CONDITION2];
	app.changeGrepPreferences.changeTo = "נקודות";
	nk.doc.changeGrep();
	// No nikkud under the big target letter in this case, so replace with space
	app.findGrepPreferences = app.changeGrepPreferences = null;
	app.findGrepPreferences.findWhat = ".ׂ?ׁ?ּ?\\K[^A]+";
	app.findGrepPreferences.appliedParagraphStyle = nk.TARGET_LETTER_STYLE;
	app.changeGrepPreferences.changeTo = " ";
	app.changeGrepPreferences.appliedConditions = [nk.CONDITION1];
	nk.doc.changeGrep();
	// Ditto for the small (directions) target letter
	if (nk.TARGET_LETTER_SMALL_STYLE.isValid){
		app.findGrepPreferences.appliedParagraphStyle = nk.TARGET_LETTER_SMALL_STYLE;
		nk.doc.changeGrep();
	}
}

function removeManzepachPages(){
	if (nk.TARGET_LETTER_STYLE.isValid === false){
		return;
	}
	progressBarWrite("Removing מנצפך pages...");
	var finds;
	app.findGrepPreferences = app.changeGrepPreferences = null;
	app.findGrepPreferences.findWhat = "ם|ן|ץ|ף|ך";
	app.findGrepPreferences.appliedParagraphStyle = nk.TARGET_LETTER_STYLE;
	finds = nk.doc.findGrep(true);
	while (finds.length > 0){
		progressBarWrite("Removing מנצפך pages (" + (finds.length) + ")");
		finds[0].parentTextFrames[0].parentPage.remove();
		finds = nk.doc.findGrep(true);
	}
}

function replaceSofios(){
	progressBarWrite("Replacing sofios...");
	var finds, i, maxLetter, randomLetter;
	var letters = "אבגדהוזחטיכלמנסעפצקרשת";
	// First, add nikkud after all sofios (so that it can be found and replaced later)
	app.findGrepPreferences = app.changeGrepPreferences = null;
	app.findGrepPreferences.findWhat = "(ם|ן|ץ|ף|ךּ|ך)(.+)";
	app.findGrepPreferences.fillColor = nk.BLACK;
	app.changeGrepPreferences.changeTo = "$1ַ";
	nk.doc.changeGrep();
	// Reapply nk.CONDITION1 to the kamatz we just added
	app.findGrepPreferences = app.changeGrepPreferences = null;
	app.findGrepPreferences.findWhat = "ָ"; // Find all kamatz
	app.changeGrepPreferences.appliedConditions = [nk.CONDITION1];
	nk.doc.changeGrep();
	// Now, replace sofios with shin or sin
	app.findGrepPreferences = app.changeGrepPreferences = null;
	app.findGrepPreferences.findWhat = "ם|ן|ץ|ף|ךּ|ך";
	app.findGrepPreferences.fillColor = nk.BLACK;
	finds = nk.doc.findGrep(true);
	for (i = 0; i < finds.length; i++){
		maxLetter = finds[i].parentStory.textContainers[0].parentPage.label;
		if (!maxLetter){
			continue;
		}
		do {
			randomLetter = letters[Math.floor(Math.random() * letters.length)];
		}
		while (randomLetter > maxLetter);
		finds[i].contents = randomLetter;
	}
}


function setGREPPrefs(){
	// Clear and set GREP Prefs
	app.findGrepPreferences = app.changeGrepPreferences = null;
	with (app.findChangeGrepOptions){
		if (app.findChangeGrepOptions.hasOwnProperty("includeFootnotes")) includeFootnotes = true;
		if (app.findChangeGrepOptions.hasOwnProperty("includeHiddenLayers")) includeHiddenLayers = true;
		if (app.findChangeGrepOptions.hasOwnProperty("includeLockedLayersForFind")) includeLockedLayersForFind = true;
		if (app.findChangeGrepOptions.hasOwnProperty("includeLockedStoriesForFind")) includeLockedStoriesForFind = true;
		if (app.findChangeGrepOptions.hasOwnProperty("includeMasterPages")) includeMasterPages = true;
		if (app.findChangeGrepOptions.hasOwnProperty("kanaSensitive")) kanaSensitive = false;
		if (app.findChangeGrepOptions.hasOwnProperty("searchBackwards")) searchBackwards = false;
		if (app.findChangeGrepOptions.hasOwnProperty("widthSensitive")) widthSensitive = true;
	}
}


// Ensures nikkud was typed in the correct way and removes double kamatz
function tidyFile(){
	// This routine will make sure that all nikkud in the document is in the right order to display correctly
	// the nikkud string lists the order the nikkud should appear in, backwards.
	// It also replaces pre-composed glyphs with constructed glyphs
	var precomposed = "שׁ|שׂ|שּׁ|שּׂ|אַ|אָ|אּ|בּ|גּ|דּ|הּ|וּ|זּ|טּ|יּ|ךּ|כּ|לּ|מּ|נּ|סּ|ףּ|פּ|צּ|קּ|רּ|שּ|תּ|וֹ||".split("|");
	var constructed = "שׁ|שׂ|שּׁ|שּׂ|אַ|אָ|אְ|בּ|גּ|דּ|הּ|וּ|זּ|טּ|יּ|ךּ|כּ|לּ|מּ|נּ|סּ|ףּ|פּ|צּ|קּ|רּ|שּ|תּ|וֹ|לֹּ|לֹ".split("|");
	app.findGrepPreferences = app.changeGrepPreferences = null;
	for (var a = 0; a < precomposed.length; a++){
		progressBarWrite("Tidying file (precomposed " + a + "/" + precomposed.length +")...");
		app.findGrepPreferences.findWhat = precomposed[a];
		app.changeGrepPreferences.changeTo = constructed[a];
		nk.doc.changeGrep();
	}
	var nikkud = "ְֱֲֳִֵֶַָֹֻּׁׂ";
	app.findGrepPreferences = app.changeGrepPreferences = NothingEnum.nothing;
	app.findGrepPreferences.findWhat = "["+nikkud+"]"+"["+nikkud+"]+";
	var myFinds  = nk.doc.findGrep();
	var myFindsLength = myFinds.length;
	for (a=0; a<2; a++){
		for (var i=0; i<myFindsLength; i++){
			progressBarWrite("Tidying file (nikkud order " + i + "/" + myFindsLength +")...");
			myFinds[i].contents = myFinds[i].contents.split("").sort(myCompare).join("");
		}
	}

	function myCompare(a,b){
		return nikkud.indexOf(a) - nikkud.indexOf(b);
	}

	app.findGrepPreferences = app.changeGrepPreferences = null;
	app.findGrepPreferences.findWhat = "[ִַָֻ]{2,}";
	app.changeGrepPreferences.changeTo = "ָ";
	nk.doc.changeGrep();
}

function updateTargetLetter(s){
	nk.progress.text.text = "Updating target letter...";
	nk.progress.window.update();
	var finds, i, theLetter;
	app.findGrepPreferences = app.changeGrepPreferences = null;
	app.findGrepPreferences.appliedParagraphStyle = nk.TARGET_LETTER_STYLE;
	app.findGrepPreferences.findWhat = "^[א-ת][ּׁׂ]?"; // Hebrew letter followed by dagesh or shin-dot or sin-dot
	finds = nk.doc.findGrep(true);
	for (i = 0; i < finds.length; i++){
		theLetter = finds[i].contents;
		finds[i].paragraphs[0].contents = s.replace(/ת/g, theLetter);
	}
	// Redo for target letter in directions
	if (nk.TARGET_LETTER_SMALL_STYLE.isValid){
		app.findGrepPreferences.appliedParagraphStyle = nk.TARGET_LETTER_SMALL_STYLE;
		finds = nk.doc.findGrep(true);
		for (i = 0; i < finds.length; i++){
			theLetter = finds[i].contents;
			finds[i].paragraphs[0].contents = s.replace(/ת/g, theLetter);
		}
	}
}
