(function () {
  "use strict";

  const CATEGORIES = [
    { key: "all", label: "All" },
    { key: "audio", label: "Audio" },
    { key: "lyrics", label: "Lyrics" },
    { key: "letters", label: "Letters" },
    { key: "code", label: "Code" }
  ];
  const content = document.getElementById("archive-content");
  const searchInput = document.getElementById("search-input");
  const tabs = document.getElementById("library-tabs");
  const status = document.getElementById("status-message");
  const detailDialog = document.getElementById("detail-dialog");
  const detailContent = document.getElementById("dialog-content");
  let items = [];
  let view = "timeline";
  let category = "all";
  let query = "";

  function showStatus(message) {
    status.textContent = message;
    status.hidden = !message;
  }

  async function loadManifest() {
    try {
      const response = await fetch("content/manifest.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Manifest request failed with status " + response.status);
      const manifest = await response.json();
      if (!Array.isArray(manifest.items)) throw new Error("The manifest does not contain an items list.");
      return manifest.items;
    } catch (error) {
      if (window.ARCHIVE_MANIFEST && Array.isArray(window.ARCHIVE_MANIFEST.items)) {
        return window.ARCHIVE_MANIFEST.items;
      }
      throw error;
    }
  }

  function showEmptyState(message) {
    content.replaceChildren();
    const empty = document.createElement("div");
    empty.className = "empty-state";
    const flower = document.createElement("span");
    flower.setAttribute("aria-hidden", "true");
    flower.textContent = "✳";
    const heading = document.createElement("h2");
    heading.textContent = "Nothing here just yet";
    const copy = document.createElement("p");
    copy.textContent = message;
    empty.append(flower, heading, copy);
    content.append(empty);
  }

  function getVisibleItems() {
    return items.filter(function (item) {
      if (view === "library" && category !== "all" && item.category !== category) return false;
      if (!query) return true;
      const searchable = [item.title, item.description, (item.tags || []).join(" "), item.text]
        .join(" ").toLocaleLowerCase();
      return searchable.includes(query);
    });
  }

  function renderTabs() {
    tabs.replaceChildren();
    CATEGORIES.forEach(function (entry) {
      const button = document.createElement("button");
      button.className = "category-tab" + (category === entry.key ? " is-active" : "");
      button.type = "button";
      button.setAttribute("role", "tab");
      button.setAttribute("aria-selected", String(category === entry.key));
      button.textContent = entry.label;
      const count = document.createElement("span");
      count.className = "category-count";
      count.textContent = String(entry.key === "all" ? items.length : items.filter(function (item) { return item.category === entry.key; }).length);
      button.setAttribute("aria-label", entry.label + ", " + count.textContent + " items");
      button.append(count);
      button.addEventListener("click", function () {
        category = entry.key;
        renderTabs();
        render();
      });
      tabs.append(button);
    });
    tabs.hidden = view !== "library";
  }

  function formatDate(date) {
    if (!date) return "";
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
      .format(new Date(date + "T12:00:00Z"));
  }

  function sanitizeHtml(html) {
    const parsed = new DOMParser().parseFromString(html, "text/html");
    const allowed = new Set(["P", "BR", "STRONG", "EM", "DEL", "BLOCKQUOTE", "UL", "OL", "LI", "H1", "H2", "H3", "H4", "PRE", "CODE", "A", "HR"]);
    function clean(node) {
      Array.from(node.childNodes).forEach(function (child) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          if (!allowed.has(child.tagName)) {
            child.replaceWith(document.createTextNode(child.textContent || ""));
            return;
          }
          Array.from(child.attributes).forEach(function (attribute) {
            if (child.tagName !== "A" || attribute.name !== "href") child.removeAttribute(attribute.name);
          });
          if (child.tagName === "A") {
            const href = child.getAttribute("href") || "";
            if (!/^(https?:|mailto:|#)/i.test(href)) child.removeAttribute("href");
            else {
              child.setAttribute("rel", "noopener noreferrer");
              child.setAttribute("target", "_blank");
            }
          }
          clean(child);
        } else if (child.nodeType !== Node.TEXT_NODE) child.remove();
      });
    }
    clean(parsed.body);
    return parsed.body.innerHTML;
  }

  function markdownToHtml(text) {
    if (window.marked && typeof window.marked.parse === "function") {
      return sanitizeHtml(window.marked.parse(text || ""));
    }
    const pre = document.createElement("pre");
    pre.textContent = text || "No text has been added for this entry.";
    return pre.outerHTML;
  }

  function openDetail(item) {
    detailContent.replaceChildren();
    const kicker = document.createElement("p");
    kicker.className = "detail-kicker";
    kicker.textContent = item.category + (item.tags && item.tags.length ? " · " + item.tags.join(" · ") : "");
    const heading = document.createElement("h2");
    heading.className = "detail-title";
    heading.textContent = item.title;
    const date = document.createElement("p");
    date.className = "detail-date";
    date.textContent = formatDate(item.date);
    const body = document.createElement("div");
    body.className = "detail-body";
    if (item.category === "code") {
      const pre = document.createElement("pre");
      const code = document.createElement("code");
      code.textContent = item.text || "No text has been added for this entry.";
      pre.append(code);
      body.append(pre);
    } else {
      body.innerHTML = markdownToHtml(item.text || item.description || "No text has been added for this entry.");
    }
    detailContent.append(kicker, heading, date, body);
    detailDialog.showModal();
  }

  function render() {
    renderTabs();
    const visibleItems = getVisibleItems();
    document.getElementById("item-count").textContent = items.length + (items.length === 1 ? " ITEM" : " ITEMS");
    if (!visibleItems.length) {
      showEmptyState(query ? "Try another search, or clear the search box to see everything." : "Add a few files to your archive and they will find a home here.");
      return;
    }
    showStatus("");
    const actions = {
      playAudio: function (item) {
        const playerItem = Object.assign({}, item, {
          dateLabel: formatDate(item.date),
          reportError: showStatus
        });
        window.ArchiveAudioPlayer.play(playerItem);
      },
      openDetail: openDetail
    };
    if (view === "timeline") window.ArchiveTimeline.renderTimeline(visibleItems, content, actions);
    else window.ArchiveTimeline.renderLibrary(visibleItems, content, actions);
  }

  document.querySelectorAll(".view-button").forEach(function (button) {
    button.addEventListener("click", function () {
      view = button.dataset.view;
      category = "all";
      document.querySelectorAll(".view-button").forEach(function (other) {
        const selected = other === button;
        other.classList.toggle("is-active", selected);
        other.setAttribute("aria-pressed", String(selected));
      });
      render();
    });
  });

  searchInput.addEventListener("input", function () {
    query = searchInput.value.trim().toLocaleLowerCase();
    render();
  });
  document.addEventListener("keydown", function (event) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      searchInput.focus();
    }
    if (event.key === "Escape" && detailDialog.open) detailDialog.close();
  });
  document.getElementById("dialog-close").addEventListener("click", function () { detailDialog.close(); });
  detailDialog.addEventListener("click", function (event) {
    if (event.target === detailDialog) detailDialog.close();
  });

  loadManifest().then(function (manifestItems) {
    items = manifestItems.map(function (item) {
      return Object.assign({}, item, {
        date: /^\d{4}-\d{2}-\d{2}$/.test(item.date || "") ? item.date : "1970-01-01",
        dateLabel: formatDate(item.date)
      });
    }).sort(function (a, b) { return b.date.localeCompare(a.date) || a.title.localeCompare(b.title); });
    const firstYear = items.length ? Math.min.apply(null, items.map(function (item) { return Number(item.date.slice(0, 4)); })) : new Date().getFullYear();
    document.getElementById("archive-year").textContent = String(firstYear);
    render();
  }).catch(function (error) {
    content.replaceChildren();
    showStatus("The archive could not load its content manifest. Run the manifest generator or check that content/manifest.json is available.");
    console.error("Archive manifest loading failed:", error);
  });
})();
