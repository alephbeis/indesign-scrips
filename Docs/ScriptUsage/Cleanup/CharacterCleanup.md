# Character Cleanup - Hebrew Text Normalization Script

## Overview

The `CharacterCleanup.jsx` script provides comprehensive Hebrew text cleanup through multiple GREP-based operations. This powerful tool consolidates various text normalization tasks into a single interface, allowing users to fix Hebrew character ordering, normalize presentation forms, remove formatting inconsistencies, and clean up paragraph structure with precise control over scope and operations.

## Usage

1. Open an InDesign document
2. Run the `CharacterCleanup.jsx` script from the Scripts panel
3. Configure your cleanup options in the dialog:
   - Select specific cleanup actions or use "All" for comprehensive cleanup
   - Choose the scope (All Documents, Document, Story, Page, or Selection)
4. Review the confirmation dialog showing selected actions
5. Click "Yes" to execute the cleanup operations

## Features

- **Multi-Select Interface**: Choose specific cleanup actions or select all for comprehensive processing
- **Hebrew Text Expertise**: Specialized for Hebrew character normalization and text structure
- **Flexible Scope Control**: Apply operations to documents, stories, pages, or selections
- **Confirmation Workflow**: Review selected actions before execution with detailed confirmation
- **Performance Optimized**: Efficient GREP processing with proper preference management
- **Comprehensive Reporting**: Detailed feedback on applied changes and completion status

## Available Cleanup Actions

### Fix Marks Order (Dagesh Before Vowels)
- **Purpose**: Ensures proper Hebrew character ordering with dagesh before vowel marks
- **Pattern**: `([א-הח-ת])([ְֱֲֳִֵֶַָֹֻׁׂ]+)(ּ)` → `$1$3$2`
- **Effect**: Moves dagesh (ּ) to precede vowel marks for correct Hebrew typography

### Normalize Hebrew Presentation Forms
- **Purpose**: Converts Hebrew presentation form characters to standard letter + mark combinations
- **Coverage**: Handles 37+ presentation forms including:
  - Alef with marks (FB2E, FB30, FB2F)
  - Letters with dagesh (FB31-FB4A)
  - Special combinations (FB1D, FB4B, etc.)
- **Effect**: Standardizes Hebrew text encoding for consistent processing

### Remove Double Spaces
- **Purpose**: Eliminates consecutive space characters throughout the text
- **Pattern**: `\x{0020}\x{0020}` → `\x{0020}` (iterative replacement)
- **Effect**: Cleans up spacing inconsistencies from text import or editing

### Trim Trailing Paragraph Marks
- **Purpose**: Removes excess paragraph breaks at story endings while preserving one
- **Pattern**: `\r{2,}\z` → `\r`
- **Effect**: Cleans up story endings by removing redundant paragraph marks

## User Interface

### Cleanup Selection Panel
- **All Checkbox**: Master control for selecting/deselecting all cleanup actions
- **Individual Options**: Granular control over each cleanup operation
- **Smart Synchronization**: All checkbox updates automatically based on individual selections

### Scope Selection Panel
- **All Documents**: Process all open documents
- **Document (active)**: Process only the currently active document (default)
- **Story (from selection)**: Process the story containing the current selection
- **Page (active)**: Process only the currently active page
- **Selection**: Process only the selected content

### Confirmation System
- **Action Summary**: Lists selected cleanup actions with count
- **Detailed Preview**: Shows exactly which operations will be performed
- **Yes/No Confirmation**: Final approval before executing changes

## Technical Details

### GREP Processing
- **Pattern-Based Operations**: Uses InDesign's GREP find/replace engine
- **Iterative Double Space Removal**: Special handling for complete space cleanup
- **Preference Safety**: Saves and restores GREP preferences to avoid conflicts

### Hebrew Character Handling
- **Unicode Normalization**: Converts presentation forms to standard Unicode sequences
- **Typography Compliance**: Ensures proper Hebrew character ordering and combinations
- **Encoding Consistency**: Standardizes mixed Hebrew text encodings

### Performance Optimization
- **Grouped Operations**: Processes related changes together for efficiency
- **Scope-Aware Processing**: Only processes specified content ranges
- **Single Undo Operation**: All changes grouped into one undoable action

## Error Handling

The script provides comprehensive error handling for:
- Missing or closed documents
- Invalid scope selections
- GREP processing failures
- Character encoding issues
- Selection boundary problems
- Preference restoration failures

## Prerequisites

### Document Requirements
- **Open Document**: Active InDesign document required
- **Hebrew Content**: Script optimized for Hebrew text but works with any content
- **Text Frames**: Meaningful results require text content for processing

### System Requirements
- **GREP Support**: InDesign version with full GREP find/replace functionality
- **Unicode Handling**: System capable of processing Hebrew Unicode characters
- **Preference Access**: Write access to InDesign preferences for safe operation

## Use Cases

### Hebrew Publishing Workflows
- **Text Import Cleanup**: Normalize imported Hebrew text from various sources
- **Typography Standardization**: Ensure consistent Hebrew character encoding
- **Layout Preparation**: Clean up text before final layout and typesetting

### Document Quality Assurance
- **Consistency Checking**: Standardize Hebrew text presentation across documents
- **Import Cleanup**: Fix encoding issues from external text sources
- **Production Preparation**: Ensure clean text for professional output

### Multilingual Processing
- **Mixed Content**: Clean Hebrew text within multilingual documents
- **Template Preparation**: Standardize text in reusable document templates
- **Batch Processing**: Apply consistent cleanup across document sets

## Compatibility

This script follows the project's engineering best practices and is compatible with modern InDesign versions. It uses ExtendScript (JSX) format for maximum compatibility across InDesign releases.

**Important Notes:**
- Always work on document copies for production files
- Hebrew text normalization may affect custom character combinations
- Test cleanup operations on sample content before batch processing
- GREP operations are powerful - verify results match expectations
- Some presentation forms may be intentionally used in specialized layouts