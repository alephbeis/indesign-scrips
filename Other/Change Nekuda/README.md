# Change Nekuda (Hebrew niqqud transformers)

These InDesign JSX scripts convert one Hebrew vowel mark (niqqud) into another throughout the active document. Each file performs a single, focused transformation using GREP Find/Change and is safe to run on any Hebrew text that uses standard Unicode combining marks.

## What they do
- Perform a document-wide GREP replacement of specific niqqud marks.
- Include footnotes, hidden layers, master pages, and locked layers/stories in the search.
- Reset Find/Change GREP preferences before and after each operation.
- Some scripts also replace literal Hebrew names of the niqqud (e.g., "צירי" -> "סגול") when those words appear in the document (useful for instructional/label text).

## Scope and behavior
- Operates on the active InDesign document (not just the current selection).
- Actions are undoable in InDesign; still, work on a copy or ensure you have version control/backups.
- Normalization: 00-Pasach-Tzeirei also collapses duplicate patach marks to a single one before converting, to avoid doubled marks.

## Script catalog and conversions
File names indicate the conversion. Unicode shown in parentheses.

- 00-Pasach-Tzeirei.jsx
  - Collapses duplicates: Patach + Patach -> Patach (U+05B7 U+05B7 -> U+05B7)
  - Converts: Patach -> Tsere (U+05B7 -> U+05B5)
  - Also replaces words: "פתח" -> "צירי"
- 01-Tzeirei-Segol.jsx
  - Tsere -> Segol (U+05B5 -> U+05B6)
  - Also replaces words: "צירי" -> "סגול"
- 02-Segol-Sheva.jsx
  - Segol -> Sheva (U+05B6 -> U+05B0)
  - Also replaces words: "סגול" -> "שוא"
- 03-Sheva-ChirikChaser.jsx
  - Sheva -> Hiriq chaser (U+05B0 -> U+05B4)
  - Also replaces words: "שוא" -> "חיריק חסר"
- 04-ChirikChaser-ChirikMale.jsx
  - Hiriq chaser -> Hiriq male (U+05B4 -> U+05B4 U+05D9) [adds yod]
  - Also replaces words: "חיריק חסר" -> "חיריק מלא"
- 05-ChirikMale-Kubutz.jsx
  - Hiriq male -> Qubutz (U+05B4 U+05D9 -> U+05BB)
  - Also replaces words: "חיריק מלא" -> "קבוץ"
- 06-Kubutz-Shuruk.jsx
  - Qubutz -> Shuruk (U+05BB -> U+05D5 U+05BC) [vav + dagesh]
  - Also replaces words: "קבוץ" -> "שורוק"
- 07-Shuruk-CholamChaser.jsx
  - Shuruk -> Cholam chaser (U+05D5 U+05BC -> U+05B9)
  - Also replaces words: "שורוק" -> "חולם חסר"
- 08-CholamChaser-CholamMale.jsx
  - Cholam chaser -> Cholam male (U+05B9 -> U+05D5 U+05B9) [adds vav]
  - Also replaces words: "חולם חסר" -> "חולם מלא"
- 09-CholamMale-Pasach.jsx
  - Cholam male -> Patach (U+05D5 U+05B9 -> U+05B7)
  - Also replaces words: "חולם מלא" -> "פתח"

Taken together, these scripts form a conversion cycle:
Patach -> Tsere -> Segol -> Sheva -> Hiriq chaser -> Hiriq male -> Qubutz -> Shuruk -> Cholam chaser -> Cholam male -> Patach

## Installation
Place the .jsx files into your InDesign Scripts Panel folder, then restart InDesign.
- Windows: %AppData%/Adobe/InDesign/[version]/[language]/Scripts/Scripts Panel/
- macOS: ~/Library/Preferences/Adobe InDesign/[version]/[language]/Scripts/Scripts Panel/

## Usage
- Open your InDesign document.
- In the Scripts panel, double-click the desired script (e.g., 02-Segol-Sheva.jsx).
- The script runs immediately and applies the conversion to the entire document.

## Notes and limitations
- These scripts assume Unicode Hebrew combining marks; they are not intended for legacy Hebrew presentation forms.
- If your document contains instructional text that literally names the niqqud (e.g., "חיריק מלא"), those words may also be changed as described above.
- GREP options include footnotes, hidden/master pages, and locked items by design to ensure complete coverage. If you need a narrower scope, consider working on a copy of the document.
