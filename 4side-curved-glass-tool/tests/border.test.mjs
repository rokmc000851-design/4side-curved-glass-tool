import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_INPUTS } from "../src/js/state.js";
import { computeDesignGeometry } from "../src/js/geometry/index.js";
import { findVisibleBorderIntersections, selectVisibleBorderIntersection, visibleBorderLineSurfaceError } from "../src/js/geometry/borderGeometry.js";
import { glassTopPoint, tangentAt } from "../src/js/geometry/glassGeometry.js";
import { panelBottomPoint } from "../src/js/geometry/stackGeometry.js";

test("default physical border is a finite u-axis projection", () => {
  const geometry = computeDesignGeometry(DEFAULT_INPUTS);
  const { physical } = geometry.border;

  assert.equal(geometry.validation.isValid, true);
  assert.ok(Number.isFinite(physical.value));
  assert.equal(physical.value, Math.abs(physical.right.u - physical.left.u));
});

test("physical border uses panel bottom dead-space point and glass top end point", () => {
  const geometry = computeDesignGeometry(DEFAULT_INPUTS);
  const expectedLeft = panelBottomPoint(geometry.stack.deadInnerAlpha, DEFAULT_INPUTS);
  const expectedRight = glassTopPoint(geometry.core.theta, DEFAULT_INPUTS);

  assert.deepEqual(geometry.border.physical.left, expectedLeft);
  assert.deepEqual(geometry.border.physical.right, expectedRight);
  assert.equal(geometry.border.physical.value, Math.abs(expectedRight.u - expectedLeft.u));
});

test("default visible border returns either value or explicit reason", () => {
  const geometry = computeDesignGeometry(DEFAULT_INPUTS);
  const { visible } = geometry.border;

  if (visible.value === null) {
    assert.equal(typeof visible.reason, "string");
    assert.ok(visible.reason.length > 0);
  } else {
    assert.ok(Number.isFinite(visible.value));
    assert.equal(visible.reason, null);
    assert.equal(visible.metadata.opticalSurface, "Glass Top Surface");
    assert.equal(visible.metadata.distanceDefinition.includes("u axis"), true);
  }
});

test("visible border intersection helpers expose candidates and select largest u", () => {
  const geometry = computeDesignGeometry(DEFAULT_INPUTS);
  const q = panelBottomPoint(geometry.stack.deadInnerAlpha, DEFAULT_INPUTS);
  const direction = tangentAt(geometry.stack.deadInnerAlpha);
  const intersections = findVisibleBorderIntersections(DEFAULT_INPUTS, geometry.core, q, direction);
  const selected = selectVisibleBorderIntersection(intersections);

  assert.ok(Array.isArray(intersections));
  if (selected) {
    assert.equal(selected.point.u, Math.max(...intersections.map((candidate) => candidate.point.u)));
    assert.ok(Math.abs(visibleBorderLineSurfaceError(selected.alpha, DEFAULT_INPUTS, q, direction)) < 1e-7);
  }
});
