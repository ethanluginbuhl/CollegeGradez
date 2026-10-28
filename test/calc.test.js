const test = require("node:test");
const assert = require("node:assert/strict");
const {
  calculateGpa,
  courseGrade,
  dropLowest,
  letterGrade,
  reorderPolicyBands,
} = require("../calc.js");

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

test("maps percentages using a custom ordered grading policy", () => {
  const policy = {
    bands: [
      { letter: "A", minPercent: 90, points: 4 },
      { letter: "B", minPercent: 80, points: 3 },
      { letter: "F", minPercent: 0, points: 0 },
    ],
  };

  assert.equal(letterGrade(95, policy).letter, "A");
  assert.equal(letterGrade(84, policy).points, 3);
  assert.equal(letterGrade(50, policy).letter, "F");
});

test("reorders policy bands by descending minimum percentage", () => {
  const policy = {
    bands: [
      { letter: "A", minPercent: 90, points: 4 },
      { letter: "F", minPercent: 0, points: 0 },
      { letter: "A+", minPercent: 97, points: 4 },
    ],
  };

  assert.deepEqual(
    reorderPolicyBands(policy).map((band) => band.letter),
    ["A+", "A", "F"],
  );
});

test("rejects duplicate or invalid policy thresholds when reordering", () => {
  assert.equal(
    reorderPolicyBands({
      bands: [
        { letter: "A", minPercent: 90, points: 4 },
        { letter: "B", minPercent: 90, points: 3 },
      ],
    }),
    null,
  );
  assert.equal(
    reorderPolicyBands({
      bands: [
        { letter: "A", minPercent: 101, points: 4 },
        { letter: "F", minPercent: 0, points: 0 },
      ],
    }),
    null,
  );
});

test("calculates a credit-weighted GPA and excludes incomplete courses", () => {
  const data = {
    gradingPolicy: {
      bands: [
        { letter: "A", minPercent: 90, points: 4 },
        { letter: "B", minPercent: 80, points: 3 },
        { letter: "F", minPercent: 0, points: 0 },
      ],
    },
    courses: [
      {
        gradingMode: "points",
        credits: 4,
        categories: [{ id: "all", weight: 100, dropLowest: 0 }],
        assignments: [{ categoryId: "all", earned: 90, possible: 100 }],
      },
      {
        gradingMode: "points",
        credits: 2,
        categories: [{ id: "all", weight: 100, dropLowest: 0 }],
        assignments: [{ categoryId: "all", earned: 80, possible: 100 }],
      },
      {
        gradingMode: "points",
        credits: 3,
        categories: [{ id: "all", weight: 100, dropLowest: 0 }],
        assignments: [],
      },
    ],
  };

  const result = calculateGpa(data);
  assert.equal(result.credits, 6);
  assert.equal(result.gpa, 11 / 3);
  assert.equal(result.courses[2].result.eligible, false);
});
