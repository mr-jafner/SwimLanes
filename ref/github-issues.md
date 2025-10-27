# SwimLanes GitHub Issues Template

**Version:** 1.0
**Last Updated:** 2025-01-25

This document contains pre-written GitHub issues for all phases of development. Copy and paste into GitHub Issues to track progress.

---

## Labels to Create First

Create these labels in your GitHub repo:

```
Type Labels:
- type:feature (blue) - New feature implementation
- type:bug (red) - Something isn't working
- type:enhancement (green) - Improve existing feature
- type:docs (yellow) - Documentation changes
- type:refactor (purple) - Code cleanup/restructuring
- type:test (orange) - Testing-related

Priority Labels:
- priority:critical (dark red) - Blocks users, must fix immediately
- priority:high (red) - Important, fix in current sprint
- priority:medium (yellow) - Nice to have, next sprint
- priority:low (gray) - Backlog

Phase Labels:
- phase:1 (light blue) - Foundation & Architecture
- phase:2 (blue) - Feature Migration & Completeness
- phase:3 (dark blue) - Advanced Features & Polish
- phase:4 (green) - Testing & Quality
- phase:5 (purple) - Deployment & Launch

Component Labels:
- component:database (teal) - Database layer
- component:import (cyan) - Import/map features
- component:timeline (indigo) - Timeline visualization
- component:branches (violet) - Branch management
- component:ui (pink) - User interface
- component:testing (brown) - Tests
- component:infra (gray) - Infrastructure/build/deploy
```

---

## Phase 1: Foundation & Architecture

### Issue #1: Initialize Vite + React + TypeScript Project

```markdown
## Description
Set up the base project with Vite, React 18, and TypeScript in strict mode.

## Tasks
- [ ] Run `npm create vite@latest` and select React + TypeScript
- [ ] Configure `tsconfig.json` with strict mode
- [ ] Set up path aliases (`@/` for src)
- [ ] Install core dependencies (React 18+)
- [ ] Verify dev server works (`npm run dev`)
- [ ] Create initial folder structure (src/components, src/services, etc.)

## Acceptance Criteria
- Dev server runs without errors
- TypeScript strict mode enabled
- Path aliases working
- Basic folder structure in place

## Labels
`type:feature` `phase:1` `component:infra` `priority:critical`
```

---

### Issue #2: Configure Tailwind CSS

```markdown
## Description
Install and configure Tailwind CSS with basic theming.

## Tasks
- [ ] Install Tailwind CSS (`npm install -D tailwindcss postcss autoprefixer`)
- [ ] Run `npx tailwindcss init -p`
- [ ] Configure `tailwind.config.js` content paths
- [ ] Add Tailwind directives to `src/index.css`
- [ ] Create custom theme colors/fonts (if needed)
- [ ] Test with basic styled component

## Acceptance Criteria
- Tailwind classes work in components
- JIT mode enabled
- Custom theme configured
- No console warnings

## Labels
`type:feature` `phase:1` `component:ui` `priority:high`
```

---

### Issue #3: Install and Configure shadcn/ui

```markdown
## Description
Set up shadcn/ui for copy-paste component library.

## Tasks
- [ ] Install shadcn/ui CLI (`npx shadcn-ui@latest init`)
- [ ] Configure components.json
- [ ] Add initial components: button, dialog, select, toast
- [ ] Create example page using shadcn components
- [ ] Document how to add new components

## Acceptance Criteria
- shadcn/ui configured properly
- Components render correctly
- Documentation added to README

## Labels
`type:feature` `phase:1` `component:ui` `priority:high`
```

---

### Issue #4: Set Up ESLint and Prettier

```markdown
## Description
Configure code quality tools for consistent formatting and linting.

## Tasks
- [ ] Install ESLint with TypeScript plugin
- [ ] Create `.eslintrc.cjs` configuration
- [ ] Install Prettier
- [ ] Create `.prettierrc` configuration
- [ ] Add lint scripts to package.json
- [ ] Set up pre-commit hook (optional)
- [ ] Fix any existing lint errors

## Acceptance Criteria
- `npm run lint` works without errors
- Prettier auto-formats on save
- ESLint catches TypeScript errors
- All files pass linting

## Labels
`type:feature` `phase:1` `component:infra` `priority:medium`
```

---

### Issue #5: Create Vite Config for Hosted Build

