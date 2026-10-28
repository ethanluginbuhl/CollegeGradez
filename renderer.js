const homeView = document.getElementById("view-home");
const courseView = document.getElementById("view-course");
const courseList = document.getElementById("course-list");
const homeEmpty = document.getElementById("home-empty");
const courseNameInput = document.getElementById("course-name");
const gradeSummary = document.getElementById("grade-summary");
const courseGpaCard = document.getElementById("course-gpa-card");
const overviewGpaCard = document.getElementById("overview-gpa-card");
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

let data = { courses: [] };
let lastSavedData = { courses: [] };
let currentCourseId = null;
let dialogResolver = null;

const defaultGradingPolicy = () => cloneData(Calc.DEFAULT_GRADING_POLICY);

function cloneData(value) {
  return structuredClone(value);
}

if (!window.api) {
  let memory = { courses: [] };
  window.api = {
    load: async () => memory,
    save: async (next) => {
      memory = next;
    },
    export: async () => false,
    import: async () => null,
  };
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
  try {
    await window.api.save(data);
    lastSavedData = cloneData(data);
    appError.classList.add("hidden");
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

function closeDialog(result) {
  dialogEl.classList.add("hidden");
  const resolve = dialogResolver;
  dialogResolver = null;
  if (resolve) {
    resolve(result);
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
    dialogMessage.textContent = message;
    dialogInput.classList.toggle("hidden", !showInput);
    dialogInput.value = showInput ? defaultValue : "";
    dialogOk.textContent = danger ? "Delete" : "OK";
    dialogOk.classList.toggle("danger", danger);
    dialogEl.classList.remove("hidden");
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
  appError.textContent = message;
  appError.classList.remove("hidden");
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
          ? ` — Weight ${Number(cat.weight) || 0}%`
          : "";
      const dropped =
        Number(cat.dropLowest) > 0 ? ` — Drop ${cat.dropLowest}` : "";
      return `<li><span>${escapeHtml(cat.name || "Untitled")}${extra}${dropped}</span><span>${formatPercent(cat.percent)}</span></li>`;
    })
    .join("");

  gradeSummary.innerHTML = `
    <p class="overall">Current Grade: ${overallLabel}</p>
    <ul>${categoryLines || "<li><span>No categories yet</span><span></span></li>"}</ul>
  `;
}

function renderPolicyEditor(container, policy, onChange) {
  container.innerHTML = `
    <table class="data-table policy-table">
      <thead><tr><th>Letter</th><th>Minimum %</th><th>Points</th><th></th></tr></thead>
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
    for (const band of policy.bands) {
      if (
        !band.letter ||
        !Number.isFinite(band.minPercent) ||
        band.minPercent < 0 ||
        band.minPercent > 100 ||
        band.minPercent >= previous ||
        !Number.isFinite(band.points) ||
        band.points < 0
      ) {
        return false;
      }
      previous = band.minPercent;
    }
    return policy.bands.length > 0 && previous === 0;
  }
  const body = container.querySelector("tbody");
  for (const [index, band] of policy.bands.entries()) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><input type="text" class="policy-letter" maxlength="12"></td>
      <td><input type="number" class="policy-min" min="0" max="100" step="0.1"></td>
      <td><input type="number" class="policy-points" min="0" step="0.01"></td>
      <td><button type="button" class="danger icon remove-policy-band">Remove</button></td>
    `;
    row.querySelector(".policy-letter").value = band.letter;
    row.querySelector(".policy-min").value = band.minPercent;
    row.querySelector(".policy-points").value = band.points;
    row.querySelectorAll("input").forEach((input) => {
      input.addEventListener("change", async () => {
        band.letter =
          row.querySelector(".policy-letter").value.trim() || "Grade";
        band.minPercent = parseOptionalNumber(
          row.querySelector(".policy-min").value,
        );
        band.points = parseOptionalNumber(
          row.querySelector(".policy-points").value,
        );
        if (input.classList.contains("policy-min")) {
          const reordered = Calc.reorderPolicyBands(policy);
          if (!reordered) {
            showPolicyError(
              "Minimum percentages must be unique and between 0% and 100%.",
            );
            return;
          }
          policy.bands.splice(0, policy.bands.length, ...reordered);
        }
        if (!validPolicy()) {
          showPolicyError(
            "Use descending minimum percentages ending with a 0% grade, and enter non-negative points.",
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
      policy.bands.splice(policy.bands.length - 1, 0, {
        letter: "New",
        minPercent: Math.min(100, (lowest && lowest.minPercent + 1) || 1),
        points: 0,
      });
      try {
        await onChange();
      } catch {
        showPolicyError("This grading policy could not be saved.");
      }
    });
}

function renderCourseGpa(course) {
  const result = Calc.courseGpa(course, data.gradingPolicy);
  courseGpaCard.innerHTML = `
    <h3>Course GPA</h3>
    <p class="gpa-value">${result.letter || "—"} <span>${formatGpa(result.points)}</span></p>
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
        renderCourse();
      },
    );
  }
}

function renderOverallGpa(card = overviewGpaCard) {
  const overall = Calc.calculateGpa(data);
  const rows = overall.courses
    .map(
      ({ course, result }) =>
        `<li><span>${escapeHtml(course.name || "Untitled")}</span><span>${result.eligible ? `${result.letter} (${formatGpa(result.points)})` : "Excluded"}</span></li>`,
    )
    .join("");
  card.innerHTML = `
    <h3>Overall GPA</h3>
    <p class="gpa-value">${formatGpa(overall.gpa)}</p>
    <p class="panel-help">${formatPoints(overall.credits)} eligible credits</p>
    <ul>${rows || "<li><span>No courses yet</span><span></span></li>"}</ul>
  `;
}

function renderHome() {
  courseList.innerHTML = "";
  homeEmpty.classList.toggle("hidden", data.courses.length > 0);
  renderOverallGpa(overviewGpaCard);
  renderPolicyEditor(defaultPolicyEditor, data.gradingPolicy, async () => {
    await persist();
    renderHome();
  });

  for (const course of data.courses) {
    const grade = Calc.courseGrade(course);
    const item = document.createElement("li");
    item.className = "course-card";
    item.innerHTML = `
      <button type="button" class="open">
        <h3></h3>
        <div class="grade"></div>
      </button>
      <div class="course-actions">
        <button type="button" class="ghost rename">Rename</button>
        <button type="button" class="danger delete">Delete</button>
      </div>
    `;
    item.querySelector("h3").textContent = course.name || "Untitled course";
    item.querySelector(".grade").textContent = formatPercent(grade.percent);
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
      data.courses = data.courses.filter(
        (itemCourse) => itemCourse.id !== course.id,
      );
      await persist();
      renderHome();
    });
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
  for (const category of course.categories) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><input type="text" class="cat-name" maxlength="80" /></td>
      <td class="weight-col"><input type="number" class="cat-weight" min="0" step="0.1" /></td>
      <td><input type="number" class="cat-drop" min="0" step="1" /></td>
      <td><button type="button" class="danger icon">Remove</button></td>
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
    row.querySelector("button").addEventListener("click", async () => {
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
    categoryRows.appendChild(row);
  }

  assignmentsEmpty.classList.toggle(
    "hidden",
    course.categories.length > 0 || course.assignments.length > 0,
  );
  assignmentGroups.innerHTML = "";

  function renderAssignmentRow(assignment, tableBody) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td data-label="Name"><input type="text" class="asg-name" maxlength="120" /></td>
      <td data-label="Earned"><input type="number" class="asg-earned" min="0" step="0.01" /></td>
      <td data-label="Possible"><input type="number" class="asg-possible" min="0" step="0.01" /></td>
      <td data-label=""><button type="button" class="danger icon">Remove</button></td>
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
    row.querySelector("button").addEventListener("click", async () => {
      course.assignments = course.assignments.filter(
        (item) => item.id !== assignment.id,
      );
      await persist();
      renderCourse();
    });
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
            <th></th>
          </tr>
        </thead>
      `;
      const body = document.createElement("tbody");
      for (const assignment of assignments) {
        renderAssignmentRow(assignment, body);
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
  data.courses = data.courses.filter((item) => item.id !== course.id);
  await persist();
  showHome();
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
  try {
    data = await window.api.load();
    lastSavedData = cloneData(data);
  } catch (error) {
    console.error("Failed to load grades:", error);
    showAppError(
      "Your saved grades could not be loaded. The original data was preserved.",
    );
    data = { courses: [] };
    lastSavedData = cloneData(data);
  }
  if (!data || !Array.isArray(data.courses)) {
    data = { courses: [] };
  }
  if (!data.gradingPolicy) {
    data.gradingPolicy = defaultGradingPolicy();
  }
  showHome();
}

init();

document.getElementById("export-data").addEventListener("click", async () => {
  try {
    const exported = await window.api.export(data);
    if (exported) {
      appError.textContent = "Grade data exported successfully.";
      appError.classList.remove("hidden");
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
  try {
    await persist();
    currentCourseId = null;
    showHome();
    appError.textContent = "Grade data imported successfully.";
    appError.classList.remove("hidden");
  } catch {
    currentCourseId = null;
  }
});
