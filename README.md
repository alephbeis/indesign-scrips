# InDesign & Acrobat Scripts

A curated collection of Adobe InDesign ExtendScript (JSX) and Acrobat utilities to streamline publishing workflows: Hebrew text cleanup, style maintenance, selection helpers, layer/parent management, and PDF export variants.

Note for contributors and AI agents:
- Use New/ as the single source of truth for code style and patterns.
- Deprecated/ contains legacy scripts (Acrobat and InDesign). Do not use as style reference and do not modify unless explicitly requested.

## Repository layout
- New/ — Actively maintained InDesign scripts (JSX). Use these for everyday work and for code-style reference.
- Deprecated/ — Legacy/deprecated scripts:
  - Deprecated/InDesign/ — Older JSX scripts kept for historical reference.
  - Deprecated/Acrobat/ — Legacy Acrobat JavaScript (.js) and Action Wizard sequences (.sequ).
- Other/ — Specialized tools and packs:
  - Other/BulkPDFGenerator/ — Advanced PDF variant generator; see its README for full details.
  - Other/Change Nekuda/ — Individual scripts to transform Hebrew nekudos.

## Installation
InDesign (JSX): place scripts into your Scripts Panel folder and restart InDesign.
- Windows: %AppData%\Adobe\InDesign\[version]\[language]\Scripts\Scripts Panel\
- macOS: ~/Library/Preferences/Adobe InDesign/[version]/[language]/Scripts/Scripts Panel/

Acrobat (legacy):
- .sequ (Action Wizard sequences): In Acrobat, go to Tools > Action Wizard > Manage Actions and import the .sequ files from Deprecated/Acrobat/.
- .js (Acrobat JavaScript): Place into Acrobat’s JavaScripts folder (version- and edition-specific); then restart Acrobat.

## Available scripts (New/)
- ExportPDF.jsx — Export Normal and/or Reversed PDFs in one go using a chosen PDF preset. Options include: remove first two pages (for reversed export), security restrictions, hyperlinks/bookmarks/layers toggles, viewer preferences (auto-open), and progress feedback. Non-destructive (restores preferences).
- ExportPlainRTF.jsx — Export a text-only RTF: removes all formatting and objects; preserves page breaks; includes page numbers per page with section-aware numbering; center-aligns text.
- ReplaceObject.jsx — Single dialog to either move items between layers (then delete the source layer) or move/merge parent (master) spreads (then delete the source parent). Includes options for master items, guides, and skipping locked items.
- DeleteHebrewMarks.jsx — Dialog to remove Hebrew marks: Nikud (vowel points), Teamim (cantillation), Meteg selectively (not after Kamatz), all Meteg, or all of the above. Reports counts.
- CharacterCleanup.jsx — Multi-select cleanup: normalize Hebrew presentation forms, ensure dagesh precedes vowels, remove double spaces, and trim trailing paragraph marks at the end of stories. Safely resets GREP prefs.
- RemoveNumericPrefixes.jsx — Lists and/or removes explicit typed numeric prefixes at the start of paragraphs (e.g., "^\d+\.\s*"). Shows per-page counts; includes confirmation.
- UnusedStylesManager.jsx — Find and delete unused paragraph, character, object, table, and cell styles. Robust deletion via replacement styles; includes a mode dropdown and a folder path column.
- SelectText.jsx — Select all text from the cursor (or end of current selection) to the end of the story.

## Other tools
- BulkPDFGenerator — See Other/BulkPDFGenerator/README.md for the “Nekudos” and “Variants” logic, prerequisites, and usage.
- Change Nekuda — A set of focused scripts for handling specific Hebrew nekudos transformations.

## Usage and compatibility
- Most scripts require an open InDesign document; if none is open the script will alert and exit.
- Scripts are ExtendScript (JSX) and run from the InDesign Scripts Panel after installation.
- Always work on copies or use version control. Many operations are bulk edits; ensure you have a backup.

## Legacy notes
- Deprecated/ contains older Acrobat/JSX utilities retained for reference (e.g., legacy FullSweep.jsx, ReplaceDoubleSpace.jsx). Prefer the New/ versions where applicable.
