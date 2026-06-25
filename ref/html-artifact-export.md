# SwimLanes HTML Timeline Artifact — Export Plan

**Status:** Proposed (planning only — no implementation yet)
**Owner:** @mr-jafner
**Last Updated:** 2026-06-25
**Related:** `ref/roadmap.md` (Stage 3 / Export), `src/services/timeline.service.ts`

---

## Summary

Introduce a **standalone, self-contained HTML timeline artifact** as a first-class
output of SwimLanes — conceptually equivalent to Plotly's `fig.write_html()`, but
purpose-built for swim-lane timelines and **hand-rolled in SVG**.

The artifact is a single `.html` file with the dataset **inlined as JSON** plus a
small embedded renderer. It opens in any browser, offline, with no app, no server,
and no `sql.js`/React runtime. It is the thing a user hands to a stakeholder who
will never open the SwimLanes app.

This **does not invalidate prior scope.** It re-frames the relationship between the
two halves of the product (see Positioning below).

---

## Positioning: author-first, artifact-as-hero-output

SwimLanes has two halves that are easy to mistake as competing:

- **Authoring + branching + scenario comparison** = the *value-creation layer* (the
  moat). This is the differentiated work and the reason any output is worth making.
- **The static HTML report** = the *distribution layer* (the hero output). It is how
  the work travels to people who never open the app.

These are not in conflict. The analogy is Jupyter (notebook authoring → exported
HTML) or Figma (editor → shared prototype link): the editor is the moat, the export
is how value reaches stakeholders, and export being first-class is what makes the
authoring worth doing.

**Decision:** Position the app as a focused **scenario-authoring tool** and treat the
**multi-scenario HTML report as the flagship output.** The app should not get
*thinner*; it should get *better at scenarios specifically* (fast branch creation,
side-by-side diff, what-if). The report is the proof that the scenario work paid off.

### Why this artifact is differentiated (not just another Gantt export)

The branching feature is what makes the artifact unique. A static HTML file that lets
a stakeholder **toggle between baked-in scenarios offline** — "here's the plan; flip
to the aggressive vs. conservative timeline" — is something Plotly export, MS Project,
or a screenshot fundamentally cannot do. Branching is the report's killer feature, not
a competitor to it.

**Implication:** multi-scenario-in-one-file is an explicit design goal **from day one**,
even though v1 ships single-branch. It shapes the embedded HTML/JSON structure
(embed data for N branches; JS toggles between them). With hand-rolled SVG this is
cheap — we own all the geometry, so we emit one SVG per branch and show/hide.

---

## Renderer decision: hand-rolled SVG

Chosen over Plotly and vis-timeline.

| Option | Verdict |
| --- | --- |
| **Hand-rolled SVG** ✅ | Smallest file, zero runtime deps, full control of the swim-lane / milestone-diamond / release-bar visual language we already defined. Reuses `timeline.service.ts` view model. Multi-scenario toggle is trivial. Most build effort — accepted. |
| vis-timeline | Good domain fit, native grouping, but adds a dependency and cedes control of the visual language. |
| Plotly `write_html` | Fastest to prototype but heavy (~3 MB) and Gantt is a hack on top of bar charts; swim lanes / diamonds get awkward. |

The exporter is a **consumer of `timeline.service.ts`'s view model**, so the layout
math serves both the in-app canvas and the artifact. This is leverage, not duplication.

---

## Resolved design decisions

1. **Read-only artifact (v1).** The exported HTML is a clean, trustworthy snapshot.
   No "edit in the HTML and re-import" loop in v1 — it muddies what the artifact *is*
   and would bloat the embedded JS. Revisit only if there's clear demand.
2. **Data-baked = data-exposed.** The file contains the full selected dataset inline.
   This fits the local-first model, but "share the file" = "share all baked data."
   Mitigation: the exporter takes an explicit **branch / filter selection** so the user
   only bakes what they mean to share.
3. **Moat stays in authoring.** Long-term investment goes into scenario tooling, not
   into making the app a general PM tool.

---

## Roadmap (v1 → v3)

### v1 — Single-branch SVG report
- New `src/services/export.service.ts`.
- Input: a branch id + optional type/project filters (reuse existing filter logic).
- Build the view model via `timeline.service.ts`.
- Emit a single self-contained `.html`: inlined JSON dataset + embedded SVG renderer
  + minimal CSS, generated string-side (no React in the output).
- Renders swim lanes, task/release/meeting bars, milestone diamonds, time axis —
  matching the app's visual encoding (task=blue, milestone=green, release=orange,
  meeting=purple).
- Trigger from the UI ("Export timeline → HTML") producing a browser download.
- **Structure the embedded payload for N branches now**, even though only one is
  populated, so v2 is additive.

### v2 — Multi-scenario toggle baked in
- Bake multiple branches into one file; embed a lightweight branch/scenario switcher
  (vanilla JS show/hide of pre-rendered SVG layers, or re-layout from inlined JSON).
- Optional: inline a read-only branch **diff/comparison** view (added/removed/changed),
  reusing the comparison logic described in CLAUDE.md.

### v3 — Polish
- Dependency arrows, theming (light/dark), print/PDF-friendly layout, legend, title
  block / metadata (generated date, source branch, filters applied).

---

## Sequencing notes

- **Do not abandon the in-flight canvas/import work.** The exporter consumes the same
  view model, so that calc layer serves both renderers.
- **Reprioritize `export.service.ts` to land right after a *minimal usable authoring
  loop*** (import → see a timeline → switch branch) — not after the canvas is fully
  polished. The artifact is the deliverable, so it should arrive early, but it needs
  *something worth exporting* first.

---

## Proposed GitHub issues

> To be created on the board (component:export, component:timeline).

- **[v1] `export.service.ts`: single-branch self-contained HTML exporter**
  Reuse `timeline.service.ts` view model; emit inlined JSON + embedded SVG renderer;
  read-only; payload structured for N branches. Acceptance: open exported file offline,
  see the timeline matching in-app rendering for a chosen branch + filters.
- **[v1] Export UI entry point**
  "Export timeline → HTML" action with branch + filter selection and browser download.
- **[v2] Multi-scenario toggle in exported artifact**
  Bake N branches; embedded switcher; optional read-only branch diff view.
- **[v3] Artifact polish**
  Dependency arrows, theming, print/PDF layout, legend, metadata/title block.

---

## Open questions for later

- Should `build:single` (full-app-in-one-file) and the data-baked artifact coexist as
  two distinct outputs, or does the artifact eventually supersede `build:single`?
- Do we want a headless/CLI path (CSV in → artifact HTML out) for automation, or keep
  generation strictly inside the app?
