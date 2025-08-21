# Export Plain RTF - Text-Only Export Script

## Overview

The `ExportPlainRTF.jsx` script exports InDesign documents to plain RTF format with all formatting, objects, and styling removed while preserving essential page structure and numbering. This specialized tool creates clean, text-only documents that maintain page separation through headers and proper text flow ordering, making it ideal for content migration, text analysis, and plain text workflows.

## Usage

1. Open an InDesign document
2. Run the `ExportPlainRTF.jsx` script from the Scripts panel
3. Choose the output location and filename in the save dialog
4. The script will process all pages and export to RTF format
5. Monitor progress through the progress window during export

## Features

- **Complete Format Removal**: Strips all formatting, styles, and local overrides
- **Page Structure Preservation**: Maintains page boundaries with explicit page breaks
- **Page Number Headers**: Includes page labels (page.name) for each page section
- **Smart Text Ordering**: Sorts text frames top-to-bottom, then left-to-right per page
- **Object Filtering**: Removes inline object placeholders and non-text artifacts
- **Non-Destructive**: Original document remains completely unmodified
- **Progress Feedback**: Real-time progress display during processing
- **Automatic Threading**: Creates single threaded story with proper page breaks

## Export Process

The script follows this comprehensive process:

### Document Analysis
1. **Page Geometry**: Copies document size, orientation, and margin settings
2. **Page Count**: Replicates exact page count from source document
3. **Content Scanning**: Identifies all text frames on each page

### Text Processing
1. **Frame Collection**: Gathers all text frames from each source page
2. **Spatial Sorting**: Orders frames top-to-bottom, then left-to-right
3. **Content Extraction**: Extracts raw text content from each frame
4. **Artifact Removal**: Strips inline object markers (U+FFFC) and formatting codes
5. **Page Header Insertion**: Adds page number header using page.name value

### Document Creation
1. **Temporary Document**: Creates clean document with matching geometry
2. **Text Frame Placement**: Creates one text frame per page within margins
3. **Story Threading**: Links all text frames into single threaded story
4. **Page Break Insertion**: Adds explicit page breaks between page content
5. **RTF Export**: Exports the complete story to RTF format

## Technical Details

### Text Frame Processing
- **Spatial Analysis**: Uses geometric bounds to determine reading order
- **Content Aggregation**: Concatenates text from multiple frames per page
- **Flow Preservation**: Maintains logical text flow across complex layouts

### Temporary Document Management
- **Geometry Matching**: Replicates page size, orientation, and facing pages settings
- **Margin Calculation**: Computes text frame bounds within document margins
- **Style Application**: Uses default Basic Paragraph and [None] character styles
- **Clean Environment**: No local formatting or style overrides applied

### RTF Output Configuration
- **Single Story Export**: Uses InDesign's native Story.exportFile method
- **Format Specifications**: Outputs standard RTF with minimal formatting
- **Page Break Encoding**: Proper RTF page break codes between sections
- **Text Encoding**: Handles Unicode characters and special text properly

### Memory and Performance
- **Efficient Processing**: Minimizes memory usage during text extraction
- **Progress Tracking**: Updates progress bar for user feedback
- **Resource Cleanup**: Properly closes and removes temporary document
- **Error Recovery**: Handles processing errors gracefully

## Prerequisites

### Document Requirements
- **Open Document**: Active InDesign document required
- **Text Content**: Document should contain text frames for meaningful output
- **Page Structure**: Works with any page count, size, and layout configuration

### System Requirements
- **File Permissions**: Write access to selected output directory
- **Disk Space**: Sufficient space for RTF file (typically much smaller than source)
- **RTF Support**: System capable of handling RTF file format

## User Interface

### File Selection
- **Save Dialog**: Standard system save dialog for output file selection
- **Default Location**: Suggests document folder or desktop as default location
- **Filename Generation**: Creates descriptive default filename with "-plain.rtf" suffix
- **Extension Handling**: Ensures proper .rtf extension on output file

### Progress Display
- **Progress Window**: Palette-style window showing export progress
- **Page Counter**: Real-time display of current page being processed
- **Progress Bar**: Visual indicator scaled to document page count
- **Status Messages**: Clear feedback about current processing stage

## Output Characteristics

### Content Preservation
- **Text Only**: Preserves all readable text content from document
- **Page Headers**: Each page section begins with page number/label
- **Reading Order**: Text appears in logical top-to-bottom, left-to-right order
- **Page Separation**: Clear page boundaries maintained in output

### Content Removal
- **All Formatting**: No bold, italic, fonts, or character formatting
- **Objects**: Images, shapes, lines, and other non-text elements removed
- **Anchored Items**: Inline graphics and anchored object markers stripped
- **Style Information**: Paragraph and character styles not preserved
- **Color Information**: Text colors and effects removed

## Error Handling

The script provides comprehensive error handling for:
- Missing or closed documents
- File system access problems
- RTF export failures
- Temporary document creation issues
- Text frame processing errors
- Progress dialog problems
- Memory or resource constraints

## Use Cases

### Content Migration
- **Platform Transfer**: Move text content between different publishing systems
- **Format Conversion**: Convert designed layouts to plain text format
- **Archive Creation**: Create searchable text archives from designed documents

### Analysis and Processing
- **Word Count**: Accurate word counting across complex layouts
- **Text Analysis**: Feed content to text analysis tools and systems
- **Translation**: Prepare content for translation systems requiring plain text

### Workflow Integration
- **CMS Import**: Import clean text into content management systems
- **Database Population**: Extract text for database or search index creation
- **Quality Assurance**: Review content without design distractions

## Compatibility

This script follows the project's engineering best practices and is compatible with modern InDesign versions. It uses ExtendScript (JSX) format for maximum compatibility across InDesign releases.

**Important Notes:**
- Large documents with many text frames may require significant processing time
- Complex layouts may affect text ordering - review output for accuracy
- Non-Roman text and special characters are preserved in RTF encoding
- Temporary document creation requires available system memory
- Always verify text ordering meets your requirements before using output