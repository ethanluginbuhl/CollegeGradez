const test = require("node:test");
const assert = require("node:assert/strict");
const packageMetadata = require("../package.json");

test("includes all runtime files in the packaged application", () => {
  const packagedFiles = new Set(packageMetadata.build.files);
  const requiredFiles = [
    "calc.js",
    "data-schema.js",
    "index.html",
    "main.js",
    "notification.js",
    "persistence.js",
    "preload.js",
    "renderer.js",
    "styles.css",
  ];

  for (const file of requiredFiles) {
    assert.ok(packagedFiles.has(file), `${file} must be included in the build`);
  }
});
