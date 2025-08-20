/*
 CharacterCleanup (formerly FullSweep): consolidated GREP replacements into a single array and loop.
 Preserves behavior and order. Adds a guard for no open document. Resets GREP prefs safely.
*/

(function () {
    if (!app || !app.documents || app.documents.length === 0) {
        alert("Open a document before running CharacterCleanup.");
        return;
    }

    var replacements = [
        ["([א-הח-ת])([ְֱֲֳִֵֶַָֹֻׁׂ]+)(ּ)","$1$3$2"],

        ["\\x{FB2E}","\\x{00DA}\\x{05B7}"],
        ["\\x{FB30}","\\x{00DA}\\x{05BC}"],
        ["\\x{FB2F}","\\x{00DA}\\x{05B8}"],
        ["\\x{FB31}","\\x{05D1}\\x{05BC}"],
        ["\\x{FB4C}","\\x{05D1}\\x{05BF}"],
        ["\\x{FB32}","\\x{05D2}\\x{05BC}"],
        ["\\x{FB33}","\\x{05D3}\\x{05BC}"],
        ["\\x{FB34}","\\x{05D4}\\x{05BC}"],
        ["\\x{FB35}","\\x{05D5}\\x{05BC}"],
        ["\\x{E801}","\\x{05D5}\\x{05B9}"],
        ["\\x{FB4B}","\\x{05D5}\\x{05B9}"],
        ["\\x{FB36}","\\x{05D6}\\x{05BC}"],
        ["\\x{FB38}","\\x{05D8}\\x{05BC}"],
        ["\\x{FB39}","\\x{05D9}\\x{05BC}"],
        ["\\x{FB1D}","\\x{05D9}\\x{05B4}"],
        ["\\x{FB3B}","\\x{05DB}\\x{05BC}"],
        ["\\x{FB3A}","\\x{05DA}\\x{05BC}"],
        ["\\x{E803}","\\x{05DA}\\x{05B8}"],
        ["\\x{FB4D}","\\x{05DB}\\x{05BF}"],
        ["\\x{E802}","\\x{05DA}\\x{05B0}"],
        ["\\x{FB3C}","\\x{05DC}\\x{05BC}"],
        ["\\x{E805}","\\x{05DC}\\x{05BC}\\x{05B9}"],
        ["\\x{E804}","\\x{05DC}\\x{05B9}"],
        ["\\x{FB3E}","\\x{05DE}\\x{05BC}"],
        ["\\x{FB40}","\\x{05E0}\\x{05BC}"],
        ["\\x{FB41}","\\x{05E1}\\x{05BC}"],
        ["\\x{FB43}","\\x{05E3}\\x{05BC}"],
        ["\\x{FB44}","\\x{05E4}\\x{05BC}"],
        ["\\x{FB4E}","\\x{05E4}\\x{05BF}"],
        ["\\x{FB46}","\\x{05E6}\\x{05BC}"],
        ["\\x{FB47}","\\x{05E7}\\x{05BC}"],
        ["\\x{FB48}","\\x{05E8}\\x{05BC}"],
        ["\\x{FB49}","\\x{05E9}\\x{05BC}"],
        ["\\x{FB2B}","\\x{05E9}\\x{05C2}"],
        ["\\x{FB2D}","\\x{05E9}\\x{05BC}\\x{05C2}"],
        ["\\x{FB2A}","\\x{05E9}\\x{05C1}"],
        ["\\x{FB2C}","\\x{05E9}\\x{05BC}\\x{05C1}"],
        ["\\x{FB4A}","\\x{05EA}\\x{05BC}"],

        // remove double space
        ["\\x{0020}\\x{0020}","\\x{0020}"],
        // remove explicit numeric prefixes at the start of paragraphs (typed numbers only, not auto-numbering)
        ["^\\d+\\.\\s*",""]
    ];

    for (var i = 0; i < replacements.length; i++) {
        var pair = replacements[i];
        change(pair[0], pair[1]);
    }

    function change(find, replaceTo) {
        // Reset preferences, run, and always reset again
        try {
            app.findGrepPreferences = null;
            app.changeGrepPreferences = null;
            app.findGrepPreferences.findWhat = find;
            app.changeGrepPreferences.changeTo = replaceTo;
            app.activeDocument.changeGrep(true);
        } catch (e) {
            // swallow to continue processing other replacements
        } finally {
            app.findGrepPreferences = null;
            app.changeGrepPreferences = null;
        }
    }
})();
