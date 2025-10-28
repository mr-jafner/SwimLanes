# SwimLanes Development Roadmap

**Project:** SwimLanes - Timeline Management with Version Control
**Architecture:** React + TypeScript Web App (Hosted + Single-File Distribution)
**Timeline:** 5-6 weeks to production-ready v1.0
**Last Updated:** 2025-01-25

---

## Project Goals

Transform the current HTML prototype into a production-ready web application that:

- ✅ Maintains local-first, offline-capable architecture
- ✅ Provides modern development experience with testing and maintainability
- ✅ Deploys as both hosted web app (swimlanes.jafner.com) and downloadable single HTML file
- ✅ Enables easy sharing with coworkers without installation requirements
- ✅ Implements all core features from specification (version control, branching, history, comparisons)

---

## Architecture Decision Summary

### Chosen Path: **Option B1 + B2 (Enhanced Modular Web App)**

**Not Tauri (Option A)** - Rejected due to:

- Corporate environment installation friction (admin rights required)
- Difficult distribution via email/SharePoint (.exe files blocked)
- Overhead for simple coworker sharing use case

**Not Refined Prototype (Option C)** - Rejected due to:

- Poor maintainability and testability
- Technical debt accumulation
- Difficulty adding complex features

**Selected Approach Benefits:**

- Modern TypeScript development with proper tooling
- Builds to both hosted SPA and single HTML file
- No installation barriers for coworkers
- Future-proof and maintainable

---

## Tech Stack

**Core:**

- React 18+
- TypeScript 5.x (strict mode)
- Vite (build tool)

**State & Data:**

- Zustand (state management)
- sql.js (SQLite in browser via WASM)
- IndexedDB (auto-save persistence)

**UI/Styling:**

- Tailwind CSS
- shadcn/ui (copy-paste components)
- react-konva (canvas timeline rendering)

**Testing:**

- Vitest (unit/integration)
- React Testing Library
- Playwright (E2E, added later)

**Deployment:**

- Self-hosted OpenBSD (Vultr) via GitHub Actions
- Domain: swimlanes.jafner.com
- Web server: OpenBSD httpd

---

## Phase 1: Foundation & Architecture (Weeks 1-2)

**Duration:** 2 weeks
**Goal:** Establish development environment and migrate core database functionality

### Week 1: Project Setup & Infrastructure

**Tasks:**

1. **Initialize Project Structure**
   - Set up Vite + React + TypeScript project
   - Configure Tailwind CSS
   - Install and configure shadcn/ui
   - Set up ESLint and Prettier
   - Initialize Git repository structure

2. **Build Configuration**
   - Create primary Vite config (hosted version)
   - Create single-file Vite config (standalone distribution)
   - Configure build scripts for both outputs
   - Test both build outputs locally

3. **Testing Framework**
   - Install Vitest and React Testing Library
   - Configure test environment
   - Create example test to verify setup
   - Set up test coverage reporting

4. **GitHub Actions Setup**
   - Create deployment workflow for OpenBSD server
   - Configure SSH deployment to Vultr
   - Set up build artifact uploads
   - Test deployment pipeline

5. **Project Structure Creation**
   - Create folder structure (see architecture.md)
   - Set up path aliases in tsconfig
   - Create barrel exports for clean imports
   - Document structure in README

**Deliverables:**

- ✅ Working Vite project with both build targets
- ✅ Automated deployment pipeline
- ✅ Testing framework configured
- ✅ Clean project structure ready for features

### Week 2: Database Layer Migration

**Tasks:**

1. **TypeScript Type Definitions**
   - Define `Item` interface (id, type, title, dates, owner, lane, project, tags)
   - Define `ItemHistory` interface
   - Define `Branch` interface
   - Define mapping and import types
   - Create database query result types

2. **Database Service Layer**
   - Extract sql.js initialization logic
   - Create `database.service.ts` with connection management
   - Implement schema versioning table
   - Create schema initialization functions
   - Add IndexedDB persistence layer

3. **Schema Migration from Prototype**
   - Port CREATE TABLE statements to TypeScript
   - Port CREATE INDEX statements
   - Port CREATE TRIGGER statements (history tracking)
   - Add schema version tracking
   - Implement version mismatch detection

4. **Database Query Abstractions**
   - Create `queries/items.ts` (CRUD operations)
   - Create `queries/branches.ts` (branch operations)
   - Create `queries/history.ts` (version history queries)
   - Create `queries/import.ts` (import operations)
   - Add TypeScript return types for all queries

