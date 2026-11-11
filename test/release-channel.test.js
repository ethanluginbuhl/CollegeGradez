const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const script = path.join(
  __dirname,
  "..",
  "scripts",
  "check-release-channel.js",
);

function checkChannel(version) {
  return spawnSync(process.execPath, [script, ...(version ? [version] : [])], {
    encoding: "utf8",
  });
}

for (const version of [
  "1.0.0",
  "1.0.0+build-1",
  "1.1.0-alpha.1",
  "1.1.0-beta.1+build-1",
]) {
  test(`accepts release channel for ${version}`, () => {
    const result = checkChannel(version);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, "");
  });
}

for (const version of [
  "1.1.0-rc.1",
  "1.1.0-preview.1",
  "1.1.0-1",
  "1.1.0-beta-rc.1",
  "1.1.0-BETA.1",
]) {
  test(`rejects unsupported release channel for ${version}`, () => {
    const result = checkChannel(version);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Unsupported prerelease channel/);
    assert.match(result.stderr, /Use alpha or beta/);
  });
}

test("requires a release version", () => {
  const result = checkChannel();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /A release version is required/);
});
