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
    "update-manager.js",
  ];

  for (const file of requiredFiles) {
    assert.ok(packagedFiles.has(file), `${file} must be included in the build`);
  }
});

test("configures prerelease automatic updates in packaged builds", async () => {
  const { configureAutoUpdater } = require("../update-manager");
  const listeners = new Map();
  let checked = false;
  let installed = false;
  const autoUpdater = {
    on(event, listener) {
      listeners.set(event, listener);
    },
    checkForUpdates() {
      checked = true;
      return Promise.resolve();
    },
    quitAndInstall() {
      installed = true;
    },
  };

  const configured = configureAutoUpdater({
    app: { isPackaged: true },
    autoUpdater,
    dialog: { showMessageBox: () => Promise.resolve({ response: 0 }) },
    getWindow: () => null,
    logger: { info() {}, error() {} },
  });

  assert.equal(configured, true);
  assert.equal(autoUpdater.allowPrerelease, true);
  assert.equal(autoUpdater.autoDownload, true);
  assert.equal(autoUpdater.autoInstallOnAppQuit, false);
  assert.equal(checked, true);
  assert.ok(listeners.has("update-downloaded"));
  assert.ok(listeners.has("error"));

  await listeners.get("update-downloaded")({ version: "0.2.0-beta.3" });
  assert.equal(installed, true);
});

test("does not check for updates during development", () => {
  const { configureAutoUpdater } = require("../update-manager");
  let checked = false;
  const configured = configureAutoUpdater({
    app: { isPackaged: false },
    autoUpdater: {
      checkForUpdates() {
        checked = true;
      },
    },
    dialog: {},
    getWindow: () => null,
  });

  assert.equal(configured, false);
  assert.equal(checked, false);
});