5. **Persistence Service**
   - Implement IndexedDB save/load functions
   - Add auto-save timer (every 5 seconds)
   - Create manual export to .sqlite file
   - Create manual import from .sqlite file
   - Add clear local data function

**Deliverables:**

- ✅ Fully typed database layer
- ✅ All prototype SQL migrated to services
- ✅ IndexedDB persistence working
- ✅ Unit tests for database operations (>80% coverage)

---

## Phase 2: Feature Migration & Completeness (Weeks 3-4)

**Duration:** 2 weeks
**Goal:** Migrate all existing features and implement missing core functionality

### Week 3: Import/Map & Timeline Visualization

**Tasks:**

1. **Import/Map Feature**
   - Create `ImportForm.tsx` component
   - Migrate CSV parsing logic to `services/csv-parser.ts`
   - Migrate JSON import logic
   - Create column mapping UI with auto-detection
   - Implement ID strategy selector (generate/column/match)
   - Create dry-run preview component
   - Implement commit import flow
   - Add import profile save/load functionality

2. **Timeline Visualization**
   - Set up react-konva Stage and Layer components
   - Create `TimelineCanvas.tsx` main component
   - Implement swim lane grouping logic (lane/project/owner/type)
   - Create timeline rendering service
   - Implement zoom level controls (day/week/month/quarter/year)
   - Add time axis rendering with dynamic ticks
   - Implement item rendering (tasks as bars, milestones as diamonds)
   - Add color coding by item type

3. **Timeline Interactions**
   - Implement click-and-drag panning
   - Add mouse wheel zoom
   - Create item click handlers
   - Add item tooltips with full details
   - Implement filter controls (type, project, date range)
   - Add lane collapse/expand functionality

4. **State Management**
   - Create `stores/timeline.store.ts` (Zustand)
   - Create `stores/import.store.ts`
   - Create `stores/app.store.ts` (global state)
   - Implement undo/redo stack in store
   - Add store persistence to localStorage for UI preferences

**Deliverables:**

- ✅ Full import/map workflow migrated
- ✅ Interactive timeline visualization
- ✅ Filters and controls working
- ✅ Component tests for UI elements

### Week 4: Branches, History & Comparisons

**Tasks:**

1. **Branch Management**
   - Create `BranchSelector.tsx` component
   - Implement create new branch flow
   - Add branch switching functionality
   - Create branch metadata editor (notes, labels)
   - Implement branch deletion with confirmation
   - Add bulk operations UI (shift dates, etc.)

2. **Version History**
   - Create `HistoryPanel.tsx` component
   - Implement item history search
   - Create version timeline visualization
   - Add per-field change chips
   - **NEW: Implement revert to version functionality**
   - Add version comparison view

3. **Branch Comparison**
   - Create `BranchCompare.tsx` component
   - Implement FULL OUTER JOIN diff query
   - Create comparison summary (added/removed/changed counts)
   - Add detailed diff table view
   - Implement visual diff overlay on timeline
   - Color code changes (green=added, red=removed, orange=changed)

4. **Undo/Redo System**
   - Implement operation stack
   - Add undo handler (Ctrl+Z)
   - Add redo handler (Ctrl+Y)
   - Create undo history panel
   - Add keyboard shortcut listeners

**Deliverables:**

- ✅ Full branch management system
- ✅ Version history with revert capability
- ✅ Branch comparison working
- ✅ Undo/redo functional

---

## Phase 3: Advanced Features & Polish (Week 5)

**Duration:** 1 week
**Goal:** Implement advanced features and professional UX

### Advanced Features

**Tasks:**

1. **Dependencies & Critical Path**
   - Add dependencies column to schema
   - Create dependency arrow rendering on canvas
   - Implement drag-to-link dependency creation
   - Add dependency validation (no cycles)
   - Implement critical path calculation algorithm
   - Add critical path highlighting on timeline

2. **Enhanced Export/Import**
   - Improve PNG export (high-res, 2x option)
   - Add PDF export with multiple pages
   - Create Excel export with formatting
   - Add CSV export with full history
   - Implement iCal export for meetings
   - Create export templates system

3. **Advanced Filtering**
   - Add full-text search across all fields
   - Create tag-based multi-select filter
   - Implement date range picker
   - Add saved filter presets
   - Create quick filter bar

