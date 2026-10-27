const test = require("node:test");
const assert = require("node:assert/strict");
const { courseGrade, dropLowest } = require("../calc.js");

test("calculates weighted grades using scored categories", () => {
  const course = {
    gradingMode: "weighted",
    categories: [
      { id: "homework", weight: 40, dropLowest: 0 },
      { id: "exams", weight: 60, dropLowest: 0 },
      { id: "empty", weight: 20, dropLowest: 0 },
    ],
    assignments: [
      { categoryId: "homework", earned: 90, possible: 100 },
      { categoryId: "exams", earned: 80, possible: 100 },
    ],
  };

  assert.equal(courseGrade(course).percent, 84);
});

test("calculates points grades from total earned and possible points", () => {
  const course = {
    gradingMode: "points",
    categories: [{ id: "all", weight: 100, dropLowest: 0 }],
    assignments: [
      { categoryId: "all", earned: 18, possible: 20 },
      { categoryId: "all", earned: 35, possible: 50 },
    ],
  };

  const result = courseGrade(course);
  assert.equal(result.percent, (53 / 70) * 100);
  assert.equal(result.earned, 53);
  assert.equal(result.possible, 70);
});

test("does not drop all scored assignments", () => {
  const assignments = [
    { earned: 5, possible: 10 },
    { earned: 9, possible: 10 },
  ];

  assert.equal(dropLowest(assignments, 2).length, 2);
  assert.equal(dropLowest(assignments, 1).length, 1);
  assert.equal(dropLowest(assignments, 1)[0].earned, 9);
});
