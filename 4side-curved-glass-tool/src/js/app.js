import { createInitialState, DEFAULT_INPUTS } from "./state.js";
import { computeDesignGeometry } from "./geometry/index.js";
import { mountInputPanel } from "./ui/inputPanel.js";
import { renderOutputPanel, renderValidation } from "./ui/outputPanel.js";
import { applyViewTransform, bindResetButton, bindViewInteractions, createViewTransform, resetTransform } from "./ui/interaction.js";
import { downloadBlob, downloadJson, readJsonFile } from "./export/jsonExport.js";
import { derivedGeometryRows, rowsToCsv } from "./export/csvExport.js";
import { downloadSvg } from "./export/imageExport.js";
import { renderOverallTopView } from "./render/overallTopView.js";
import { renderCornerSideView } from "./render/cornerSideView.js";
import { renderCornerTopView } from "./render/cornerTopView.js";
import { renderBorderView } from "./render/borderView.js";
import { renderError } from "./render/viewTransform.js";

const state = createInitialState();

const elements = {
  form: document.querySelector("#inputForm"),
  derivedList: document.querySelector("#derivedList"),
  validationMessages: document.querySelector("#validationMessages"),
  statusBadge: document.querySelector("#statusBadge"),
  showDimensions: document.querySelector("#showDimensions"),
  resetViewButton: document.querySelector("#resetViewButton"),
  saveJsonButton: document.querySelector("#saveJsonButton"),
  loadJsonButton: document.querySelector("#loadJsonButton"),
  saveCsvButton: document.querySelector("#saveCsvButton"),
  saveSvgButton: document.querySelector("#saveSvgButton"),
  jsonFileInput: document.querySelector("#jsonFileInput"),
  overallTopView: document.querySelector("#overallTopView"),
  cornerSideView: document.querySelector("#cornerSideView"),
  cornerTopView: document.querySelector("#cornerTopView"),
  borderView: document.querySelector("#borderView")
};

const renderers = [
  ["overallTopView", renderOverallTopView],
  ["cornerSideView", renderCornerSideView],
  ["cornerTopView", renderCornerTopView],
  ["borderView", renderBorderView]
];

const viewTransforms = Object.fromEntries(renderers.map(([id]) => [id, createViewTransform()]));

let lastGeometry = null;
let resizeFrame = 0;

function renderSingleView(id, renderer, geometry) {
  try {
    renderer(elements[id], geometry, state.showDimensions);
    applyViewTransform(elements[id], viewTransforms[id]);
  } catch (error) {
    console.error(`${id} render failed`, error);
    renderError(elements[id], `${id} render failed`);
  }
}

function renderViews(geometry) {
  for (const [id, renderer] of renderers) {
    renderSingleView(id, renderer, geometry);
  }
}

function render() {
  const geometry = computeDesignGeometry(state.inputs);
  lastGeometry = geometry;
  const visibleReason = geometry.border?.visible?.reason ?? null;

  renderOutputPanel(elements.derivedList, geometry);
  renderValidation(elements.validationMessages, geometry.validation, visibleReason);

  elements.statusBadge.textContent = geometry.validation.isValid ? "Valid" : "Invalid";
  elements.statusBadge.classList.toggle("error", !geometry.validation.isValid);

  renderViews(geometry);
}

function setInputValue(key, value) {
  state.inputs[key] = value;
  render();
}

function resetInputs() {
  state.inputs = { ...DEFAULT_INPUTS };
  mountInputPanel(elements.form, state.inputs, setInputValue);
  render();
}

function resetAllViews() {
  for (const transform of Object.values(viewTransforms)) {
    resetTransform(transform);
  }
  if (lastGeometry) {
    renderViews(lastGeometry);
  }
}

function updateInputs(nextInputs) {
  state.inputs = { ...state.inputs, ...nextInputs };
  mountInputPanel(elements.form, state.inputs, setInputValue);
  render();
}

function exportJson() {
  downloadJson("4side-curved-glass-parameters.json", {
    app: "4-Side Curved Cover Glass Design Tool",
    version: "0.1.0",
    inputs: state.inputs
  });
}

async function importJsonFile(file) {
  const json = await readJsonFile(file);
  const nextInputs = json.inputs && typeof json.inputs === "object" ? json.inputs : json;
  updateInputs(filterKnownInputs(nextInputs));
}

function exportCsv() {
  const geometry = lastGeometry ?? computeDesignGeometry(state.inputs);
  const csv = rowsToCsv(derivedGeometryRows(geometry));
  downloadBlob("4side-curved-glass-derived-parameters.csv", new Blob([csv], { type: "text/csv" }));
}

function exportSvgs() {
  for (const [id] of renderers) {
    downloadSvg(`${id}.svg`, elements[id]);
  }
}

function filterKnownInputs(input) {
  const result = {};
  for (const key of Object.keys(DEFAULT_INPUTS)) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      result[key] = Number(input[key]);
    }
  }
  return result;
}

mountInputPanel(elements.form, state.inputs, setInputValue);
elements.showDimensions.addEventListener("change", () => {
  state.showDimensions = elements.showDimensions.checked;
  render();
});
bindResetButton(elements.resetViewButton, resetAllViews);
elements.saveJsonButton.addEventListener("click", exportJson);
elements.loadJsonButton.addEventListener("click", () => elements.jsonFileInput.click());
elements.saveCsvButton.addEventListener("click", exportCsv);
elements.saveSvgButton.addEventListener("click", exportSvgs);
elements.jsonFileInput.addEventListener("change", async () => {
  const [file] = elements.jsonFileInput.files;
  if (!file) {
    return;
  }
  try {
    await importJsonFile(file);
  } catch (error) {
    console.error("JSON import failed", error);
    elements.statusBadge.textContent = "Import Error";
    elements.statusBadge.classList.add("error");
  } finally {
    elements.jsonFileInput.value = "";
  }
});
render();

const resizeObserver = new ResizeObserver(() => {
  if (!lastGeometry) {
    return;
  }
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => renderViews(lastGeometry));
});

for (const [id] of renderers) {
  bindViewInteractions(elements[id], viewTransforms[id], () => applyViewTransform(elements[id], viewTransforms[id]));
  resizeObserver.observe(elements[id]);
}
