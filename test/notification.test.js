const test = require("node:test");
const assert = require("node:assert/strict");
const {
  showAppNotification,
  clearAppNotification,
} = require("../notification.js");

function createMockElement() {
  const classNames = new Set(["app-error", "hidden"]);
  const attributes = new Map();
  return {
    classList: {
      add(...names) {
        names.forEach((name) => classNames.add(name));
      },
      remove(...names) {
        names.forEach((name) => classNames.delete(name));
      },
      contains(name) {
        return classNames.has(name);
      },
    },
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
    getAttribute(name) {
      return attributes.get(name) || null;
    },
    textContent: "",
  };
}

test("shows success notifications with polite status semantics", () => {
  const notice = createMockElement();

  showAppNotification(notice, "Grade data exported successfully.", "success");

  assert.equal(notice.textContent, "Grade data exported successfully.");
  assert.equal(notice.classList.contains("hidden"), false);
  assert.equal(notice.classList.contains("app-notice-success"), true);
  assert.equal(notice.classList.contains("app-notice-error"), false);
  assert.equal(notice.getAttribute("role"), "status");
  assert.equal(notice.getAttribute("aria-live"), "polite");
});

test("replaces success styling with error styling and alert semantics", () => {
  const notice = createMockElement();
  showAppNotification(notice, "Grade data exported successfully.", "success");

  showAppNotification(notice, "Grade data could not be exported.", "error");

  assert.equal(notice.textContent, "Grade data could not be exported.");
  assert.equal(notice.classList.contains("app-notice-success"), false);
  assert.equal(notice.classList.contains("app-notice-error"), true);
  assert.equal(notice.getAttribute("role"), "alert");
  assert.equal(notice.getAttribute("aria-live"), "assertive");
});

test("clears notification visibility and state classes", () => {
  const notice = createMockElement();
  showAppNotification(notice, "Grade data imported successfully.", "success");

  clearAppNotification(notice);

  assert.equal(notice.classList.contains("hidden"), true);
  assert.equal(notice.classList.contains("app-notice-success"), false);
  assert.equal(notice.classList.contains("app-notice-error"), false);
});
