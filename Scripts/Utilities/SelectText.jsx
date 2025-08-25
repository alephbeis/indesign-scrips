/*
 SelectText: selects all text from the current cursor (or end of current selection)
 to the end of the story. Uses guards and early returns per project standards.
*/

(function () {
    // InDesign-style message dialog helper and alert override
    function __showMessage__(title, message) {
        var w = new Window('dialog', title || 'Message');
        w.orientation = 'column';
        w.margins = 16;
        w.spacing = 12;
        var msg = w.add('statictext', undefined, message, { multiline: true });
        msg.characters = 60;
        var row = w.add('group');
        row.alignment = 'right';
        row.spacing = 8;
        var okBtn = row.add('button', undefined, 'OK', { name: 'ok' });
        w.defaultElement = okBtn;
        w.cancelElement = okBtn;
        w.center();
        w.show();
    }
    var alert = function(message) { __showMessage__('Select Text', String(message)); };

    // Guard: ensure InDesign and a document are available
    if (!app || !app.documents || app.documents.length === 0) {
        alert("Open a document before running SelectText.");
        return;
    }

    // Guard: ensure we have a selection
    var sel = (app.selection && app.selection.length > 0) ? app.selection[0] : null;
    if (!sel || (sel.constructor.name !== "Text" && sel.constructor.name !== "InsertionPoint")) {
        alert("Place the cursor in a text frame or select text first.");
        return;
    }

    // Determine story and starting index
    var story = sel.parentStory;
    var startIndex;
    if (sel.constructor.name === "Text") {
        startIndex = sel.index + sel.length; // after current selection
    } else { // InsertionPoint
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