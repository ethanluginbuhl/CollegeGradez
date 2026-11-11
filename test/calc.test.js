const test = require("node:test");
const assert = require("node:assert/strict");
const {
  calculateGpa,
  courseGpa,
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

test("includes scored assignments left unassigned after category removal", () => {
  const course = {
    gradingMode: "points",
    categories: [{ id: "remaining", weight: 100, dropLowest: 0 }],
    assignments: [
      { categoryId: "remaining", earned: 40, possible: 50 },
      { categoryId: null, earned: 30, possible: 50 },
      { categoryId: "deleted", earned: 20, possible: 20 },
      { categoryId: null, earned: null, possible: 50 },
    ],
  };

  const result = courseGrade(course);
  assert.equal(result.earned, 90);
  assert.equal(result.possible, 120);
  assert.equal(result.percent, 75);
});

test("excludes incomplete and zero-point assignments from points-mode totals", () => {
  const course = {
    gradingMode: "points",
    categories: [{ id: "all", weight: 100, dropLowest: 0 }],
    assignments: [
      { categoryId: "all", earned: 10, possible: 0 },
      { categoryId: null, earned: 10, possible: null },
      { categoryId: null, earned: null, possible: 10 },
    ],
  };

  const result = courseGrade(course);
  assert.equal(result.earned, 0);
  assert.equal(result.possible, 0);
  assert.equal(result.percent, null);
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

test("uses university GPA points for course-specific thresholds", () => {
  const course = {
    gradingMode: "points",
    gradingPolicy: {
      bands: [
        { letter: "A", minPercent: 95, points: 0 },
        { letter: "B", minPercent: 75, points: 0 },
        { letter: "F", minPercent: 0, points: 0 },
      ],
    },
    categories: [{ id: "all", weight: 100, dropLowest: 0 }],
    assignments: [{ categoryId: "all", earned: 80, possible: 100 }],
  };
  const universityPolicy = {
    bands: [
      { letter: "A", minPercent: 93, points: 4 },
      { letter: "B", minPercent: 83, points: 3 },
      { letter: "F", minPercent: 0, points: 0 },
    ],
  };

  assert.equal(courseGpa(course, universityPolicy).points, 3);
});

test("preserves points for custom course-policy labels", () => {
  const course = {
    gradingMode: "points",
    gradingPolicy: {
      bands: [
        { letter: "Pass", minPercent: 60, points: 4 },
        { letter: "Fail", minPercent: 0, points: 0 },
      ],
    },
    categories: [{ id: "all", weight: 100, dropLowest: 0 }],
    assignments: [{ categoryId: "all", earned: 80, possible: 100 }],
  };
  const universityPolicy = {
    bands: [
      { letter: "A", minPercent: 93, points: 4 },
      { letter: "F", minPercent: 0, points: 0 },
    ],
  };

  assert.equal(courseGpa(course, universityPolicy).letter, "Pass");
  assert.equal(courseGpa(course, universityPolicy).points, 4);
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

test("includes previously taken courses and optionally excludes current courses", () => {
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
        credits: 3,
        categories: [{ id: "all", weight: 100, dropLowest: 0 }],
        assignments: [{ categoryId: "all", earned: 95, possible: 100 }],
      },
    ],
    previousCourses: [
      { id: "past-1", name: "History", credits: 4, grade: "B" },
      { id: "past-2", name: "Elective", credits: 2, grade: "Unknown" },
    ],
  };

  const included = calculateGpa(data);
  assert.equal(included.credits, 7);
  assert.equal(included.gpa, (4 * 3 + 3 * 4) / 7);
  assert.equal(included.previousCourses[1].result.eligible, false);

  data.includeCurrentCourses = false;
  const previousOnly = calculateGpa(data);
  assert.equal(previousOnly.credits, 4);
  assert.equal(previousOnly.gpa, 3);
  assert.equal(previousOnly.courses[0].result.eligible, true);
});

test("preserves transferred grade points when a custom label is absent from the default policy", () => {
  const result = calculateGpa({
    courses: [],
    previousCourses: [
      {
        id: "past-1",
        name: "Seminar",
        credits: 2,
        grade: "Pass",
        gradePoints: 3.5,
      },
    ],
  });

  assert.equal(result.gpa, 3.5);
  assert.equal(result.previousCourses[0].result.letter, "Pass");
});

test("does not include a previously taken course without a selected grade", () => {
  const result = calculateGpa({
    courses: [],
    previousCourses: [
      {
        id: "past-1",
        name: "Incomplete entry",
        credits: 3,
        grade: "",
        gradePoints: 4,
      },
    ],
  });

  assert.equal(result.credits, 0);
  assert.equal(result.gpa, null);
  assert.equal(result.previousCourses[0].result.eligible, false);
});
