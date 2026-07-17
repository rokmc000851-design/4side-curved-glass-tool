import { appendDefs, arcPath, clearSvg, closedPathFromLayers, createLinearGradient, createSvgElement, pathFromPoints, setViewBox } from "./viewTransform.js";
import { renderDimensionText, renderLine, renderPath } from "./dimensionRenderer.js";

export function renderCornerSideView(svg, geometry, showDimensions) {
  clearSvg(svg);
  if (!geometry.core) {
    setViewBox(svg, 0, 0, 100, 60);
    return;
  }

  const { core, surfaces } = geometry;
  const bottomArc = surfaces.glass.bottom;
  const topArc = surfaces.glass.top;
  const flatLength = Math.max(4, core.Lb * 0.55);
  const bottom = [{ u: -flatLength, z: 0 }, ...bottomArc];
  const top = [{ u: -flatLength, z: geometry.input.t }, ...topArc];
  const center = { u: 0, z: -geometry.input.R };
  setViewBox(svg, -flatLength - 2, -geometry.input.R - 2, Math.max(16, core.Lb + flatLength + 7), Math.max(14, geometry.input.R + geometry.input.t + 7));
  appendDefs(svg, [
    createLinearGradient("sideGlassShade", [
      { offset: "0%", "stop-color": "#7e878d", "stop-opacity": "0.36" },
      { offset: "50%", "stop-color": "#c4c9cc", "stop-opacity": "0.30" },
      { offset: "100%", "stop-color": "#8d969b", "stop-opacity": "0.38" }
    ], { x1: "0%", y1: "0%", x2: "100%", y2: "0%" })
  ]);

  svg.appendChild(createSvgElement("polygon", {
    points: [...top, ...bottom.slice().reverse()].map((p) => `${p.u},${p.z}`).join(" "),
    fill: "url(#sideGlassShade)",
    stroke: "none"
  }));
  svg.appendChild(createSvgElement("path", {
    d: closedPathFromLayers(top, bottom),
    fill: "none",
    stroke: "var(--line-strong)",
    "stroke-width": 0.07
  }));
  svg.appendChild(createSvgElement("path", {
    d: pathFromPoints(bottomArc),
    fill: "none",
    stroke: "var(--line-strong)",
    "stroke-width": 0.08
  }));
  renderLine(svg, surfaces.glass.endFace.bottom.u, surfaces.glass.endFace.bottom.z, surfaces.glass.endFace.top.u, surfaces.glass.endFace.top.z, "shape-line");

  if (showDimensions) {
    renderLine(svg, center.u, center.z, 0, 0, "dimension-dashed");
    renderLine(svg, center.u, center.z, core.Lb, -geometry.input.D, "dimension-dashed");
    renderPath(svg, arcPath(center.u, center.z, geometry.input.R * 0.28, Math.PI / 2 - core.theta, Math.PI / 2, 1), "dimension-line");
    renderDimensionText(svg, geometry.input.R * 0.12, -geometry.input.R * 0.72, `R ${geometry.input.R.toFixed(3)}`);
    renderDimensionText(svg, geometry.input.R * 0.16, -geometry.input.R * 0.62, `${core.thetaDeg.toFixed(2)} deg`);
    renderLine(svg, 0, geometry.input.t + 1.1, core.Lb, geometry.input.t + 1.1, "dimension-line");
    renderLine(svg, 0, geometry.input.t + 0.75, 0, geometry.input.t + 1.45, "dimension-line");
    renderLine(svg, core.Lb, geometry.input.t + 0.75, core.Lb, geometry.input.t + 1.45, "dimension-line");
    renderDimensionText(svg, core.Lb * 0.36, geometry.input.t + 2.05, `Lb ${core.Lb.toFixed(3)}`);
    renderLine(svg, core.Lb + 1, 0, core.Lb + 1, -geometry.input.D, "dimension-line");
    renderLine(svg, core.Lb + 0.55, 0, core.Lb + 1.45, 0, "dimension-line");
    renderLine(svg, core.Lb + 0.55, -geometry.input.D, core.Lb + 1.45, -geometry.input.D, "dimension-line");
    renderDimensionText(svg, core.Lb + 1.3, -geometry.input.D * 0.5, `D ${geometry.input.D.toFixed(3)}`);
  }
}
