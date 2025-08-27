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
- Troubleshooting: See Docs/Troubleshooting/PermissionsGuide.md for macOS Automation/Accessibility permissions fixes.

## Repository layout

- Scripts/ — Runnable scripts and shared utility libraries
    - Scripts/Export/ — Export scripts (ExportPDF, ExportPlainRTF, BulkPDFGenerator, BulkPDFReverse)
    - Scripts/Utilities/ — Common utilities (ChangeNekuda, DeleteHebrewMarks, SelectText)
    - Scripts/Cleanup/ — Document cleanup utilities (CharacterCleanup, RemoveNumericPrefixes, ReplaceObject, UnusedStylesManager)
    - Scripts/Shared/ — Shared utility libraries (InDesignUtils.jsx provides error handling, object utilities, layer management, and preferences management; FindChangeUtils.jsx provides find/change operations; UIUtils.jsx provides UI helpers; ScopeUtils.jsx provides scope resolution; ExportUtils.jsx provides export/PDF helpers). Exposed namespaces: InDesignUtils, FindChange, UIUtils, ScopeUtils, ExportUtils
- UXP/ — UXP-based scripts and plugins (ExportPDF.uxp.js)
- Docs/ — Documentation and references (except this main README)
    - Docs/README.md — Documentation index
    - Docs/ScriptUsage/Export/BulkPDFGenerator.md — "Nekudos" and "Variants" logic, prerequisites, and usage
    - Docs/ScriptUsage/Export/BulkPDFReverse.md — Batch variant PDF export with reversed page order
    - Docs/ScriptUsage/Export/ExportPDF.md — Advanced PDF export with security, interactivity, and page ordering options
    - Docs/ScriptUsage/Export/ExportPlainRTF.md — Plain text RTF export with format removal and page structure preservation
    - Docs/ScriptUsage/Utilities/ChangeNekuda.md — Catalog and usage of niqqud transformer scripts
    - Docs/ScriptUsage/Cleanup/CharacterCleanup.md — Hebrew text normalization with multiple cleanup operations
    - Docs/ScriptUsage/Cleanup/RemoveNumericPrefixes.md — Find and remove numeric prefixes at paragraph beginnings
    - Docs/ScriptUsage/Cleanup/ObjectPreflight.md — Detect frames off their Object Style's enforced X/Y; includes reverse mode to find styles without absolute X/Y
    - Docs/ScriptUsage/Cleanup/ReplaceObject.md — Move items between layers or merge master spreads
    - Docs/ScriptUsage/Cleanup/UnusedStylesManager.md — Find and delete unused styles across all categories
    - Docs/Engineering/CodeStandards.md — Engineering best practices for scripting
    - Docs/Engineering/DialogUXConventions.md - UX conventions for dialogs

## Installation

InDesign (JSX): place scripts into your Scripts Panel folder and restart InDesign.

- Windows: %AppData%/Adobe/InDesign/[version]/[language]/Scripts/Scripts Panel/
- macOS: ~/Library/Preferences/Adobe InDesign/[version]/[language]/Scripts/Scripts Panel/

### Using the Shared folder (important)

- All shared utility modules must live under Scripts/Shared/.
- Runnable entry-point scripts should be placed in their respective category folders (e.g., Scripts/Export, Scripts/Utilities, Scripts/Cleanup) and load shared modules from Scripts/Shared.
- Scripts are expected to include shared code via $.evalFile() using paths relative to the script’s folder, for example:
    - File(scriptFolder + "/Shared/InDesignUtils.jsx")
    - File(scriptFolder + "/Shared/FindChangeUtils.jsx")
    - File(scriptFolder + "/Shared/UIUtils.jsx")
    - File(scriptFolder + "/Shared/ScopeUtils.jsx")
    - File(scriptFolder + "/Shared/ExportUtils.jsx")
- Keep all common helpers inside Scripts/Shared so that every script can reliably load them. See Docs/Engineering/SharedUtilities.md for details.

## Development Setup

For contributors working with the codebase:

### Prerequisites

```bash
npm ci  # Install development dependencies
```

### Code Formatting

This project uses Prettier for consistent code formatting across all JavaScript/JSX files:

```bash
npm run format        # Format all files
npm run format:check  # Check formatting without making changes
```

### Linting

ESLint is configured with separate rules for ExtendScript (.jsx) and UXP (.js) environments:

