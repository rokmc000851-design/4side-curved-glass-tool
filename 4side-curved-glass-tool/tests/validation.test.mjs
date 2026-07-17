import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_INPUTS } from "../src/js/state.js";
import { computeCoreGeometry } from "../src/js/geometry/glassGeometry.js";
import { validateInputs } from "../src/js/validation.js";

test("Rc equal to Lb is valid", () => {
  const core = computeCoreGeometry(DEFAULT_INPUTS);
  const result = validateInputs({ ...DEFAULT_INPUTS, Rc: core.Lb });
  assert.equal(result.isValid, true);
});

test("Rc smaller than Lb is invalid", () => {
  const result = validateInputs({ ...DEFAULT_INPUTS, Rc: 1 });
  assert.equal(result.isValid, false);
  assert.match(result.errors.join("\n"), /Rc is smaller than Lb/);
});

test("panel offset may be zero or Sb", () => {
  const core = computeCoreGeometry(DEFAULT_INPUTS);
  assert.equal(validateInputs({ ...DEFAULT_INPUTS, panelSizeOffset: 0 }).isValid, true);
  assert.equal(validateInputs({ ...DEFAULT_INPUTS, panelSizeOffset: core.Sb, panelDeadSpace: 0 }).isValid, true);
});

test("panel offset greater than Sb is invalid", () => {
  const core = computeCoreGeometry(DEFAULT_INPUTS);
  const result = validateInputs({ ...DEFAULT_INPUTS, panelSizeOffset: core.Sb + 0.001 });
  assert.equal(result.isValid, false);
  assert.match(result.errors.join("\n"), /cannot exceed/);
});

test("dead space may be zero but cannot exceed available panel arc", () => {
  assert.equal(validateInputs({ ...DEFAULT_INPUTS, panelDeadSpace: 0 }).isValid, true);

  const result = validateInputs({ ...DEFAULT_INPUTS, panelSizeOffset: 0.1, panelDeadSpace: 100 });
  assert.equal(result.isValid, false);
  assert.match(result.errors.join("\n"), /Dead Space exceeds/);
});

test("very small positive thickness values are valid", () => {
  const result = validateInputs({ ...DEFAULT_INPUTS, t: 0.001, ocaThickness: 0.001, panelThickness: 0.001 });
  assert.equal(result.isValid, true);
});

test("non-finite numeric input is invalid", () => {
  const result = validateInputs({ ...DEFAULT_INPUTS, R: Number.NaN });
  assert.equal(result.isValid, false);
  assert.match(result.errors.join("\n"), /finite number/);
});
