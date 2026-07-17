export const DEFAULT_INPUTS = Object.freeze({
  X: 75,
  Y: 160,
  t: 0.5,
  R: 10,
  D: 1,
  Rc: 10,
  ocaThickness: 0.1,
  panelThickness: 0.1,
  panelSizeOffset: 0.1,
  panelDeadSpace: 0.3
});

export function createInitialState() {
  return {
    inputs: { ...DEFAULT_INPUTS },
    showDimensions: true
  };
}