4. **Business Days Support**
   - Add business days toggle
   - Implement business day calculation (exclude weekends)
   - Add holiday configuration
   - Update duration displays

**Deliverables:**

- ✅ Dependency arrows and critical path
- ✅ Enhanced export options
- ✅ Advanced filtering
- ✅ Business days calculation

### UX Polish

**Tasks:**

1. **UI/UX Improvements**
   - Implement responsive design (mobile-friendly)
   - Add dark mode support
   - Create loading states and skeleton screens
   - Design empty states with helpful onboarding
   - Add toast notifications for all actions
   - Improve form validation and error messages

2. **Accessibility**
   - Add ARIA labels to all interactive elements
   - Implement keyboard navigation
   - Add focus indicators
   - Test with screen readers
   - Ensure proper heading hierarchy
   - Add skip-to-content links

3. **Performance Optimization**
   - Implement virtualization for large datasets (5000+ items)
   - Add memo/useMemo for expensive computations
   - Lazy load heavy components
   - Optimize canvas rendering (layer caching)
   - Add loading indicators for long operations

4. **Help & Documentation**
   - Create in-app help tooltips
   - Add keyboard shortcuts panel
   - Create quick start guide
   - Add example datasets
   - Create video tutorial (optional)

**Deliverables:**

- ✅ Polished, professional UI
- ✅ Accessible application
- ✅ Performant with large datasets
- ✅ User-friendly help system

---

## Phase 4: Testing & Quality (Week 6)

**Duration:** 1 week
**Goal:** Ensure reliability and production readiness

### Testing

**Tasks:**

1. **Unit Tests**
   - Test all service functions (database, import, timeline)
   - Test all utility functions (date parsing, CSV parsing)
   - Test Zustand stores
   - Achieve >80% code coverage
   - Add edge case tests

2. **Integration Tests**
   - Test complete import workflow
   - Test branch creation and switching
   - Test export workflows
   - Test undo/redo stack
   - Test persistence (IndexedDB save/load)

3. **Component Tests**
   - Test all major components render correctly
   - Test user interactions (clicks, drags)
   - Test form validations
   - Test error states
   - Test loading states

4. **E2E Tests (Optional)**
   - Install Playwright
   - Create test scenarios for key workflows
   - Test cross-browser compatibility
   - Test on mobile viewport

**Deliverables:**

- ✅ >80% test coverage
- ✅ All critical paths tested
- ✅ CI/CD runs tests on every commit

### Quality Assurance

**Tasks:**

1. **Browser Testing**
   - Test on Chrome/Edge (Windows)
   - Test on Firefox
   - Test on Safari (macOS)
   - Test on mobile browsers
   - Fix browser-specific issues

2. **Performance Profiling**
   - Profile timeline rendering
   - Optimize slow database queries
   - Check bundle size (<500 KB gzipped)
   - Optimize images and assets
   - Add performance monitoring

3. **Security Review**
   - Review all user inputs for XSS vulnerabilities
   - Ensure CSP headers configured
   - Check for SQL injection (sql.js parameterized queries)
   - Review dependencies for vulnerabilities
   - Add security headers to httpd config

4. **Documentation**
   - Complete inline code documentation
   - Update README with setup instructions
   - Create user guide
   - Document API/service functions
   - Create developer onboarding guide

**Deliverables:**

- ✅ Cross-browser compatibility verified
- ✅ Performance optimized
- ✅ Security reviewed
- ✅ Complete documentation

---

## Phase 5: Deployment & Launch (Post-Development)

**Goal:** Deploy to production and enable coworker access

### Pre-Launch Checklist

- [ ] All tests passing
- [ ] Production build successful (both versions)
- [ ] GitHub Actions deployment working
- [ ] OpenBSD httpd configured
- [ ] DNS pointing to swimlanes.jafner.com
- [ ] SSL certificate installed
- [ ] Single-file download available
- [ ] Example datasets included
- [ ] User documentation complete
- [ ] Analytics/monitoring set up (optional)

### Deployment Steps

1. **Final Production Build**
   - Run full test suite
   - Build hosted version
   - Build single-file version
   - Verify both builds work locally

2. **Deploy to Server**
   - Push to main branch (triggers GitHub Actions)
   - Monitor deployment logs
   - Verify files deployed correctly
   - Test on production URL

