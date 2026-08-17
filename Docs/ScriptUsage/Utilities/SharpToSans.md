# Sharp to Sans - Single-font conversion

## Overview

Alephbeis Sharp sets Hebrew; Sharp Sans Display No1 and Sharp Sans set the Latin beside it. A bilingual
document therefore needs GREP styles to hand each run to the right face — a Latin letter inside a Hebrew
paragraph is switched to the Latin font, and Hebrew inside a Latin paragraph back again.

Alephbeis Sans carries both scripts. This script moves a document onto it and removes the rules that existed
only to hold the old pairing together.

- **Three families become one**: Alephbeis Sharp, Sharp Sans Display No1 and Sharp Sans all become Alephbeis Sans
- **The switching rules go**: the GREP styles that swapped fonts by script are removed
- **Everything else is left alone**: other families, and GREP styles that do something other than switch font

## Usage

1. Install Alephbeis Sans v2.0 (`Design/Fonts/AlephbeisSans/v2.0` on the shared drive), or add it to the
   document's Document Fonts folder
2. Open the document
3. Run `SharpToSans.jsx` from the Scripts panel
4. Leave the GREP checkbox ticked unless you have a reason not to, and press Convert
5. Read the report: it states how many styles, defaults and overrides moved, and how many GREP rules were
   removed against how many were kept

The whole conversion is one undo step.

## What it converts

- Paragraph styles and character styles whose font is one of the three
- The document's text defaults
- Local overrides, swept by find/change one cut at a time

## Which GREP styles are removed

A rule is judged by what it **does**, never by what it is called: it is removed only if the character style it
applies sets one of the fonts being replaced. That is what "switch to the other script's font" looks like from
the outside, and it holds whatever the rule or its character style happen to be named.

Anything else stays. A rule that colours a letter or sets an ornament is somebody's typography and has nothing
to do with the pairing.

On `KriahSefer-Red-A-v11` this removes six rules and keeps three — two that colour an `א` grey, and one that
sets an ornament.

Left in place they would not merely be redundant. A GREP style re-applies its character style on every
composition, so a rule whose font no longer differs becomes an override that cannot be seen and that every new
paragraph inherits.

## The weight names are not the same on both sides

Sharp and Sans are the same drawing released differently — identical advance widths and bounding boxes — but
three cuts carry different labels:

| Sharp | Alephbeis Sans |
| --- | --- |
| Book | Regular |
| Thin | ExtraLight |
| Ultrathin | Thin |

`Semibold` also becomes `SemiBold`, which InDesign treats as a different name.

A family swap that kept the style name would move two of those a full step and say nothing about it, so the
name is mapped rather than carried. A weight the map does not recognise falls back to Regular and is reported.

## Safety

- Every cut the document will ask for is checked **before** anything changes. A weight discovered missing
  halfway through would leave a document converted in part, which is worse than one not converted at all
- One undo step (`UndoModes.ENTIRE_SCRIPT`)
- Find/change preferences are reset before and after use
- The `Fonts:…` character styles are left in the document rather than deleted; after conversion they simply
  point at Alephbeis Sans. Deleting styles is destructive and they may be applied directly somewhere

## Requirements

- An open document
- Alephbeis Sans installed, or present as a document font
- Shared modules: `InDesignUtils.jsx`, `UIUtils.jsx`
