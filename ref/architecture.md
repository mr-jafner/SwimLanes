# SwimLanes Architecture Documentation

**Version:** 1.0
**Last Updated:** 2025-01-25
**Status:** Design Phase

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Technology Stack](#technology-stack)
3. [Build Configuration](#build-configuration)
4. [Database Architecture](#database-architecture)
5. [State Management](#state-management)
6. [Component Architecture](#component-architecture)
7. [Deployment Architecture](#deployment-architecture)
8. [Security Considerations](#security-considerations)
9. [Performance Strategy](#performance-strategy)

---

## Project Structure

### Directory Layout

```
swimlanes/
├── .github/
│   └── workflows/
│       ├── deploy.yml              # Production deployment to OpenBSD
│       ├── test.yml                # Run tests on PR
│       └── release.yml             # Create GitHub releases
│
├── public/                         # Static assets
│   ├── favicon.ico
│   ├── robots.txt
│   └── sample-data.csv            # Example dataset
│
├── src/
│   ├── components/                # React components
│   │   ├── ui/                    # shadcn/ui components (copy-paste)
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── select.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   │
│   │   ├── timeline/              # Timeline visualization
│   │   │   ├── TimelineCanvas.tsx        # Main canvas component
│   │   │   ├── TimelineControls.tsx      # Zoom, filters, etc.
│   │   │   ├── TimelineAxis.tsx          # Time axis rendering
│   │   │   ├── TimelineItem.tsx          # Individual item (bar/diamond)
│   │   │   ├── TimelineLane.tsx          # Swim lane
│   │   │   └── TimelineLegend.tsx        # Color legend
│   │   │
│   │   ├── import/                # Import/Map workflow
│   │   │   ├── ImportForm.tsx            # File selection
│   │   │   ├── ColumnMapper.tsx          # Column mapping UI
│   │   │   ├── DryRunPreview.tsx         # Preview changes
│   │   │   ├── ImportProfileSelector.tsx # Load/save profiles
│   │   │   └── IDStrategySelector.tsx    # UUID/column/match
│   │   │
│   │   ├── branches/              # Branch management
│   │   │   ├── BranchSelector.tsx        # Switch branches
│   │   │   ├── BranchCompare.tsx         # Compare two branches
│   │   │   ├── BranchCreateDialog.tsx    # Create new branch
│   │   │   ├── BranchDiffView.tsx        # Visual diff display
│   │   │   └── BranchMetaEditor.tsx      # Edit branch notes
│   │   │
│   │   ├── history/               # Version history
│   │   │   ├── HistoryPanel.tsx          # Version timeline
│   │   │   ├── HistorySearch.tsx         # Search by item
│   │   │   ├── VersionDiff.tsx           # Show field changes
│   │   │   └── RevertDialog.tsx          # Confirm revert
│   │   │
│   │   ├── export/                # Export features
│   │   │   ├── ExportDialog.tsx          # Export options
│   │   │   ├── PNGExporter.tsx
│   │   │   ├── HTMLExporter.tsx
│   │   │   ├── PDFExporter.tsx
│   │   │   └── CSVExporter.tsx
│   │   │
│   │   ├── layout/                # App layout
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TabNavigation.tsx
│   │   │   └── Footer.tsx
│   │   │
│   │   └── common/                # Shared components
│   │       ├── ErrorBoundary.tsx
│   │       ├── LoadingSpinner.tsx
│   │       ├── EmptyState.tsx
│   │       └── ConfirmDialog.tsx
│   │
│   ├── services/                  # Business logic layer
│   │   ├── database.service.ts          # sql.js wrapper
│   │   ├── import.service.ts            # Import/map logic
│   │   ├── timeline.service.ts          # Timeline calculations
│   │   ├── branch.service.ts            # Branch operations
│   │   ├── history.service.ts           # Version history
│   │   ├── export.service.ts            # Export functions
│   │   ├── persistence.service.ts       # IndexedDB
│   │   └── csv-parser.service.ts        # CSV parsing
│   │
│   ├── db/                        # Database layer
│   │   ├── schema.ts                    # Table definitions
│   │   ├── migrations.ts                # Schema migrations (future)
│   │   ├── queries/                     # SQL query builders
│   │   │   ├── items.queries.ts         # Item CRUD
│   │   │   ├── branches.queries.ts      # Branch CRUD
│   │   │   ├── history.queries.ts       # History queries
│   │   │   └── import.queries.ts        # Import operations
│   │   └── seed.ts                      # Sample data (dev)
│   │
│   ├── stores/                    # Zustand state stores
│   │   ├── app.store.ts                 # Global app state
│   │   ├── timeline.store.ts            # Timeline view state
│   │   ├── import.store.ts              # Import workflow state
│   │   ├── branch.store.ts              # Branch state
│   │   ├── undo.store.ts                # Undo/redo stack
│   │   └── preferences.store.ts         # User preferences
│   │
│   ├── types/                     # TypeScript type definitions
│   │   ├── database.types.ts            # DB schemas
│   │   ├── import.types.ts              # Import types
│   │   ├── timeline.types.ts            # Timeline types
│   │   ├── branch.types.ts              # Branch types
│   │   └── index.ts                     # Barrel export
│   │
│   ├── utils/                     # Utility functions
│   │   ├── date.utils.ts                # Date parsing/formatting
│   │   ├── csv.utils.ts                 # CSV helpers
│   │   ├── validation.utils.ts          # Input validation
│   │   ├── format.utils.ts              # String formatting
│   │   └── color.utils.ts               # Color generation
│   │
│   ├── hooks/                     # Custom React hooks
│   │   ├── useDatabase.ts               # Database connection
│   │   ├── useTimeline.ts               # Timeline logic
│   │   ├── usePersistence.ts            # Auto-save
│   │   ├── useKeyboardShortcuts.ts      # Keyboard handling
│   │   └── useDebounce.ts               # Debounce helper
│   │
│   ├── constants/                 # App constants
│   │   ├── schema.constants.ts          # DB schema version, etc.
│   │   ├── colors.constants.ts          # Color palette
│   │   ├── config.constants.ts          # App config
│   │   └── routes.constants.ts          # Route paths
│   │
│   ├── App.tsx                    # Root component
│   ├── main.tsx                   # Entry point
│   ├── index.css                  # Global styles (Tailwind)
│   └── vite-env.d.ts             # Vite types
│
├── tests/                         # Test files
│   ├── unit/                      # Unit tests
│   │   ├── services/
│   │   ├── utils/
│   │   └── db/
│   ├── integration/               # Integration tests
│   │   ├── import-workflow.test.tsx
│   │   ├── branch-management.test.tsx
│   │   └── timeline-rendering.test.tsx
│   ├── e2e/                       # E2E tests (Playwright)
│   │   ├── critical-paths.spec.ts
│   │   └── user-journeys.spec.ts
│   └── setup.ts                   # Test setup
│
├── legacy/                        # Old prototype (reference)
│   ├── timeline-app.html
│   └── timeline-swimlane-app.html
│
├── ref/                           # Documentation
│   ├── roadmap.md                 # This file
│   ├── architecture.md            # Tech decisions
│   ├── deployment.md              # Deployment guide
│   ├── claude_description.md      # Original spec
│   └── chatgpt_description.md     # Original spec
│
├── .gitignore
├── .eslintrc.cjs                  # ESLint config
├── .prettierrc                    # Prettier config
├── index.html                     # Vite entry HTML
├── package.json
├── tsconfig.json                  # TypeScript config
├── tsconfig.node.json            # TypeScript for Vite
├── vite.config.ts                # Vite config (hosted)
├── vite.single.config.ts         # Vite config (single-file)
├── tailwind.config.js            # Tailwind config
├── postcss.config.js             # PostCSS config
├── vitest.config.ts              # Vitest config
├── playwright.config.ts          # Playwright config (future)
├── README.md                     # User documentation
└── CLAUDE.md                     # Claude Code context
```

---

## Technology Stack

### Core Technologies

**Frontend Framework:**
- **React 18+** - UI library
  - Chosen for: Mature ecosystem, team familiarity, great tooling
  - Used with: Functional components, hooks, no class components

**Language:**
- **TypeScript 5.x** - Type-safe JavaScript
  - Strict mode enabled
  - No implicit any
  - Configured for React JSX

**Build Tool:**
- **Vite 5.x** - Fast build and dev server
  - Lightning-fast HMR (Hot Module Replacement)
  - Optimized production builds
  - Plugin for single-file output

### UI & Styling

**CSS Framework:**
- **Tailwind CSS 3.x** - Utility-first CSS
  - JIT (Just-In-Time) compilation
  - Custom theme configuration
  - Purged unused styles in production

**Component Library:**
- **shadcn/ui** - Copy-paste component collection
  - Built on Radix UI primitives
  - Fully customizable (you own the code)
  - Styled with Tailwind
  - Components: Button, Dialog, Select, Dropdown, Toast, etc.

**Canvas Rendering:**
- **react-konva 18.x** - React wrapper for Konva.js
  - Declarative canvas rendering
  - Built-in event handling
  - Layer-based composition
  - High performance for 1000+ shapes

### State Management

**Global State:**
- **Zustand 4.x** - Lightweight state management
  - ~1 KB bundle size
  - No boilerplate
  - TypeScript-first
  - Middleware for persistence, devtools

**State Organization:**
```typescript
// Multiple stores by domain
- appStore: Global app state (current tab, theme, etc.)
- timelineStore: Timeline view state (zoom, filters, pan offset)
- importStore: Import workflow state (file, mapping, dry-run results)
- branchStore: Current branch, branch list
- undoStore: Undo/redo operation stack
- preferencesStore: User preferences (persisted to localStorage)
```

### Database & Persistence

**In-Browser Database:**
- **sql.js 1.8+** - SQLite compiled to WebAssembly
  - Full SQL support
  - Triggers, indexes, constraints
  - Loaded from CDN: https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/

**Persistence Layer:**
- **IndexedDB** - Browser storage API
  - Auto-save every 5 seconds
  - Stores database as Blob
  - ~50 MB+ quota (can request more)

**Backup Strategy:**
- Manual export to .sqlite file
- Manual import from .sqlite file
- GitHub releases include example databases

### Testing

**Unit/Integration Testing:**
- **Vitest 1.x** - Vite-native test framework
  - Fast, uses same config as Vite
  - Compatible with Jest API
  - Built-in coverage (c8)

**React Testing:**
- **React Testing Library** - Component testing
  - User-centric testing
  - Queries by accessibility attributes
  - Avoids implementation details

**E2E Testing (Future):**
- **Playwright** - Cross-browser E2E testing
  - Test on Chromium, Firefox, WebKit
  - Parallel execution
  - Auto-waiting, screenshots, videos

### Development Tools

**Code Quality:**
- **ESLint** - JavaScript/TypeScript linting
  - `@typescript-eslint` plugin
  - React hooks rules
  - Import sorting

- **Prettier** - Code formatting
  - Integrated with ESLint
  - Auto-format on save

**Version Control:**
- **Git** - Source control
- **GitHub** - Repository hosting, CI/CD, releases

**CI/CD:**
- **GitHub Actions** - Automated workflows
  - Test on every PR
  - Deploy on push to main
  - Create releases on tag

---

## Build Configuration

### Development Build

**Vite Dev Server:**
```bash
npm run dev
# Starts dev server on http://localhost:5173
# Hot module replacement (HMR) enabled
# Source maps enabled
# No minification
```

**Configuration:**
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Production Build (Hosted)

**Output:** Optimized SPA for swimlanes.jafner.com

```bash
npm run build
# Output: dist/
# - index.html
# - assets/index-[hash].js
# - assets/index-[hash].css
```

**Optimizations:**
- Code splitting by route (lazy loading)
- Tree shaking (remove unused code)
- Minification (Terser)
- Asset hashing for cache busting
- Gzip/Brotli compression
- Target: ES2020 (modern browsers)

**Configuration:**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'konva-vendor': ['react-konva', 'konva'],
          'sql-vendor': ['sql.js'],
        },
      },
    },
  },
});
```

### Production Build (Single-File)

**Output:** Single HTML file for download/email sharing

```bash
npm run build:single
# Output: dist-single/index.html (everything inlined)
```

**Configuration:**
```typescript
// vite.single.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [
    react(),
    viteSingleFile(), // Inlines all JS, CSS, images
  ],
  build: {
    target: 'es2020',
    outDir: 'dist-single',
    assetsInlineLimit: 100000000, // Inline everything
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
```

**Result:**
- Single `index.html` file (~300-500 KB)
- No external dependencies
- Works offline, can be emailed
- Available at `swimlanes.jafner.com/download/swimlanes.html`

### Build Scripts

```json
// package.json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "build:single": "tsc && vite build -c vite.single.config.ts",
    "build:all": "npm run build && npm run build:single",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## Database Architecture

### Schema Design

**Tables:**

```sql
-- Main items table (current state)
CREATE TABLE item (
    id TEXT NOT NULL,
    branch_id TEXT NOT NULL DEFAULT 'main',
    type TEXT NOT NULL,  -- 'task' | 'milestone' | 'release' | 'meeting'
    title TEXT NOT NULL,
    start_date TEXT,     -- ISO format: YYYY-MM-DD
    end_date TEXT,       -- NULL for milestones
    owner TEXT,
    lane TEXT,
    project TEXT,
    tags TEXT,           -- Comma-separated or JSON
    dependencies TEXT,   -- JSON array of item IDs (future)
    source_id TEXT,      -- Provenance tracking
    source_row_hash TEXT,
    updated_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (id, branch_id),
    CHECK (type IN ('task', 'milestone', 'release', 'meeting')),
    CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Version history (append-only log)
CREATE TABLE item_history (
    id TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    version INTEGER NOT NULL,  -- Auto-increment per (id, branch_id)
    op TEXT NOT NULL,          -- 'insert' | 'update' | 'delete'
    snapshot_at TEXT DEFAULT (datetime('now')),
    -- Full snapshot of item at this version
    type TEXT,
    title TEXT,
    start_date TEXT,
    end_date TEXT,
    owner TEXT,
    lane TEXT,
    project TEXT,
    tags TEXT,
    dependencies TEXT,
    PRIMARY KEY (id, branch_id, version)
);

-- Branches
CREATE TABLE branches (
    branch_id TEXT PRIMARY KEY,
    label TEXT,              -- Human-readable name
    created_from TEXT,       -- Parent branch
    note TEXT,              -- Branch description
    created_at TEXT DEFAULT (datetime('now'))
);

-- Import profiles (saved column mappings)
CREATE TABLE import_profiles (
    name TEXT PRIMARY KEY,
    json TEXT NOT NULL,      -- JSON-serialized mapping config
    created_at TEXT DEFAULT (datetime('now'))
);

-- App parameters (misc settings)
CREATE TABLE app_params (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- Schema versioning
CREATE TABLE _schema_version (
    version INTEGER PRIMARY KEY,
    applied_at TEXT DEFAULT (datetime('now'))
);
```

**Indexes:**

```sql
-- Performance indexes
CREATE INDEX idx_item_branch ON item(branch_id, type);
CREATE INDEX idx_item_dates ON item(start_date, end_date);
CREATE INDEX idx_item_project ON item(project);
CREATE INDEX idx_history_branch ON item_history(branch_id, snapshot_at);
CREATE INDEX idx_history_id ON item_history(id, branch_id, version);
```

**Triggers (Automatic History Tracking):**

```sql
-- Track inserts
CREATE TRIGGER item_insert_history
AFTER INSERT ON item
BEGIN
    INSERT INTO item_history (id, branch_id, version, op, type, title, start_date, end_date, owner, lane, project, tags, dependencies)
    SELECT NEW.id, NEW.branch_id,
           COALESCE((SELECT MAX(version) FROM item_history WHERE id = NEW.id AND branch_id = NEW.branch_id), 0) + 1,
           'insert', NEW.type, NEW.title, NEW.start_date, NEW.end_date, NEW.owner, NEW.lane, NEW.project, NEW.tags, NEW.dependencies;
END;

-- Track updates
CREATE TRIGGER item_update_history
AFTER UPDATE ON item
BEGIN
    INSERT INTO item_history (id, branch_id, version, op, type, title, start_date, end_date, owner, lane, project, tags, dependencies)
    SELECT NEW.id, NEW.branch_id,
           (SELECT MAX(version) FROM item_history WHERE id = NEW.id AND branch_id = NEW.branch_id) + 1,
           'update', NEW.type, NEW.title, NEW.start_date, NEW.end_date, NEW.owner, NEW.lane, NEW.project, NEW.tags, NEW.dependencies;
END;
```

### Database Service Layer

**Architecture:**

```
Component
   ↓
Store (Zustand)
   ↓
Service (business logic)
   ↓
Query Builder (SQL)
   ↓
Database Service (sql.js wrapper)
   ↓
IndexedDB (persistence)
```

**Example:**

```typescript
// services/database.service.ts
export class DatabaseService {
  private db: Database | null = null;

  async initialize(): Promise<void> {
    const SQL = await initSqlJs({
      locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
    });

    // Try to load from IndexedDB
    const savedData = await loadFromIndexedDB('swimlanes-db');

    if (savedData) {
      this.db = new SQL.Database(savedData);
    } else {
      this.db = new SQL.Database();
      await this.createSchema();
    }

    // Start auto-save
    this.startAutoSave();
  }

  async createSchema(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Run all CREATE TABLE statements
    this.db.run(SCHEMA_SQL);

    // Set initial version
    this.db.run('INSERT INTO _schema_version (version) VALUES (?)', [SCHEMA_VERSION]);
  }

  private startAutoSave(): void {
    setInterval(() => {
      if (this.db) {
        const data = this.db.export();
        saveToIndexedDB('swimlanes-db', data);
      }
    }, 5000); // Every 5 seconds
  }
}
```

---

## State Management

### Zustand Store Pattern

**Store Structure:**

```typescript
// stores/timeline.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TimelineState {
  // State
  currentBranch: string;
  zoomLevel: 'day' | 'week' | 'month' | 'quarter' | 'year';
  laneGroupBy: 'lane' | 'project' | 'owner' | 'type';
  filterType: string;
  filterProject: string;
  panOffset: { x: number; y: number };

  // Actions
  setBranch: (branch: string) => void;
  setZoom: (zoom: TimelineState['zoomLevel']) => void;
  setLaneGroupBy: (groupBy: TimelineState['laneGroupBy']) => void;
  setFilters: (filters: Partial<Pick<TimelineState, 'filterType' | 'filterProject'>>) => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
  reset: () => void;
}

export const useTimelineStore = create<TimelineState>()(
  persist(
    (set) => ({
      // Initial state
      currentBranch: 'main',
      zoomLevel: 'month',
      laneGroupBy: 'lane',
      filterType: '',
      filterProject: '',
      panOffset: { x: 0, y: 0 },

      // Actions
      setBranch: (branch) => set({ currentBranch: branch }),
      setZoom: (zoom) => set({ zoomLevel: zoom }),
      setLaneGroupBy: (groupBy) => set({ laneGroupBy: groupBy }),
      setFilters: (filters) => set(filters),
      setPanOffset: (offset) => set({ panOffset: offset }),
      reset: () => set({
        zoomLevel: 'month',
        laneGroupBy: 'lane',
        filterType: '',
        filterProject: '',
        panOffset: { x: 0, y: 0 },
      }),
    }),
    {
      name: 'timeline-preferences', // localStorage key
      partialize: (state) => ({
        // Only persist UI preferences, not runtime state
        zoomLevel: state.zoomLevel,
        laneGroupBy: state.laneGroupBy,
      }),
    }
  )
);
```

**Usage in Components:**

```typescript
// components/timeline/TimelineControls.tsx
function TimelineControls() {
  const { zoomLevel, setZoom } = useTimelineStore();

  return (
    <select value={zoomLevel} onChange={(e) => setZoom(e.target.value as any)}>
      <option value="day">Day</option>
      <option value="week">Week</option>
      <option value="month">Month</option>
      <option value="quarter">Quarter</option>
      <option value="year">Year</option>
    </select>
  );
}
```

### Undo/Redo Implementation

```typescript
// stores/undo.store.ts
interface Operation {
  type: 'import' | 'update' | 'delete' | 'branch-create';
  data: any;
  inverse: () => Promise<void>; // Function to undo
  timestamp: string;
}

interface UndoState {
  past: Operation[];
  future: Operation[];

  addOperation: (op: Operation) => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;
}

export const useUndoStore = create<UndoState>((set, get) => ({
  past: [],
  future: [],

  addOperation: (op) => set((state) => ({
    past: [...state.past, op],
    future: [], // Clear redo stack
  })),

  undo: async () => {
    const { past } = get();
    if (past.length === 0) return;

    const operation = past[past.length - 1];
    await operation.inverse(); // Run undo function

    set((state) => ({
      past: state.past.slice(0, -1),
      future: [operation, ...state.future],
    }));
  },

  redo: async () => {
    const { future } = get();
    if (future.length === 0) return;

    const operation = future[0];
    await operation.inverse(); // Re-run operation

    set((state) => ({
      past: [...state.past, operation],
      future: state.future.slice(1),
    }));
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
  clear: () => set({ past: [], future: [] }),
}));
```

---

## Component Architecture

### Component Hierarchy

```
App
├── Layout
│   ├── Header
│   ├── TabNavigation
│   │   ├── ImportTab
│   │   │   ├── ImportForm
│   │   │   ├── ColumnMapper
│   │   │   └── DryRunPreview
│   │   ├── TimelineTab
│   │   │   ├── TimelineControls
│   │   │   ├── TimelineCanvas (react-konva)
│   │   │   └── TimelineLegend
│   │   ├── BranchesTab
│   │   │   ├── BranchSelector
│   │   │   └── BranchCompare
│   │   └── HistoryTab
│   │       ├── HistorySearch
│   │       └── HistoryPanel
│   └── Footer
└── Dialogs (rendered at root)
    ├── ExportDialog
    ├── ConfirmDialog
    └── ErrorDialog
```

### Design Patterns

**Container/Presenter Pattern:**

```typescript
// Container (logic)
function TimelineContainer() {
  const { currentBranch } = useTimelineStore();
  const { data: items } = useQuery(['items', currentBranch], () =>
    itemsService.getItems(currentBranch)
  );

  return <TimelinePresenter items={items} />;
}

// Presenter (pure UI)
function TimelinePresenter({ items }: { items: Item[] }) {
  return (
    <Stage>
      {items.map(item => <TimelineItem key={item.id} item={item} />)}
    </Stage>
  );
}
```

**Custom Hooks for Logic:**

```typescript
// hooks/useTimeline.ts
export function useTimeline() {
  const { currentBranch, zoomLevel, laneGroupBy } = useTimelineStore();
  const db = useDatabase();

  const items = useMemo(() => {
    return db.getItems({ branch: currentBranch });
  }, [db, currentBranch]);

  const lanes = useMemo(() => {
    return groupItemsByLane(items, laneGroupBy);
  }, [items, laneGroupBy]);

  const dateRange = useMemo(() => {
    return calculateDateRange(items);
  }, [items]);

  return { items, lanes, dateRange, zoomLevel };
}
```

---

## Deployment Architecture

See `deployment.md` for full details.

**Summary:**

```
Developer
   ↓ git push
GitHub (main branch)
   ↓ triggers
GitHub Actions
   ↓ builds
dist/ (hosted) + dist-single/ (single-file)
   ↓ SCP/rsync
Vultr OpenBSD Server
   ↓ serves via
httpd (web server)
   ↓ accessed at
swimlanes.jafner.com
```

---

## Security Considerations

### Client-Side Security

**XSS Prevention:**
- React auto-escapes by default
- Never use `dangerouslySetInnerHTML` without sanitization
- Validate all user inputs

**SQL Injection (sql.js):**
- Always use parameterized queries
- Never concatenate user input into SQL strings

```typescript
// ❌ BAD
db.run(`SELECT * FROM item WHERE title = '${userInput}'`);

// ✅ GOOD
db.run('SELECT * FROM item WHERE title = ?', [userInput]);
```

**Data Privacy:**
- All data stored locally (IndexedDB)
- No analytics/tracking by default
- Optional: Add encryption layer for sensitive data

### Server-Side Security

**HTTP Headers (OpenBSD httpd):**

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline';
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

**HTTPS:**
- SSL/TLS certificate (Let's Encrypt)
- Redirect HTTP → HTTPS
- HSTS enabled

---

## Performance Strategy

### Bundle Size Optimization

**Target:** < 500 KB (gzipped)

**Techniques:**
- Code splitting (lazy load routes)
- Tree shaking (remove unused code)
- Minification (Terser)
- Compression (gzip/brotli)
- CDN for sql.js WASM (~1.5 MB, don't bundle)

### Runtime Performance

**Timeline Rendering:**
- Use react-konva layers for caching
- Virtualize items (only render visible viewport)
- Debounce pan/zoom updates
- Use `useMemo` for expensive calculations

```typescript
// Virtualization example
const visibleItems = useMemo(() => {
  const { startDate, endDate } = viewportDateRange;
  return items.filter(item =>
    item.start_date >= startDate && item.start_date <= endDate
  );
}, [items, viewportDateRange]);
```

**Database Queries:**
- Use indexes for common queries
- Prepare statements for repeated queries
- Batch operations in transactions
- Limit result sets (pagination)

**Auto-Save:**
- Debounce save operations
- Use Web Workers for export (future)
- Compress before saving to IndexedDB

---

**Document Version:** 1.0
**Next Review:** End of Phase 1
