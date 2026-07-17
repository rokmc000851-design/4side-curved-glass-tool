import { computeCoreGeometry } from "./geometry/glassGeometry.js";

const POSITIVE_FIELDS = ["X", "Y", "t", "R", "Rc", "ocaThickness", "panelThickness"];
const NUMERIC_FIELDS = [...POSITIVE_FIELDS, "D", "panelSizeOffset", "panelDeadSpace"];

export function validateInputs(input) {
  const errors = [];
  const warnings = [];

  for (const field of NUMERIC_FIELDS) {
    if (!Number.isFinite(Number(input[field]))) {
      errors.push(`${field} must be a finite number.`);
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors, warnings };
  }

  for (const field of POSITIVE_FIELDS) {
    if (!(Number(input[field]) > 0)) {
      errors.push(`${field} must be greater than 0.`);
    }
  }

  if (!(Number(input.D) >= 0)) {
    errors.push("D must be greater than or equal to 0.");
  }

  if (Number(input.R) > 0 && Number(input.D) > 2 * Number(input.R)) {
    errors.push("D must be less than or equal to 2R.");
  }

  if (!(Number(input.panelSizeOffset) >= 0)) {
    errors.push("Panel Size Offset must be greater than or equal to 0.");
  }

  if (!(Number(input.panelDeadSpace) >= 0)) {
    errors.push("Panel Dead Space must be greater than or equal to 0.");
  }

  if (errors.length > 0) {
    return { isValid: false, errors, warnings };
  }

  const core = computeCoreGeometry(input);

  if (core.Rf < -1e-9) {
    errors.push("Rf must be greater than or equal to 0. Rc is smaller than Lb.");
  }

  const flatX = Number(input.X) - 2 * Number(input.Rc);
  const flatY = Number(input.Y) - 2 * Number(input.Rc);
  if (flatX < -1e-9 || flatY < -1e-9) {
    errors.push("Flat top-view region cannot be negative. X and Y must be at least 2Rc.");
  }

  if (Number(input.panelSizeOffset) - core.Sb > 1e-9) {
    errors.push("Panel Size Offset cannot exceed glass bending arc length Sb in v1.");
  }

  const availablePanelArc = core.Sb - Number(input.panelSizeOffset);
  if (Number(input.panelDeadSpace) - availablePanelArc > 1e-9) {
    errors.push("Panel Dead Space exceeds available panel arc length.");
  }

  if (core.Sb === 0 && (Number(input.panelSizeOffset) > 0 || Number(input.panelDeadSpace) > 0)) {
    errors.push("Panel arc offsets must be 0 when D is 0.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
