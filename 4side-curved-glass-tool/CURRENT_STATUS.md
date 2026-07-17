# CURRENT_STATUS.md

## Current Implementation

- Git-ready project baseline prepared with a roadmap from 2D geometry through validated FEM.
- Original user-supplied standalone v20 preserved in `reference/` for traceability.
- Project structure initialized.
- Core documentation initialized.
- `AGENTS.md` includes persistent work rules for startup reads, preservation of existing features, geometry-change process, completion checks, view invariants, and reporting requirements.
- Core glass bottom/top geometry implemented and covered by unit tests.
- Glass End Face metadata implemented as local normal direction at `theta`.
- Stack alpha and layer point helpers implemented and covered by contact-condition unit tests.
- Reusable Glass/OCA/Panel surface samples and reference points implemented.
- Arc-based Panel Size Offset and Panel Dead Space calculations implemented and covered by unit tests.
- Physical Border and v1 geometric Visible Border calculation implemented as u-axis projection distances.
- Visible Border solver exposes candidates, selected intersection, residuals, and method metadata for UI display.
- Input validation implemented, including finite-number checks.
- SVG rendering views implemented for Overall Top View, Corner Side View, Corner Top View, and Border View.
- Overall Top View shows full glass outline, solid flat boundary, translucent gray surface, and subtle curvature reflection.
- Corner Side View renders a v12-style 2D bending section with glass-only fill, local-normal end face, and R/theta/Lb/D dimensions.
- Corner Top View renders the enlarged upper-left corner with Rc/Rf, panel edge, arc dimensions, and solid black dead-space region.
- Border View renders Glass/OCA/Panel stack, contact surfaces, solid black panel dead space, thickness dimensions, arc dimensions, and Physical/Visible Border projection guides.
- Render dispatch isolates per-view rendering errors so one failed View does not stop the others.
- ResizeObserver re-renders SVG Views and prevents zero-size view collapse through CSS minimums.
- Independent View interaction implemented for all four Views: left-button pan, wheel zoom, pointer-centered zoom, double-click View reset, and Reset All.
- Dimensions On/Off remains connected to all Views.
- Export features implemented: parameter JSON save, parameter JSON load, derived parameter CSV save, and per-View SVG save.
- Derived panel displays the current Visible Border method id.
- Standalone build script inlines CSS and JavaScript and generates `dist/4side_curved_glass_design_tool.html`.
- Development server verified at `http://localhost:4173`.

## Incomplete Items

- Full standalone browser visual QA.
- Windows Chrome/Edge scale testing at 100%, 125%, and 150%.

## Known Errors

- `npm` is not available in the current PATH of this Codex environment. Tests were run directly with the bundled Node executable.
- Visible Border is currently the v1 geometric tangent-intersection model, not an optical refraction model.
- In-app browser automation could not inspect the open `file://` page because the browser URL policy blocked file-page access. Automated renderer DOM validation was added to the Node test suite instead.
- Browser console verification for the open `file://` tab is still blocked by the in-app browser URL policy. Interaction/export behavior is covered by Node tests and static standalone checks.

## Next Work

- Phase 1 milestone: define the canonical 3D geometry data contract and implement one straight-side bend that numerically matches the existing 2D section.
- Step 5: perform manual Windows Chrome/Edge visual QA at 100%, 125%, and 150% display scale using the standalone `file://` HTML.
- Optional: add PNG export if required; current implementation exports SVG per View.

## Last Test Result

- 2026-07-17: Repository baseline pass: bundled Node `node --test --test-isolation=none tests/*.test.mjs` passed 26/26 tests. Default process isolation was unavailable in the sandbox (`spawn EPERM`), so the same test modules ran in one process.
- 2026-07-17: `scripts/build-single-html.mjs` rebuilt `dist/4side_curved_glass_design_tool.html`; confirmed no external runtime references.

- 2026-07-15: Interaction/export/standalone pass: bundled Node `node --test tests/*.test.mjs` passed 26/26 tests, including JSON round trip, CSV export rows, independent transform math, pointer-centered zoom math, renderer DOM validation, and Geometry tests.
- 2026-07-15: Interaction/export/standalone pass: `scripts/build-single-html.mjs` rebuilt `dist/4side_curved_glass_design_tool.html`.
- 2026-07-15: Confirmed `dist/4side_curved_glass_design_tool.html` exists after interaction/export implementation.
- 2026-07-15: Confirmed no `src=`, `href=`, `<link`, `https://`, or external CDN references in dist HTML. Remaining `http://www.w3.org/2000/svg` strings are SVG namespace values only.
- 2026-07-15: Browser automation against the already-open `file://` page was blocked by in-app browser URL policy, so console verification could not be completed through that surface.
- 2026-07-15: Rendering View pass: bundled Node `node --test tests/*.test.mjs` passed 20/20 tests, including automated SVG renderer DOM validation.
- 2026-07-15: Rendering View pass: `scripts/build-single-html.mjs` rebuilt `dist/4side_curved_glass_design_tool.html`.
- 2026-07-15: Confirmed `dist/4side_curved_glass_design_tool.html` exists after rendering implementation.
- 2026-07-15: Confirmed no external CDN or external asset references after rendering implementation. Only `http://www.w3.org/2000/svg` SVG namespace strings are present.
- 2026-07-15: Geometry Engine completion pass: bundled Node `node --test tests/*.test.mjs` passed 19/19 tests.
- 2026-07-15: Geometry Engine completion pass: `scripts/build-single-html.mjs` rebuilt `dist/4side_curved_glass_design_tool.html`.
- 2026-07-15: Confirmed `dist/4side_curved_glass_design_tool.html` exists after Geometry Engine completion.
- 2026-07-15: Confirmed no external CDN or external asset references after Geometry Engine completion. Only `http://www.w3.org/2000/svg` SVG namespace strings are present.
- 2026-07-15: After `AGENTS.md` policy update, bundled Node `node --test tests/*.test.mjs` passed 13/13 tests.
- 2026-07-15: After `AGENTS.md` policy update, `scripts/build-single-html.mjs` rebuilt `dist/4side_curved_glass_design_tool.html`.
- 2026-07-15: Confirmed `dist/4side_curved_glass_design_tool.html` exists.
- 2026-07-15: Confirmed no external CDN or external asset references in dist HTML. Only `http://www.w3.org/2000/svg` SVG namespace strings are present.
- 2026-07-15: `node --test tests/*.test.mjs` passed 13/13 tests using bundled Node.
- 2026-07-15: `scripts/build-single-html.mjs` created `dist/4side_curved_glass_design_tool.html`.
- 2026-07-15: Development server returned HTTP 200 at `http://localhost:4173`.
