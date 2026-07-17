const INPUT_DEFINITIONS = [
  ["X", "Glass X"],
  ["Y", "Glass Y"],
  ["t", "Glass Thickness"],
  ["R", "Bending R"],
  ["D", "Bending Depth"],
  ["Rc", "Corner Radius Rc"],
  ["ocaThickness", "OCA Thickness"],
  ["panelThickness", "Panel Thickness"],
  ["panelSizeOffset", "Panel Size Offset Arc"],
  ["panelDeadSpace", "Panel Dead Space Arc"]
];

export function mountInputPanel(form, inputs, onChange) {
  form.innerHTML = "";
  for (const [key, labelText] of INPUT_DEFINITIONS) {
    const row = document.createElement("div");
    row.className = "input-row";

    const label = document.createElement("label");
    label.htmlFor = `input-${key}`;
    label.textContent = labelText;

    const input = document.createElement("input");
    input.id = `input-${key}`;
    input.name = key;
    input.type = "number";
    input.step = "0.001";
    input.value = String(inputs[key]);
    input.addEventListener("input", () => onChange(key, Number(input.value)));

    row.append(label, input);
    form.appendChild(row);
  }
}

