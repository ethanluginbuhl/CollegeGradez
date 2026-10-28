const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { validateData } = require("./data-schema");

function emptyData() {
  return { courses: [] };
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function readData(file) {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    return validateData(parsed);
  } catch (error) {
    if (error.code === "ENOENT") {
      return emptyData();
    }
    const backup = `${file}.corrupt-${Date.now()}`;
    try {
      fs.renameSync(file, backup);
      console.error(`Invalid grades data moved to ${backup}:`, error);
    } catch (backupError) {
      console.error("Failed to preserve invalid grades data:", backupError);
    }
    throw new Error(
      "Your saved grade data could not be read. The original file was preserved for recovery.",
      { cause: error },
    );
  }
}

function removeTemporaryFile(file) {
  try {
    fs.unlinkSync(file);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

function replaceFile(source, target) {
  try {
    fs.renameSync(source, target);
  } catch (error) {
    if (!["EEXIST", "EPERM", "ENOTEMPTY"].includes(error.code)) {
      throw error;
    }
    fs.rmSync(target, { force: true });
    fs.renameSync(source, target);
  }
}

function writeData(data, file) {
  validateData(data);
  const directory = path.dirname(file);
  const temporaryFile = `${file}.tmp-${process.pid}-${crypto.randomUUID()}`;
  fs.mkdirSync(directory, { recursive: true });

  if (fs.existsSync(file)) {
    const backupPrefix = `${path.basename(file)}.backup-`;
    fs.copyFileSync(
      file,
      path.join(directory, `${backupPrefix}${timestamp()}`),
    );
    const backups = fs
      .readdirSync(directory)
      .filter((name) => name.startsWith(backupPrefix))
      .sort()
      .reverse();
    for (const oldBackup of backups.slice(10)) {
      fs.unlinkSync(path.join(directory, oldBackup));
    }
  }

  try {
    fs.writeFileSync(temporaryFile, JSON.stringify(data, null, 2), "utf8");
    replaceFile(temporaryFile, file);
  } finally {
    removeTemporaryFile(temporaryFile);
  }
}

function writeExport(data, file) {
  validateData(data);
  writeJsonFile(data, file);
}

function writeJsonFile(data, file) {
  const temporaryFile = `${file}.tmp-${process.pid}-${crypto.randomUUID()}`;
  try {
    fs.writeFileSync(temporaryFile, JSON.stringify(data, null, 2), "utf8");
    replaceFile(temporaryFile, file);
  } finally {
    removeTemporaryFile(temporaryFile);
  }
}

function readImportFile(file) {
  const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  return validateData(parsed);
}

module.exports = {
  emptyData,
  readData,
  writeData,
  writeExport,
  readImportFile,
};
