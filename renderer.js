const card = document.querySelector("#card");
const eyebrow = document.querySelector("#eyebrow");
const title = document.querySelector("#title");
const detail = document.querySelector("#detail");
const hint = document.querySelector("#hint");
let enabled = false;

window.orbit.onCursorUpdate((payload) => {
  if (payload.kind === "shortcut-status") {
    document.body.dataset.cursorShortcutReady = String(Boolean(payload.cursorShortcutReady));
    document.body.dataset.overlayShortcutReady = String(Boolean(payload.overlayShortcutReady));
    if (!payload.cursorShortcutReady) {
      card.classList.remove("active");
      eyebrow.textContent = "SHORTCUT UNAVAILABLE";
      title.textContent = "Ctrl + Shift + Space is busy";
      detail.textContent = "Another app owns Cursor Vision's hotkey. Close it, then restart Orbit.";
      hint.textContent = "The overlay can still be shown or hidden with Ctrl + Shift + O.";
    }
  }

  if (payload.kind === "state") {
    enabled = Boolean(payload.enabled);
    card.classList.toggle("active", enabled);
    eyebrow.textContent = enabled ? `CURSOR VISION | ${payload.model || "ready"}` : "ORBIT IS IDLE";
    title.textContent = enabled ? "Hold over anything" : "Hover companion";
    detail.textContent = enabled
      ? "Pause your cursor for a moment and I will identify the interface element."
      : "Press Ctrl + Shift + Space to let Orbit explain what is under your cursor.";
    hint.textContent = enabled ? "Press Ctrl + Shift + Space to pause Cursor Vision." : "It is click-through and never blocks your mouse.";
  }

  if (payload.kind === "scanning") {
    eyebrow.textContent = "CURSOR VISION | SCANNING";
    title.textContent = "Hold steady...";
    detail.textContent = "Orbit will read the accessible label beneath your cursor.";
  }

  if (payload.kind === "reading") {
    eyebrow.textContent = "CURSOR VISION | READING";
    title.textContent = "Looking at this...";
    detail.textContent = "Checking the Windows accessibility description.";
  }

  if (payload.kind === "seeing") {
    eyebrow.textContent = "CURSOR VISION | SEEING";
    title.textContent = payload.target.name || "Visual element";
    detail.textContent = "Checking the small screen area around your cursor for visual context...";
  }

  if (payload.kind === "target") {
    eyebrow.textContent = `CURSOR VISION | ${payload.target.controlType || "ELEMENT"}`;
    title.textContent = payload.target.isPassword ? "Private field" : (payload.target.name || payload.target.controlType || "UI element");
    detail.textContent = payload.target.isPassword
      ? "Orbit hides password contents by design."
      : "I found the element. Getting a short explanation...";
  }

  if (payload.kind === "explanation") {
    eyebrow.textContent = `CURSOR VISION | ${payload.target.controlType || "ELEMENT"}`;
    title.textContent = payload.explanation.title || payload.target.name || "UI element";
    detail.textContent = payload.explanation.detail || "I found an interface element under your cursor.";
    hint.textContent = enabled
      ? (payload.usedVisualContext ? "Used one temporary cursor-area image for this explanation." : "Move to another element, then pause to inspect it.")
      : "";
  }

  if (payload.kind === "empty") {
    eyebrow.textContent = "CURSOR VISION";
    title.textContent = "Nothing readable here";
    detail.textContent = payload.message || "Try hovering an app control or label.";
  }
});
