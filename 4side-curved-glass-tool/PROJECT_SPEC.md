# PROJECT_SPEC.md

## Product

**4-Side Curved Cover Glass Design Tool** is a browser-only engineering tool for defining a stacked 4-side curved display structure and viewing derived geometry values with 2D views.

The final artifact is:

`dist/4side_curved_glass_design_tool.html`

It must run from `file://` by double-clicking the HTML file.

## Technical Requirements

- Vanilla JavaScript, HTML, CSS.
- SVG or Canvas rendering.
- No external CDN.
- No internet requirement.
- No runtime server.
- No runtime Node.js or Python.
- No WebGL or external 3D libraries.
- Must work in Windows Chrome and Edge at 100%, 125%, and 150% display scale.

## Inputs

Glass:

- `X`: overall X size, default `75`
- `Y`: overall Y size, default `160`
- `t`: cover glass thickness, default `0.5`
- `R`: bottom surface bending radius, default `10`
- `D`: bottom surface bending depth, default `1`
- `Rc`: top view glass outer corner radius, default `10`

Stack:

- `ocaThickness`: default `0.1`
- `panelThickness`: default `0.1`
- `panelSizeOffset`: arc length from glass edge inward, default `0.1`
- `panelDeadSpace`: panel surface arc length from panel edge inward, default `0.3`

## Outputs

Derived parameters:

- `theta` in degrees and radians
- `Lb`
- `Sb`
- `Rf`
- `D/R`
- `Corner Shrinkage %`
- `Panel Edge Alpha`
- `Dead Space Inner Alpha`
- `Physical Border`
- `Visible Border`

## Views

Header:

- App title
- Status
- Dimensions On/Off
- Reset View
- Export controls

Sidebar:

- Input Parameters
- Derived Parameters
- Validation messages

Main view:

- Overall Top View
- Corner Side View
- Corner Top View
- Border View

## Step 1 Scope

Implemented in the first pass:

- Project structure
- Required documentation
- Core geometry engine
- Validation functions
- Basic UI skeleton
- Basic SVG rendering placeholders using computed geometry
- Unit tests for default and edge geometry cases
- Development run check

Later steps will refine rendering, stacking, interaction, export, and standalone build quality.

