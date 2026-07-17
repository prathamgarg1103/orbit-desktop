const target = document.querySelector("#target");
const title = document.querySelector("#step-title");
const list = document.querySelector("#step-list");

window.orbit.onGuidance((payload) => {
  const point = payload.point || { x: innerWidth / 2, y: innerHeight / 2 };
  target.style.left = `${Math.max(28, Math.min(point.x, innerWidth - 28))}px`;
  target.style.top = `${Math.max(28, Math.min(point.y, innerHeight - 28))}px`;
  title.textContent = payload.steps[0] || "Start here";
  list.innerHTML = payload.steps.slice(1).map((step, index) => `<p><b>${index + 2}</b>${escapeHtml(step)}</p>`).join("");
});
function escapeHtml(value) { const node = document.createElement("span"); node.textContent = value; return node.innerHTML; }
