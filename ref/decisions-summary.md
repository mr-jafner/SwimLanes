# SwimLanes - Decisions Summary

**Quick Reference Document**
**Version:** 1.0
**Last Updated:** 2025-01-25

This document summarizes all key architectural and technical decisions made for the SwimLanes project.

---

## Project Overview

**Name:** SwimLanes
**Purpose:** Timeline management with Git-like version control for tasks, milestones, releases, and meetings
**Target Users:** Coworkers (internal tool), potential public release
**Architecture:** Local-first web application

---

## Key Decisions

### Architecture Choice: **Option B1 + B2 (Enhanced Modular Web App)**

**Why NOT Tauri (Desktop App):**

- ❌ Requires admin rights to install (corporate restriction)
- ❌ .exe files blocked by email filters
- ❌ Difficult to distribute to coworkers
- ❌ Overhead for simple sharing use case

**Why NOT Refined Prototype:**

- ❌ Poor maintainability
- ❌ Difficult to test
- ❌ Technical debt accumulation

**Why YES to Enhanced Web App:**

- ✅ No installation required
- ✅ Works in any browser
- ✅ Easy to share (just send link or HTML file)
- ✅ Modern development experience
- ✅ Testable and maintainable
- ✅ Can host AND provide single-file download

---

## Tech Stack (Final)

### Core Technologies

| Category       | Technology | Version | Reason                             |
| -------------- | ---------- | ------- | ---------------------------------- |
| **Framework**  | React      | 18+     | Team familiarity, mature ecosystem |
| **Language**   | TypeScript | 5.x     | Type safety, better DX             |
| **Build Tool** | Vite       | 5.x     | Fast builds, HMR, modern           |

### State & Data

| Category             | Technology           | Reason                                                |
| -------------------- | -------------------- | ----------------------------------------------------- |
| **State Management** | Zustand              | Minimal boilerplate, lightweight (~1 KB)              |
| **Database**         | sql.js (SQLite WASM) | Full SQL, runs in browser, existing prototype uses it |
| **Persistence**      | IndexedDB            | Large storage, async, standard API                    |

### UI & Styling

| Category          | Technology   | Reason                                             |
| ----------------- | ------------ | -------------------------------------------------- |
| **CSS Framework** | Tailwind CSS | Team uses it in other project, utility-first       |
| **Components**    | shadcn/ui    | Copy-paste (not a dependency), highly customizable |
| **Canvas**        | react-konva  | Declarative React API, performant, event handling  |

### Testing

| Category             | Technology            | Reason                                 |
| -------------------- | --------------------- | -------------------------------------- |
| **Unit/Integration** | Vitest                | Fast, Vite-native, Jest-compatible API |
| **React Testing**    | React Testing Library | User-centric, standard for React       |
| **E2E (future)**     | Playwright            | Cross-browser, reliable                |

### Build & Deploy

| Category       | Technology           | Reason                                   |
| -------------- | -------------------- | ---------------------------------------- |
| **CI/CD**      | GitHub Actions       | Free, integrated with GitHub             |
| **Hosting**    | Self-hosted OpenBSD  | Existing Vultr server, full control      |
| **Web Server** | httpd (OpenBSD)      | Built-in, simple, performant             |
| **Domain**     | swimlanes.jafner.com | Custom domain on existing infrastructure |

---

## Detailed Decisions

### 1. State Management: Zustand

**Options Considered:**

- Redux Toolkit (too much boilerplate)
- Jotai (less familiar)
- React Context + useReducer (too basic)

**Decision:** Zustand

- Minimal API, easy to learn
- Perfect for TypeScript
- Middleware for persistence
- Works great with undo/redo

### 2. UI Components: shadcn/ui

**Options Considered:**

- Build everything custom (too much work)
- Headless UI (still need to style everything)
- Radix UI (shadcn uses this under the hood)

**Decision:** shadcn/ui

- Not a dependency (copies components to your codebase)
- Uses Radix UI primitives (accessible)
- Pre-styled with Tailwind
- Easy to customize

### 3. Canvas Rendering: react-konva

**Options Considered:**

- Raw Canvas API (too imperative, hard to maintain)
- Fabric.js (not React-friendly)
- Konva.js directly (react-konva is better for React)

**Decision:** react-konva

- Declarative React components for canvas
- Built-in drag, events, transforms
- Performant (1000+ shapes no problem)
- Layer-based composition

### 4. Database Persistence: IndexedDB Auto-Save

**Options Considered:**

- In-memory only (lost on refresh)
- localStorage (too small, 5-10 MB limit)
- Manual file only (users must remember to save)

**Decision:** IndexedDB with auto-save + manual export

- Auto-save every 5 seconds (convenience)
- Manual export to .sqlite file (sharing, backup)
- Clear local data button (transparency)
- 100% local (privacy)

**User Control:**

- Clear UI showing data is local
- Export/import buttons prominently displayed
- "Clear local data" option available

### 5. Deployment: Self-Hosted OpenBSD

**Options Considered:**

- Vercel (easier, but want self-hosted)
- Netlify (easier, but want self-hosted)
- Cloudflare Pages (easier, but want self-hosted)

**Decision:** OpenBSD on Vultr via GitHub Actions

- Already have server running
- Full control over infrastructure
- No vendor lock-in
- GitHub Actions handles deployment automatically

### 6. Build Strategy: Dual Builds

**Decision:** Build both versions automatically

**Hosted Version (dist/):**

- Code-split, optimized SPA
- Served at swimlanes.jafner.com
- Best performance

**Single-File Version (dist-single/):**

