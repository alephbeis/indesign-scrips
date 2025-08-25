# Remove Numeric Prefixes - Paragraph Prefix Management Script

## Overview

The `RemoveNumericPrefixes.jsx` script provides comprehensive management of explicit numeric prefixes at the beginning of paragraphs. This specialized tool identifies and removes typed number sequences (like "1. ", "2. ", etc.) that are not part of InDesign's automatic numbering system. The script features an integrated interface that combines occurrence analysis with removal capabilities, including navigation to specific instances and intelligent pre-scanning.

## Usage

1. Open an InDesign document
2. Run the `RemoveNumericPrefixes.jsx` script from the Scripts panel
3. The script automatically scans the document:
   - If no numeric prefixes are found, displays a confirmation message and exits
   - If prefixes are found, shows the main dialog with occurrences list and scope options
4. Review the occurrences list showing all found numeric prefixes by page
5. Use the "Go To" button to navigate to specific occurrences in the document
6. Select the scope for processing (All Documents, Document, Story, Page, Frame, or Selected Text)
7. Click "Remove All" to delete all found numeric prefixes after confirmation

## Features

- **Intelligent Pre-Scan**: Automatically checks for occurrences before showing the dialog
- **Combined Interface**: Single dialog showing both occurrence list and scope options
- **Interactive Navigation**: "Go To" functionality to jump to specific occurrences in the document
- **Page-by-Page Analysis**: Detailed breakdown showing individual occurrences with page locations and text previews
- **Comprehensive Scope Control**: Process entire documents, stories, pages, frames, or selections
- **Pattern Recognition**: Targets only explicit typed prefixes with required spacing
- **Enhanced Reporting**: Shows formatted counts with proper number formatting and page references

## Main Interface

### Occurrences List (Left Panel)
- **Summary Statistics**: Total occurrences across affected pages
- **Individual Occurrences**: Each numeric prefix listed with:
  - Page location (e.g., "Page 1", "Page 2")
  - Text preview (first 20 characters with truncation indicator)
- **Navigation Control**: "Go To" button to navigate directly to selected occurrences
- **Automatic Sorting**: Occurrences ordered by page sequence

### Scope Options (Right Panel)
- **All Documents**: Process all currently open documents
- **Document**: Process only the active document (default)
- **Page**: Process only the currently active page  
- **Story**: Process the story containing current selection (enabled when in text context)
- **Frame**: Process selected text frames (enabled when frames are selected)
- **Selected Text**: Process only selected text content (enabled when text is selected)

### Remove All Action
- **Purpose**: Delete all found numeric prefixes after user confirmation
- **Process**: 
  - Uses the selected scope to determine which occurrences to remove
  - Shows total count before removal in confirmation dialog
  - Performs removal within a single undo operation
  - Reports actual number of removals completed
- **Safety**: Includes confirmation dialog and single undo step for easy reversal

## Pattern Recognition

### Target Pattern
- **GREP Pattern**: `^\d+\.\s+`
- **Matches**: Numeric digits followed by period and required space at paragraph start
- **Examples**:
  - "1. Text content"
  - "23. Another item"
  - "456. Text with space"

### Exclusions
- **Numbers Without Space**: "456.Text" (no space after period) is not matched
- **Automatic Numbering**: InDesign's built-in paragraph numbering is not affected
- **Mid-Paragraph Numbers**: Only targets prefixes at the very beginning of paragraphs
- **Non-Numeric Prefixes**: Letters or symbols are not matched
- **Decimal Numbers**: Numbers like "1.5" without trailing space are not matched

## Navigation Features

### Go To Functionality
- **Direct Navigation**: Click "Go To" button to navigate to selected occurrence
- **Page Switching**: Automatically switches to the page containing the selected occurrence
- **Text Selection**: Highlights the selected numeric prefix in the document
- **Fallback Behavior**: If no item is selected, navigates to the first occurrence
- **Dialog Management**: Automatically closes the dialog after navigation to show the result

### Smart Selection
- **Always Available**: "Go To" button is always enabled for user convenience
- **Multi-Selection Handling**: Works with the first selected item when multiple items are selected
- **Validation**: Checks that the target occurrence is still valid before navigation
- **Error Handling**: Provides clear feedback if navigation fails or target is no longer valid

## Technical Details

### GREP Processing
- **Pattern-Based Search**: Uses InDesign's GREP engine for reliable pattern matching
- **Comprehensive Scanning**: Processes all text in specified scope
- **Safe Replacement**: Uses standard find/replace mechanisms for removal

### Page Analysis
- **Geometric Positioning**: Determines page location for each found prefix
- **Page Label Integration**: Uses page.name for accurate page references
- **Sorted Output**: Results ordered by page sequence for logical presentation

### Number Formatting
- **Thousands Separators**: Properly formats large counts with commas
- **Pluralization**: Handles singular/plural forms in user messages
- **Consistent Display**: Standardized number presentation throughout interface

## Error Handling

The script provides robust error handling for:
- **Missing or closed documents**: Shows clear message and exits gracefully
- **No occurrences found**: Displays confirmation message and exits without showing dialog
- **Invalid scope selections**: Validates selection context and disables inapplicable options
- **Empty search results**: Handles cases where no matching patterns are found
- **GREP processing failures**: Continues processing other targets if individual scopes fail
- **Navigation failures**: Validates target text objects before attempting navigation
- **Page information access issues**: Gracefully handles missing page context
- **User cancellation**: Supports cancellation at dialog level with proper cleanup

## Prerequisites

### Document Requirements
- **Open Document**: Active InDesign document required
- **Text Content**: Document should contain text for meaningful processing
- **Paragraph Text**: Targets content at paragraph beginnings

### System Requirements
- **GREP Support**: InDesign version with full GREP find/replace functionality
- **Text Analysis**: Capability to process text content and page relationships
- **Dialog Support**: ScriptUI functionality for user interface

## Use Cases

### Content Import Cleanup
- **Legacy Document Processing**: Remove old-style manual numbering from imported content
- **Format Standardization**: Clean up content before applying InDesign's automatic numbering
- **Template Preparation**: Remove existing numbering to allow consistent formatting

### Document Quality Assurance
- **Numbering Audit**: Identify manually typed numbering that should be automatic
- **Consistency Checking**: Find areas where manual and automatic numbering conflict
- **Production Cleanup**: Remove unwanted prefixes before final output

### Workflow Optimization
- **Batch Processing**: Analyze multiple documents for numeric prefix patterns
- **Template Development**: Clean base documents for reusable templates
- **Style Implementation**: Prepare content for paragraph style application with automatic numbering

## Performance Considerations

### Processing Efficiency
- **Targeted Search**: Focuses only on paragraph beginnings for optimal performance
- **Scope-Aware**: Processes only specified content ranges to minimize processing time
- **Memory Management**: Handles large documents efficiently through incremental processing

### User Experience
- **Progress Indication**: Clear feedback during processing operations
- **Responsive Interface**: Dialog responsiveness maintained during processing
- **Cancellation Support**: User can exit process at multiple decision points

## Compatibility

This script follows the project's engineering best practices and is compatible with modern InDesign versions. It uses ExtendScript (JSX) format for maximum compatibility across InDesign releases.

**Important Notes:**
- Always work on document copies for production files when removing content
- Review occurrence listings carefully before bulk removal
- Manual numbering removal is permanent - consider backup strategies
- Test with sample content to understand pattern matching behavior
- Page analysis works with standard InDesign page numbering and sections