const version = process.argv[2];

if (!version) {
  console.error("A release version is required.");
  process.exitCode = 1;
} else {
  const versionWithoutBuild = version.split("+", 1)[0];
  const prereleaseStart = versionWithoutBuild.indexOf("-");
  if (prereleaseStart !== -1) {
    const channel = versionWithoutBuild
      .slice(prereleaseStart + 1)
      .split(".", 1)[0];
    if (channel !== "alpha" && channel !== "beta") {
      console.error(
        `Unsupported prerelease channel "${channel}". Use alpha or beta so installations can update to a stable release.`,
      );
      process.exitCode = 1;
    }
  }
}
