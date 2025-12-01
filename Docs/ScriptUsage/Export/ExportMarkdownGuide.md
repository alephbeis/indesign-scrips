# ExportMarkdownGuide

**Script**: `Scripts/Export/ExportMarkdownGuide.jsx`

## Purpose

Export InDesign documents to Markdown format with automatic style detection and conversion. Optimized for teacher guides and educational content destined for AI/RAG systems.

## Key Features

- **Automatic Style Detection**: Converts InDesign paragraph styles to markdown syntax
- **Headers**: H1-H6 styles → `#`, `##`, `###`, etc.
- **Lists**: Numbered and bulleted lists with multi-level nesting support
- **Tables**: InDesign tables → Markdown table format
- **Book Sections**: Special top-level formatting with underlines
- **Page Preservation**: Page numbers maintained as HTML comments for citations
- **UTF-8 Support**: Full Hebrew and multilingual text support
- **Reading Order**: Automatic top-to-bottom, left-to-right sorting

## Usage

### Basic Workflow

1. Open your InDesign document
2. Run script: **File → Scripts → ExportMarkdownGuide.jsx**
3. Choose save location and filename (`.md` or `.txt`)
4. Wait for progress bar to complete
5. Review output file in markdown editor

### Output Filename

Default: `[DocumentName].md`

Example: `Ultimate-Guide-2024.md`

## Style Mapping

### Headers

The script searches for H1-H6 **anywhere** in the paragraph style name (case-insensitive):

| InDesign Style | Markdown Output |
|----------------|-----------------|
| H1, H1 / TOC, My H1 Style | `# Header` |
| H2, H2 / TOC, Section H2 | `## Header` |
| H3, H3 / Letters, H3 / Numbered | `### Header` |
| H4, H5, H6 | `####`, `#####`, `######` |

**Examples**:
- `H1` → `# Chapter Title`
- `H2 / TOC` → `## Section Name`
- `Custom H3 Style` → `### Subsection`

### Book Level (Top-Level)

Styles containing "Book" (without H1-H6) receive special formatting:

| InDesign Style | Markdown Output |
|----------------|-----------------|
| Book, Book Name | Text with `===` underline |

**Example**:
```markdown
Introduction to Hebrew Reading
==============================
```

### Lists

#### Numbered Lists

Any style containing: `Numbered`, `Ordered`, `List` + `Number`

**Multi-level support** via style names:
- `Numbered List L1` → Top-level (no indent)
- `Numbered List L2` → Indented (2 spaces)
- `Numbered List L3` → Double indented (4 spaces)
- `Numbered List Level 2`, `List 2`, `Sub List` → Also recognized

**Example**:
```markdown
1. First item
1. Second item
  1. Nested item
  1. Another nested
1. Back to top level
```

Note: All items use `1.` - markdown auto-numbers when rendered. This is standard markdown practice.

#### Bulleted Lists

Any style containing: `Bullet`, `Unordered`, `List` (non-numbered)

**Multi-level support**: Same as numbered lists (L1, L2, L3, etc.)

**Example**:
```markdown
- First bullet
- Second bullet
  - Nested bullet
  - Another nested
- Back to top level
```

### Tables

InDesign tables (including those inside text frames) are automatically converted to markdown table format:

**Example**:
```markdown
| Column 1 | Column 2 |
| --- | --- |
| Row 1 Cell 1 | Row 1 Cell 2 |
| Row 2 Cell 1 | Row 2 Cell 2 |
```

First row is treated as header with separator line.

### Regular Text

All other paragraph styles are output as plain text.

## Page Markers

Each page is separated with:

```markdown
---
<!-- Page 5 -->
```

This preserves page boundaries for citation purposes in RAG/AI systems.

## Best Practices

### Before Export

1. **Apply Consistent Styles**: Use H1, H2, H3 for section headers
2. **Verify Reading Order**: Text frames flow naturally top-to-bottom, left-to-right
3. **Check List Styles**: Use consistent naming (e.g., `Numbered List L1`, `L2`)
4. **Test Tables**: Ensure tables are proper InDesign table objects
5. **Remove Decorative Elements**: Delete headers, footers, page numbers if not needed

### After Export

1. **Review Output**: Open `.md` file in markdown editor (VS Code, Typora, etc.)
2. **Verify Headers**: Check that H1-H6 are properly detected
3. **Check Lists**: Ensure multi-level lists are correctly indented
4. **Test Tables**: Confirm table structure is preserved
5. **Validate Page Numbers**: Ensure citations will work correctly

### For AI/RAG Systems

- **Descriptive Headers**: Use clear section titles for better semantic search
- **Structured Content**: Organize logically with proper hierarchy
- **Page Numbers**: Keep accurate for citation tracking
- **Clean Text**: Remove unnecessary formatting or artifacts

## Customization

### Adding Custom Style Patterns

To detect additional style names, edit the detection functions in the script:

**Location**: Lines 183-220 in `ExportMarkdownGuide.jsx`

**Example**: Add detection for "Chapter" as H1:
```javascript
function getMarkdownHeaderLevel(styleName) {
    // ... existing code ...

    // Add custom pattern
    if (name.indexOf("CHAPTER") >= 0) return 1;

    // ... rest of code ...
}
```

