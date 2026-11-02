function configureAutoUpdater({
  app,
  autoUpdater,
  dialog,
  getWindow,
  logger = console,
}) {
  if (!app.isPackaged) {
    return false;
  }

  autoUpdater.allowPrerelease = true;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.on("update-available", (info) => {
    logger.info(`Update ${info.version} is available; downloading it.`);
  });
  autoUpdater.on("update-downloaded", async (info) => {
    try {
      const result = await dialog.showMessageBox(getWindow(), {
        type: "info",
        buttons: ["Restart now", "Later"],
        defaultId: 0,
        cancelId: 1,
        title: "Update ready",
        message: `CollegeGradez ${info.version} is ready to install.`,
        detail: "Restart CollegeGradez now to apply the update.",
      });
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    } catch (error) {
      logger.error("Failed to prompt for the downloaded update:", error);
    }
  });
  autoUpdater.on("error", (error) => {
    logger.error("Automatic update failed:", error);
  });
  autoUpdater.checkForUpdates().catch((error) => {
    logger.error("Could not check for updates:", error);
  });
  return true;
}

module.exports = { configureAutoUpdater };