```markdown
## Description
Configure primary Vite build for production deployment to swimlanes.jafner.com.

## Tasks
- [ ] Configure `vite.config.ts` for production
- [ ] Enable code splitting
- [ ] Configure chunk size limits
- [ ] Add manual chunks (react, konva, sql.js)
- [ ] Enable minification (Terser)
- [ ] Test production build (`npm run build`)
- [ ] Verify bundle size (<500 KB gzipped)

## Acceptance Criteria
- Build completes without errors
- Code splitting works
- Bundle size optimized
- Build output in `dist/` directory

## Labels
`type:feature` `phase:1` `component:infra` `priority:critical`
```

---

### Issue #6: Create Vite Config for Single-File Build

```markdown
## Description
Configure secondary Vite build that outputs a single HTML file for easy sharing.

## Tasks
- [ ] Install `vite-plugin-singlefile`
- [ ] Create `vite.single.config.ts`
- [ ] Configure inline everything (JS, CSS, images)
- [ ] Disable code splitting
- [ ] Test single-file build (`npm run build:single`)
- [ ] Verify output is standalone (no dependencies)
- [ ] Add build script to package.json

## Acceptance Criteria
- Single HTML file builds successfully
- File size reasonable (~300-500 KB)
- Works when opened directly in browser
- Build output in `dist-single/` directory

## Labels
`type:feature` `phase:1` `component:infra` `priority:high`
```

---

### Issue #7: Set Up Vitest Testing Framework

```markdown
## Description
Configure Vitest for unit and integration testing.

## Tasks
- [ ] Install Vitest and dependencies
- [ ] Install React Testing Library
- [ ] Create `vitest.config.ts`
- [ ] Set up test environment (jsdom)
- [ ] Create example test file
- [ ] Configure coverage reporting
- [ ] Add test scripts to package.json
- [ ] Document testing conventions

## Acceptance Criteria
- `npm test` runs tests
- Example test passes
- Coverage report generates
- Tests run in CI-like environment

## Labels
`type:feature` `phase:1` `component:testing` `priority:high`
```

---

### Issue #8: Create GitHub Actions - Test Workflow

```markdown
## Description
Set up GitHub Actions workflow to run tests on every pull request.

## Tasks
- [ ] Create `.github/workflows/test.yml`
- [ ] Configure Node.js setup (v20)
- [ ] Add typecheck step
- [ ] Add lint step
- [ ] Add test with coverage step
- [ ] Upload coverage to Codecov (optional)
- [ ] Add build smoke test
- [ ] Test workflow on a PR

## Acceptance Criteria
- Workflow runs on PRs
- All steps pass
- Coverage report available
- Fast execution (<5 min)

## Related Files
- See `ref/deployment.md` for workflow template

## Labels
`type:feature` `phase:1` `component:infra` `priority:critical`
```

---

### Issue #9: Create GitHub Actions - Deploy Workflow

```markdown
## Description
Set up GitHub Actions workflow to deploy to OpenBSD server on push to main.

## Tasks
- [ ] Create `.github/workflows/deploy.yml`
- [ ] Configure SSH key setup
- [ ] Add build steps (both versions)
- [ ] Add rsync deployment steps
- [ ] Add post-deployment script execution
- [ ] Configure GitHub Secrets (SSH_KEY, HOST, USER)
- [ ] Test deployment to server
- [ ] Add rollback documentation

## Acceptance Criteria
- Deployment succeeds on push to main
- Both builds deploy correctly
- Post-deployment script runs
- Rollback procedure documented

## Related Files
- See `ref/deployment.md` for workflow template

## Labels
`type:feature` `phase:1` `component:infra` `priority:critical`
```

---

### Issue #10: Create TypeScript Type Definitions

```markdown
## Description
Define core TypeScript interfaces for database entities and application state.

## Tasks
- [ ] Create `src/types/database.types.ts`
- [ ] Define `Item` interface (id, type, title, dates, etc.)
- [ ] Define `ItemHistory` interface
- [ ] Define `Branch` interface
- [ ] Define `ImportProfile` interface
- [ ] Create `src/types/import.types.ts` (mapping, strategies)
- [ ] Create `src/types/timeline.types.ts` (view state, lanes)
- [ ] Create barrel export `src/types/index.ts`
- [ ] Document type usage

## Acceptance Criteria
- All types compile without errors
- Types match database schema
- Barrel export works
- Types documented with JSDoc

## Labels
`type:feature` `phase:1` `component:database` `priority:critical`
```

