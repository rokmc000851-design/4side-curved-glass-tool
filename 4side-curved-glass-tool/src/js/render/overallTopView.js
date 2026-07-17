import { appendDefs, clearSvg, createLinearGradient, createRadialGradient, createSvgElement, setViewBox } from "./viewTransform.js";
import { renderDimensionText } from "./dimensionRenderer.js";

export function renderOverallTopView(svg, geometry, showDimensions) {
  clearSvg(svg);
  if (!geometry.core) {
    setViewBox(svg, 0, 0, 100, 100);
    return;
  }

  const { X, Y, Rc } = geometry.input;
  const { Rf } = geometry.core;
  const pad = Math.max(8, Rc);
  setViewBox(svg, -pad, -pad, X + pad * 2, Y + pad * 2);
  appendDefs(svg, [
    createLinearGradient("overallGlassShade", [
      { offset: "0%", "stop-color": "#9fa8ad", "stop-opacity": "0.34" },
      { offset: "48%", "stop-color": "#d0d5d8", "stop-opacity": "0.24" },
      { offset: "100%", "stop-color": "#7d878d", "stop-opacity": "0.32" }
    ], { x1: "0%", y1: "0%", x2: "100%", y2: "100%" }),
    createRadialGradient("overallCornerReflect", [
      { offset: "0%", "stop-color": "#eef1f2", "stop-opacity": "0.32" },
      { offset: "55%", "stop-color": "#a7b0b5", "stop-opacity": "0.16" },
      { offset: "100%", "stop-color": "#68737a", "stop-opacity": "0.08" }
    ], { cx: "15%", cy: "14%", r: "64%" })
  ]);

  const rect = createSvgElement("rect", {
    x: 0,
    y: 0,
    width: X,
    height: Y,
    rx: Rc,
    ry: Rc,
    fill: "url(#overallGlassShade)",
    stroke: "var(--line-strong)",
    "stroke-width": 0.35
  });
  svg.appendChild(rect);

  svg.appendChild(createSvgElement("rect", {
    x: 0,
    y: 0,
    width: X,
    height: Y,
    rx: Rc,
    ry: Rc,
    fill: "url(#overallCornerReflect)",
    stroke: "none"
  }));

  const flat = createSvgElement("rect", {
    x: Rc,
    y: Rc,
    width: Math.max(0, X - 2 * Rc),
    height: Math.max(0, Y - 2 * Rc),
    fill: "none",
    stroke: "var(--line)",
    "stroke-width": 0.25
  });
  svg.appendChild(flat);

  const rInner = Math.max(0, Rf);
  const cornerGuides = [
    `M ${Rc} 0 L ${Rc} ${Y}`,
    `M 0 ${Rc} L ${X} ${Rc}`,
    `M ${X - Rc} 0 L ${X - Rc} ${Y}`,
    `M 0 ${Y - Rc} L ${X} ${Y - Rc}`
  ];
  for (const guide of cornerGuides) {
    svg.appendChild(createSvgElement("path", {
      d: guide,
      fill: "none",
      stroke: "#d5dade",
      "stroke-width": 0.18
    }));
  }
  if (rInner > 0) {
    svg.appendChild(createSvgElement("path", {
      d: `M ${Rc} ${Rc - rInner} A ${rInner} ${rInner} 0 0 0 ${Rc - rInner} ${Rc}`,
      fill: "none",
      stroke: "#c7cdd1",
      "stroke-width": 0.2
    }));
  }

  if (showDimensions) {
    renderDimensionText(svg, X / 2 - 8, -3, `X ${X.toFixed(1)} mm`);
    renderDimensionText(svg, X + 2, Y / 2, `Y ${Y.toFixed(1)} mm`);
  }
}
