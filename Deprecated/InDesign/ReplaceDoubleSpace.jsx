
change("\\x{0020}\\x{0020}","\\x{0020}");

   function change(find,change){
    app.findGrepPreferences = null;
    app.changeGrepPreferences = null;
    app.findGrepPreferences.findWhat =find;
    app.changeGrepPreferences.changeTo=change;
    app.activeDocument.changeGrep(true);
    app.findGrepPreferences = null;
    app.changeGrepPreferences = null;
    }
