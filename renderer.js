const { swapItems } = window.ArrayOrder;

const homeView = document.getElementById("view-home");
const courseView = document.getElementById("view-course");
const courseList = document.getElementById("course-list");
const homeEmpty = document.getElementById("home-empty");
const courseNameInput = document.getElementById("course-name");
const gradeSummary = document.getElementById("grade-summary");
const courseGpaCard = document.getElementById("course-gpa-card");
const overviewGpaCard = document.getElementById("overview-gpa-card");
const previousCourseList = document.getElementById("previous-course-list");
const previousCoursesEmpty = document.getElementById("previous-courses-empty");
const includeCurrentCoursesInput = document.getElementById(
  "include-current-courses",
);
const transferCompletedCoursesButton = document.getElementById(
  "transfer-completed-courses",
);
const defaultPolicyEditor = document.getElementById("default-policy-editor");
const categoryRows = document.getElementById("category-rows");
const assignmentGroups = document.getElementById("assignment-groups");
const categoriesEmpty = document.getElementById("categories-empty");
const assignmentsEmpty = document.getElementById("assignments-empty");
const dialogEl = document.getElementById("dialog");
const dialogMessage = document.getElementById("dialog-message");
const dialogInput = document.getElementById("dialog-input");
const dialogOk = document.getElementById("dialog-ok");
const dialogCancel = document.getElementById("dialog-cancel");
const appError = document.getElementById("app-error");
const undoNotice = document.getElementById("undo-notice");
const undoMessage = document.getElementById("undo-message");
const undoCourseButton = document.getElementById("undo-course");
const appNotification = window.NotificationUI || {
  clearAppNotification(element) {
    if (!element) {
      return;
    }
    element.classList.add("hidden");
  },
  showAppNotification(element, message) {
    if (!element) {
      return;
    }
    element.textContent = message;
    element.classList.remove("hidden");
  },
};

let data = { courses: [] };
let lastSavedData = { courses: [] };
let currentCourseId = null;
let dialogResolver = null;
let previouslyFocusedElement = null;
let undoState = null;

const defaultGradingPolicy = () => cloneData(Calc.DEFAULT_GRADING_POLICY);

function cloneData(value) {
  return structuredClone(value);
}

function uid() {
  return crypto.randomUUID();
}

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }
  return `${value.toFixed(1)}%`;
}

function formatPoints(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }
  return String(Number(value.toFixed(2)));
}

function formatGpa(value) {
  return value === null || value === undefined || Number.isNaN(value)
    ? "—"
    : value.toFixed(2);
}

function currentCourse() {
  return data.courses.find((course) => course.id === currentCourseId) || null;
}

async function persist() {
  hideUndoNotice();
  try {
    await window.api.save(data);
    lastSavedData = cloneData(data);
    appNotification.clearAppNotification(appError);
  } catch (error) {
    console.error("Failed to save grades:", error);
    data = cloneData(lastSavedData);
    if (courseView.classList.contains("hidden")) {
      renderHome();
    } else {
      renderCourse();
    }
    showAppError(
      error && error.message
        ? `Your change could not be saved: ${error.message}`
        : "Your change could not be saved. Check available disk space and try again.",
    );
    throw error;
  }
}

function hideUndoNotice() {
  undoState = null;
  undoNotice.classList.add("hidden");
}

function showUndoNotice(courseName, previousData) {
  undoState = previousData;
  undoMessage.textContent = `${courseName} deleted.`;
  undoNotice.classList.remove("hidden");
}

async function undoDelete() {
  if (!undoState) {
    return;
  }
  const restoredData = undoState;
  hideUndoNotice();
  data = cloneData(restoredData);
  try {
    await persist();
    renderHome();
    showAppSuccess("Course restored.");
  } catch {
    renderHome();
  }
}

function createOrderControls(itemType, itemId, index, count, onMove) {
  const controls = document.createElement("div");
  controls.className = "order-actions";
  for (const [direction, offset] of [
    ["up", -1],
    ["down", 1],
  ]) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `ghost icon order-${direction}`;
    button.disabled = index + offset < 0 || index + offset >= count;
    button.setAttribute("aria-label", `Move ${itemType} ${direction}`);
    button.title = `Move ${direction}`;
    button.dataset.orderId = itemId;
    const path =
      direction === "up" ? "M12 19V5m-6 6 6-6 6 6" : "M12 5v14m6-6-6 6-6-6";
    button.innerHTML = `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"></path></svg>`;
    button.addEventListener("click", () => onMove(offset, direction));
    controls.appendChild(button);
  }
  return controls;
}

async function reorderItems(
  items,
  firstIndex,
  secondIndex,
  render,
  container,
  itemId,
  controlClass,
) {
  if (!swapItems(items, firstIndex, secondIndex)) {
    return;
  }
  await persist();
  render();
  const focusTarget = Array.from(
    container.querySelectorAll(`.${controlClass}`),
  ).find((button) => button.dataset.orderId === itemId);
  focusTarget?.focus();
}

