const target = document.querySelector("#target");
const cursor = document.querySelector("#guide-cursor");
const callout = document.querySelector("#callout");
const counter = document.querySelector("#counter");
const title = document.querySelector("#step-title");
const detail = document.querySelector("#step-detail");
const shortcut = document.querySelector("#shortcut");

window.orbit.onGuidance((payload) => {
  const point = payload?.point || { x: innerWidth / 2, y: innerHeight / 2 };
  const x = Math.max(28, Math.min(point.x, innerWidth - 28));
  const y = Math.max(28, Math.min(point.y, innerHeight - 28));
  target.style.left = `${x}px`;
  target.style.top = `${y}px`;
  cursor.style.left = `${x + 16}px`;
  cursor.style.top = `${y + 17}px`;
  const placeLeft = x > innerWidth * .62;
  callout.style.left = `${Math.max(20, Math.min(placeLeft ? x - 330 : x + 48, innerWidth - 310))}px`;
  callout.style.top = `${Math.max(20, Math.min(y - 36, innerHeight - 190))}px`;
  counter.textContent = `ORBIT GUIDE ${Number(payload.index || 0) + 1} OF ${payload.total || 1}`;
  title.textContent = payload.step?.title || "Start here";
  detail.textContent = payload.step?.detail || "";
  shortcut.textContent = payload.shortcut || "Esc when you are ready";
  target.animate([{ transform: "translate(-50%, -50%) scale(.7)", opacity: .2 }, { transform: "translate(-50%, -50%) scale(1)", opacity: 1 }], { duration: 280, easing: "ease-out" });
  callout.animate([{ opacity: .2, transform: "translateY(8px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 220, easing: "ease-out" });
});