---

### Issue #11: Implement Database Service Layer

```markdown
## Description
Create service layer to wrap sql.js and manage database connection.

## Tasks
- [ ] Create `src/services/database.service.ts`
- [ ] Implement DatabaseService class
- [ ] Add `initialize()` method (loads sql.js)
- [ ] Add `createSchema()` method
- [ ] Add schema version tracking
- [ ] Implement connection state management
- [ ] Add error handling
- [ ] Write unit tests

## Acceptance Criteria
- Database initializes successfully
- Schema created properly
- Version tracking works
- Tests pass (>80% coverage)

## Labels
`type:feature` `phase:1` `component:database` `priority:critical`
```

---

### Issue #12: Migrate Database Schema from Prototype

```markdown
## Description
Port all CREATE TABLE, INDEX, and TRIGGER statements from prototype to TypeScript.

## Tasks
- [ ] Create `src/db/schema.ts`
- [ ] Port `item` table definition
- [ ] Port `item_history` table definition
- [ ] Port `branches` table definition
- [ ] Port `import_profiles` table definition
- [ ] Port `app_params` table definition
- [ ] Create `_schema_version` table
- [ ] Port all indexes
- [ ] Port history triggers
- [ ] Add schema validation

## Acceptance Criteria
- All tables create successfully
- Triggers fire correctly
- Indexes improve query performance
- Schema version tracking works

## Labels
`type:feature` `phase:1` `component:database` `priority:critical`
```

---

### Issue #13: Implement IndexedDB Persistence Service

```markdown
## Description
Create service to save/load database from IndexedDB for offline persistence.

## Tasks
- [ ] Create `src/services/persistence.service.ts`
- [ ] Implement `saveToIndexedDB(dbName, data)`
- [ ] Implement `loadFromIndexedDB(dbName)`
- [ ] Implement `clearIndexedDB(dbName)`
- [ ] Add auto-save timer (every 5 seconds)
- [ ] Add manual save/load functions
- [ ] Handle quota exceeded errors
- [ ] Write unit tests

## Acceptance Criteria
- Database persists across page refreshes
- Auto-save runs without blocking UI
- Clear data function works
- Error handling for quota issues

## Labels
`type:feature` `phase:1` `component:database` `priority:critical`
```

---

### Issue #14: Create Database Query Builders

```markdown
## Description
Create typed query builder functions for common database operations.

## Tasks
- [ ] Create `src/db/queries/items.queries.ts`
  - [ ] getItems(branchId, filters)
  - [ ] insertItem(item)
  - [ ] updateItem(id, branchId, updates)
  - [ ] deleteItem(id, branchId)
- [ ] Create `src/db/queries/branches.queries.ts`
  - [ ] getBranches()
  - [ ] createBranch(from, to)
  - [ ] deleteBranch(branchId)
- [ ] Create `src/db/queries/history.queries.ts`
  - [ ] getItemHistory(id, branchId)
  - [ ] compareBranches(branchA, branchB)
- [ ] Add parameterized queries (prevent SQL injection)
- [ ] Write unit tests for each query

## Acceptance Criteria
- All queries return typed results
- Parameterized queries used
- Tests pass (>80% coverage)
- Queries are performant

## Labels
`type:feature` `phase:1` `component:database` `priority:high`
```

---

## Phase 2: Feature Migration & Completeness

### Issue #15: Create Zustand Stores

```markdown
## Description
Set up Zustand state management stores for global and feature-specific state.

## Tasks
- [ ] Create `src/stores/app.store.ts` (global state)
- [ ] Create `src/stores/timeline.store.ts` (view state)
- [ ] Create `src/stores/import.store.ts` (import workflow)
- [ ] Create `src/stores/branch.store.ts` (branch state)
- [ ] Create `src/stores/undo.store.ts` (undo/redo stack)
- [ ] Create `src/stores/preferences.store.ts` (user prefs)
- [ ] Configure persistence middleware
- [ ] Write unit tests for stores

## Acceptance Criteria
- All stores initialized
- State updates reactively
- Persistence works for preferences
- Tests pass

## Labels
`type:feature` `phase:2` `component:ui` `priority:critical`
```

---

