import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_INPUTS } from "../src/js/state.js";
import { computeDesignGeometry } from "../src/js/geometry/index.js";
import { renderOverallTopView } from "../src/js/render/overallTopView.js";
import { renderCornerSideView } from "../src/js/render/cornerSideView.js";
import { renderCornerTopView } from "../src/js/render/cornerTopView.js";
import { renderBorderView } from "../src/js/render/borderView.js";

class FakeNode {
  constructor(name) {
    this.name = name;
    this.attributes = new Map();
    this.children = [];
    this.parent = null;
    this.textContent = "";
  }

  setAttribute(key, value) {
    this.attributes.set(key, String(value));
  }

  getAttribute(key) {
    return this.attributes.get(key) ?? null;
  }

  appendChild(node) {
    node.parent = this;
    this.children.push(node);
    return node;
  }

  removeChild(node) {
    const index = this.children.indexOf(node);
    if (index >= 0) {
      this.children.splice(index, 1);
      node.parent = null;
    }
    return node;
  }

  get firstChild() {
    return this.children[0] ?? null;
  }

  queryText() {
    return [this.textContent, ...this.children.map((child) => child.queryText())].filter(Boolean).join(" ");
  }
}

globalThis.document = {
  createElementNS(_namespace, name) {
    return new FakeNode(name);
  }
};

const renderers = [
  ["overallTopView", renderOverallTopView, "X 75.0 mm"],
  ["cornerSideView", renderCornerSideView, "Lb"],
  ["cornerTopView", renderCornerTopView, "Dead arc"],
  ["borderView", renderBorderView, "Physical"]
];

test("all SVG renderers produce non-empty output with dimensions", () => {
  const geometry = computeDesignGeometry(DEFAULT_INPUTS);

  for (const [id, renderer, expectedText] of renderers) {
    const svg = new FakeNode("svg");
    assert.doesNotThrow(() => renderer(svg, geometry, true), id);
    assert.ok(svg.getAttribute("viewBox"), `${id} should set a viewBox`);
    assert.ok(svg.children.length > 0, `${id} should render child nodes`);
    assert.match(svg.queryText(), new RegExp(expectedText), `${id} should include expected dimension text`);
  }
});