```bash
npm run lint  # Run ESLint on all Scripts/**/*.jsx files
```

### Code Standards

- All code must pass ESLint validation before submission
- Prettier formatting is enforced - run `npm run format` before committing
- Line endings are enforced as LF via .gitattributes
- See `Docs/Engineering/CodeStandards.md` for detailed coding conventions

### Maintenance & Style

- Single source of truth for code and comment style: see STYLEGUIDE.md
- Editor/IDE baseline: see .editorconfig
- Automated formatting and linting:
    - npm run format / npm run format:check
    - npm run lint
- Audit artifacts live in .wip/ during review and must be removed after approval.

## Available scripts

### Export Scripts

- **ExportPDF.jsx** — Export Normal and/or Reversed PDFs using a chosen preset. Features: optional first-page removal (reversed only), basic security (Print PDF), Interactive PDF mode, optional text watermark, “View PDF after export,” progress feedback, and optional PDF subfolder. Non-destructive. See Docs/ScriptUsage/Export/ExportPDF.md for details.
- **ExportPDF.uxp.js** — UXP-based variant of ExportPDF with core features (Normal/Reversed order, optional skip-first-two, preset selection, view-after-export). Configure options via the CONFIG object at the top of the file. See Docs/ScriptUsage/Export/ExportPDF.md → UXP Version.
- **BulkPDFReverse.jsx** — Batch export reversed-variant PDFs across multiple documents using a chosen preset. Designed for folder-based processing workflows. See Docs/ScriptUsage/Export/BulkPDFReverse.md for details.
- **ExportPlainRTF.jsx** — Export text-only RTF with all formatting removed. Preserves page breaks, includes section-aware page numbering, and center-aligns text. See Docs/ScriptUsage/Export/ExportPlainRTF.md for details.
- **BulkPDFGenerator.jsx** _(Not Maintained)_ — Advanced PDF generation with "Nekudos" and "Variants" logic. See Docs/ScriptUsage/Export/BulkPDFGenerator.md for details.

### Utility Scripts

- **ChangeNekuda.jsx** — Unified Hebrew vowel mark transformer with dialog interface. Convert between 11 different niqqud transformations. See Docs/ScriptUsage/Utilities/ChangeNekuda.md for details.
- **DeleteHebrewMarks.jsx** — Remove Hebrew marks with selective options: Nikud, Teamim, Meteg (selective or all), or combination. Reports removal counts.
- **SelectText.jsx** — Select all text from cursor position to story end. Simple utility for text selection workflows.

### Cleanup Scripts

- **CharacterCleanup.jsx** — Multi-select Hebrew text cleanup: normalize presentation forms, fix dagesh order, remove double spaces, and trim trailing paragraph marks. Includes scope selection. See Docs/ScriptUsage/Cleanup/CharacterCleanup.md for details.
- **RemoveNumericPrefixes.jsx** — Find and remove numeric prefixes at paragraph start (e.g., "1. ", "2. "). Features combined interface with occurrence listing, "Go To" navigation, and intelligent pre-scanning. See Docs/ScriptUsage/Cleanup/RemoveNumericPrefixes.md for details.
- **ObjectPreflight.jsx** — Find frames whose position is off from their Object Style's enforced page-relative X/Y, with a reverse mode to list styles that don't enforce absolute X/Y. Includes Go To and Fix actions. See Docs/ScriptUsage/Cleanup/ObjectPreflight.md for details.
- **ReplaceObject.jsx** — Move items between layers or merge master spreads with single dialog. Options for master items, guides, and locked item handling. See Docs/ScriptUsage/Cleanup/ReplaceObject.md for details.
- **UnusedStylesManager.jsx** — Find and delete unused styles (paragraph, character, object, table, cell). Robust deletion with replacement styles and mode selection. See Docs/ScriptUsage/Cleanup/UnusedStylesManager.md for details.

## Usage and compatibility

- Most scripts require an open InDesign document; if none is open the script will alert and exit.
- Scripts are ExtendScript (JSX) and run from the InDesign Scripts Panel after installation.
- Always work on copies or use version control. Many operations are bulk edits; ensure you have a backup.

## Legacy notes

- The previous Deprecated/ folder has been removed from master to reduce clutter. For historical files, check the archive branch named "archive" in the remote repository.
