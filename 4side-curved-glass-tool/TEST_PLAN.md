# TEST_PLAN.md

## Numerical Validation

Default input:

- `X = 75`
- `Y = 160`
- `t = 0.5`
- `R = 10`
- `D = 1`
- `Rc = 10`
- `OCA = 0.1`
- `Panel = 0.1`
- `Panel Size Offset = 0.1`
- `Panel Dead Space = 0.3`

Expected formulas:

- `theta = acos(0.9)`
- `Lb = sqrt(19)`
- `Sb = 10 * acos(0.9)`
- `Rf = 10 - sqrt(19)`
- `D/R = 0.10`
- `Shrinkage = ((Sb - Lb) / Sb) * 100`
- `Panel Edge Alpha = theta - 0.1 / 10`
- `Dead Inner Alpha = Panel Edge Alpha - 0.3 / 10`

Edge cases:

- `D = 0`
- `D` near `2R`
- `Rc = Lb`
- `Rc < Lb` error
- `Panel Offset = 0`
- `Panel Offset = Sb`
- `Panel Offset > Sb` error
- `Dead Space = 0`
- `Dead Space` exceeding available panel arc error
- Very small thickness values

## UI Validation

- Inputs update derived values immediately.
- Invalid input does not crash the app.
- Validation messages are visible.
- Views do not collapse to zero size.
- UI remains usable at Windows scale 100%, 125%, and 150%.

## Rendering Validation

- SVG views render non-empty content.
- Overall Top View includes cover glass outline.
- Corner Side View shows bottom and top bending surfaces.
- Corner Top View includes corner geometry reference.
- Border View includes stack placeholder in Step 1 and detailed stack in later steps.

## Standalone HTML Validation

- Build creates `dist/4side_curved_glass_design_tool.html`.
- Built HTML contains CSS and JavaScript inline.
- Built HTML uses no CDN.
- Built HTML runs via `file://`.
- Network disabled execution works.

