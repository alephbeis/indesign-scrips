change("צירי","סגול");//
change("\\x{05B5}","\\x{05B6}");

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
