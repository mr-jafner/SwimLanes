awesome—local-only is a great constraint. here’s a crisp spec + user workflow you can ship as a desktop-style “web app” (Electron/Tauri or just a localhost server with a browser UI). it’s built around three stages exactly as you framed them: **Import/Map → Update or Append → View**. i’ll also define the data model, diffs/branches, and the endpoints your UI will call.

# scope & principles

* **Local by default**: no network access; all files (DB, imports, exports) live under a user-chosen workspace folder.
* **Deterministic & reversible**: every change is captured in SQLite history tables (versioning) and can be undone.
* **Explorable**: diffs, time travel, and branch comparisons are first-class.

# workspace layout (on disk)

```
<workspace>/
  db/
    timeline.sqlite              # main DB
    backups/                     # auto backups via VACUUM INTO
  imports/
    <timestamp>-source.csv|json  # raw files
    profiles/                    # saved mapping profiles (json)
  exports/
    png/ html/
  logs/
```

# core data model (SQLite)

* `item` — unified for tasks/milestones/releases/meetings

  ```
  item(id TEXT, type TEXT, title TEXT,
       start_date TEXT, end_date TEXT,   -- ISO 'YYYY-MM-DD'; end NULL for milestone
       owner TEXT, lane TEXT, project TEXT,
       tags TEXT,                         -- comma-separated or json array
       branch_id TEXT DEFAULT 'main',
       updated_at TEXT DEFAULT (datetime('now')),
       PRIMARY KEY (id, branch_id))
  ```
* `item_history` — snapshot per change (insert/update/delete), with triggers

  ```
  item_history(id, branch_id, version, op, snapshot_at,
               type, title, start_date, end_date, owner, lane, project, tags,
               PRIMARY KEY(id, branch_id, version))
  INDEXES: (id,branch_id,version), (branch_id,snapshot_at)
  ```
* **Views** (already discussed):

  * `task_version_diffs` (rename to `item_version_diffs`) for consecutive version diffs.
  * `task_snapshot_asof` (rename to `item_snapshot_asof`) for time-travel snapshots.
* optional helper tables:

  * `branches(branch_id TEXT PRIMARY KEY, label TEXT, created_from TEXT, note TEXT)`
  * `import_profiles(name TEXT PRIMARY KEY, json TEXT)`
  * `app_params(key TEXT PRIMARY KEY, value TEXT)` (already used for as-of timestamp)

> you already have the triggers; just extend columns to match `item`.

---

# stage 1 — import/map (first-run or new source)

## user workflow

1. **Choose file**: CSV or JSON. Show sample preview (first ~50 rows).
2. **Map columns**:

   * Required: `title`, `type`, and *either* `date` (milestone) or `start_date`/`end_date` (task).
   * Optional: `owner`, `lane`, `project`, `tags`.
   * **ID strategy**:

     * *Generate new* (UUID) — default for first import.
     * *Use column* (e.g., “External ID”).
     * *Match keys* (e.g., `project + title`); if a later import matches, it updates same logical row.
3. **Tag handling**: choose delimiter (`,` or `;`) or JSON array.
4. **Branch target**: select branch to import into (`main` default) or **create new branch** (e.g., “what-if-shift-Q4”).
5. **Dry-run**: app computes and shows a report before writing:

   * counts: `added`, `updated`, `skipped`, `conflicts`
   * 10 sample rows for each category, with “why”
6. **Save as profile**: store mapping under a name for one-click reuse.

## API (local)

* `POST /import/dry-run`

  * body: `{ filePath, fileType, mapping, branchId, idStrategy }`
  * returns: `{ added[], updated[], skipped[], conflicts[], summary }`
* `POST /import/commit`

  * body mirrors dry-run; returns `{ opId, summary }`

## conflict rules (deterministic)

* a row *matches* if its **computed match key** equals an existing item in `branchId`.
* conflicts surfaced when a row maps to multiple candidates; user resolves via a small review table (pick one / create new). app remembers as `merge_rules`.

## provenance (store on `item`)

* add `source_id TEXT`, `source_row_hash TEXT` so you can explain where a row came from. show it in tooltips and exports.

---

# stage 2 — update or append (re-import)

same UI, but defaults to the last used **import profile**. two modes:

* **Update matches only**: ignore rows that don’t match.
* **Append or update** (upsert): create new rows when no match, update when match found.

### versioning semantics

* every insert/update/delete fires triggers → `item_history` gets a full snapshot with `version++`.
* **branch_id** is part of the primary key, so re-importing into a *simulation branch* produces a clean, isolated history.

