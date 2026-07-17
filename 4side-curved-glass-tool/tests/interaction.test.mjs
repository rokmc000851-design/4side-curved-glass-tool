import test from "node:test";
import assert from "node:assert/strict";
import {
  createViewTransform,
  effectiveViewBox,
  panTransform,
  parseViewBox,
  resetTransform,
  zoomTransformAt
} from "../src/js/ui/interaction.js";

test("parseViewBox reads valid SVG viewBox strings", () => {
  assert.deepEqual(parseViewBox("1 2 3 4"), { x: 1, y: 2, width: 3, height: 4 });
  assert.equal(parseViewBox("bad"), null);
});

test("pan transform changes only the target transform state", () => {
  const base = { x: 0, y: 0, width: 100, height: 50 };
  const first = createViewTransform();
  const second = createViewTransform();

  panTransform(base, first, 10, 5, 100, 50);

  assert.notEqual(first.panX, second.panX);
  assert.equal(second.panX, 0);
  assert.equal(second.panY, 0);
});

test("zoom transform keeps pointer world coordinate stable", () => {
  const base = { x: 0, y: 0, width: 100, height: 50 };
  const transform = createViewTransform();
  const before = effectiveViewBox(base, transform);
  const pointerX = before.x + before.width * 0.25;
  const pointerY = before.y + before.height * 0.4;

  zoomTransformAt(base, transform, 0.25, 0.4, -240);

  const after = effectiveViewBox(base, transform);
  assert.ok(transform.zoom > 1);
  assert.ok(Math.abs((after.x + after.width * 0.25) - pointerX) < 1e-9);
  assert.ok(Math.abs((after.y + after.height * 0.4) - pointerY) < 1e-9);
});

test("reset transform restores default view transform", () => {
  const transform = createViewTransform();
  transform.zoom = 4;
  transform.panX = 12;
  transform.panY = -5;
  resetTransform(transform);

  assert.deepEqual(transform, { zoom: 1, panX: 0, panY: 0 });
});

