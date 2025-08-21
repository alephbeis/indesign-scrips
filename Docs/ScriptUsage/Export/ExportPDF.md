# Export PDF - Advanced PDF Export Script

## Overview

The `ExportPDF.jsx` script provides comprehensive PDF export capabilities for InDesign documents with advanced options for page ordering, security, interactivity, and viewer preferences. This powerful tool allows exporting in normal and/or reversed page order with optional page removal, security restrictions, and interactive features, all while maintaining non-destructive workflow practices.

## Usage

1. Open an InDesign document
2. Run the `ExportPDF.jsx` script from the Scripts panel
3. Configure your export options in the dialog:
   - Choose export order (normal, reversed, or both)
   - Enable optional first two pages removal
   - Configure PDF settings (security, interactivity, viewer options)
   - Select PDF preset, output folder, and base filename
4. Click "Export" to begin the export process

## Export Options

### Page Order Settings
- **Normal Order**: Export pages in sequential order (1, 2, 3, ...)
- **Reversed Order**: Export pages in fully reversed order (..., 3, 2, 1)
- **Both Orders**: Generate both normal and reversed PDFs in one operation
- **Page Removal**: Optional removal of first two pages (applies only to reversed export)

### PDF Security Settings
- **Enable PDF Security**: Apply restrictions to the exported PDF
  - Restrict printing capabilities
  - Prevent copying of content
  - Block document changes and modifications
  - Password protection options

### Interactive PDF Options
- **Interactive Elements**: Include working hyperlinks and buttons
- **Bookmarks**: Export document bookmarks for navigation
- **Layers**: Include layer information in the PDF
- **Form Fields**: Preserve interactive form elements

### Viewer Preferences
- **Auto-View**: Automatically open PDF after export
- **Display Options**: Configure initial view settings
- **Navigation**: Set default navigation preferences

## Features

- **Flexible Export Modes**: Normal, reversed, or both page orders in single operation
- **Non-Destructive Processing**: Original document remains unmodified throughout
- **Advanced Security**: Comprehensive PDF protection options
- **Interactive Support**: Full preservation of interactive elements
- **Progress Tracking**: Real-time progress feedback with progress bar
- **Preset Integration**: Works with all available PDF export presets
- **Smart Defaults**: Intelligent default settings for common workflows
- **Error Recovery**: Comprehensive error handling with graceful recovery

## User Interface

### Export Configuration Panel
- **Export Options**: Checkboxes for normal/reversed order and page removal
- **PDF Preset Selection**: Dropdown with all available presets (defaults to "[Press Quality]")
- **Output Settings**: Folder selection and base filename configuration

### PDF Settings Panel
- **Security Options**: Enable/disable PDF security restrictions
- **Interactive Features**: Toggle hyperlinks, bookmarks, and interactive elements
- **Layer Options**: Include or exclude layer information
- **Viewer Settings**: Configure auto-view and display preferences

### File Management
- **Smart Output Location**: Defaults to document folder or allows custom selection
- **Automatic Naming**: Generates descriptive filenames with appropriate suffixes
- **Extension Handling**: Ensures proper .pdf extension on all outputs

## Export Process

The script follows this process for each export:

1. **Preparation**: Save current PDF export preferences
2. **Configuration**: Apply selected settings to PDF export preferences
3. **Page Range Calculation**: Determine appropriate page ranges for each export type
4. **Export Execution**: Generate PDF(s) using calculated page ranges
5. **Restoration**: Restore original PDF export preferences
6. **Cleanup**: Reset UI states and provide completion feedback

### Page Range Logic
- **Normal Export**: Sequential page range (1-n)
- **Reversed Export**: Full document range with reverse order flag
- **Page Removal**: Adjusted range excludes first two pages (3-n for reversed)

## Technical Details

### Preference Management
- Captures and preserves all PDF export preference settings
- Temporarily applies script-specific settings during export
- Restores original preferences regardless of export success or failure

### Security Implementation
- Applies PDF security settings through export preferences
- Configures printing, copying, and editing restrictions
- Maintains security settings consistency across multiple exports

### Interactive Element Handling
- Preserves hyperlinks and cross-references
- Maintains bookmark structure and navigation
- Includes form fields and interactive buttons
- Handles multimedia and animation elements

### Performance Optimization
- Disables screen redraw during processing
- Minimizes document operations
- Efficient progress tracking and UI updates

## Error Handling

The script provides robust error handling for:
- Missing or closed documents
- Invalid PDF preset selections
- File system access issues
- Export preference conflicts
- Security setting incompatibilities
- Output file creation problems
- Progress dialog failures

## Prerequisites

### System Requirements
- **PDF Presets**: At least one PDF export preset must be available
- **File Permissions**: Write access to selected output directory
- **InDesign Version**: Compatible ExtendScript support required

### Document Considerations
- **Open Document**: Active document required for export
- **Content Types**: Supports all InDesign content including text, images, and interactive elements
- **Page Structure**: Works with any page count and layout configuration

## Compatibility

This script follows the project's engineering best practices and is compatible with modern InDesign versions. It uses ExtendScript (JSX) format for maximum compatibility across InDesign releases.

**Important Notes:**
- Always test export settings with sample documents first
- Verify PDF presets are configured correctly for your output requirements  
- Security settings may affect PDF usability - test thoroughly
- Large documents may require significant processing time
- Interactive elements require appropriate PDF preset configuration