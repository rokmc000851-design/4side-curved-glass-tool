import { glassBottomPoint, normalAt, offsetPoint } from "./glassGeometry.js";

export function computeStackAlphas(input, core) {
  const panelEdgeAlpha = core.theta - Number(input.panelSizeOffset) / Number(input.R);
  const deadInnerAlpha = panelEdgeAlpha - Number(input.panelDeadSpace) / Number(input.R);

  return {
    panelEdgeAlpha,
    deadInnerAlpha,
    panelSizeOffsetArc: Number(input.panelSizeOffset),
    panelDeadSpaceArc: Number(input.panelDeadSpace),
    availablePanelArc: core.Sb - Number(input.panelSizeOffset)
  };
}

export function ocaTopPoint(alpha, input) {
  return glassBottomPoint(alpha, input);
}

export function ocaBottomPoint(alpha, input) {
  return offsetPoint(ocaTopPoint(alpha, input), normalAt(alpha), -Number(input.ocaThickness));
}

export function panelTopPoint(alpha, input) {
  return ocaBottomPoint(alpha, input);
}

export function panelBottomPoint(alpha, input) {
  return offsetPoint(panelTopPoint(alpha, input), normalAt(alpha), -Number(input.panelThickness));
}

export function stackLayerPoints(alpha, input) {
  return {
    alpha,
    glassBottom: glassBottomPoint(alpha, input),
    ocaTop: ocaTopPoint(alpha, input),
    ocaBottom: ocaBottomPoint(alpha, input),
    panelTop: panelTopPoint(alpha, input),
    panelBottom: panelBottomPoint(alpha, input),
    normal: normalAt(alpha)
  };
}

export function sampleStackSection(input, core, sampleCount = 40) {
  const count = Math.max(2, sampleCount);
  const glassBottom = [];
  const ocaTop = [];
  const ocaBottom = [];
  const panelTop = [];
  const panelBottom = [];

  for (let i = 0; i < count; i += 1) {
    const alpha = core.theta * (i / (count - 1));
    const points = stackLayerPoints(alpha, input);
    glassBottom.push(points.glassBottom);
    ocaTop.push(points.ocaTop);
    ocaBottom.push(points.ocaBottom);
    panelTop.push(points.panelTop);
    panelBottom.push(points.panelBottom);
  }

  return {
    glassBottom,
    ocaTop,
    ocaBottom,
    panelTop,
    panelBottom
  };
}

export function computeStackReferencePoints(input, core, stack) {
  return {
    glassEdge: stackLayerPoints(core.theta, input),
    panelEdge: stackLayerPoints(stack.panelEdgeAlpha, input),
    deadSpaceInner: stackLayerPoints(stack.deadInnerAlpha, input)
  };
}
