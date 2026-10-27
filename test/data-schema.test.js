const test = require("node:test");
const assert = require("node:assert/strict");
const { validateData } = require("../data-schema.js");

function validData() {
  return {
    courses: [
      {
        id: "course-1",
        name: "Biology",
        gradingMode: "weighted",
        categories: [
          { id: "category-1", name: "Exams", weight: 60, dropLowest: 0 },
        ],
        assignments: [
          {
            id: "assignment-1",
            name: "Midterm",
            categoryId: "category-1",
            earned: 90,
            possible: 100,
          },
        ],
      },
    ],
  };
}

test("accepts valid grade data", () => {
  assert.deepEqual(validateData(validData()), validData());
});

test("rejects invalid grading modes", () => {
  const data = validData();
  data.courses[0].gradingMode = "average";
  assert.throws(() => validateData(data), /invalid grading mode/);
});

test("rejects assignments that reference missing categories", () => {
  const data = validData();
  data.courses[0].assignments[0].categoryId = "missing";
  assert.throws(() => validateData(data), /invalid category/);
});

test("rejects negative category weights", () => {
  const data = validData();
  data.courses[0].categories[0].weight = -1;
  assert.throws(() => validateData(data), /invalid weight/);
});
