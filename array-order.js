(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.ArrayOrder = api;
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  function swapItems(items, firstIndex, secondIndex) {
    if (!Array.isArray(items)) {
      throw new TypeError("Items must be an array");
    }
    if (
      !Number.isInteger(firstIndex) ||
      !Number.isInteger(secondIndex) ||
      firstIndex < 0 ||
      secondIndex < 0 ||
      firstIndex >= items.length ||
      secondIndex >= items.length
    ) {
      return false;
    }
    if (firstIndex === secondIndex) {
      return false;
    }

    [items[firstIndex], items[secondIndex]] = [
      items[secondIndex],
      items[firstIndex],
    ];
    return true;
  }

  return { swapItems };
});
