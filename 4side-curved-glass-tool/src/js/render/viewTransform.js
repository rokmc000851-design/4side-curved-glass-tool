export function setViewBox(svg, minX, minY, width, height) {
  const value = `${minX} ${minY} ${width} ${height}`;
  svg.setAttribute("data-base-viewbox", value);
  svg.setAttribute("viewBox", value);
}

export function clearSvg(svg) {
  while (svg.firstChild) {
    svg.removeChild(svg.firstChild);
  }
}

export function createSvgElement(name, attributes = {}) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", name);
  for (const [key, value] of Object.entries(attributes)) {
    if (value !== null && value !== undefined) {
      node.setAttribute(key, String(value));
    }
  }
  return node;
}

export function polyline(points) {
  return points.map((p) => `${p.u},${p.z}`).join(" ");
}

export function appendDefs(svg, definitions) {
  const defs = createSvgElement("defs");
  for (const definition of definitions) {
    defs.appendChild(definition);
  }
  svg.appendChild(defs);
  return defs;
}

export function createLinearGradient(id, stops, attributes = {}) {
  const gradient = createSvgElement("linearGradient", { id, ...attributes });
  for (const stop of stops) {
    gradient.appendChild(createSvgElement("stop", stop));
  }
  return gradient;
}

export function createRadialGradient(id, stops, attributes = {}) {
  const gradient = createSvgElement("radialGradient", { id, ...attributes });
  for (const stop of stops) {
    gradient.appendChild(createSvgElement("stop", stop));
  }
  return gradient;
}

export function pathFromPoints(points) {
  if (points.length === 0) {
    return "";
  }
  const [first, ...rest] = points;
  return `M ${first.u} ${first.z} ${rest.map((p) => `L ${p.u} ${p.z}`).join(" ")}`;
}

export function closedPathFromLayers(topPoints, bottomPoints) {
  return `${pathFromPoints(topPoints)} ${bottomPoints.slice().reverse().map((p) => `L ${p.u} ${p.z}`).join(" ")} Z`;
}

export function polarPoint(cx, cy, radius, angleRad) {
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad)
  };
}

export function arcPath(cx, cy, radius, startAngle, endAngle, sweep = 1) {
  const start = polarPoint(cx, cy, radius, startAngle);
  const end = polarPoint(cx, cy, radius, endAngle);
  const largeArc = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`;
}

export function renderError(svg, message) {
  clearSvg(svg);
  setViewBox(svg, 0, 0, 100, 50);
  svg.appendChild(createSvgElement("rect", {
    x: 0,
    y: 0,
    width: 100,
    height: 50,
    fill: "#fff4f4",
    stroke: "#e0b1b1",
    "stroke-width": 0.4
  }));
  const text = createSvgElement("text", {
    x: 5,
    y: 24,
    fill: "#9b2f2f",
    "font-size": 4
  });
  text.textContent = message;
  svg.appendChild(text);
}
