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

function validatePolicy(policy, label) {
  if (!policy || !Array.isArray(policy.bands) || policy.bands.length === 0) {
    throw new Error(`${label} must contain grading bands`);
  }
  let previousThreshold = Infinity;
  const letters = new Set();
  for (const [index, band] of policy.bands.entries()) {
    assertString(band.letter, `${label} band ${index} letter`);
    const normalizedLetter = band.letter.trim().toLowerCase();
    if (
      normalizedLetter === "" ||
      letters.has(normalizedLetter) ||
      !isFiniteNumber(band.minPercent) ||
      band.minPercent < 0 ||
      band.minPercent > 100 ||
      band.minPercent >= previousThreshold ||
      !isFiniteNumber(band.points) ||
      band.points < 0
    ) {
      throw new Error(`${label} has an invalid band`);
    }
    letters.add(normalizedLetter);
    previousThreshold = band.minPercent;
  }
  if (previousThreshold !== 0) {
    throw new Error(`${label} must include a 0 percent band`);
  }
}

function validateData(data) {
  if (!data || !Array.isArray(data.courses)) {
    throw new Error("Data must contain a courses array");
  }
  if (
    data.includeCurrentCourses !== undefined &&
    typeof data.includeCurrentCourses !== "boolean"
  ) {
    throw new Error("Current-course GPA setting must be a boolean");
  }
  if (
    data.previousCourses !== undefined &&
    !Array.isArray(data.previousCourses)
  ) {
    throw new Error("Previously taken courses must be an array");
  }
  if (data.gradingPolicy !== undefined) {
    validatePolicy(data.gradingPolicy, "Default grading policy");
  }

  const courseIds = new Set();
  for (const [courseIndex, course] of data.courses.entries()) {
    assertString(course.id, `Course ${courseIndex} id`);
    if (courseIds.has(course.id)) {
      throw new Error(`Course ${courseIndex} has a duplicate id`);
    }
    courseIds.add(course.id);
    assertString(course.name, `Course ${courseIndex} name`);
    if (
      course.credits !== undefined &&
      (!isFiniteNumber(course.credits) || course.credits < 0)
    ) {
      throw new Error(`Course ${courseIndex} has invalid credits`);
    }
    if (course.gradingPolicy !== undefined && course.gradingPolicy !== null) {
      validatePolicy(
        course.gradingPolicy,
        `Course ${courseIndex} grading policy`,
      );
    }
    if (!VALID_MODES.has(course.gradingMode)) {
      throw new Error(`Course ${courseIndex} has an invalid grading mode`);
    }
    if (
      !Array.isArray(course.categories) ||
      !Array.isArray(course.assignments)
    ) {
      throw new Error(`Course ${courseIndex} has invalid collections`);
    }

    const categoryIds = new Set();
    for (const [categoryIndex, category] of course.categories.entries()) {
      assertString(category.id, `Category ${categoryIndex} id`);
      if (categoryIds.has(category.id)) {
        throw new Error(`Category ${categoryIndex} has a duplicate id`);
      }
      categoryIds.add(category.id);
      assertString(category.name, `Category ${categoryIndex} name`);
      if (!isFiniteNumber(category.weight) || category.weight < 0) {
        throw new Error(`Category ${categoryIndex} has an invalid weight`);
      }
      if (!Number.isInteger(category.dropLowest) || category.dropLowest < 0) {
        throw new Error(`Category ${categoryIndex} has an invalid drop count`);
      }
    }

    const assignmentIds = new Set();
    for (const [assignmentIndex, assignment] of course.assignments.entries()) {
      assertString(assignment.id, `Assignment ${assignmentIndex} id`);
      if (assignmentIds.has(assignment.id)) {
        throw new Error(`Assignment ${assignmentIndex} has a duplicate id`);
      }
      assignmentIds.add(assignment.id);
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
        (assignment.earned !== null && assignment.earned < 0) ||
        (assignment.possible !== null && assignment.possible < 0)
      ) {
        throw new Error(`Assignment ${assignmentIndex} has invalid points`);
      }
    }
  }

  const previousCourseIds = new Set();
  for (const [courseIndex, course] of (data.previousCourses || []).entries()) {
    assertString(course.id, `Previously taken course ${courseIndex} id`);
    if (previousCourseIds.has(course.id)) {
      throw new Error(
        `Previously taken course ${courseIndex} has a duplicate id`,
      );
    }
    previousCourseIds.add(course.id);
    assertString(course.name, `Previously taken course ${courseIndex} name`);
    assertString(course.grade, `Previously taken course ${courseIndex} grade`);
    if (
      course.name.trim() === "" ||
      !isFiniteNumber(course.credits) ||
      course.credits < 0 ||
      (course.gradePoints !== undefined &&
        (!isFiniteNumber(course.gradePoints) || course.gradePoints < 0))
    ) {
      throw new Error(
        `Previously taken course ${courseIndex} has invalid details`,
      );
    }
  }

  return data;
}

module.exports = { validateData };
