// Hebrew Marks Deletion Script
// Combines functionality to delete Nikud, Teamim, Meseg, or combination

// Create dialog with radio buttons for user selection
function createDialog() {
    var dialog = new Window("dialog", "Hebrew Marks Deletion");
    dialog.orientation = "column";
    dialog.alignChildren = "left";
    dialog.spacing = 10;
    dialog.margins = 16;
    
    // Add title
    var titleGroup = dialog.add("group");
    titleGroup.add("statictext", undefined, "Choose what to remove from Hebrew text:");
    
    // Add radio button group
    var radioGroup = dialog.add("panel", undefined, "Options");
    radioGroup.orientation = "column";
    radioGroup.alignChildren = "left";
    radioGroup.spacing = 8;
    radioGroup.margins = 16;
    
    // Add radio buttons
    var nikudRadio = radioGroup.add("radiobutton", undefined, "Nikud");
    var teamimRadio = radioGroup.add("radiobutton", undefined, "Teamim");
    var mesegConditionalRadio = radioGroup.add("radiobutton", undefined, "Meteg not preceded by a Kamatz");
    var mesegAllRadio = radioGroup.add("radiobutton", undefined, "All Meteg");
    var allRadio = radioGroup.add("radiobutton", undefined, "All of the above");
    
    // Set default selection
    nikudRadio.value = true;
    
    // Add buttons
    var buttonGroup = dialog.add("group");
    buttonGroup.alignment = "center";
    var okButton = buttonGroup.add("button", undefined, "OK");
    var cancelButton = buttonGroup.add("button", undefined, "Cancel");
    
    // Button event handlers
    okButton.onClick = function() {
        dialog.close(1);
    };
    
    cancelButton.onClick = function() {
        dialog.close(0);
    };
    
    // Show dialog and get result
    var result = dialog.show();
    
    if (result === 1) {
        // Determine which option was selected
        if (nikudRadio.value) {
            return "Nikud";
        } else if (teamimRadio.value) {
            return "Teamim";
        } else if (mesegConditionalRadio.value) {
            return "Meteg not preceded by a Kamatz";
        } else if (mesegAllRadio.value) {
            return "All Meteg";
        } else if (allRadio.value) {
            return "All of the above";
        }
    }
    
    return null; // User cancelled
}

// Get user selection and execute appropriate function
var userChoice = createDialog();

if (userChoice !== null) {
    switch (userChoice) {
        case "Nikud":
            deleteNikud();
            break;
        case "Teamim":
            deleteTeamim();
            break;
        case "Meteg not preceded by a Kamatz":
            deleteMesegConditional();
            break;
        case "All Meteg":
            deleteMesegAll();
            break;
        case "All of the above":
            var nikudCount = deleteNikud(true);
            var teamimCount = deleteTeamim(true);
            var mesegCount = deleteMesegAll(true);
            var totalCount = nikudCount + teamimCount + mesegCount;
            if (totalCount === 0) {
                alert("There was nothing to delete.");
            } else {
                alert(
                    "All Hebrew marks deletion completed!\n\nSummary:\n" +
                    "• " + countWithNoun(nikudCount, "vowel point", "vowel points") + " (nikud) removed\n" +
                    "• " + countWithNoun(teamimCount, "cantillation mark", "cantillation marks") + " (teamim) removed\n" +
                    "• " + countWithNoun(mesegCount, "meteg mark", "meteg marks") + " removed\n\n" +
                    "Total: " + countWithNoun(totalCount, "mark", "marks") + " removed."
                );
            }
            break;
    }
}

// Helper to show consistent confirmation messages with proper grammar
function notifyDeletion(context, count, singularNoun, pluralNoun) {
    if (count > 0) {
        var noun = (count === 1) ? singularNoun : pluralNoun;
        var verb = (count === 1) ? "was" : "were";
        var formattedCount = formatNumber(count);
        alert(context + " completed.\n" + formattedCount + " " + noun + " " + verb + " removed.");
    } else {
        alert("There was nothing to delete.");
    }
}