- Everything inlined (HTML + CSS + JS)
- Downloadable at swimlanes.jafner.com/download/swimlanes.html
- Easy sharing (email, network drive)

### 7. Project Structure: Layer-Based

**Options Considered:**

- Feature-based (group by feature)
- Layer-based (group by type)

**Decision:** Layer-based

- Simpler for app of this size
- Clear separation: components, services, stores, types
- Easy to navigate

**Structure:**

```
src/
├── components/  # All React components
├── services/    # Business logic
├── stores/      # Zustand state
├── db/          # Database layer
├── types/       # TypeScript types
├── utils/       # Helper functions
└── hooks/       # Custom React hooks
```

### 8. Migrations: Version Tracking Only (For Now)

**Options Considered:**

- Full migration system from day 1 (overhead)
- No versioning at all (risky)

**Decision:** Version tracking table + friendly errors

- Track schema version in database
- Detect version mismatches
- Show friendly message: "Please export/re-import"
- Add full migrations later (before public release)

**Rationale:**

- Early users (coworkers) can tolerate export/re-import
- Faster iteration without migration baggage
- Add proper migrations when schema stabilizes

### 9. TypeScript: Strict Mode

**Decision:** Full strict mode enabled

- Building for coworkers (quality matters)
- Catches bugs early
- Better refactoring
- Self-documenting code

**tsconfig.json:**

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitAny": true
  }
}
```

### 10. Testing: Unit + Integration

**Options Considered:**

- No tests (too risky)
- Unit only (not enough coverage)
- Full E2E from start (too slow)

**Decision:** Unit + Integration tests, E2E later

- Test services and utilities (unit)
- Test component interactions (integration)
- Add Playwright E2E after v1.0
- Target: >80% coverage

---

## Rejected Alternatives

### Why NOT Electron?

Electron was considered as desktop app alternative to Tauri.

**Rejected because:**

- Much larger bundle size (120+ MB vs Tauri's 5-10 MB)
- Higher memory usage
- Still requires installation (same problem as Tauri)
- Web app solves the distribution problem better

### Why NOT Vue or Svelte?

Both are excellent frameworks.

**Rejected because:**

- Team already using React in another project (consistency)
- Larger ecosystem and community
- More familiar to team

**Note:** Either would work great, React chosen for familiarity.

### Why NOT Redux Toolkit?

Redux Toolkit is a solid choice for complex apps.

**Rejected because:**

- Too much boilerplate for this app's needs
- Zustand simpler and lighter
- Can always migrate to Redux later if needed

### Why NOT Cloud Database?

Options like Firebase, Supabase considered.

**Rejected because:**

- Spec explicitly requires local-only
- No server dependency
- Privacy concerns (coworkers may handle sensitive data)
- Offline-first is core requirement

---

## Future Possibilities (Post-v1.0)

These were discussed but deferred:

**Optional Backend (Future):**

- If team wants collaboration features
- Cloud sync could be added optionally
- Local-first would still be default
- Backend would be opt-in, not required

**Mobile Apps (Future):**

- Could build native apps with React Native
- Or progressive web app (PWA) for mobile browsers
- Not needed for v1.0 (desktop-first)

**Real-Time Collaboration (Future):**

- Could add if backend is added
- WebSockets or CRDTs for sync
- Not needed for initial use case

---

## Key Constraints

These requirements shaped all decisions:

1. **Local-First:** All data stays on user's computer
2. **No Installation:** Must work without admin rights
3. **Easy Sharing:** Link or HTML file, no .exe
4. **Offline:** Must work without internet
5. **Browser-Based:** Standard web technologies only

---

## Success Criteria

**Technical:**

- ✅ Test coverage >80%
- ✅ Build time <30 seconds
- ✅ Bundle size <500 KB (gzipped)
- ✅ Lighthouse score >90
- ✅ Works in Chrome, Firefox, Safari, Edge

**User Experience:**

- ✅ Page load <2 seconds
- ✅ Timeline renders 1000 items in <1 second
- ✅ No data loss (reliable auto-save)
- ✅ Works offline (PWA)
- ✅ Intuitive UI (minimal training needed)

**Deployment:**

- ✅ Automated via GitHub Actions
- ✅ Deploys in <5 minutes
- ✅ Rollback in <2 minutes
- ✅ 99.9% uptime

---

## Timeline

**Total Duration:** 5-6 weeks

**Phase 1 (Weeks 1-2):** Foundation & Architecture
**Phase 2 (Weeks 3-4):** Feature Migration & Completeness
**Phase 3 (Week 5):** Advanced Features & Polish
**Phase 4 (Week 6):** Testing & Quality
**Phase 5 (Week 6):** Deployment & Launch

---

## Resources

**Documentation:**

- `roadmap.md` - Detailed phased plan
- `architecture.md` - Technical architecture
- `deployment.md` - Deployment procedures
- `github-issues.md` - Issue templates for all tasks
- `CLAUDE.md` - Context for Claude Code

**Reference:**

- `claude_description.md` - Original Claude spec
- `chatgpt_description.md` - Original ChatGPT spec

**Legacy:**

- `../legacy/timeline-app.html` - Working prototype
- `../legacy/timeline-swimlane-app.html` - Older prototype

---

## Contact & Support

**Project Owner:** jafner
**Repository:** github.com/jafner/SwimLanes (TBD)
**Deployment:** swimlanes.jafner.com
**Documentation:** See `ref/` folder

---

## Change Log

**v1.0 (2025-01-25):**

- Initial decisions document
- All architectural decisions finalized
- Ready to begin development

---

**Document Status:** ✅ Finalized
**Next Step:** Begin Phase 1 implementation (Issue #1)
