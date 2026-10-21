const homeView = document.getElementById("view-home");
const courseView = document.getElementById("view-course");
const courseList = document.getElementById("course-list");
const homeEmpty = document.getElementById("home-empty");
const courseNameInput = document.getElementById("course-name");
const gradeSummary = document.getElementById("grade-summary");
const categoryRows = document.getElementById("category-rows");
const assignmentRows = document.getElementById("assignment-rows");
const categoriesEmpty = document.getElementById("categories-empty");
const assignmentsEmpty = document.getElementById("assignments-empty");
const dialogEl = document.getElementById("dialog");
const dialogMessage = document.getElementById("dialog-message");
const dialogInput = document.getElementById("dialog-input");
const dialogOk = document.getElementById("dialog-ok");
const dialogCancel = document.getElementById("dialog-cancel");

let data = { courses: [] };
let currentCourseId = null;
let dialogResolver = null;

if (!window.api) {
  let memory = { courses: [] };
  window.api = {
    load: async () => memory,
    save: async (next) => {
      memory = next;
    },
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

function currentCourse() {
  return data.courses.find((course) => course.id === currentCourseId) || null;
}

async function persist() {
  await window.api.save(data);
}

function closeDialog(result) {
  dialogEl.classList.add("hidden");
  const resolve = dialogResolver;
  dialogResolver = null;
  if (resolve) {
    resolve(result);
  }
}

function openDialog({ message, defaultValue = "", showInput = false, danger = false }) {
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

function askConfirm(message) {
  return openDialog({ message, showInput: false, danger: true });
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

function renderHome() {
  courseList.innerHTML = "";
  homeEmpty.classList.toggle("hidden", data.courses.length > 0);

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
    item.querySelector(".open").addEventListener("click", () => showCourse(course.id));
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
      data.courses = data.courses.filter((itemCourse) => itemCourse.id !== course.id);
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

  document.body.classList.toggle("points-mode", course.gradingMode === "points");
  courseNameInput.value = course.name;
  document.querySelector(
    `input[name="grading-mode"][value="${course.gradingMode}"]`
  ).checked = true;

  const grade = Calc.courseGrade(course);
  const overallLabel =
    course.gradingMode === "points"
      ? `${formatPercent(grade.percent)}  (${grade.earned}/${grade.possible})`
      : formatPercent(grade.percent);

  const categoryLines = grade.byCategory
    .map((cat) => {
      const extra =
        course.gradingMode === "weighted" && cat.weight != null
          ? ` · weight ${Number(cat.weight) || 0}%`
          : "";
      const dropped = Number(cat.dropLowest) > 0 ? ` · drop ${cat.dropLowest}` : "";
      return `<li><span>${escapeHtml(cat.name || "Untitled")}${extra}${dropped}</span><span>${formatPercent(cat.percent)}</span></li>`;
    })
    .join("");

  gradeSummary.innerHTML = `
    <p class="overall">Current grade: ${overallLabel}</p>
    <ul>${categoryLines || "<li><span>No categories yet</span><span></span></li>"}</ul>
  `;

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
      renderCourse();
    });
    weightInput.addEventListener("change", async () => {
      const value = Number(weightInput.value);
      category.weight = Number.isFinite(value) ? value : 0;
      await persist();
      renderCourse();
    });
    dropInput.addEventListener("change", async () => {
      const value = Math.max(0, Math.floor(Number(dropInput.value) || 0));
      category.dropLowest = value;
      dropInput.value = value;
      await persist();
      renderCourse();
    });
    row.querySelector("button").addEventListener("click", async () => {
      const ok = await askConfirm(
        `Remove category “${category.name}”? Assignments in it will be unassigned.`
      );
      if (!ok) {
        return;
      }
      course.categories = course.categories.filter((item) => item.id !== category.id);
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

  assignmentsEmpty.classList.toggle("hidden", course.assignments.length > 0);
  assignmentRows.innerHTML = "";
  for (const assignment of course.assignments) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><input type="text" class="asg-name" maxlength="120" /></td>
      <td><select class="asg-cat"></select></td>
      <td><input type="number" class="asg-earned" min="0" step="0.01" /></td>
      <td><input type="number" class="asg-possible" min="0" step="0.01" /></td>
      <td><button type="button" class="danger icon">Remove</button></td>
    `;
    const nameInput = row.querySelector(".asg-name");
    const catSelect = row.querySelector(".asg-cat");
    const earnedInput = row.querySelector(".asg-earned");
    const possibleInput = row.querySelector(".asg-possible");
    nameInput.value = assignment.name;
    earnedInput.value = assignment.earned ?? "";
    possibleInput.value = assignment.possible ?? "";

    const noneOption = document.createElement("option");
    noneOption.value = "";
    noneOption.textContent = "Unassigned";
    catSelect.appendChild(noneOption);
    for (const category of course.categories) {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = category.name;
      catSelect.appendChild(option);
    }
    catSelect.value = assignment.categoryId || "";

    nameInput.addEventListener("change", async () => {
      assignment.name = nameInput.value.trim() || "Untitled";
      await persist();
      renderCourse();
    });
    catSelect.addEventListener("change", async () => {
      assignment.categoryId = catSelect.value || null;
      await persist();
      renderCourse();
    });
    earnedInput.addEventListener("change", async () => {
      assignment.earned = parseOptionalNumber(earnedInput.value);
      await persist();
      renderCourse();
    });
    possibleInput.addEventListener("change", async () => {
      assignment.possible = parseOptionalNumber(possibleInput.value);
      await persist();
      renderCourse();
    });
    row.querySelector("button").addEventListener("click", async () => {
      course.assignments = course.assignments.filter((item) => item.id !== assignment.id);
      await persist();
      renderCourse();
    });
    assignmentRows.appendChild(row);
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

document.getElementById("add-assignment").addEventListener("click", async () => {
  const course = currentCourse();
  if (!course) {
    return;
  }
  course.assignments.push({
    id: uid(),
    name: "New assignment",
    categoryId: course.categories[0] ? course.categories[0].id : null,
    earned: null,
    possible: null,
  });
  await persist();
  renderCourse();
});

async function init() {
  data = await window.api.load();
  if (!data || !Array.isArray(data.courses)) {
    data = { courses: [] };
  }
  showHome();
}

init();
