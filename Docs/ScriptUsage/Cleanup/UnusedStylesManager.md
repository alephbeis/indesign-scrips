# Unused Styles Manager - Style Cleanup and Optimization Script

## Overview

The `UnusedStylesManager.jsx` script provides comprehensive management of unused styles across all InDesign style categories. This powerful tool identifies, analyzes, and removes unused paragraph, character, object, table, and cell styles with intelligent detection modes, safe replacement mechanisms, and detailed reporting. The script includes robust handling of style groups, built-in styles, and complex style relationships for reliable document cleanup.

## Usage

1. Open an InDesign document
2. Run the `UnusedStylesManager.jsx` script from the Scripts panel
3. Configure detection options:
   - Choose unused detection mode
   - Select style categories to process
4. Review the list of detected unused styles with folder paths
5. Click "Delete Selected Styles" to remove unused styles after confirmation

## Features

- **Multi-Category Processing**: Handles paragraph, character, object, table, and cell styles
- **Intelligent Detection Modes**: Multiple criteria for identifying unused styles
- **Style Group Navigation**: Displays hierarchical folder paths for organized styles
- **Safe Deletion**: Uses replacement styles to ensure deletion always succeeds
- **Built-in Style Protection**: Preserves essential InDesign built-in styles
- **Comprehensive Analysis**: Scans all document content including hidden and locked areas
- **Detailed Reporting**: Shows style paths and provides completion feedback

## Detection Modes

### Has No Usage At All (Default)
- **Purpose**: Identifies styles with zero usage throughout the document
- **Scope**: Most comprehensive cleanup removing completely unused styles
- **Safety**: Safest option as styles are genuinely not in use

### Additional Modes Available
The script framework supports additional detection modes for different cleanup scenarios:
- **Custom Usage Patterns**: Extensible for specific workflow requirements
- **Conditional Detection**: Based on document structure and content patterns

## Style Categories

### Paragraph Styles
- **Detection**: Scans all text content for paragraph style applications
- **Replacement**: Uses `[No Paragraph Style]` or `[Basic Paragraph]` for safe deletion
- **Group Support**: Handles paragraph style groups and nested hierarchies

### Character Styles  
- **Detection**: Analyzes character-level style applications throughout text
- **Replacement**: Uses `[None]` character style as safe replacement
- **Inline Handling**: Processes character styles within paragraph text

### Object Styles
- **Detection**: Examines all page items for object style assignments
- **Replacement**: Uses `[None]` object style for safe removal
- **Comprehensive Scope**: Includes frames, shapes, and graphic elements

### Table Styles
- **Detection**: Scans all table elements for table style usage
- **Replacement**: Uses `[None]` or `[Basic Table]` as appropriate replacement
- **Table Integration**: Handles both table structure and content styles

### Cell Styles
- **Detection**: Analyzes individual table cells for cell style applications  
- **Replacement**: Uses `[None]` cell style for safe deletion
- **Granular Processing**: Checks each cell individually for style usage

## User Interface

### Style Category Selection
- **Multi-Select Checkboxes**: Choose which style categories to analyze
- **Select All Option**: Process all style categories simultaneously
- **Category Labels**: Clear identification of each style type

### Detection Results Display
- **Style List**: Scrollable list showing all detected unused styles
- **Folder Path Column**: Shows hierarchical location within style groups
- **Style Name Column**: Displays actual style names for identification
- **Count Summary**: Total number of unused styles found per category

### Deletion Workflow
- **Selection Review**: User can review all styles before deletion
- **Confirmation Dialog**: Final approval with detailed deletion summary
- **Progress Feedback**: Real-time feedback during deletion process

## Technical Details

### Usage Detection Engine
- **Comprehensive Scanning**: Searches all document content including:
  - Main story text and overflow text
  - Hidden layers and locked content
  - Master spreads and footnotes
  - Tables and nested content structures
- **Find/Change Integration**: Uses InDesign's find/change system for thorough analysis
- **Cross-Reference Checking**: Identifies style dependencies and relationships

### Safe Deletion Mechanism
- **Replacement Strategy**: Always provides fallback styles for deletion operations
- **Built-in Style Preservation**: Protects essential InDesign system styles
- **Error Recovery**: Handles deletion failures gracefully with detailed reporting
- **Batch Processing**: Deletes multiple styles efficiently while maintaining document integrity

### Style Path Resolution
- **Hierarchical Navigation**: Traces parent-child relationships in style groups
- **Path Display**: Shows complete folder structure for easy identification
- **Root Level Handling**: Properly displays styles at document root level

## Advanced Features

### Built-in Style Detection
- **Bracket Recognition**: Identifies InDesign built-in styles by `[bracketed names]`
- **System Style Protection**: Prevents accidental deletion of essential styles
- **Version Compatibility**: Handles built-in style variations across InDesign versions

### Group Structure Management
- **Nested Group Support**: Handles deeply nested style group hierarchies
- **Group Traversal**: Recursively processes all styles within group structures
- **Parent-Child Relationships**: Maintains proper style inheritance during processing

### Error Handling and Recovery
- **Style Validity Checking**: Verifies style objects before processing
- **Deletion Rollback**: Provides recovery mechanisms for failed operations
- **Comprehensive Logging**: Detailed reporting of all operations and errors

## Prerequisites

### Document Requirements
- **Open Document**: Active InDesign document required
- **Style Content**: Document should contain styles for meaningful analysis
- **Content Variety**: Benefits from documents with text, objects, and tables

### System Requirements
- **Style Access**: InDesign version with full style management capabilities
- **Find/Change Support**: Complete find/change functionality for usage detection
- **Memory Availability**: Sufficient memory for processing large style collections

## Use Cases

### Document Optimization
- **File Size Reduction**: Remove unused styles to reduce document complexity
- **Template Cleanup**: Prepare clean templates by removing legacy styles
- **Production Preparation**: Streamline documents before final output

### Workflow Standardization  
- **Style Auditing**: Identify inconsistencies in style usage across projects
- **Template Development**: Create clean base templates for team use
- **Project Maintenance**: Regular cleanup of working documents

### Legacy Document Processing
- **Import Cleanup**: Remove unused styles from imported content
- **Version Consolidation**: Clean up styles when merging document versions
- **Archive Preparation**: Optimize documents for long-term storage

## Performance Considerations

### Processing Efficiency
- **Incremental Analysis**: Processes styles category by category for optimal performance
- **Memory Management**: Handles large style collections without memory issues
- **Progress Indication**: Provides feedback during long-running operations

### Scalability
- **Large Document Support**: Efficiently processes documents with hundreds of styles
- **Complex Structure Handling**: Manages deeply nested style group hierarchies
- **Batch Operation Optimization**: Processes multiple deletions efficiently

## Safety Measures

### Pre-Deletion Validation
- **Usage Verification**: Double-checks style usage before deletion
- **Dependency Analysis**: Identifies styles referenced by other styles
- **Replacement Availability**: Ensures appropriate replacement styles exist

### Deletion Safety
- **Replacement-Based Deletion**: Never deletes without providing replacement
- **Built-in Protection**: Prevents deletion of essential system styles
- **Error Tolerance**: Continues processing even if individual deletions fail

## Compatibility

This script follows the project's engineering best practices and is compatible with modern InDesign versions. It uses ExtendScript (JSX) format for maximum compatibility across InDesign releases.

**Important Notes:**
- Always work on document copies when performing bulk style deletion
- Review unused style lists carefully before deletion
- Some styles may appear unused but serve specific workflow purposes
- Built-in style protection varies by InDesign version
- Complex documents may require multiple cleanup passes for optimal results