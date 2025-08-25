# Documentation Index

This folder contains all repository documentation, organized by topic. The main project overview remains in the root README.md.

Contents

- ScriptUsage
  - Export
    - ExportPDF.md — Advanced PDF export with security, interactivity, and page ordering options.
    - ExportPlainRTF.md — Plain text RTF export with formatting removed and page structure preserved.
    - BulkPDFReverse.md — Batch reversed-order PDF export across multiple documents with preset control.
    - BulkPDFGenerator.md — Feature overview, Nekudos and Variants logic, prerequisites, and usage. (Not Maintained)
  - Utilities
    - ChangeNekuda.md — Catalog of niqqud conversion scripts with details per conversion and usage.
    - DeleteHebrewMarks.md — Remove Hebrew marks with options (Nikud, Teamim, Meteg) and reporting.
    - SelectText.md — Select all text from cursor position to story end.
  - Cleanup
    - CharacterCleanup.md — Hebrew text normalization and cleanup operations.
    - RemoveNumericPrefixes.md — Remove numeric prefixes at paragraph starts.
    - ObjectPreflight.md — Detect frames off their Object Style's enforced X/Y; includes reverse mode to find styles without absolute X/Y.
    - ReplaceObject.md — Move items between layers or merge master spreads.
    - UnusedStylesManager.md — Find and delete unused paragraph/character/object/table/cell styles.
  - Components
    - ScopeChooser.md — Reusable dialog component for scope selection in scripts.
- Engineering
  - CodeStandards.md — Engineering code standards, safety patterns, and performance guidelines.
  - DialogUXConventions.md — Dialog UI/UX conventions for scripts (layout, scope, buttons).
  - SharedUtilities.md — Documentation for shared utility functions and InDesign helper methods.
  - ScopeImplementation.md — Technical implementation details for scope selection functionality.
  - ImprovementBacklog.md — Engineering improvement backlog and technical debt tracking.

Notes

- Script sources live under Scripts/.
- Some scripts have their own dedicated README files here to keep usage and prerequisites close to the feature set.
- The historical Deprecated/ folder was removed from master; the full history is preserved in the archive branch.
