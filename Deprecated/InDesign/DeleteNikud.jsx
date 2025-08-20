
change("(\\x{05B0}|\\x{05B1}|\\x{05B2}|\\x{05B3}|\\x{05B4}|\\x{05B5}|\\x{05B6}|\\x{05B7}|\\x{05B8}|\\x{05B9}|\\x{05BA}|\\x{05BB}|\\x{05BC}|\\x{05BD}|\\x{05BE}|\\x{05BF}|\\x{05C0}|\\x{05C0}|\\x{05C2}|\\x{05C3}|\\x{05C4}|\\x{05C5}|\\x{05C7})","");

   function change(find,change){
    app.findGrepPreferences = null;
    app.changeGrepPreferences = null;
    app.findGrepPreferences.findWhat =find;
    app.changeGrepPreferences.changeTo=change;
    app.activeDocument.changeGrep(true);
    app.findGrepPreferences = null;
    app.changeGrepPreferences = null;
    }
