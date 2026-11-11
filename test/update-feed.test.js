const test = require("node:test");
const assert = require("node:assert/strict");
const {
  GitHubProvider,
} = require("electron-updater/out/providers/GitHubProvider");
const { configureAutoUpdater } = require("../update-manager");

async function findUpdate(currentVersion, releases, latestStable) {
  const requests = [];
  const autoUpdater = {
    currentVersion,
    on() {},
    checkForUpdates: () => Promise.resolve(),
  };
  configureAutoUpdater({
    app: { isPackaged: true, getVersion: () => currentVersion },
    autoUpdater,
    dialog: {},
    getWindow: () => null,
  });

  const feed = `<feed>${releases
    .map(
      (version) =>
        `<entry><link href="https://github.com/owner/repo/releases/tag/v${version}"/><title>${version}</title><content>Notes</content></entry>`,
    )
    .join("")}</feed>`;
  const executor = {
    request(options) {
      requests.push(options.path);
      if (options.path === "/owner/repo/releases.atom") {
        return Promise.resolve(feed);
      }
      if (options.path === "/owner/repo/releases/latest") {
        return Promise.resolve(
          JSON.stringify({ tag_name: `v${latestStable}` }),
        );
      }
      for (const version of releases) {
        if (
          options.path ===
          `/owner/repo/releases/download/v${version}/latest.yml`
        ) {
          return Promise.resolve(`version: ${version}\n`);
        }
        if (
          options.path === `/owner/repo/releases/download/v${version}/beta.yml`
        ) {
          return Promise.reject(new Error("Channel metadata not found"));
        }
      }
      throw new Error(`Unexpected update request: ${options.path}`);
    },
  };
  const provider = new GitHubProvider(
    { owner: "owner", repo: "repo" },
    autoUpdater,
    { platform: "win32", executor },
  );
  const update = await provider.getLatestVersion();
  return { update, requests };
}

test("beta installations discover the stable release", async () => {
  const { update, requests } = await findUpdate(
    "0.3.0-beta.1",
    ["1.0.0", "0.3.0-beta.1"],
    "1.0.0",
  );
  assert.equal(update.version, "1.0.0");
  assert.ok(
    requests.includes("/owner/repo/releases/download/v1.0.0/latest.yml"),
  );
});

test("beta installations discover newer betas using latest metadata", async () => {
  const { update, requests } = await findUpdate(
    "1.1.0-beta.1",
    ["1.1.0-beta.2", "1.0.0"],
    "1.0.0",
  );
  assert.equal(update.version, "1.1.0-beta.2");
  assert.ok(
    requests.includes("/owner/repo/releases/download/v1.1.0-beta.2/beta.yml"),
  );
  assert.ok(
    requests.includes("/owner/repo/releases/download/v1.1.0-beta.2/latest.yml"),
  );
});

test("stable installations use the latest stable release despite newer betas", async () => {
  const { update, requests } = await findUpdate(
    "1.0.0",
    ["1.1.0-beta.1", "1.0.1", "1.0.0"],
    "1.0.1",
  );
  assert.equal(update.version, "1.0.1");
  assert.ok(requests.includes("/owner/repo/releases/latest"));
  assert.ok(
    requests.includes("/owner/repo/releases/download/v1.0.1/latest.yml"),
  );
});
