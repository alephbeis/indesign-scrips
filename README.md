# InDesign Scripts

A curated collection of Adobe InDesign ExtendScript (JSX) utilities to streamline publishing workflows: Hebrew text cleanup, style maintenance, selection helpers, layer/parent management, and PDF export variants.

Note for contributors and AI agents:
- Maintained scripts: These are the canonical reference for coding style and patterns. Unless stated otherwise, everything under Scripts/ is considered Maintained and may be used for code reference.
- Not Maintained scripts: Do NOT use for reference and do NOT update unless explicitly instructed.
  - Scripts/Change Nekuda/ (entire directory)
  - Scripts/Export/BulkPDFGenerator.jsx
- Docs live under Docs/. Some scripts have dedicated READMEs inside Docs organized by script name.

## Repository layout
- Scripts/ — All runnable scripts
  - Scripts/Export/ — Export scripts (ExportPDF, ExportPlainRTF, BulkPDFGenerator)
  - Scripts/Change Nekuda/ — Individual scripts to transform Hebrew niqqud
  - Scripts/Utilities/ — Common utilities (CharacterCleanup, DeleteHebrewMarks, RemoveNumericPrefixes, ReplaceObject, UnusedStylesManager, SelectText)
- Docs/ — Documentation and references (except this main README)
  - Docs/ScriptUsage/BulkPDFGenerator.md — “Nekudos” and “Variants” logic, prerequisites, and usage
  - Docs/ScriptUsage/ChangeNekuda.md — Catalog and usage of niqqud transformer scripts
  - Docs/Acrobat/Install Instructions.txt — Legacy Acrobat action install notes
  - Docs/BestPractices.md — Engineering best practices for scripting

## Installation
InDesign (JSX): place scripts into your Scripts Panel folder and restart InDesign.
- Windows: %AppData%/Adobe/InDesign/[version]/[language]/Scripts/Scripts Panel/
- macOS: ~/Library/Preferences/Adobe InDesign/[version]/[language]/Scripts/Scripts Panel/

## Available scripts
- ExportPDF.jsx — Export Normal and/or Reversed PDFs in one go using a chosen PDF preset. Options include: remove first two pages (for reversed export), security restrictions, hyperlinks/bookmarks/layers toggles, viewer preferences (auto-open), and progress feedback. Non-destructive (restores preferences).
- ExportPlainRTF.jsx — Export a text-only RTF: removes all formatting and objects; preserves page breaks; includes page numbers per page with section-aware numbering; center-aligns text.
- ReplaceObject.jsx — Single dialog to either move items between layers (then delete the source layer) or move/merge parent (master) spreads (then delete the source parent). Includes options for master items, guides, and skipping locked items.
- DeleteHebrewMarks.jsx — Dialog to remove Hebrew marks: Nikud (vowel points), Teamim (cantillation), Meteg selectively (not after Kamatz), all Meteg, or all of the above. Reports counts.
- CharacterCleanup.jsx — Multi-select cleanup: normalize Hebrew presentation forms, ensure dagesh precedes vowels, remove double spaces, and trim trailing paragraph marks at the end of stories. Safely resets GREP prefs.
- RemoveNumericPrefixes.jsx — Lists and/or removes explicit typed numeric prefixes at the start of paragraphs (e.g., "^\d+\.\s*"). Shows per-page counts; includes confirmation.
- UnusedStylesManager.jsx — Find and delete unused paragraph, character, object, table, and cell styles. Robust deletion via replacement styles; includes a mode dropdown and a folder path column.
- SelectText.jsx — Select all text from the cursor (or end of current selection) to the end of the story.

## Other tools
- BulkPDFGenerator — See Docs/ScriptUsage/BulkPDFGenerator.md for the “Nekudos” and “Variants” logic, prerequisites, and usage.
- Change Nekuda — See Docs/ScriptUsage/ChangeNekuda.md for details and conversions.

## Usage and compatibility
- Most scripts require an open InDesign document; if none is open the script will alert and exit.
- Scripts are ExtendScript (JSX) and run from the InDesign Scripts Panel after installation.
- Always work on copies or use version control. Many operations are bulk edits; ensure you have a backup.

## Legacy notes
- The previous Deprecated/ folder has been removed from master to reduce clutter. For historical files, check the archive branch named "archive" in the remote repository.
