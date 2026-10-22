const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

const DATA_FILE = () => path.join(app.getPath("userData"), "grades.json");

function emptyData() {
  return { courses: [] };
}

function createWindow() {
  const win = new BrowserWindow({
    width: 980,
    height: 720,
    minWidth: 720,
    minHeight: 520,
    title: "CollegeGradez",
    icon: path.join(__dirname, 'assets/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.loadFile("index.html");
}

function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE(), "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.courses)) {
      return emptyData();
    }
    return parsed;
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error("Failed to read grades.json:", err);
    }
    return emptyData();
  }
}

function writeData(data) {
  if (!data || !Array.isArray(data.courses)) {
    throw new Error("Invalid data: expected { courses: [] }");
  }
  fs.mkdirSync(path.dirname(DATA_FILE()), { recursive: true });
  fs.writeFileSync(DATA_FILE(), JSON.stringify(data, null, 2), "utf8");
}

app.whenReady().then(() => {
  ipcMain.handle("data:load", () => readData());
  ipcMain.handle("data:save", (_event, data) => {
    writeData(data);
    return true;
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
