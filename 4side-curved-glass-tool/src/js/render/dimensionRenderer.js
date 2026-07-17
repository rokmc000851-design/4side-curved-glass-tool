export function renderDimensionText(svg, x, y, text) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", "text");
  node.setAttribute("x", String(x));
  node.setAttribute("y", String(y));
  node.setAttribute("class", "dim-text");
  node.textContent = text;
  svg.appendChild(node);
}

export function renderLine(svg, x1, y1, x2, y2, className = "dimension-line", extra = {}) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", "line");
  node.setAttribute("x1", String(x1));
  node.setAttribute("y1", String(y1));
  node.setAttribute("x2", String(x2));
  node.setAttribute("y2", String(y2));
  node.setAttribute("class", className);
  for (const [key, value] of Object.entries(extra)) {
    node.setAttribute(key, String(value));
  }
  svg.appendChild(node);
  return node;
}

export function renderPath(svg, d, className = "dimension-line", extra = {}) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", "path");
  node.setAttribute("d", d);
  node.setAttribute("class", className);
  node.setAttribute("fill", "none");
  for (const [key, value] of Object.entries(extra)) {
    node.setAttribute(key, String(value));
  }
  svg.appendChild(node);
  return node;
}