### Issue #16: Create CSV Parser Service

```markdown
## Description
Migrate CSV parsing logic from prototype to TypeScript service.

## Tasks
- [ ] Create `src/services/csv-parser.service.ts`
- [ ] Implement parseCSV(text) function
- [ ] Handle quoted values, escaped commas
- [ ] Auto-detect headers
- [ ] Return typed array of objects
- [ ] Handle edge cases (empty lines, BOM)
- [ ] Write comprehensive unit tests

## Acceptance Criteria
- Parses sample-data.csv correctly
- Handles edge cases gracefully
- Tests pass (>90% coverage)
- Performance: <100ms for 1000 rows

## Labels
`type:feature` `phase:2` `component:import` `priority:high`
```

---

### Issue #17: Build Import/Map UI Components

```markdown
## Description
Create React components for import workflow (file selection, column mapping, dry-run).

## Tasks
- [ ] Create `components/import/ImportForm.tsx`
  - [ ] File upload input (CSV/JSON)
  - [ ] File preview table
- [ ] Create `components/import/ColumnMapper.tsx`
  - [ ] Dropdowns for each field mapping
  - [ ] Auto-detection highlighting
- [ ] Create `components/import/IDStrategySelector.tsx`
  - [ ] Radio buttons (generate/column/match)
  - [ ] Conditional ID column selector
- [ ] Create `components/import/DryRunPreview.tsx`
  - [ ] Summary counts (added/updated/skipped)
  - [ ] Sample rows tables
- [ ] Add loading states
- [ ] Write component tests

## Acceptance Criteria
- All components render correctly
- File upload works
- Column mapping functional
- Dry-run preview displays results
- Component tests pass

## Labels
`type:feature` `phase:2` `component:import` `priority:critical`
```

---

### Issue #18: Implement Import Service Logic

```markdown
## Description
Create service for import dry-run and commit operations.

## Tasks
- [ ] Create `src/services/import.service.ts`
- [ ] Implement performDryRun(data, mapping, branch, strategy)
- [ ] Implement commitImport(dryRunResults, branch)
- [ ] Add conflict detection
- [ ] Add row validation
- [ ] Add provenance tracking (source_row_hash)
- [ ] Handle errors gracefully
- [ ] Write integration tests

## Acceptance Criteria
- Dry-run correctly categorizes rows
- Commit inserts/updates database
- Conflicts detected properly
- Integration tests pass

## Labels
`type:feature` `phase:2` `component:import` `priority:critical`
```

---

### Issue #19: Set Up react-konva for Timeline

```markdown
## Description
Install react-konva and create basic timeline canvas structure.

## Tasks
- [ ] Install `react-konva` and `konva`
- [ ] Create `components/timeline/TimelineCanvas.tsx`
- [ ] Set up Stage and Layer components
- [ ] Implement basic rendering (empty canvas)
- [ ] Add resize handling
- [ ] Add click-and-drag panning
- [ ] Add mouse wheel zoom
- [ ] Write component tests

## Acceptance Criteria
- Canvas renders at full viewport
- Panning works smoothly
- Zoom works (mouse wheel)
- No performance issues
- Tests pass

## Labels
`type:feature` `phase:2` `component:timeline` `priority:critical`
```

---

### Issue #20: Implement Timeline Rendering Service

```markdown
## Description
Create service to calculate timeline layout and render items on canvas.

## Tasks
- [ ] Create `src/services/timeline.service.ts`
- [ ] Implement groupItemsByLane(items, groupBy)
- [ ] Implement calculateDateRange(items)
- [ ] Implement calculateItemPosition(item, dateRange, zoom)
- [ ] Add time axis rendering logic
- [ ] Add item rendering (bars for tasks, diamonds for milestones)
- [ ] Optimize for 1000+ items
- [ ] Write unit tests

## Acceptance Criteria
- Items render at correct positions
- Different item types render correctly
- Performance good with 1000+ items
- Tests pass (>80% coverage)

## Labels
`type:feature` `phase:2` `component:timeline` `priority:critical`
```

---

### Issue #21: Build Timeline Controls UI