function countWithNoun(count, singular, plural) {
    var formatted = formatNumber(count);
    return formatted + " " + ((count === 1) ? singular : plural);
}

function deleteNikud(silent) {
    // Hebrew vowel points (nikud)
    var nikudPattern = "(\\x{05B0}|\\x{05B1}|\\x{05B2}|\\x{05B3}|\\x{05B4}|\\x{05B5}|\\x{05B6}|\\x{05B7}|\\x{05B8}|\\x{05B9}|\\x{05BA}|\\x{05BB}|\\x{05BC}|\\x{05BD}|\\x{05BE}|\\x{05BF}|\\x{05C0}|\\x{05C2}|\\x{05C3}|\\x{05C4}|\\x{05C5}|\\x{05C7})";
    var count = changeText(nikudPattern, "");
    if (!silent) {
        notifyDeletion("Nikud deletion", count, "vowel point", "vowel points");
    }
    return count;
}

function deleteTeamim(silent) {
    // Hebrew cantillation marks (teamim)
    var teamimPattern = "(\\x{0591}|\\x{0592}|\\x{0593}|\\x{0594}|\\x{0595}|\\x{0596}|\\x{0597}|\\x{0598}|\\x{0599}|\\x{059A}|\\x{059B}|\\x{059C}|\\x{059D}|\\x{05AE}|\\x{059E}|\\x{059F}|\\x{05A0}|\\x{05A1}|\\x{05A2}|\\x{05A3}|\\x{05A4}|\\x{05A5}|\\x{05A6}|\\x{05A7}|\\x{05A8}|\\x{05A9}|\\x{05AA}|\\x{05AB}|\\x{05AC}|\\x{05AD}|\\x{05AF}|\\x{05F3}|\\x{05F4})";
    var count = changeText(teamimPattern, "");
    if (!silent) {
        notifyDeletion("Teamim deletion", count, "cantillation mark", "cantillation marks");
    }
    return count;
}

function deleteMesegConditional(silent) {
    // Meteg (\x{05BD}) but only when NOT preceded by qamatz (\x{05B8})
    // This uses negative lookbehind to preserve meteg when it follows qamatz
    // The reason for this condition is that meteg after qamatz indicates a different pronunciation
    var mesegPattern = "(?<!\\x{05B8})\\x{05BD}";
    var count = changeText(mesegPattern, "");
    if (!silent) {
        notifyDeletion("Meteg (selective) deletion", count, "meteg mark (not preceded by a Kamatz)", "meteg marks (not preceded by a Kamatz)");
    }
    return count;
}

function deleteMesegAll(silent) {
    // Delete all meteg characters (\x{05BD}) regardless of context
    var mesegPattern = "\\x{05BD}";
    var count = changeText(mesegPattern, "");
    if (!silent) {
        notifyDeletion("Meteg (all) deletion", count, "meteg mark", "meteg marks");
    }
    return count;
}

function changeText(findPattern, replaceText) {
    // Reset preferences
    app.findGrepPreferences = null;
    app.changeGrepPreferences = null;

    // Set the find pattern
    app.findGrepPreferences.findWhat = findPattern;

    // Count how many matches exist BEFORE performing the change
    var doc = app.activeDocument;
    var matches = doc.findGrep();
    var count = matches ? matches.length : 0;

    // Perform the change
    app.changeGrepPreferences.changeTo = replaceText;
    doc.changeGrep(true);

    // Reset preferences again to avoid side effects
    app.findGrepPreferences = null;
    app.changeGrepPreferences = null;

    // Return the numeric count of deletions performed
    return count;
}


// Formats integer numbers with comma thousands separators (e.g., 1,234,567)
function formatNumber(n) {
    var s = String(n);
    var isNeg = (s.charAt(0) === "-");
    var x = isNeg ? s.substring(1) : s;
    // Insert commas every three digits from the right
    var formatted = x.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
    return isNeg ? ("-" + formatted) : formatted;
}