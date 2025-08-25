# Engineering Improvement Backlog

Purpose
- This canonical backlog centralizes opportunities to improve safety, quality, performance, and documentation across the InDesign scripts repository. It is a living reference for future enhancements.

How to use this backlog
- Create issues from individual checklist items when you are ready to act.
- Keep changes minimal and aligned with the Engineering Code Standards.
- When an item requires UI changes, mirror existing patterns used in this repo.
- Before closing an item, run the linter and perform a quick manual sanity check when applicable.

Related standards and references
- Engineering Code Standards: CodeStandards.md
- Shared Utilities: SharedUtilities.md

Priority guidelines
- High: Architectural safety and code-quality foundations (sections Architectural Improvements, Code-Level Improvements)
- Medium: Documentation, development tooling, and QA
- Low: Distribution, long-term infra, and community initiatives

Review schedule
- High priority: Monthly
- Medium priority: Quarterly
- Low priority: Bi-annually
- Also review after major InDesign releases and when adding new scripts

Ownership and conventions
- Each issue should name an owner.
- Prefer early returns, explicit units, and single-undo entry-points (see Code Standards).
- Reset find/change prefs before and after usage.
- Validate object specifiers and check `.isValid`.

---

## Architectural Improvements

### 1) Code Standards Compliance
- [ ] Audit all scripts for adherence to CodeStandards.md patterns
- [ ] Standardize error handling patterns across all scripts

### 2) Performance and Safety
- [ ] Audit all scripts for proper redraw suppression during heavy operations
- [ ] Ensure all find/change operations reset preferences before and after use
- [ ] Verify all scripts validate object specifiers with `.isValid` checks
- [ ] Add performance timing and optimization to computationally heavy scripts
- [ ] Implement proper scope limitation for find/change operations

### 3) Architecture and Organization
- [x] Create shared utility module for common InDesign operations
  - [x] Dialog creation helpers
  - [x] Error handling utilities
  - [x] Find/change wrapper functions
  - [x] Measurement unit conversion utilities
- [ ] Establish consistent naming conventions for script variables and functions
- [ ] Create template script file demonstrating best practices
- [ ] Add script metadata headers with version, compatibility, and usage info

## Code-Level Improvements

### 4) Code Quality and Modernization
- [ ] Remove testing comments and debug code from production scripts (e.g., BulkPDFGenerator.jsx line 1)
- [ ] Replace magic numbers with named constants
- [ ] Improve variable naming for better readability
- [ ] Add comprehensive JSDoc comments to all public functions
- [ ] Implement consistent parameter validation patterns
- [ ] Add input sanitization for user-provided data

### 5) Error Handling and User Experience
- [ ] Replace empty catch blocks with proper error logging
- [ ] Standardize user-facing error messages with context information
- [ ] Add progress indicators for long-running operations
- [ ] Implement proper confirmation dialogs for destructive operations
- [ ] Add graceful handling for document-not-open scenarios
- [ ] Implement proper cleanup in all failure scenarios

### 6) ExtendScript to UXP Migration Preparation
- [x] Identify scripts that could benefit from UXP migration
- [ ] Create migration guide for moving from ExtendScript to UXP
- [x] Establish dual-compatibility patterns where applicable
- [ ] Document API differences between ExtendScript and UXP
- [ ] Refactor BulkPDFGenerator.jsx to follow established safety patterns
  - [ ] Wrap main execution in `app.doScript` with proper undo mode
  - [ ] Implement proper try/catch/finally with global preference restoration
  - [ ] Remove global `nk` object and use proper module pattern
  - [ ] Add measurement unit setting and restoration
  - [ ] Remove `with` statements and use explicit object references
- [ ] Remove ESLint no-undef override for BulkPDFGenerator.jsx after refactoring

## Documentation Improvements

### 7) Technical Documentation
- [ ] Add inline code comments explaining complex algorithms
- [ ] Document all Hebrew/Unicode character handling specifics
- [ ] Create troubleshooting guide for common script issues
- [ ] Document InDesign version compatibility for each script
- [ ] Add examples of typical use cases for each script