### Modifying Page Separators

**Location**: Lines 385-390

**Current format**:
```javascript
markdownParts.push("\n---\n");
markdownParts.push("<!-- Page " + getDisplayPageLabel(srcPage) + " -->\n");
```

**Alternative - visible separators**:
```javascript
markdownParts.push("\n\n========================================\n");
markdownParts.push("PAGE " + getDisplayPageLabel(srcPage) + "\n");
markdownParts.push("========================================\n\n");
```

## Common Issues

### Headers Not Detected

**Problem**: Text appears as plain paragraphs instead of headers

**Solution**:
- Verify paragraph style names contain "H1", "H2", etc.
- Check **Window → Styles → Paragraph Styles** for exact names
- Add custom detection pattern if using non-standard naming

### Lists Not Indenting

**Problem**: Nested lists appear at top level

**Solution**:
- Use style names with level indicators: `L1`, `L2`, `Level 2`, `List 2`
- Or: Use consistent leading spaces (4 spaces = 1 level)
- Check that style name contains "List", "Numbered", or "Bullet"

### Tables Missing

**Problem**: Table content appears as plain text

**Solution**:
- Ensure tables are proper InDesign table objects (not tab-separated text)
- Tables can be inside text frames - script checks both locations
- Verify table has rows and columns via **Table → Table Options**

### Hebrew Text Issues

**Problem**: Hebrew characters appear garbled

**Solution**:
- File encoding is UTF-8 by default (correct)
- Open with UTF-8 compatible editor (VS Code, Sublime, Notepad++)
- Do NOT use basic Notepad (use Notepad++ or better)

### Wrong Reading Order

**Problem**: Content appears in unexpected sequence

**Solution**:
- Check frame positions in InDesign
- Script sorts by Y coordinate (top), then X coordinate (left)
- Consider threading text frames for guaranteed order

## Technical Details

- **Language**: ExtendScript (JavaScript for InDesign)
- **InDesign Version**: CC 2018+
- **Dependencies**: `InDesignUtils.jsx`, `UIUtils.jsx` (in `Scripts/Shared/`)
- **Performance**: ~50-100 pages per minute (varies by complexity)
- **Memory**: Minimal (no temporary document created)
- **Output Encoding**: UTF-8

## Comparison with ExportPlainRTF

| Feature | ExportPlainRTF | ExportMarkdownGuide |
|---------|----------------|---------------------|
| Output Format | RTF | Markdown (.md/.txt) |
| Style Detection | ❌ No | ✅ Yes (H1-H6, lists) |
| Tables | ❌ No | ✅ Yes (markdown tables) |
| Temp Document | ✅ Creates temp doc | ❌ Direct export |
| Page Breaks | RTF page breaks | Markdown separators |
| Performance | Slower | Faster |
| Best For | RTF editors | Plain text, AI/RAG systems |
| Hebrew Support | ✅ Yes | ✅ Yes |

## Example Output

**Input (InDesign)**:
```
[Book] Introduction to Hebrew Reading
[H1] Chapter 1: The Aleph-Bet
[H2] Letter Recognition
[Numbered List L1] 1. Learn letter names
[Numbered List L2] a. Practice with flashcards
[Numbered List L2] b. Review daily
[Numbered List L1] 2. Master letter sounds
[Body Text] Regular paragraph text...
```

**Output (Markdown)**:
```markdown
<!-- Page 1 -->

Introduction to Hebrew Reading
==============================

# Chapter 1: The Aleph-Bet

## Letter Recognition

1. Learn letter names
  1. Practice with flashcards
  1. Review daily
1. Master letter sounds

Regular paragraph text...
```

## Version History

- **v1.0** (2025-01-16): Initial release
  - H1-H6 style detection
  - Numbered and bulleted lists
  - Multi-level list support (L1-L5)
  - Table conversion
  - Book-level formatting
  - Page markers
  - UTF-8 encoding
  - Reading order sorting

## Related Scripts

- **ExportPlainRTF**: Export to RTF with page structure
- **BulkPDFGenerator**: Bulk PDF export with variants
- **SeferGuideExport**: Specialized export for Sefer guides

## Integration with AMA System

This script is part of the AMA (Ask Me Anything) teacher guide processing pipeline. For complete implementation details:

- **Workflow**: `/Users/shmuel/Projects/alephbeis-app/.wip/AB-1391-AMA/Phase-1/03.5-guide-extraction-workflow.md`
- **Chunking Rules**: `/Users/shmuel/Projects/alephbeis-app/.wip/AB-1391-AMA/Phase-1/03.2-chunking-rules.md`
- **Metadata Extraction**: `/Users/shmuel/Projects/alephbeis-app/.wip/AB-1391-AMA/Phase-1/03.4-llm-metadata-extraction.md`
- **Cross-Reference Linking**: `/Users/shmuel/Projects/alephbeis-app/.wip/AB-1391-AMA/Phase-1/03.3-cross-reference-linking.md`
- **Implementation Summary**: `/Users/shmuel/Projects/alephbeis-app/.wip/AB-1391-AMA/Phase-1/03.6-implementation-summary.md`

## Support

For issues or feature requests, refer to the main repository documentation or consult the script source code comments.
