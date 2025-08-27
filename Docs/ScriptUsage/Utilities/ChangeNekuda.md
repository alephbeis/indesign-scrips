# Change Nekuda - Comprehensive Script

## Overview

The Change Nekuda script provides a flexible interface for converting one Hebrew vowel mark (nekuda/niqqud) to another across your content. The UI uses a **three-column layout**:

- **Change From** (Left Column): Lists all nekudos in their original order, but only enables those found in the currently selected scope
- **Change To** (Middle Column): Lists all supported nekudos in their original order (always available; requires explicit choice)
- **Scope** (Right Column): Choose between All Documents, Document, Page, Story, Frame, or Selected Text (options not applicable appear disabled rather than hidden)

## Usage

1. Open an InDesign document containing Hebrew text with vowel marks
2. Run the `ChangeNekuda.jsx` script from the Scripts panel
3. The dialog automatically scans the currently selected scope and enables only nekudos found in the Change From column (left). All Change To options (middle column) remain enabled.
4. **Conditional Activation**: When you change the scope selection (right column), the script rescans and updates which Change From options are available
5. In Change From, select the nekuda you want to replace (only enabled options can be selected)
6. In Change To, select the target nekuda (the list starts with no selection and requires your choice)  
7. Choose the scope (All Documents, Document, Page, Story, Frame, or Selected Text)
   - Note: Selected Text is available only when a text range is selected. If the cursor is inserted (caret) with no selection, this option is disabled.
8. Click Run to execute the change. The script shows a completion message indicating whether changes were made

## Supported Hebrew Vowel Marks

The script supports the following nekudos in their original order as they appear in the interface:

1. Kamatz (קמץ) - \u05B8
2. Pasach (פתח) - \u05B7
3. Tzeirei (צירי) - \u05B5
4. Segol (סגול) - \u05B6
5. Sheva (שבא) - \u05B0
6. Cholam Chaser (חולם חסר) - \u05B9
7. Cholam Malei (חולם מלא) - \u05D5\u05B9 *(composed form)*
8. Chirik Chaser (חיריק חסר) - \u05B4
9. Chirik Malei (חיריק מלא) - \u05B4\u05D9 *(composed form)*
10. Kubutz (קובוץ) - \u05BB
11. Shuruk (שורוק) - \u05D5\u05BC *(composed form)*
12. Chataf Kamatz (חטף קמץ) - \u05B3
13. Chataf Pasach (חטף פתח) - \u05B2
14. Chataf Segol (חטף סגול) - \u05B1
15. Shin Dot (נקודת שׁ) - \u05C1
16. Sin Dot (נקודת שׂ) - \u05C2

## Features

- Precise Control: Choose exactly which nekuda to convert from and to
- Dynamic Scanning: Enables only nekudos actually present in the chosen scope
- Comprehensive Scope Options: Apply to selection, story, page, document, or all open documents
- Smart Validation: Prevents identical source/target selections; requires explicit Change To choice
- Clear Feedback: Simple completion messages indicating whether any replacements occurred
- Unicode-Based: Uses proper Unicode patterns for reliable matching
- Proper Undo: Each operation is wrapped in a single undo step named "Change Nekuda"
- Error Handling: Validations with user-friendly messages; safe fallbacks
- Performance Optimized: Uses GREP-based operations and minimizes redraw during processing

## Technical Details

The script uses GREP find/replace with Unicode escape sequences for precise nekuda matching and replacement:

- Find/change preferences are reset before and after usage to avoid conflicts
- Includes content in footnotes, on hidden and locked layers, and in master stories when appropriate
- Scope resolution is handled via shared utilities to determine the correct text targets
- Uses everyItem().getElements() patterns to batch operations efficiently
- Entry points are wrapped with app.doScript(..., UndoModes.ENTIRE_SCRIPT, "Change Nekuda")
- Global preferences (measurement units, redraw state) are explicitly set and reliably restored in finally blocks
- Object specifiers are validated and .isValid is checked before operations

## Compatibility

This script follows the project's engineering best practices and is compatible with modern InDesign versions. It uses ExtendScript (JSX) format for maximum compatibility across InDesign releases.