function closeDialog(result) {
  dialogEl.classList.add("hidden");
  dialogEl.setAttribute("aria-hidden", "true");
  const resolve = dialogResolver;
  dialogResolver = null;
  const focusTarget = previouslyFocusedElement;
  previouslyFocusedElement = null;
  if (resolve) {
    resolve(result);
  }
  if (focusTarget && typeof focusTarget.focus === "function") {
    focusTarget.focus();
  }
}

function openDialog({
  message,
  defaultValue = "",
  showInput = false,
  danger = false,
}) {
  return new Promise((resolve) => {
    dialogResolver = resolve;
    previouslyFocusedElement = document.activeElement;
    dialogMessage.textContent = message;
    dialogInput.classList.toggle("hidden", !showInput);
    dialogInput.value = showInput ? defaultValue : "";
    dialogInput.setAttribute("aria-label", message);
    dialogOk.textContent = danger ? "Delete" : "OK";
    dialogOk.classList.toggle("danger", danger);
    dialogEl.classList.remove("hidden");
    dialogEl.setAttribute("aria-hidden", "false");
    if (showInput) {
      dialogInput.focus();
      dialogInput.select();
    } else {
      dialogOk.focus();
    }
  });
}

function askText(message, defaultValue = "") {
  return openDialog({ message, defaultValue, showInput: true });
}

function askConfirm(message, danger = true) {
  return openDialog({ message, showInput: false, danger });
}

function showAppError(message) {
  appNotification.showAppNotification(appError, message, "error");
}

function showAppSuccess(message) {
  appNotification.showAppNotification(appError, message, "success");
}

dialogOk.addEventListener("click", () => {
  if (dialogInput.classList.contains("hidden")) {
    closeDialog(true);
  } else {
    closeDialog(dialogInput.value);
  }
});
dialogCancel.addEventListener("click", () => closeDialog(null));
dialogEl.addEventListener("click", (event) => {
  if (event.target === dialogEl) {
    closeDialog(null);
  }
});
dialogEl.addEventListener("keydown", (event) => {
  if (event.key !== "Tab") {
    return;
  }
  const focusable = [dialogInput, dialogCancel, dialogOk].filter(
    (element) => !element.classList.contains("hidden") && !element.disabled,
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});
dialogInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    closeDialog(dialogInput.value);
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !dialogEl.classList.contains("hidden")) {
    closeDialog(null);
  }
});

