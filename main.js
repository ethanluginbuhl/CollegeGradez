const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { validateData } = require("./data-schema");

const DATA_FILE = () => path.join(app.getPath("userData"), "grades.json");
let mainWindow;

function emptyData() {
  return { courses: [] };
}

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

function readData() {
  const file = DATA_FILE();
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    return validateData(parsed);
  } catch (err) {
    if (err.code === "ENOENT") {
      return emptyData();
    }
    const backup = `${file}.corrupt-${Date.now()}`;
    try {
      fs.renameSync(file, backup);
      console.error(`Invalid grades data moved to ${backup}:`, err);
    } catch (backupError) {
      console.error("Failed to preserve invalid grades data:", backupError);
    }
    throw new Error(
      "Your saved grade data could not be read. The original file was preserved for recovery.",
      { cause: err },
    );
  }
}

function writeData(data) {
  validateData(data);
  const file = DATA_FILE();
  const temporaryFile = `${file}.tmp-${process.pid}`;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (fs.existsSync(file)) {
    const backupPrefix = `${path.basename(file)}.backup-`;
    fs.copyFileSync(
      file,
      path.join(path.dirname(file), `${backupPrefix}${timestamp()}`),
    );
    const backups = fs
      .readdirSync(path.dirname(file))
      .filter((name) => name.startsWith(backupPrefix))
      .sort()
      .reverse();
    for (const oldBackup of backups.slice(10)) {
      fs.unlinkSync(path.join(path.dirname(file), oldBackup));
    }
  }
  fs.writeFileSync(temporaryFile, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(temporaryFile, file);
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function readImportFile(file) {
  const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  return validateData(parsed);
}

app.whenReady().then(() => {
  ipcMain.handle("data:load", () => readData());
  ipcMain.handle("data:save", (_event, data) => {
    writeData(data);
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
    fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), "utf8");
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