```markdown
## Description
Create controls for timeline view (zoom, filters, branch selector).

## Tasks
- [ ] Create `components/timeline/TimelineControls.tsx`
- [ ] Add branch selector dropdown
- [ ] Add zoom level selector
- [ ] Add lane groupBy selector
- [ ] Add type filter dropdown
- [ ] Add project filter input
- [ ] Add date range filter (future)
- [ ] Connect to Zustand store
- [ ] Write component tests

## Acceptance Criteria
- All controls render correctly
- State updates on change
- Timeline re-renders on control change
- Tests pass

## Labels
`type:feature` `phase:2` `component:timeline` `priority:high`
```

---

### Issue #22: Implement Branch Management UI

```markdown
## Description
Create components for creating, switching, and managing branches.

## Tasks
- [ ] Create `components/branches/BranchSelector.tsx`
  - [ ] Dropdown to switch branches
  - [ ] Current branch indicator
- [ ] Create `components/branches/BranchCreateDialog.tsx`
  - [ ] Input for branch name
  - [ ] Select parent branch
  - [ ] Add notes field
- [ ] Create `components/branches/BranchMetaEditor.tsx`
  - [ ] Edit branch label and notes
- [ ] Add branch deletion (with confirmation)
- [ ] Write component tests

## Acceptance Criteria
- Can create new branches
- Can switch between branches
- Can edit branch metadata
- Can delete branches (with warning)
- Tests pass

## Labels
`type:feature` `phase:2` `component:branches` `priority:high`
```

---

### Issue #23: Implement Branch Comparison

```markdown
## Description
Create UI to compare two branches and show differences.

## Tasks
- [ ] Create `components/branches/BranchCompare.tsx`
  - [ ] Select base branch (A)
  - [ ] Select compare branch (B)
  - [ ] Run comparison button
- [ ] Create `components/branches/BranchDiffView.tsx`
  - [ ] Summary counts (added/removed/changed)
  - [ ] Table with detailed changes
  - [ ] Field-level diff highlighting
- [ ] Implement FULL OUTER JOIN diff query
- [ ] Add visual overlay on timeline (future)
- [ ] Write tests

## Acceptance Criteria
- Can select and compare two branches
- Differences displayed correctly
- Added/removed/changed categorized
- Tests pass

## Labels
`type:feature` `phase:2` `component:branches` `priority:high`
```

---

### Issue #24: Implement History Panel

```markdown
## Description
Create UI to search and view item version history.

## Tasks
- [ ] Create `components/history/HistorySearch.tsx`
  - [ ] Search input (by title)
  - [ ] Branch selector
- [ ] Create `components/history/HistoryPanel.tsx`
  - [ ] Version timeline display
  - [ ] Show operation (insert/update)
  - [ ] Show timestamp
- [ ] Create `components/history/VersionDiff.tsx`
  - [ ] Field-level change chips
  - [ ] Old vs new value display
- [ ] Add version comparison
- [ ] Write tests

## Acceptance Criteria
- Can search for items by title
- Version history displays correctly
- Field changes highlighted
- Tests pass

## Labels
`type:feature` `phase:2` `component:history` `priority:medium`
```

---

### Issue #25: Implement Revert to Version

```markdown
## Description
Add functionality to revert an item to a previous version from history.

## Tasks
- [ ] Create `components/history/RevertDialog.tsx`
  - [ ] Show version details
  - [ ] Confirmation dialog
- [ ] Implement revert logic in database service
- [ ] Update item from item_history snapshot
- [ ] Create new history entry for revert operation
- [ ] Add to undo stack
- [ ] Write integration tests

## Acceptance Criteria
- Can click "Revert" on any version
- Item updates to selected version
- New history entry created
- Can undo revert
- Tests pass

## Labels
`type:feature` `phase:2` `component:history` `priority:high`
```

---

### Issue #26: Implement Undo/Redo System

```markdown
## Description
Create undo/redo stack for all user operations.

## Tasks
- [ ] Enhance `stores/undo.store.ts` with operation tracking
- [ ] Add inverse functions for each operation type
- [ ] Implement Ctrl+Z keyboard shortcut
- [ ] Implement Ctrl+Y keyboard shortcut
- [ ] Create undo history panel UI
- [ ] Add undo/redo buttons to header
- [ ] Limit stack size (e.g., 50 operations)
- [ ] Write comprehensive tests

## Acceptance Criteria
- Ctrl+Z undoes last operation
- Ctrl+Y redoes undone operation
- Works for import, update, delete
- Stack limited to prevent memory issues
- Tests pass

## Labels
`type:feature` `phase:2` `component:ui` `priority:medium`
```

