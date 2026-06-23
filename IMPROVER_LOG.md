# IMPROVER LOG -- josh-hub

## Improvement Run -- 2026-03-04 04:00 CST (Afterburner)

### Run Profile
- Cleanup: 1 | Structural: 1 | Feature: 0
- Codebase state: clean (521-line JS, 909-line CSS, well-organized)
- Next run should focus on: accessibility across all pages, config-inspector.html size reduction

### Changes Made

1. **Consolidate tagClass/trendClass and data-drive detectProject** (js/shared.js) [STRUCTURAL]
   - What: Merged duplicate EVENT_TYPE_CLASS map, converted 15-line if-chain in detectProject to data-driven PROJECT_RULES array
   - Why: tagClass and trendClass had near-identical maps; detectProject was a fragile if-chain that required code changes to add new projects. Now both are data-driven and extensible.

2. **Add semantic nav and ARIA to topbar** (index.html) [CLEANUP]
   - What: Changed topbar from div to nav element, added role="navigation", aria-label, and aria-current="page" on active tab
   - Why: Screen readers now properly announce the navigation region and current page

### Skipped / Deferred
- config-inspector.html (3963 lines) -- self-contained tool, needs dedicated refactor session
- Accessibility improvements on other pages (skills, achievements, activity, projects, integrations)
- Data externalization (CC_STATE hardcoded in shared.js)

### Project Health Snapshot
- Largest file: config-inspector.html (3963 lines)
- Files over 400 lines: config-inspector.html (3963), shared.css (909), index.html (764), shared.js (530)
- Test status: no tests (static site)
- Build status: no build (GitHub Pages)

---

## Improvement Run -- 2026-05-19 04:08 CST (Afterburner)

### Run Profile
- Cleanup: 3 | Structural: 0 | Feature: 0
- Codebase state: stable, but several files have grown since last run (projects.html 764→1062, shared.js 530→649)
- Gap: 10 weeks since last run — josh-hub was lower priority during the vibemke + ctax-builder push
- Next run should focus on: data externalization (CC_STATE → data/state.js), projects.html split, prefers-reduced-motion guards

### Changes Made

1. **Semantic nav + ARIA on skills.html** (skills.html) [CLEANUP]
   - What: Changed `<div class="topbar">` to `<nav class="topbar" role="navigation" aria-label="Main navigation">`, added `aria-current="page"` on the active Skills tab.
   - Why: Mirrors the deferred work from the 2026-03-04 run that already shipped on index.html. Screen readers now announce the navigation region and the current page.

2. **Semantic nav + ARIA on achievements.html** (achievements.html) [CLEANUP]
   - What: Same `<div>` → `<nav>` swap with role + aria-label + `aria-current="page"` on the active Achievements tab.
   - Why: Same rationale. Three sister pages now match the index.html pattern; two pages (projects.html, integrations.html) remain on the legacy div pattern and are flagged for the next run.

3. **Semantic nav + ARIA on activity.html** (activity.html) [CLEANUP]
   - What: Same swap on the Activity page. Active tab now carries `aria-current="page"`.
   - Why: Same rationale; completes the most-trafficked tabs.

### Skipped / Deferred
- projects.html and integrations.html — same nav+aria pattern applies; deferred this run because the per-improvement file cap is 3 (tightly coupled exception covers a single triplet of similar edits).
- config-inspector.html (3963 lines) — STILL deferred. Needs a dedicated refactor session, not a nightly afterburner pass.
- projects.html growth (764 → 1062 lines) — flagged as a candidate for template/data split.
- shared.js growth (530 → 649 lines) — CC_STATE externalization is the obvious next move.
- prefers-reduced-motion guard on the lock screen + fl-reveal animations — never added; would help users with vestibular sensitivities.

### Project Health Snapshot
- Largest file: config-inspector.html (3967 lines, +4 since 2026-03-04)
- Files over 400 lines: config-inspector.html (3967), projects.html (1062), shared.css (909), index.html (776), shared.js (649), activity.html (401)
- Files that grew >100 lines since 2026-03-04: projects.html (+298), shared.js (+119)
- Test status: no tests (static site)
- Build status: no build (GitHub Pages)
- Last commit: 2026-03-04 (10 weeks ago) — improvements have not been merged via git in that window

### Sandbox commit blocker (READ — same as 2026-05-18)
- This run could NOT execute `git add` or `git commit` due to the Cowork sandbox bind-mount limitation (cannot delete `.git/index.lock` files). All file edits above are present in the working tree of `/Users/joshhohenstein/projects/josh-hub/` and ready to commit manually.
- Suggested commit: `feat(a11y): semantic nav + aria-current on skills/achievements/activity` (or split into 3 commits if preferred).
- Also new file: `improver-state.json` initialized this run — tracks velocity and deferred work for future runs.
