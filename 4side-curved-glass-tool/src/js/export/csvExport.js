export function rowsToCsv(rows) {
  return rows.map((row) => row.map((cell) => `"${String(cell).replaceAll("\"", "\"\"")}"`).join(",")).join("\n");
}

export function derivedGeometryRows(geometry) {
  if (!geometry.core) {
    return [["name", "value", "unit"], ["status", "Invalid geometry", ""]];
  }
  return [
    ["name", "value", "unit"],
    ["theta_deg", geometry.core.thetaDeg, "deg"],
    ["theta_rad", geometry.core.theta, "rad"],
    ["Lb", geometry.core.Lb, "mm"],
    ["Sb", geometry.core.Sb, "mm"],
    ["Rf", geometry.core.Rf, "mm"],
    ["D_R", geometry.core.depthRatio, ""],
    ["corner_shrinkage", geometry.core.cornerShrinkage, "%"],
    ["panel_edge_alpha", geometry.stack.panelEdgeAlpha, "rad"],
    ["dead_inner_alpha", geometry.stack.deadInnerAlpha, "rad"],
    ["physical_border", geometry.border.physical.value, "mm"],
    ["visible_border", geometry.border.visible.value ?? "N/A", "mm"],
    ["visible_border_method", geometry.border.visible.metadata.id, ""]
  ];
}