3. **Post-Deployment Verification**
   - Test all features on production
   - Verify IndexedDB persistence works
   - Test export/import flows
   - Check mobile responsiveness
   - Verify analytics (if configured)

4. **User Onboarding**
   - Share link with coworkers
   - Provide quick start guide
   - Share example datasets
   - Collect initial feedback

### Launch Announcement

**Internal (Coworkers):**

- Email with link to swimlanes.jafner.com
- Quick start guide
- Link to download single-file version
- Support contact info

**External (Optional):**

- GitHub repository public
- Blog post
- Product Hunt launch
- LinkedIn/Twitter announcement

---

## Future Enhancements (Post-v1.0)

### Potential v2.0 Features

**Collaboration (if backend added):**

- Real-time collaboration
- Cloud sync (optional)
- Shared workspaces
- Comments and annotations

**Advanced Planning:**

- Resource allocation tracking
- Budget/cost tracking
- Recurring items
- Template library
- Gantt chart export to Project/Excel

**Integrations:**

- Import from Jira
- Import from GitHub Projects
- Import from Linear
- Export to Google Calendar
- Slack notifications

**Analytics:**

- Velocity tracking
- Burndown charts
- Team capacity planning
- Timeline analytics

---

## Risk Mitigation

### Known Risks

**Risk: Browser storage limits (IndexedDB)**

- Mitigation: Warn users at 80% capacity, encourage export
- Fallback: Download-only mode (no persistence)

**Risk: Large datasets (5000+ items) performance**

- Mitigation: Implement virtualization, lazy loading
- Fallback: Pagination or branch splitting

**Risk: Browser compatibility (Safari quirks)**

- Mitigation: Test early and often on Safari
- Fallback: Show browser compatibility warning

**Risk: Deployment to OpenBSD issues**

- Mitigation: Test deployment early in Phase 1
- Fallback: Deploy to Vercel/Netlify temporarily

---

## Success Metrics

### Development Metrics

- ✅ Test coverage >80%
- ✅ Build time <30 seconds
- ✅ Bundle size <500 KB (gzipped)
- ✅ Lighthouse score >90

### User Metrics

- ✅ Page load <2 seconds
- ✅ Timeline renders 1000 items in <1 second
- ✅ No data loss (IndexedDB reliable)
- ✅ Works offline (PWA)

### Adoption Metrics (Post-Launch)

- Track active users
- Track timelines created
- Collect feedback
- Monitor error rates

---

## Resource Requirements

### Development Time

- **Total:** 5-6 weeks
- **Daily:** 4-6 hours/day
- **Critical path:** Phases 1-2 (weeks 1-4)

### Tools & Services

- ✅ GitHub (repository, actions) - Free
- ✅ Vultr VPS (existing) - $0
- ✅ Domain (jafner.com) - $0 (existing)
- ✅ Vercel (optional backup) - Free tier
- ✅ Development machine - Existing

---

## Rollout Strategy

### Beta Testing (Week 5-6)

- Internal testing with 2-3 coworkers
- Collect feedback
- Fix critical bugs
- Iterate on UX

### v1.0 Launch (Week 6)

- Broader coworker rollout
- Monitor for issues
- Provide support
- Gather feature requests

### v1.1+ Updates (Ongoing)

- Address bugs
- Add minor features
- Improve performance
- Update dependencies

---

## Appendix: GitHub Issue Templates

### Issue Labels

**Type:**

- `type:bug` - Something isn't working
- `type:feature` - New feature request
- `type:enhancement` - Improve existing feature
- `type:docs` - Documentation changes
- `type:refactor` - Code cleanup

**Priority:**

- `priority:critical` - Blocks users, must fix immediately
- `priority:high` - Important, fix in next sprint
- `priority:medium` - Nice to have
- `priority:low` - Backlog

**Phase:**

- `phase:1` - Foundation
- `phase:2` - Features
- `phase:3` - Polish
- `phase:4` - Testing
- `phase:5` - Deployment

**Component:**

- `component:database` - Database layer
- `component:import` - Import/map features
- `component:timeline` - Timeline visualization
- `component:branches` - Branch management
- `component:ui` - User interface
- `component:testing` - Tests

### Sample Issues for Phase 1

See separate GitHub issue creation document for complete issue list.

---

**Document Version:** 1.0
**Last Updated:** 2025-01-25
**Next Review:** End of Phase 1
