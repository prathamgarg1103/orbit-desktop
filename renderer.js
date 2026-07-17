const companion = document.querySelector("#companion");
const prompt = document.querySelector("#prompt");
const ask = document.querySelector("#ask");
const voice = document.querySelector("#voice");
const contextLabel = document.querySelector("#context-label");
const hoverLine = document.querySelector("#hover-line");
const hint = document.querySelector("#hint");
const answer = document.querySelector("#answer");
const answerMode = document.querySelector("#answer-mode");
const answerText = document.querySelector("#answer-text");
const draw = document.querySelector("#draw");
const again = document.querySelector("#again");
const agentAction = document.querySelector("#agent-action");
const agentActionDetail = document.querySelector("#agent-action-detail");
const approveAgent = document.querySelector("#approve-agent");
const connections = document.querySelector("#connections");
const connectorRow = document.querySelector("#connector-row");
const connectorForm = document.querySelector("#connector-form");
const connectorTitle = document.querySelector("#connector-title");
const connectorToken = document.querySelector("#connector-token");
const cloudUrlRow = document.querySelector("#cloud-url-row");
const cloudUrl = document.querySelector("#cloud-url");
const notionParentRow = document.querySelector("#notion-parent-row");
const notionParent = document.querySelector("#notion-parent");
const saveConnector = document.querySelector("#save-connector");
const disconnectConnector = document.querySelector("#disconnect-connector");
const oauthConnector = document.querySelector("#oauth-connector");

let mode = "coach";
let steps = [];
let currentAgent;
let selectedConnector;
let liveVoice = false;
let activeRecorder;
let cloudConnected = false;
const POINTER_SIZE = { width: 54, height: 54 };

document.querySelector("#close").onclick = () => window.orbit.close();
document.querySelector("#settings").onclick = toggleSettings;
document.querySelector("#close-settings").onclick = closeSettings;
document.querySelectorAll(".mode").forEach((button) => { button.onclick = () => setMode(button.dataset.mode); });
ask.onclick = submit;
voice.onclick = startVoice;
draw.onclick = showGuide;
again.onclick = resetToAsk;
approveAgent.onclick = runApprovedAgent;
saveConnector.onclick = saveSelectedConnector;
disconnectConnector.onclick = disconnectSelectedConnector;
oauthConnector.onclick = startSelectedOAuth;
connectorRow.onclick = (event) => {
  const button = event.target.closest("[data-connector]");
  if (button) openConnectorForm(button.dataset.connector, button.dataset.connected === "true");
};
prompt.addEventListener("keydown", (event) => { if (event.key === "Enter") submit(); });

window.orbit.onOpened((payload) => {
  liveVoice = Boolean(payload.liveVoice);
  contextLabel.textContent = payload.live ? "screen context live" : "screen context ready";
  answer.hidden = true;
  connections.hidden = true;
  currentAgent = undefined;
  enterPointerMode();
});
window.orbit.onPrompt(() => enterPromptMode());
window.orbit.onError((message) => {
  answer.hidden = true;
  connections.hidden = true;
  enterPromptMode(message);
});
window.orbit.onHover((item) => {
  if (companion.classList.contains("state-pointer") || companion.classList.contains("state-thinking") || !answer.hidden || !connections.hidden) return;
  const name = String(item?.name || "").trim();
  const type = String(item?.controlType || "").replace(/^ControlType\./, "").replace(/Control$/, "").toLowerCase();
  hoverLine.textContent = name || type ? `Pointing at ${name || type}${name && type ? ` (${type})` : ""}. Ask Orbit what it does.` : "Point at anything and ask Orbit what to do next.";
});

function setState(state, height, width = 360) {
  companion.className = `companion state-${state}`;
  window.orbit.resize({ width, height });
}

function enterPointerMode() {
  prompt.value = "";
  connections.hidden = true;
  connectorForm.hidden = true;
  selectedConnector = undefined;
  companion.className = "companion state-pointer";
  window.orbit.resize(POINTER_SIZE);
  window.orbit.setPointerMode(true);
  window.orbit.setFollow(true);
}

function enterPromptMode(message) {
  answer.hidden = true;
  connections.hidden = true;
  connectorForm.hidden = true;
  selectedConnector = undefined;
  hoverLine.textContent = message || "Ask about what you are pointing at, or tell Orbit what to do.";
  hint.innerHTML = "<kbd>Esc</kbd> hide &middot; Orbit only sees a screen after the hotkey";
  window.orbit.setPointerMode(false);
  window.orbit.setFollow(false);
  setState("prompt", 164);
  loadConnectors();
  prompt.focus();
}

