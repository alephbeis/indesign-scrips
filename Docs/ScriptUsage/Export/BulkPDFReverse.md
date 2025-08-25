# Bulk Variant PDF Reverse - Batch Export Script

## Overview

The `BulkPDFReverse.jsx` script enables automated batch export of PDF files for each variant layer in your InDesign document. This tool can export PDFs in Normal order or in Reversed page order. When using Reverse Order, it automatically removes the first two pages (typically cover and blank pages), making it ideal for educational materials and publications requiring variant-specific outputs.

## Usage

1. Open an InDesign document with variant layers (layers named with "v-" prefix)
2. Save the document; if exporting Reverse Order, ensure it has an even number of pages
3. Run the `BulkPDFReverse.jsx` script from the Scripts panel
4. Configure your options in the dialog:
  - Choose export order: Normal, Reversed, or both
  - Select a PDF export preset
  - Set the base filename for exported files
5. Click "Export" to begin the batch generation process

## Features

- **Variant Layer Detection**: Automatically identifies layers with "v-" prefix (case-insensitive)
- **Export Orders**: Export in Normal order, Reversed order, or both in one run
- **Page Removal**: Automatically removes the first two pages from reversed exports
- **Non-Destructive**: Uses page range-based export without modifying the document
- **Batch Processing**: Generates one PDF per variant layer automatically
- **Organized Output**: Creates a 'PDF' subfolder next to your INDD file for all exports
- **State Restoration**: Restores layer visibility and PDF preferences after completion

## Export Process

For each variant layer, the script:
1. Hides all other variant layers
2. Shows only the current variant layer
3. Exports PDFs according to your selection:
   - Normal order: exports all pages in order
   - Reversed order: exports pages in reverse order and removes the first two pages
4. Saves files as:
   - Normal: `<base>-<layerNameWithoutV>.pdf`
   - Reversed: `<base>-<layerNameWithoutV>-reversed.pdf` when both modes are selected; otherwise `<base>-<layerNameWithoutV>.pdf`

Note: `layerNameWithoutV` strips a leading `v-` (case-insensitive) from the layer name.

## Prerequisites

### Document Requirements
- **Saved Document**: The document must be saved to determine output location
- **Even Page Count**: Required only when exporting Reversed order (document must end on an even page)
- **Variant Layers**: At least one layer with name starting with "v-"

### System Requirements
- **PDF Presets**: At least one PDF export preset must be available
- **File Permissions**: Write access to document directory for PDF subfolder creation

## User Interface

### Export Settings
- **PDF Preset**: Choose from available PDF export presets (defaults to "[Press Quality]" if available)
- **Base Filename**: Set the base name for all exported PDF files
- **Progress Feedback**: Real-time progress display during batch export

### Output Organization
- **Automatic Subfolder**: Creates a 'PDF' subfolder in the document's directory
- **Descriptive Naming**: Files named as `<base>-<layerName>.pdf` for easy identification

## Technical Details

### Layer Processing
- Identifies variant layers using regex pattern `/^v\-/i`
- Preserves original layer visibility states
- Processes layers sequentially with visibility toggles

### PDF Export Configuration
- Uses page range specification for non-destructive export
- Applies reversed page order through export settings
- Removes first two pages by adjusting page range (pages 3 to end, in reverse)
- Maintains all other PDF preset settings

### Performance Optimization
- Minimal UI updates during processing
- Efficient layer visibility management
- Progress tracking for user feedback

## Error Handling

The script includes comprehensive error handling for:
- Missing or closed documents
- Odd page count detection
- No variant layers found
- Missing PDF presets
- Unsaved documents
- File system access issues

## Compatibility

This script follows the project's engineering best practices and is compatible with modern InDesign versions. It uses ExtendScript (JSX) format for maximum compatibility across InDesign releases.

**Important Notes:**
- Always work on document copies for production files
- Ensure adequate disk space for batch PDF generation
- Test with a small number of variants before large batch operations
- Verify PDF presets are configured correctly for your output requirements