function parseOptionalNumber(raw) {
  if (raw === "" || raw === null || raw === undefined) {
    return null;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function showHome() {
  currentCourseId = null;
  homeView.classList.remove("hidden");
  courseView.classList.add("hidden");
  document.body.classList.remove("points-mode");
  renderHome();
}

function showCourse(courseId) {
  currentCourseId = courseId;
  homeView.classList.add("hidden");
  courseView.classList.remove("hidden");
  renderCourse();
}

function renderGradeSummary(course) {
  const grade = Calc.courseGrade(course);
  const overallLabel =
    course.gradingMode === "points"
      ? `${formatPercent(grade.percent)}  (${formatPoints(grade.earned)}/${formatPoints(grade.possible)})`
      : formatPercent(grade.percent);

  const categoryLines = grade.byCategory
    .map((cat) => {
      const extra =
        course.gradingMode === "weighted" && cat.weight != null
          ? ` · Weight ${Number(cat.weight) || 0}%`
          : "";
      const dropped =
        Number(cat.dropLowest) > 0 ? ` · Drop ${cat.dropLowest}` : "";
      return `<li><span>${escapeHtml(cat.name || "Untitled")}${extra}${dropped}</span><span>${formatPercent(cat.percent)}</span></li>`;
    })
    .join("");
  const configuredWeight = course.categories.reduce(
    (sum, category) => sum + (Number(category.weight) || 0),
    0,
  );
  const activeWeight = grade.byCategory
    .filter((category) => category.hasScored)
    .reduce((sum, category) => sum + (Number(category.weight) || 0), 0);
  const weightedHelp =
    course.gradingMode === "weighted" &&
    (Math.abs(configuredWeight - 100) > 0.01 || activeWeight < configuredWeight)
      ? `<p class="panel-help grade-weight-help">Weighted grades renormalize across categories with scored assignments. Configured weights total ${formatPoints(configuredWeight)}%; active scored categories total ${formatPoints(activeWeight)}%.</p>`
      : "";

  gradeSummary.innerHTML = `
    <p class="overall">Current Grade: ${overallLabel}</p>
    ${weightedHelp}
    <ul>${categoryLines || "<li><span>No categories yet</span><span></span></li>"}</ul>
  `;
}

function renderPolicyEditor(
  container,
  policy,
  onChange,
  { showPoints = true, pointsPolicy = policy } = {},
) {
  const editorOptions = { showPoints, pointsPolicy };
  container.innerHTML = `
    <p class="panel-help policy-help">
      Add bands from highest to lowest minimum percentage. The last band must
      start at 0% so every grade has a result.
    </p>
    <table class="data-table policy-table">
      <thead><tr><th>Letter</th><th>Min %</th>${showPoints ? "<th>Points</th>" : ""}<th></th></tr></thead>
      <tbody></tbody>
    </table>
    <button type="button" class="ghost add-policy-band">Add Grade</button>
    <p class="policy-error hidden" role="alert"></p>
  `;
  const error = container.querySelector(".policy-error");
  function showPolicyError(message) {
    error.textContent = message;
    error.classList.toggle("hidden", !message);
  }
  function validPolicy() {
    let previous = Infinity;
    const letters = new Set();
    for (const band of policy.bands) {
      const normalizedLetter = band.letter.trim().toLowerCase();
      if (
        !normalizedLetter ||
        letters.has(normalizedLetter) ||
        !Number.isFinite(band.minPercent) ||
        band.minPercent < 0 ||
        band.minPercent > 100 ||
        band.minPercent >= previous ||
        !Number.isFinite(band.points) ||
        band.points < 0
      ) {
        return false;
      }
      letters.add(normalizedLetter);
      previous = band.minPercent;
    }
    return policy.bands.length > 0 && previous === 0;
  }
  function pointsForLetter(letter, fallback = 0) {
    return (
      pointsPolicy.bands.find((band) => band.letter === letter)?.points ??
      fallback
    );
  }
  if (!showPoints) {
    for (const band of policy.bands) {
      band.points = pointsForLetter(band.letter, band.points);
    }
  }
  const body = container.querySelector("tbody");
  const rowsByBand = new Map();
  for (const [index, band] of policy.bands.entries()) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><input type="text" class="policy-letter" maxlength="12" aria-label="Grade letter"></td>
      <td><input type="number" class="policy-min" min="0" max="100" step="1" aria-label="Minimum percentage"></td>
      ${showPoints ? '<td><input type="number" class="policy-points" min="0" step="0.05" aria-label="Grade points"></td>' : ""}
      <td><button type="button" class="danger icon remove-policy-band" aria-label="Remove grade band">Remove</button></td>
    `;
    row.querySelector(".policy-letter").value = band.letter;
    row.querySelector(".policy-min").value = band.minPercent;
    if (showPoints) {
      row.querySelector(".policy-points").value = band.points;
    }
    rowsByBand.set(band, row);
    row.querySelectorAll("input").forEach((input) => {
      input.addEventListener("change", async () => {
        band.letter =
          row.querySelector(".policy-letter").value.trim() || "Grade";
        band.minPercent = parseOptionalNumber(
          row.querySelector(".policy-min").value,
        );
        if (showPoints) {
          band.points = parseOptionalNumber(
            row.querySelector(".policy-points").value,
          );
        } else {
          band.points = pointsForLetter(band.letter, band.points);
        }
        if (input.classList.contains("policy-min")) {
          const reordered = Calc.reorderPolicyBands(policy);
          if (!reordered) {
            showPolicyError(
              "Minimum percentages must be unique and between 0% and 100%.",
            );
            return;
          }
          policy.bands.splice(0, policy.bands.length, ...reordered);
          for (const currentBand of policy.bands) {
            body.appendChild(rowsByBand.get(currentBand));
          }
        }
        if (!validPolicy()) {
          showPolicyError(
            "Use unique grade labels, descending minimum percentages ending with a 0% grade, and non-negative points.",
          );
          return;
        }
        showPolicyError("");
        try {
          await onChange();
        } catch {
          showPolicyError("This grading policy could not be saved.");
        }
      });
    });
    row
      .querySelector(".remove-policy-band")
      .addEventListener("click", async () => {
        if (policy.bands.length <= 1) {
          return;
        }
        policy.bands.splice(index, 1);
        if (!validPolicy()) {
          policy.bands.splice(index, 0, band);
          showPolicyError(
            "At least one grade must remain, and the minimum percentages must end at 0%.",
          );
          return;
        }
        try {
          await onChange();
          renderPolicyEditor(container, policy, onChange, editorOptions);
          const nextBand =
            policy.bands[index] || policy.bands[index - 1] || null;
          if (nextBand) {
            const nextIndex = policy.bands.indexOf(nextBand);
            const nextRow = container.querySelectorAll("tbody tr")[nextIndex];
            nextRow?.querySelector(".policy-letter")?.focus();
          }
        } catch {
          showPolicyError("This grading policy could not be saved.");
        }
      });
    body.appendChild(row);
  }
  container
    .querySelector(".add-policy-band")
    .addEventListener("click", async () => {
      const lowest = policy.bands[policy.bands.length - 1];
      const newBand = {
        letter: "New",
        minPercent: Math.min(100, (lowest && lowest.minPercent + 1) || 1),
        points: showPoints ? 0 : pointsForLetter("New"),
      };
      policy.bands.splice(policy.bands.length - 1, 0, newBand);
      try {
        await onChange();
        renderPolicyEditor(container, policy, onChange, editorOptions);
        const newRow =
          container.querySelectorAll("tbody tr")[policy.bands.indexOf(newBand)];
        newRow?.querySelector(".policy-letter")?.focus();
      } catch {
        showPolicyError("This grading policy could not be saved.");
      }
    });
}

function renderCourseGpa(course) {
  const result = Calc.courseGpa(course, data.gradingPolicy);
  courseGpaCard.innerHTML = `
    <h3>Course GPA</h3>
    <p class="gpa-value">${escapeHtml(result.letter || "—")} <span>${formatGpa(result.points)}</span></p>
    <label>
      Credits
      <input id="course-credits" type="number" min="0" step="0.5">
    </label>
    <label class="checkbox-label">
      <input id="course-policy-override" type="checkbox">
      Use a custom policy for this course
    </label>
    <div id="course-policy-editor" class="course-policy-editor"></div>
    <p class="panel-help">${result.eligible ? "Included in overall GPA." : "Complete the course grade and enter positive credits to include it."}</p>
  `;
  const creditsInput = courseGpaCard.querySelector("#course-credits");
  creditsInput.value = course.credits ?? "";
  creditsInput.addEventListener("change", async () => {
    course.credits = parseOptionalNumber(creditsInput.value);
    await persist();
    renderCourse();
  });
  const overrideInput = courseGpaCard.querySelector("#course-policy-override");
  overrideInput.checked = Boolean(course.gradingPolicy);
  overrideInput.addEventListener("change", async () => {
    course.gradingPolicy = overrideInput.checked
      ? cloneData(data.gradingPolicy)
      : null;
    await persist();
    renderCourse();
  });
  if (course.gradingPolicy) {
    renderPolicyEditor(
      courseGpaCard.querySelector("#course-policy-editor"),
      course.gradingPolicy,
      async () => {
        await persist();
        const result = Calc.courseGpa(course, data.gradingPolicy);
        courseGpaCard.querySelector(".gpa-value").innerHTML =
          `${escapeHtml(result.letter || "—")} <span>${formatGpa(result.points)}</span>`;
        courseGpaCard.querySelector(".panel-help").textContent = result.eligible
          ? "Included in overall GPA."
          : "Complete the course grade and enter positive credits to include it.";
      },
      { showPoints: false, pointsPolicy: data.gradingPolicy },
    );
  }
}

function renderOverallGpa(card = overviewGpaCard) {
  const overall = Calc.calculateGpa(data);
  const previousRows = overall.previousCourses
    .map(
      ({ course, result }) =>
        `<li><span>${escapeHtml(course.name || "Untitled")}</span><span>${result.eligible ? `${escapeHtml(result.letter)} (${formatGpa(result.points)})` : "Not yet eligible"}</span></li>`,
    )
    .join("");
  const currentRows = overall.courses
    .map(
      ({ course, result }) =>
        `<li><span>${escapeHtml(course.name || "Untitled")}</span><span>${data.includeCurrentCourses === false ? "Current courses excluded" : result.eligible ? `${escapeHtml(result.letter)} (${formatGpa(result.points)})` : "Not yet eligible"}</span></li>`,
    )
    .join("");
  const divider =
    previousRows && currentRows
      ? '<li class="gpa-course-divider" role="separator"></li>'
      : "";
  const rows = `${previousRows}${divider}${currentRows}`;
  card.innerHTML = `
    <h3>Overall GPA</h3>
    <p class="gpa-value">${formatGpa(overall.gpa)}</p>
    <p class="panel-help">${formatPoints(overall.credits)} eligible credits</p>
    <ul>${rows || "<li><span>No eligible courses yet</span><span></span></li>"}</ul>
  `;
}

function currentPolicy() {
  return data.gradingPolicy || defaultGradingPolicy();
}

function eligibleCurrentCourses() {
  return data.courses.filter((course) => {
    const result = Calc.courseGpa(course, currentPolicy());
    return result.eligible && result.letter;
  });
}

function renderPreviousCourses() {
  const body = previousCourseList.querySelector("tbody");
  body.replaceChildren();
  const previousCourses = data.previousCourses || [];
  previousCoursesEmpty.classList.toggle("hidden", previousCourses.length > 0);
  previousCourseList.classList.toggle("hidden", previousCourses.length === 0);
  includeCurrentCoursesInput.checked = data.includeCurrentCourses !== false;
  transferCompletedCoursesButton.disabled =
    eligibleCurrentCourses().length === 0;

  for (const [index, course] of previousCourses.entries()) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><input class="previous-course-name" type="text" maxlength="120" aria-label="Course name"></td>
      <td><input class="previous-course-credits" type="number" min="0" step="0.5" aria-label="Course credits"></td>
      <td><select class="previous-course-grade" aria-label="Final grade"></select></td>
      <td><div class="previous-course-row-actions"><div class="previous-course-order"></div><button type="button" class="danger previous-course-remove">Remove</button></div></td>
    `;
    const nameInput = row.querySelector(".previous-course-name");
    const creditsInput = row.querySelector(".previous-course-credits");
    const gradeSelect = row.querySelector(".previous-course-grade");
    const removeButton = row.querySelector(".previous-course-remove");
    row
      .querySelector(".previous-course-order")
      .replaceWith(
        createOrderControls(
          `${course.name || "course"} from previously taken courses`,
          course.id,
          index,
          previousCourses.length,
          (offset, direction) =>
            reorderItems(
              data.previousCourses,
              index,
              index + offset,
              renderHome,
              body,
              course.id,
              `order-${direction}`,
            ),
        ),
      );
    nameInput.value = course.name;
    creditsInput.value = course.credits;
    removeButton.setAttribute(
      "aria-label",
      `Remove ${course.name} from previously taken courses`,
    );
    gradeSelect.add(new Option("Choose a grade", ""));
    for (const band of currentPolicy().bands) {
      gradeSelect.add(new Option(band.letter, band.letter));
    }
    if (
      course.grade &&
      !currentPolicy().bands.some((band) => band.letter === course.grade)
    ) {
      const savedGradeDescription = Number.isFinite(course.gradePoints)
        ? "saved grade points"
        : "not in current policy";
      gradeSelect.add(
        new Option(`${course.grade} (${savedGradeDescription})`, course.grade),
      );
    }
    gradeSelect.value = course.grade;

    const saveCourse = async () => {
      course.name = nameInput.value.trim() || "Untitled course";
      course.credits = parseOptionalNumber(creditsInput.value) ?? 0;
      course.grade = gradeSelect.value;
      nameInput.value = course.name;
      creditsInput.value = course.credits;
      try {
        await persist();
        renderOverallGpa(overviewGpaCard);
        transferCompletedCoursesButton.disabled =
          eligibleCurrentCourses().length === 0;
      } catch (error) {
        console.error("Failed to save previously taken course:", error);
      }
    };
    nameInput.addEventListener("change", saveCourse);
    creditsInput.addEventListener("change", saveCourse);
    gradeSelect.addEventListener("change", saveCourse);
    removeButton.addEventListener("click", async () => {
      const confirmed = await askConfirm(
        `Remove “${course.name}” from previously taken courses?`,
      );
      if (!confirmed) {
        return;
      }
      data.previousCourses = data.previousCourses.filter(
        (previousCourse) => previousCourse.id !== course.id,
      );
      try {
        await persist();
        renderHome();
      } catch (error) {
        console.error("Failed to remove previously taken course:", error);
      }
    });
    body.appendChild(row);
  }
}

function renderHome() {
  courseList.innerHTML = "";
  homeEmpty.classList.toggle(
    "hidden",
    data.courses.length > 0 || (data.previousCourses || []).length > 0,
  );
  renderOverallGpa(overviewGpaCard);
  renderPreviousCourses();
  renderPolicyEditor(defaultPolicyEditor, data.gradingPolicy, async () => {
    await persist();
    renderOverallGpa(overviewGpaCard);
    renderPreviousCourses();
  });

  for (const [index, course] of data.courses.entries()) {
    const grade = Calc.courseGrade(course);
    const gpa = Calc.courseGpa(course, data.gradingPolicy);
    const item = document.createElement("li");
    item.className = "course-card";
    item.innerHTML = `
      <button type="button" class="open">
        <span class="course-card-title"></span>
        <span class="grade-display">
          <span class="grade"></span>
          <span class="grade-letter"></span>
        </span>
        <span class="course-card-meta"></span>
      </button>
      <div class="course-actions">
        <button type="button" class="ghost rename">Rename</button>
        <button type="button" class="danger delete">Delete</button>
      </div>
    `;
    item.querySelector(".course-card-title").textContent =
      course.name || "Untitled course";
    item.querySelector(".grade").textContent = formatPercent(grade.percent);
    item.querySelector(".grade-letter").textContent = gpa.letter || "—";
    item.querySelector(".course-card-meta").textContent =
      `${formatPoints(course.credits)} credits · ${course.gradingMode === "points" ? "Points" : "Weighted"} · ${data.includeCurrentCourses === false ? "Excluded from overall GPA" : gpa.eligible ? "Included in GPA" : "Not yet in GPA"}`;
    item
      .querySelector(".open")
      .addEventListener("click", () => showCourse(course.id));
    item.querySelector(".rename").addEventListener("click", async () => {
      const next = await askText("Course name", course.name);
      if (next === null) {
        return;
      }
      course.name = next.trim() || "Untitled course";
      await persist();
      renderHome();
    });
    item.querySelector(".delete").addEventListener("click", async () => {
      const ok = await askConfirm(`Delete “${course.name}”?`);
      if (!ok) {
        return;
      }
      const previousData = cloneData(data);
      data.courses = data.courses.filter(
        (itemCourse) => itemCourse.id !== course.id,
      );
      await persist();
      renderHome();
      showUndoNotice(course.name || "Course", previousData);
    });
    item
      .querySelector(".course-actions")
      .prepend(
        createOrderControls(
          `${course.name || "course"} course`,
          course.id,
          index,
          data.courses.length,
          (offset, direction) =>
            reorderItems(
              data.courses,
              index,
              index + offset,
              renderHome,
              courseList,
              course.id,
              `order-${direction}`,
            ),
        ),
      );
    courseList.appendChild(item);
  }
}

function renderCourse() {
  const course = currentCourse();
  if (!course) {
    showHome();
    return;
  }

  document.body.classList.toggle(
    "points-mode",
    course.gradingMode === "points",
  );
  courseNameInput.value = course.name;
  document.querySelector(
    `input[name="grading-mode"][value="${course.gradingMode}"]`,
  ).checked = true;

  renderCourseGpa(course);
  renderGradeSummary(course);

  categoriesEmpty.classList.toggle("hidden", course.categories.length > 0);
  categoryRows.innerHTML = "";
  for (const [index, category] of course.categories.entries()) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td data-label="Name"><input type="text" class="cat-name" maxlength="80" aria-label="Category name" /></td>
      <td data-label="Weight %" class="weight-col"><input type="number" class="cat-weight" min="0" step="1" aria-label="Category weight percentage" /></td>
      <td data-label="Drop Lowest"><input type="number" class="cat-drop" min="0" step="1" aria-label="Assignments to drop" /></td>
      <td data-label="Actions"><div class="row-actions"><div class="category-order"></div><button type="button" class="danger icon remove-category" aria-label="Remove category">Remove</button></div></td>
    `;
    const nameInput = row.querySelector(".cat-name");
    const weightInput = row.querySelector(".cat-weight");
    const dropInput = row.querySelector(".cat-drop");
    nameInput.value = category.name;
    weightInput.value = category.weight;
    dropInput.value = category.dropLowest;
    nameInput.addEventListener("change", async () => {
      category.name = nameInput.value.trim() || "Untitled";
      await persist();
      renderGradeSummary(course);
    });
    weightInput.addEventListener("change", async () => {
      const value = Number(weightInput.value);
      category.weight = Number.isFinite(value) ? value : 0;
      await persist();
      renderGradeSummary(course);
    });
    dropInput.addEventListener("change", async () => {
      const value = Math.max(0, Math.floor(Number(dropInput.value) || 0));
      category.dropLowest = value;
      dropInput.value = value;
      await persist();
      renderGradeSummary(course);
    });
    row
      .querySelector(".remove-category")
      .addEventListener("click", async () => {
        const ok = await askConfirm(
          `Remove category “${category.name}”? Assignments in it will be unassigned.`,
        );
        if (!ok) {
          return;
        }
        course.categories = course.categories.filter(
          (item) => item.id !== category.id,
        );
        for (const assignment of course.assignments) {
          if (assignment.categoryId === category.id) {
            assignment.categoryId = null;
          }
        }
        await persist();
        renderCourse();
      });
    row
      .querySelector(".category-order")
      .replaceWith(
        createOrderControls(
          `${category.name || "category"} category`,
          category.id,
          index,
          course.categories.length,
          (offset, direction) =>
            reorderItems(
              course.categories,
              index,
              index + offset,
              renderCourse,
              categoryRows,
              category.id,
              `order-${direction}`,
            ),
        ),
      );
    categoryRows.appendChild(row);
  }

  assignmentsEmpty.classList.toggle(
    "hidden",
    course.categories.length > 0 || course.assignments.length > 0,
  );
  assignmentGroups.innerHTML = "";

  function renderAssignmentRow(assignment, tableBody, assignments, index) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td data-label="Name"><input type="text" class="asg-name" maxlength="120" aria-label="Assignment name" /></td>
      <td data-label="Earned"><input type="number" class="asg-earned" min="0" step="0.5" aria-label="Points earned" /></td>
      <td data-label="Possible"><input type="number" class="asg-possible" min="0" step="0.5" aria-label="Possible points" /></td>
      <td data-label="Actions"><div class="row-actions"><div class="assignment-order"></div><button type="button" class="danger icon remove-assignment" aria-label="Remove assignment">Remove</button></div></td>
    `;
    const nameInput = row.querySelector(".asg-name");
    const earnedInput = row.querySelector(".asg-earned");
    const possibleInput = row.querySelector(".asg-possible");
    nameInput.value = assignment.name;
    earnedInput.value = assignment.earned ?? "";
    possibleInput.value = assignment.possible ?? "";

    nameInput.addEventListener("change", async () => {
      assignment.name = nameInput.value.trim() || "Untitled";
      await persist();
      renderGradeSummary(course);
    });
    earnedInput.addEventListener("change", async () => {
      assignment.earned = parseOptionalNumber(earnedInput.value);
      await persist();
      renderGradeSummary(course);
    });
    possibleInput.addEventListener("change", async () => {
      assignment.possible = parseOptionalNumber(possibleInput.value);
      await persist();
      renderGradeSummary(course);
    });
    row
      .querySelector(".remove-assignment")
      .addEventListener("click", async () => {
        course.assignments = course.assignments.filter(
          (item) => item.id !== assignment.id,
        );
        await persist();
        renderCourse();
      });
    row
      .querySelector(".assignment-order")
      .replaceWith(
        createOrderControls(
          `${assignment.name || "assignment"} assignment`,
          assignment.id,
          index,
          assignments.length,
          (offset, direction) =>
            reorderItems(
              course.assignments,
              course.assignments.indexOf(assignment),
              course.assignments.indexOf(assignments[index + offset]),
              renderCourse,
              assignmentGroups,
              assignment.id,
              `order-${direction}`,
            ),
        ),
      );
    tableBody.appendChild(row);
  }

  function renderAssignmentGroup(category, assignments) {
    const group = document.createElement("section");
    group.className = "assignment-group";
    const title = category ? category.name || "Untitled" : "Unassigned";
    const detail = category
      ? course.gradingMode === "weighted"
        ? `${Number(category.weight) || 0}% of course grade`
        : "Points Mode"
      : "Choose a category by adding assignments from a category block";
    group.innerHTML = `
      <div class="assignment-group-header">
        <div>
          <h4></h4>
          <p></p>
        </div>
        ${category ? '<button type="button" class="add-group-assignment">Add Assignment</button>' : ""}
      </div>
    `;
    group.querySelector("h4").textContent = title;
    group.querySelector("p").textContent = detail;

    if (assignments.length === 0) {
      const empty = document.createElement("p");
      empty.className = "assignment-group-empty";
      empty.textContent = category
        ? "No assignments in this category yet."
        : "These assignments are not currently in a category.";
      group.appendChild(empty);
    } else {
      const table = document.createElement("table");
      table.className = "data-table assignment-table";
      table.innerHTML = `
        <thead>
          <tr>
            <th>Name</th>
            <th>Earned</th>
            <th>Possible</th>
            <th>Actions</th>
          </tr>
        </thead>
      `;
      const body = document.createElement("tbody");
      for (const [index, assignment] of assignments.entries()) {
        renderAssignmentRow(assignment, body, assignments, index);
      }
      table.appendChild(body);
      group.appendChild(table);
    }

    const addButton = group.querySelector(".add-group-assignment");
    if (addButton) {
      addButton.addEventListener("click", () => addAssignment(category.id));
    }
    assignmentGroups.appendChild(group);
  }

  for (const category of course.categories) {
    renderAssignmentGroup(
      category,
      course.assignments.filter(
        (assignment) => assignment.categoryId === category.id,
      ),
    );
  }

  const unassigned = course.assignments.filter(
    (assignment) =>
      !course.categories.some(
        (category) => category.id === assignment.categoryId,
      ),
  );
  if (unassigned.length > 0) {
    renderAssignmentGroup(null, unassigned);
  }
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function addCourse() {
  const name = await askText("Course name", "New course");
  if (name === null) {
    return;
  }
  const categoryId = uid();
  data.courses.push({
    id: uid(),
    name: name.trim() || "Untitled course",
    gradingMode: "weighted",
    credits: 3,
    gradingPolicy: null,
    categories: [
      { id: categoryId, name: "Assignments", weight: 100, dropLowest: 0 },
    ],
    assignments: [],
  });
  await persist();
  renderHome();
}

document
  .getElementById("add-previous-course")
  .addEventListener("click", async () => {
    if (!Array.isArray(data.previousCourses)) {
      data.previousCourses = [];
    }
    data.previousCourses.push({
      id: uid(),
      name: "New course",
      credits: 3,
      grade: "",
    });
    try {
      await persist();
      renderHome();
      previousCourseList
        .querySelector("tbody")
        .lastElementChild?.querySelector(".previous-course-name")
        ?.focus();
    } catch (error) {
      console.error("Failed to add previously taken course:", error);
    }
  });

includeCurrentCoursesInput.addEventListener("change", async () => {
  data.includeCurrentCourses = includeCurrentCoursesInput.checked;
  try {
    await persist();
    renderHome();
    includeCurrentCoursesInput.focus();
  } catch (error) {
    console.error("Failed to update GPA course inclusion:", error);
  }
});

transferCompletedCoursesButton.addEventListener("click", async () => {
  const completedCourses = eligibleCurrentCourses();
  if (completedCourses.length === 0) {
    return;
  }
  const confirmed = await askConfirm(
    `Move ${completedCourses.length} eligible current ${completedCourses.length === 1 ? "course" : "courses"} to history? Courses without a completed grade and positive credits will stay active.`,
    false,
  );
  if (!confirmed) {
    return;
  }
  if (!Array.isArray(data.previousCourses)) {
    data.previousCourses = [];
  }
  const transferredIds = new Set(completedCourses.map((course) => course.id));
  for (const course of completedCourses) {
    const result = Calc.courseGpa(course, currentPolicy());
    data.previousCourses.push({
      id: uid(),
      name: course.name || "Untitled course",
      credits: result.credits,
      grade: result.letter,
      gradePoints: result.points,
    });
  }
  data.courses = data.courses.filter(
    (course) => !transferredIds.has(course.id),
  );
  try {
    await persist();
    renderHome();
    showAppSuccess(
      `${completedCourses.length} ${completedCourses.length === 1 ? "course" : "courses"} moved to previously taken courses.`,
    );
  } catch (error) {
    console.error("Failed to move completed courses:", error);
  }
});

document.getElementById("add-course").addEventListener("click", addCourse);
document.getElementById("back-home").addEventListener("click", showHome);
document.getElementById("delete-course").addEventListener("click", async () => {
  const course = currentCourse();
  if (!course) {
    return;
  }
  const ok = await askConfirm(`Delete “${course.name}”?`);
  if (!ok) {
    return;
  }
  const previousData = cloneData(data);
  data.courses = data.courses.filter((item) => item.id !== course.id);
  await persist();
  showHome();
  showUndoNotice(course.name || "Course", previousData);
});

courseNameInput.addEventListener("change", async () => {
  const course = currentCourse();
  if (!course) {
    return;
  }
  course.name = courseNameInput.value.trim() || "Untitled course";
  await persist();
});

for (const input of document.querySelectorAll('input[name="grading-mode"]')) {
  input.addEventListener("change", async () => {
    const course = currentCourse();
    if (!course) {
      return;
    }
    course.gradingMode = input.value;
    await persist();
    renderCourse();
  });
}

document.getElementById("add-category").addEventListener("click", async () => {
  const course = currentCourse();
  if (!course) {
    return;
  }
  course.categories.push({
    id: uid(),
    name: "New category",
    weight: 0,
    dropLowest: 0,
  });
  await persist();
  renderCourse();
});

async function addAssignment(categoryId) {
  const course = currentCourse();
  if (!course) {
    return;
  }
  course.assignments.push({
    id: uid(),
    name: "New assignment",
    categoryId: categoryId || null,
    earned: null,
    possible: null,
  });
  await persist();
  renderCourse();
}

async function init() {
  if (!window.api) {
    document
      .querySelectorAll("button, input")
      .forEach((element) => (element.disabled = true));
    showAppError(
      "The desktop data bridge is unavailable. Restart CollegeGradez or reinstall the application.",
    );
    return;
  }
  try {
    data = await window.api.load();
  } catch (error) {
    console.error("Failed to load grades:", error);
    showAppError(
      "Your saved grades could not be loaded. The original data was preserved.",
    );
    data = { courses: [], gradingPolicy: defaultGradingPolicy() };
  }
  if (!data || !Array.isArray(data.courses)) {
    data = { courses: [] };
  }
  if (!data.gradingPolicy) {
    data.gradingPolicy = defaultGradingPolicy();
  }
  lastSavedData = cloneData(data);
  showHome();
}

init();

document.getElementById("export-data").addEventListener("click", async () => {
  try {
    const exported = await window.api.export(data);
    if (exported) {
      showAppSuccess("Grade data exported successfully.");
    }
  } catch (error) {
    console.error("Failed to export grades:", error);
    showAppError("Grade data could not be exported.");
  }
});

document.getElementById("import-data").addEventListener("click", async () => {
  let imported;
  try {
    imported = await window.api.import();
  } catch (error) {
    console.error("Failed to import grades:", error);
    showAppError(
      "That file could not be imported. Choose a valid CollegeGradez JSON export.",
    );
    return;
  }
  if (!imported) {
    return;
  }

  const confirmed = await askConfirm(
    "Importing will replace all current courses. Continue?",
    false,
  );
  if (!confirmed) {
    return;
  }

  data = imported;
  if (!data.gradingPolicy) {
    data.gradingPolicy = defaultGradingPolicy();
  }
  try {
    await persist();
    currentCourseId = null;
    showHome();
    showAppSuccess("Grade data imported successfully.");
  } catch {
    currentCourseId = null;
  }
});

document
  .getElementById("empty-add-course")
  .addEventListener("click", addCourse);
undoCourseButton.addEventListener("click", undoDelete);