function setMode(nextMode) {
  mode = nextMode;
  document.querySelectorAll(".mode").forEach((button) => button.classList.toggle("active", button.dataset.mode === mode));
  prompt.placeholder = mode === "agent" ? "tell Orbit what to do" : "ask about what is here";
}

async function loadConnectors() {
  try { renderConnectors(await window.orbit.connectors()); } catch { connectorRow.textContent = "connections unavailable"; }
}

function renderConnectors(connectors) {
  cloudConnected = Boolean(connectors.cloud);
  connectorRow.innerHTML = [["Cloud", "cloud", connectors.cloud], ["OpenAI", "openai", connectors.openai], ["Gmail", "gmail", connectors.gmail], ["Notion", "notion", connectors.notion]].map(([name, provider, connected]) => `<button class="connector ${connected ? "connected" : ""}" data-connector="${provider}" data-connected="${connected}"><i></i>${name}</button>`).join("");
  if (!connectors.secureStorage) hoverLine.textContent = "Secure system storage is unavailable, so connections cannot be saved.";
}

function toggleSettings() {
  if (connections.hidden) {
    connections.hidden = false;
    answer.hidden = true;
    window.orbit.setPointerMode(false);
    window.orbit.setFollow(false);
    setState("settings", 265);
    loadConnectors();
  } else closeSettings();
}

function closeSettings() {
  connections.hidden = true;
  connectorForm.hidden = true;
  selectedConnector = undefined;
  if (answer.hidden) enterPointerMode(); else setState("answer", 320);
}

function openConnectorForm(provider, connected) {
  selectedConnector = provider;
  connectorForm.hidden = false;
  connectorToken.value = "";
  cloudUrl.value = "";
  notionParent.value = "";
  const name = provider === "cloud" ? "Orbit Cloud" : provider === "openai" ? "OpenAI" : provider === "notion" ? "Notion" : "Gmail";
  connectorTitle.firstChild.textContent = `${connected ? "Manage" : "Connect"} ${name}`;
  connectorToken.placeholder = provider === "cloud" ? "pairing code" : provider === "openai" ? "sk-..." : "access token";
  if (provider === "notion" && cloudConnected && connected) connectorToken.placeholder = "leave blank to keep Cloud OAuth token";
  cloudUrlRow.hidden = provider !== "cloud";
  notionParentRow.hidden = provider !== "notion";
  oauthConnector.hidden = !(cloudConnected && ["gmail", "notion"].includes(provider));
  oauthConnector.textContent = `connect ${name} in browser`;
  disconnectConnector.hidden = !connected;
  setState("settings", provider === "notion" || provider === "cloud" ? 370 : 320);
  (provider === "cloud" ? cloudUrl : connectorToken).focus();
}

async function startSelectedOAuth() {
  if (!["gmail", "notion"].includes(selectedConnector)) return;
  oauthConnector.disabled = true;
  try {
    await window.orbit.startOAuth(selectedConnector);
    hoverLine.textContent = "Browser opened. Approve access there, then reopen this connector to finish its settings.";
  } catch (error) {
    hoverLine.textContent = error.message || "Orbit could not start the browser connection.";
  } finally {
    oauthConnector.disabled = false;
  }
}

async function saveSelectedConnector() {
  if (!selectedConnector) return;
  saveConnector.disabled = true;
  try {
    const status = await window.orbit.saveConnector({ provider: selectedConnector, token: connectorToken.value, parentPageId: notionParent.value, cloudUrl: cloudUrl.value });
    renderConnectors(status);
    if (selectedConnector === "openai") liveVoice = true;
    connectorForm.hidden = true;
    hoverLine.textContent = `${selectedConnector} connected.`;
    setState("settings", 265);
  } catch (error) {
    hoverLine.textContent = error.message || "Connection could not be saved.";
  } finally {
    saveConnector.disabled = false;
  }
}

async function disconnectSelectedConnector() {
  if (!selectedConnector) return;
  try {
    renderConnectors(await window.orbit.disconnectConnector(selectedConnector));
    if (selectedConnector === "openai") liveVoice = false;
    connectorForm.hidden = true;
    hoverLine.textContent = `${selectedConnector} disconnected.`;
    setState("settings", 265);
  } catch (error) {
    hoverLine.textContent = error.message || "Connection could not be removed.";
  }
}

