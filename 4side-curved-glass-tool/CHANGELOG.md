# CHANGELOG.md

## Unreleased

- Preserved the user-supplied standalone v20 HTML as a reference artifact.
- Added a staged engineering roadmap for canonical 3D geometry, analysis-model inputs, meshing, linear FEM validation, nonlinear stack physics, and result workflows.
- Documented Git branch, release-tag, and regression-test conventions.
- Added a project `.gitignore`.

## 0.1.0 - 2026-07-15

- Initialized project documentation and structure.
- Updated `AGENTS.md` with persistent task rules, geometry-change rules, completion checks, view invariants, and required completion report contents.
- Added core geometry, stack geometry, border geometry, and validation modules.
- Completed Geometry Engine API with Glass End Face metadata, stack surface samples, reference points, arc offset metadata, and Visible Border method metadata.
- Split Visible Border candidate finding and selection into testable functions.
- Expanded unit tests for layer contact conditions, local normal end face, arc-based offsets, border projection basis, visible-border metadata, and non-finite input validation.
- Implemented detailed SVG rendering for Overall Top View, Corner Side View, Corner Top View, and Border View.
- Added subtle SVG gradients/reflection styling, solid flat boundaries, local-normal end face rendering, corner arc dimensions, stack layer fills, black dead-space regions, and Physical/Visible Border projection guides.
- Added per-view render error isolation and ResizeObserver-based re-rendering.
- Added automated SVG renderer DOM validation tests.
- Implemented independent per-View Pan/Zoom state, pointer-centered wheel zoom, left-button drag pan, double-click View reset, and Reset All.
- Implemented Dimensions On/Off preservation across transformed Views.
- Implemented parameter JSON save/load, derived parameter CSV save, and per-View SVG save for standalone `file://` use.
- Added interaction transform tests and export round-trip/CSV tests.
- Rebuilt standalone HTML with all CSS and JavaScript inline and no external file references.
- Added Node-based unit tests for core geometry, border behavior, and validation cases.
- Added basic HTML/CSS/SVG application skeleton.
- Added development server script.
- Added local standalone HTML build script.
- Generated `dist/4side_curved_glass_design_tool.html`.