### 8) User Documentation
- [ ] Review and update all script usage documentation in Docs/ScriptUsage/
- [ ] Add screenshots or visual guides where helpful
- [ ] Create quick start guide for new users
- [ ] Document keyboard shortcuts and workflow integration
- [ ] Add FAQ section addressing common user questions

### 9) Development Documentation
- [ ] Create contributor guidelines for new script development
- [ ] Document the testing process and manual verification steps
- [ ] Add code review checklist based on engineering standards
- [ ] Create debugging guide for common InDesign scripting issues
- [ ] Document the release and distribution process

## Tooling and Infrastructure

### 10) Development Tools
- [x] Add .gitattributes file to enforce LF line endings project-wide
- [x] Set up Prettier configuration for consistent code formatting
- [ ] Add pre-commit hooks to run linting automatically
- [ ] Create build script to validate all scripts before release
- [ ] Add script to check for common anti-patterns

### 11) Quality Assurance
- [ ] Implement automated testing framework for script validation
- [ ] Create test documents with known content for script testing
- [ ] Add performance benchmarking tools
- [ ] Implement script compatibility testing across InDesign versions
- [ ] Create regression testing suite for critical scripts

### 12) Distribution and Packaging
- [ ] Create installation script for easy script deployment
- [ ] Add version management system for script releases
- [ ] Create packaging guidelines for script distribution
- [ ] Implement automatic documentation generation from code
- [ ] Add script dependency management system

## Security and Robustness

### 13) Input Validation and Security
- [ ] Audit all file I/O operations for security vulnerabilities
- [ ] Add comprehensive input validation for all user inputs
- [ ] Implement safe file path handling
- [ ] Add protection against script injection in user inputs
- [ ] Validate document state before script execution

### 14) Error Recovery
- [ ] Implement automatic recovery from common InDesign API failures
- [ ] Add retry mechanisms for transient failures
- [ ] Create backup and restore mechanisms for document state
- [ ] Implement script interruption and cleanup handling
- [ ] Add logging system for debugging production issues

## Maintenance and Monitoring

### 15) Code Maintenance
- [ ] Schedule regular code review sessions
- [ ] Create maintenance checklist for periodic script updates
- [ ] Implement deprecation warnings for outdated script features
- [ ] Add monitoring for script performance degradation
- [ ] Create update notification system for users

### 16) Community and Collaboration
- [ ] Create contribution guidelines for external developers
- [ ] Set up issue tracking system for bug reports
- [ ] Create user feedback collection mechanism
- [ ] Establish regular release schedule
- [ ] Add script usage analytics (privacy-respecting)

---

Completion checklist (per item)
- Test changes with multiple InDesign documents when relevant
- Update related documentation
- Run the full linting suite before marking complete
- Consider impact on existing user workflows
- Document any breaking changes or migration requirements

Changelog
- 2025-08-25: Created canonical backlog by migrating and normalizing Docs/tasks.md content.
- 2025-08-25: COMPLETED - Item 3: Created comprehensive shared utility module (Scripts/Shared/InDesignUtils.jsx) with dialog helpers, error handling utilities, find/change wrapper functions, and measurement unit conversion utilities. Added complete documentation in SharedUtilities.md.
- 2025-08-25: PARTIAL - Item 6: Started UXP migration work with ExportPDF.uxp.js demonstrating dual-compatibility patterns and proper UXP API usage.
- 2025-08-25: IMPROVEMENT - Enhanced ESLint configuration with separate rules for UXP and ExtendScript environments, modern ES2021 support, and stricter linting rules.
- 2025-08-25: COMPLETED - Item 10: Set up Prettier configuration for consistent code formatting with .prettierrc.json, added formatting scripts to package.json, integrated with ESLint via eslint-config-prettier, and enforced LF line endings with comprehensive .gitattributes configuration.
