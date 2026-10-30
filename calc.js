(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.Calc = api;
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  const DEFAULT_GRADING_POLICY = {
    bands: [
      { letter: "A", minPercent: 93, points: 4 },
      { letter: "A-", minPercent: 90, points: 3.7 },
      { letter: "B+", minPercent: 87, points: 3.3 },
      { letter: "B", minPercent: 83, points: 3 },
      { letter: "B-", minPercent: 80, points: 2.7 },
      { letter: "C+", minPercent: 77, points: 2.3 },
      { letter: "C", minPercent: 73, points: 2 },
      { letter: "C-", minPercent: 70, points: 1.7 },
      { letter: "D", minPercent: 60, points: 1 },
      { letter: "F", minPercent: 0, points: 0 },
    ],
  };

  function isComplete(assignment) {
    return isNumber(assignment.earned) && isNumber(assignment.possible);
  }

  function isNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function isDroppable(assignment) {
    return isComplete(assignment) && assignment.possible > 0;
  }

  function percentOf(assignment) {
    return assignment.earned / assignment.possible;
  }

  function dropLowest(assignments, n) {
    const list = Array.isArray(assignments) ? assignments.slice() : [];
    const count = Math.max(0, Math.floor(Number(n) || 0));
    if (count === 0) {
      return list;
    }

    const droppable = list.filter(isDroppable);
    // Only drop once there are more scored assignments than the drop count,
    // so a lone mid-semester score is not removed.
    if (droppable.length <= count) {
      return list;
    }
    droppable.sort((a, b) => percentOf(a) - percentOf(b));
    const toDrop = new Set(droppable.slice(0, count));
    return list.filter((assignment) => !toDrop.has(assignment));
  }

  function categoryAssignments(category, assignments) {
    const id = category && category.id;
    return (assignments || []).filter((item) => item.categoryId === id);
  }

  function categoryResult(category, assignments) {
    const remaining = dropLowest(
      categoryAssignments(category, assignments),
      category && category.dropLowest,
    );
    const scored = remaining.filter(isComplete);
    const earned = scored.reduce((sum, item) => sum + item.earned, 0);
    const possible = scored.reduce((sum, item) => sum + item.possible, 0);
    const hasScored = remaining.some(isDroppable);
    return {
      categoryId: category && category.id,
      name: category && category.name,
      weight: category && category.weight,
      dropLowest: category && category.dropLowest,
      earned,
      possible,
      percent: possible > 0 ? (earned / possible) * 100 : null,
      hasScored,
      remaining,
    };
  }

  function courseGrade(course) {
    const categories = (course && course.categories) || [];
    const assignments = (course && course.assignments) || [];
    const byCategory = categories.map((category) =>
      categoryResult(category, assignments),
    );

    const mode =
      course && course.gradingMode === "points" ? "points" : "weighted";

    if (mode === "points") {
      const earned = byCategory.reduce((sum, cat) => sum + cat.earned, 0);
      const possible = byCategory.reduce((sum, cat) => sum + cat.possible, 0);
      return {
        percent: possible > 0 ? (earned / possible) * 100 : null,
        earned,
        possible,
        byCategory,
        mode,
      };
    }

    const active = byCategory.filter(
      (cat) => cat.hasScored && cat.percent !== null,
    );
    const weightSum = active.reduce(
      (sum, cat) => sum + (Number(cat.weight) || 0),
      0,
    );
    if (active.length === 0 || weightSum <= 0) {
      return { percent: null, earned: 0, possible: 0, byCategory, mode };
    }

    const weighted = active.reduce(
      (sum, cat) => sum + cat.percent * (Number(cat.weight) || 0),
      0,
    );

    return {
      percent: weighted / weightSum,
      earned: active.reduce((sum, cat) => sum + cat.earned, 0),
      possible: active.reduce((sum, cat) => sum + cat.possible, 0),
      byCategory,
      mode,
    };
  }

  function gradingPolicyFor(course, defaultPolicy) {
    return course && course.gradingPolicy
      ? course.gradingPolicy
      : defaultPolicy || DEFAULT_GRADING_POLICY;
  }

  function letterGrade(percent, policy) {
    if (!isNumber(percent) || !policy || !Array.isArray(policy.bands)) {
      return null;
    }
    return policy.bands.find((band) => percent >= band.minPercent) || null;
  }

  function reorderPolicyBands(policy) {
    if (
      !policy ||
      !Array.isArray(policy.bands) ||
      policy.bands.some(
        (band) =>
          !isNumber(band.minPercent) ||
          band.minPercent < 0 ||
          band.minPercent > 100,
      )
    ) {
      return null;
    }
    const reordered = [...policy.bands].sort(
      (left, right) => right.minPercent - left.minPercent,
    );
    for (let index = 1; index < reordered.length; index += 1) {
      if (reordered[index].minPercent === reordered[index - 1].minPercent) {
        return null;
      }
    }
    return reordered;
  }

  function courseGpa(course, defaultPolicy) {
    const grade = courseGrade(course);
    const band = letterGrade(
      grade.percent,
      gradingPolicyFor(course, defaultPolicy),
    );
    const universityBand =
      course && course.gradingPolicy && defaultPolicy && band
        ? defaultPolicy.bands.find((item) => item.letter === band.letter)
        : null;
    return {
      percent: grade.percent,
      letter: band ? band.letter : null,
      points: band
        ? universityBand
          ? universityBand.points
          : band.points
        : null,
      credits:
        isNumber(course && course.credits) && course.credits > 0
          ? course.credits
          : null,
      eligible: Boolean(
        band &&
        isNumber(course && course.credits) &&
        course.credits > 0 &&
        isNumber(grade.percent),
      ),
    };
  }

  function calculateGpa(data) {
    const courses = (data && data.courses) || [];
    const defaultPolicy =
      data && data.gradingPolicy ? data.gradingPolicy : DEFAULT_GRADING_POLICY;
    const courseResults = courses.map((course) => ({
      course,
      result: courseGpa(course, defaultPolicy),
    }));
    const eligible = courseResults.filter((item) => item.result.eligible);
    const credits = eligible.reduce(
      (sum, item) => sum + item.result.credits,
      0,
    );
    return {
      courses: courseResults,
      credits,
      points: eligible.reduce(
        (sum, item) => sum + item.result.points * item.result.credits,
        0,
      ),
      gpa:
        credits > 0
          ? eligible.reduce(
              (sum, item) => sum + item.result.points * item.result.credits,
              0,
            ) / credits
          : null,
    };
  }

  return {
    DEFAULT_GRADING_POLICY,
    dropLowest,
    categoryResult,
    courseGrade,
    letterGrade,
    reorderPolicyBands,
    courseGpa,
    calculateGpa,
  };
});
