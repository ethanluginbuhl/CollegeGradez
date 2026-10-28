const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { validateData } = require("./data-schema");
const {
  readData,
  writeData,
  writeExport,
  readImportFile,
} = require("./persistence");

const DATA_FILE = () => path.join(app.getPath("userData"), "grades.json");
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 980,
    height: 720,
    minWidth: 720,
    minHeight: 520,
    title: "CollegeGradez",
    icon: path.join(__dirname, "assets/icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadFile("index.html");
}

app.whenReady().then(() => {
  ipcMain.handle("data:load", () => readData(DATA_FILE()));
  ipcMain.handle("data:save", (_event, data) => {
    writeData(data, DATA_FILE());
    return true;
  });
  ipcMain.handle("data:export", async (_event, data) => {
    validateData(data);
    const result = await dialog.showSaveDialog(mainWindow, {
      title: "Export grade data",
      defaultPath: "collegegradez-backup.json",
      filters: [{ name: "JSON files", extensions: ["json"] }],
    });
    if (result.canceled || !result.filePath) {
      return false;
    }
    writeExport(data, result.filePath);
    return true;
  });
  ipcMain.handle("data:import", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: "Import grade data",
      properties: ["openFile"],
      filters: [{ name: "JSON files", extensions: ["json"] }],
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return readImportFile(result.filePaths[0]);
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
