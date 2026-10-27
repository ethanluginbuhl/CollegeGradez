const VALID_MODES = new Set(["weighted", "points"]);

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function isNullableNumber(value) {
  return value === null || isFiniteNumber(value);
}

function assertString(value, label) {
  if (typeof value !== "string") {
    throw new Error(`${label} must be a string`);
  }
}

function validateData(data) {
  if (!data || !Array.isArray(data.courses)) {
    throw new Error("Data must contain a courses array");
  }

  for (const [courseIndex, course] of data.courses.entries()) {
    assertString(course.id, `Course ${courseIndex} id`);
    assertString(course.name, `Course ${courseIndex} name`);
    if (!VALID_MODES.has(course.gradingMode)) {
      throw new Error(`Course ${courseIndex} has an invalid grading mode`);
    }
    if (
      !Array.isArray(course.categories) ||
      !Array.isArray(course.assignments)
    ) {
      throw new Error(`Course ${courseIndex} has invalid collections`);
    }

    for (const [categoryIndex, category] of course.categories.entries()) {
      assertString(category.id, `Category ${categoryIndex} id`);
      assertString(category.name, `Category ${categoryIndex} name`);
      if (!isFiniteNumber(category.weight) || category.weight < 0) {
        throw new Error(`Category ${categoryIndex} has an invalid weight`);
      }
      if (!Number.isInteger(category.dropLowest) || category.dropLowest < 0) {
        throw new Error(`Category ${categoryIndex} has an invalid drop count`);
      }
    }

    const categoryIds = new Set(
      course.categories.map((category) => category.id),
    );
    for (const [assignmentIndex, assignment] of course.assignments.entries()) {
      assertString(assignment.id, `Assignment ${assignmentIndex} id`);
      assertString(assignment.name, `Assignment ${assignmentIndex} name`);
      if (
        assignment.categoryId !== null &&
        !categoryIds.has(assignment.categoryId)
      ) {
        throw new Error(
          `Assignment ${assignmentIndex} has an invalid category`,
        );
      }
      if (
        !isNullableNumber(assignment.earned) ||
        !isNullableNumber(assignment.possible) ||
        (assignment.possible !== null && assignment.possible < 0)
      ) {
        throw new Error(`Assignment ${assignmentIndex} has invalid points`);
      }
    }
  }

  return data;
}

module.exports = { validateData };
