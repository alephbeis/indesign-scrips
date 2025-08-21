# InDesign Scripts

A curated collection of Adobe InDesign ExtendScript (JSX) utilities to streamline publishing workflows: Hebrew text cleanup, style maintenance, selection helpers, layer/parent management, and PDF export variants.

Note for contributors and AI agents:
- Maintained scripts: These are the canonical reference for coding style and patterns. Unless stated otherwise, everything under Scripts/ is considered Maintained and may be used for code reference.
- Not Maintained scripts: Do NOT use for reference and do NOT update unless explicitly instructed.
  - Scripts/Export/BulkPDFGenerator.jsx
- Docs live under Docs/ (see Docs/README.md for index). Some scripts have dedicated READMEs inside Docs organized by script name.

## Repository layout
- Scripts/ — All runnable scripts
  - Scripts/Export/ — Export scripts (ExportPDF, ExportPlainRTF, BulkPDFGenerator, BulkVariantPDFReverse)
  - Scripts/Utilities/ — Common utilities (ChangeNekuda, CharacterCleanup, DeleteHebrewMarks, RemoveNumericPrefixes, ReplaceObject, UnusedStylesManager, SelectText)
- Docs/ — Documentation and references (except this main README)
  - Docs/README.md — Documentation index
  - Docs/ScriptUsage/BulkPDFGenerator.md — “Nekudos” and “Variants” logic, prerequisites, and usage
  - Docs/ScriptUsage/ChangeNekuda.md — Catalog and usage of niqqud transformer scripts
  - Docs/Engineering/CodeStandards.md — Engineering best practices for scripting
  - Docs/Engineering/DialogUXConventions.md - UX conventions for dialogs

## Installation
InDesign (JSX): place scripts into your Scripts Panel folder and restart InDesign.
- Windows: %AppData%/Adobe/InDesign/[version]/[language]/Scripts/Scripts Panel/
- macOS: ~/Library/Preferences/Adobe InDesign/[version]/[language]/Scripts/Scripts Panel/

## Available scripts

### Export Scripts
- **ExportPDF.jsx** — Export Normal and/or Reversed PDFs using a chosen preset. Features: optional first-page removal, security settings, hyperlinks/bookmarks toggles, viewer preferences, and progress feedback. Non-destructive.
- **BulkVariantPDFReverse.jsx** — Batch export reversed-variant PDFs across multiple documents using a chosen preset. Designed for folder-based processing workflows.
- **ExportPlainRTF.jsx** — Export text-only RTF with all formatting removed. Preserves page breaks, includes section-aware page numbering, and center-aligns text.
- **BulkPDFGenerator.jsx** *(Not Maintained)* — Advanced PDF generation with "Nekudos" and "Variants" logic. See Docs/ScriptUsage/BulkPDFGenerator.md for details.

### Utility Scripts
- **ChangeNekuda.jsx** — Unified Hebrew vowel mark transformer with dialog interface. Convert between 11 different niqqud transformations. See Docs/ScriptUsage/ChangeNekuda.md for details.
- **CharacterCleanup.jsx** — Multi-select Hebrew text cleanup: normalize presentation forms, fix dagesh order, remove double spaces, and trim trailing paragraph marks. Includes scope selection.
- **DeleteHebrewMarks.jsx** — Remove Hebrew marks with selective options: Nikud, Teamim, Meteg (selective or all), or combination. Reports removal counts.
- **RemoveNumericPrefixes.jsx** — Find and remove numeric prefixes at paragraph start (e.g., "1. ", "2. "). Shows per-page counts with confirmation dialog.
- **ReplaceObject.jsx** — Move items between layers or merge master spreads with single dialog. Options for master items, guides, and locked item handling.
- **UnusedStylesManager.jsx** — Find and delete unused styles (paragraph, character, object, table, cell). Robust deletion with replacement styles and mode selection.
- **SelectText.jsx** — Select all text from cursor position to story end. Simple utility for text selection workflows.

## Usage and compatibility
- Most scripts require an open InDesign document; if none is open the script will alert and exit.
- Scripts are ExtendScript (JSX) and run from the InDesign Scripts Panel after installation.
- Always work on copies or use version control. Many operations are bulk edits; ensure you have a backup.

## Legacy notes
- The previous Deprecated/ folder has been removed from master to reduce clutter. For historical files, check the archive branch named "archive" in the remote repository.
