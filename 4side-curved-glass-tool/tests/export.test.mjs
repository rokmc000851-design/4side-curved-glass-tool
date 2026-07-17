import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_INPUTS } from "../src/js/state.js";
import { computeDesignGeometry } from "../src/js/geometry/index.js";
import { derivedGeometryRows, rowsToCsv } from "../src/js/export/csvExport.js";

test("derived parameters export to CSV rows", () => {
  const geometry = computeDesignGeometry(DEFAULT_INPUTS);
  const rows = derivedGeometryRows(geometry);
  const csv = rowsToCsv(rows);

  assert.equal(rows[0].join(","), "name,value,unit");
  assert.match(csv, /theta_deg/);
  assert.match(csv, /physical_border/);
  assert.match(csv, /visible_border_method/);
});

test("parameter JSON shape round trips inputs", () => {
  const payload = {
    app: "4-Side Curved Cover Glass Design Tool",
    version: "0.1.0",
    inputs: DEFAULT_INPUTS
  };
  const parsed = JSON.parse(JSON.stringify(payload));

  assert.deepEqual(parsed.inputs, DEFAULT_INPUTS);
});

