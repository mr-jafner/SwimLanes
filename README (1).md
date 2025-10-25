# Timeline Manager - Local Version Control

A fully local, browser-based timeline management app with Git-like version control for tasks, milestones, releases, and meetings.

## Features

✅ **Import/Map** - Load CSV/JSON data with flexible column mapping
✅ **Version Control** - Full history tracking with branches and snapshots
✅ **Timeline Visualization** - Interactive Gantt-style views with swim lanes
✅ **Branch Comparison** - Diff any two branches to see changes
✅ **History Explorer** - View complete version history for any item
✅ **Export** - Save as PNG or standalone HTML
✅ **100% Local** - No server required, all data stays in your browser

## Quick Start

### 1. Open the App
Simply open `timeline-app.html` in any modern web browser (Chrome, Firefox, Safari, Edge).

### 2. Import Your First Dataset
1. Go to the **"Import/Map"** tab
2. Click "Choose File" and select `sample-data.csv` (included)
3. Review the auto-detected column mappings
4. Click **"Run Dry-Run"** to preview changes
5. Click **"✓ Commit Import"** to save

### 3. View Your Timeline
1. Switch to the **"View Timeline"** tab
2. Use controls to:
   - Group by Lane/Project/Owner/Type
   - Zoom between Day/Week/Month/Quarter/Year views
   - Filter by type or project
3. Click and drag to pan around the timeline

## Detailed Usage

### Import Strategies

**ID Strategy Options:**
- **Generate new UUIDs** (default) - Creates fresh IDs for all items
- **Use column as ID** - Uses a specific column from your data as the unique ID
- **Match by key** - Matches items by project + title combination (useful for updates)

**Tag Handling:**
- Comma-separated: `tag1, tag2, tag3`
- Semicolon-separated: `tag1; tag2; tag3`
- JSON array: `["tag1", "tag2", "tag3"]`

### Branch Workflows

**Create a Branch:**
1. Click **"+ New Branch"** in Import or View tabs
2. Enter a name (e.g., "q2-planning" or "what-if-delayed")
3. The branch copies all items from the current branch

**Use Cases:**
- **Scenario Planning**: Create "optimistic" and "pessimistic" branches
- **Team Proposals**: Each team member creates their own planning branch
- **What-If Analysis**: Test date shifts or resource changes without affecting main

### Comparison Workflow

1. Go to **"Compare Branches"** tab
2. Select Base Branch (e.g., "main")
3. Select Compare Branch (e.g., "q2-planning")
4. Click **"Compare Branches"**
5. Review:
   - **Added** items (green badge)
   - **Removed** items (red badge)
   - **Changed** items (orange badge) with field-level differences

### Update/Append Workflow

1. Go to **"Update/Append"** tab
2. Optionally load a saved profile for consistent mapping
3. Choose update mode:
   - **Update matches, append new** - Upsert behavior
   - **Update matches only** - Ignore rows that don't match existing items
4. Select your updated CSV/JSON file
5. Run dry-run and commit

### History Exploration

1. Go to **"History"** tab
2. Search for an item by title
3. View all versions with:
   - Timestamp of each change
   - Operation (insert/update)
   - Field-level changes highlighted
4. (Future: Revert to specific version)

### Export Options

**PNG Export:**
- Captures current timeline view
- Great for presentations and documentation
- Filename: `timeline-{timestamp}.png`

**HTML Export:**
- Standalone HTML file with table view
- Includes metadata footer (branch, export time, item count)
- Can be opened without the app

**Snapshots:**
- Save named bookmarks in time
- Store current timestamp for later time-travel queries
- Useful for marking milestones like "Q1 Plan" or "Pre-Pivot"

## Data Model

### Item Types
- **task** - Work items with start and end dates (rendered as bars)
- **milestone** - Single-date markers (rendered as diamonds)
- **release** - Deployment/launch events (rendered as bars in orange)
- **meeting** - Calendar events (rendered as bars in purple)

### Required Fields
- `title` - Display name
- `type` - One of: task, milestone, release, meeting
- `start_date` - ISO format (YYYY-MM-DD) or M/D/YYYY

### Optional Fields
- `end_date` - For tasks/releases (not milestones)
- `owner` - Person responsible
- `lane` - Swim lane grouping
- `project` - Project/epic association
- `tags` - Comma-separated labels

