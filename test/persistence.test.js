const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  readData,
  writeData,
  writeExport,
  readImportFile,
} = require("../persistence.js");

function validData(courseName = "Biology") {
  return {
    courses: [
      {
        id: "course-1",
        name: courseName,
        gradingMode: "weighted",
        categories: [
          { id: "category-1", name: "Exams", weight: 100, dropLowest: 0 },
        ],
        assignments: [],
      },
    ],
  };
}

function temporaryDirectory() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "collegegradez-"));
}

test("reads empty data when the saved file does not exist", () => {
  const directory = temporaryDirectory();
  assert.deepEqual(readData(path.join(directory, "grades.json")), {
    courses: [],
  });
  fs.rmSync(directory, { recursive: true, force: true });
});

test("writes data atomically and keeps at most ten backups", () => {
  const directory = temporaryDirectory();
  const file = path.join(directory, "grades.json");
  writeData(validData("Initial"), file);
  for (let index = 0; index < 12; index += 1) {
    writeData(validData(`Course ${index}`), file);
  }

  assert.equal(readData(file).courses[0].name, "Course 11");
  assert.ok(
    fs
      .readdirSync(directory)
      .filter((name) => name.startsWith("grades.json.backup-")).length <= 10,
  );
  assert.equal(
    fs.readdirSync(directory).some((name) => name.includes(".tmp-")),
    false,
  );
  fs.rmSync(directory, { recursive: true, force: true });
});

test("preserves invalid saved data before reporting the read failure", () => {
  const directory = temporaryDirectory();
  const file = path.join(directory, "grades.json");
  fs.writeFileSync(file, JSON.stringify({ invalid: true }), "utf8");

  assert.throws(() => readData(file), /could not be read/);
  assert.equal(fs.existsSync(file), false);
  assert.equal(
    fs
      .readdirSync(directory)
      .some((name) => name.startsWith("grades.json.corrupt-")),
    true,
  );
  fs.rmSync(directory, { recursive: true, force: true });
});

test("validates and writes exports", () => {
  const directory = temporaryDirectory();
  const file = path.join(directory, "export.json");
  writeExport(validData(), file);
  assert.deepEqual(readImportFile(file), validData());
  assert.throws(() => writeExport({ invalid: true }, file), /courses array/);
  fs.rmSync(directory, { recursive: true, force: true });
});
