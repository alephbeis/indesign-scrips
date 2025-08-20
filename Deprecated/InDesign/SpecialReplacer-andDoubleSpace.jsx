change("([א-הח-ת])([ְֱֲֳִֵֶַָֹֻׁׂ]+)(ּ)","$1$3$2");//

change("\\x{FB2E}","\\x{00DA}\\x{05B7}");
change("\\x{FB30}","\\x{00DA}\\x{05BC}");
change("\\x{FB2F}","\\x{00DA}\\x{05B8}");
change("\\x{FB31}","\\x{05D1}\\x{05BC}");
change("\\x{FB4C}","\\x{05D1}\\x{05BF}");
change("\\x{FB32}","\\x{05D2}\\x{05BC}");
change("\\x{FB33}","\\x{05D3}\\x{05BC}");
change("\\x{FB34}","\\x{05D4}\\x{05BC}");
change("\\x{FB35}","\\x{05D5}\\x{05BC}");
change("\\x{E801}","\\x{05D5}\\x{05B9}");
change("\\x{FB4B}","\\x{05D5}\\x{05B9}");
change("\\x{FB36}","\\x{05D6}\\x{05BC}");
change("\\x{FB38}","\\x{05D8}\\x{05BC}");
change("\\x{FB39}","\\x{05D9}\\x{05BC}");
change("\\x{FB1D}","\\x{05D9}\\x{05B4}");
change("\\x{FB3B}","\\x{05DB}\\x{05BC}");
change("\\x{FB3A}","\\x{05DA}\\x{05BC}");
change("\\x{E803}","\\x{05DA}\\x{05B8}");
change("\\x{FB4D}","\\x{05DB}\\x{05BF}");
change("\\x{E802}","\\x{05DA}\\x{05B0}");
change("\\x{FB3C}","\\x{05DC}\\x{05BC}");
change("\\x{E805}","\\x{05DC}\\x{05BC}\\x{05B9}");
change("\\x{E804}","\\x{05DC}\\x{05B9}");
change("\\x{FB3E}","\\x{05DE}\\x{05BC}");
change("\\x{FB40}","\\x{05E0}\\x{05BC}");
change("\\x{FB41}","\\x{05E1}\\x{05BC}");
change("\\x{FB43}","\\x{05E3}\\x{05BC}");
change("\\x{FB44}","\\x{05E4}\\x{05BC}");
change("\\x{FB4E}","\\x{05E4}\\x{05BF}");
change("\\x{FB46}","\\x{05E6}\\x{05BC}");
change("\\x{FB47}","\\x{05E7}\\x{05BC}");
change("\\x{FB48}","\\x{05E8}\\x{05BC}");
change("\\x{FB49}","\\x{05E9}\\x{05BC}");
change("\\x{FB2B}","\\x{05E9}\\x{05C2}");
change("\\x{FB2D}","\\x{05E9}\\x{05BC}\\x{05C2}");
change("\\x{FB2A}","\\x{05E9}\\x{05C1}");
change("\\x{FB2C}","\\x{05E9}\\x{05BC}\\x{05C1}");
change("\\x{FB4A}","\\x{05EA}\\x{05BC}");

//remove double space
change("\\x{0020}\\x{0020}","\\x{0020}");

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
