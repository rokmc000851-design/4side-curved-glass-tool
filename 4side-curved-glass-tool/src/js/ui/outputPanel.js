function formatNumber(value, digits = 3) {
  if (value === null || Number.isNaN(value)) {
    return "N/A";
  }
  return Number(value).toFixed(digits);
}

function rowsForGeometry(geometry) {
  if (!geometry.core) {
    return [["Status", "Invalid geometry"]];
  }

  return [
    ["theta", `${formatNumber(geometry.core.thetaDeg, 3)} deg / ${formatNumber(geometry.core.theta, 6)} rad`],
    ["Lb", `${formatNumber(geometry.core.Lb)} mm`],
    ["Sb", `${formatNumber(geometry.core.Sb)} mm`],
    ["Rf", `${formatNumber(geometry.core.Rf)} mm`],
    ["D/R", formatNumber(geometry.core.depthRatio, 2)],
    ["Corner Shrinkage", `${formatNumber(geometry.core.cornerShrinkage, 2)} %`],
    ["Panel Edge Alpha", `${formatNumber(geometry.stack.panelEdgeAlpha, 6)} rad`],
    ["Dead Inner Alpha", `${formatNumber(geometry.stack.deadInnerAlpha, 6)} rad`],
    ["Physical Border", `${formatNumber(geometry.border.physical.value)} mm`],
    ["Visible Border", geometry.border.visible.value === null ? "N/A" : `${formatNumber(geometry.border.visible.value)} mm`],
    ["Visible Method", geometry.border.visible.metadata.id]
  ];
}

export function renderOutputPanel(list, geometry) {
  list.innerHTML = "";
  for (const [label, value] of rowsForGeometry(geometry)) {
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = label;
    dd.textContent = value;
    list.append(dt, dd);
  }
}

export function renderValidation(container, validation, visibleReason) {
  container.innerHTML = "";
  if (validation.errors.length === 0) {
    const item = document.createElement("div");
    item.textContent = "Valid geometry.";
    container.appendChild(item);
  } else {
    for (const error of validation.errors) {
      const item = document.createElement("div");
      item.className = "error";
      item.textContent = error;
      container.appendChild(item);
    }
  }

  if (visibleReason) {
    const item = document.createElement("div");
    item.className = "error";
    item.textContent = `Visible Border: ${visibleReason}`;
    container.appendChild(item);
  }
}
