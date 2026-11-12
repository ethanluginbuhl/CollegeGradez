const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { swapItems } = require("../array-order");

test("swaps only the requested items and preserves the rest of the array", () => {
  const items = ["first", "second", "third", "fourth"];

  assert.equal(swapItems(items, 1, 2), true);
  assert.deepEqual(items, ["first", "third", "second", "fourth"]);
});

test("does not reorder when indexes are equal or outside the array", () => {
  const items = ["first", "second"];

  assert.equal(swapItems(items, 0, 0), false);
  assert.equal(swapItems(items, 0, -1), false);
  assert.equal(swapItems(items, 0, 2), false);
  assert.equal(swapItems(items, 1, 0.5), false);
  assert.deepEqual(items, ["first", "second"]);
});

test("rejects values that are not arrays", () => {
  assert.throws(() => swapItems(null, 0, 1), {
    name: "TypeError",
    message: "Items must be an array",
  });
});

test("exposes the ordering helper to the renderer as a browser global", () => {
  const window = {};
  const source = fs.readFileSync(require.resolve("../array-order"), "utf8");

  vm.runInNewContext(source, { window });

  assert.equal(typeof window.ArrayOrder.swapItems, "function");
  assert.equal(window.ArrayOrder.swapItems(["first", "second"], 0, 1), true);
});
