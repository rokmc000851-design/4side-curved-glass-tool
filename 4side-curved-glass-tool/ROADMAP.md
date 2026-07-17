# Development Roadmap

This roadmap evolves the current 2D geometry tool into a trustworthy 3D and structural-analysis application without mixing visualization code with engineering calculations.

## Engineering Principles

- Keep geometry, visualization, meshing, material models, solvers, and result interpretation as separate modules.
- Preserve millimetres as the UI unit, but convert to one documented solver unit system at the analysis boundary.
- Attach a model-version id and input snapshot to every exported result.
- Treat browser FEM results as engineering estimates until benchmarked against analytical cases and a trusted commercial or open-source solver.
- Never label a contour as stress or strain without naming the tensor component or invariant, layer, surface, coordinate system, and units.

## Phase 0 — Versioned 2D Baseline (current)

Deliverables:

- Maintainable multi-file source and offline standalone build.
- Pure, tested 2D glass/OCA/panel geometry.
- Preserved original v20 HTML in `reference/`.
- Git history with tagged releases and a changelog.

Exit criteria:

- All unit tests pass.
- Standalone build contains no external runtime dependency.
- Default parameter results are recorded as regression fixtures.

## Phase 1 — Parametric 3D Rendering

Deliverables:

- A single canonical 3D surface/solid geometry model shared by rendering and meshing.
- Orbit, pan, zoom, orthographic/perspective camera, clipping planes, layer visibility, and section view.
- Glass, OCA, and panel represented as separate named bodies with contact interfaces.
- Geometry export such as STL/OBJ for visual interchange; STEP requires a separate CAD-capable path.

Implementation decision:

- Use a locally bundled WebGL library for development and inline/bundle it for offline delivery, or revise the standalone-only constraint explicitly.
- Do not generate 3D geometry independently inside the renderer.

Exit criteria:

- Cross-sections from the 3D model match the existing 2D geometry within a documented tolerance.
- Seams at the four bent sides and corners are watertight or explicitly represented as shell boundaries.

## Phase 2 — Analysis Model Definition

Deliverables:

- Material cards for glass, OCA, and panel: elastic modulus, Poisson ratio, density, thickness, and optional temperature coefficients.
- Explicit assumptions for glass (linear elastic/brittle), OCA (initially linear elastic, later viscoelastic/hyperelastic), and panel (initially equivalent orthotropic shell or layered laminate).
- Load cases, boundary conditions, contact/tie definitions, manufacturing/pre-bend reference state, and solver unit display.
- Analysis input JSON schema with version migration.

Exit criteria:

- Every solve is reproducible from one exported input file.
- UI blocks dimensionally invalid or under-constrained models.

## Phase 3 — Mesh and Linear FEM MVP

Recommended first scope:

- Small-strain, linear-static shell/solid model for a reduced strip or one symmetric corner—not the full four-sided assembly.
- Web Worker execution so the UI remains responsive.
- Sparse matrix assembly and a proven sparse linear solver compiled to WebAssembly where practical.
- Mesh-quality metrics, convergence controls, progress/cancel, and force/reaction balance checks.

Results:

- Displacement magnitude and components.
- Principal stress/strain and von Mises stress where meaningful.
- Glass tensile surface stress reported separately from compressive stress.
- Layer-by-layer results with coordinate system and units.

Exit criteria:

- Patch test passes.
- Cantilever/plate analytical benchmarks meet documented error limits.
- Mesh-refinement study demonstrates convergence.
- Reaction forces balance applied loads within tolerance.

## Phase 4 — Curved Stack and Manufacturing Physics

Deliverables:

- Geometric nonlinearity for large bending/rotation.
- Layer contacts or tied interfaces and realistic OCA behavior.
- Residual strain/stress from forming or lamination, including the chosen stress-free reference configuration.
- Orthotropic or layered panel model and temperature load cases.

Exit criteria:

- Correlation against a trusted solver using identical geometry, mesh, materials, contacts, and boundary conditions.
- Correlation report stores model versions, tolerances, and known deviations.

## Phase 5 — Engineering Workflow

Deliverables:

- Saved projects and named load cases.
- Result comparison, plots, probes, section paths, CSV/VTK export, and report generation.
- GitHub Issues/Projects for requirements, validation cases, bugs, and releases.
- CI for tests, standalone builds, and benchmark regression.

## Immediate Next Milestone

Build Phase 1 as a small vertical slice:

1. Define a canonical 3D geometry data contract.
2. Generate one straight side bend and verify it against the 2D section.
3. Add a 3D viewer with layer toggles and clipping.
4. Extend to four sides and corner transitions.
5. Add geometry regression tests before starting FEM.

