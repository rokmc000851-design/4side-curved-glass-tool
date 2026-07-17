# GEOMETRY_SPEC.md

## Units and Coordinate System

All geometry uses millimeters.

2D bending section:

- `u`: flat region toward glass outer edge.
- `z`: glass upward direction is positive.
- Glass Bottom Surface bending start: `B0 = (0, 0)`.
- Glass Bottom Surface outer end: `Be = (Lb, -D)`.

## Core Derived Geometry

Given `R > 0` and `0 <= D <= 2R`:

```text
theta = acos(1 - D / R)
Lb = R * sin(theta)
Lb = sqrt(2 * R * D - D^2)
Sb = R * theta
Rf = Rc - Lb
D_R = D / R
Corner Shrinkage = ((Sb - Lb) / Sb) * 100
```

If `D = 0`, then `theta = 0`, `Lb = 0`, `Sb = 0`, and shrinkage is defined as `0` for UI stability.

## Glass Bottom Surface

For `0 <= alpha <= theta`:

```text
u(alpha) = R * sin(alpha)
z(alpha) = -R * (1 - cos(alpha))
```

## Tangent and Normal

Bottom surface unit tangent:

```text
T(alpha) = (cos(alpha), -sin(alpha))
```

Glass upward unit normal:

```text
N(alpha) = (sin(alpha), cos(alpha))
```

## Glass Top Surface

```text
G_top(alpha) = G_bottom(alpha) + t * N(alpha)
```

The glass end face connects `G_bottom(theta)` and `G_top(theta)`, parallel to `N(theta)`.

## Corner Surface

Corner Bottom Surface:

```text
r = Rf + R * sin(alpha)
x = xc + r * cos(phi)
y = yc + r * sin(phi)
z = -R * (1 - cos(alpha))
```

For `0 <= alpha <= theta` and `0 <= phi <= pi/2`.

The section remains undeformed while sweeping around the corner.

## OCA and Panel Stack

OCA:

```text
OCA Top(alpha) = Glass Bottom(alpha)
OCA Bottom(alpha) = OCA Top(alpha) - t_oca * N(alpha)
```

Panel:

```text
Panel Top(alpha) = OCA Bottom(alpha)
Panel Bottom(alpha) = Panel Top(alpha) - t_panel * N(alpha)
```

## Panel Size Offset

Panel Size Offset is an arc length, not a straight distance:

```text
alpha_panel_edge = theta - panelSizeOffset / R
```

Constraint:

```text
0 <= alpha_panel_edge <= theta
panelSizeOffset <= Sb
```

In v1, panel size offset cannot extend into the flat region.

## Panel Dead Space

Panel Dead Space is also an arc length:

```text
alpha_dead_inner = alpha_panel_edge - panelDeadSpace / R
```

Constraint:

```text
0 <= alpha_dead_inner <= alpha_panel_edge
```

Dead space region:

```text
alpha_dead_inner <= alpha <= alpha_panel_edge
```

## Physical Border

Physical Border is a top-view or `u` axis projection distance.

Left reference:

```text
P_phys_left = Panel Bottom(alpha_dead_inner)
```

Right reference:

```text
P_phys_right = Glass Top(theta)
```

Value:

```text
PhysicalBorder = abs(P_phys_right.u - P_phys_left.u)
```

This is not Euclidean distance and not arc length.

## Visible Border

Initial v1 definition:

- Optical outer surface: Glass Top Surface.
- Start point: `Q = Panel Bottom(alpha_dead_inner)`.
- Compute the line through `Q` in tangent direction `T(alpha_dead_inner)`.
- Numerically find intersection with Glass Top Surface.
- If multiple intersections exist, select the valid intersection with largest `u` that is not beyond `theta`.
- Right reference point: `GlassTop(theta)`.

```text
VisibleBorder = abs(GlassTop(theta).u - V.u)
```

If the intersection is unstable or absent, the result must be `N/A` with a reason.

### Visible Border v1 Implementation Metadata

The geometry engine returns Visible Border metadata so the UI can display the current assumption:

```text
id = glass-top-tangent-intersection-v1
opticalSurface = Glass Top Surface
rayStart = Panel Bottom at alpha_dead_inner
rayDirection = T(alpha_dead_inner), perpendicular to N(alpha_dead_inner)
selectionRule = select the intersection with largest u among all candidates in [0, theta]
distanceDefinition = abs(GlassTop(theta).u - V.u)
```

The numerical solver samples the alpha domain, refines sign-change intervals with bisection, records all candidate intersections, and exposes the selected candidate and residual. If no stable candidate exists, the value is `null` and the reason is returned.

## Open Issues

- Optical visible border will eventually need refractive-index-based ray tracing. Current v1 uses geometric tangent intersection only.
- Flat-region continuation for panel size offset greater than `Sb` is intentionally not implemented in v1.
- Corner view rendering is a 2D representation of a swept surface, not a real 3D projection.
