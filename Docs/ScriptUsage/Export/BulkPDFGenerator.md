# Bulk PDF Generator - Advanced PDF Generation Script

## Overview

The `BulkPDFGenerator.jsx` script enables automated creation of multiple PDF variations from a single InDesign file. This powerful tool combines two primary features - Nekudos Logic and Variants Logic - to generate comprehensive sets of educational materials with different Hebrew vowel markings and layout variations.

## Usage

1. Open an InDesign document that meets the file prerequisites (see Prerequisites section)
2. Run the `BulkPDFGenerator.jsx` script from the Scripts panel
3. Configure your options in the dialog:
   - Choose which nekudos to generate PDFs for
   - Select layer sets and variants to include
   - Configure PDF output location and post-processing settings
4. Click "Run" to begin the batch generation process

## Features

- **Dual Generation Logic**: Combines Nekudos and Variants logic for comprehensive PDF sets
- **Nekudos Processing**: Automated Hebrew vowel mark transformations with intelligent cleanup
- **Layer-Based Variants**: Dynamic identification of layer sets for multiple layout variations
- **Conditional Text Support**: Smart handling of text that appears based on layer combinations
- **Batch Processing**: Generate dozens or hundreds of PDFs automatically
- **Flexible Output Options**: Choose output location and post-processing behavior
- **Performance Optimized**: Efficient processing for large document sets

## Available Functions

### Nekudos Logic

**Hebrew Vowel Processing:**
- **Document Cleanup**: Ensures nekudos are typed correctly and removes double kamatz
- **Sofios Management**: Automatically removes sofios when kamatz cycles are complete
- **Chataf Application**: Applies chataf only to appropriate letters
- **Maze Protection**: Preserves maze content by excluding text with "Maze" style from chataf logic

### Variants Logic

**Layer Set Processing:**
- **Automatic Set Detection**: Identifies layer sets using naming convention (e.g., "Language-HE", "Level-Red")
- **Dynamic Combinations**: Creates PDFs for all combinations of layer sets
- **Conditional Text Handling**: Manages text that appears based on multiple layer conditions
- **Flexible Naming**: Generates descriptive filenames with appropriate suffixes

**Example Output:**
- Layer sets: Language (HE, EN), Level (Red, Orange)
- Generated files: `-Red_HE.pdf`, `-Red_EN.pdf`, `-Orange_HE.pdf`, `-Orange_EN.pdf`

## User Interface

### Generation Options
- **Choose Nekudos**: Select which Hebrew vowel variations to generate
- **Choose Sets**: Configure which layer set combinations to include

### Output Settings
- **PDF Location**: 
  - Same Directory: Place PDFs alongside the source INDD file
  - New Folder: Create a dedicated subfolder for organized output
- **Post-Processing**:
  - Close (and don't save): Automatically close file without saving changes
  - Leave open: Keep the document open for further editing

## Prerequisites

### Required Document Setup
When using Nekudos functionality, your InDesign document must include specific styles that the script depends on. All style names are case-sensitive.

### Required Styles

**Paragraph Styles:**
- `Target Letter` - Identifies pages with sofios characters and target letters for nekudos application
- `Directions/Target Letter Small` - Identifies target letters on instruction pages

**Color Swatches:**
- `Dark blue` - Primary text color targeted by the script

### Optional GREP Styles

GREP styles can be used to ensure proper letter formatting for different nekudos:

**Baseline Adjustment:**
- `^[^\x{05B0}-\x{05B8}\x{05BB}]+$` - Adjusts baseline to 0 for text without specific nekudos

**Multi-Letter Formatting:**
- `([א-ת][^א-ת]*){3,}` - Formats text boxes containing 3+ letters for Cholam and Chirik combinations

**Additional Patterns:**
- `.+.*\x{05B9}` - Text followed by cholam (05b9)
- `.*וּ.*` - Text containing shuruk

## Technical Details

The script combines multiple processing approaches:
- **File Preparation**: Document cleanup and nekudos normalization
- **Layer Management**: Dynamic identification and manipulation of layer sets
- **Conditional Processing**: Smart handling of text visibility based on layer combinations
- **Batch Operations**: Efficient processing of multiple document variations
- **Output Management**: Organized file naming and location handling

## Compatibility

This script is marked as "Not Maintained" in the main repository but remains functional with InDesign versions that support ExtendScript (JSX). Due to its complexity and specialized nature, it requires careful setup and testing before production use.

**Important Notes:**
- Always work on document copies
- Test thoroughly with your specific document structure
- Ensure all prerequisites are met before running
- Consider the processing time for large document sets
