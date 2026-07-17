import { appendDefs, arcPath, clearSvg, createRadialGradient, createSvgElement, polarPoint, setViewBox } from "./viewTransform.js";
import { renderDimensionText, renderLine, renderPath } from "./dimensionRenderer.js";

function quarterArc(radius) {
  return arcPath(0, 0, radius, 0, Math.PI / 2, 1);
}

export function renderCornerTopView(svg, geometry, showDimensions) {
  clearSvg(svg);
  if (!geometry.core) {
    setViewBox(svg, 0, 0, 100, 100);
    return;
  }

  const { Rc } = geometry.input;
  const { Rf } = geometry.core;
  const panelRadius = Math.max(0, Rf + geometry.input.R * Math.sin(geometry.stack.panelEdgeAlpha));
  const deadRadius = Math.max(0, Rf + geometry.input.R * Math.sin(geometry.stack.deadInnerAlpha));
  const pad = Math.max(6, Rc * 0.35);
  setViewBox(svg, -pad, -pad, Rc + pad * 2, Rc + pad * 2);
  appendDefs(svg, [
    createRadialGradient("cornerTopShade", [
      { offset: "0%", "stop-color": "#eff2f3", "stop-opacity": "0.34" },
      { offset: "55%", "stop-color": "#a9b1b6", "stop-opacity": "0.20" },
      { offset: "100%", "stop-color": "#69737a", "stop-opacity": "0.10" }
    ], { cx: "8%", cy: "8%", r: "100%" })
  ]);

  svg.appendChild(createSvgElement("path", {
    d: `${quarterArc(Rc)} L 0 0 Z`,
    fill: "url(#cornerTopShade)",
    stroke: "none"
  }));
  svg.appendChild(createSvgElement("path", {
    d: quarterArc(Rc),
    fill: "none",
    stroke: "var(--line-strong)",
    "stroke-width": 0.18
  }));
  svg.appendChild(createSvgElement("path", {
    d: quarterArc(Math.max(0, Rf)),
    fill: "none",
    stroke: "var(--line)",
    "stroke-width": 0.16
  }));
  svg.appendChild(createSvgElement("path", {
    d: quarterArc(panelRadius),
    fill: "none",
    stroke: "#65737c",
    "stroke-width": 0.16
  }));
  svg.appendChild(createSvgElement("path", {
    d: `${quarterArc(panelRadius)} L ${polarPoint(0, 0, deadRadius, Math.PI / 2).x} ${polarPoint(0, 0, deadRadius, Math.PI / 2).y} A ${deadRadius} ${deadRadius} 0 0 0 ${deadRadius} 0 Z`,
    fill: "#111111",
    stroke: "none"
  }));
  renderLine(svg, 0, 0, Rc + pad * 0.2, 0, "shape-line");
  renderLine(svg, 0, 0, 0, Rc + pad * 0.2, "shape-line");

  if (showDimensions) {
    renderLine(svg, 0, 0, Rc * 0.72, 0, "dimension-line");
    renderLine(svg, 0, 0, Rf * 0.52, Rf * 0.52, "dimension-line");
    renderDimensionText(svg, Rc * 0.48, -pad * 0.18, `Rc ${Rc.toFixed(3)}`);
    renderDimensionText(svg, Rf * 0.34, Rf * 0.44 + 1.2, `Rf ${Rf.toFixed(3)}`);
    renderPath(svg, arcPath(0, 0, (Rc + panelRadius) / 2, 0.08, 0.5, 1), "dimension-line");
    renderDimensionText(svg, (Rc + panelRadius) * 0.46, (Rc + panelRadius) * 0.14, `Offset arc ${geometry.input.panelSizeOffset.toFixed(3)}`);
    renderPath(svg, arcPath(0, 0, (panelRadius + deadRadius) / 2, 0.92, 1.35, 1), "dimension-line");
    renderDimensionText(svg, (panelRadius + deadRadius) * 0.15, (panelRadius + deadRadius) * 0.48, `Dead arc ${geometry.input.panelDeadSpace.toFixed(3)}`);
  }
}
