(function () {
  "use strict";

  function createPreview() {
    const preview = document.createElement("section");
    preview.className = "heart-preview-panel";
    preview.setAttribute("aria-label", "Interactive heart preview");

    const heart = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    heart.setAttribute("class", "heart-preview-art");
    heart.setAttribute("viewBox", "0 0 200 190");
    heart.setAttribute("aria-hidden", "true");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute(
      "d",
      "M100 174 23 99C-12 64 12 13 54 13c22 0 38 13 46 30 8-17 24-30 46-30 42 0 66 51 31 86z"
    );
    heart.append(path);

    const message = document.createElement("p");
    message.className = "heart-preview-message";
    message.textContent = "I'm proud of you";
    preview.append(heart, message);
    return preview;
  }

  window.ArchiveHeartWidget = { createPreview: createPreview };
})();