---

## Phase 3: Advanced Features & Polish

### Issue #27: Add Dependencies Column and UI

```markdown
## Description
Add support for task dependencies (which items depend on others).

## Tasks
- [ ] Add `dependencies` column to schema (JSON array of IDs)
- [ ] Update TypeScript types
- [ ] Create UI to add/remove dependencies
- [ ] Validate no circular dependencies
- [ ] Store in database
- [ ] Write tests

## Acceptance Criteria
- Dependencies column exists
- Can add/remove dependencies via UI
- Circular dependency validation works
- Tests pass

## Labels
`type:feature` `phase:3` `component:timeline` `priority:medium`
```

---

### Issue #28: Implement Dependency Arrows on Timeline

```markdown
## Description
Render dependency arrows between items on the timeline canvas.

## Tasks
- [ ] Calculate arrow paths (start item end → dependent item start)
- [ ] Render arrows using Konva Line with arrow
- [ ] Add arrow hover effects
- [ ] Make arrows clickable (show dependency details)
- [ ] Optimize rendering for many arrows
- [ ] Write tests

## Acceptance Criteria
- Arrows render between dependent items
- Arrows positioned correctly
- Performance good with 100+ arrows
- Tests pass

## Labels
`type:feature` `phase:3` `component:timeline` `priority:low`
```

---

### Issue #29: Implement Critical Path Calculation

```markdown
## Description
Calculate and highlight the critical path based on dependencies.

## Tasks
- [ ] Implement critical path algorithm (longest path through dependency graph)
- [ ] Highlight critical path items (different color)
- [ ] Add critical path toggle control
- [ ] Show critical path duration
- [ ] Handle items without dependencies gracefully
- [ ] Write algorithm tests

## Acceptance Criteria
- Critical path calculated correctly
- Items on critical path highlighted
- Toggle works
- Tests pass (including edge cases)

## Labels
`type:feature` `phase:3` `component:timeline` `priority:low`
```

---

### Issue #30: Add Dark Mode Support

```markdown
## Description
Implement dark mode theme toggle.

## Tasks
- [ ] Configure Tailwind dark mode
- [ ] Create dark color palette
- [ ] Add theme toggle button
- [ ] Update all components with dark: classes
- [ ] Update canvas rendering for dark mode
- [ ] Persist theme preference
- [ ] Write tests

## Acceptance Criteria
- Can toggle between light/dark
- All components look good in dark mode
- Theme persists across sessions
- Tests pass

## Labels
`type:enhancement` `phase:3` `component:ui` `priority:medium`
```

---

### Issue #31: Implement Enhanced Export Options

```markdown
## Description
Add PDF, Excel, and iCal export options.

## Tasks
- [ ] Install jsPDF for PDF export
- [ ] Create multi-page PDF export
- [ ] Install xlsx library for Excel export
- [ ] Create Excel export with formatting
- [ ] Implement iCal export for meetings
- [ ] Add export templates system
- [ ] Write integration tests

## Acceptance Criteria
- PDF export creates readable document
- Excel export maintains formatting
- iCal export works in calendar apps
- Tests pass

## Labels
`type:feature` `phase:3` `component:export` `priority:low`
```

---

### Issue #32: Add Full-Text Search

```markdown
## Description
Implement full-text search across all item fields.

## Tasks
- [ ] Create search input component
- [ ] Implement search query logic (title, tags, project, owner)
- [ ] Highlight search results
- [ ] Add search filters
- [ ] Show result count
- [ ] Debounce search input
- [ ] Write tests

## Acceptance Criteria
- Search works across all fields
- Results highlight correctly
- Performance good with 5000+ items
- Tests pass

## Labels
`type:feature` `phase:3` `component:ui` `priority:medium`
```

---

### Issue #33: Add Business Days Calculation

```markdown
## Description
Add toggle for business days (exclude weekends).

## Tasks
- [ ] Create business days utility
- [ ] Add weekend exclusion logic
- [ ] Add holiday configuration (optional)
- [ ] Add toggle in timeline controls
- [ ] Update duration displays
- [ ] Write comprehensive tests

## Acceptance Criteria
- Business days toggle works
- Weekends excluded from counts
- Duration displays update correctly
- Tests pass (including edge cases)

## Labels
`type:feature` `phase:3` `component:timeline` `priority:low`
```

