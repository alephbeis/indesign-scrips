# Intro

- This script enables the user to create multiple PDF variations for a single InDesign file
- There are two primary features
    - Nekudos Logic: Find and replace nekudos to create a set for each nekuda
    - Variants Logic: Toggle layers and conditional text to create multiple sets of PDFs dynamically
- These two features work together
    - For example, if we have 4 levels and 14 nekudos options, we would end up with a total of 56 files
    - If we also have a Language set with two variations, then we have 112 files

# Summary of Script Features

## Create a PDF for each nekuda
- For each nekuda find and replace and generate a PDFs
- Remove sofios once kamatz cycles are complete
- Only apply chataf to appropriate letters

## Create a PDF for each variant
- For each set identified, create a PDF for each variant
    - Or set of PDFs if the user chooses nekudos or more than one set

## Nekudos Logic

- Clean doc
    - `tidyFile` Ensures nekudos where typed correctly and removes double kamatz
- Sofios Logic
- Chataf Logic
- Maze
    - For files that have a maze, we need to ensure that the letters in the maze do not get replaced (by the chataf logic).
    - All maze boxes will have a style called `Maze` when all nekudos are applied randomly for the All Nekudos set, we will not place any chatafs in any box with that style.

## Create a PDF per layer set

**Background**
- The goal of this feature is to dynamically identify sets and varients of each set and to create a PDF for each variant
- The user can choose in the UI which variants they want to output

**General**
- Any layer that has a `-` will be assumed to be a set
- The first word is the set name, all layers with that name are assumed to be variants of that set
- The second word in the set will be the suffix for the output
- Order of suffixes when there is more than one set will from bottom-up based on location in the layers panel
- e.g.
    - Layer names: Language-HE, Language-EN, Level-Red, Level-Orange,
    - Sets: Language: HE, EN. Level: Red, Orange.
    - Combinations: Red/HE, Red/EN, Orange/HE, Orange/EN
    - Output: 4 PDFs
    - File suffixes: -Red_HE.pdf, -Red_EN.pdf, -Orange_HE.pdf, -Orange_EN.pdf

**Conditions**
- Sometimes there is text that needs to be displayed when there is a **combination** of layers displaying. For example, the level name in Hebrew can't be on the Hebrew layer as it should only show on the correct level, it can't be on the level layer as it should only display when we are in Hebrew.
- To accommodate this, we use layers for one factor and conditions for the other factor.
- When displaying a layer we also display any condition that has the same as the layer and hide all the other conditions.
- e.g. (using the example from above)
    - Place text on the Level layer
    - Apply these conditions: Language-HE, Language-EN

## UI

### Choose Nekudos and Sets
- Choose Nekudos: User can choose which nekudos to generate PDFs for.
- Choose Sets: For each set that is identified by the script, using the below method, we will display a section in the UI that will list the available options for the user to choose from.

### Settings
- PDF Location: Same Directory, New Folder
    - Same Directory - PDF output files will be placed in the same directory as the INDD file
    - New Folder - A subfolder will be created in the directory of the INDD file and PDFs will be saved there (current behavior)
- When the script is finished: Close (and don't save), Leave open
    - Close (and don't save) - When the script finishes, it will close the file and not save any changes
    - Leave open - When the script finishes the file will stay open

# File Prerequisites

### Background
- If Nekudos option are selected, then some styles are required in the InDesign file, as the script uses these styles.
- Note: These names are case-sensitive, including the group name 'Directions'.

### Styles
- Paragraph style: `Target Letter`
    - Used to know which pages are Sofios and need to be removed if the nekudah is not kamatz
    - Used to know what letters to replace the sofios with on non sofios pages to do so accumulatively
    - Use to ensure the Target Letter on the page has the correct nekudos on the Cholam and Chirik male/chaser files, and All Nekudos file.
- Paragraph style: `Directions/Target Letter Small`
    - Used to identify the target letter on the instructions page for the last point above
- Color swatch: `Dark blue`
    - This is the color used for text and is targeted by the script

### GREP styles
**Styles in use**

*GREP styles are optionally used to ensure that the letters will be formatted properly for different nekudos*
- For all letters that do not contain a Nekudah under the letter we adjust the baseline to 0 for some paragraph styles
    - `^[^\x{05B0}-\x{05B8}\x{05BB}]+$` any text that does not include those Nekudos
- Cholom chasar and male combined & Chirik chasar and male combined - the target letter needs to be made smaller to accommodate three letters, plus adjustments to the baseline.
    - `([א-ת][^א-ת]*){3,}` This GREP is used to find a text box that contains 3 letters.

**Other styles**
- `.+.*\x{05B9}` any text that is followed by cholam (05b9)
- `.*וּ.*`Any text that contains a shuruk 