## Sample Data Format

### CSV Example
```csv
title,type,start_date,end_date,owner,lane,project,tags
Setup Dev Environment,task,2025-01-15,2025-01-20,Alice,Engineering,Alpha,backend,setup
Q1 Planning Complete,milestone,2025-01-25,,,Management,Alpha,planning
Alpha Release,release,2025-02-15,,,Management,Alpha,release
```

### JSON Example
```json
[
  {
    "title": "Setup Dev Environment",
    "type": "task",
    "start_date": "2025-01-15",
    "end_date": "2025-01-20",
    "owner": "Alice",
    "lane": "Engineering",
    "project": "Alpha",
    "tags": "backend,setup"
  }
]
```

## Tips & Best Practices

### Date Formats
The app auto-normalizes these formats:
- `YYYY-MM-DD` (ISO standard, recommended)
- `M/D/YYYY` (e.g., 1/15/2025)
- `M-D-YYYY` (e.g., 1-15-2025)

### Lane Organization
Choose your lane grouping strategy:
- **By Team** - Use `owner` or `lane` field for swim lanes by person/team
- **By Project** - Group related work across teams
- **By Type** - Separate tasks, milestones, releases, meetings

### Branch Naming
Good conventions:
- `main` - Source of truth
- `q1-plan`, `q2-forecast` - Time-based planning
- `team-engineering`, `team-product` - Team proposals
- `scenario-optimistic`, `scenario-delayed` - What-if analysis

### Profile Reuse
Save mapping profiles when:
- You have recurring imports from the same system
- Multiple team members import similar data
- You want one-click re-imports for updates

### Performance
The app handles datasets with:
- ✅ < 1000 items: Instant rendering
- ⚠️ 1000-5000 items: May need to filter by project/type
- ❌ > 5000 items: Consider splitting into multiple branches

## Architecture

**Storage**: SQLite via sql.js (runs in browser, no server)
**Rendering**: HTML5 Canvas for timeline visualization
**Export**: Canvas.toDataURL() for PNG, Blob API for HTML
**Versioning**: Triggers on INSERT/UPDATE fire history snapshots

### Tables
- `item` - Current state of all items
- `item_history` - Append-only version log
- `branches` - Branch metadata
- `import_profiles` - Saved column mappings
- `app_params` - Misc settings (snapshots, etc.)

### Database Triggers
Every change to `item` automatically creates a snapshot in `item_history` with:
- Version number (auto-incrementing per item+branch)
- Operation type (insert/update)
- Full row snapshot
- Timestamp

## Keyboard Shortcuts

- **Click + Drag** on timeline - Pan view
- (Future: Ctrl+Z for undo, arrow keys for pan)

## Troubleshooting

**"No items to display"**
- Ensure you've imported data first
- Check that your branch has items (try switching to "main")
- Verify filters aren't excluding all items

**Column mapping errors**
- At minimum, map Title and Type columns
- Date columns should contain valid dates
- Type column must have values: task, milestone, release, or meeting

**Branch comparison shows nothing**
- Make sure the two branches have different data
- Try comparing "main" with a branch you've modified

**Timeline rendering is slow**
- Filter by project or type to reduce visible items
- Use Week/Month zoom instead of Day for large ranges

## Future Enhancements

Potential additions:
- [ ] Revert to specific version from history
- [ ] Merge branches with conflict resolution
- [ ] Dependency arrows between items
- [ ] Critical path highlighting
- [ ] Business days calculation
- [ ] Recurring items
- [ ] Real-time collaboration (with backend)
- [ ] Export to Project/CSV with history

## Technical Details

**Browser Compatibility:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**File Size:**
- App: ~45 KB (single HTML file)
- SQL.js WASM: ~1.5 MB (loaded from CDN)
- Sample data: ~2 KB

**Privacy:**
All data processing happens in your browser. Nothing is sent to any server. Your data never leaves your computer unless you explicitly export it.

## License

This is a demo application built to specification. Use and modify freely.

## Support

For issues or questions, refer to the inline comments in the HTML source code.

---

**Built with:** HTML5, Canvas API, SQL.js (SQLite WASM)
**Version:** 1.0.0
**Date:** October 2025
