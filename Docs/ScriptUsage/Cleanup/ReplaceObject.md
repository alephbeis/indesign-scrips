# Replace Object - Layer and Master Management Script

## Overview

The `ReplaceObject.jsx` script provides comprehensive management of InDesign layers and master spreads through a unified interface. This powerful tool enables users to consolidate content by moving all objects from one layer to another or merging master spread content, with flexible options for handling guides, locked items, and master spread elements, followed by cleanup deletion of source containers.

## Usage

1. Open an InDesign document
2. Run the `ReplaceObject.jsx` script from the Scripts panel
3. Choose your operation type:
   - **Replace a Layer**: Move items between layers and delete source layer
   - **Replace a Parent/Master**: Move master content and delete source master
4. Configure options for the selected operation:
   - Select source and destination containers
   - Configure handling options (guides, locked items, master items)
5. Review confirmation and execute the operation

## Features

- **Dual Operation Mode**: Handle both layer consolidation and master spread merging
- **Flexible Item Handling**: Comprehensive options for guides, locked items, and master elements
- **Smart Container Selection**: Dropdown menus with all available layers and master spreads
- **Confirmation Workflow**: Detailed preview and confirmation before executing operations
- **Comprehensive Cleanup**: Automatic deletion of source containers after successful moves
- **Error Recovery**: Robust handling of locked items, missing content, and operation failures

## Available Operations

### Replace a Layer
- **Purpose**: Consolidate content from multiple layers by moving all items to a destination layer
- **Process**:
  - Move all objects from source layer to destination layer
  - Optionally handle guides, locked items, and master spread items
  - Delete the source layer after successful transfer
- **Options**:
  - Include master spread items in the move
  - Move guides along with objects
  - Handle locked items (skip or force unlock)

### Replace a Parent/Master
- **Purpose**: Merge master spread content by moving all elements to another master spread
- **Process**:
  - Move all master spread items from source to destination
  - Optionally handle guides and locked elements
  - Delete the source master spread after transfer
- **Options**:
  - Move guides between master spreads
  - Handle locked master items appropriately

## User Interface

### Operation Selection
- **Layer Replacement**: Radio button for layer-based operations
- **Master Replacement**: Radio button for master spread operations
- **Smart Defaults**: Automatically selects available operation based on document content

### Layer Options Panel
- **Source Layer Selection**: Dropdown with all available layers
- **Destination Layer Selection**: Dropdown with remaining layers (excludes source)
- **Master Items Checkbox**: Include items on master spreads in the layer move
- **Guides Checkbox**: Move layer guides along with objects
- **Locked Items Checkbox**: Skip locked items rather than forcing unlock

### Master Options Panel
- **Source Master Selection**: Dropdown with all available master spreads
- **Destination Master Selection**: Dropdown with remaining masters (excludes source)
- **Master Guides Checkbox**: Move guides between master spreads
- **Master Locked Items**: Handle locked master elements appropriately

### Confirmation System
- **Operation Summary**: Clear description of planned operation
- **Item Count Display**: Shows number of items to be moved
- **Final Confirmation**: Yes/No dialog before executing changes

## Technical Details

### Layer Processing
- **Object Collection**: Gathers all page items from source layer
- **Master Integration**: Optionally includes master spread items
- **Guide Handling**: Separate processing for layer guides
- **Lock Management**: Respects or overrides item locks based on settings

### Master Spread Processing  
- **Master Item Collection**: Gathers all items from source master spread
- **Cross-Master Transfer**: Moves items between different master spreads
- **Guide Migration**: Handles master spread guides separately from objects
- **Dependency Management**: Ensures proper master spread relationships

### Error Handling and Recovery
- **Locked Item Management**: Configurable handling of locked content
- **Missing Content Detection**: Handles cases where containers are empty
- **Operation Rollback**: Provides recovery mechanisms for failed operations
- **Status Reporting**: Detailed feedback on operation success and failures

## Container Management

### Layer Selection
- **Dynamic Dropdowns**: Lists update based on document layers
- **Exclusion Logic**: Source layer excluded from destination options
- **Name Display**: Shows layer names exactly as they appear in document

### Master Spread Selection
- **Prefix Integration**: Displays master names with proper prefixes
- **Base Name Handling**: Shows both prefix and base name for clarity
- **Cross-Reference Prevention**: Prevents selecting same master as source and destination

## Prerequisites

### Document Requirements
- **Open Document**: Active InDesign document required
- **Multiple Containers**: At least 2 layers or 2 master spreads for meaningful operations
- **Content Availability**: Items to move for productive use of the script

### System Requirements
- **Object Manipulation**: InDesign version supporting comprehensive object management
- **Container Access**: Ability to read and modify layer and master spread properties
- **Dialog Support**: ScriptUI functionality for complex user interface

## Use Cases

### Document Consolidation
- **Layer Cleanup**: Merge similar content layers to reduce document complexity
- **Master Simplification**: Consolidate master spreads with similar content
- **Template Preparation**: Clean up template documents by reducing container count

### Workflow Optimization
- **Content Organization**: Move related items to appropriate layers
- **Master Management**: Reorganize master spread content for better structure
- **Production Cleanup**: Streamline documents before final output

### Project Maintenance
- **Legacy Document Cleanup**: Consolidate outdated layer structures
- **Template Standardization**: Align multiple documents with consistent layer schemes
- **Version Control**: Merge branches of content development

## Performance Considerations

### Processing Efficiency
- **Batch Operations**: Moves all items in single operations for performance
- **Memory Management**: Handles large numbers of objects efficiently
- **Progress Indication**: Provides feedback for long-running operations

### Error Prevention
- **Validation Checks**: Ensures valid source and destination selections
- **Conflict Detection**: Identifies potential issues before processing
- **Rollback Capability**: Provides recovery options for problematic operations

## Advanced Options

### Locked Item Handling
- **Skip Locked**: Leaves locked items in place, moves only unlocked content
- **Force Unlock**: Temporarily unlocks items for moving, then re-locks as needed
- **Status Reporting**: Informs user about locked item handling results

### Guide Management
- **Selective Guide Moving**: Choose whether to include guides in operations
- **Cross-Container Guides**: Handle guides between different container types
- **Guide Preservation**: Maintains guide properties during moves

## Compatibility

This script follows the project's engineering best practices and is compatible with modern InDesign versions. It uses ExtendScript (JSX) format for maximum compatibility across InDesign releases.

**Important Notes:**
- Always work on document copies for complex reorganization operations
- Test with simple content before processing documents with many objects
- Locked item handling may vary depending on InDesign version and security settings
- Master spread operations affect all pages using those masters
- Some object relationships may need manual adjustment after large moves