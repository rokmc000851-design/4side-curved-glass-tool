import { appendDefs, arcPath, clearSvg, closedPathFromLayers, createLinearGradient, createSvgElement, pathFromPoints, setViewBox } from "./viewTransform.js";
import { renderDimensionText, renderLine, renderPath } from "./dimensionRenderer.js";

export function renderBorderView(svg, geometry, showDimensions) {
  clearSvg(svg);
  if (!geometry.core) {
    setViewBox(svg, 0, 0, 100, 60);
    return;
  }

  const { core, border, surfaces } = geometry;
  const glassTop = surfaces.glass.top;
  const glassBottom = surfaces.glass.bottom;
  const ocaBottom = surfaces.stack.ocaBottom;
  const panelBottom = surfaces.stack.panelBottom;
  const height = geometry.input.t + geometry.input.ocaThickness + geometry.input.panelThickness + geometry.input.D + 7;
  setViewBox(svg, -1.8, -geometry.input.D - 2.5, Math.max(13, core.Lb + 7.5), height);
  appendDefs(svg, [
    createLinearGradient("borderGlassShade", [
      { offset: "0%", "stop-color": "#8a9399", "stop-opacity": "0.42" },
      { offset: "60%", "stop-color": "#c6cccf", "stop-opacity": "0.30" },
      { offset: "100%", "stop-color": "#737d84", "stop-opacity": "0.38" }
    ], { x1: "0%", y1: "0%", x2: "100%", y2: "0%" })
  ]);

  svg.appendChild(createSvgElement("path", {
    d: closedPathFromLayers(glassTop, glassBottom),
    fill: "url(#borderGlassShade)",
    stroke: "var(--line-strong)",
    "stroke-width": 0.06
  }));
  svg.appendChild(createSvgElement("path", {
    d: closedPathFromLayers(glassBottom, ocaBottom),
    fill: "var(--oca)",
    stroke: "#6f9ca9",
    "stroke-width": 0.05
  }));
  svg.appendChild(createSvgElement("path", {
    d: closedPathFromLayers(ocaBottom, panelBottom),
    fill: "var(--panel)",
    stroke: "#3f464c",
    "stroke-width": 0.05
  }));

  const deadOuter = geometry.referencePoints.panelEdge.panelBottom;
  const deadInner = geometry.referencePoints.deadSpaceInner.panelBottom;
  const deadRegionTopOuter = geometry.referencePoints.panelEdge.panelTop;
  const deadRegionTopInner = geometry.referencePoints.deadSpaceInner.panelTop;
  svg.appendChild(createSvgElement("path", {
    d: `M ${deadRegionTopInner.u} ${deadRegionTopInner.z} L ${deadRegionTopOuter.u} ${deadRegionTopOuter.z} L ${deadOuter.u} ${deadOuter.z} L ${deadInner.u} ${deadInner.z} Z`,
    fill: "#050505",
    stroke: "none"
  }));

  svg.appendChild(createSvgElement("path", {
    d: pathFromPoints(glassTop),
    fill: "none",
    stroke: "#6d767c",
    "stroke-width": 0.06
  }));

  const glassEnd = border.physical.right;
  const physLeft = border.physical.left;

  svg.appendChild(createSvgElement("circle", {
    cx: physLeft.u,
    cy: physLeft.z,
    r: 0.08,
    fill: "#111111"
  }));
  svg.appendChild(createSvgElement("circle", {
    cx: glassEnd.u,
    cy: glassEnd.z,
    r: 0.08,
    fill: "var(--accent)"
  }));
  renderLine(svg, physLeft.u, physLeft.z, physLeft.u, glassEnd.z - 0.7, "projection-guide");
  renderLine(svg, glassEnd.u, glassEnd.z, glassEnd.u, glassEnd.z - 0.7, "projection-guide");
  svg.appendChild(createSvgElement("line", {
    x1: physLeft.u,
    y1: glassEnd.z - 0.7,
    x2: glassEnd.u,
    y2: glassEnd.z - 0.7,
    stroke: "var(--accent)",
    "stroke-width": 0.05
  }));

  if (border.visible.intersection) {
    renderLine(svg, border.visible.q.u, border.visible.q.z, border.visible.intersection.u, border.visible.intersection.z, "visible-guide");
    renderLine(svg, border.visible.intersection.u, border.visible.intersection.z, border.visible.intersection.u, glassEnd.z - 1.45, "projection-guide");
    renderLine(svg, glassEnd.u, glassEnd.z, glassEnd.u, glassEnd.z - 1.45, "projection-guide");
    renderLine(svg, border.visible.intersection.u, glassEnd.z - 1.45, glassEnd.u, glassEnd.z - 1.45, "visible-guide");
    svg.appendChild(createSvgElement("circle", {
      cx: border.visible.intersection.u,
      cy: border.visible.intersection.z,
      r: 0.08,
      fill: "#8a5a00"
    }));
  }

  if (showDimensions) {
    renderLine(svg, 0.15, 0, 0.15, -geometry.input.ocaThickness, "dimension-line");
    renderDimensionText(svg, 0.35, -geometry.input.ocaThickness * 0.5, `OCA ${geometry.input.ocaThickness.toFixed(3)}`);
    renderLine(svg, 0.55, -geometry.input.ocaThickness, 0.55, -geometry.input.ocaThickness - geometry.input.panelThickness, "dimension-line");
    renderDimensionText(svg, 0.75, -geometry.input.ocaThickness - geometry.input.panelThickness * 0.5, `Panel ${geometry.input.panelThickness.toFixed(3)}`);
    renderPath(svg, arcPath(0, -geometry.input.R, geometry.input.R * 0.86, Math.PI / 2 - core.theta, Math.PI / 2 - geometry.stack.panelEdgeAlpha, 0), "dimension-line");
    renderDimensionText(svg, core.Lb * 0.66, -geometry.input.D - 0.7, `Panel offset arc ${geometry.input.panelSizeOffset.toFixed(3)}`);
    renderPath(svg, arcPath(0, -geometry.input.R, geometry.input.R * 0.75, Math.PI / 2 - geometry.stack.panelEdgeAlpha, Math.PI / 2 - geometry.stack.deadInnerAlpha, 0), "dimension-line");
    renderDimensionText(svg, Math.max(0.6, physLeft.u - 1.4), physLeft.z - 0.45, `Dead arc ${geometry.input.panelDeadSpace.toFixed(3)}`);
    renderDimensionText(svg, physLeft.u, glassEnd.z - 1.05, `Physical ${border.physical.value.toFixed(3)}`);
    const visibleLabel = border.visible.value === null ? "Visible N/A" : `Visible ${border.visible.value.toFixed(3)}`;
    renderDimensionText(svg, border.visible.intersection ? border.visible.intersection.u : 0, glassEnd.z - 1.8, visibleLabel);
  }
}