---

### Issue #34: Implement Responsive Design

```markdown
## Description
Make app work well on tablets and mobile devices.

## Tasks
- [ ] Add responsive breakpoints
- [ ] Create mobile navigation
- [ ] Optimize timeline for touch
- [ ] Adjust controls for small screens
- [ ] Test on real devices
- [ ] Write responsive tests

## Acceptance Criteria
- Works on tablet (768px+)
- Usable on mobile (375px+)
- Touch interactions work
- No horizontal scroll
- Tests pass

## Labels
`type:enhancement` `phase:3` `component:ui` `priority:medium`
```

---

### Issue #35: Add Accessibility (A11y) Features

```markdown
## Description
Ensure app is accessible to users with disabilities.

## Tasks
- [ ] Add ARIA labels to all interactive elements
- [ ] Ensure keyboard navigation works
- [ ] Add focus indicators
- [ ] Test with screen reader
- [ ] Fix heading hierarchy
- [ ] Add skip-to-content link
- [ ] Write a11y tests

## Acceptance Criteria
- All interactive elements keyboard-accessible
- Screen reader announces correctly
- Focus visible on all elements
- Lighthouse a11y score >90
- Tests pass

## Labels
`type:enhancement` `phase:3` `component:ui` `priority:high`
```

---

## Phase 4: Testing & Quality

### Issue #36: Achieve 80%+ Test Coverage

```markdown
## Description
Write comprehensive unit and integration tests.

## Tasks
- [ ] Identify untested code (coverage report)
- [ ] Write unit tests for services
- [ ] Write unit tests for utilities
- [ ] Write integration tests for workflows
- [ ] Fix flaky tests
- [ ] Document testing conventions
- [ ] Set up coverage threshold in CI

## Acceptance Criteria
- Test coverage >80%
- All critical paths tested
- No flaky tests
- CI fails if coverage drops

## Labels
`type:test` `phase:4` `component:testing` `priority:critical`
```

---

### Issue #37: Cross-Browser Testing

```markdown
## Description
Test application on all major browsers.

## Tasks
- [ ] Test on Chrome/Edge (Windows)
- [ ] Test on Firefox
- [ ] Test on Safari (macOS)
- [ ] Test on mobile browsers (iOS Safari, Chrome Android)
- [ ] Fix browser-specific issues
- [ ] Document known limitations
- [ ] Add browser compatibility notice

## Acceptance Criteria
- Works on all major browsers
- Critical features work on mobile browsers
- Known issues documented
- Compatibility notice in UI

## Labels
`type:test` `phase:4` `component:ui` `priority:high`
```

---

### Issue #38: Performance Optimization

```markdown
## Description
Profile and optimize app performance.

## Tasks
- [ ] Profile timeline rendering (React DevTools)
- [ ] Optimize canvas rendering (layer caching)
- [ ] Implement virtualization for large datasets
- [ ] Optimize database queries
- [ ] Add memoization where needed
- [ ] Check bundle size
- [ ] Run Lighthouse audit

## Acceptance Criteria
- Timeline renders 1000 items in <1s
- Bundle size <500 KB gzipped
- Lighthouse performance score >90
- No memory leaks

## Labels
`type:enhancement` `phase:4` `component:timeline` `priority:high`
```

---

### Issue #39: Security Review

```markdown
## Description
Review application for security vulnerabilities.

## Tasks
- [ ] Check for XSS vulnerabilities
- [ ] Verify parameterized queries (SQL injection)
- [ ] Review dependencies for known CVEs
- [ ] Ensure CSP headers configured
- [ ] Review data handling (no sensitive data logged)
- [ ] Add security headers to httpd config
- [ ] Document security considerations

## Acceptance Criteria
- No XSS vulnerabilities found
- All queries parameterized
- No high-severity CVEs in dependencies
- Security headers configured
- Documentation complete

## Labels
`type:enhancement` `phase:4` `component:infra` `priority:critical`
```

---

### Issue #40: Write User Documentation

```markdown
## Description
Create comprehensive user guide and developer documentation.

## Tasks
- [ ] Write user guide (features, workflows)
- [ ] Add inline help tooltips
- [ ] Create keyboard shortcuts reference
- [ ] Write developer setup guide
- [ ] Document architecture
- [ ] Create troubleshooting guide
- [ ] Add examples and screenshots

## Acceptance Criteria
- User guide covers all features
- Developer setup guide works
- Screenshots up-to-date
- Troubleshooting guide helpful

## Labels
`type:docs` `phase:4` `priority:medium`
```

