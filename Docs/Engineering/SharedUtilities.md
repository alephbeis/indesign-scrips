# Shared Utilities for InDesign Scripts

This document describes the implementation and usage of shared utility modules for common InDesign operations, addressing the challenge of script isolation in ExtendScript environments.

## Background

Each InDesign script runs in isolation without built-in module systems. However, through analysis of existing scripts, we identified significant code duplication in areas like:

- Dialog creation and message display
- Error handling with fallback mechanisms
- Find/change operations with preference management
- Safe object access patterns
- Progress window management

## Script Inclusion Mechanisms

### Research Findings

We tested three approaches for including shared code in ExtendScript:

1. **#include directive**: ❌ Not supported in current ExtendScript environments
2. **$.evalFile()**: ✅ Works reliably
3. **eval() with File.read()**: ✅ Works but less efficient

### Recommended Approach: $.evalFile()

```javascript
// Standard pattern for including shared utilities
(function() {
    'use strict';
    
    // Load core utilities
    var scriptFile = File($.fileName);
    var scriptFolder = scriptFile.parent;
    var utilsFile = File(scriptFolder + "/Shared/InDesignUtils.jsx");
    
    if (utilsFile.exists) {
        $.evalFile(utilsFile);
    } else {
        alert("Required utilities not found: " + utilsFile.fsName);
        return;
    }
    
    // Load additional utilities as needed
    var findChangeFile = File(scriptFolder + "/Shared/FindChangeUtils.jsx");
    if (findChangeFile.exists) $.evalFile(findChangeFile);
    
    var uiUtilsFile = File(scriptFolder + "/Shared/UIUtils.jsx");
    if (uiUtilsFile.exists) $.evalFile(uiUtilsFile);
    
    var scopeUtilsFile = File(scriptFolder + "/Shared/ScopeUtils.jsx");
    if (scopeUtilsFile.exists) $.evalFile(scopeUtilsFile);
    
    var exportUtilsFile = File(scriptFolder + "/Shared/ExportUtils.jsx");
    if (exportUtilsFile.exists) $.evalFile(exportUtilsFile);
    
    // Use loaded utilities
    InDesignUtils.Prefs.withSafePreferences(function() {
        UIUtils.alert("Script started");
        // Your script logic here using FindChange.*, UIUtils.*, ScopeUtils.*, ExportUtils.*
    });
})();
```

## Shared Utility Architecture

### Module Structure

```
Scripts/
  Shared/
    InDesignUtils.jsx     # Core utilities: error handling, object utilities, layer management, preferences
    FindChangeUtils.jsx   # Find/change operations and GREP utilities
    UIUtils.jsx          # UI helpers: dialogs, progress windows, alerts
    ScopeUtils.jsx       # Scope resolution and UI components
    ExportUtils.jsx      # Export/PDF utilities (e.g., sanitizeFilenamePart)
```

The shared utilities are implemented as specialized modules with organized namespaces:

### Core Utility Categories

#### 1. Dialog and UI Helpers

Common patterns extracted from 30+ dialog implementations:

- Standard message dialogs
- Progress windows with consistent styling
- Alert functions with fallback mechanisms
- Dialog sizing and layout utilities

#### 2. Error Handling

Centralized error management patterns:

- Safe alert functions with multiple fallbacks
- Try-catch wrappers for common operations
- Object validation utilities
- Debug logging infrastructure

#### 3. Find/Change Operations

Standardized find/replace patterns:

- Automatic preference reset (before/after)
- Scoped search operations
- Safe text replacement workflows
- Common search patterns (whitespace, styles, etc.)

#### 4. InDesign Object Safety

Safe access patterns for InDesign objects:

- Object validity checking
- Parent/child relationship validation
- Collection enumeration with error handling
- Measurement unit management

## Usage Guidelines

### 1. Namespace Pattern

Each utility module uses a consistent namespace pattern:

```javascript
// Core utilities
var InDesignUtils = InDesignUtils || {};

// Feature-specific utilities
var FindChange = FindChange || {};
var UIUtils = UIUtils || {};
var ScopeUtils = ScopeUtils || {};
var ExportUtils = ExportUtils || {};
```

### 2. Error Resilience

Utilities are designed to fail gracefully:

```javascript
UIUtils.showMessage = function(title, message) {
    try {
        // Primary approach: ScriptUI dialog
        var win = new Window('dialog', title);
        // ... dialog creation
    } catch (e) {
        try {
            // Fallback 1: System alert
            alert(message);
        } catch(_) {
            try {
                // Fallback 2: Console output
                $.writeln(message);
            } catch(__) {
                // Silent failure
            }
        }
    }
};
```


## Implementation Strategy

### Phase 1: Core Utilities
- Basic dialog helpers
- Error handling utilities
- Simple message functions

### Phase 2: Advanced Operations
- Find/change wrappers
- Progress window management
- Measurement unit helpers

## Benefits

1. **Reduced Duplication**: Eliminate repeated dialog and error handling code
2. **Consistency**: Standardized UI and behavior across all scripts
3. **Maintainability**: Centralized updates to common functionality
4. **Reliability**: Battle-tested patterns with comprehensive error handling
5. **Developer Experience**: Simpler script development with proven utilities

## Considerations

### Performance
- Minimal overhead from $.evalFile() loading
- One-time cost per script execution
- No runtime performance impact

### File Dependencies
- Scripts require access to Shared/ directory
- Clear error messages for missing dependencies
- Graceful degradation when utilities unavailable

### Version Management
- Semantic versioning for utility modules
- Compatibility checks between scripts and utilities
- Migration guides for breaking changes

## Next Steps

1. Implement core utility modules
2. Refactor example scripts to demonstrate usage
3. Create migration guides for existing scripts
4. Establish testing procedures for shared utilities
5. Document best practices and common patterns