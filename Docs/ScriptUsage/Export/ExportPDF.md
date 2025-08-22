# Export PDF - Advanced PDF Export Script

## Overview

The `ExportPDF.jsx` script provides comprehensive PDF export capabilities for InDesign documents with options for page ordering, basic security, interactive vs. print export, and post-export viewing. It supports exporting in normal and/or reversed page order, with an optional removal of the first two pages for reversed exports. The script is non-destructive and restores your PDF export preferences after completion. An optional text watermark can be applied during export and is fully cleaned up afterwards.

## Usage

1. Open an InDesign document
2. Run the `ExportPDF.jsx` script from the Scripts panel
3. Configure your export options in the dialog:
   - Choose export order (normal, reversed, or both)
   - If using reversed export, optionally remove the first two pages (cover + blank)
   - Choose between Print PDF (with optional security) or Interactive PDF
   - Select whether to view the PDF after export
   - Optionally enable a text watermark and set its text
   - Select PDF preset, output folder, and base filename
4. Click "Export" to begin the export process

## Export Options

### Page Order Settings
- **Normal Order**: Export pages in sequential order (1, 2, 3, ...)
- **Reversed Order**: Export pages in fully reversed order (..., 3, 2, 1)
- **Both Orders**: Generate both normal and reversed PDFs in one operation
- **Page Removal (Reversed only)**: Option to omit the first two pages (cover + blank)

### PDF Type and Security
- **Print PDF**: Uses the selected PDF preset. Optional security restrictions are available:
  - Restrict printing
  - Prevent copying of content
  - Block document changes
  - Note: Password protection is not configured by this script
- **Interactive PDF**: Exports using InDesign's Interactive PDF export. When enabled, security is disabled.

### Viewing and Watermark
- **View After Export**: Automatically open the exported PDF(s)
- **Watermark (optional)**: Apply a temporary text watermark layer during export. It is removed automatically afterwards.

## Features

- **Flexible Export Modes**: Normal, reversed, or both
- **Non-Destructive Page Ranges**: Original document remains unmodified; page order is controlled via export ranges
- **Basic Security Controls**: Printing/copying/editing restrictions for Print PDF
- **Interactive Export Mode**: Toggle between print and interactive PDF export
- **Progress Tracking**: Real-time progress feedback with a progress bar
- **Preset Integration**: Works with all available PDF export presets; defaults to "[Press Quality]" when available
- **Smart Defaults**: Sensible defaults for common workflows
- **Watermark Support**: Optional text watermark with clean styling

## User Interface

### Export Configuration Panel
- **Export Options**: Checkboxes for normal/reversed order and, for reversed, page removal
- **PDF Preset Selection**: Dropdown with available presets (defaults to "[Press Quality]" if present)
- **Output Settings**: Folder selection and base filename

### PDF Settings Panel
- **Security (Print PDF only)**: Enable/disable printing/copying/editing restrictions
- **Interactive PDF**: Toggle to export as Interactive PDF (disables security)
- **View After Export**: Open PDFs upon completion
- **Watermark**: Enable and set text for a temporary watermark

### File Management
- **Smart Output Location**: Defaults to the document folder (or Desktop if unsaved)
- **Automatic Naming**: Base filename used with "-reversed" suffix for reversed output
- **Extension Handling**: Ensures .pdf extension

## Export Process

The script follows this process for each export:

1. **Preparation**: Save current PDF export preferences
2. **Configuration**: Apply selected settings to export preferences (print or interactive)
3. **Page Range Calculation**: Determine page ranges for each export type
4. **Export Execution**: Generate PDF(s)
5. **Restoration**: Restore original export preferences
6. **Cleanup**: Remove temporary watermark layer (if used) and close the progress dialog

### Page Range Logic
- **Normal Export**: Sequential absolute page range (+1 to +N)
- **Reversed Export**: Absolute page numbers in reverse order (+N, +N-1, ...)
- **Page Removal (Reversed)**: Starts from page +3 when removal is enabled

## Technical Details

### Preference Management
- Captures and preserves relevant export preference settings
- Applies script-specific settings temporarily
- Restores original preferences regardless of success or failure

### Security and Interactive Modes
- Print PDF: uses preset plus optional disallowPrinting/disallowCopying/disallowChanging
- Interactive PDF: sets page range and view preferences; security is not applied

### Performance Optimization
- Disables screen redraw during processing
- Minimizes document operations
- Efficient progress tracking and UI updates

## Error Handling

Robust handling for:
- Missing or closed documents
- Invalid PDF preset selections
- File system access issues
- Incompatible option combinations (e.g., security with interactive)
- Output file creation problems
- Progress dialog failures

## Prerequisites

### System Requirements
- **PDF Presets**: At least one PDF export preset must be available
- **File Permissions**: Write access to the selected output directory
- **InDesign Version**: ExtendScript (JSX) support required

### Document Considerations
- **Open Document**: Active document required
- **Even Page Count for Reversed**: Document must end on an even page when exporting Reversed
- **Page Structure**: Works with any page count; reversed export optionally omits first two pages

## Compatibility

This script follows the project's engineering best practices and is compatible with modern InDesign versions.

**Important Notes:**
- Always test export settings with sample documents first
- Verify PDF presets are configured correctly for your output requirements
- Security restrictions can affect usability; test thoroughly
- Large documents may require significant processing time
- Features like bookmarks, hyperlinks, and layers are not toggled by the script; they follow the chosen preset and export type