# Sefer Guide Export

## Overview

`SeferGuideExport.jsx` exports a separate PDF for each section of your InDesign document. A section begins at any page that contains an object with the object style named `Divider Page`. Each exported PDF will also include the first three pages of the document (front matter). Before each export, the script updates the text of the object named `Level` on page 1 to show the section's name (with any hyphens `-` replaced by bullets `•`). After all exports complete, the original `Level` text is restored.

## What the Script Does
- Finds all divider pages (pages containing any object with object style `Divider Page`).
- Defines sections as continuous page ranges from one divider page up to the page before the next divider page (or to the end of the document).
- Derives the section name from the first page item on the divider page that has a non-empty name.
- Includes the document’s first three pages in every exported PDF.
- Temporarily updates the `Level` object on page 1 to the section name (hyphens are replaced by bullets) for the duration of each export.
- Exports each section PDF into a `PDF` subfolder and names it: `<DocumentBase> - <SectionName>.pdf`.

## Prerequisites
To ensure correct behavior, please prepare your document as follows (all names are case-sensitive):

1) Divider Identification
- On each section start page, place an object (any page item) that uses the object style named exactly `Divider Page`.

2) Section Naming Source
- Make sure the divider page contains at least one page item whose `Name` (InDesign’s Name field) is set. The first named object found on that page is used as the section name.

3) Level Text on First Page
- On the document’s first page, ensure there is a text frame (or named object that exposes `contents`) named exactly `Level`.
- This frame’s contents will be updated per section and restored at the end.

4) Output Location / Permissions
- If your INDD is saved: PDFs will be exported into a `PDF` subfolder alongside the document.
- If your INDD is unsaved: you will be prompted for a base folder; the script creates/uses its `PDF` subfolder.

5) Interactive PDF Export
- Exports using the Interactive PDF engine so hyperlinks/bookmarks work. No print preset is required.

## Usage
1. Open your InDesign document and confirm the prerequisites above are satisfied.
2. In the Scripts panel, run `Scripts/Export/SeferGuideExport.jsx`.
3. If prompted (for unsaved documents), choose a base folder; a `PDF` subfolder will be created/used for output.
4. Wait for the progress palette to complete. Each section will be exported as a separate PDF.

## Output Details
- File naming: `<DocumentBase> - <SectionName>.pdf` (sanitized for filesystem safety).
- Pages included: front matter `+1` to `+3` (or up to the document length if fewer than 3 pages) plus the section’s page range, all using absolute `+` numbering to avoid section numbering issues.
- Location: A `PDF` subfolder next to your INDD, or under the selected base folder for unsaved docs.

## Safety & Standards
- Single undo step wraps the whole operation.
- Script preferences (measurement units, redraw) are restored in `finally`.
- The original `Level` text is restored after all exports, even if an error occurs.

## Troubleshooting
- "No sections found": Ensure your divider pages have at least one object with object style `Divider Page`.
- "Level" not updating: Confirm the first page contains a named object or text frame called `Level`.
- Unexpected section names: Set the `Name` field on the divider page’s first object you expect to be used; the first non-empty object name found is used.
- Nothing exported: Verify the document has pages and that InDesign supports Interactive PDF export on your system.

## Notes
- Hyphens in the section name are replaced with bullets (`-` → `•`) when populating the `Level` text on page 1.
- The `ExportSectionsToPDF.jsx` legacy script is superseded by `SeferGuideExport.jsx`.
