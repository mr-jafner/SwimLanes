# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**SwimLanes** is a browser-based timeline management application with Git-like version control for tasks, milestones, releases, and meetings.

**Current Status:** Actively migrating from single-file HTML prototype to modern React + TypeScript application.

**Architecture:** React 19 + TypeScript + Vite, with sql.js (SQLite WASM) for local-first data storage, deploying to swimlanes.jafner.com.

**Repository:** https://github.com/mr-jafner/SwimLanes

---

## How to Run

### Development Server

```bash
# Navigate to project directory (adjust path as needed for your system)
cd /path/to/SwimLanes
npm install  # First time only
npm run dev  # Starts on http://localhost:5173
```

### Build Commands

```bash
npm run build         # Hosted version → dist/
npm run build:single  # Single HTML file → dist-single/ (TODO: configure in Issue #6)
npm run preview       # Preview production build
```

### Code Quality

```bash
npm run lint          # Run ESLint
npm run typecheck     # TypeScript type checking
npm test              # Run Vitest tests (92 tests across 6 test files)
```

### Legacy Prototype

To test the original working prototype: open `legacy/timeline-app.html` in a browser with `sample-data.csv`.

### Sample Data

**New React App:** Comprehensive sample datasets in `sample-data/` directory (see `sample-data/README.md` for details):
- `hardware/` - Turbocharger development projects (R&D, testing, manufacturing)
- `software/` - Software development projects
- `from-pm-tools/` - Real exports from MS Project, Planner, Jira
- `messy-data/` - Edge cases for testing validation

**Legacy Prototype:** Original `sample-data.csv` remains at root for backward compatibility with `legacy/timeline-app.html`.

---

## Tech Stack

**Core:**

- React 19.1.1 + TypeScript 5.9.3 (strict mode)
- Vite 7.1.7 (build tool, dev server)
- Tailwind CSS 4.1.16 ✅

**State & Data:**

