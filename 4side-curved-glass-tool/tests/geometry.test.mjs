import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_INPUTS } from "../src/js/state.js";
import { computeCoreGeometry, glassBottomPoint, glassTopPoint, normalAt, tangentAt } from "../src/js/geometry/glassGeometry.js";
import { computeDesignGeometry } from "../src/js/geometry/index.js";
import { ocaBottomPoint, ocaTopPoint, panelBottomPoint, panelTopPoint } from "../src/js/geometry/stackGeometry.js";

function closeTo(actual, expected, tolerance = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} should be close to ${expected}`);
}

test("default core geometry matches independent formulas", () => {
  const core = computeCoreGeometry(DEFAULT_INPUTS);
  const theta = Math.acos(0.9);
  const Lb = Math.sqrt(19);
  const Sb = 10 * theta;

  closeTo(core.theta, theta);
  closeTo(core.Lb, Lb);
  closeTo(core.Sb, Sb);
  closeTo(core.Rf, 10 - Lb);
  closeTo(core.depthRatio, 0.1);
  closeTo(core.cornerShrinkage, ((Sb - Lb) / Sb) * 100);
});

test("D equals 0 produces stable zero arc geometry", () => {
  const input = { ...DEFAULT_INPUTS, D: 0, panelSizeOffset: 0, panelDeadSpace: 0 };
  const geometry = computeDesignGeometry(input);

  assert.equal(geometry.validation.isValid, true);
  closeTo(geometry.core.theta, 0);
  closeTo(geometry.core.Lb, 0);
  closeTo(geometry.core.Sb, 0);
  closeTo(geometry.core.cornerShrinkage, 0);
});

test("D near 2R remains finite", () => {
  const input = { ...DEFAULT_INPUTS, D: 19.999, Rc: 30, panelSizeOffset: 0, panelDeadSpace: 0 };
  const geometry = computeDesignGeometry(input);

  assert.equal(geometry.validation.isValid, true);
  assert.ok(Number.isFinite(geometry.core.theta));
  assert.ok(Number.isFinite(geometry.core.Lb));
});

test("glass top is local normal offset from glass bottom", () => {
  const alpha = Math.acos(0.9) / 2;
  const bottom = glassBottomPoint(alpha, DEFAULT_INPUTS);
  const top = glassTopPoint(alpha, DEFAULT_INPUTS);
  const normal = normalAt(alpha);

  closeTo(top.u - bottom.u, DEFAULT_INPUTS.t * normal.u);
  closeTo(top.z - bottom.z, DEFAULT_INPUTS.t * normal.z);
});

test("glass end face follows local normal and is perpendicular to local tangent", () => {
  const geometry = computeDesignGeometry(DEFAULT_INPUTS);
  const endFace = geometry.surfaces.glass.endFace;
  const normal = normalAt(geometry.core.theta);
  const tangent = tangentAt(geometry.core.theta);

  closeTo(endFace.top.u - endFace.bottom.u, DEFAULT_INPUTS.t * normal.u);
  closeTo(endFace.top.z - endFace.bottom.z, DEFAULT_INPUTS.t * normal.z);
  closeTo(tangent.u * endFace.direction.u + tangent.z * endFace.direction.z, 0);
  closeTo(endFace.tangentDotDirection, 0);
});

test("OCA and panel contact conditions are exact normal offsets", () => {
  const alpha = Math.acos(0.9) * 0.7;
  const normal = normalAt(alpha);
  const glassBottom = glassBottomPoint(alpha, DEFAULT_INPUTS);
  const ocaTop = ocaTopPoint(alpha, DEFAULT_INPUTS);
  const ocaBottom = ocaBottomPoint(alpha, DEFAULT_INPUTS);
  const panelTop = panelTopPoint(alpha, DEFAULT_INPUTS);
  const panelBottom = panelBottomPoint(alpha, DEFAULT_INPUTS);

  closeTo(ocaTop.u, glassBottom.u);
  closeTo(ocaTop.z, glassBottom.z);
  closeTo(ocaBottom.u - ocaTop.u, -DEFAULT_INPUTS.ocaThickness * normal.u);
  closeTo(ocaBottom.z - ocaTop.z, -DEFAULT_INPUTS.ocaThickness * normal.z);
  closeTo(panelTop.u, ocaBottom.u);
  closeTo(panelTop.z, ocaBottom.z);
  closeTo(panelBottom.u - panelTop.u, -DEFAULT_INPUTS.panelThickness * normal.u);
  closeTo(panelBottom.z - panelTop.z, -DEFAULT_INPUTS.panelThickness * normal.z);
});

test("stack alphas match requested formulas", () => {
  const geometry = computeDesignGeometry(DEFAULT_INPUTS);
  const theta = Math.acos(0.9);
  closeTo(geometry.stack.panelEdgeAlpha, theta - 0.1 / 10);
  closeTo(geometry.stack.deadInnerAlpha, theta - 0.1 / 10 - 0.3 / 10);
  closeTo((theta - geometry.stack.panelEdgeAlpha) * DEFAULT_INPUTS.R, DEFAULT_INPUTS.panelSizeOffset);
  closeTo((geometry.stack.panelEdgeAlpha - geometry.stack.deadInnerAlpha) * DEFAULT_INPUTS.R, DEFAULT_INPUTS.panelDeadSpace);
});

test("computed design geometry exposes reusable surface and reference metadata", () => {
  const geometry = computeDesignGeometry(DEFAULT_INPUTS);

  assert.equal(geometry.metadata.bendingBasis, "Glass Bottom Surface");
  assert.equal(geometry.metadata.borderDistanceBasis, "Top View / u-axis straight projection");
  assert.equal(geometry.surfaces.stack.ocaTop.length, geometry.surfaces.stack.ocaBottom.length);
  assert.equal(geometry.referencePoints.panelEdge.alpha, geometry.stack.panelEdgeAlpha);
  assert.equal(geometry.referencePoints.deadSpaceInner.alpha, geometry.stack.deadInnerAlpha);
});
