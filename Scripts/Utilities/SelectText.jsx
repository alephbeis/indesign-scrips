/*
 SelectText: selects all text from the current cursor (or end of current selection)
 to the end of the story. Uses guards and early returns per project standards.
*/

/* global UIUtils */
// Load shared utilities
var scriptFile = File($.fileName);
var utilsFile = File(scriptFile.parent.parent + "/Shared/InDesignUtils.jsx");
if (utilsFile.exists) $.evalFile(utilsFile);
var uiUtilsFile = File(scriptFile.parent.parent + "/Shared/UIUtils.jsx");
if (uiUtilsFile.exists) $.evalFile(uiUtilsFile);

(function () {
    // Use shared alert function
    var alert = function (message) {
        UIUtils.alert(message, "Select Text");
    };

    // Guard: ensure document is available
    var doc = InDesignUtils.Objects.getActiveDocument();
    if (!doc) {
        alert("Open a document before running SelectText.");
        return;
    }

    // Guard: ensure we have a selection
    var selection = InDesignUtils.Objects.getSelection();
    if (!selection) {
        alert("Place the cursor in a text frame or select text first.");
        return;
    }

    var sel = selection[0];
    if (sel.constructor.name !== "Text" && sel.constructor.name !== "InsertionPoint") {
        alert("Place the cursor in a text frame or select text first.");
        return;
    }

    // Determine story and starting index
    var story = sel.parentStory;
    var startIndex;
    if (sel.constructor.name === "Text") {
        startIndex = sel.index + sel.length; // after current selection
    } else {
        // InsertionPoint
        startIndex = sel.index; // from cursor
    }

    // Compute end index (inclusive)
    var endIndex = story.length - 1;

    // If already at or beyond end, inform and exit
    if (startIndex >= endIndex) {
        alert("Cursor is already at or past the end of the story.");
        return;
    }

    // Select the range
    try {
        var textRange = story.characters.itemByRange(startIndex, endIndex);
        textRange.select();
    } catch (e) {
        alert("Selection failed: " + e);
    }
})();
