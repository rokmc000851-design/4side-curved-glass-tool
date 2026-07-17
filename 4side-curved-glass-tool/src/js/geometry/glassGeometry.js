import { dot, EPSILON, clamp, radiansToDegrees } from "./geometryUtils.js";

export function computeCoreGeometry(input) {
  const R = Number(input.R);
  const D = Number(input.D);
  const Rc = Number(input.Rc);

  const acosArgument = clamp(1 - D / R, -1, 1);
  const theta = Math.acos(acosArgument);
  const Lb = Math.sqrt(Math.max(0, 2 * R * D - D * D));
  const Sb = R * theta;
  const Rf = Rc - Lb;
  const depthRatio = D / R;
  const cornerShrinkage = Sb <= EPSILON ? 0 : ((Sb - Lb) / Sb) * 100;

  return {
    theta,
    thetaDeg: radiansToDegrees(theta),
    Lb,
    Sb,
    Rf,
    depthRatio,
    cornerShrinkage
  };
}

export function glassBottomPoint(alpha, input) {
  const R = Number(input.R);
  return {
    u: R * Math.sin(alpha),
    z: -R * (1 - Math.cos(alpha))
  };
}

export function tangentAt(alpha) {
  return {
    u: Math.cos(alpha),
    z: -Math.sin(alpha)
  };
}

export function normalAt(alpha) {
  return {
    u: Math.sin(alpha),
    z: Math.cos(alpha)
  };
}

export function offsetPoint(basePoint, normal, distance) {
  return {
    u: basePoint.u + distance * normal.u,
    z: basePoint.z + distance * normal.z
  };
}

export function glassTopPoint(alpha, input) {
  return offsetPoint(glassBottomPoint(alpha, input), normalAt(alpha), Number(input.t));
}

export function sampleGlassSection(input, sampleCount = 40) {
  const core = computeCoreGeometry(input);
  const count = Math.max(2, sampleCount);
  const bottom = [];
  const top = [];

  for (let i = 0; i < count; i += 1) {
    const alpha = core.theta * (i / (count - 1));
    bottom.push(glassBottomPoint(alpha, input));
    top.push(glassTopPoint(alpha, input));
  }

  return {
    bottom,
    top,
    endFace: computeGlassEndFace(input, core)
  };
}

export function computeGlassEndFace(input, core = computeCoreGeometry(input)) {
  const alpha = core.theta;
  const bottom = glassBottomPoint(alpha, input);
  const top = glassTopPoint(alpha, input);
  const normal = normalAt(alpha);
  const tangent = tangentAt(alpha);

  return {
    alpha,
    bottom,
    top,
    direction: normal,
    length: Number(input.t),
    tangentDotDirection: dot(tangent, normal),
    description: "End face connects Glass Bottom(theta) to Glass Top(theta) along local normal N(theta)."
  };
}