---

## Phase 5: Deployment & Launch

### Issue #41: Production Deployment

```markdown
## Description
Deploy application to production server.

## Tasks
- [ ] Verify GitHub Actions workflows work
- [ ] Configure OpenBSD httpd
- [ ] Set up SSL/TLS (Let's Encrypt)
- [ ] Configure DNS (swimlanes.jafner.com)
- [ ] Deploy via GitHub Actions
- [ ] Verify live site works
- [ ] Test all features on production

## Acceptance Criteria
- Site accessible at swimlanes.jafner.com
- HTTPS works
- All features functional
- No console errors

## Related Files
- See `ref/deployment.md`

## Labels
`type:feature` `phase:5` `component:infra` `priority:critical`
```

---

### Issue #42: Create v1.0.0 Release

```markdown
## Description
Tag v1.0.0 release and create GitHub release with downloadable HTML.

## Tasks
- [ ] Ensure all v1.0 features complete
- [ ] Update version in package.json
- [ ] Create git tag `v1.0.0`
- [ ] Push tag to trigger release workflow
- [ ] Verify release created on GitHub
- [ ] Download and test single-file version
- [ ] Write release notes

## Acceptance Criteria
- GitHub release created
- Single HTML file downloadable
- Release notes clear
- Version tag pushed

## Labels
`type:feature` `phase:5` `component:infra` `priority:high`
```

---

### Issue #43: Beta Testing with Coworkers

```markdown
## Description
Invite 2-3 coworkers to test the application and provide feedback.

## Tasks
- [ ] Identify beta testers
- [ ] Send invitation email with link
- [ ] Provide quick start guide
- [ ] Set up feedback channel (email, issue tracker)
- [ ] Monitor for issues
- [ ] Collect feedback
- [ ] Prioritize and fix critical issues

## Acceptance Criteria
- At least 2 coworkers testing
- Feedback collected
- Critical issues fixed
- UX improvements identified

## Labels
`type:test` `phase:5` `priority:high`
```

---

### Issue #44: Set Up Monitoring

```markdown
## Description
Set up basic monitoring for production site.

## Tasks
- [ ] Configure uptime monitoring (UptimeRobot, Pingdom)
- [ ] Set up error tracking (Sentry) - optional
- [ ] Configure analytics (Plausible) - optional
- [ ] Add Lighthouse CI to GitHub Actions
- [ ] Set up log monitoring on server
- [ ] Document monitoring procedures

## Acceptance Criteria
- Uptime alerts configured
- Error tracking works (if enabled)
- Analytics collecting (if enabled)
- Logs reviewed regularly

## Labels
`type:feature` `phase:5` `component:infra` `priority:low`
```

---

## Quick Start: Creating Issues in GitHub

**Option 1: Manual Copy-Paste**
1. Go to your GitHub repo → Issues → New Issue
2. Copy title and body from above
3. Add appropriate labels
4. Create issue

**Option 2: GitHub CLI (faster)**

```bash
# Install GitHub CLI
# https://cli.github.com/

# Create issue from command line
gh issue create \
  --title "Initialize Vite + React + TypeScript Project" \
  --body "See ref/github-issues.md Issue #1" \
  --label "type:feature,phase:1,component:infra,priority:critical"
```

**Option 3: Bulk Import Script (advanced)**

Create a Node.js script to parse this file and create all issues automatically. (Let me know if you want this!)

---

## Issue Tracking Tips

**Milestones:**
- Create milestones for each phase (Phase 1, Phase 2, etc.)
- Assign issues to appropriate milestone
- Track progress via milestone view

**Projects:**
- Create GitHub Project board (Kanban)
- Columns: Backlog, Todo, In Progress, In Review, Done
- Drag issues between columns

**Estimation:**
- Add time estimates as labels (e.g., `estimate:1d`, `estimate:4h`)
- Or use custom fields in GitHub Projects

**Dependencies:**
- Link related issues (e.g., "Depends on #10")
- Use task lists in issue body

---

**Document Version:** 1.0
**Issues Count:** 44 issues across 5 phases
**Estimated Total Time:** 5-6 weeks
