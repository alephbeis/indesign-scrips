# Select Text - Text Selection Utility

## Overview

The Select Text script provides a simple utility for extending text selection from the current cursor position (or end of current selection) to the end of the story. This is useful for:

- **Quick Selection**: Rapidly select large amounts of text from cursor to story end
- **Efficient Editing**: Streamline text selection workflows in long documents
- **Story-Based Operations**: Select text within the context of InDesign's story structure
- **Cursor-Aware**: Works intelligently with both insertion points and existing text selections

## Usage

1. Open an InDesign document containing text
2. Place your cursor at the desired starting point in a text frame, or make a text selection
3. Run the `SelectText.jsx` script from the Scripts panel
4. The script will automatically select all text from your current position to the end of the story

### Selection Behavior

- **From Cursor**: If you have just placed the cursor (insertion point), selection starts from that position
- **From Selection End**: If you have text selected, selection extends from the end of your current selection
- **Story Boundary**: Selection always extends to the end of the current story, not just the current text frame

## Features

- **Smart Selection Logic**: Automatically detects whether you're starting from a cursor or existing selection
- **Story-Aware**: Extends selection to the story boundary, which may span multiple linked text frames
- **Guard Validation**: Comprehensive error checking with user-friendly messages
- **Edge Case Handling**: Intelligently handles situations where cursor is already at story end
- **Lightweight**: Minimal, focused functionality with no unnecessary UI elements
- **Error Recovery**: Graceful failure handling with informative error messages

## Technical Details

The script uses InDesign's story and character range system:
- Detects the parent story of the current selection or insertion point
- Calculates the starting index based on selection type (Text object vs InsertionPoint)
- Uses `story.characters.itemByRange()` for precise character-level selection
- Handles story length calculations to determine the proper end boundary

Key implementation features:
- Early return pattern with comprehensive guards for document and selection validation
- Constructor name checking to distinguish between Text selections and insertion points
- Index-based range calculation for accurate selection boundaries
- Proper error handling with try/catch for selection operations

## Error Handling

The script provides clear feedback for common issues:
- **No Document**: "Open a document before running SelectText."
- **No Text Selection**: "Place the cursor in a text frame or select text first."
- **Already at End**: "Cursor is already at or past the end of the story."
- **Selection Failure**: Details about any technical errors during selection

## Use Cases

- **Document Review**: Quickly select remaining text in a story for formatting or review
- **Bulk Operations**: Select large text ranges as preparation for other script operations
- **Content Management**: Efficiently manage text selections in complex, multi-frame layouts
- **Workflow Optimization**: Reduce manual selection time in repetitive editing tasks

## Compatibility

This script follows the project's engineering best practices using guards, early returns, and proper error handling. It uses ExtendScript (JSX) format for maximum compatibility across InDesign versions and works with InDesign's standard text selection model.