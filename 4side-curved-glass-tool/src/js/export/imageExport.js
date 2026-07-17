export function serializeSvg(svg) {
  const clone = svg.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
  style.textContent = inlineSvgStyleText();
  clone.insertBefore(style, clone.firstChild);
  return new XMLSerializer().serializeToString(clone);
}

export function downloadSvg(filename, svg) {
  const content = serializeSvg(svg);
  const blob = new Blob([content], { type: "image/svg+xml" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function inlineSvgStyleText() {
  return `
    .dim-text{fill:#39454d;font-size:0.92px;paint-order:stroke;stroke:#fff;stroke-width:0.22px}
    .dimension-line{fill:none;stroke:#52616a;stroke-width:0.05;vector-effect:non-scaling-stroke}
    .dimension-dashed{fill:none;stroke:#7b858c;stroke-width:0.05;stroke-dasharray:0.35 0.28;vector-effect:non-scaling-stroke}
    .shape-line{fill:none;stroke:#68737a;stroke-width:0.06;vector-effect:non-scaling-stroke}
    .projection-guide{fill:none;stroke:#87929a;stroke-width:0.045;stroke-dasharray:0.28 0.22;vector-effect:non-scaling-stroke}
    .visible-guide{fill:none;stroke:#8a5a00;stroke-width:0.055;vector-effect:non-scaling-stroke}
  `;
}
