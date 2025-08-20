change("\\x{05B7}\\x{05B7}","\\x{05B7}"); // change double mark to single
change("\\x{05B7}\\x{05B7}","\\x{05B7}"); // run twice to remove tipple mark
change("פתח","צירי");
change("\\x{05B7}","\\x{05B5}");

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
