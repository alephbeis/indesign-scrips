# Delete Hebrew Marks - Comprehensive Script

## Overview

The Delete Hebrew Marks script provides a flexible interface for removing various types of Hebrew diacritical marks from text. The script offers precise control over what to remove and where to apply the deletions:

- **Nikud**: Hebrew vowel points (nikud/nekudos)
- **Teamim**: Hebrew cantillation marks (teamim)
- **Meteg**: Meteg marks with conditional or complete removal options
- **All Marks**: Combined removal of all the above
- **Flexible Scope**: Choose between All Documents, Document, Page, Story, Frame, or Selected Text (options that are not applicable appear disabled rather than hidden)

## Usage

1. Open an InDesign document containing Hebrew text with diacritical marks
2. Run the `DeleteHebrewMarks.jsx` script from the Scripts panel
3. In the dialog, select what type of marks to remove:
   - **Nikud**: Removes all Hebrew vowel points
   - **Teamim**: Removes all cantillation marks
   - **Meteg not preceded by a Kamatz**: Removes meteg marks except when following a Kamatz vowel
   - **All Meteg**: Removes all meteg marks regardless of context
   - **All of the above**: Removes all Hebrew marks
4. Choose the scope (All Documents, Document, Page, Story, Frame, or Selected Text)
   - Note: "Selected Text" is available only when a text range is selected. If the cursor is inserted (caret) with no selection, this option is disabled.
5. Click "Run" to execute the deletion
6. The script will show a completion message indicating whether any marks were found and removed (no per-scope counts are displayed)

## Supported Hebrew Marks

### Nikud (Vowel Points)
The script removes these Hebrew vowel marks using Unicode patterns:
- Sheva (שוא) - \u05B0
- Chataf Segol (חטף סגול) - \u05B1
- Chataf Pasach (חטף פתח) - \u05B2
- Chataf Kamatz (חטף קמץ) - \u05B3
- Chirik (חיריק) - \u05B4
- Tzeirei (צירי) - \u05B5
- Segol (סגול) - \u05B6
- Pasach (פתח) - \u05B7
- Kamatz (קמץ) - \u05B8
- Cholam (חולם) - \u05B9
- Kubutz (קובוץ) - \u05BB
- Dagesh/Shuruk (דגש/שורוק) - \u05BC
- Shin dot (נקודת שין) - \u05C1
- Sin dot (נקודת שין שמאלית) - \u05C2
- And additional vowel marks through \u05C7

### Teamim (Cantillation Marks)
The script removes Hebrew cantillation marks including:
- All standard teamim from \u0591 through \u05AF
- Geresh (\u05F3) and Gershayim (\u05F4)

### Meteg
- **Conditional Removal**: Removes meteg (\u05BD) only when NOT preceded by Kamatz (\u05B8)
- **Complete Removal**: Removes all meteg marks regardless of context

## Features

- **Precise Control**: Choose exactly which type of marks to remove
- **Smart Meteg Handling**: Option to preserve meteg when preceded by Kamatz
- **Comprehensive Scope Options**: Apply to selection, story, page, document, or all documents
- **Clear Feedback**: Simple completion messages indicating whether any marks were removed
- **Unicode-Based**: Uses proper Unicode patterns for reliable mark detection
- **Proper Undo**: Each operation is wrapped in a single undo step named "Delete Hebrew Marks"
- **Error Handling**: Comprehensive validation with user-friendly error messages
- **Performance Optimized**: Efficient GREP-based find/replace operations

## Technical Details

The script uses GREP find/replace with Unicode escape sequences for precise mark matching:
- Each mark type has its own dedicated function with specific Unicode patterns
- The `changeAcrossTargets` function handles bulk operations across multiple text objects
- Scope resolution automatically determines the correct text targets based on user selection

Key technical features:
- Proper find/change preferences cleanup to avoid conflicts
- Robust error handling for invalid selections or missing text
- Support for complex text objects including stories, pages, and multi-document operations
- Efficient pattern matching using negative lookbehind for conditional meteg removal

## Compatibility

This script follows the project's engineering best practices and is compatible with modern InDesign versions. It uses ExtendScript (JSX) format for maximum compatibility across InDesign releases.
