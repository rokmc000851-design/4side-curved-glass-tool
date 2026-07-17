import { EPSILON } from "./geometryUtils.js";
import { glassTopPoint, tangentAt } from "./glassGeometry.js";
import { panelBottomPoint } from "./stackGeometry.js";

export const VISIBLE_BORDER_METHOD = Object.freeze({
  id: "glass-top-tangent-intersection-v1",
  opticalSurface: "Glass Top Surface",
  rayStart: "Panel Bottom at alpha_dead_inner",
  rayDirection: "Tangent direction T(alpha_dead_inner), perpendicular to local normal N(alpha_dead_inner)",
  selectionRule: "Find all intersections with Glass Top Surface in [0, theta], then select the valid intersection with largest u.",
  distanceDefinition: "Straight projected distance along u axis from selected intersection V to GlassTop(theta).",
  limitation: "This is a geometric construction only. It does not include refractive-index ray tracing."
});

export function computePhysicalBorder(input, core, stack) {
  const left = panelBottomPoint(stack.deadInnerAlpha, input);
  const right = glassTopPoint(core.theta, input);

  return {
    value: Math.abs(right.u - left.u),
    left,
    right
  };
}

export function visibleBorderLineSurfaceError(alpha, input, q, direction) {
  const p = glassTopPoint(alpha, input);
  const du = p.u - q.u;
  const dz = p.z - q.z;
  return du * direction.z - dz * direction.u;
}

function refineIntersection(input, q, direction, loAlpha, hiAlpha, loValue) {
  let lo = loAlpha;
  let hi = hiAlpha;
  let fLo = loValue;

  for (let step = 0; step < 64; step += 1) {
    const mid = (lo + hi) / 2;
    const fMid = visibleBorderLineSurfaceError(mid, input, q, direction);
    if (Math.abs(fMid) < EPSILON) {
      lo = mid;
      hi = mid;
      break;
    }
    if (fLo * fMid <= 0) {
      hi = mid;
    } else {
      lo = mid;
      fLo = fMid;
    }
  }

  const alpha = (lo + hi) / 2;
  return {
    alpha,
    point: glassTopPoint(alpha, input),
    residual: visibleBorderLineSurfaceError(alpha, input, q, direction)
  };
}

function pushUniqueIntersection(intersections, candidate) {
  const exists = intersections.some((item) => Math.abs(item.alpha - candidate.alpha) < 1e-7);
  if (!exists) {
    intersections.push(candidate);
  }
}

export function findVisibleBorderIntersections(input, core, q, direction, sampleCount = 240) {
  const intersections = [];
  const samples = Math.max(2, sampleCount);

  if (core.theta <= EPSILON) {
    const alpha = 0;
    const residual = visibleBorderLineSurfaceError(alpha, input, q, direction);
    if (Math.abs(residual) < EPSILON) {
      intersections.push({ alpha, point: glassTopPoint(alpha, input), residual });
    }
    return intersections;
  }

  for (let i = 0; i < samples; i += 1) {
    const a0 = core.theta * (i / samples);
    const a1 = core.theta * ((i + 1) / samples);
    const f0 = visibleBorderLineSurfaceError(a0, input, q, direction);
    const f1 = visibleBorderLineSurfaceError(a1, input, q, direction);

    if (Math.abs(f0) < EPSILON) {
      pushUniqueIntersection(intersections, {
        alpha: a0,
        point: glassTopPoint(a0, input),
        residual: f0
      });
    }

    if (Math.abs(f1) < EPSILON) {
      pushUniqueIntersection(intersections, {
        alpha: a1,
        point: glassTopPoint(a1, input),
        residual: f1
      });
    }

    if (f0 * f1 < 0) {
      pushUniqueIntersection(intersections, refineIntersection(input, q, direction, a0, a1, f0));
    }
  }

  return intersections;
}

export function selectVisibleBorderIntersection(intersections) {
  if (intersections.length === 0) {
    return null;
  }

  return intersections.reduce((best, candidate) => {
    if (!best || candidate.point.u > best.point.u) {
      return candidate;
    }
    return best;
  }, null);
}

export function computeVisibleBorder(input, core, stack) {
  const q = panelBottomPoint(stack.deadInnerAlpha, input);
  const direction = tangentAt(stack.deadInnerAlpha);
  const intersections = findVisibleBorderIntersections(input, core, q, direction);
  const selected = selectVisibleBorderIntersection(intersections);
  const right = glassTopPoint(core.theta, input);
  const metadata = {
    ...VISIBLE_BORDER_METHOD,
    candidateCount: intersections.length,
    candidates: intersections.map((candidate) => ({
      alpha: candidate.alpha,
      point: candidate.point,
      residual: candidate.residual
    }))
  };

  if (!selected) {
    return {
      value: null,
      q,
      intersection: null,
      right,
      alpha: null,
      direction,
      metadata,
      reason: "No stable tangent-line intersection with Glass Top Surface."
    };
  }

  return {
    value: Math.abs(right.u - selected.point.u),
    q,
    intersection: selected.point,
    right,
    alpha: selected.alpha,
    direction,
    metadata: {
      ...metadata,
      selectedAlpha: selected.alpha,
      selectedPoint: selected.point
    },
    reason: null
  };
}
