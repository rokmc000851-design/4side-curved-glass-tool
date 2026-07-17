export const EPSILON = 1e-9;

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function radiansToDegrees(radians) {
  return radians * 180 / Math.PI;
}

export function nearlyEqual(a, b, tolerance = 1e-9) {
  return Math.abs(a - b) <= tolerance;
}

export function point(u, z) {
  return { u, z };
}

export function distance2(a, b) {
  const du = a.u - b.u;
  const dz = a.z - b.z;
  return du * du + dz * dz;
}

export function dot(a, b) {
  return a.u * b.u + a.z * b.z;
}
