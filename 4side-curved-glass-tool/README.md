# 4-Side Curved Cover Glass Design Tool

Browser-only design tool for a 4-side curved cover glass, OCA, and panel stack.

The current release is a tested 2D geometry baseline. The planned path to parametric 3D rendering and a validated FEM workflow is documented in [ROADMAP.md](ROADMAP.md). The original standalone v20 supplied as the project reference is preserved under `reference/`.

## Development Run

```bash
npm run dev
```

Then open the printed local URL in Chrome or Edge.

The source app can also be opened directly from `index.html` in modern browsers, but development server usage is easier while editing modules.

If `npm` is not available but Node.js is available:

```bash
node scripts/dev-server.mjs
```

## Test

```bash
npm test
```

Without `npm`:

```bash
node --test tests/*.test.mjs
```

## Build

```bash
npm run build
```

Without `npm`:

```bash
node scripts/build-single-html.mjs
```

Output:

```text
dist/4side_curved_glass_design_tool.html
```

## Final HTML Run

Double-click:

```text
dist/4side_curved_glass_design_tool.html
```

No server, Node.js, Python, CDN, or internet connection is required for the final HTML.

## Mouse Controls

- Left drag: pan each view independently.
- Mouse wheel: zoom around pointer.
- Double click: reset selected view.
- Reset All: reset all views.

## Versioning

- `main` contains stable integrated work.
- Feature work uses short-lived `codex/<topic>` branches and pull requests.
- User-visible releases are tagged as `vMAJOR.MINOR.PATCH` and recorded in `CHANGELOG.md`.
- Geometry or solver changes require regression tests and documented assumptions.

## Parameter Definitions

All dimensions are in millimeters.

- `X`: overall glass X size.
- `Y`: overall glass Y size.
- `t`: cover glass thickness.
- `R`: glass bottom surface bending radius.
- `D`: glass bottom surface bending depth.
- `Rc`: top view outer corner radius.
- `OCA Thickness`: OCA layer thickness.
- `Panel Thickness`: panel layer thickness.
- `Panel Size Offset`: arc length from glass bending end inward to OCA/panel edge.
- `Panel Dead Space`: panel arc length from panel edge inward to dead-space inner boundary.
