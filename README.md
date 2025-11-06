# SwimLanes

**Timeline Management with Git-like Version Control**

A browser-based project timeline application that brings version control concepts (branching, history, comparisons) to task and milestone management. Built with React, TypeScript, and local-first architecture.

---

## Status

**Current Phase:** Phase 1 - Foundation & Architecture (In Progress)

**Implemented:**
- ✅ Database service layer with sql.js (SQLite in browser)
- ✅ IndexedDB persistence service for auto-save
- ✅ Database schema with versioned history tracking
- ✅ TypeScript type definitions
- ✅ Testing infrastructure (92 tests across 6 test files)
- ✅ CI/CD pipeline with GitHub Actions
- ✅ shadcn/ui component library integration
- ✅ Tailwind CSS v4 styling system
- ✅ Pre-commit hooks with Husky + lint-staged

**In Progress:**
- 🚧 Timeline canvas rendering (react-konva)
- 🚧 CSV import and column mapping
- 🚧 Branch management UI
- 🚧 History and version control UI
- 🚧 Zustand state management

See [CLAUDE.md](./CLAUDE.md) for complete project documentation and [GitHub Issues](https://github.com/mr-jafner/SwimLanes/issues) for detailed task tracking.

---

## Quick Start

### Prerequisites

- Node.js 18+ (tested with Node 20)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/mr-jafner/SwimLanes.git
cd SwimLanes

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the app.

---

## Development Commands

### Development Server
```bash
npm run dev          # Start Vite dev server on http://localhost:5173
```

### Building
```bash
npm run build         # Build for hosting → dist/
npm run build:single  # Build single HTML file → dist-single/
npm run preview       # Preview production build locally
```

### Code Quality
```bash
npm run lint          # Run ESLint
npm run lint:fix      # Auto-fix ESLint issues
npm run typecheck     # TypeScript type checking
npm run format        # Check Prettier formatting
npm run format:write  # Auto-format with Prettier
```

### Testing
```bash
npm test              # Run Vitest in watch mode
npm run test:run      # Run tests once
npm run test:ui       # Open Vitest UI
npm run test:coverage # Generate coverage report
npm run test:e2e      # Run Playwright E2E tests
```

---

## Tech Stack

**Core Framework:**
- React 19.1.1
- TypeScript 5.9.3 (strict mode)
- Vite 7.1.7

**State & Data:**
- sql.js 1.13.0 (SQLite WASM)
- IndexedDB (persistence)
- Zustand (state management - planned)

**UI & Styling:**
- Tailwind CSS 4.1.16
- shadcn/ui (component library)
- next-themes (dark mode support)
- react-konva (canvas rendering - planned)

**Testing:**
- Vitest 4.0.4 + React Testing Library
- Playwright 1.56.1 (E2E)
- Coverage: Lines 70% | Functions 45% | Branches 65% | Statements 70%

**Tooling:**
- ESLint + Prettier
- Husky + lint-staged (pre-commit hooks)
- GitHub Actions (CI/CD)

---

## Project Structure

```
SwimLanes/
├── src/
│   ├── components/       # React components
│   │   └── ui/          # shadcn/ui components
│   ├── services/        # Business logic
│   │   ├── database.service.ts
│   │   └── persistence.service.ts
│   ├── db/              # Database layer
│   │   └── schema.ts    # Tables, indexes, triggers
│   ├── types/           # TypeScript definitions
│   ├── lib/             # Utilities
│   └── test/            # Test setup
├── ref/                 # Planning documentation
│   ├── roadmap.md       # 5-phase development plan
│   ├── architecture.md  # Technical details
│   └── github-issues.md # Issue templates
├── legacy/              # Original HTML prototype
└── e2e/                 # Playwright E2E tests
```

---

## Database Schema

SwimLanes uses SQLite (via sql.js WASM) with automatic history tracking:

**Main Tables:**
- `item` - Current state (id, type, title, dates, owner, lane, project, tags, branch_id)
- `item_history` - Complete audit trail with versioning
- `branches` - Branch metadata for scenario planning
- `import_profiles` - Saved CSV column mappings
- `app_params` - Application settings
- `_schema_version` - Schema version tracking

**Item Types:**
- `task` - Work items (blue bars)
- `milestone` - Single-date markers (green diamonds)
- `release` - Deployment events (orange bars)
- `meeting` - Calendar events (purple bars)

See [CLAUDE.md - Database Schema](./CLAUDE.md#database-schema) for complete details.

---

## Features (Planned)

### Three-Stage Workflow
1. **Import/Map** - Parse CSV/JSON, auto-detect columns, dry-run preview
2. **Update/Append** - Re-import with saved profiles (upsert or update-only)
3. **View Timeline** - Canvas-based Gantt chart with swim lanes

### Version Control
- **Branching** - Create unlimited scenario branches
- **History** - Complete audit trail of all changes
- **Comparisons** - Diff any two branches to see changes
- **Isolation** - Each branch has independent data

### Timeline Visualization
- Pan and zoom with dynamic time axis
- Swim lanes grouped by lane/project/owner/type
- Filter by type and project
- Optimized for 1000-5000+ items

---

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Complete project documentation (16KB, comprehensive)
- **[ref/roadmap.md](./ref/roadmap.md)** - 5-phase development plan
- **[ref/architecture.md](./ref/architecture.md)** - Technical architecture
- **[GitHub Issues](https://github.com/mr-jafner/SwimLanes/issues)** - Task tracking (40 issues across 5 phases)

---

## Legacy Prototype

The original working prototype is preserved in `legacy/timeline-app.html` (1685 lines, 60KB single file). Open it in a browser with `sample-data.csv` to see the fully functional implementation that we're migrating from.

---

## Contributing

This is a personal project, but suggestions and bug reports are welcome via GitHub Issues.

**Commit Message Format:**
```
feat: add timeline canvas rendering (#19)

- Implement react-konva Stage and Layer components
- Add pan and zoom functionality

Closes #19

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## License

MIT License - See [LICENSE](./LICENSE) for details.

---

## Links

- **Repository:** https://github.com/mr-jafner/SwimLanes
- **Issues:** https://github.com/mr-jafner/SwimLanes/issues
- **Project Board:** https://github.com/mr-jafner/SwimLanes/projects

---

**Last Updated:** 2025-11-05
**Version:** 0.0.0 (Pre-release, Phase 1)