- Zustand (state management) (TODO: Issue #15)
- sql.js 1.13.0 (SQLite WASM for local database)
- IndexedDB (auto-save persistence) ✅

**UI & Canvas:**

- shadcn/ui (component library) ✅
- next-themes 0.4.6 (dark mode) ✅
- sonner 2.0.7 (toast notifications) ✅
- react-konva (timeline canvas rendering) (TODO: Issue #19)

**Testing:**

- Vitest 4.0.4 + React Testing Library ✅
- Playwright 1.56.1 (E2E) ✅

**Tooling:**

- ESLint 9.36.0 + Prettier 3.6.2 ✅
- Husky 9.1.7 (Git hooks) ✅
- lint-staged 16.2.6 (pre-commit formatting) ✅

**Deployment:**

- Self-hosted OpenBSD (Vultr) via GitHub Actions ✅
- Domain: swimlanes.jafner.com

See `ref/architecture.md` for complete technical details.

---

## Project Structure

### Current Structure (Implemented)

```
SwimLanes/
├── src/
│   ├── components/          # React components
│   │   └── ui/             # ✅ shadcn/ui components (button, dialog, select, sonner)
│   ├── services/           # ✅ Business logic
│   │   ├── database.service.ts      # ✅ sql.js wrapper
│   │   └── persistence.service.ts   # ✅ IndexedDB persistence
│   ├── db/                 # ✅ Database layer
│   │   └── schema.ts       # ✅ Table definitions, triggers, indexes
│   ├── types/              # ✅ TypeScript type definitions
│   │   ├── database.types.ts
│   │   ├── import.types.ts
│   │   ├── branch.types.ts
│   │   ├── timeline.types.ts
│   │   └── index.ts        # Barrel export
│   ├── lib/                # ✅ Utility functions
│   │   └── utils.ts        # Tailwind cn() utility
│   ├── test/               # ✅ Test setup
│   │   └── setup.ts
│   ├── App.tsx             # ✅ Root component
│   └── main.tsx            # ✅ Entry point
├── e2e/                    # ✅ Playwright E2E tests
├── ref/                    # ✅ Planning documentation
├── legacy/                 # ✅ Original prototypes
├── public/                 # ✅ Static assets
└── [config files]          # ✅ vite, tsconfig, playwright, vitest, etc.
```

### Planned Structure (To Be Implemented)

```
src/
├── components/
│   ├── timeline/           # TODO: Timeline visualization (Canvas)
│   ├── import/             # TODO: Import/map workflow
│   ├── branches/           # TODO: Branch management
│   ├── history/            # TODO: Version history
│   ├── export/             # TODO: Export features
│   ├── layout/             # TODO: App layout (header, nav, footer)
│   └── common/             # TODO: Shared components
├── services/
│   ├── import.service.ts        # TODO: Import/dry-run logic
│   ├── timeline.service.ts      # TODO: Timeline calculations
│   ├── branch.service.ts        # TODO: Branch operations
│   ├── history.service.ts       # TODO: Version history
│   ├── export.service.ts        # TODO: Export functions
│   └── csv-parser.service.ts    # TODO: CSV parsing
├── db/
│   ├── migrations.ts       # TODO: Schema migrations
│   └── queries/            # TODO: SQL query builders
│       ├── items.queries.ts
│       ├── branches.queries.ts
│       ├── history.queries.ts
│       └── import.queries.ts
├── stores/                 # TODO: Zustand state stores
│   ├── app.store.ts
│   ├── timeline.store.ts
│   ├── import.store.ts
│   ├── branch.store.ts
│   ├── undo.store.ts
│   └── preferences.store.ts
├── utils/                  # TODO: Utility functions
│   ├── date.utils.ts
│   ├── csv.utils.ts
│   ├── validation.utils.ts
│   └── format.utils.ts
├── hooks/                  # TODO: Custom React hooks
│   ├── useDatabase.ts
│   ├── useTimeline.ts
│   ├── usePersistence.ts
│   └── useKeyboardShortcuts.ts
└── constants/              # TODO: App constants
    ├── schema.constants.ts
    ├── colors.constants.ts
    └── config.constants.ts
```

### Path Aliases

- `@/` → `./src/` (configured in tsconfig.app.json and vite.config.ts)
- Example: `import { Button } from '@/components/ui/button'`

---

## GitHub Workflow

### Issues & Project Board

**Issues:** https://github.com/mr-jafner/SwimLanes/issues
**Project Board:** https://github.com/mr-jafner/SwimLanes/projects

**Organization:**

- 40 issues created across 5 milestones (Phase 1-5)
- Labels: `type:*`, `priority:*`, `phase:*`, `component:*`
- Kanban board: Backlog → Todo → In Progress → In Review → Done

**Milestones:**

- Phase 1: Foundation & Architecture (Due: Feb 8, 2025)
- Phase 2: Feature Migration & Completeness (Due: Feb 22, 2025)
- Phase 3: Advanced Features & Polish (Due: Mar 1, 2025)
- Phase 4: Testing & Quality (Due: Mar 8, 2025)
- Phase 5: Deployment & Launch (Due: Mar 15, 2025)

### Commit Message Format

Use conventional commits with issue references:

```
feat: add timeline canvas rendering (#19)

- Implement react-konva Stage and Layer components
- Add pan and zoom functionality
- Render items as bars/diamonds based on type
- Add time axis with dynamic tick intervals

Closes #19

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Important:** Including `Closes #N` automatically closes the issue on push to main.

### Development Workflow

1. Check next issue on GitHub Projects board
2. Implement changes locally
3. Test: `npm run dev` and verify functionality
4. Commit with proper format (see above)
5. Push: `git push origin main`
6. Issue auto-closes and moves on project board

---

## Database Schema

The database uses a versioned data model with automatic history tracking:

### Main Tables

**`item`** - Current state with composite key `(id, branch_id)`

- Fields: id, type, title, start_date, end_date, owner, lane, project, tags, dependencies (future), source_row_hash, branch_id, updated_at
- Primary Key: (id, branch_id) - enables branch isolation
- Check constraints: type IN ('task', 'milestone', 'release', 'meeting'), end_date >= start_date

**`item_history`** - Complete audit trail with versioning

- Every INSERT/UPDATE triggers automatic snapshot
- Fields: id, branch_id, version, op, snapshot_at, [all item fields]
- Primary Key: (id, branch_id, version)
- Version auto-increments per (id, branch_id)

**`branches`** - Branch metadata

- Fields: branch_id (PK), label, created_from, note, created_at

**`import_profiles`** - Saved column mapping configurations

- Fields: name (PK), json, created_at

**`app_params`** - Miscellaneous app settings

- Fields: key (PK), value

**`_schema_version`** - Schema version tracking

- Fields: version (PK), applied_at

### Database Triggers

**`item_insert_history`** - Fires AFTER INSERT on item

- Creates snapshot in item_history with version = 1 (or max + 1)
- Records op = 'insert'

**`item_update_history`** - Fires AFTER UPDATE on item

- Creates snapshot in item_history with version = previous max + 1
- Records op = 'update'

### Indexes

- `idx_item_branch` ON item(branch_id, type)
- `idx_item_dates` ON item(start_date, end_date)
- `idx_item_project` ON item(project)
- `idx_history_branch` ON item_history(branch_id, snapshot_at)
- `idx_history_id` ON item_history(id, branch_id, version)

---

## Item Types

Four supported types (enforced by CHECK constraint):

- **`task`** - Work items with start and end dates (rendered as blue bars)
- **`milestone`** - Single-date markers (rendered as green diamonds)
- **`release`** - Deployment/launch events (rendered as orange bars)
- **`meeting`** - Calendar events (rendered as purple bars)

### Constraints

- Type must be one of: task, milestone, release, meeting
- Milestones should have start_date only (end_date typically NULL)
- Tasks should have both start_date and end_date
- end_date must be >= start_date (CHECK constraint)
- Composite primary key (id, branch_id) enables branch isolation

---

## Three-Stage Workflow

### Stage 1: Import/Map

- Parse CSV/JSON files
- Auto-detect column mappings (with manual override)
- Three ID strategies: generate UUIDs, use column as ID, or match by key (project + title)
- Dry-run preview before committing
- Save mapping profiles for reuse

### Stage 2: Update/Append

- Re-import using saved profiles
- Two modes: upsert (update matches, append new) or update-only (ignore new rows)
- Automatically uses existing mapping profiles

### Stage 3: View Timeline

- Canvas-based Gantt chart rendering
- Swim lanes groupable by lane/project/owner/type
- Zoom levels: day/week/month/quarter/year
- Pan via click-and-drag
- Filter by type and project

---

## Branch System (Git-like)

Branches enable scenario planning and what-if analysis:

- Create unlimited branches from any existing branch
- Each branch has isolated data (composite key: id + branch_id)
- Compare any two branches to see added/removed/changed items
- Branch creation copies all items from source branch

**Comparison Logic:**
Uses FULL OUTER JOIN to detect:

- **Added:** Items in branch B but not in branch A
- **Removed:** Items in branch A but not in branch B
- **Changed:** Items in both with different field values
- **Unchanged:** Items in both with same field values

---

## Key Implementation Notes

### Date Normalization

The app auto-normalizes these formats to ISO (YYYY-MM-DD):

- `YYYY-MM-DD` (already ISO)
- `M/D/YYYY` (e.g., 1/15/2025)
- `M-D-YYYY` (e.g., 1-15-2025)

Implement in `src/utils/date.utils.ts` (TODO: Issue #10)

### Canvas Rendering

Timeline visualization will use react-konva (TODO: Issue #19):

- Declarative React components (Stage, Layer, Rect, Line, Text)
- Items render as bars (tasks/releases/meetings) or diamonds (milestones)
- Visual encoding: Tasks=blue, Milestones=green, Releases=orange, Meetings=purple
- Pan and zoom via Konva's built-in transform system
- Time axis with dynamic tick intervals based on zoom level

### Performance Targets

The app should handle:

- **< 1000 items:** Instant rendering
- **1000-5000 items:** Good performance with filtering
- **> 5000 items:** Use virtualization or split into branches

Optimize by:

- React.memo for expensive components
- useMemo for calculations
- Konva layer caching
- Virtualization for large datasets

---

## Planning Documentation

Detailed documentation in `ref/` folder:

- **`ref/roadmap.md`** - Complete 5-phase development plan (5-6 weeks, 40 issues)
- **`ref/architecture.md`** - Technical architecture, build config, database design
- **`ref/deployment.md`** - GitHub Actions workflows, OpenBSD server setup, SSL/TLS
- **`ref/github-issues.md`** - All 40 pre-written issue templates (already created on GitHub)
- **`ref/decisions-summary.md`** - Tech stack decisions, alternatives considered, rationale

**Original Specifications:**

- `ref/claude_description.md` - Original implementation notes from Claude
- `ref/chatgpt_description.md` - Original detailed specification document

These explain the design rationale for the versioning system, branch model, and three-stage workflow.

---

## Legacy Prototype

The original working prototype is preserved in `legacy/` folder:

- **`legacy/timeline-app.html`** - Main prototype (60KB single HTML file, 1685 lines)
- **`legacy/timeline-swimlane-app.html`** - Earlier version (1435 lines)
- **`legacy/README-original.md`** - Original detailed README

**Reference the prototype when implementing features:**

- Database initialization: around line 675
- CSV parsing: around line 809
- Column mapping: around line 845
- Dry-run logic: around line 918
- Import commit: around line 1057
- Timeline rendering: around line 1178
- Branch comparison: around line 1435
- History search: around line 1521

**Key differences:**

- **Prototype:** Single HTML file, vanilla JavaScript, inline styles
- **New app:** React components, TypeScript, Tailwind CSS, modular architecture
- **Database logic:** Being migrated from inline code to `src/services/` and `src/db/`
- **UI:** Migrating from inline HTML to React components + shadcn/ui
- **State:** Migrating from global variables to Zustand stores

---

## Development Principles

- **TypeScript strict mode** - Full type safety, no implicit any, noUncheckedIndexedAccess
- **Component-based** - Reusable React components, single responsibility
- **Service layer** - Business logic separate from UI components
- **Type-safe database** - All queries return typed results via query builders
- **Local-first** - All data in browser (IndexedDB), no server dependency
- **Testable** - Unit tests for services/utils, integration tests for workflows
- **Documented** - JSDoc for public APIs, inline comments for complex logic

---

## End of Session Checklist

When the user indicates they're wrapping up (e.g., "doing one last thing", "heading to bed", "about to sign off"), proactively suggest the following:

**Cleanup:**

1. **Stop running processes:**
   - Kill dev servers, test runners, or background processes
   - Clean up temporary files or test data

2. **Remove debug artifacts:**
   - Remove console.logs, debugger statements, or commented-out code
   - Clean up any experimental or WIP code that shouldn't be committed

**Documentation & State:**

3. **Update todo list:**
   - Mark all completed items as done
   - Remove obsolete items
   - Add discovered follow-up tasks or blockers
   - Ensure no tasks left in "in_progress" state

4. **Log session summary:**
   - Briefly summarize what was accomplished
   - Note any important discoveries, gotchas, or breaking changes
   - Document architectural decisions made
   - Highlight any TODOs or technical debt introduced

5. **Update project documentation:**
   - Update CLAUDE.md if workflows or conventions changed
   - Update relevant docs in `ref/` if architecture changed
   - Update "Next Steps" section with current status

**Planning & Handoff:**

6. **Suggest next priorities:**
   - Based on current phase/milestone and GitHub issues
   - Note dependencies or blockers
   - Recommend logical next task for continuity

7. **Verify version control:**
   - Remind to check git status for uncommitted changes
   - Suggest creating commits if work is at a good stopping point
   - Remind to push if commits were made

**Important:** Only suggest these items - don't execute them automatically unless explicitly requested.

---

## Next Steps

**Current Phase:** Phase 1 - Foundation & Architecture (Due: Feb 8, 2025)

See GitHub Issues for complete task list and current status:
- **Issues:** https://github.com/mr-jafner/SwimLanes/issues
- **Project Board:** https://github.com/mr-jafner/SwimLanes/projects
- **View Phase 1 Tasks:** `gh issue list --milestone "Phase 1"`

GitHub Issues is the authoritative source for task status, dependencies, and progress tracking.

---

**Last Updated:** 2025-11-05
**Document Version:** 2.0 (React Architecture)
