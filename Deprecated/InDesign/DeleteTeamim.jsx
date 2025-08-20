
change("(\\x{0591}|\\x{0592}|\\x{0593}|\\x{0594}|\\x{0595}|\\x{0596}|\\x{0597}|\\x{0598}|\\x{0599}|\\x{059A}|\\x{059B}|\\x{059C}|\\x{059D}|\\x{05AE}|\\x{059E}|\\x{059F}|\\x{05A0}|\\x{05A1}|\\x{05A2}|\\x{05A3}|\\x{05A4}|\\x{05A5}|\\x{05A6}|\\x{05A7}|\\x{05A8}|\\x{05A9}|\\x{05AA}|\\x{05AB}|\\x{05AC}|\\x{05AD}|\\x{05AF}|\\x{05F3}|\\x{05F4})","");

   function change(find,change){
    app.findGrepPreferences = null;
    app.changeGrepPreferences = null;
    app.findGrepPreferences.findWhat =find;
    app.changeGrepPreferences.changeTo=change;
    app.activeDocument.changeGrep(true);  
    //אפס שוב סגנונות
    app.findGrepPreferences = null;
    app.changeGrepPreferences = null;
    }