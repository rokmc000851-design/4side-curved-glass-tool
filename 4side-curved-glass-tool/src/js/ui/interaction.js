const MIN_ZOOM = 0.4;
const MAX_ZOOM = 24;
const WHEEL_ZOOM_BASE = 1.0018;
const PAN_LIMIT_FACTOR = 1.25;

export function bindResetButton(button, onReset) {
  button.addEventListener("click", onReset);
}

export function createViewTransform() {
  return {
    zoom: 1,
    panX: 0,
    panY: 0
  };
}

export function parseViewBox(value) {
  if (!value) {
    return null;
  }
  const parts = value.split(/\s+/).map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) {
    return null;
  }
  return {
    x: parts[0],
    y: parts[1],
    width: parts[2],
    height: parts[3]
  };
}

export function effectiveViewBox(base, transform) {
  const zoom = clampNumber(transform.zoom, MIN_ZOOM, MAX_ZOOM);
  const width = base.width / zoom;
  const height = base.height / zoom;
  return {
    x: base.x + transform.panX,
    y: base.y + transform.panY,
    width,
    height
  };
}

export function clampTransform(base, transform) {
  const zoom = clampNumber(transform.zoom, MIN_ZOOM, MAX_ZOOM);
  const width = base.width / zoom;
  const height = base.height / zoom;
  const limitX = base.width * PAN_LIMIT_FACTOR;
  const limitY = base.height * PAN_LIMIT_FACTOR;
  const minPanX = -limitX;
  const maxPanX = base.width + limitX - width;
  const minPanY = -limitY;
  const maxPanY = base.height + limitY - height;

  transform.zoom = zoom;
  transform.panX = clampNumber(transform.panX, minPanX, maxPanX);
  transform.panY = clampNumber(transform.panY, minPanY, maxPanY);
  return transform;
}

export function panTransform(base, transform, deltaClientX, deltaClientY, clientWidth, clientHeight) {
  const viewBox = effectiveViewBox(base, transform);
  transform.panX -= deltaClientX * (viewBox.width / Math.max(1, clientWidth));
  transform.panY -= deltaClientY * (viewBox.height / Math.max(1, clientHeight));
  return clampTransform(base, transform);
}

export function zoomTransformAt(base, transform, pointerRatioX, pointerRatioY, wheelDeltaY) {
  const before = effectiveViewBox(base, transform);
  const worldX = before.x + before.width * pointerRatioX;
  const worldY = before.y + before.height * pointerRatioY;
  const factor = Math.pow(WHEEL_ZOOM_BASE, -wheelDeltaY);
  transform.zoom = clampNumber(transform.zoom * factor, MIN_ZOOM, MAX_ZOOM);
  const afterWidth = base.width / transform.zoom;
  const afterHeight = base.height / transform.zoom;
  transform.panX = worldX - afterWidth * pointerRatioX - base.x;
  transform.panY = worldY - afterHeight * pointerRatioY - base.y;
  return clampTransform(base, transform);
}

export function resetTransform(transform) {
  transform.zoom = 1;
  transform.panX = 0;
  transform.panY = 0;
  return transform;
}

export function applyViewTransform(svg, transform) {
  const base = parseViewBox(svg.getAttribute("data-base-viewbox"));
  if (!base) {
    return;
  }
  clampTransform(base, transform);
  const next = effectiveViewBox(base, transform);
  svg.setAttribute("viewBox", `${next.x} ${next.y} ${next.width} ${next.height}`);
}

export function bindViewInteractions(svg, transform, onChanged) {
  let activePointerId = null;
  let lastPoint = null;

  svg.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return;
    }
    activePointerId = event.pointerId;
    lastPoint = { x: event.clientX, y: event.clientY };
    svg.setPointerCapture?.(event.pointerId);
  });

  svg.addEventListener("pointermove", (event) => {
    if (activePointerId !== event.pointerId || !lastPoint) {
      return;
    }
    const base = parseViewBox(svg.getAttribute("data-base-viewbox"));
    if (!base) {
      return;
    }
    const rect = svg.getBoundingClientRect();
    panTransform(base, transform, event.clientX - lastPoint.x, event.clientY - lastPoint.y, rect.width, rect.height);
    lastPoint = { x: event.clientX, y: event.clientY };
    onChanged();
  });

  svg.addEventListener("pointerup", (event) => {
    if (activePointerId === event.pointerId) {
      activePointerId = null;
      lastPoint = null;
      svg.releasePointerCapture?.(event.pointerId);
    }
  });

  svg.addEventListener("pointercancel", () => {
    activePointerId = null;
    lastPoint = null;
  });

  svg.addEventListener("wheel", (event) => {
    const base = parseViewBox(svg.getAttribute("data-base-viewbox"));
    if (!base) {
      return;
    }
    event.preventDefault();
    const rect = svg.getBoundingClientRect();
    const ratioX = (event.clientX - rect.left) / Math.max(1, rect.width);
    const ratioY = (event.clientY - rect.top) / Math.max(1, rect.height);
    zoomTransformAt(base, transform, ratioX, ratioY, event.deltaY);
    onChanged();
  }, { passive: false });

  svg.addEventListener("dblclick", () => {
    resetTransform(transform);
    onChanged();
  });
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
