# Change Nekuda - Unified Script

## Overview


## Usage

1. Open an InDesign document
2. Run the `ChangeNekuda.jsx` script from the Scripts panel
3. Select your desired transformation from the dialog
4. Choose the scope (Document, Selection, or All Documents)
5. Click "Run" to execute the transformation

## Available Transformations

The script provides the following Hebrew vowel transformations:

1. **Kamatz → Pasach** - Change Kamatz (קמץ) to Pasach (פתח)
2. **Pasach → Tzeirei** - Change Pasach (פתח) to Tzeirei (צירי)
3. **Tzeirei → Segol** - Change Tzeirei (צירי) to Segol (סגול)
4. **Segol → Sheva** - Change Segol (סגול) to Sheva (שוא)
5. **Sheva → Chirik Chaser** - Change Sheva (שוא) to Chirik Chaser (חיריק חסר)
6. **Chirik Chaser → Chirik Male** - Change Chirik Chaser (חיריק חסר) to Chirik Male (חיריק מלא)
7. **Chirik Male → Kubutz** - Change Chirik Male (חיריק מלא) to Kubutz (קבוץ)
8. **Kubutz → Shuruk** - Change Kubutz (קבוץ) to Shuruk (שורוק)
9. **Shuruk → Cholam Chaser** - Change Shuruk (שורוק) to Cholam Chaser (חולם חסר)
10. **Cholam Chaser → Cholam Male** - Change Cholam Chaser (חולם חסר) to Cholam Male (חולם מלא)
11. **Cholam Male → Pasach** - Change Cholam Male (חולם מלא) to Pasach (פתח)

## Features

- **Unified Interface**: Single dialog for all transformations
- **Scope Selection**: Choose between All Documents, Document (active), Story (from selection), Page (active), or Selection
- **Proper Undo**: Each transformation is wrapped in a single undo step
- **Performance Optimized**: Disables redraw during operations for better performance
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Best Practices**: Follows project coding standards and UI conventions

## Technical Details

Each transformation performs both Hebrew text replacements and Unicode character replacements:
- Hebrew text names (e.g., "פתח" → "צירי")
- Unicode vowel marks (e.g., \x{05B7} → \x{05B5})

The script maintains the same find/change options as the original scripts:
- Includes footnotes, hidden layers, and master pages
- Includes locked layers and stories for find operations
- Uses GREP find/replace for pattern matching

## Archive

The original individual scripts (00-09) have been preserved in the `Archive/` directory for reference and potential rollback if needed.

## Compatibility

This script follows the project's engineering best practices and is compatible with modern InDesign versions. It uses ExtendScript (JSX) format for maximum compatibility across InDesign releases.