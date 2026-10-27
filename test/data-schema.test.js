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

test("rejects duplicate IDs and negative earned points", () => {
  const duplicate = validData();
  duplicate.courses.push({ ...duplicate.courses[0] });
  assert.throws(() => validateData(duplicate), /duplicate id/);

  const negative = validData();
  negative.courses[0].assignments[0].earned = -1;
  assert.throws(() => validateData(negative), /invalid points/);
});

test("accepts custom default and course grading policies", () => {
  const data = validData();
  data.gradingPolicy = {
    bands: [
      { letter: "A+", minPercent: 97, points: 4 },
      { letter: "A", minPercent: 90, points: 4 },
      { letter: "F", minPercent: 0, points: 0 },
    ],
  };
  data.courses[0].credits = 3;
  data.courses[0].gradingPolicy = {
    bands: [
      { letter: "Pass", minPercent: 60, points: 4 },
      { letter: "Fail", minPercent: 0, points: 0 },
    ],
  };
  assert.deepEqual(validateData(data), data);
});

test("rejects unordered grading policy bands and negative credits", () => {
  const unordered = validData();
  unordered.gradingPolicy = {
    bands: [
      { letter: "A", minPercent: 80, points: 4 },
      { letter: "B", minPercent: 90, points: 3 },
      { letter: "F", minPercent: 0, points: 0 },
    ],
  };
  assert.throws(() => validateData(unordered), /invalid band/);

  const negativeCredits = validData();
  negativeCredits.courses[0].credits = -1;
  assert.throws(() => validateData(negativeCredits), /invalid credits/);
});
