# Change Nekuda - Enhanced Script

## Overview

The Change Nekuda script provides a flexible interface for changing any Hebrew vowel mark (Nekuda) to any other. Unlike the previous version with hardcoded transformations, this enhanced version gives users complete flexibility by:

- **Change From**: Lists all Nekudos. Only those present in the current document are enabled for selection
- **Change To**: Shows all available Nekudos for replacement
- **Full Flexibility**: Allows any combination of Nekuda changes

## Usage

1. Open an InDesign document containing Hebrew text with vowel marks
2. Run the `ChangeNekuda.jsx` script from the Scripts panel
3. The script will automatically scan the document for existing Nekudos
4. In the "Change From" list, select the Nekuda you want to replace (only Nekudos present in the document are enabled)
5. In the "Change To" list, select the target Nekuda (shows all available options). Note: this list starts with no selection and requires you to choose an option.
6. Choose the scope (Document, Selection, Story, Page, Frame, or All Documents)
7. Click "Run" to execute the transformation. If selections are missing, you'll be prompted and the dialog remains open; otherwise, the dialog closes and the script runs, showing a completion message.

## Available Nekudos

The script supports the following Nekudos (in order), only these are supported by the script:

1. **Kamatz** (קמץ) - \u05B8
2. **Pasach** (פתח) - \u05B7
3. **Tzeirei** (צירי) - \u05B5
4. **Segol** (סגול) - \u05B6
5. **Sheva** (שוא) - \u05B0
6. **Cholam Chaser** (חולם חסר) - \u05B9
7. **Cholam Malei** (חולם מלא) - \u05D5\u05B9
8. **Chirik Chaser** (חיריק חסר) - \u05B4
9. **Chirik Malei** (חיריק מלא) - \u05B4\u05D9
10. **Kubutz** (קובוץ) - \u05BB
11. **Shuruk** (שורוק) - \u05D5\u05BC
12. **Chataf Kamatz** (חטף קמץ) - \u05B3
13. **Chataf Pasach** (חטף פתח) - \u05B2
14. **Chataf Segol** (חטף סגול) - \u05B1
15. **Shin Dot** (נקודת שין) - \u05C1
16. **Sin Dot** (נקודת שין שמאלית) - \u05C2

## Features

- **Dynamic Scanning**: Automatically scans document to show only Nekudos that are actually present
- **Flexible Selection**: Change From dropdown shows found Nekudos with occurrence counts; Change To shows all available options
- **Full Unicode Support**: Works with all Hebrew vowel marks and diacritics using proper Unicode characters
- **Scope Selection**: Choose between Document (active), Selection, Story, Page, or All Documents
- **Proper Undo**: Each change operation is wrapped in a single undo step
- **Performance Optimized**: Disables redraw during operations for better performance
- **Error Handling**: Comprehensive error handling with user-friendly messages and confirmations
- **Smart Validation**: Prevents identical source/target selections and validates user input

## Technical Details

The enhanced script uses a comprehensive definition system for all Hebrew vowel marks:
- Each Nekuda includes Hebrew name, Unicode escape sequence, and character representation
- Document scanning uses GREP search to count occurrences of each Unicode character
- Changes are performed using Unicode-based find/replace for precise character matching

Key improvements over the original version:
- Dynamic content detection instead of hardcoded transformations
- User-driven selection instead of predefined pairs
- Real-time document analysis with occurrence counting
- Enhanced UI with preview functionality

The script maintains robust find/change options:
- Includes footnotes, hidden layers, and master pages
- Includes locked layers and stories for find operations
- Uses GREP find/replace for reliable Unicode pattern matching

## Compatibility

This enhanced script follows the project's engineering best practices and is compatible with modern InDesign versions. It uses ExtendScript (JSX) format for maximum compatibility across InDesign releases.