async function submit() {
  const request = prompt.value.trim();
  if (!request) return prompt.focus();
  ask.disabled = true;
  voice.disabled = true;
  answer.hidden = true;
  connections.hidden = true;
  window.orbit.setPointerMode(false);
  hoverLine.textContent = mode === "agent" ? "On it. Building a safe plan..." : "On it. Looking at this screen...";
  setState("thinking", 164);
  try {
    const result = await window.orbit.ask({ request, mode });
    steps = result.steps || [];
    currentAgent = result.agent || undefined;
    presentAnswer(result);
  } catch (error) {
    hoverLine.textContent = error.message || "Orbit could not answer that.";
    setState("prompt", 164);
  } finally {
    ask.disabled = false;
    voice.disabled = false;
  }
}

function presentAnswer(result) {
  answer.hidden = false;
  answerMode.textContent = result.mode === "agent" ? "agent plan" : result.demo ? "orbit demo" : "orbit";
  answerText.textContent = result.text;
  agentAction.hidden = !currentAgent;
  if (currentAgent) {
    agentActionDetail.textContent = currentAgent.detail;
    approveAgent.textContent = currentAgent.approvalLabel;
    approveAgent.hidden = false;
  }
  hoverLine.textContent = result.mode === "agent" ? "Plan ready. Orbit has not changed anything." : "Answer ready. Ask Orbit to guide you through it.";
  window.orbit.setFollow(false);
  window.orbit.setPointerMode(false);
  setState("answer", currentAgent ? 390 : 320);
  if (result.mode === "coach") speak(result.text);
}

async function showGuide() {
  if (!steps.length) return;
  const shown = await window.orbit.draw({ steps });
  if (shown) hint.textContent = "Ctrl + Shift + G moves through the guide";
}

function resetToAsk() {
  answer.hidden = true;
  currentAgent = undefined;
  enterPointerMode();
}

async function runApprovedAgent() {
  if (!currentAgent) return;
  approveAgent.disabled = true;
  approveAgent.textContent = "running";
  try {
    const result = await window.orbit.approveAgent(currentAgent.id);
    agentActionDetail.textContent = result.message;
    approveAgent.hidden = true;
    if (result.url && /^https:\/\//.test(result.url)) {
      const link = document.createElement("a");
      link.href = result.url;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = " Open it";
      agentActionDetail.append(link);
    }
  } catch (error) {
    agentActionDetail.textContent = error.message || "Orbit could not run that action.";
    approveAgent.disabled = false;
    approveAgent.textContent = currentAgent.approvalLabel;
  }
}

async function startVoice() {
  if (activeRecorder?.state === "recording") { activeRecorder.stop(); return; }
  if (!liveVoice || !navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return startBrowserSpeechRecognition();
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"].find((type) => MediaRecorder.isTypeSupported(type));
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks = [];
    activeRecorder = recorder;
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      activeRecorder = undefined;
      voice.disabled = true;
      voice.textContent = "...";
      try {
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        handleSpoken(await window.orbit.transcribe({ base64: await blobToBase64(blob), mimeType: blob.type }));
      } catch (error) {
        hoverLine.textContent = error.message || "I couldn't transcribe that.";
      } finally {
        voice.disabled = false;
        voice.innerHTML = "&#9673;";
      }
    };
    recorder.start();
    voice.textContent = "stop";
    hoverLine.textContent = "Listening. Press the circle again when you finish.";
  } catch (error) {
    hoverLine.textContent = error.name === "NotAllowedError" ? "Microphone permission was denied." : "I couldn't start the microphone.";
  }
}

function startBrowserSpeechRecognition() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) { hoverLine.textContent = "Connect OpenAI to use voice, or type your question."; return; }
  const recognition = new Recognition();
  recognition.lang = navigator.language || "en-US";
  recognition.interimResults = false;
  voice.textContent = "...";
  recognition.onresult = (event) => handleSpoken(event.results[0][0].transcript);
  recognition.onerror = () => { hoverLine.textContent = "I didn't catch that. Try again."; };
  recognition.onend = () => { voice.innerHTML = "&#9673;"; };
  recognition.start();
}

function handleSpoken(spoken) {
  if (/^(orbit|hey\s*orbit|hey\s*clicky)\s+agent/i.test(spoken)) {
    setMode("agent");
    prompt.value = spoken.replace(/^(orbit|hey\s*orbit|hey\s*clicky)\s+agent[:,]?\s*/i, "");
  } else prompt.value = spoken;
  submit();
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(String(text));
  utterance.rate = 1.05;
  window.speechSynthesis.speak(utterance);
}
