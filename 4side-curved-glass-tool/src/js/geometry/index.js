import { computeCoreGeometry, sampleGlassSection } from "./glassGeometry.js";
import { computeStackAlphas, computeStackReferencePoints, sampleStackSection } from "./stackGeometry.js";
import { computePhysicalBorder, computeVisibleBorder } from "./borderGeometry.js";
import { validateInputs } from "../validation.js";

export function computeDesignGeometry(input) {
  const validation = validateInputs(input);

  if (!validation.isValid) {
    return {
      input: { ...input },
      validation,
      core: null,
      stack: null,
      border: null,
      samples: null
    };
  }

  const core = computeCoreGeometry(input);
  const stack = computeStackAlphas(input, core);
  const referencePoints = computeStackReferencePoints(input, core, stack);
  const physical = computePhysicalBorder(input, core, stack);
  const visible = computeVisibleBorder(input, core, stack);
  const surfaces = {
    glass: sampleGlassSection(input),
    stack: sampleStackSection(input, core)
  };

  return {
    input: { ...input },
    validation,
    core,
    stack,
    referencePoints,
    border: {
      physical,
      visible
    },
    samples: surfaces.glass,
    surfaces,
    metadata: {
      units: "mm",
      bendingBasis: "Glass Bottom Surface",
      borderDistanceBasis: "Top View / u-axis straight projection"
    }
  };
}
