# Remove Numeric Prefixes - Paragraph Prefix Management Script

## Overview

The `RemoveNumericPrefixes.jsx` script provides comprehensive management of explicit numeric prefixes at the beginning of paragraphs. This specialized tool identifies and removes typed number sequences (like "1. ", "2. ", etc.) that are not part of InDesign's automatic numbering system, offering both analysis and removal capabilities with detailed page-by-page reporting and confirmation workflows.

## Usage

1. Open an InDesign document
2. Run the `RemoveNumericPrefixes.jsx` script from the Scripts panel
3. Choose your action in the main dialog:
   - **Show occurrences**: List all numeric prefixes by page with counts
   - **Remove all**: Delete all found numeric prefixes after confirmation
4. Select the scope for processing (All Documents, Document, Story, Page, or Selection)
5. Review results or confirm removal as appropriate

## Features

- **Dual Action Mode**: List occurrences for analysis or remove all for cleanup
- **Page-by-Page Analysis**: Detailed breakdown showing counts per page with page labels
- **Comprehensive Scope Control**: Process entire documents, stories, pages, or selections
- **Interactive Workflow**: Navigate between listing and removal with confirmation dialogs
- **Pattern Recognition**: Targets only explicit typed prefixes, not automatic numbering
- **Detailed Reporting**: Shows formatted counts with proper number formatting and page references

## Available Actions

### Show Occurrences
- **Purpose**: Analyze document for numeric prefix distribution without making changes
- **Output**: Detailed listing showing:
  - Count per page with page labels (e.g., "Page 1 (1): 3 occurrences")
  - Total occurrences across all affected pages
  - Summary statistics with proper formatting
- **Navigation**: Option to return to main dialog for removal or exit

### Remove All
- **Purpose**: Delete all found numeric prefixes after user confirmation
- **Process**: 
  - Scans document for all matching patterns
  - Shows total count before removal
  - Confirms deletion with user
  - Reports actual removals completed
- **Safety**: Includes confirmation dialog with detailed removal statistics

## Pattern Recognition

### Target Pattern
- **GREP Pattern**: `^\d+\.\s*`
- **Matches**: Numeric digits followed by period and optional space at paragraph start
- **Examples**:
  - "1. Text content"
  - "23. Another item"
  - "456.Text without space"

### Exclusions
- **Automatic Numbering**: InDesign's built-in paragraph numbering is not affected
- **Mid-Paragraph Numbers**: Only targets prefixes at the very beginning of paragraphs
- **Non-Numeric Prefixes**: Letters or symbols are not matched

## User Interface

### Main Dialog
- **Action Selection**: Radio buttons for "Show occurrences" or "Remove all"
- **Scope Panel**: Choose processing scope with clear labels
- **Integrated Design**: Combined options and scope selection in single dialog

### Scope Options
- **All Documents**: Process all currently open documents
- **Document (active)**: Process only the active document (default)
- **Story (from selection)**: Process the story containing current selection
- **Page (active)**: Process only the currently active page
- **Selection**: Process only selected content

### Results Display
- **Occurrences Dialog**: 
  - Formatted summary with total counts
  - Page-by-page breakdown with proper page labels
  - Navigation options (Back to Options, Exit)
- **Confirmation Dialog**:
  - Clear removal confirmation with counts
  - Final approval before making changes

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
- Missing or closed documents
- Invalid scope selections
- Empty search results
- GREP processing failures
- Page information access issues
- User cancellation at any stage

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