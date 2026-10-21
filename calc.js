(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.Calc = api;
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
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
      category && category.dropLowest
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
      categoryResult(category, assignments)
    );

    const mode = course && course.gradingMode === "points" ? "points" : "weighted";

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

    const active = byCategory.filter((cat) => cat.hasScored && cat.percent !== null);
    const weightSum = active.reduce((sum, cat) => sum + (Number(cat.weight) || 0), 0);
    if (active.length === 0 || weightSum <= 0) {
      return { percent: null, earned: 0, possible: 0, byCategory, mode };
    }

    const weighted = active.reduce(
      (sum, cat) => sum + cat.percent * (Number(cat.weight) || 0),
      0
    );

    return {
      percent: weighted / weightSum,
      earned: active.reduce((sum, cat) => sum + cat.earned, 0),
      possible: active.reduce((sum, cat) => sum + cat.possible, 0),
      byCategory,
      mode,
    };
  }

  return { dropLowest, categoryResult, courseGrade };
});
