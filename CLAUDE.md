# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SwimLanes** is a browser-based timeline management application with Git-like version control for tasks, milestones, releases, and meetings. The entire application is contained in a single HTML file (`timeline-app.html`) that runs completely locally using SQLite via sql.js WASM.

## How to Run

Simply open `timeline-app.html` in any modern web browser (Chrome, Firefox, Safari, Edge). No build step, no server, no installation required. The application is 100% local - all data stays in the browser.

To test with sample data:
1. Open `timeline-app.html` in a browser
2. Go to the "Import/Map" tab
3. Load `sample-data.csv`
4. Run dry-run and commit

## Architecture

### Core Technology Stack
- **Database**: SQLite via sql.js (WASM, ~1.5MB loaded from CDN)
- **Rendering**: HTML5 Canvas for timeline visualization
- **Storage**: All data persists in browser using sql.js Database object
- **Architecture**: Single-page application, no framework dependencies

### Database Schema

The database uses a versioned data model with automatic history tracking:

**Main Tables:**
- `item` - Current state with composite key `(id, branch_id)`. Contains: id, type, title, start_date, end_date, owner, lane, project, tags, source_row_hash, branch_id, updated_at
- `item_history` - Complete audit trail with versioning. Every INSERT/UPDATE triggers automatic snapshot
- `branches` - Branch metadata (branch_id, label, created_from, note, created_at)
- `import_profiles` - Saved column mapping configurations for recurring imports
- `app_params` - Miscellaneous app settings including snapshots

**Versioning System:**
Database triggers (`item_insert_history`, `item_update_history`) automatically create snapshots in `item_history` on every change. Each snapshot includes:
- Auto-incrementing version number per (id, branch_id)
- Operation type (insert/update)
- Full row snapshot
- Timestamp

### Three-Stage Workflow

**Stage 1: Import/Map**
- Parse CSV/JSON files
- Auto-detect column mappings (with manual override)
- Three ID strategies: generate UUIDs, use column as ID, or match by key (project + title)
- Dry-run preview before committing
- Save mapping profiles for reuse

**Stage 2: Update/Append**
- Re-import using saved profiles
- Two modes: upsert (update matches, append new) or update-only (ignore new rows)
- Automatically uses existing mapping profiles

**Stage 3: View Timeline**
- Canvas-based Gantt chart rendering
- Swim lanes groupable by lane/project/owner/type
- Zoom levels: day/week/month/quarter/year
- Pan via click-and-drag
- Filter by type and project

### Branch System (Git-like)

Branches enable scenario planning and what-if analysis:
- Create unlimited branches from any existing branch
- Each branch has isolated data (composite key: id + branch_id)
- Compare any two branches to see added/removed/changed items
- Branch creation copies all items from source branch

### Date Normalization

The app auto-normalizes these formats to ISO (YYYY-MM-DD):
- `YYYY-MM-DD` (already ISO)
- `M/D/YYYY` (e.g., 1/15/2025)
- `M-D-YYYY` (e.g., 1-15-2025)

See `normalizeDate()` function around line 987.

### Canvas Rendering System

Timeline visualization uses HTML5 Canvas (line 1179+):
- `drawTimeline()` - Main rendering orchestrator
- `drawTimeAxis()` - Time axis with dynamic tick intervals based on zoom
- `drawItem()` - Individual item rendering (bars for tasks/releases/meetings, diamonds for milestones)
- Visual encoding: Tasks=blue bars, Milestones=green diamonds, Releases=orange bars, Meetings=purple bars
- Dragging system uses `timelineOffset` global state and mouse event handlers

## Key Functions and Their Locations

- **Database initialization**: `initDatabase()` around line 675
- **File parsing**: `parseCSV()` at line 809, handles CSV parsing with header detection
- **Column mapping setup**: `setupMapping()` at line 845 with auto-detection logic
- **Dry-run logic**: `performDryRun()` at line 918 computes added/updated/skipped/conflicts
- **Row mapping**: `mapRow()` at line 960 transforms raw data to item schema
- **Import commit**: `commitImport()` at line 1057 executes INSERT/UPDATE in transaction
- **Timeline rendering**: `renderTimeline()` at line 1178
- **Branch comparison**: `runComparison()` at line 1435 uses FULL OUTER JOIN to detect diffs
- **History search**: `searchHistory()` at line 1521 queries item_history table
- **Export functions**: `exportPNG()` at line 1581, `exportHTML()` at line 1589

## Global State Variables

- `db` - sql.js Database instance
- `currentData` - Parsed file data (array of objects)
- `currentMapping` - Column mapping configuration
- `dryRunData` - Results from dry-run (added/updated/skipped/conflicts)
- `timelineOffset` - Canvas pan position { x, y }
- `isDragging`, `dragStart` - Canvas drag state

## Item Types

Four supported types (enforced by CHECK constraint):
- `task` - Work items with start and end dates (rendered as bars)
- `milestone` - Single-date markers (rendered as diamonds)
- `release` - Deployment/launch events (rendered as orange bars)
- `meeting` - Calendar events (rendered as purple bars)

## Important Constraints

- Type must be one of: task, milestone, release, meeting
- Milestones should have start_date only (end_date typically NULL)
- Tasks should have both start_date and end_date
- end_date must be >= start_date (CHECK constraint)
- Composite primary key (id, branch_id) enables branch isolation

## Performance Considerations

The app handles:
- < 1000 items: Instant rendering
- 1000-5000 items: May need filtering by project/type
- > 5000 items: Consider splitting into multiple branches

No virtualization is implemented for lanes or items - full re-render on each change.

## Reference Documentation

The `ref/` directory contains original specifications:
- `claude_description.md` - Original implementation notes from Claude
- `chatgpt_description.md` - Original detailed specification document

These files explain the design rationale for the versioning system, branch model, and three-stage workflow.
