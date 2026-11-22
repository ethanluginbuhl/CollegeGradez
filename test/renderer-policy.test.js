const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const Calc = require("../calc");

class Element {
  constructor(classes = []) {
    this.classes = new Set(classes);
    this.classList = {
      contains: (name) => this.classes.has(name),
      toggle: (name, force) =>
        force ? this.classes.add(name) : this.classes.delete(name),
    };
    this.listeners = new Map();
    this.value = "";
    this.textContent = "";
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  async dispatch(type) {
    const listener = this.listeners.get(type);
    assert.ok(listener, `Missing ${type} listener`);
    await listener();
  }

  focus() {}
}

class Row {
  set innerHTML(html) {
    this.elements = new Map();
    for (const match of html.matchAll(
      /<(input|button)\b[^>]*class="([^"]+)"/g,
    )) {
      const classes = match[2].split(" ");
      const element = new Element(classes);
      element.tagName = match[1];
      for (const name of classes) {
        this.elements.set(`.${name}`, element);
      }
    }
  }

  querySelector(selector) {
    return this.elements.get(selector);
  }

  querySelectorAll(selector) {
    assert.equal(selector, "input");
    return [...new Set(this.elements.values())].filter(
      (element) => element.tagName === "input",
    );
  }
}

class Editor {
  set innerHTML(_html) {
    this.rows = [];
    this.error = new Element(["hidden"]);
    this.add = new Element(["add-policy-band"]);
    this.body = {
      appendChild: (row) => {
        const index = this.rows.indexOf(row);
        if (index !== -1) {
          this.rows.splice(index, 1);
        }
        this.rows.push(row);
      },
    };
  }

  querySelector(selector) {
    return {
      ".policy-error": this.error,
      ".add-policy-band": this.add,
      tbody: this.body,
    }[selector];
  }

  querySelectorAll(selector) {
    assert.equal(selector, "tbody tr");
    return this.rows;
  }
}

const source = fs.readFileSync(require.resolve("../renderer.js"), "utf8");
function sourceBetween(start, end) {
  const first = source.indexOf(start);
  const last = source.indexOf(end, first);
  assert.ok(first !== -1 && last !== -1, `Could not find ${start}`);
  return source.slice(first, last);
}
const renderPolicyEditor = vm.runInNewContext(
  `${sourceBetween("function parseOptionalNumber(", "function showHome(")}
   ${sourceBetween("function renderPolicyEditor(", "function renderCourseGpa(")}
   renderPolicyEditor;`,
  { Calc, document: { createElement: () => new Row() } },
);

for (const showPoints of [true, false]) {
  test(`removes the selected reordered band in the ${showPoints ? "default" : "course"} policy editor`, async () => {
    const policy = {
      bands: [
        { letter: "A", minPercent: 90, points: 4 },
        { letter: "B", minPercent: 80, points: 3 },
        { letter: "F", minPercent: 0, points: 0 },
      ],
    };
    const editor = new Editor();
    const saves = [];
    renderPolicyEditor(
      editor,
      policy,
      async () => saves.push(structuredClone(policy)),
      { showPoints },
    );

    await editor.add.dispatch("click");
    const newRow = editor.rows[2];
    const minInput = newRow.querySelector(".policy-min");
    minInput.value = "95";
    await minInput.dispatch("change");
    assert.equal(editor.rows[0], newRow);

    await newRow.querySelector(".remove-policy-band").dispatch("click");
    assert.deepEqual(
      policy.bands.map((band) => band.letter),
      ["A", "B", "F"],
    );
    assert.deepEqual(saves.at(-1), policy);

    const savesBeforeInvalidRemoval = saves.length;
    await editor.rows[2].querySelector(".remove-policy-band").dispatch("click");
    assert.deepEqual(
      policy.bands.map((band) => band.letter),
      ["A", "B", "F"],
    );
    assert.equal(saves.length, savesBeforeInvalidRemoval);
    assert.match(editor.error.textContent, /end at 0%/);
  });
}
