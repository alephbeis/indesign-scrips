# Scope Option - Functional Requirements

## Overview

The **Scope Option** is a fundamental UI component used across InDesign scripts in this repository to allow users to specify the target range for script operations. This standardized interface provides consistent control over where text processing, cleanup, and modification operations are applied.

## Purpose

The scope option addresses the critical need for users to:
- Control the extent of script operations
- Apply changes selectively to specific content ranges
- Maintain workflow efficiency by targeting precise areas
- Prevent unintended modifications to unrelated content

## Available Scope Options

The scope functionality provides six distinct target options in hierarchical order:

### 1. All Documents - `allDocs`
- **UI Name**: "All Documents"
- **Target**: All currently open documents in InDesign
- **Use Case**: Batch processing across multiple documents
- **Performance**: Most resource-intensive option
- **Warning**: Should be used with caution due to broad impact
- **Availability**: Always available

### 2. Document - `doc`
- **UI Name**: "Document"
- **Target**: The currently active document in InDesign
- **Use Case**: Processing all text content within a single document
- **Default Option**: Yes (selected by default in most scripts)
- **Availability**: Always available

### 3. Page - `page`
- **UI Name**: "Page"
- **Target**: All text content on the currently active page
- **Use Case**: Page-specific processing without affecting other pages
- **Availability**: Always available

### 4. Story - `story`
- **UI Name**: "Story"
- **Target**: The entire story containing the current text selection or currently selected frame object
- **Use Case**: Processing complete text flows while starting from a selection point
- **Availability**: Enabled only when in text context or frame is selected
- **Requirement**: Requires active text selection or frame selection with story content

### 5. Frame - `frame`
- **UI Name**: "Frame"
- **Target**: Currently selected text frame objects and their content
- **Use Case**: Targeting specific frame objects and their text content
- **Availability**: Enabled only when in text context or frame is selected
- **Validation**: Checks for text frames or objects with text content

### 6. Selected Text - `selection`
- **UI Name**: "Selected Text"
- **Target**: Currently selected text content (excluding caret-only selections)
- **Use Case**: Precise targeting of specific text ranges
- **Availability**: Enabled only when ranged text is selected (not just caret position)
- **Validation**: Requires actual text selection with character content

## Scripts Using Scope Option

The scope option is implemented across multiple script categories:

### Utilities
- **ChangeNekuda.jsx**: Hebrew diacritic modification
- **DeleteHebrewMarks.jsx**: Hebrew mark removal

### Cleanup
- **CharacterCleanup.jsx**: Multi-operation text cleanup
- **RemoveNumericPrefixes.jsx**: Numeric prefix removal

## User Experience Guidelines

### Dialog Layout
- Scope panel is integrated within the main dialog alongside other options
- Appears as a right-side panel when space allows (side-by-side with main options)
- Radio button group with vertical orientation
- All scope options are always visible but conditionally enabled/disabled
- Clear, descriptive labels for each option
- Default selection on "Document"

### User Feedback
- Confirmation dialogs include scope information
- Fallback notifications when selection-based scopes are unavailable
- Clear indication of processing scope in completion messages

### Error Handling
- Validation of scope availability before processing

## Best Practices for Script Users

### 1. Scope Selection Strategy
- Start with smaller scopes (Selection/Story) for testing
- Use Document scope for single-document operations
- Reserve "All Documents" for batch processing

### 2. Prerequisites by Scope
- **Selection**: Ensure text/objects are selected
- **Story**: Make text selection within target story
- **Page**: Navigate to target page before running script
- **All Documents**: Open all target documents

### 3. Performance Awareness
- Larger scopes require more processing time
- Save work before running "All Documents" operations
- Consider system resources for extensive operations

## Integration Requirements

### Dialog UX Conventions
- Scope must appear in the main dialog alongside options (never as separate dialog)
- All scope options are always displayed but conditionally enabled/disabled based on context
- Must use radio button group for mutually exclusive selection
- Should maintain consistent positioning within dialog layout
- Keep the **order of scope options** consistent across scripts: All Documents, Document, Page, Story, Frame, Selected Text

### Dialog Placement Guidelines
- **Dialog placement** of scope controls:
  - Scope appears as a separate panel within the main dialog
  - Positioned as right column alongside main options panel when space allows
  - Uses side-by-side layout with main options for optimal space usage

## Future Enhancements

Potential improvements to the scope option functionality:

1. **Custom Scope Definitions**
   - User-defined scope presets
   - Saved scope configurations for repeated operations
   - Named scope combinations for complex workflows

2. **Visual Scope Preview**
   - Highlight target areas before processing
   - Show affected content count per scope
   - Preview mode for scope validation

3. **Scope History**
   - Remember last used scope per script type
   - Quick access to frequently used scope combinations
   - Scope usage analytics for workflow optimization

4. **Advanced Scope Filtering**
   - Layer-based scope filtering
   - Style-based scope targeting
   - Content-type specific scoping (tables, footnotes, etc.)

## Compliance and Standards

### Accessibility
- All scope options must be keyboard accessible
- Clear focus indicators for radio button selections
- Screen reader compatible labeling

### Internationalization
- Scope option labels should be localizable
- Cultural considerations for reading order and layout
- Support for right-to-left UI layouts where applicable

### Error Recovery
- Graceful handling of invalid scope selections
- Clear error messages when scope prerequisites are not met
- Automatic fallback to safe default scopes when possible

## Related Documentation

- [Scope Implementation Guide](../../Engineering/ScopeImplementation.md) - Technical implementation details and code examples
- [Dialog UX Conventions](../../Engineering/DialogUXConventions.md) - UI layout and interaction standards
- [Code Standards](../../Engineering/CodeStandards.md) - Development guidelines and best practices

---

*This document covers the functional requirements for the scope option feature. For technical implementation details, code examples, and developer guidance, see the [Scope Implementation Guide](../../Engineering/ScopeImplementation.md).*