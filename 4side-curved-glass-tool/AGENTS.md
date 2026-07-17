# AGENTS.md

## Project Rules

This project builds the **4-Side Curved Cover Glass Design Tool** as a maintainable multi-file web app that is bundled into one standalone HTML file.

Before starting any new task, read:

- `AGENTS.md`
- `PROJECT_SPEC.md`
- `GEOMETRY_SPEC.md`
- `CURRENT_STATUS.md`
- `CHANGELOG.md`

At the end of every task, update:

- `CURRENT_STATUS.md`
- `CHANGELOG.md`

Do not remove existing functionality without explicit user approval.

## Persistent Work Rules

1. Before starting every task, read `PROJECT_SPEC.md`, `GEOMETRY_SPEC.md`, `CURRENT_STATUS.md`, and `CHANGELOG.md`.
2. Do not fully rewrite a file without first checking the previous implementation.
3. Do not delete features that the user did not explicitly ask to remove.
4. When changing any geometry formula:
   - Update `GEOMETRY_SPEC.md`.
   - Update related tests.
   - Update `CHANGELOG.md`.
   - Compare the new result with the previous result and record the meaningful difference.
5. At task completion:
   - Run tests.
   - Run the standalone HTML build.
   - Confirm that `dist/4side_curved_glass_design_tool.html` exists.
   - Confirm that the standalone HTML has no external CDN references.
   - Update `CURRENT_STATUS.md`.
   - Update `CHANGELOG.md`.
6. Every completion report must include:
   - Changed files.
   - Main changes.
   - Whether geometry formulas changed.
   - Test result.
   - `dist` HTML path.
   - Known issues.
7. When modifying one View, verify that the other Views are not broken.
8. Each View's Pan/Zoom state must remain independent from all other Views.
9. All core bending dimensions `R`, `D`, `theta`, `Lb`, and `Sb` are based on the Glass Bottom Surface.
10. `Panel Size Offset` and `Panel Dead Space` are arc lengths.
11. `Physical Border` and `Visible Border` are not arc lengths; they are straight projected distances in the Top View / `u` axis direction.
12. `Corner Side View` is not a real external 3D view. It is a v12-style 2D Bending Section view.
13. The Glass End Face is not aligned to the global `z` direction. It follows the local normal direction and is perpendicular to the Glass top and bottom surfaces.
14. Always preserve the stack contact conditions: `OCA Top = Glass Bottom` and `Panel Top = OCA Bottom`.
15. The Panel Dead Space region must be shown as a full solid black area, not only as boundary lines.
16. The final deployment file must be one standalone HTML file.
17. If the user says "fix it" or "modify it", do not only explain; actually edit the files and run tests.
18. For large tasks, record detailed sub-steps in `CURRENT_STATUS.md` and complete them one step at a time.
19. If implementation is uncertain, do not invent arbitrary results. Record the uncertainty as an Open Issue.
20. At the end of every task, update the documents so the next worker can continue immediately.

## File Structure

Source files live under `src/`.

- `src/js/geometry/`: pure geometry and numerical calculation functions.
- `src/js/render/`: SVG rendering and view transform logic.
- `src/js/ui/`: DOM binding and user interaction.
- `src/js/export/`: JSON, CSV, image, and SVG export.
- `src/css/style.css`: application styles.
- `scripts/build-single-html.mjs`: build script for standalone HTML.
- `tests/`: Node-based unit tests for geometry and validation.

Final deliverable:

- `dist/4side_curved_glass_design_tool.html`

## Commands

Install dependencies:

No runtime dependencies are required. Node.js is used only for development scripts and tests.

Run development version:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

Build standalone HTML:

```bash
npm run build
```

The final HTML must run by double-clicking the file without Node.js, Python, server, CDN, or internet access.

## Geometry Basis

All units are millimeters.

Core bending dimensions are based on the Glass Bottom Surface.

Coordinate system for 2D bending section:

- `u`: from flat region toward glass outer edge.
- `z`: positive upward from the Glass Bottom Surface start point.
- `B0 = (u: 0, z: 0)`
- `Be = (u: Lb, z: -D)`

Core formulas:

- `theta = acos(1 - D / R)`
- `Lb = R * sin(theta) = sqrt(2 * R * D - D^2)`
- `Sb = R * theta`
- `Rf = Rc - Lb`
- `D_R = D / R`
- `Shrinkage = ((Sb - Lb) / Sb) * 100`

## Coding Rules

- Geometry functions must be pure where practical.
- Geometry functions must not access the DOM.
- Renderers must not recalculate geometry from raw input; pass computed geometry into renderers.
- Use English function and variable names.
- UI text may be bilingual in English and Korean.
- Use SVG or Canvas only. No WebGL and no external 3D libraries.
- Keep styles in CSS and avoid magic numbers in calculation code.
- Do not hide invalid geometry. Return explicit validation errors or `N/A` with reason.
