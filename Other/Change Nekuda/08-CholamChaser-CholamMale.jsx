change("חולם חסר","חולם מלא");//
change("\\x{05B9}","\\x{05D5}\\x{05B9}");

app.findChangeGrepOptions.properties = {
 includeFootnotes : true,
 includeHiddenLayers : true,
 includeMasterPages : true,
 includeLockedLayersForFind : true,
 includeLockedStoriesForFind : true
}

function change(find,change){
 app.findGrepPreferences = null;
 app.changeGrepPreferences = null;
 app.findGrepPreferences.findWhat = find;
 app.changeGrepPreferences.changeTo = change;
 app.activeDocument.changeGrep(true);
 app.findGrepPreferences = null;
 app.changeGrepPreferences = null;
}
