(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.NotificationUI = api;
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  const notificationTypes = {
    error: {
      className: "app-notice-error",
      role: "alert",
      ariaLive: "assertive",
    },
    success: {
      className: "app-notice-success",
      role: "status",
      ariaLive: "polite",
    },
  };

  const notificationClasses = Object.values(notificationTypes).map(
    (type) => type.className,
  );

  function clearAppNotification(element) {
    if (!element) {
      return;
    }
    element.classList.add("hidden");
    notificationClasses.forEach((className) =>
      element.classList.remove(className),
    );
  }

  function showAppNotification(element, message, type = "error") {
    if (!element) {
      return;
    }
    const selectedType = notificationTypes[type] || notificationTypes.error;
    notificationClasses.forEach((className) =>
      element.classList.remove(className),
    );
    element.classList.add(selectedType.className);
    element.setAttribute("role", selectedType.role);
    element.setAttribute("aria-live", selectedType.ariaLive);
    element.setAttribute("aria-atomic", "true");
    element.textContent = message;
    element.classList.remove("hidden");
  }

  return {
    clearAppNotification,
    showAppNotification,
  };
});