### backup safety

* before `commit`, run `VACUUM INTO 'db/backups/<ts>-pre-import.sqlite'`.

---

# stage 3 — view (timeline + diffs)

## primary views

1. **Timeline (current branch)**

   * Swim lanes by chosen field (lane/project/owner/type).
   * Gantt bars for durations; points for milestones.
   * Filters: type, owner, tag, project.
   * Zoom: Day/Week/Month/Quarter/Year (snap labels to density).
2. **Branch Compare Overlay** (A vs B)

   * Base = branch A. Overlay B uses visual encoding:

     * unchanged: normal
     * **added in B**: green outline/glow
     * **removed in B**: red hatch (ghost on A’s lanes)
     * **changed**: yellow outline; small arrows at left/right ends if dates moved
   * Sidebar lists counts and lets you click to focus.
3. **History Panel (row drill-down)**

   * For selected item: table of `v_old → v_new` with per-field chips (title/dates/owner/tags).
   * Actions: “revert to version v”, “copy date(s) from v”.

## snapshot & bookmarks

* “Save snapshot” = store a named timestamp (`bookmarks` table or reuse `app_params`) and later query `item_snapshot_asof`.
* Compare any two snapshots in the same branch using the **set diff query** against snapshot result sets.

## API (local)

* `GET /branches` → list branches
* `POST /branches` `{ from: 'main', to: 'simA', note }`
* `GET /items?branch=A&filters=...` → timeline dataset
* `GET /diff?a=A&b=B` → added/removed/changed (your union-all query)
* `GET /history/:id?branch=A` → per-row history
* `POST /revert` `{ id, branch, version }` → updates `item` from `item_history`
* `POST /snapshot/save` `{ name, ts }`
* `GET /snapshot/:name?branch=A`
* `GET /export/png` & `GET /export/html` (use current filters + branch, include footer with branch/snapshot/ts)

---

# “what-if” simulations (branches)

* **Create branch** from `main` (copy rows into `simX`): this is fast and local.
* Apply bulk ops (e.g., “shift all tasks in project Alpha by +5 business days”). Record one import-like operation entry in a simple `ops_log`.
* Use **Branch Compare Overlay** to review changes.
* Optional: **merge** back to `main` later (defer until you need it). If you add merge, use:

  * per-column last-write-wins,
  * flag conflicts (both branches changed the same column since a common snapshot) → resolve via UI.

---

# edge cases & correctness

* **partial dates**: store (`date_precision`: `year|month|day`) and normalize; render with appropriate bar length/opacity.
* **time zones**: store UTC midnight, render in local TZ. if precision < day, ignore TZ offset visually.
* **business days** (optional): add a toggle; compute `duration_bd` for display only.
* **validate**: `CHECK(end_date IS NULL OR end_date >= start_date)`; `CHECK(type IN ('task','milestone','release','meeting'))`.
* **large sets**: virtualize lanes, and cache layout per zoom level; indexes on `(branch_id,type)`, `(lane,start_date)`, `(start_date,end_date)`.

---

# undo/redo

* simplest: **stack of SQL operations** (inverse statements) inside the app.
* advanced (optional): SQLite **session/changeset** extension to generate compact patches; perfect for “Apply/Undo bulk shift”.

---

# exports

* **PNG**: current view bounds, @2x option for slides.
* **HTML**: embed data and a tiny viewer (collapsible lanes, legend).
* **Footer meta**: `branch`, `filters`, `snapshot name/ts`, `data_version` (max `version` seen).

---

# test strategy

* **golden imports**: tiny CSVs/JSON with known outcomes; assert counts (added/updated/skipped).
* **diff goldens**: store expected A vs B diff tables; compare.
* **render baselines**: save PNGs for a few scenarios; pixel-diff with tolerance.
* **property tests**: “shift +N days ⇒ only date fields change; counts unchanged.”

---

# implementation checklist (short)

* [ ] Migrate to `item` + `item_history` schema; keep triggers.
* [ ] Build `item_version_diffs` & `item_snapshot_asof` views.
* [ ] Implement `/import/dry-run` and `/import/commit` with backup.
* [ ] Implement `/diff`, `/history/:id`, `/branches` CRUD.
* [ ] Timeline UI with overlay mode + history panel.
* [ ] Snapshots/bookmarks; export PNG/HTML with footer meta.
* [ ] Tests + golden datasets.

---

if you want, i can take your current CSV/JSON columns and produce a **ready-to-paste mapping profile** plus the exact **CREATE VIEW** statements for `item_*` to match your schema names—so your first import hits the ground running.
