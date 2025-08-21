# InDesign Scripts

## Overview

A comprehensive collection of Adobe InDesign ExtendScript (JSX) utilities designed to streamline Hebrew publishing workflows and general InDesign operations. This repository provides production-ready scripts for Hebrew text processing, document management, and automated PDF generation.

### Key Features

- **Hebrew Text Processing**: Advanced nikud (vowel mark) transformations, Hebrew character cleanup, and mark removal utilities
- **Automated PDF Export**: Bulk PDF generation with variant support, reversed layouts, and customizable presets
- **Document Management**: Style cleanup, layer management, object replacement, and text selection tools
- **Publishing Workflows**: Specialized tools for Hebrew educational materials, including nekudos variations and conditional content

### Target Users

- Publishers working with Hebrew texts
- Educational material creators
- InDesign professionals requiring bulk operations
- Anyone needing specialized Hebrew typography tools

Note for contributors and AI agents:
- Maintained scripts: These are the canonical reference for coding style and patterns. Unless stated otherwise, everything under Scripts/ is considered Maintained and may be used for code reference.
- Not Maintained scripts: Do NOT use for reference and do NOT update unless explicitly instructed.
  - Scripts/Export/BulkPDFGenerator.jsx
- Docs live under Docs/ (see Docs/README.md for index). Some scripts have dedicated READMEs inside Docs organized by script name.

## Repository layout
- Scripts/ — All runnable scripts
  - Scripts/Export/ — Export scripts (ExportPDF, ExportPlainRTF, BulkPDFGenerator, BulkVariantPDFReverse)
  - Scripts/Utilities/ — Common utilities (ChangeNekuda, DeleteHebrewMarks, SelectText)
  - Scripts/Cleanup/ — Document cleanup utilities (CharacterCleanup, RemoveNumericPrefixes, ReplaceObject, UnusedStylesManager)
- Docs/ — Documentation and references (except this main README)
  - Docs/README.md — Documentation index
  - Docs/ScriptUsage/Export/BulkPDFGenerator.md — "Nekudos" and "Variants" logic, prerequisites, and usage
  - Docs/ScriptUsage/Export/BulkVariantPDFReverse.md — Batch variant PDF export with reversed page order
  - Docs/ScriptUsage/Export/ExportPDF.md — Advanced PDF export with security, interactivity, and page ordering options
  - Docs/ScriptUsage/Export/ExportPlainRTF.md — Plain text RTF export with format removal and page structure preservation
  - Docs/ScriptUsage/Utilities/ChangeNekuda.md — Catalog and usage of niqqud transformer scripts
  - Docs/ScriptUsage/Cleanup/CharacterCleanup.md — Hebrew text normalization with multiple cleanup operations
  - Docs/ScriptUsage/Cleanup/RemoveNumericPrefixes.md — Find and remove numeric prefixes at paragraph beginnings
  - Docs/ScriptUsage/Cleanup/ReplaceObject.md — Move items between layers or merge master spreads
  - Docs/ScriptUsage/Cleanup/UnusedStylesManager.md — Find and delete unused styles across all categories
  - Docs/Engineering/CodeStandards.md — Engineering best practices for scripting
  - Docs/Engineering/DialogUXConventions.md - UX conventions for dialogs

## Installation
InDesign (JSX): place scripts into your Scripts Panel folder and restart InDesign.
- Windows: %AppData%/Adobe/InDesign/[version]/[language]/Scripts/Scripts Panel/
- macOS: ~/Library/Preferences/Adobe InDesign/[version]/[language]/Scripts/Scripts Panel/

## Available scripts

### Export Scripts
- **ExportPDF.jsx** — Export Normal and/or Reversed PDFs using a chosen preset. Features: optional first-page removal, security settings, hyperlinks/bookmarks toggles, viewer preferences, and progress feedback. Non-destructive. See Docs/ScriptUsage/Export/ExportPDF.md for details.
- **BulkVariantPDFReverse.jsx** — Batch export reversed-variant PDFs across multiple documents using a chosen preset. Designed for folder-based processing workflows. See Docs/ScriptUsage/Export/BulkVariantPDFReverse.md for details.
- **ExportPlainRTF.jsx** — Export text-only RTF with all formatting removed. Preserves page breaks, includes section-aware page numbering, and center-aligns text. See Docs/ScriptUsage/Export/ExportPlainRTF.md for details.
- **BulkPDFGenerator.jsx** *(Not Maintained)* — Advanced PDF generation with "Nekudos" and "Variants" logic. See Docs/ScriptUsage/Export/BulkPDFGenerator.md for details.

### Utility Scripts
- **ChangeNekuda.jsx** — Unified Hebrew vowel mark transformer with dialog interface. Convert between 11 different niqqud transformations. See Docs/ScriptUsage/Utilities/ChangeNekuda.md for details.
- **DeleteHebrewMarks.jsx** — Remove Hebrew marks with selective options: Nikud, Teamim, Meteg (selective or all), or combination. Reports removal counts.
- **SelectText.jsx** — Select all text from cursor position to story end. Simple utility for text selection workflows.

### Cleanup Scripts
- **CharacterCleanup.jsx** — Multi-select Hebrew text cleanup: normalize presentation forms, fix dagesh order, remove double spaces, and trim trailing paragraph marks. Includes scope selection. See Docs/ScriptUsage/Cleanup/CharacterCleanup.md for details.
- **RemoveNumericPrefixes.jsx** — Find and remove numeric prefixes at paragraph start (e.g., "1. ", "2. "). Shows per-page counts with confirmation dialog. See Docs/ScriptUsage/Cleanup/RemoveNumericPrefixes.md for details.
- **ReplaceObject.jsx** — Move items between layers or merge master spreads with single dialog. Options for master items, guides, and locked item handling. See Docs/ScriptUsage/Cleanup/ReplaceObject.md for details.
- **UnusedStylesManager.jsx** — Find and delete unused styles (paragraph, character, object, table, cell). Robust deletion with replacement styles and mode selection. See Docs/ScriptUsage/Cleanup/UnusedStylesManager.md for details.

## Usage and compatibility
- Most scripts require an open InDesign document; if none is open the script will alert and exit.
- Scripts are ExtendScript (JSX) and run from the InDesign Scripts Panel after installation.
- Always work on copies or use version control. Many operations are bulk edits; ensure you have a backup.

## Legacy notes
- The previous Deprecated/ folder has been removed from master to reduce clutter. For historical files, check the archive branch named "archive" in the remote repository.
