(function () {
  "use strict";

  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const CATEGORY_LABELS = { audio: "Audio", lyrics: "Lyrics", letters: "Letters", code: "Code" };

  function makeCard(item, actions) {
    const card = document.createElement("article");
    card.className = "archive-card archive-card-" + item.category;
    const top = document.createElement("div");
    top.className = "card-topline";
    const type = document.createElement("span");
    type.className = "type-label";
    type.dataset.category = item.category;
    type.textContent = CATEGORY_LABELS[item.category] || item.category;
    const date = document.createElement("span");
    date.className = "card-date";
    date.textContent = item.dateLabel || "";
    top.append(type, date);

    const heading = document.createElement("h3");
    heading.className = "card-title";
    heading.textContent = item.title || "Untitled";
    const description = document.createElement("p");
    description.className = "card-description";
    description.textContent = item.description || "A little something worth keeping.";
    const bottom = document.createElement("div");
    bottom.className = "card-bottom";
    const tags = document.createElement("div");
    tags.className = "tag-list";
    (item.tags || []).slice(0, 3).forEach(function (tagText) {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = tagText;
      tags.append(tag);
    });
    const action = document.createElement("button");
    action.className = "card-action";
    action.type = "button";
    action.textContent = item.category === "audio" ? "▶ Listen" : "Read more ↗";
    action.addEventListener("click", function () {
      if (item.category === "audio") actions.playAudio(item);
      else actions.openDetail(item);
    });
    bottom.append(tags, action);
    card.append(top, heading, description, bottom);
    return card;
  }

  function renderTimeline(items, target, actions) {
    target.replaceChildren();
    if (!items.length) return;
    const grouped = new Map();
    items.forEach(function (item) {
      const date = new Date(item.date + "T12:00:00");
      const year = String(date.getFullYear());
      const month = String(date.getMonth());
      if (!grouped.has(year)) grouped.set(year, new Map());
      const months = grouped.get(year);
      if (!months.has(month)) months.set(month, []);
      months.get(month).push(item);
    });

    Array.from(grouped.keys()).sort(function (a, b) { return Number(b) - Number(a); }).forEach(function (year) {
      const yearHeading = document.createElement("h2");
      yearHeading.className = "year-heading";
      yearHeading.textContent = year;
      target.append(yearHeading);
      const months = grouped.get(year);
      Array.from(months.keys()).sort(function (a, b) { return Number(b) - Number(a); }).forEach(function (month) {
        const section = document.createElement("section");
        section.className = "month-section";
        const monthHeading = document.createElement("h3");
        monthHeading.className = "month-label";
        monthHeading.textContent = MONTHS[Number(month)];
        const grid = document.createElement("div");
        grid.className = "card-grid";
        months.get(month).forEach(function (item) { grid.append(makeCard(item, actions)); });
        section.append(monthHeading, grid);
        target.append(section);
      });
    });
  }

  function renderLibrary(items, target, actions) {
    target.replaceChildren();
    if (!items.length) return;
    const grid = document.createElement("div");
    grid.className = "card-grid";
    items.forEach(function (item) { grid.append(makeCard(item, actions)); });
    target.append(grid);
  }

  window.ArchiveTimeline = { renderTimeline: renderTimeline, renderLibrary: renderLibrary };
})();
